import React, { useState, useEffect } from 'react';
import { Save, Plus, X, AlertTriangle, Trash2 } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { useAppStore } from '../../store/appStore';
import { useAuthStore } from '../../store/authStore';
import type { Book } from '../../types';

interface BookModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingBookId?: string | null;
}

export const BookModal: React.FC<BookModalProps> = ({
  isOpen,
  onClose,
  editingBookId,
}) => {
  const { books, addBook, updateBookData, isLoading, getSelectedChapters } = useAppStore();
  const { user } = useAuthStore();
  const [bookName, setBookName] = useState('');
  const [chapters, setChapters] = useState<string[]>(['']);
  const [bulkChapters, setBulkChapters] = useState('');
  const [useBulkInput, setUseBulkInput] = useState(false);
  
  // 章削除確認用の状態
  const [showDeleteChapterModal, setShowDeleteChapterModal] = useState(false);
  const [deletingChapter, setDeletingChapter] = useState<{
    index: number;
    name: string;
    isActive: boolean;
  } | null>(null);

  const editingBook = editingBookId ? books.find(b => b.id === editingBookId) : null;

  useEffect(() => {
    if (editingBook) {
      setBookName(editingBook.name);
      setChapters(editingBook.chapters.map(c => c.name));
      setBulkChapters(editingBook.chapters.map(c => c.name).join('\n'));
    } else {
      setBookName('');
      setChapters(['']);
      setBulkChapters('');
    }
    setUseBulkInput(false);
  }, [editingBook, isOpen]);

  const handleAddChapter = () => {
    setChapters(prev => [...prev, '']);
  };

  const handleRemoveChapterClick = (index: number) => {
    const chapterName = chapters[index];
    
    // 編集中の書籍の場合、章が使用中かチェック
    let isActive = false;
    if (editingBook && editingBook.chapters[index]) {
      const selectedChapters = getSelectedChapters();
      isActive = selectedChapters.has(editingBook.chapters[index].id);
    }

    setDeletingChapter({
      index,
      name: chapterName || `第${index + 1}章`,
      isActive
    });
    setShowDeleteChapterModal(true);
  };

  const handleConfirmRemoveChapter = () => {
    if (deletingChapter === null) return;
    
    setChapters(prev => prev.filter((_, i) => i !== deletingChapter.index));
    setShowDeleteChapterModal(false);
    setDeletingChapter(null);
  };

  const handleDeleteChapterModalClose = () => {
    setShowDeleteChapterModal(false);
    setDeletingChapter(null);
  };

  const handleChapterChange = (index: number, value: string) => {
    setChapters(prev => prev.map((ch, i) => i === index ? value : ch));
  };

  const processBulkChapters = (text: string): string[] => {
    return text
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0)
      .filter((line, index, arr) => arr.indexOf(line) === index); // Remove duplicates
  };

  const handleBulkProcess = () => {
    const processedChapters = processBulkChapters(bulkChapters);
    setChapters(processedChapters);
    setUseBulkInput(false);
  };

  const handleSave = async () => {
    if (!bookName.trim() || !user) return;

    const finalChapters = useBulkInput 
      ? processBulkChapters(bulkChapters)
      : chapters.filter(ch => ch.trim());

    if (finalChapters.length === 0) return;

    const chapterObjects = finalChapters.map((name, index) => ({
      id: editingBook?.chapters[index]?.id || Math.random().toString(36).substr(2, 9),
      bookId: editingBookId || '',
      name,
      order: index + 1,
      isCompleted: editingBook?.chapters[index]?.isCompleted || false,
      completedDate: editingBook?.chapters[index]?.completedDate || null,
    }));

    try {
      if (editingBook) {
        await updateBookData(editingBook.id, {
          name: bookName,
          chapters: chapterObjects.map(ch => ({ ...ch, bookId: editingBook.id })),
        });
      } else {
        await addBook({
          userId: user.id,
          name: bookName,
          chapters: chapterObjects,
        });
      }
      onClose();
    } catch (error) {
      console.error('書籍保存エラー:', error);
      alert('書籍の保存に失敗しました。もう一度お試しください。');
    }
  };

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title={editingBook ? '書籍を編集' : '新しい書籍を追加'}
        size="lg"
      >
        <div className="space-y-6">
          <Input
            label="書籍名"
            value={bookName}
            onChange={(e) => setBookName(e.target.value)}
            placeholder="書籍名を入力してください"
          />

          <div>
            <div className="flex items-center justify-between mb-4">
              <label className="block text-sm font-medium text-gray-700">
                章
              </label>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setUseBulkInput(!useBulkInput)}
                >
                  {useBulkInput ? '個別入力' : '一括入力'}
                </Button>
                {!useBulkInput && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleAddChapter}
                    className="flex items-center gap-1"
                  >
                    <Plus className="h-3 w-3" />
                    章を追加
                  </Button>
                )}
              </div>
            </div>

            {useBulkInput ? (
              <div className="space-y-3">
                <textarea
                  value={bulkChapters}
                  onChange={(e) => setBulkChapters(e.target.value)}
                  placeholder="章名を1行ずつ入力してください"
                  className="w-full h-40 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <Button
                  variant="outline"
                  onClick={handleBulkProcess}
                  className="flex items-center gap-2"
                >
                  章を一括入力
                </Button>
              </div>
            ) : (
              <div className="space-y-3 max-h-60 overflow-y-auto">
                {chapters.map((chapter, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <Input
                      value={chapter}
                      onChange={(e) => handleChapterChange(index, e.target.value)}
                      placeholder={`第${index + 1}章の名前`}
                    />
                    {chapters.length > 1 && (
                      <button
                        onClick={() => handleRemoveChapterClick(index)}
                        className="p-2 text-red-500 hover:text-red-700 transition-colors"
                        title="削除"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="outline" onClick={onClose}>
              キャンセル
            </Button>
            <Button 
              onClick={handleSave} 
              className="flex items-center gap-2"
              disabled={isLoading}
            >
              <Save className="h-4 w-4" />
              {isLoading ? '保存中...' : (editingBook ? '書籍を更新' : '書籍を追加')}
            </Button>
          </div>
        </div>
      </Modal>

      {/* 章削除確認モーダル */}
      <Modal
        isOpen={showDeleteChapterModal}
        onClose={handleDeleteChapterModalClose}
        title="章の削除確認"
        size="md"
      >
        <div className="space-y-4">
          {deletingChapter?.isActive && (
            <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-medium text-amber-800 mb-2">⚠️ 警告</h4>
                <p className="text-sm text-amber-700">
                  この章は現在使用中です。削除してもよろしいですか？
                </p>
              </div>
            </div>
          )}
          
          <div className="text-gray-700">
            <p className="mb-2">
              「<span className="font-medium">{deletingChapter?.name}</span>」を削除してもよろしいですか？
            </p>
            {!deletingChapter?.isActive && (
              <p className="text-sm text-gray-500">この操作は取り消せません。</p>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button
              variant="outline"
              onClick={handleDeleteChapterModalClose}
            >
              キャンセル
            </Button>
            <Button
              variant="danger"
              onClick={handleConfirmRemoveChapter}
              className="flex items-center gap-2"
            >
              <Trash2 className="h-4 w-4" />
              削除する
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
};