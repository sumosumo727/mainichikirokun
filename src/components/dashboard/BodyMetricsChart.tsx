import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import type { BodyMetricsChartData, StatsPeriod } from '../../types';

interface BodyMetricsChartProps {
  data: BodyMetricsChartData[];
  period: StatsPeriod;
  onPeriodChange: (period: StatsPeriod) => void;
}

export const BodyMetricsChart: React.FC<BodyMetricsChartProps> = ({ 
  data, 
  period, 
  onPeriodChange 
}) => {
  // データに体重または体脂肪率が含まれているかチェック
  const hasWeightData = data.some(d => d.weight !== undefined && d.weight !== null);
  const hasBodyFatData = data.some(d => d.bodyFatPercentage !== undefined && d.bodyFatPercentage !== null);

  // 最新データと前回データを取得して差異を計算
  const getMetricsTrend = () => {
    if (data.length < 2) return null;

    const sortedData = [...data].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    const latest = sortedData[sortedData.length - 1];
    const previous = sortedData[sortedData.length - 2];

    const weightChange = latest.weight && previous.weight 
      ? {
          value: latest.weight - previous.weight,
          percentage: ((latest.weight - previous.weight) / previous.weight) * 100,
          isPositive: latest.weight >= previous.weight
        }
      : null;

    const bodyFatChange = latest.bodyFatPercentage && previous.bodyFatPercentage
      ? {
          value: latest.bodyFatPercentage - previous.bodyFatPercentage,
          percentage: ((latest.bodyFatPercentage - previous.bodyFatPercentage) / previous.bodyFatPercentage) * 100,
          isPositive: latest.bodyFatPercentage >= previous.bodyFatPercentage
        }
      : null;

    return {
      latest,
      previous,
      weightChange,
      bodyFatChange
    };
  };

  const trend = getMetricsTrend();

  if (!data || data.length === 0 || (!hasWeightData && !hasBodyFatData)) {
    return (
      <Card>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">体重・体脂肪率の推移</h3>
          <div className="flex gap-2">
            <Button
              variant={period === 'week' ? 'primary' : 'outline'}
              size="sm"
              onClick={() => onPeriodChange('week')}
            >
              週間
            </Button>
            <Button
              variant={period === 'month' ? 'primary' : 'outline'}
              size="sm"
              onClick={() => onPeriodChange('month')}
            >
              月間
            </Button>
          </div>
        </div>
        <div className="h-64 flex items-center justify-center text-gray-500">
          <p>体重・体脂肪率のデータがありません</p>
        </div>
      </Card>
    );
  }

  // Y軸の範囲を計算
  const weights = data.filter(d => d.weight !== undefined && d.weight !== null).map(d => d.weight!);
  const bodyFats = data.filter(d => d.bodyFatPercentage !== undefined && d.bodyFatPercentage !== null).map(d => d.bodyFatPercentage!);

  const weightDomain = weights.length > 0 ? [
    Math.max(0, Math.min(...weights) - 2),
    Math.max(...weights) + 2
  ] : undefined;

  const bodyFatDomain = bodyFats.length > 0 ? [
    Math.max(0, Math.min(...bodyFats) - 2),
    Math.min(100, Math.max(...bodyFats) + 2)
  ] : undefined;

  const TrendIcon = ({ change }: { change: { value: number; isPositive: boolean } | null }) => {
    if (!change) return <Minus className="w-4 h-4 text-gray-400" />;
    if (change.value === 0) return <Minus className="w-4 h-4 text-gray-400" />;
    return change.isPositive 
      ? <TrendingUp className="w-4 h-4 text-red-500" />
      : <TrendingDown className="w-4 h-4 text-green-500" />;
  };

  return (
    <Card>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">体重・体脂肪率の推移</h3>
        <div className="flex gap-2">
          <Button
            variant={period === 'week' ? 'primary' : 'outline'}
            size="sm"
            onClick={() => onPeriodChange('week')}
          >
            週間
          </Button>
          <Button
            variant={period === 'month' ? 'primary' : 'outline'}
            size="sm"
            onClick={() => onPeriodChange('month')}
          >
            月間
          </Button>
        </div>
      </div>

      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="date" 
              tick={{ fontSize: 12 }}
              tickFormatter={(value) => {
                const date = new Date(value);
                return `${date.getMonth() + 1}/${date.getDate()}`;
              }}
            />
            
            {/* 体重用のY軸 */}
            {hasWeightData && (
              <YAxis 
                yAxisId="weight"
                orientation="left"
                domain={weightDomain}
                tick={{ fontSize: 12 }}
                label={{ value: '体重 (kg)', angle: -90, position: 'insideLeft' }}
              />
            )}
            
            {/* 体脂肪率用のY軸 */}
            {hasBodyFatData && (
              <YAxis 
                yAxisId="bodyFat"
                orientation="right"
                domain={bodyFatDomain}
                tick={{ fontSize: 12 }}
                label={{ value: '体脂肪率 (%)', angle: 90, position: 'insideRight' }}
              />
            )}
            
            <Tooltip 
              labelFormatter={(label) => {
                const date = new Date(label);
                return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`;
              }}
              formatter={(value, name) => [
                value ? `${value}${name === 'weight' ? 'kg' : '%'}` : 'データなし',
                name === 'weight' ? '体重' : '体脂肪率'
              ]}
            />
            
            <Legend 
              formatter={(value) => value === 'weight' ? '体重' : '体脂肪率'}
            />
            
            {hasWeightData && (
              <Line
                yAxisId="weight"
                type="monotone"
                dataKey="weight"
                stroke="#8b5cf6"
                strokeWidth={2}
                dot={{ fill: '#8b5cf6', strokeWidth: 2, r: 4 }}
                connectNulls={false}
                name="weight"
              />
            )}
            
            {hasBodyFatData && (
              <Line
                yAxisId="bodyFat"
                type="monotone"
                dataKey="bodyFatPercentage"
                stroke="#f59e0b"
                strokeWidth={2}
                dot={{ fill: '#f59e0b', strokeWidth: 2, r: 4 }}
                connectNulls={false}
                name="bodyFatPercentage"
              />
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* 統計情報と前回との差異 */}
      <div className="mt-4 pt-4 border-t border-gray-200">
        <div className="grid grid-cols-2 md:grid-cols-2 gap-6 text-sm">
          {hasWeightData && (
            <div className="text-center">
              <div className="text-purple-600 font-medium">最新体重</div>
              <div className="text-lg font-bold text-gray-900">
                {trend?.latest.weight ? `${trend.latest.weight}kg` : '-'}
              </div>
              {trend?.weightChange && (
                <div className="flex items-center justify-center gap-1 mt-1">
                  <TrendIcon change={trend.weightChange} />
                  <span className={`text-xs font-medium ${
                    trend.weightChange.value === 0 ? 'text-gray-500' :
                    trend.weightChange.isPositive ? 'text-red-600' : 'text-green-600'
                  }`}>
                    前回比: {trend.weightChange.value === 0 ? '変化なし' :
                     `${trend.weightChange.value >= 0 ? '+' : ''}${trend.weightChange.value.toFixed(1)}kg`}
                  </span>
                </div>
              )}
            </div>
          )}
          
          {hasBodyFatData && (
            <div className="text-center">
              <div className="text-amber-600 font-medium">最新体脂肪率</div>
              <div className="text-lg font-bold text-gray-900">
                {trend?.latest.bodyFatPercentage ? `${trend.latest.bodyFatPercentage}%` : '-'}
              </div>
              {trend?.bodyFatChange && (
                <div className="flex items-center justify-center gap-1 mt-1">
                  <TrendIcon change={trend.bodyFatChange} />
                  <span className={`text-xs font-medium ${
                    trend.bodyFatChange.value === 0 ? 'text-gray-500' :
                    trend.bodyFatChange.isPositive ? 'text-red-600' : 'text-green-600'
                  }`}>
                    前回比: {trend.bodyFatChange.value === 0 ? '変化なし' :
                     `${trend.bodyFatChange.value >= 0 ? '+' : ''}${trend.bodyFatChange.value.toFixed(1)}%`}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </Card>
  );
};