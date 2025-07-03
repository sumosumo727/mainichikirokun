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
      <div className="mt-1 w-full h-full flex flex-col justify-start gap-0.5 sm:gap-1 pl-2 sm:pl-30">
        {/* 1段目: トレーニングアイコン（データがある場合のみ） */}
        {hasTrainingData && (
          <div className="flex justify-start items-center gap-0.5 sm:gap-1 h-3 sm:h-5">
            {hasStrength && (
              <div className="w-3 h-3 sm:w-5 sm:h-5 border border-green-500 sm:border-2 rounded-full flex items-center justify-center bg-transparent">
                <img 
                  src="/icons/dumbbell.svg" 
                  alt="筋力トレーニング"
                  className="w-1.5 h-1.5 sm:w-3 sm:h-3"
                  title="筋力トレーニング"
                />
              </div>
            )}
            {hasRunning && (
              <div className="w-3 h-3 sm:w-5 sm:h-5 border border-blue-500 sm:border-2 rounded-full flex items-center justify-center bg-transparent">
                <img 
                  src="/icons/bicycle.svg" 
                  alt="有酸素"
                  className="w-1.5 h-1.5 sm:w-3 sm:h-3"
                  title="有酸素"
                />
              </div>
            )}
          </div>
        )}
        
        {/* 2段目: 体重データ（スマホでは別行表示） */}
        {hasHealthData && (
          <div className="flex justify-start items-start h-auto">
            <div className="flex items-start gap-0.5 sm:gap-1">
              <div className="w-3 h-3 sm:w-5 sm:h-5 border border-purple-500 sm:border-2 rounded-full flex items-center justify-center bg-transparent flex-shrink-0">
                <img 
                  src="/icons/scale.svg" 
                  alt="体重・体脂肪率"
                  className="w-1.5 h-1.5 sm:w-3 sm:h-3"
                  title="体重・体脂肪率"
                />
              </div>
              <div className="flex flex-col text-purple-700 font-medium leading-tight">
                {/* スマホでは縦並び、デスクトップでは横並び */}
                <div className="block sm:hidden">
                  {hasWeight && (
                    <div className="text-[7px] whitespace-nowrap">
                      {health?.weight}kg
                    </div>
                  )}
                  {hasBodyFat && (
                    <div className="text-[7px] whitespace-nowrap">
                      {health?.bodyFatPercentage}%
                    </div>
                  )}
                </div>
                <div className="hidden sm:block text-xs">
                  {hasWeight && `${health?.weight}kg`}
                  {hasWeight && hasBodyFat && '/'}
                  {hasBodyFat && `${health?.bodyFatPercentage}%`}
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* 3段目: 学習データ */}
        {hasStudy && (
          <div className="flex justify-start items-center h-3 sm:h-5">
            <div className="flex items-center gap-0.5 sm:gap-1">
              <div className="w-3 h-3 sm:w-5 sm:h-5 border border-amber-500 sm:border-2 rounded-full flex items-center justify-center bg-transparent">
                <img 
                  src="/icons/notebook.svg" 
                  alt="学習"
                  className="w-1.5 h-1.5 sm:w-3 sm:h-3"
                  title="学習"
                />
              </div>
              <span className="text-[7px] sm:text-xs text-amber-700 font-medium">
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
    <div className="bg-white rounded-lg shadow-md p-3 sm:p-6 h-full flex flex-col">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 sm:mb-6 gap-3 sm:gap-4 flex-shrink-0">
        <h2 className="text-base sm:text-xl font-semibold text-gray-900 leading-tight">
          トレーニング・学習・体重記録
        </h2>
        <div className="flex items-center gap-2 sm:gap-4">
          <div className="flex items-center gap-1.5 sm:gap-4 text-xs sm:text-sm text-gray-600">
            <div className="flex items-center gap-1 sm:gap-2">
              <div className="w-3 h-3 sm:w-6 sm:h-6 border border-blue-500 sm:border-2 rounded-full flex items-center justify-center bg-transparent">
                <img 
                  src="/icons/bicycle.svg" 
                  alt="有酸素"
                  className="w-1.5 h-1.5 sm:w-3.5 sm:h-3.5"
                />
              </div>
              <span className="text-xs sm:text-sm">有酸素</span>
            </div>
            <div className="flex items-center gap-1 sm:gap-2">
              <div className="w-3 h-3 sm:w-6 sm:h-6 border border-green-500 sm:border-2 rounded-full flex items-center justify-center bg-transparent">
                <img 
                  src="/icons/dumbbell.svg" 
                  alt="筋力トレーニング"
                  className="w-1.5 h-1.5 sm:w-3.5 sm:h-3.5"
                />
              </div>
              <span className="text-xs sm:text-sm">筋トレ</span>
            </div>
            <div className="flex items-center gap-1 sm:gap-2">
              <div className="w-3 h-3 sm:w-6 sm:h-6 border border-amber-500 sm:border-2 rounded-full flex items-center justify-center bg-transparent">
                <img 
                  src="/icons/notebook.svg" 
                  alt="学習"
                  className="w-1.5 h-1.5 sm:w-3.5 sm:h-3.5"
                />
              </div>
              <span className="text-xs sm:text-sm">学習</span>
            </div>
            <div className="flex items-center gap-1 sm:gap-2">
              <div className="w-3 h-3 sm:w-6 sm:h-6 border border-purple-500 sm:border-2 rounded-full flex items-center justify-center bg-transparent">
                <img 
                  src="/icons/scale.svg" 
                  alt="体重・体脂肪率"
                  className="w-1.5 h-1.5 sm:w-3.5 sm:h-3.5"
                />
              </div>
              <span className="text-xs sm:text-sm">体重</span>
            </div>
          </div>
        </div>
      </div>

      <div className="calendar-container flex-1 min-h-0">
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
          className="w-full border-none h-full"
          prevLabel={<ChevronLeft className="h-3 w-3 sm:h-4 sm:w-4" />}
          nextLabel={<ChevronRight className="h-3 w-3 sm:h-4 sm:w-4" />}
        />
      </div>

      <style>{`
        .calendar-container .react-calendar {
          width: 100%;
          height: 100%;
          border: none;
          font-family: inherit;
          display: flex;
          flex-direction: column;
        }
        
        .calendar-container .react-calendar__viewContainer {
          flex: 1;
          display: flex;
          flex-direction: column;
        }
        
        .calendar-container .react-calendar__month-view {
          flex: 1;
          display: flex;
          flex-direction: column;
        }
        
        .calendar-container .react-calendar__month-view__days {
          flex: 1;
          display: grid !important;
          grid-template-columns: repeat(7, 1fr);
          grid-template-rows: repeat(6, 1fr);
          gap: 1px;
        }
        
        .calendar-container .react-calendar__tile {
          height: auto !important;
          min-height: 60px;
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          justify-content: flex-start;
          padding: 2px 1px 1px 1px;
          border: 1px solid #e5e7eb;
          position: relative;
          font-size: 10px;
          line-height: 1.2;
        }
        
        @media (min-width: 640px) {
          .calendar-container .react-calendar__tile {
            min-height: 90px;
            padding: 6px 4px 4px 4px;
            font-size: 14px;
          }
        }
        
        @media (max-height: 700px) and (max-width: 639px) {
          .calendar-container .react-calendar__tile {
            min-height: 50px;
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
          height: 32px;
          margin-bottom: 0.5rem;
          flex-shrink: 0;
        }
        
        @media (min-width: 640px) {
          .calendar-container .react-calendar__navigation {
            height: 44px;
            margin-bottom: 1rem;
          }
        }
        
        .calendar-container .react-calendar__navigation button {
          min-width: 32px;
          background: none;
          border: none;
          color: #374151;
          font-size: 12px;
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
          font-size: 9px;
          color: #6b7280;
          flex-shrink: 0;
        }
        
        @media (min-width: 640px) {
          .calendar-container .react-calendar__month-view__weekdays {
            font-size: 12px;
          }
        }
        
        .calendar-container .react-calendar__month-view__weekdays__weekday {
          padding: 0.2rem 0;
        }
        
        @media (min-width: 640px) {
          .calendar-container .react-calendar__month-view__weekdays__weekday {
            padding: 0.5rem 0;
          }
        }
        
        /* スマホでの詳細調整 */
        @media (max-width: 639px) {
          .calendar-container .react-calendar__tile {
            overflow: hidden;
          }
          
          /* 日付番号のサイズ調整 */
          .calendar-container .react-calendar__tile abbr {
            font-size: 9px;
            font-weight: 500;
          }
        }
      `}</style>
    </div>
  );
};