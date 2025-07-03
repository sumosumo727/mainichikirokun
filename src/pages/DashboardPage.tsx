import React, { useState, useEffect } from 'react';
import { Header } from '../components/layout/Header';
import { CalendarView } from '../components/calendar/CalendarView';
import { DailyModal } from '../components/calendar/DailyModal';
import { BookList } from '../components/books/BookList';
import { StatsCard } from '../components/dashboard/StatsCard';
import { MonthlyChart } from '../components/dashboard/MonthlyChart';
import { BodyMetricsChart } from '../components/dashboard/BodyMetricsChart';
import { useAppStore } from '../store/appStore';
import { useAuthStore } from '../store/authStore';
import { PersonStanding, Dumbbell, BookOpen, TrendingUp, Scale, CheckCircle, Target } from 'lucide-react';
import { format, getDaysInMonth } from 'date-fns';

export const DashboardPage: React.FC = () => {
  const [currentView, setCurrentView] = useState<'calendar' | 'books' | 'stats'>('calendar');
  const { 
    loadInitialData, 
    dailyRecords, 
    books, 
    healthData,
    monthlyStats, 
    chartData,
    trainingDistribution,
    bodyMetricsChartData,
    bodyMetricsPeriod,
    setBodyMetricsPeriod,
    isLoading,
    getSelectedChapters
  } = useAppStore();
  const { user } = useAuthStore();

  useEffect(() => {
    if (user) {
      loadInitialData(user.id);
    }
  }, [user, loadInitialData]);

  // 今月の日数を計算
  const currentDate = new Date();
  const daysInCurrentMonth = getDaysInMonth(currentDate);

  // 体重・体脂肪率の最新データを取得
  const latestHealthData = healthData.length > 0 
    ? healthData.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0]
    : null;

  // 書籍進捗の詳細計算
  const calculateBookProgress = () => {
    const selectedChapters = getSelectedChapters();
    
    // 全章数と完了章数を計算
    const totalChapters = books.reduce((total, book) => total + book.chapters.length, 0);
    const completedChapters = books.reduce((total, book) => {
      return total + book.chapters.filter(chapter => selectedChapters.has(chapter.id)).length;
    }, 0);

    // 進行中の書籍（一部章が完了）
    const inProgressBooks = books.filter(book => {
      const bookCompletedChapters = book.chapters.filter(chapter => selectedChapters.has(chapter.id)).length;
      return bookCompletedChapters > 0 && bookCompletedChapters < book.chapters.length;
    }).length;

    // 完了した書籍（全章が完了）
    const completedBooks = books.filter(book => {
      if (book.chapters.length === 0) return false;
      return book.chapters.every(chapter => selectedChapters.has(chapter.id));
    }).length;

    // 全体進捗率
    const overallProgress = totalChapters > 0 ? Math.round((completedChapters / totalChapters) * 100) : 0;

    return {
      totalChapters,
      completedChapters,
      inProgressBooks,
      completedBooks,
      overallProgress
    };
  };

  const bookProgress = calculateBookProgress();

  const renderContent = () => {
    if (isLoading && currentView !== 'stats') {
      return (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">データを読み込み中...</p>
          </div>
        </div>
      );
    }

    switch (currentView) {
      case 'calendar':
        return (
          <div className="space-y-6">
            <CalendarView />
            <DailyModal />
          </div>
        );
      case 'books':
        return <BookList />;
      case 'stats':
        return (
          <div className="space-y-6">
            {/* 基本統計 */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
              <StatsCard
                title="有酸素運動日数"
                value={monthlyStats?.trainingBreakdown.runningDays || 0}
                icon={<PersonStanding className="h-5 w-5" />}
                color="blue"
                subtitle="今月の実施日数"
              />
              <StatsCard
                title="筋力トレーニング日数"
                value={monthlyStats?.trainingBreakdown.strengthDays || 0}
                icon={<Dumbbell className="h-5 w-5" />}
                color="green"
                subtitle="今月の実施日数"
              />
              <StatsCard
                title="学習進捗"
                value={`${bookProgress.completedChapters}章`}
                icon={<BookOpen className="h-5 w-5" />}
                color="amber"
                subtitle={`全${bookProgress.totalChapters}章中`}
              />
              <StatsCard
                title="トレーニング実施率"
                value={`${Math.round(monthlyStats?.trainingRate || 0)}%`}
                subtitle={`${monthlyStats?.trainingBreakdown.totalTrainingDays || 0}日 / ${daysInCurrentMonth}日`}
                icon={<TrendingUp className="h-5 w-5" />}
                color="blue"
              />
              <StatsCard
                title="最新体重"
                value={latestHealthData?.weight ? `${latestHealthData.weight}kg` : '-'}
                subtitle={latestHealthData?.bodyFatPercentage ? `体脂肪率: ${latestHealthData.bodyFatPercentage}%` : ''}
                icon={<Scale className="h-5 w-5" />}
                color="purple"
              />
            </div>

            {/* 書籍進捗詳細 */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <StatsCard
                title="進行中の書籍"
                value={bookProgress.inProgressBooks}
                icon={<BookOpen className="h-5 w-5" />}
                color="amber"
                subtitle="一部章が完了済み"
              />
              <StatsCard
                title="完了した書籍"
                value={bookProgress.completedBooks}
                icon={<CheckCircle className="h-5 w-5" />}
                color="green"
                subtitle="全章完了済み"
              />
              <StatsCard
                title="全体進捗率"
                value={`${bookProgress.overallProgress}%`}
                icon={<Target className="h-5 w-5" />}
                color="blue"
                subtitle={`${bookProgress.completedChapters}/${bookProgress.totalChapters}章完了`}
              />
            </div>
            
            <BodyMetricsChart 
              data={bodyMetricsChartData}
              period={bodyMetricsPeriod}
              onPeriodChange={setBodyMetricsPeriod}
            />
            
            <MonthlyChart data={chartData} trainingDistribution={trainingDistribution} />
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header currentView={currentView} onViewChange={setCurrentView} />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {renderContent()}
      </main>
    </div>
  );
};