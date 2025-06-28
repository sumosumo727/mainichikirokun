import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { Save, CheckCircle } from 'lucide-react';
import { Modal } from '../ui/Modal';
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

  if (!selectedDate) return null;

  // 選択可能な書籍をフィルタリング（完了していない書籍のみ）
  const availableBooks = books.filter(book => {
    const selectedBook = selectedBooks.find(sb => sb.bookId === book.id);
    // 現在選択中の書籍は表示
    if (selectedBook) return true;
    // 完了していない書籍のみ表示
    return !isBookCompleted(book);
  });

  return (
    <Modal
      isOpen={showDailyModal}
      onClose={handleModalClose}
      title={`日次記録 - ${format(selectedDate, 'yyyy年M月d日')}`}
      size="lg"
    >
      <div className="space-y-6">
        {/* Training Section */}
        <div>
          <h4 className="text-lg font-medium text-gray-900 mb-3 flex items-center gap-2">
            <div className="w-5 h-5 border-2 border-green-500 rounded-full flex items-center justify-center bg-transparent">
              <img 
                src="/icons/dumbbell.svg" 
                alt="トレーニング"
                className="w-3 h-3"
              />
            </div>
            トレーニング
          </h4>
          <div className="space-y-3">
            <label className="flex items-center gap-3 cursor-pointer p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors">
              <input
                type="checkbox"
                checked={training.running}
                onChange={() => handleTrainingChange('running')}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 border-2 border-blue-500 rounded-full flex items-center justify-center bg-transparent">
                  <img 
                    src="/icons/bicycle.svg" 
                    alt="有酸素"
                    className="w-3 h-3"
                  />
                </div>
                <span className="text-sm font-medium">有酸素</span>
              </div>
            </label>
            
            <label className="flex items-center gap-3 cursor-pointer p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors">
              <input
                type="checkbox"
                checked={training.strength}
                onChange={() => handleTrainingChange('strength')}
                className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
              />
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 border-2 border-green-500 rounded-full flex items-center justify-center bg-transparent">
                  <img 
                    src="/icons/dumbbell.svg" 
                    alt="筋力トレーニング"
                    className="w-3 h-3"
                  />
                </div>
                <span className="text-sm font-medium">筋力トレーニング</span>
              </div>
            </label>
          </div>
        </div>

        {/* Health Metrics Section */}
        <div>
          <h4 className="text-lg font-medium text-gray-900 mb-3 flex items-center gap-2">
            <div className="w-5 h-5 border-2 border-purple-500 rounded-full flex items-center justify-center bg-transparent">
              <img 
                src="/icons/scale.svg" 
                alt="体重・体脂肪率"
                className="w-3 h-3"
              />
            </div>
            体重・体脂肪率
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="体重 (kg)"
              type="text"
              value={healthMetrics.weight}
              onChange={(e) => handleHealthMetricsChange('weight', e.target.value)}
              placeholder="例: 70.5"
              className="text-center"
            />
            <Input
              label="体脂肪率 (%)"
              type="text"
              value={healthMetrics.bodyFatPercentage}
              onChange={(e) => handleHealthMetricsChange('bodyFatPercentage', e.target.value)}
              placeholder="例: 15.2"
              className="text-center"
            />
          </div>
          <p className="text-xs text-gray-500 mt-2">
            小数点1桁まで入力可能です。記録しない項目は空欄のままにしてください。
          </p>
        </div>

        {/* Study Section */}
        <div>
          <h4 className="text-lg font-medium text-gray-900 mb-3 flex items-center gap-2">
            <div className="w-5 h-5 border-2 border-amber-500 rounded-full flex items-center justify-center bg-transparent">
              <img 
                src="/icons/notebook.svg" 
                alt="学習"
                className="w-3 h-3"
              />
            </div>
            学習進捗
          </h4>
          
          {availableBooks.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <div className="w-12 h-12 border-2 border-amber-500 rounded-full flex items-center justify-center bg-transparent mx-auto mb-2">
                <img 
                  src="/icons/notebook.svg" 
                  alt="学習"
                  className="w-6 h-6 opacity-30"
                />
              </div>
              <p>選択可能な書籍がありません</p>
              <p className="text-sm">すべての書籍が完了しているか、書籍を追加してください。</p>
            </div>
          ) : (
            <div className="space-y-4">
              {availableBooks.map(book => {
                const selectedBook = selectedBooks.find(sb => sb.bookId === book.id);
                const isBookSelected = !!selectedBook;
                const availableChapters = getAvailableChapters(book);
                const completedChaptersCount = book.chapters.filter((chapter: any) => selectedChapters.has(chapter.id)).length;
                
                return (
                  <div key={book.id} className="border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors">
                    <div className="flex items-center justify-between mb-3">
                      <label className="flex items-center gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={isBookSelected}
                          onChange={() => handleBookSelect(book.id)}
                          className="h-4 w-4 text-amber-600 focus:ring-amber-500 border-gray-300 rounded"
                        />
                        <span className="font-medium text-gray-900">{book.name}</span>
                      </label>
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <span>{completedChaptersCount}/{book.chapters.length} 章完了</span>
                        {completedChaptersCount === book.chapters.length && (
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        )}
                      </div>
                    </div>
                    
                    {isBookSelected && (
                      <div className="ml-7 space-y-2">
                        <p className="text-sm text-gray-600 mb-2">章を選択:</p>
                        {availableChapters.length === 0 ? (
                          <p className="text-sm text-gray-500 italic">選択可能な章がありません</p>
                        ) : (
                          <div className="grid grid-cols-1 gap-2 max-h-32 overflow-y-auto">
                            {availableChapters.map(chapter => (
                              <label key={chapter.id} className="flex items-center gap-2 cursor-pointer p-2 rounded hover:bg-gray-50 transition-colors">
                                <input
                                  type="checkbox"
                                  checked={selectedBook.chapterIds.includes(chapter.id)}
                                  onChange={() => handleChapterSelect(book.id, chapter.id)}
                                  className="h-3 w-3 text-amber-600 focus:ring-amber-500 border-gray-300 rounded"
                                />
                                <span className="text-sm text-gray-700">{chapter.name}</span>
                                {selectedChapters.has(chapter.id) && !selectedBook.chapterIds.includes(chapter.id) && (
                                  <CheckCircle className="h-3 w-3 text-green-500 ml-auto" title="他の日に完了済み" />
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

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button
            variant="outline"
            onClick={handleModalClose}
          >
            キャンセル
          </Button>
          <Button 
            onClick={handleSave} 
            className="flex items-center gap-2"
            disabled={isLoading}
          >
            <Save className="h-4 w-4" />
            {isLoading ? '保存中...' : '記録を保存'}
          </Button>
        </div>
      </div>
    </Modal>
  );
};