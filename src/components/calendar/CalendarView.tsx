import React, { useState, useEffect } from 'react';
import Calendar from 'react-calendar';
import { format, isSameDay } from 'date-fns';
import { ChevronLeft, ChevronRight, PersonStanding, Dumbbell, BookOpen } from 'lucide-react';
import { useAppStore } from '../../store/appStore';
import { cn } from '../../utils/cn';
import 'react-calendar/dist/Calendar.css';

export const CalendarView: React.FC = () => {
  const { 
    currentDate, 
    dailyRecords, 
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
    
    if (!record) return null;

    const hasRunning = record.training.running;
    const hasStrength = record.training.strength;
    const hasStudy = record.studyProgress.length > 0;

    return (
      <div className="mt-1 w-full">
        {/* アクティビティアイコン */}
        <div className="flex justify-center items-center gap-1 mb-1">
          {hasRunning && (
            <PersonStanding className="w-3 h-3 text-blue-600" title="ランニング" />
          )}
          {hasStrength && (
            <Dumbbell className="w-3 h-3 text-green-600" title="筋力トレーニング" />
          )}
          {hasStudy && (
            <BookOpen className="w-3 h-3 text-amber-600" title="学習" />
          )}
        </div>
        
        {/* 詳細情報 */}
        <div className="text-xs text-gray-600 leading-tight text-center">
          {hasStudy && (
            <div className="truncate">
              {record.studyProgress.length}章完了
            </div>
          )}
        </div>
      </div>
    );
  };

  const getTileClassName = ({ date }: { date: Date }) => {
    const record = dailyRecords.find(r => isSameDay(new Date(r.date), date));
    const hasActivity = record && (record.training.running || record.training.strength || record.studyProgress.length > 0);
    
    return cn(
      'hover:bg-blue-50 transition-colors duration-200 cursor-pointer relative group',
      hasActivity && 'bg-blue-50 border-blue-200'
    );
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-900">トレーニングカレンダー</h2>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-4 text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <PersonStanding className="w-4 h-4 text-blue-600" />
              <span>ランニング</span>
            </div>
            <div className="flex items-center gap-2">
              <Dumbbell className="w-4 h-4 text-green-600" />
              <span>筋力トレーニング</span>
            </div>
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-amber-600" />
              <span>学習</span>
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
          prevLabel={<ChevronLeft className="h-4 w-4" />}
          nextLabel={<ChevronRight className="h-4 w-4" />}
        />
      </div>

      {/* カレンダーの詳細表示エリア */}
      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <h3 className="text-sm font-medium text-gray-700 mb-3">カレンダーの見方</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
          <div className="flex items-center gap-3">
            <PersonStanding className="w-4 h-4 text-blue-600 flex-shrink-0" />
            <span>ランニングを実施した日</span>
          </div>
          <div className="flex items-center gap-3">
            <Dumbbell className="w-4 h-4 text-green-600 flex-shrink-0" />
            <span>筋力トレーニングを実施した日</span>
          </div>
          <div className="flex items-center gap-3">
            <BookOpen className="w-4 h-4 text-amber-600 flex-shrink-0" />
            <span>学習を行った日</span>
          </div>
        </div>
        <p className="text-xs text-gray-500 mt-3">
          日付をクリックすると、その日の詳細記録を編集できます。
        </p>
      </div>

      <style>{`
        .calendar-container .react-calendar {
          width: 100%;
          border: none;
          font-family: inherit;
        }
        
        .calendar-container .react-calendar__tile {
          height: 85px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: flex-start;
          padding: 6px 4px 4px 4px;
          border: 1px solid #e5e7eb;
          position: relative;
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
          height: 44px;
          margin-bottom: 1rem;
        }
        
        .calendar-container .react-calendar__navigation button {
          min-width: 44px;
          background: none;
          border: none;
          color: #374151;
          font-size: 16px;
          font-weight: 500;
        }
        
        .calendar-container .react-calendar__navigation button:hover {
          background: #f3f4f6;
        }
        
        .calendar-container .react-calendar__month-view__weekdays {
          text-align: center;
          text-transform: uppercase;
          font-weight: 500;
          font-size: 12px;
          color: #6b7280;
        }
        
        .calendar-container .react-calendar__month-view__weekdays__weekday {
          padding: 0.5rem 0;
        }
      `}</style>
    </div>
  );
};