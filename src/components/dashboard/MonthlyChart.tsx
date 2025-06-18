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
  const currentMonth = data[data.length - 1];
  const pieData = [
    { name: 'Running', value: currentMonth?.running || 0 },
    { name: 'Strength', value: currentMonth?.strength || 0 },
    { name: 'Study', value: currentMonth?.study || 0 },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Monthly Progress</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="running" fill="#3b82f6" name="Running" />
              <Bar dataKey="strength" fill="#10b981" name="Strength" />
              <Bar dataKey="study" fill="#f59e0b" name="Study" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <Card>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Current Month Distribution</h3>
        <div className="h-64">
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
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </div>
  );
};