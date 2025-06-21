import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { Card } from '../ui/Card';
import { Scale, Activity, TrendingUp, TrendingDown } from 'lucide-react';
import { format, parseISO } from 'date-fns';

interface HealthChartProps {
  data: Array<{
    date: string;
    weight?: number | null;
    bodyFatPercentage?: number | null;
  }>;
}

export const HealthChart: React.FC<HealthChartProps> = ({ data }) => {
  if (!data || data.length === 0) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Scale className="h-5 w-5" />
            体重の推移
          </h3>
          <div className="h-64 flex items-center justify-center text-gray-500">
            <p>データがありません</p>
          </div>
        </Card>
        <Card>
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Activity className="h-5 w-5" />
            体脂肪率の推移
          </h3>
          <div className="h-64 flex items-center justify-center text-gray-500">
            <p>データがありません</p>
          </div>
        </Card>
      </div>
    );
  }

  // データを日付順にソート
  const sortedData = [...data]
    .filter(item => item.weight !== null || item.bodyFatPercentage !== null)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .map(item => ({
      ...item,
      formattedDate: format(parseISO(item.date), 'MM/dd'),
    }));

  // 体重データのみを抽出
  const weightData = sortedData.filter(item => item.weight !== null);
  
  // 体脂肪率データのみを抽出
  const bodyFatData = sortedData.filter(item => item.bodyFatPercentage !== null);

  // 最新の値と変化を計算
  const getLatestChange = (dataArray: typeof sortedData, key: 'weight' | 'bodyFatPercentage') => {
    const validData = dataArray.filter(item => item[key] !== null);
    if (validData.length < 2) return null;
    
    const latest = validData[validData.length - 1][key]!;
    const previous = validData[validData.length - 2][key]!;
    const change = latest - previous;
    
    return {
      latest,
      change,
      isPositive: change > 0,
    };
  };

  const weightChange = getLatestChange(weightData, 'weight');
  const bodyFatChange = getLatestChange(bodyFatData, 'bodyFatPercentage');

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* 体重チャート */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Scale className="h-5 w-5 text-blue-600" />
            体重の推移
          </h3>
          {weightChange && (
            <div className="flex items-center gap-1 text-sm">
              {weightChange.isPositive ? (
                <TrendingUp className="h-4 w-4 text-red-500" />
              ) : (
                <TrendingDown className="h-4 w-4 text-green-500" />
              )}
              <span className={weightChange.isPositive ? 'text-red-600' : 'text-green-600'}>
                {weightChange.isPositive ? '+' : ''}{weightChange.change.toFixed(1)}kg
              </span>
            </div>
          )}
        </div>
        
        <div className="h-64">
          {weightData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={weightData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="formattedDate" 
                  tick={{ fontSize: 12 }}
                />
                <YAxis 
                  domain={['dataMin - 2', 'dataMax + 2']}
                  tick={{ fontSize: 12 }}
                />
                <Tooltip 
                  labelFormatter={(label, payload) => {
                    if (payload && payload[0]) {
                      const originalData = payload[0].payload;
                      return format(parseISO(originalData.date), 'yyyy年M月d日');
                    }
                    return label;
                  }}
                  formatter={(value) => [`${value}kg`, '体重']}
                />
                <Line 
                  type="monotone" 
                  dataKey="weight" 
                  stroke="#3b82f6" 
                  strokeWidth={2}
                  dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-full text-gray-500">
              <p>体重データがありません</p>
            </div>
          )}
        </div>
        
        {weightChange && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">最新の体重</span>
              <span className="font-medium">{weightChange.latest}kg</span>
            </div>
          </div>
        )}
      </Card>

      {/* 体脂肪率チャート */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Activity className="h-5 w-5 text-green-600" />
            体脂肪率の推移
          </h3>
          {bodyFatChange && (
            <div className="flex items-center gap-1 text-sm">
              {bodyFatChange.isPositive ? (
                <TrendingUp className="h-4 w-4 text-red-500" />
              ) : (
                <TrendingDown className="h-4 w-4 text-green-500" />
              )}
              <span className={bodyFatChange.isPositive ? 'text-red-600' : 'text-green-600'}>
                {bodyFatChange.isPositive ? '+' : ''}{bodyFatChange.change.toFixed(1)}%
              </span>
            </div>
          )}
        </div>
        
        <div className="h-64">
          {bodyFatData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={bodyFatData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="formattedDate" 
                  tick={{ fontSize: 12 }}
                />
                <YAxis 
                  domain={['dataMin - 2', 'dataMax + 2']}
                  tick={{ fontSize: 12 }}
                />
                <Tooltip 
                  labelFormatter={(label, payload) => {
                    if (payload && payload[0]) {
                      const originalData = payload[0].payload;
                      return format(parseISO(originalData.date), 'yyyy年M月d日');
                    }
                    return label;
                  }}
                  formatter={(value) => [`${value}%`, '体脂肪率']}
                />
                <Line 
                  type="monotone" 
                  dataKey="bodyFatPercentage" 
                  stroke="#10b981" 
                  strokeWidth={2}
                  dot={{ fill: '#10b981', strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-full text-gray-500">
              <p>体脂肪率データがありません</p>
            </div>
          )}
        </div>
        
        {bodyFatChange && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">最新の体脂肪率</span>
              <span className="font-medium">{bodyFatChange.latest}%</span>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
};