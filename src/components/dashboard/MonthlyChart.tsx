import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Card } from '../ui/Card';

interface MonthlyChartProps {
  data: {
    month: string;
    running: number;
    strength: number;
    study: number;
  }[];
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b'];

export const MonthlyChart: React.FC<MonthlyChartProps> = ({ data }) => {
  if (!data || data.length === 0) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">月次進捗</h3>
          <div className="h-64 flex items-center justify-center text-gray-500">
            <p>データがありません</p>
          </div>
        </Card>
        <Card>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">今月の分布</h3>
          <div className="h-64 flex items-center justify-center text-gray-500">
            <p>データがありません</p>
          </div>
        </Card>
      </div>
    );
  }

  const currentMonth = data[data.length - 1];
  const pieData = [
    { name: 'ランニング', value: currentMonth?.running || 0 },
    { name: '筋力トレーニング', value: currentMonth?.strength || 0 },
    { name: '学習', value: currentMonth?.study || 0 },
  ].filter(item => item.value > 0); // 値が0のものは除外

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">月次進捗</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip 
                labelFormatter={(label) => `${label}月`}
                formatter={(value, name) => [
                  `${value}日`,
                  name === 'running' ? 'ランニング' : 
                  name === 'strength' ? '筋力トレーニング' : '学習'
                ]}
              />
              <Bar dataKey="running" fill="#3b82f6" name="ランニング" />
              <Bar dataKey="strength" fill="#10b981" name="筋力トレーニング" />
              <Bar dataKey="study" fill="#f59e0b" name="学習" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <Card>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">今月の分布</h3>
        <div className="h-64">
          {pieData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [`${value}日`, '']} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-full text-gray-500">
              <p>今月のデータがありません</p>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};