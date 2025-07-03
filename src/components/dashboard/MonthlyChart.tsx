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
  trainingDistribution: {
    running: number;
    strength: number;
  };
}

const COLORS = ['#3b82f6', '#10b981'];

export const MonthlyChart: React.FC<MonthlyChartProps> = ({ data, trainingDistribution }) => {
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
          <h3 className="text-lg font-semibold text-gray-900 mb-4">トレーニング比率</h3>
          <div className="h-64 flex items-center justify-center text-gray-500">
            <p>データがありません</p>
          </div>
        </Card>
      </div>
    );
  }

  // トレーニング比率のデータを準備
  const pieData = [
    { name: '有酸素運動', value: trainingDistribution.running },
    { name: '筋力トレーニング', value: trainingDistribution.strength },
  ].filter(item => item.value > 0);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">月次進捗</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="month" 
                tickFormatter={(value) => {
                  // YYYY/MM形式をMM月形式に変換
                  const [year, month] = value.split('/');
                  return `${parseInt(month)}月`;
                }}
              />
              <YAxis />
              <Tooltip 
                labelFormatter={(label) => {
                  // YYYY/MM形式をYYYY年MM月形式に変換
                  const [year, month] = label.split('/');
                  return `${year}年${parseInt(month)}月`;
                }}
                formatter={(value, name) => [
                  `${value}日`,
                  name === 'running' ? '有酸素運動' : 
                  name === 'strength' ? '筋力トレーニング' : '学習進捗'
                ]}
              />
              <Bar dataKey="running" fill="#3b82f6" name="有酸素運動" />
              <Bar dataKey="strength" fill="#10b981" name="筋力トレーニング" />
              <Bar dataKey="study" fill="#f59e0b" name="学習進捗" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <Card>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">今月のトレーニング比率</h3>
        <div className="h-64">
          {pieData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name} ${value}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [`${value}%`, '']} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-full text-gray-500">
              <p>今月のトレーニングデータがありません</p>
            </div>
          )}
        </div>
        
        {/* 詳細な比率表示 */}
        {pieData.length > 0 && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-blue-600 rounded-full"></div>
                  <span>有酸素運動</span>
                </div>
                <span className="font-medium">{trainingDistribution.running}%</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-green-600 rounded-full"></div>
                  <span>筋力トレーニング</span>
                </div>
                <span className="font-medium">{trainingDistribution.strength}%</span>
              </div>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
};