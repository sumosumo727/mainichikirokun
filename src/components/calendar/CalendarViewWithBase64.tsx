import React, { useState, useEffect } from 'react';
import Calendar from 'react-calendar';
import { format, isSameDay } from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useAppStore } from '../../store/appStore';
import { Base64Icon, iconData } from '../ui/Base64Icon';
import { cn } from '../../utils/cn';
import 'react-calendar/dist/Calendar.css';

export const CalendarViewWithBase64: React.FC = () => {
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

    const hasTrainingData = hasRunning || hasStrength;

    return (
      <div className="mt-1 w-full h-full flex flex-col justify-between">
        {/* 1段目: トレーニングアイコン */}
        {hasTrainingData && (
          <div className="flex justify-center items-center gap-1 h-4">
            {hasStrength && (
              <div className="w-4 h-4 bg-green-100 rounded-full flex items-center justify-center">
                <Base64Icon 
                  base64Data={iconData.dumbbell} 
                  alt="筋力トレーニング" 
                  size={10}
                />
              </div>
            )}
            {hasRunning && (
              <div className="w-4 h-4 bg-blue-100 rounded-full flex items-center justify-center">
                <Base64Icon 
                  base64Data={iconData.bicycle} 
                  alt="有酸素" 
                  size={10}
                />
              </div>
            )}
          </div>
        )}
        
        {/* 2段目: 体重データまたは学習データ */}
        <div className="flex justify-center items-center h-4">
          {hasHealthData ? (
            <div className="flex items-center gap-1">
              <div className="w-4 h-4 bg-purple-100 rounded-full flex items-center justify-center">
                <Base64Icon 
                  base64Data={iconData.scale} 
                  alt="体重・体脂肪率" 
                  size={10}
                />
              </div>
              <span className="text-xs text-purple-700 font-medium">
                {hasWeight && `${health?.weight}kg`}
                {hasWeight && hasBodyFat && '/'}
                {hasBodyFat && `${health?.bodyFatPercentage}%`}
              </span>
            </div>
          ) : hasStudy ? (
            <div className="flex items-center gap-1">
              <div className="w-4 h-4 bg-amber-100 rounded-full flex items-center justify-center">
                <Base64Icon 
                  base64Data={iconData.notebook} 
                  alt="学習" 
                  size={10}
                />
              </div>
              <span className="text-xs text-amber-700 font-medium">
                {record?.studyProgress.length}章
              </span>
            </div>
          ) : null}
        </div>
        
        {/* 3段目: 学習データ（体重データがある場合のみ） */}
        {hasHealthData && hasStudy && (
          <div className="flex justify-center items-center h-4">
            <div className="flex items-center gap-1">
              <div className="w-4 h-4 bg-amber-100 rounded-full flex items-center justify-center">
                <Base64Icon 
                  base64Data={iconData.notebook} 
                  alt="学習" 
                  size={10}
                />
              </div>
              <span className="text-xs text-amber-700 font-medium">
                {record?.studyProgress.length}章
              </span>
            </div>
          </div>
        )}

        {/* トレーニングデータがない場合の上詰め表示 */}
        {!hasTrainingData && (
          <>
            <div className="flex justify-center items-center h-4">
              {hasHealthData ? (
                <div className="flex items-center gap-1">
                  <div className="w-4 h-4 bg-purple-100 rounded-full flex items-center justify-center">
                    <Base64Icon 
                      base64Data={iconData.scale} 
                      alt="体重・体脂肪率" 
                      size={10}
                    />
                  </div>
                  <span className="text-xs text-purple-700 font-medium">
                    {hasWeight && `${health?.weight}kg`}
                    {hasWeight && hasBodyFat && '/'}
                    {hasBodyFat && `${health?.bodyFatPercentage}%`}
                  </span>
                </div>
              ) : hasStudy ? (
                <div className="flex items-center gap-1">
                  <div className="w-4 h-4 bg-amber-100 rounded-full flex items-center justify-center">
                    <Base64Icon 
                      base64Data={iconData.notebook} 
                      alt="学習" 
                      size={10}
                    />
                  </div>
                  <span className="text-xs text-amber-700 font-medium">
                    {record?.studyProgress.length}章
                  </span>
                </div>
              ) : null}
            </div>
            
            {hasHealthData && hasStudy && (
              <div className="flex justify-center items-center h-4">
                <div className="flex items-center gap-1">
                  <div className="w-4 h-4 bg-amber-100 rounded-full flex items-center justify-center">
                    <Base64Icon 
                      base64Data={iconData.notebook} 
                      alt="学習" 
                      size={10}
                    />
                  </div>
                  <span className="text-xs text-amber-700 font-medium">
                    {record?.studyProgress.length}章
                  </span>
                </div>
              </div>
            )}
          </>
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
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-900">トレーニング・学習・体重記録</h2>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-4 text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 bg-blue-100 rounded-full flex items-center justify-center">
                <Base64Icon base64Data={iconData.bicycle} alt="有酸素" size={12} />
              </div>
              <span>有酸素</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center">
                <Base64Icon base64Data={iconData.dumbbell} alt="筋力トレーニング" size={12} />
              </div>
              <span>筋力トレーニング</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 bg-amber-100 rounded-full flex items-center justify-center">
                <Base64Icon base64Data={iconData.notebook} alt="学習" size={12} />
              </div>
              <span>学習</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 bg-purple-100 rounded-full flex items-center justify-center">
                <Base64Icon base64Data={iconData.scale} alt="体重・体脂肪率" size={12} />
              </div>
              <span>体重・体脂肪率</span>
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

      <style>{`
        .calendar-container .react-calendar {
          width: 100%;
          border: none;
          font-family: inherit;
        }
        
        .calendar-container .react-calendar__tile {
          height: 110px;
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