import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { Save, CheckCircle, X } from 'lucide-react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { useAppStore } from '../../store/appStore';
import { useAuthStore } from '../../store/authStore';
import type { DailyRecord } from '../../types';

export const DailyModal: React.FC = () => {
  const { 
    selectedDate, 
    showDailyModal, 
    setShowDailyModal, 
    dailyRecords, 
    healthData,
    books, 
    addDailyRecord, 
    updateDailyRecord,
    addHealthData,
    updateHealthData,
    getSelectedChapters,
    isLoading,
    savePersistentChapterSelection,
    getPersistentChapterSelection,
    clearPersistentChapterSelection
  } = useAppStore();
  
  const { user } = useAuthStore();

  const [training, setTraining] = useState({
    running: false,
    strength: false,
  });

  const [healthMetrics, setHealthMetrics] = useState({
    weight: '',
    bodyFatPercentage: '',
  });

  const [selectedBooks, setSelectedBooks] = useState<Array<{
    bookId: string;
    chapterIds: string[];
  }>>([]);

  // 選択済み章のセットを取得
  const selectedChapters = getSelectedChapters();

  useEffect(() => {
    if (selectedDate) {
      const dateString = format(selectedDate, 'yyyy-MM-dd');
      const existingRecord = dailyRecords.find(
        record => record.date === dateString
      );
      const existingHealth = healthData.find(
        health => health.date === dateString
      );

      if (existingRecord) {
        setTraining(existingRecord.training);
        
        // Group study progress by book
        const bookGroups = existingRecord.studyProgress.reduce((acc, progress) => {
          const existing = acc.find(item => item.bookId === progress.bookId);
          if (existing) {
            existing.chapterIds.push(progress.chapterId);
          } else {
            acc.push({
              bookId: progress.bookId,
              chapterIds: [progress.chapterId],
            });
          }
          return acc;
        }, [] as Array<{ bookId: string; chapterIds: string[] }>);
        
        setSelectedBooks(bookGroups);
      } else {
        // 既存の記録がない場合、永続化された選択状態を復元
        const persistentSelection = getPersistentChapterSelection(dateString);
        if (persistentSelection.length > 0) {
          setSelectedBooks(persistentSelection);
        } else {
          setSelectedBooks([]);
        }
        setTraining({ running: false, strength: false });
      }

      // 体重・体脂肪率データの設定
      if (existingHealth) {
        setHealthMetrics({
          weight: existingHealth.weight?.toString() || '',
          bodyFatPercentage: existingHealth.bodyFatPercentage?.toString() || '',
        });
      } else {
        setHealthMetrics({
          weight: '',
          bodyFatPercentage: '',
        });
      }
    }
  }, [selectedDate, dailyRecords, healthData, getPersistentChapterSelection]);

  // 章選択が変更されたときに永続化
  useEffect(() => {
    if (selectedDate && selectedBooks.length > 0) {
      const dateString = format(selectedDate, 'yyyy-MM-dd');
      const existingRecord = dailyRecords.find(record => record.date === dateString);
      
      // 既存の記録がない場合のみ永続化（編集中の状態を保存）
      if (!existingRecord) {
        savePersistentChapterSelection(dateString, selectedBooks);
      }
    }
  }, [selectedBooks, selectedDate, dailyRecords, savePersistentChapterSelection]);

  const handleTrainingChange = (type: 'running' | 'strength') => {
    setTraining(prev => ({ ...prev, [type]: !prev[type] }));
  };

  const handleHealthMetricsChange = (field: 'weight' | 'bodyFatPercentage', value: string) => {
    // 数値と小数点のみを許可
    if (value === '' || /^\d*\.?\d*$/.test(value)) {
      setHealthMetrics(prev => ({ ...prev, [field]: value }));
    }
  };

  const handleBookSelect = (bookId: string) => {
    const book = books.find(b => b.id === bookId);
    if (!book) return;

    const existingBookIndex = selectedBooks.findIndex(sb => sb.bookId === bookId);
    
    if (existingBookIndex >= 0) {
      // Remove book
      setSelectedBooks(prev => prev.filter((_, index) => index !== existingBookIndex));
    } else {
      // Add book with no chapters selected
      setSelectedBooks(prev => [...prev, { bookId, chapterIds: [] }]);
    }
  };

  const handleChapterSelect = (bookId: string, chapterId: string) => {
    setSelectedBooks(prev => 
      prev.map(sb => {
        if (sb.bookId === bookId) {
          const isSelected = sb.chapterIds.includes(chapterId);
          return {
            ...sb,
            chapterIds: isSelected 
              ? sb.chapterIds.filter(id => id !== chapterId)
              : [...sb.chapterIds, chapterId]
          };
        }
        return sb;
      })
    );
  };

  const handleSave = async () => {
    if (!selectedDate || !user) return;

    const dateString = format(selectedDate, 'yyyy-MM-dd');
    const existingRecord = dailyRecords.find(record => record.date === dateString);
    const existingHealth = healthData.find(health => health.date === dateString);

    try {
      // Build study progress
      const studyProgress = selectedBooks.flatMap(sb => {
        const book = books.find(b => b.id === sb.bookId);
        if (!book) return [];
        
        return sb.chapterIds.map(chapterId => {
          const chapter = book.chapters.find(c => c.id === chapterId);
          return {
            bookId: sb.bookId,
            chapterId,
            bookName: book.name,
            chapterName: chapter?.name || '',
          };
        });
      });

      // Save daily record
      const recordData = {
        userId: user.id,
        date: dateString,
        training,
        studyProgress,
      };

      if (existingRecord) {
        await updateDailyRecord(existingRecord.id, recordData);
      } else {
        await addDailyRecord(recordData);
      }

      // Save health data if provided
      const weight = healthMetrics.weight ? parseFloat(healthMetrics.weight) : undefined;
      const bodyFatPercentage = healthMetrics.bodyFatPercentage ? parseFloat(healthMetrics.bodyFatPercentage) : undefined;

      if (weight !== undefined || bodyFatPercentage !== undefined) {
        const healthDataToSave = {
          userId: user.id,
          date: dateString,
          weight,
          bodyFatPercentage,
        };

        if (existingHealth) {
          await updateHealthData(existingHealth.id, healthDataToSave);
        } else {
          await addHealthData(healthDataToSave);
        }
      }

      setShowDailyModal(false);
    } catch (error) {
      console.error('記録保存エラー:', error);
      alert('記録の保存に失敗しました。もう一度お試しください。');
    }
  };

  const handleModalClose = () => {
    setShowDailyModal(false);
    // モーダルを閉じるときは永続化された選択状態をクリアしない
    // （ユーザーが再度開いたときに状態を復元するため）
  };

  // 書籍が完全に完了しているかチェック
  const isBookCompleted = (book: any) => {
    return book.chapters.every((chapter: any) => selectedChapters.has(chapter.id));
  };

  // 利用可能な章をフィルタリング（選択済みを除外）
  const getAvailableChapters = (book: any) => {
    const currentSelectedChapters = selectedBooks.find(sb => sb.bookId === book.id)?.chapterIds || [];
    
    return book.chapters.filter((chapter: any) => {
      // 現在選択中の章は表示
      if (currentSelectedChapters.includes(chapter.id)) {
        return true;
      }
      // 他の日に選択済みの章は非表示
      return !selectedChapters.has(chapter.id);
    });
  };

  if (!selectedDate || !showDailyModal) return null;

  // 選択可能な書籍をフィルタリング（完了していない書籍のみ）
  const availableBooks = books.filter(book => {
    const selectedBook = selectedBooks.find(sb => sb.bookId === book.id);
    // 現在選択中の書籍は表示
    if (selectedBook) return true;
    // 完了していない書籍のみ表示
    return !isBookCompleted(book);
  });

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div className="flex min-h-screen items-center justify-center p-2 sm:p-4">
        <div 
          className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
          onClick={handleModalClose}
        />
        
        {/* モーダルコンテナ - スマホでは90%x80%、デスクトップでは通常サイズ */}
        <div className="relative w-[90%] h-[80%] sm:w-full sm:h-auto sm:max-w-2xl sm:max-h-[90vh] transform overflow-hidden bg-white text-left shadow-xl transition-all sm:rounded-lg rounded-lg">
          {/* ヘッダー */}
          <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-3 py-2 sm:px-6 sm:py-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm sm:text-lg font-medium leading-6 text-gray-900">
                日次記録 - {format(selectedDate, 'yyyy年M月d日')}
              </h3>
              <button
                type="button"
                className="rounded-md bg-white text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 p-1"
                onClick={handleModalClose}
              >
                <X className="h-4 w-4 sm:h-6 sm:w-6" />
              </button>
            </div>
          </div>

          {/* スクロール可能なコンテンツエリア */}
          <div className="flex-1 overflow-y-auto px-3 py-3 sm:px-6 sm:py-6" style={{ 
            height: 'calc(100% - 120px)', // ヘッダー(50px) + フッター(70px) を除いた高さ
            maxHeight: 'calc(100% - 120px)'
          }}>
            <div className="space-y-3 sm:space-y-6">
              {/* Training Section */}
              <div>
                <h4 className="text-sm sm:text-lg font-medium text-gray-900 mb-2 sm:mb-3 flex items-center gap-2">
                  <div className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-green-500 rounded-full flex items-center justify-center bg-transparent">
                    <img 
                      src="/icons/dumbbell.svg" 
                      alt="トレーニング"
                      className="w-2 h-2 sm:w-3 sm:h-3"
                    />
                  </div>
                  トレーニング
                </h4>
                <div className="space-y-2 sm:space-y-3">
                  <label className="flex items-center gap-2 sm:gap-3 cursor-pointer p-2 sm:p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors">
                    <input
                      type="checkbox"
                      checked={training.running}
                      onChange={() => handleTrainingChange('running')}
                      className="h-3 w-3 sm:h-4 sm:w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <div className="flex items-center gap-1 sm:gap-2">
                      <div className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-blue-500 rounded-full flex items-center justify-center bg-transparent">
                        <img 
                          src="/icons/bicycle.svg" 
                          alt="有酸素"
                          className="w-2 h-2 sm:w-3 sm:h-3"
                        />
                      </div>
                      <span className="text-xs sm:text-sm font-medium">有酸素</span>
                    </div>
                  </label>
                  
                  <label className="flex items-center gap-2 sm:gap-3 cursor-pointer p-2 sm:p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors">
                    <input
                      type="checkbox"
                      checked={training.strength}
                      onChange={() => handleTrainingChange('strength')}
                      className="h-3 w-3 sm:h-4 sm:w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                    />
                    <div className="flex items-center gap-1 sm:gap-2">
                      <div className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-green-500 rounded-full flex items-center justify-center bg-transparent">
                        <img 
                          src="/icons/dumbbell.svg" 
                          alt="筋力トレーニング"
                          className="w-2 h-2 sm:w-3 sm:h-3"
                        />
                      </div>
                      <span className="text-xs sm:text-sm font-medium">筋力トレーニング</span>
                    </div>
                  </label>
                </div>
              </div>

              {/* Health Metrics Section */}
              <div>
                <h4 className="text-sm sm:text-lg font-medium text-gray-900 mb-2 sm:mb-3 flex items-center gap-2">
                  <div className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-purple-500 rounded-full flex items-center justify-center bg-transparent">
                    <img 
                      src="/icons/scale.svg" 
                      alt="体重・体脂肪率"
                      className="w-2 h-2 sm:w-3 sm:h-3"
                    />
                  </div>
                  体重・体脂肪率
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-4">
                  <div className="space-y-1">
                    <label className="block text-xs sm:text-sm font-medium text-gray-700">
                      体重 (kg)
                    </label>
                    <input
                      type="text"
                      value={healthMetrics.weight}
                      onChange={(e) => handleHealthMetricsChange('weight', e.target.value)}
                      placeholder="例: 70.5"
                      className="w-full px-2 py-1.5 sm:px-3 sm:py-2 text-xs sm:text-base text-center border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="block text-xs sm:text-sm font-medium text-gray-700">
                      体脂肪率 (%)
                    </label>
                    <input
                      type="text"
                      value={healthMetrics.bodyFatPercentage}
                      onChange={(e) => handleHealthMetricsChange('bodyFatPercentage', e.target.value)}
                      placeholder="例: 15.2"
                      className="w-full px-2 py-1.5 sm:px-3 sm:py-2 text-xs sm:text-base text-center border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200"
                    />
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-1 sm:mt-2">
                  小数点1桁まで入力可能です。記録しない項目は空欄のままにしてください。
                </p>
              </div>

              {/* Study Section - 余白を調整 */}
              <div className="pb-1 sm:pb-0">
                <h4 className="text-sm sm:text-lg font-medium text-gray-900 mb-2 sm:mb-3 flex items-center gap-2">
                  <div className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-amber-500 rounded-full flex items-center justify-center bg-transparent">
                    <img 
                      src="/icons/notebook.svg" 
                      alt="学習"
                      className="w-2 h-2 sm:w-3 sm:h-3"
                    />
                  </div>
                  学習進捗
                </h4>
                
                {availableBooks.length === 0 ? (
                  <div className="text-center py-3 sm:py-8 text-gray-500">
                    <div className="w-6 h-6 sm:w-12 sm:h-12 border-2 border-amber-500 rounded-full flex items-center justify-center bg-transparent mx-auto mb-2">
                      <img 
                        src="/icons/notebook.svg" 
                        alt="学習"
                        className="w-3 h-3 sm:w-6 sm:h-6 opacity-30"
                      />
                    </div>
                    <p className="text-xs sm:text-base">選択可能な書籍がありません</p>
                    <p className="text-xs sm:text-sm">すべての書籍が完了しているか、書籍を追加してください。</p>
                  </div>
                ) : (
                  <div className="space-y-2 sm:space-y-4">
                    {availableBooks.map(book => {
                      const selectedBook = selectedBooks.find(sb => sb.bookId === book.id);
                      const isBookSelected = !!selectedBook;
                      const availableChapters = getAvailableChapters(book);
                      const completedChaptersCount = book.chapters.filter((chapter: any) => selectedChapters.has(chapter.id)).length;
                      
                      return (
                        <div key={book.id} className="border border-gray-200 rounded-lg p-2 sm:p-4 hover:border-gray-300 transition-colors">
                          <div className="flex items-center justify-between mb-2 sm:mb-3">
                            <label className="flex items-center gap-2 sm:gap-3 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={isBookSelected}
                                onChange={() => handleBookSelect(book.id)}
                                className="h-3 w-3 sm:h-4 sm:w-4 text-amber-600 focus:ring-amber-500 border-gray-300 rounded"
                              />
                              <span className="text-xs sm:text-base font-medium text-gray-900">{book.name}</span>
                            </label>
                            <div className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm text-gray-500">
                              <span>{completedChaptersCount}/{book.chapters.length} 章完了</span>
                              {completedChaptersCount === book.chapters.length && (
                                <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 text-green-500" />
                              )}
                            </div>
                          </div>
                          
                          {isBookSelected && (
                            <div className="ml-3 sm:ml-7 space-y-1 sm:space-y-2">
                              <p className="text-xs sm:text-sm text-gray-600 mb-1 sm:mb-2">章を選択:</p>
                              {availableChapters.length === 0 ? (
                                <p className="text-xs sm:text-sm text-gray-500 italic">選択可能な章がありません</p>
                              ) : (
                                <div className="grid grid-cols-1 gap-1 sm:gap-2 max-h-16 sm:max-h-32 overflow-y-auto">
                                  {availableChapters.map(chapter => (
                                    <label key={chapter.id} className="flex items-center gap-1 sm:gap-2 cursor-pointer p-1 sm:p-2 rounded hover:bg-gray-50 transition-colors">
                                      <input
                                        type="checkbox"
                                        checked={selectedBook.chapterIds.includes(chapter.id)}
                                        onChange={() => handleChapterSelect(book.id, chapter.id)}
                                        className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-amber-600 focus:ring-amber-500 border-gray-300 rounded"
                                      />
                                      <span className="text-xs sm:text-sm text-gray-700">{chapter.name}</span>
                                      {selectedChapters.has(chapter.id) && !selectedBook.chapterIds.includes(chapter.id) && (
                                        <CheckCircle className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-green-500 ml-auto" title="他の日に完了済み" />
                                      )}
                                    </label>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* フッター（固定） */}
          <div className="sticky bottom-0 bg-white border-t border-gray-200 px-3 py-2 sm:px-6 sm:py-4">
            <div className="flex justify-end gap-2 sm:gap-3">
              <Button
                variant="outline"
                onClick={handleModalClose}
                className="text-xs sm:text-base px-2 py-1 sm:px-4 sm:py-2"
              >
                キャンセル
              </Button>
              <Button 
                onClick={handleSave} 
                className="flex items-center gap-1 sm:gap-2 text-xs sm:text-base px-2 py-1 sm:px-4 sm:py-2"
                disabled={isLoading}
              >
                <Save className="h-3 w-3 sm:h-4 sm:w-4" />
                {isLoading ? '保存中...' : '記録を保存'}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};