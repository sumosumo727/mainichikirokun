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
            <Button
              variant={period === 'year' ? 'primary' : 'outline'}
              size="sm"
              onClick={() => onPeriodChange('year')}
            >
              年間
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
          <Button
            variant={period === 'year' ? 'primary' : 'outline'}
            size="sm"
            onClick={() => onPeriodChange('year')}
          >
            年間
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
                return period === 'year' 
                  ? `${date.getMonth() + 1}/${date.getDate()}`
                  : `${date.getMonth() + 1}/${date.getDate()}`;
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

      {/* 統計情報 */}
      <div className="mt-4 pt-4 border-t border-gray-200">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          {hasWeightData && (
            <>
              <div className="text-center">
                <div className="text-purple-600 font-medium">最新体重</div>
                <div className="text-lg font-bold text-gray-900">
                  {weights.length > 0 ? `${weights[weights.length - 1]}kg` : '-'}
                </div>
              </div>
              <div className="text-center">
                <div className="text-purple-600 font-medium">体重変化</div>
                <div className="text-lg font-bold text-gray-900">
                  {weights.length >= 2 
                    ? `${weights[weights.length - 1] - weights[0] >= 0 ? '+' : ''}${(weights[weights.length - 1] - weights[0]).toFixed(1)}kg`
                    : '-'
                  }
                </div>
                <div className="text-xs text-gray-500 mt-1">期間全体</div>
              </div>
            </>
          )}
          
          {hasBodyFatData && (
            <>
              <div className="text-center">
                <div className="text-amber-600 font-medium">最新体脂肪率</div>
                <div className="text-lg font-bold text-gray-900">
                  {bodyFats.length > 0 ? `${bodyFats[bodyFats.length - 1]}%` : '-'}
                </div>
              </div>
              <div className="text-center">
                <div className="text-amber-600 font-medium">体脂肪率変化</div>
                <div className="text-lg font-bold text-gray-900">
                  {bodyFats.length >= 2 
                    ? `${bodyFats[bodyFats.length - 1] - bodyFats[0] >= 0 ? '+' : ''}${(bodyFats[bodyFats.length - 1] - bodyFats[0]).toFixed(1)}%`
                    : '-'
                  }
                </div>
                <div className="text-xs text-gray-500 mt-1">期間全体</div>
              </div>
            </>
          )}
        </div>
      </div>
    </Card>
  );
};