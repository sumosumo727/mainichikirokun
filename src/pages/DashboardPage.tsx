import React, { useState, useEffect } from 'react';
import { Header } from '../components/layout/Header';
import { CalendarView } from '../components/calendar/CalendarView';
import { DailyModal } from '../components/calendar/DailyModal';
import { BookList } from '../components/books/BookList';
import { StatsCard } from '../components/dashboard/StatsCard';
import { MonthlyChart } from '../components/dashboard/MonthlyChart';
import { HealthChart } from '../components/health/HealthChart';
import { HealthDataModal } from '../components/health/HealthDataModal';
import { useAppStore } from '../store/appStore';
import { useAuthStore } from '../store/authStore';
import { PersonStanding, Dumbbell, BookOpen, TrendingUp, Scale, Activity, Plus } from 'lucide-react';
import { format, getDaysInMonth } from 'date-fns';
import { Button } from '../components/ui/Button';

export const DashboardPage: React.FC = () => {
  const [currentView, setCurrentView] = useState<'calendar' | 'books' | 'stats'>('calendar');
  const [showHealthModal, setShowHealthModal] = useState(false);
  const [healthModalDate, setHealthModalDate] = useState<Date>(new Date());
  
  const { 
    loadInitialData, 
    dailyRecords, 
    books, 
    healthData,
    monthlyStats, 
    chartData,
    trainingDistribution,
    isLoading 
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

  // 最新の健康データを取得
  const latestHealthData = healthData.length > 0 ? healthData[0] : null;

  const handleAddHealthData = () => {
    setHealthModalDate(new Date());
    setShowHealthModal(true);
  };

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
            {/* 統計カード */}
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

            {/* 健康データカード */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <StatsCard
                title="最新の体重"
                value={latestHealthData?.weight ? `${latestHealthData.weight}kg` : '未記録'}
                subtitle={latestHealthData ? format(new Date(latestHealthData.date), 'yyyy/MM/dd') : undefined}
                icon={<Scale className="h-5 w-5" />}
                color="blue"
              />
              <StatsCard
                title="最新の体脂肪率"
                value={latestHealthData?.bodyFatPercentage ? `${latestHealthData.bodyFatPercentage}%` : '未記録'}
                subtitle={latestHealthData ? format(new Date(latestHealthData.date), 'yyyy/MM/dd') : undefined}
                icon={<Activity className="h-5 w-5" />}
                color="green"
              />
              <div className="flex items-center justify-center">
                <Button
                  onClick={handleAddHealthData}
                  className="flex items-center gap-2 h-full w-full min-h-[120px]"
                  variant="outline"
                >
                  <Plus className="h-6 w-6" />
                  <div className="text-center">
                    <div className="font-medium">健康データを追加</div>
                    <div className="text-sm text-gray-500">体重・体脂肪率を記録</div>
                  </div>
                </Button>
              </div>
            </div>

            {/* トレーニングチャート */}
            <MonthlyChart data={chartData} trainingDistribution={trainingDistribution} />
            
            {/* 健康データチャート */}
            <HealthChart data={healthData} />
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
      
      {/* 健康データモーダル */}
      <HealthDataModal
        isOpen={showHealthModal}
        onClose={() => setShowHealthModal(false)}
        selectedDate={healthModalDate}
      />
    </div>
  );
};