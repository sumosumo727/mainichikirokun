import { create } from 'zustand';
import type { Book, DailyRecord, MonthlyStats, Chapter } from '../types';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, subMonths, getDaysInMonth } from 'date-fns';
import { 
  getBooks, 
  createBook, 
  updateBook, 
  deleteBook,
  createChapters,
  updateChapter,
  deleteChapters,
  deleteMultipleChapters,
  deleteStudyProgressByChapterIds,
  getDailyRecords,
  upsertDailyRecord,
  createStudyProgress,
  deleteStudyProgress
} from '../lib/supabase';

interface AppState {
  books: Book[];
  dailyRecords: DailyRecord[];
  currentDate: Date;
  selectedDate: Date | null;
  showDailyModal: boolean;
  monthlyStats: MonthlyStats | null;
  chartData: Array<{ month: string; running: number; strength: number; study: number; }>;
  trainingDistribution: { running: number; strength: number; };
  isLoading: boolean;
  
  // 章選択の永続化用
  persistentChapterSelections: Map<string, Array<{ bookId: string; chapterIds: string[] }>>;
  
  // Actions
  setBooks: (books: Book[]) => void;
  addBook: (book: Omit<Book, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateBookData: (id: string, updates: Partial<Book>) => Promise<void>;
  deleteBookData: (id: string) => Promise<void>;
  
  setDailyRecords: (records: DailyRecord[]) => void;
  addDailyRecord: (record: Omit<DailyRecord, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateDailyRecord: (id: string, updates: Partial<DailyRecord>) => Promise<void>;
  
  setCurrentDate: (date: Date) => void;
  setSelectedDate: (date: Date | null) => void;
  setShowDailyModal: (show: boolean) => void;
  
  calculateMonthlyStats: (month: Date) => void;
  calculateChartData: () => void;
  calculateTrainingDistribution: () => void;
  
  // 新機能: 章の完了状態を更新
  updateChapterCompletion: (bookId: string, chapterId: string, isCompleted: boolean, completedDate?: string) => void;
  
  // 新機能: 選択済み章を取得
  getSelectedChapters: () => Set<string>;
  
  // 新機能: 章の完了日を取得
  getChapterCompletionDate: (chapterId: string) => string | null;
  
  // 章選択の永続化機能
  savePersistentChapterSelection: (date: string, selections: Array<{ bookId: string; chapterIds: string[] }>) => void;
  getPersistentChapterSelection: (date: string) => Array<{ bookId: string; chapterIds: string[] }>;
  clearPersistentChapterSelection: (date: string) => void;
  
  // 削除された章の名前に基づいてクリーンアップ
  cleanupInvalidChapterReferencesByName: (bookId: string, deletedChapterNames: string[]) => void;
  
  // Data fetching
  loadInitialData: (userId: string) => Promise<void>;
}

// データ変換ヘルパー関数
const transformSupabaseBookToBook = (supabaseBook: any): Book => {
  return {
    id: supabaseBook.id,
    userId: supabaseBook.user_id,
    name: supabaseBook.name,
    chapters: (supabaseBook.chapters || []).map((chapter: any) => ({
      id: chapter.id,
      bookId: chapter.book_id,
      name: chapter.name,
      order: chapter.order_index,
      isCompleted: chapter.is_completed,
      completedDate: null, // これは後でstudy_progressから計算
    })),
    createdAt: new Date(supabaseBook.created_at),
    updatedAt: new Date(supabaseBook.updated_at),
  };
};

const transformSupabaseDailyRecordToDailyRecord = (supabaseRecord: any): DailyRecord => {
  return {
    id: supabaseRecord.id,
    userId: supabaseRecord.user_id,
    date: supabaseRecord.record_date,
    training: {
      running: supabaseRecord.running,
      strength: supabaseRecord.strength_training,
    },
    studyProgress: (supabaseRecord.study_progress || []).map((progress: any) => ({
      bookId: progress.book_id,
      chapterId: progress.chapter_id,
      bookName: progress.book_name,
      chapterName: progress.chapter_name,
    })),
    createdAt: new Date(supabaseRecord.created_at),
    updatedAt: new Date(supabaseRecord.updated_at),
  };
};

export const useAppStore = create<AppState>()((set, get) => ({
  books: [],
  dailyRecords: [],
  currentDate: new Date(),
  selectedDate: null,
  showDailyModal: false,
  monthlyStats: null,
  chartData: [],
  trainingDistribution: { running: 0, strength: 0 },
  isLoading: false,
  persistentChapterSelections: new Map(),

  setBooks: (books) => set({ books }),
  
  addBook: async (bookData) => {
    set({ isLoading: true });
    try {
      // 書籍を作成
      const { data: bookResult, error: bookError } = await createBook(bookData.userId, bookData.name);
      
      if (bookError) throw bookError;
      if (!bookResult) throw new Error('書籍の作成に失敗しました');

      // 章を作成
      const chaptersData = bookData.chapters.map((chapter, index) => ({
        name: chapter.name,
        order_index: index + 1,
      }));

      const { data: chaptersResult, error: chaptersError } = await createChapters(bookResult.id, chaptersData);
      
      if (chaptersError) throw chaptersError;

      // ローカル状態を更新
      const newBook: Book = {
        id: bookResult.id,
        userId: bookResult.user_id,
        name: bookResult.name,
        chapters: (chaptersResult || []).map((chapter: any) => ({
          id: chapter.id,
          bookId: chapter.book_id,
          name: chapter.name,
          order: chapter.order_index,
          isCompleted: chapter.is_completed,
          completedDate: null,
        })),
        createdAt: new Date(bookResult.created_at),
        updatedAt: new Date(bookResult.updated_at),
      };

      set((state) => ({ 
        books: [...state.books, newBook],
        isLoading: false 
      }));
    } catch (error) {
      console.error('書籍追加エラー:', error);
      set({ isLoading: false });
      throw error;
    }
  },

  updateBookData: async (id, updates) => {
    set({ isLoading: true });
    try {
      const currentBook = get().books.find(book => book.id === id);
      if (!currentBook) {
        throw new Error('書籍が見つかりません');
      }

      console.log('書籍更新開始:', { bookId: id, updates });

      // 書籍名の更新
      if (updates.name) {
        const { error: bookError } = await updateBook(id, updates.name);
        if (bookError) throw bookError;
      }

      // 章の更新処理
      if (updates.chapters) {
        console.log('章の更新開始');
        
        // 現在の章と新しい章を比較
        const currentChapters = currentBook.chapters;
        const newChapters = updates.chapters;
        
        console.log('現在の章:', currentChapters.map(ch => ({ id: ch.id, name: ch.name })));
        console.log('新しい章:', newChapters.map(ch => ch.name));
        
        // 章名をキーとしたマップを作成
        const currentChapterMap = new Map(currentChapters.map(ch => [ch.name, ch]));
        const newChapterMap = new Map(newChapters.map(ch => [ch.name, ch]));
        
        // 削除される章を特定
        const deletedChapters = currentChapters.filter(ch => !newChapterMap.has(ch.name));
        const deletedChapterNames = deletedChapters.map(ch => ch.name);
        const deletedChapterIds = deletedChapters.map(ch => ch.id);
        
        console.log('削除される章:', deletedChapters.map(ch => ({ id: ch.id, name: ch.name })));
        
        // 保持される章を特定
        const preservedChapters = currentChapters.filter(ch => newChapterMap.has(ch.name));
        
        // 新しく追加される章を特定
        const addedChapters = newChapters.filter(ch => !currentChapterMap.has(ch.name));
        
        console.log('保持される章:', preservedChapters.map(ch => ({ id: ch.id, name: ch.name })));
        console.log('追加される章:', addedChapters.map(ch => ch.name));
        
        // 1. 削除される章のstudy_progressレコードを先に削除
        if (deletedChapterIds.length > 0) {
          console.log('study_progressレコードを削除中:', deletedChapterIds);
          const { error: studyProgressError } = await deleteStudyProgressByChapterIds(deletedChapterIds);
          if (studyProgressError) {
            console.error('study_progress削除エラー:', studyProgressError);
            throw studyProgressError;
          }
        }
        
        // 2. 削除される章をデータベースから削除
        if (deletedChapterIds.length > 0) {
          console.log('章をデータベースから削除中:', deletedChapterIds);
          const { error: deleteError } = await deleteMultipleChapters(deletedChapterIds);
          if (deleteError) {
            console.error('章削除エラー:', deleteError);
            throw deleteError;
          }
        }
        
        // 3. 新しい章を追加
        let newChapterResults: any[] = [];
        if (addedChapters.length > 0) {
          console.log('新しい章を追加中:', addedChapters.map(ch => ch.name));
          const chaptersData = addedChapters.map((chapter, index) => ({
            name: chapter.name,
            order_index: preservedChapters.length + index + 1,
          }));

          const { data: chaptersResult, error: chaptersError } = await createChapters(id, chaptersData);
          if (chaptersError) {
            console.error('章追加エラー:', chaptersError);
            throw chaptersError;
          }
          newChapterResults = chaptersResult || [];
          console.log('追加された章:', newChapterResults.map((ch: any) => ({ id: ch.id, name: ch.name })));
        }
        
        // 4. 保持される章の順序を更新（必要に応じて）
        for (let i = 0; i < preservedChapters.length; i++) {
          const chapter = preservedChapters[i];
          const newOrder = i + 1;
          if (chapter.order !== newOrder) {
            console.log(`章の順序を更新: ${chapter.name} (${chapter.order} -> ${newOrder})`);
            // 順序更新のAPIが必要な場合はここで実装
          }
        }
        
        // 5. 最終的な章リストを構築
        const finalChapters = [
          // 保持される章（既存のIDを維持）
          ...preservedChapters.map((chapter, index) => ({
            ...chapter,
            order: index + 1,
          })),
          // 新しく追加された章
          ...newChapterResults.map((chapter: any, index) => ({
            id: chapter.id,
            bookId: chapter.book_id,
            name: chapter.name,
            order: preservedChapters.length + index + 1,
            isCompleted: chapter.is_completed,
            completedDate: null,
          }))
        ];
        
        console.log('最終的な章リスト:', finalChapters.map(ch => ({ id: ch.id, name: ch.name })));
        
        // 6. ローカル状態を更新
        set((state) => ({
          books: state.books.map((book) =>
            book.id === id 
              ? { 
                  ...book, 
                  name: updates.name || book.name,
                  chapters: finalChapters,
                  updatedAt: new Date() 
                } 
              : book
          ),
          isLoading: false,
        }));

        // 7. 削除された章の名前に基づいてクリーンアップ（永続化選択とdaily_recordsから）
        if (deletedChapterNames.length > 0) {
          console.log('クリーンアップ実行:', deletedChapterNames);
          get().cleanupInvalidChapterReferencesByName(id, deletedChapterNames);
        }
        
        console.log('章の更新完了');
      } else {
        // 章の更新がない場合は、書籍名のみ更新
        set((state) => ({
          books: state.books.map((book) =>
            book.id === id ? { ...book, ...updates, updatedAt: new Date() } : book
          ),
          isLoading: false,
        }));
      }
    } catch (error) {
      console.error('書籍更新エラー:', error);
      set({ isLoading: false });
      throw error;
    }
  },

  deleteBookData: async (id) => {
    set({ isLoading: true });
    try {
      const { error } = await deleteBook(id);
      if (error) throw error;

      set((state) => ({
        books: state.books.filter((book) => book.id !== id),
        isLoading: false,
      }));

      // 書籍全体が削除された場合のクリーンアップ
      get().cleanupInvalidChapterReferencesByName(id, []);
    } catch (error) {
      console.error('書籍削除エラー:', error);
      set({ isLoading: false });
      throw error;
    }
  },

  setDailyRecords: (records) => set({ dailyRecords: records }),
  
  addDailyRecord: async (recordData) => {
    set({ isLoading: true });
    try {
      // Daily recordを作成/更新
      const { data: dailyRecord, error: recordError } = await upsertDailyRecord(
        recordData.userId,
        {
          record_date: recordData.date,
          running: recordData.training.running,
          strength_training: recordData.training.strength,
        }
      );

      if (recordError) throw recordError;
      if (!dailyRecord) throw new Error('日次記録の作成に失敗しました');

      // 既存のstudy progressを削除
      await deleteStudyProgress(dailyRecord.id);

      // 新しいstudy progressを作成
      if (recordData.studyProgress.length > 0) {
        const studyData = recordData.studyProgress.map(progress => ({
          book_id: progress.bookId,
          chapter_id: progress.chapterId,
          book_name: progress.bookName,
          chapter_name: progress.chapterName,
        }));

        const { error: studyError } = await createStudyProgress(dailyRecord.id, studyData);
        if (studyError) throw studyError;
      }

      // ローカル状態を更新
      const newRecord: DailyRecord = {
        id: dailyRecord.id,
        userId: dailyRecord.user_id,
        date: dailyRecord.record_date,
        training: {
          running: dailyRecord.running,
          strength: dailyRecord.strength_training,
        },
        studyProgress: recordData.studyProgress,
        createdAt: new Date(dailyRecord.created_at),
        updatedAt: new Date(dailyRecord.updated_at),
      };

      // 章の完了状態を更新
      recordData.studyProgress.forEach(progress => {
        get().updateChapterCompletion(progress.bookId, progress.chapterId, true, recordData.date);
      });

      // 永続化された章選択をクリア（保存が完了したため）
      get().clearPersistentChapterSelection(recordData.date);

      set((state) => {
        const existingIndex = state.dailyRecords.findIndex(r => r.date === recordData.date);
        if (existingIndex >= 0) {
          // 既存の記録を更新
          const updatedRecords = [...state.dailyRecords];
          updatedRecords[existingIndex] = newRecord;
          return { dailyRecords: updatedRecords, isLoading: false };
        } else {
          // 新しい記録を追加
          return { dailyRecords: [...state.dailyRecords, newRecord], isLoading: false };
        }
      });

      // 統計データを再計算
      get().calculateChartData();
      get().calculateMonthlyStats(new Date());
      get().calculateTrainingDistribution();
    } catch (error) {
      console.error('日次記録追加エラー:', error);
      set({ isLoading: false });
      throw error;
    }
  },

  updateDailyRecord: async (id, updates) => {
    // addDailyRecordと同じロジックを使用（upsertのため）
    const state = get();
    const existingRecord = state.dailyRecords.find(r => r.id === id);
    
    if (existingRecord) {
      const updatedRecord = { ...existingRecord, ...updates };
      await get().addDailyRecord({
        userId: updatedRecord.userId,
        date: updatedRecord.date,
        training: updatedRecord.training,
        studyProgress: updatedRecord.studyProgress,
      });
    }
  },

  setCurrentDate: (date) => set({ currentDate: date }),
  setSelectedDate: (date) => set({ selectedDate: date }),
  setShowDailyModal: (show) => set({ showDailyModal: show }),

  updateChapterCompletion: (bookId, chapterId, isCompleted, completedDate) => {
    set((state) => ({
      books: state.books.map((book) =>
        book.id === bookId
          ? {
              ...book,
              chapters: book.chapters.map((chapter) =>
                chapter.id === chapterId
                  ? { 
                      ...chapter, 
                      isCompleted,
                      completedDate: isCompleted ? completedDate || null : null
                    }
                  : chapter
              ),
              updatedAt: new Date(),
            }
          : book
      ),
    }));
  },

  getSelectedChapters: () => {
    const { dailyRecords, books } = get();
    const selectedChapters = new Set<string>();
    
    // 現在存在する章のIDセットを作成
    const validChapterIds = new Set<string>();
    books.forEach(book => {
      book.chapters.forEach(chapter => {
        validChapterIds.add(chapter.id);
      });
    });
    
    // 有効な章のみを選択済みとして扱う
    dailyRecords.forEach(record => {
      record.studyProgress.forEach(progress => {
        if (validChapterIds.has(progress.chapterId)) {
          selectedChapters.add(progress.chapterId);
        }
      });
    });
    
    return selectedChapters;
  },

  getChapterCompletionDate: (chapterId) => {
    const { dailyRecords } = get();
    
    for (const record of dailyRecords) {
      const progress = record.studyProgress.find(p => p.chapterId === chapterId);
      if (progress) {
        return record.date;
      }
    }
    
    return null;
  },

  // 章選択の永続化機能
  savePersistentChapterSelection: (date, selections) => {
    const { books } = get();
    
    // 現在存在する章のIDセットを作成
    const validChapterIds = new Set<string>();
    const validBookIds = new Set<string>();
    books.forEach(book => {
      validBookIds.add(book.id);
      book.chapters.forEach(chapter => {
        validChapterIds.add(chapter.id);
      });
    });
    
    // 有効な章のみをフィルタリング
    const validSelections = selections
      .filter(selection => validBookIds.has(selection.bookId))
      .map(selection => ({
        bookId: selection.bookId,
        chapterIds: selection.chapterIds.filter(chapterId => validChapterIds.has(chapterId))
      }))
      .filter(selection => selection.chapterIds.length > 0);
    
    set((state) => {
      const newMap = new Map(state.persistentChapterSelections);
      if (validSelections.length > 0) {
        newMap.set(date, validSelections);
      } else {
        newMap.delete(date);
      }
      return { persistentChapterSelections: newMap };
    });
  },

  getPersistentChapterSelection: (date) => {
    const { persistentChapterSelections, books } = get();
    const selections = persistentChapterSelections.get(date) || [];
    
    // 現在存在する章のIDセットを作成
    const validChapterIds = new Set<string>();
    const validBookIds = new Set<string>();
    books.forEach(book => {
      validBookIds.add(book.id);
      book.chapters.forEach(chapter => {
        validChapterIds.add(chapter.id);
      });
    });
    
    // 有効な章のみをフィルタリング
    return selections
      .filter(selection => validBookIds.has(selection.bookId))
      .map(selection => ({
        bookId: selection.bookId,
        chapterIds: selection.chapterIds.filter(chapterId => validChapterIds.has(chapterId))
      }))
      .filter(selection => selection.chapterIds.length > 0);
  },

  clearPersistentChapterSelection: (date) => {
    set((state) => {
      const newMap = new Map(state.persistentChapterSelections);
      newMap.delete(date);
      return { persistentChapterSelections: newMap };
    });
  },

  cleanupInvalidChapterReferencesByName: (bookId, deletedChapterNames) => {
    const { books, dailyRecords, persistentChapterSelections } = get();
    
    console.log(`クリーンアップ開始: 書籍ID=${bookId}, 削除された章名=`, deletedChapterNames);
    
    // 削除された章の名前セットを作成
    const deletedChapterNameSet = new Set(deletedChapterNames);
    
    // 日次記録から削除された章の参照を削除
    const cleanedDailyRecords = dailyRecords.map(record => ({
      ...record,
      studyProgress: record.studyProgress.filter(progress => {
        // 対象の書籍で、削除された章名の場合は除外
        if (progress.bookId === bookId && deletedChapterNameSet.has(progress.chapterName)) {
          console.log(`日次記録から削除: ${progress.chapterName} (${progress.chapterId})`);
          return false;
        }
        return true;
      })
    }));
    
    // 永続化された章選択から削除された章の参照を削除（改善版）
    const cleanedPersistentSelections = new Map<string, Array<{ bookId: string; chapterIds: string[] }>>();
    persistentChapterSelections.forEach((selections, date) => {
      const validSelections = selections.map(selection => {
        if (selection.bookId === bookId) {
          // 対象の書籍の場合、削除された章名に対応するIDを除外
          const book = books.find(b => b.id === bookId);
          if (book) {
            // 現在の書籍の章から、削除されていない章のIDのみを保持
            const validChapterIds = selection.chapterIds.filter(chapterId => {
              // 新しい章リストから該当するIDの章を探す
              const chapter = book.chapters.find(ch => ch.id === chapterId);
              if (chapter) {
                // 章が見つかった場合、その章名が削除対象でなければ保持
                if (!deletedChapterNameSet.has(chapter.name)) {
                  return true;
                }
              }
              
              // 章が見つからない、または削除対象の章名の場合は除外
              console.log(`永続化選択から削除: 章ID=${chapterId}`);
              return false;
            });
            
            return { ...selection, chapterIds: validChapterIds };
          }
        }
        return selection;
      }).filter(selection => selection.chapterIds.length > 0);
      
      if (validSelections.length > 0) {
        cleanedPersistentSelections.set(date, validSelections);
      }
    });
    
    set({
      dailyRecords: cleanedDailyRecords,
      persistentChapterSelections: cleanedPersistentSelections
    });
    
    console.log('クリーンアップ完了');
  },

  calculateMonthlyStats: (month) => {
    const { dailyRecords } = get();
    const monthStart = startOfMonth(month);
    const monthEnd = endOfMonth(month);
    const daysInMonth = getDaysInMonth(month);
    
    const monthRecords = dailyRecords.filter((record) => {
      const recordDate = new Date(record.date);
      return recordDate >= monthStart && recordDate <= monthEnd;
    });

    const runningDays = monthRecords.filter((r) => r.training.running).length;
    const strengthDays = monthRecords.filter((r) => r.training.strength).length;
    const studyDays = monthRecords.filter((r) => r.studyProgress.length > 0).length;
    const totalTrainingDays = monthRecords.filter((r) => r.training.running || r.training.strength).length;
    const trainingRate = (totalTrainingDays / daysInMonth) * 100;

    const stats: MonthlyStats = {
      month: format(month, 'yyyy-MM'),
      trainingRate,
      trainingBreakdown: {
        runningDays,
        strengthDays,
        totalTrainingDays,
      },
      bookProgress: [], // TODO: Calculate book progress
    };

    set({ monthlyStats: stats });
  },

  calculateChartData: () => {
    const { dailyRecords } = get();
    const now = new Date();
    const chartData = [];

    // 過去6ヶ月のデータを計算
    for (let i = 5; i >= 0; i--) {
      const targetMonth = subMonths(now, i);
      const monthStart = startOfMonth(targetMonth);
      const monthEnd = endOfMonth(targetMonth);
      
      const monthRecords = dailyRecords.filter((record) => {
        const recordDate = new Date(record.date);
        return recordDate >= monthStart && recordDate <= monthEnd;
      });

      const runningDays = monthRecords.filter((r) => r.training.running).length;
      const strengthDays = monthRecords.filter((r) => r.training.strength).length;
      const studyDays = monthRecords.filter((r) => r.studyProgress.length > 0).length;

      chartData.push({
        month: format(targetMonth, 'yyyy/MM'),
        running: runningDays,
        strength: strengthDays,
        study: studyDays,
      });
    }

    set({ chartData });
  },

  calculateTrainingDistribution: () => {
    const { dailyRecords } = get();
    const now = new Date();
    const monthStart = startOfMonth(now);
    const monthEnd = endOfMonth(now);
    
    const monthRecords = dailyRecords.filter((record) => {
      const recordDate = new Date(record.date);
      return recordDate >= monthStart && recordDate <= monthEnd;
    });

    const runningDays = monthRecords.filter((r) => r.training.running).length;
    const strengthDays = monthRecords.filter((r) => r.training.strength).length;
    const totalTrainingDays = runningDays + strengthDays;

    if (totalTrainingDays === 0) {
      set({ trainingDistribution: { running: 0, strength: 0 } });
      return;
    }

    const runningPercentage = (runningDays / totalTrainingDays) * 100;
    const strengthPercentage = (strengthDays / totalTrainingDays) * 100;

    set({ 
      trainingDistribution: { 
        running: Math.round(runningPercentage * 10) / 10, // 小数点1桁
        strength: Math.round(strengthPercentage * 10) / 10 
      } 
    });
  },

  loadInitialData: async (userId: string) => {
    set({ isLoading: true });
    try {
      // 書籍データを取得
      const { data: booksData, error: booksError } = await getBooks(userId);
      if (booksError) throw booksError;

      // 日次記録データを取得
      const { data: recordsData, error: recordsError } = await getDailyRecords(userId);
      if (recordsError) throw recordsError;

      // データを変換
      const books = (booksData || []).map(transformSupabaseBookToBook);
      const dailyRecords = (recordsData || []).map(transformSupabaseDailyRecordToDailyRecord);

      set({ 
        books, 
        dailyRecords,
        isLoading: false 
      });

      // 章の完了状態を同期
      const state = get();
      state.dailyRecords.forEach(record => {
        record.studyProgress.forEach(progress => {
          get().updateChapterCompletion(progress.bookId, progress.chapterId, true, record.date);
        });
      });

      // 統計データを計算
      get().calculateChartData();
      get().calculateMonthlyStats(new Date());
      get().calculateTrainingDistribution();
    } catch (error) {
      console.error('初期データ読み込みエラー:', error);
      set({ isLoading: false });
      throw error;
    }
  },
}));