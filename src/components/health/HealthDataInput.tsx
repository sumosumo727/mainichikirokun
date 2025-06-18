import React, { useState, useEffect } from 'react';
import { Scale, Activity, Smartphone, Plus, Trash2 } from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { useHealthStore } from '../../store/healthStore';
import { useAuthStore } from '../../store/authStore';
import { format } from 'date-fns';

export const HealthDataInput: React.FC = () => {
  const [weight, setWeight] = useState('');
  const [bodyFat, setBodyFat] = useState('');
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  
  const { user } = useAuthStore();
  const { 
    healthData, 
    addHealthData, 
    deleteHealthData, 
    isHealthKitAvailable, 
    syncFromHealthKit,
    isLoading 
  } = useHealthStore();

  // 最近7日間のデータを取得
  const recentData = healthData
    .slice(-7)
    .reverse();

  const handleSave = () => {
    if (!weight && !bodyFat) {
      alert('体重または体脂肪率を入力してください');
      return;
    }

    if (!user) {
      alert('ログインが必要です');
      return;
    }

    // 同じ日付のデータが既に存在するかチェック
    const existingData = healthData.find(item => item.date === selectedDate);
    if (existingData) {
      if (!confirm('この日付のデータは既に存在します。上書きしますか？')) {
        return;
      }
      deleteHealthData(existingData.id);
    }

    addHealthData({
      userId: user.id,
      date: selectedDate,
      weight: weight ? parseFloat(weight) : undefined,
      bodyFatPercentage: bodyFat ? parseFloat(bodyFat) : undefined,
    });

    setWeight('');
    setBodyFat('');
    setSelectedDate(format(new Date(), 'yyyy-MM-dd'));
    alert('健康データを保存しました');
  };

  const handleDelete = (id: string) => {
    if (confirm('このデータを削除しますか？')) {
      deleteHealthData(id);
    }
  };

  const handleHealthKitSync = async () => {
    try {
      await syncFromHealthKit();
      alert('ヘルスケアデータを同期しました');
    } catch (error) {
      alert('同期に失敗しました');
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Scale className="h-5 w-5" />
            健康データ入力
          </h3>
          
          {isHealthKitAvailable() && (
            <div className="flex items-center gap-2 text-sm text-green-600">
              <Smartphone className="h-4 w-4" />
              <span>ネイティブアプリ</span>
            </div>
          )}
        </div>

        {/* ヘルスケア同期ボタン（ネイティブアプリの場合のみ表示） */}
        {isHealthKitAvailable() && (
          <div className="mb-6 p-4 bg-blue-50 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-medium text-blue-900">iOSヘルスケア連携</h4>
                <p className="text-xs text-blue-700 mt-1">
                  ヘルスケアアプリからデータを自動取得できます
                </p>
              </div>
              <Button
                onClick={handleHealthKitSync}
                size="sm"
                className="flex items-center gap-2"
                disabled={isLoading}
              >
                <Activity className="h-4 w-4" />
                {isLoading ? '同期中...' : '同期'}
              </Button>
            </div>
          </div>
        )}

        {/* 手動入力フォーム */}
        <div className="space-y-4">
          <h4 className="text-sm font-medium text-gray-700">手動入力</h4>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input
              label="日付"
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
            />
            <Input
              label="体重 (kg)"
              type="number"
              step="0.1"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              placeholder="70.5"
            />
            <Input
              label="体脂肪率 (%)"
              type="number"
              step="0.1"
              value={bodyFat}
              onChange={(e) => setBodyFat(e.target.value)}
              placeholder="15.2"
            />
          </div>

          <Button
            onClick={handleSave}
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            記録を保存
          </Button>
        </div>

        {/* 最近のデータ表示 */}
        {recentData.length > 0 && (
          <div className="mt-6 pt-6 border-t border-gray-200">
            <h4 className="text-sm font-medium text-gray-700 mb-3">最近の記録</h4>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {recentData.map((record) => (
                <div key={record.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-4">
                    <span className="text-sm font-medium text-gray-900">
                      {format(new Date(record.date), 'yyyy/MM/dd')}
                    </span>
                    <div className="flex items-center gap-4 text-sm">
                      {record.weight && (
                        <span className="text-blue-600 font-medium">{record.weight}kg</span>
                      )}
                      {record.bodyFatPercentage && (
                        <span className="text-green-600 font-medium">{record.bodyFatPercentage.toFixed(1)}%</span>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => handleDelete(record.id)}
                    className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                    title="削除"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </Card>

      {/* 開発情報 */}
      <Card className="bg-gray-50">
        <h4 className="text-sm font-medium text-gray-700 mb-2">開発情報</h4>
        <div className="text-xs text-gray-600 space-y-1">
          <p>• 現在の環境: {isHealthKitAvailable() ? 'ネイティブアプリ' : 'Webブラウザ'}</p>
          <p>• ヘルスケア連携: {isHealthKitAvailable() ? '利用可能' : '利用不可（ネイティブアプリ化後に対応）'}</p>
          <p>• データ保存: ローカルストレージ（将来的にSupabase連携予定）</p>
          <p>• 記録件数: {healthData.length}件</p>
        </div>
      </Card>
    </div>
  );
};