import React, { useState, useEffect } from 'react';
import { Header } from '../components/layout/Header';
import { CalendarView } from '../components/calendar/CalendarView';
import { DailyModal } from '../components/calendar/DailyModal';
import { BookList } from '../components/books/BookList';
import { StatsCard } from '../components/dashboard/StatsCard';
import { MonthlyChart } from '../components/dashboard/MonthlyChart';
import { HealthDataInput } from '../components/health/HealthDataInput';
import { HealthDataChart } from '../components/health/HealthDataChart';
import { useAppStore } from '../store/appStore';
import { useAuthStore } from '../store/authStore';
import { useHealthStore } from '../store/healthStore';
import { PersonStanding, Dumbbell, BookOpen, TrendingUp } from 'lucide-react';
import { format, getDaysInMonth, subDays } from 'date-fns';

export const DashboardPage: React.FC = () => {
  const [currentView, setCurrentView] = useState<'calendar' | 'books' | 'stats' | 'health'>('calendar');
  const { 
    loadInitialData, 
    dailyRecords, 
    books, 
    monthlyStats, 
    chartData,
    trainingDistribution,
    isLoading 
  } = useAppStore();
  const { user } = useAuthStore();
  const { healthData, getHealthDataByDateRange } = useHealthStore();

  useEffect(() => {
    if (user) {
      loadInitialData(user.id);
    }
  }, [user, loadInitialData]);

  // 今月の日数を計算
  const currentDate = new Date();
  const daysInCurrentMonth = getDaysInMonth(currentDate);

  // 過去30日間の健康データを取得
  const thirtyDaysAgo = subDays(new Date(), 30);
  const recentHealthData = getHealthDataByDateRange(
    format(thirtyDaysAgo, 'yyyy-MM-dd'),
    format(new Date(), 'yyyy-MM-dd')
  );

  const renderContent = () => {
    if (isLoading && currentView !== 'stats' && currentView !== 'health') {
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <StatsCard
                title="ランニング日数"
                value={monthlyStats?.trainingBreakdown.runningDays || 0}
                icon={<PersonStanding className="h-5 w-5" />}
                color="blue"
              />
              <StatsCard
                title="筋力トレーニング日数"
                value={monthlyStats?.trainingBreakdown.strengthDays || 0}
                icon={<Dumbbell className="h-5 w-5" />}
                color="green"
              />
              <StatsCard
                title="進行中の書籍"
                value={books.filter(b => b.chapters.some(c => !c.isCompleted) && b.chapters.some(c => c.isCompleted)).length}
                icon={<BookOpen className="h-5 w-5" />}
                color="amber"
              />
              <StatsCard
                title="トレーニング実施率"
                value={`${Math.round(monthlyStats?.trainingRate || 0)}%`}
                subtitle={`${monthlyStats?.trainingBreakdown.totalTrainingDays || 0}日 / ${daysInCurrentMonth}日`}
                icon={<TrendingUp className="h-5 w-5" />}
                color="blue"
              />
            </div>
            <MonthlyChart data={chartData} trainingDistribution={trainingDistribution} />
          </div>
        );
      case 'health':
        return (
          <div className="space-y-6">
            <HealthDataInput />
            <HealthDataChart data={recentHealthData} />
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