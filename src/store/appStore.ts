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
  
  // 無効な章参照をクリーンアップ（削除された章のIDを受け取る）
  cleanupInvalidChapterReferences: (deletedChapterIds?: string[]) => void;
  
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

      // 削除される章のIDを特定
      let deletedChapterIds: string[] = [];
      if (updates.chapters) {
        const currentChapterIds = currentBook.chapters.map(ch => ch.id);
        const newChapterNames = updates.chapters.map(ch => ch.name);
        const currentChapterNames = currentBook.chapters.map(ch => ch.name);
        
        // 名前が変更または削除された章を特定
        deletedChapterIds = currentBook.chapters
          .filter(ch => !newChapterNames.includes(ch.name))
          .map(ch => ch.id);
      }

      if (updates.name) {
        const { error: bookError } = await updateBook(id, updates.name);
        if (bookError) throw bookError;
      }

      if (updates.chapters) {
        // 既存の章を削除
        await deleteChapters(id);
        
        // 新しい章を作成
        const chaptersData = updates.chapters.map((chapter, index) => ({
          name: chapter.name,
          order_index: index + 1,
        }));

        const { data: chaptersResult, error: chaptersError } = await createChapters(id, chaptersData);
        if (chaptersError) throw chaptersError;

        // ローカル状態を更新
        set((state) => ({
          books: state.books.map((book) =>
            book.id === id 
              ? { 
                  ...book, 
                  ...updates,
                  chapters: (chaptersResult || []).map((chapter: any) => ({
                    id: chapter.id,
                    bookId: chapter.book_id,
                    name: chapter.name,
                    order: chapter.order_index,
                    isCompleted: chapter.is_completed,
                    completedDate: null,
                  })),
                  updatedAt: new Date() 
                } 
              : book
          ),
          isLoading: false,
        }));

        // 削除された章のみをクリーンアップ
        if (deletedChapterIds.length > 0) {
          get().cleanupInvalidChapterReferences(deletedChapterIds);
        }
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
      // 削除される書籍の章IDを取得
      const bookToDelete = get().books.find(book => book.id === id);
      const deletedChapterIds = bookToDelete ? bookToDelete.chapters.map(ch => ch.id) : [];

      const { error } = await deleteBook(id);
      if (error) throw error;

      set((state) => ({
        books: state.books.filter((book) => book.id !== id),
        isLoading: false,
      }));

      // 削除された章のみをクリーンアップ
      if (deletedChapterIds.length > 0) {
        get().cleanupInvalidChapterReferences(deletedChapterIds);
      }
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

  cleanupInvalidChapterReferences: (deletedChapterIds) => {
    const { books, dailyRecords, persistentChapterSelections } = get();
    
    // 削除された章のIDセットを作成
    const deletedChapterIdSet = new Set(deletedChapterIds || []);
    
    // 現在存在する章のIDセットを作成
    const validChapterIds = new Set<string>();
    const validBookIds = new Set<string>();
    books.forEach(book => {
      validBookIds.add(book.id);
      book.chapters.forEach(chapter => {
        validChapterIds.add(chapter.id);
      });
    });
    
    // 日次記録から削除された章の参照のみを削除
    const cleanedDailyRecords = dailyRecords.map(record => ({
      ...record,
      studyProgress: record.studyProgress.filter(progress => {
        // 削除された章は除外、それ以外の有効な章は保持
        if (deletedChapterIds && deletedChapterIdSet.has(progress.chapterId)) {
          return false;
        }
        return validBookIds.has(progress.bookId) && validChapterIds.has(progress.chapterId);
      })
    }));
    
    // 永続化された章選択から削除された章の参照のみを削除
    const cleanedPersistentSelections = new Map<string, Array<{ bookId: string; chapterIds: string[] }>>();
    persistentChapterSelections.forEach((selections, date) => {
      const validSelections = selections
        .filter(selection => validBookIds.has(selection.bookId))
        .map(selection => ({
          bookId: selection.bookId,
          chapterIds: selection.chapterIds.filter(chapterId => {
            // 削除された章は除外、それ以外の有効な章は保持
            if (deletedChapterIds && deletedChapterIdSet.has(chapterId)) {
              return false;
            }
            return validChapterIds.has(chapterId);
          })
        }))
        .filter(selection => selection.chapterIds.length > 0);
      
      if (validSelections.length > 0) {
        cleanedPersistentSelections.set(date, validSelections);
      }
    });
    
    set({
      dailyRecords: cleanedDailyRecords,
      persistentChapterSelections: cleanedPersistentSelections
    });
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

      // 初期データ読み込み後に全体的なクリーンアップを実行（削除された章IDは指定しない）
      get().cleanupInvalidChapterReferences();

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