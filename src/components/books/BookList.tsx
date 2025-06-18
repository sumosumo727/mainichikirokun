import React, { useState } from 'react';
import { BookOpen, Plus, Edit3, Trash2, CheckCircle, Calendar, AlertTriangle } from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import { useAppStore } from '../../store/appStore';
import { BookModal } from './BookModal';
import { format } from 'date-fns';

export const BookList: React.FC = () => {
  const { books, deleteBookData, getChapterCompletionDate, isLoading, getSelectedChapters } = useAppStore();
  const [showModal, setShowModal] = useState(false);
  const [editingBook, setEditingBook] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingBook, setDeletingBook] = useState<{ id: string; name: string; hasActiveChapters: boolean; activeChapterNames: string[] } | null>(null);

  const handleEdit = (bookId: string) => {
    setEditingBook(bookId);
    setShowModal(true);
  };

  const handleDeleteClick = (bookId: string) => {
    const book = books.find(b => b.id === bookId);
    if (!book) return;

    const selectedChapters = getSelectedChapters();
    const activeChapters = book.chapters.filter(chapter => selectedChapters.has(chapter.id));
    const hasActiveChapters = activeChapters.length > 0;

    setDeletingBook({
      id: bookId,
      name: book.name,
      hasActiveChapters,
      activeChapterNames: activeChapters.map(ch => ch.name)
    });
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (!deletingBook) return;

    try {
      await deleteBookData(deletingBook.id);
      setShowDeleteModal(false);
      setDeletingBook(null);
    } catch (error) {
      console.error('書籍削除エラー:', error);
      alert('書籍の削除に失敗しました。もう一度お試しください。');
    }
  };

  const handleModalClose = () => {
    setShowModal(false);
    setEditingBook(null);
  };

  const handleDeleteModalClose = () => {
    setShowDeleteModal(false);
    setDeletingBook(null);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">データを読み込み中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
          <BookOpen className="h-5 w-5" />
          書籍・学習教材
        </h2>
        <Button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2"
          disabled={isLoading}
        >
          <Plus className="h-4 w-4" />
          書籍を追加
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {books.map(book => {
          const completedChapters = book.chapters.filter(c => c.isCompleted).length;
          const totalChapters = book.chapters.length;
          const completionRate = totalChapters > 0 ? (completedChapters / totalChapters) * 100 : 0;

          return (
            <Card key={book.id} className="relative">
              <div className="flex items-start justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900 pr-2">{book.name}</h3>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleEdit(book.id)}
                    className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                    title="編集"
                    disabled={isLoading}
                  >
                    <Edit3 className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteClick(book.id)}
                    className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                    title="削除"
                    disabled={isLoading}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* 進捗状況 */}
              <div className="space-y-3 mb-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">進捗状況</span>
                  <span className="font-medium">{completedChapters}/{totalChapters} 章</span>
                </div>

                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${completionRate}%` }}
                  />
                </div>

                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">完了率</span>
                  <span className="font-medium">{Math.round(completionRate)}%</span>
                </div>

                {completionRate === 100 && (
                  <div className="flex items-center gap-2 text-green-600 text-sm">
                    <CheckCircle className="h-4 w-4" />
                    <span>完了！</span>
                  </div>
                )}
              </div>

              {/* 章一覧 */}
              <div className="space-y-2 mb-4">
                <h4 className="text-sm font-medium text-gray-700 flex items-center gap-1">
                  <BookOpen className="h-3 w-3" />
                  章一覧
                </h4>
                <div className="max-h-40 overflow-y-auto space-y-1">
                  {book.chapters.map(chapter => {
                    const completionDate = getChapterCompletionDate(chapter.id);
                    
                    return (
                      <div
                        key={chapter.id}
                        className={`flex items-center justify-between p-2 rounded text-sm transition-colors ${
                          chapter.isCompleted 
                            ? 'bg-green-50 border border-green-200' 
                            : 'bg-gray-50 border border-gray-200'
                        }`}
                      >
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          {chapter.isCompleted ? (
                            <CheckCircle className="h-3 w-3 text-green-600 flex-shrink-0" />
                          ) : (
                            <div className="h-3 w-3 border border-gray-300 rounded-full flex-shrink-0" />
                          )}
                          <span className={`truncate ${chapter.isCompleted ? 'text-green-800' : 'text-gray-700'}`}>
                            {chapter.name}
                          </span>
                        </div>
                        
                        {chapter.isCompleted && completionDate && (
                          <div className="flex items-center gap-1 text-xs text-green-600 ml-2 flex-shrink-0">
                            <Calendar className="h-3 w-3" />
                            <span>{format(new Date(completionDate), 'yyyy/MM/dd')}</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 書籍情報 */}
              <div className="pt-4 border-t border-gray-200">
                <div className="text-sm text-gray-600">
                  <p>章数: {totalChapters}</p>
                  <p>追加日: {format(new Date(book.createdAt), 'yyyy/MM/dd')}</p>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {books.length === 0 && !isLoading && (
        <Card className="text-center py-12">
          <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">書籍が登録されていません</h3>
          <p className="text-gray-600 mb-4">
            最初の書籍や学習教材を追加して、進捗を追跡しましょう。
          </p>
          <Button onClick={() => setShowModal(true)} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            最初の書籍を追加
          </Button>
        </Card>
      )}

      {/* 書籍追加・編集モーダル */}
      <BookModal
        isOpen={showModal}
        onClose={handleModalClose}
        editingBookId={editingBook}
      />

      {/* 削除確認モーダル */}
      <Modal
        isOpen={showDeleteModal}
        onClose={handleDeleteModalClose}
        title="書籍の削除確認"
        size="md"
      >
        <div className="space-y-4">
          {deletingBook?.hasActiveChapters && (
            <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-medium text-amber-800 mb-2">⚠️ 警告</h4>
                <p className="text-sm text-amber-700 mb-2">
                  この書籍は現在使用中です。削除してもよろしいですか？
                </p>
                <div className="text-xs text-amber-600">
                  <p className="font-medium mb-1">使用中の章:</p>
                  <ul className="list-disc list-inside space-y-0.5">
                    {deletingBook.activeChapterNames.map((name, index) => (
                      <li key={index}>{name}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}
          
          <div className="text-gray-700">
            <p className="mb-2">
              「<span className="font-medium">{deletingBook?.name}</span>」を削除してもよろしいですか？
            </p>
            {!deletingBook?.hasActiveChapters && (
              <p className="text-sm text-gray-500">この操作は取り消せません。</p>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button
              variant="outline"
              onClick={handleDeleteModalClose}
            >
              キャンセル
            </Button>
            <Button
              variant="danger"
              onClick={handleConfirmDelete}
              disabled={isLoading}
              className="flex items-center gap-2"
            >
              <Trash2 className="h-4 w-4" />
              {isLoading ? '削除中...' : '削除する'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};