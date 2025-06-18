import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Card } from '../ui/Card';
import { format } from 'date-fns';

interface HealthDataChartProps {
  data: Array<{
    date: string;
    weight?: number;
    bodyFatPercentage?: number;
  }>;
}

export const HealthDataChart: React.FC<HealthDataChartProps> = ({ data }) => {
  if (!data || data.length === 0) {
    return (
      <Card>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">健康データ推移</h3>
        <div className="h-64 flex items-center justify-center text-gray-500">
          <p>データがありません</p>
        </div>
      </Card>
    );
  }

  // データを日付順にソート
  const sortedData = [...data].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  // チャート用にデータを整形
  const chartData = sortedData.map(item => ({
    ...item,
    formattedDate: format(new Date(item.date), 'MM/dd'),
  }));

  return (
    <Card>
      <h3 className="text-lg font-semibold text-gray-900 mb-4">健康データ推移（過去30日間）</h3>
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="formattedDate" 
              tick={{ fontSize: 12 }}
            />
            <YAxis 
              yAxisId="weight"
              orientation="left"
              tick={{ fontSize: 12 }}
              label={{ value: '体重 (kg)', angle: -90, position: 'insideLeft' }}
            />
            <YAxis 
              yAxisId="bodyFat"
              orientation="right"
              tick={{ fontSize: 12 }}
              label={{ value: '体脂肪率 (%)', angle: 90, position: 'insideRight' }}
            />
            <Tooltip 
              labelFormatter={(label) => `日付: ${label}`}
              formatter={(value, name) => [
                typeof value === 'number' ? value.toFixed(1) : value,
                name === 'weight' ? '体重 (kg)' : '体脂肪率 (%)'
              ]}
            />
            <Legend />
            <Line
              yAxisId="weight"
              type="monotone"
              dataKey="weight"
              stroke="#3b82f6"
              strokeWidth={2}
              dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
              name="体重"
              connectNulls={false}
            />
            <Line
              yAxisId="bodyFat"
              type="monotone"
              dataKey="bodyFatPercentage"
              stroke="#10b981"
              strokeWidth={2}
              dot={{ fill: '#10b981', strokeWidth: 2, r: 4 }}
              name="体脂肪率"
              connectNulls={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
      
      {/* 統計情報 */}
      <div className="mt-4 pt-4 border-t border-gray-200">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          {(() => {
            const weights = sortedData.filter(d => d.weight).map(d => d.weight!);
            const bodyFats = sortedData.filter(d => d.bodyFatPercentage).map(d => d.bodyFatPercentage!);
            
            return (
              <>
                {weights.length > 0 && (
                  <>
                    <div className="text-center">
                      <p className="text-gray-600">最新体重</p>
                      <p className="font-semibold text-blue-600">{weights[weights.length - 1].toFixed(1)}kg</p>
                    </div>
                    <div className="text-center">
                      <p className="text-gray-600">平均体重</p>
                      <p className="font-semibold text-blue-600">
                        {(weights.reduce((a, b) => a + b, 0) / weights.length).toFixed(1)}kg
                      </p>
                    </div>
                  </>
                )}
                {bodyFats.length > 0 && (
                  <>
                    <div className="text-center">
                      <p className="text-gray-600">最新体脂肪率</p>
                      <p className="font-semibold text-green-600">{bodyFats[bodyFats.length - 1].toFixed(1)}%</p>
                    </div>
                    <div className="text-center">
                      <p className="text-gray-600">平均体脂肪率</p>
                      <p className="font-semibold text-green-600">
                        {(bodyFats.reduce((a, b) => a + b, 0) / bodyFats.length).toFixed(1)}%
                      </p>
                    </div>
                  </>
                )}
              </>
            );
          })()}
        </div>
      </div>
    </Card>
  );
};