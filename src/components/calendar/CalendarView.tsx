import React, { useState, useEffect } from 'react';
import Calendar from 'react-calendar';
import { format, isSameDay } from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useAppStore } from '../../store/appStore';
import { cn } from '../../utils/cn';
import 'react-calendar/dist/Calendar.css';

export const CalendarView: React.FC = () => {
  const { 
    currentDate, 
    dailyRecords, 
    healthData,
    setCurrentDate, 
    setSelectedDate, 
    setShowDailyModal 
  } = useAppStore();

  const [value, setValue] = useState<Date>(currentDate);

  useEffect(() => {
    setValue(currentDate);
  }, [currentDate]);

  const handleDateClick = (date: Date) => {
    setSelectedDate(date);
    setShowDailyModal(true);
  };

  const getTileContent = ({ date }: { date: Date }) => {
    const record = dailyRecords.find(r => isSameDay(new Date(r.date), date));
    const health = healthData.find(h => isSameDay(new Date(h.date), date));
    
    if (!record && !health) return null;

    const hasRunning = record?.training.running;
    const hasStrength = record?.training.strength;
    const hasStudy = record?.studyProgress.length > 0;
    const hasWeight = health?.weight !== undefined && health?.weight !== null;
    const hasBodyFat = health?.bodyFatPercentage !== undefined && health?.bodyFatPercentage !== null;
    const hasHealthData = hasWeight || hasBodyFat;

    // トレーニングデータがあるかチェック
    const hasTrainingData = hasRunning || hasStrength;

    return (
      <div className="mt-1 w-full h-full flex flex-col justify-start gap-1" style={{ paddingLeft: '30px' }}>
        {/* 1段目: トレーニングアイコン（データがある場合のみ） */}
        {hasTrainingData && (
          <div className="flex justify-start items-center gap-1 h-5">
            {hasStrength && (
              <div className="w-5 h-5 border-2 border-green-500 rounded-full flex items-center justify-center bg-transparent">
                <img 
                  src="/icons/dumbbell.svg" 
                  alt="筋力トレーニング"
                  className="w-3 h-3"
                  title="筋力トレーニング"
                />
              </div>
            )}
            {hasRunning && (
              <div className="w-5 h-5 border-2 border-blue-500 rounded-full flex items-center justify-center bg-transparent">
                <img 
                  src="/icons/bicycle.svg" 
                  alt="有酸素"
                  className="w-3 h-3"
                  title="有酸素"
                />
              </div>
            )}
          </div>
        )}
        
        {/* 2段目: 体重データ（優先）または学習データ */}
        {hasHealthData && (
          <div className="flex justify-start items-center h-5">
            <div className="flex items-center gap-1">
              <div className="w-5 h-5 border-2 border-purple-500 rounded-full flex items-center justify-center bg-transparent">
                <img 
                  src="/icons/scale.svg" 
                  alt="体重・体脂肪率"
                  className="w-3 h-3"
                  title="体重・体脂肪率"
                />
              </div>
              <span className="text-xs text-purple-700 font-medium">
                {hasWeight && `${health?.weight}kg`}
                {hasWeight && hasBodyFat && '/'}
                {hasBodyFat && `${health?.bodyFatPercentage}%`}
              </span>
            </div>
          </div>
        )}
        
        {/* 3段目: 学習データ（体重データがない場合、または体重データがある場合の追加表示） */}
        {hasStudy && (
          <div className="flex justify-start items-center h-5">
            <div className="flex items-center gap-1">
              <div className="w-5 h-5 border-2 border-amber-500 rounded-full flex items-center justify-center bg-transparent">
                <img 
                  src="/icons/notebook.svg" 
                  alt="学習"
                  className="w-3 h-3"
                  title="学習"
                />
              </div>
              <span className="text-xs text-amber-700 font-medium">
                {record?.studyProgress.length}章
              </span>
            </div>
          </div>
        )}
      </div>
    );
  };

  const getTileClassName = ({ date }: { date: Date }) => {
    const record = dailyRecords.find(r => isSameDay(new Date(r.date), date));
    const health = healthData.find(h => isSameDay(new Date(h.date), date));
    const hasActivity = (record && (record.training.running || record.training.strength || record.studyProgress.length > 0)) ||
                      (health && (health.weight !== null || health.bodyFatPercentage !== null));
    
    return cn(
      'hover:bg-blue-50 transition-colors duration-200 cursor-pointer relative group',
      hasActivity && 'bg-blue-50 border-blue-200'
    );
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-3 sm:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 sm:mb-6 gap-4">
        <h2 className="text-lg sm:text-xl font-semibold text-gray-900">トレーニング・学習・体重記録</h2>
        <div className="flex items-center gap-2 sm:gap-4">
          <div className="grid grid-cols-2 sm:flex sm:items-center gap-2 sm:gap-4 text-xs sm:text-sm text-gray-600">
            <div className="flex items-center gap-1 sm:gap-2">
              <div className="w-4 h-4 sm:w-6 sm:h-6 border-2 border-blue-500 rounded-full flex items-center justify-center bg-transparent">
                <img 
                  src="/icons/bicycle.svg" 
                  alt="有酸素"
                  className="w-2 h-2 sm:w-3.5 sm:h-3.5"
                />
              </div>
              <span>有酸素</span>
            </div>
            <div className="flex items-center gap-1 sm:gap-2">
              <div className="w-4 h-4 sm:w-6 sm:h-6 border-2 border-green-500 rounded-full flex items-center justify-center bg-transparent">
                <img 
                  src="/icons/dumbbell.svg" 
                  alt="筋力トレーニング"
                  className="w-2 h-2 sm:w-3.5 sm:h-3.5"
                />
              </div>
              <span>筋力トレーニング</span>
            </div>
            <div className="flex items-center gap-1 sm:gap-2">
              <div className="w-4 h-4 sm:w-6 sm:h-6 border-2 border-amber-500 rounded-full flex items-center justify-center bg-transparent">
                <img 
                  src="/icons/notebook.svg" 
                  alt="学習"
                  className="w-2 h-2 sm:w-3.5 sm:h-3.5"
                />
              </div>
              <span>学習</span>
            </div>
            <div className="flex items-center gap-1 sm:gap-2">
              <div className="w-4 h-4 sm:w-6 sm:h-6 border-2 border-purple-500 rounded-full flex items-center justify-center bg-transparent">
                <img 
                  src="/icons/scale.svg" 
                  alt="体重・体脂肪率"
                  className="w-2 h-2 sm:w-3.5 sm:h-3.5"
                />
              </div>
              <span className="hidden sm:inline">体重・体脂肪率</span>
              <span className="sm:hidden">体重</span>
            </div>
          </div>
        </div>
      </div>

      <div className="calendar-container">
        <Calendar
          value={value}
          onChange={(newValue) => {
            if (newValue instanceof Date) {
              setValue(newValue);
              setCurrentDate(newValue);
            }
          }}
          onClickDay={handleDateClick}
          tileContent={getTileContent}
          tileClassName={getTileClassName}
          className="w-full border-none"
          prevLabel={<ChevronLeft className="h-3 w-3 sm:h-4 sm:w-4" />}
          nextLabel={<ChevronRight className="h-3 w-3 sm:h-4 sm:w-4" />}
        />
      </div>

      <style>{`
        .calendar-container .react-calendar {
          width: 100%;
          border: none;
          font-family: inherit;
        }
        
        .calendar-container .react-calendar__tile {
          height: 80px;
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          justify-content: flex-start;
          padding: 4px 2px 2px 2px;
          border: 1px solid #e5e7eb;
          position: relative;
          font-size: 12px;
        }
        
        @media (min-width: 640px) {
          .calendar-container .react-calendar__tile {
            height: 110px;
            padding: 6px 4px 4px 4px;
            font-size: 14px;
          }
        }
        
        .calendar-container .react-calendar__tile--now {
          background: #eff6ff;
          color: #1d4ed8;
          font-weight: 600;
        }
        
        .calendar-container .react-calendar__tile--active {
          background: #3b82f6;
          color: white;
        }
        
        .calendar-container .react-calendar__tile:hover {
          background: #f0f9ff;
        }
        
        .calendar-container .react-calendar__navigation {
          display: flex;
          height: 36px;
          margin-bottom: 0.5rem;
        }
        
        @media (min-width: 640px) {
          .calendar-container .react-calendar__navigation {
            height: 44px;
            margin-bottom: 1rem;
          }
        }
        
        .calendar-container .react-calendar__navigation button {
          min-width: 36px;
          background: none;
          border: none;
          color: #374151;
          font-size: 14px;
          font-weight: 500;
        }
        
        @media (min-width: 640px) {
          .calendar-container .react-calendar__navigation button {
            min-width: 44px;
            font-size: 16px;
          }
        }
        
        .calendar-container .react-calendar__navigation button:hover {
          background: #f3f4f6;
        }
        
        .calendar-container .react-calendar__month-view__weekdays {
          text-align: center;
          text-transform: uppercase;
          font-weight: 500;
          font-size: 10px;
          color: #6b7280;
        }
        
        @media (min-width: 640px) {
          .calendar-container .react-calendar__month-view__weekdays {
            font-size: 12px;
          }
        }
        
        .calendar-container .react-calendar__month-view__weekdays__weekday {
          padding: 0.25rem 0;
        }
        
        @media (min-width: 640px) {
          .calendar-container .react-calendar__month-view__weekdays__weekday {
            padding: 0.5rem 0;
          }
        }
        
        /* スマホでのアイコンサイズ調整 */
        @media (max-width: 639px) {
          .calendar-container .react-calendar__tile div[style*="paddingLeft: 30px"] {
            padding-left: 15px !important;
          }
          
          .calendar-container .react-calendar__tile .w-5 {
            width: 16px !important;
            height: 16px !important;
          }
          
          .calendar-container .react-calendar__tile .w-3 {
            width: 10px !important;
            height: 10px !important;
          }
          
          .calendar-container .react-calendar__tile .text-xs {
            font-size: 9px !important;
          }
          
          .calendar-container .react-calendar__tile .gap-1 {
            gap: 2px !important;
          }
          
          .calendar-container .react-calendar__tile .h-5 {
            height: 16px !important;
          }
        }
      `}</style>
    </div>
  );
};