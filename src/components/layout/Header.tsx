import React from 'react';
import { Calendar, BookOpen, BarChart3, LogOut, User } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';

interface HeaderProps {
  currentView: 'calendar' | 'books' | 'stats';
  onViewChange: (view: 'calendar' | 'books' | 'stats') => void;
}

export const Header: React.FC<HeaderProps> = ({ currentView, onViewChange }) => {
  const { user, logout } = useAuthStore();

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-12 sm:h-16">
          <div className="flex items-center gap-4 sm:gap-8">
            <div className="flex items-center gap-1.5 sm:gap-2">
              <div className="w-6 h-6 sm:w-8 sm:h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <Calendar className="h-3 w-3 sm:h-5 sm:w-5 text-white" />
              </div>
              <h1 className="text-base sm:text-xl font-bold text-gray-900">TrainingFlow</h1>
            </div>

            <nav className="hidden md:flex space-x-8">
              <button
                onClick={() => onViewChange('calendar')}
                className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  currentView === 'calendar'
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <Calendar className="h-4 w-4" />
                カレンダー
              </button>
              <button
                onClick={() => onViewChange('books')}
                className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  currentView === 'books'
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <BookOpen className="h-4 w-4" />
                書籍
              </button>
              <button
                onClick={() => onViewChange('stats')}
                className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  currentView === 'stats'
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <BarChart3 className="h-4 w-4" />
                統計
              </button>
            </nav>
          </div>

          <div className="flex items-center gap-2 sm:gap-4">
            <div className="flex items-center gap-1 sm:gap-2">
              <User className="h-3 w-3 sm:h-4 sm:w-4 text-gray-500" />
              <span className="text-xs sm:text-sm font-medium text-gray-700 truncate max-w-20 sm:max-w-none">
                {user?.username}
              </span>
              {user?.isAdmin && (
                <span className="px-1.5 py-0.5 sm:px-2 sm:py-1 text-xs bg-green-100 text-green-800 rounded-full">
                  管理者
                </span>
              )}
            </div>
            <button
              onClick={logout}
              className="flex items-center gap-1 sm:gap-2 px-2 py-1 sm:px-3 sm:py-2 text-xs sm:text-sm font-medium text-gray-500 hover:text-gray-700 transition-colors"
            >
              <LogOut className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">ログアウト</span>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      <div className="md:hidden border-t border-gray-200 bg-gray-50">
        <div className="flex">
          <button
            onClick={() => onViewChange('calendar')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-medium ${
              currentView === 'calendar'
                ? 'text-blue-700 bg-blue-50'
                : 'text-gray-500'
            }`}
          >
            <Calendar className="h-3.5 w-3.5" />
            カレンダー
          </button>
          <button
            onClick={() => onViewChange('books')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-medium ${
              currentView === 'books'
                ? 'text-blue-700 bg-blue-50'
                : 'text-gray-500'
            }`}
          >
            <BookOpen className="h-3.5 w-3.5" />
            書籍
          </button>
          <button
            onClick={() => onViewChange('stats')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-medium ${
              currentView === 'stats'
                ? 'text-blue-700 bg-blue-50'
                : 'text-gray-500'
            }`}
          >
            <BarChart3 className="h-3.5 w-3.5" />
            統計
          </button>
        </div>
      </div>
    </header>
  );
};