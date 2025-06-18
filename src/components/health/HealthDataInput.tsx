import React, { useState, useEffect } from 'react';
import { Scale, Activity, Smartphone, Plus } from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { useAppStore } from '../../store/appStore';
import { useAuthStore } from '../../store/authStore';

// Capacitorの機能検出
const isNativeApp = () => {
  return window.Capacitor !== undefined;
};

export const HealthDataInput: React.FC = () => {
  const [weight, setWeight] = useState('');
  const [bodyFat, setBodyFat] = useState('');
  const [isHealthKitAvailable, setIsHealthKitAvailable] = useState(false);
  const [healthData, setHealthData] = useState<Array<{
    date: string;
    weight?: number;
    bodyFatPercentage?: number;
  }>>([]);

  const { user } = useAuthStore();

  useEffect(() => {
    checkHealthKitAvailability();
    loadRecentHealthData();
  }, []);

  const checkHealthKitAvailability = async () => {
    if (isNativeApp()) {
      try {
        // Capacitorプラグインが利用可能かチェック
        const { Health } = await import('@capacitor-community/health');
        const available = await Health.isAvailable();
        setIsHealthKitAvailable(available.value);
      } catch (error) {
        console.log('HealthKit not available:', error);
        setIsHealthKitAvailable(false);
      }
    }
  };

  const requestHealthKitPermissions = async () => {
    if (!isHealthKitAvailable) return false;

    try {
      const { Health } = await import('@capacitor-community/health');
      const result = await Health.requestAuthorization({
        read: ['weight', 'body_fat_percentage'],
        write: []
      });
      return result.granted;
    } catch (error) {
      console.error('HealthKit permission error:', error);
      return false;
    }
  };

  const syncFromHealthKit = async () => {
    if (!isHealthKitAvailable) return;

    try {
      const hasPermission = await requestHealthKitPermissions();
      if (!hasPermission) {
        alert('ヘルスケアへのアクセス権限が必要です');
        return;
      }

      const { Health } = await import('@capacitor-community/health');
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(endDate.getDate() - 30);

      // 体重データを取得
      const weightResult = await Health.queryHKitSampleType({
        sampleName: 'weight',
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        limit: 30
      });

      // 体脂肪率データを取得
      const bodyFatResult = await Health.queryHKitSampleType({
        sampleName: 'body_fat_percentage',
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        limit: 30
      });

      // データをマージして表示
      const mergedData = weightResult.resultData.map((weightItem: any) => {
        const date = weightItem.startDate.split('T')[0];
        const bodyFatItem = bodyFatResult.resultData.find((bf: any) => 
          bf.startDate.split('T')[0] === date
        );

        return {
          date,
          weight: parseFloat(weightItem.value),
          bodyFatPercentage: bodyFatItem ? parseFloat(bodyFatItem.value) * 100 : undefined
        };
      });

      setHealthData(mergedData);
      
      // 最新のデータを入力フィールドに設定
      if (mergedData.length > 0) {
        const latest = mergedData[mergedData.length - 1];
        if (latest.weight) setWeight(latest.weight.toString());
        if (latest.bodyFatPercentage) setBodyFat(latest.bodyFatPercentage.toFixed(1));
      }

      alert(`${mergedData.length}件のデータを同期しました`);
    } catch (error) {
      console.error('HealthKit sync error:', error);
      alert('ヘルスケアデータの同期に失敗しました');
    }
  };

  const saveHealthData = async () => {
    if (!weight && !bodyFat) {
      alert('体重または体脂肪率を入力してください');
      return;
    }

    try {
      // TODO: Supabaseに保存する処理を実装
      const healthRecord = {
        userId: user?.id,
        date: new Date().toISOString().split('T')[0],
        weight: weight ? parseFloat(weight) : undefined,
        bodyFatPercentage: bodyFat ? parseFloat(bodyFat) : undefined,
      };

      console.log('Saving health data:', healthRecord);
      
      // 一時的にローカル状態に追加
      setHealthData(prev => [...prev, {
        date: healthRecord.date,
        weight: healthRecord.weight,
        bodyFatPercentage: healthRecord.bodyFatPercentage
      }]);

      setWeight('');
      setBodyFat('');
      alert('健康データを保存しました');
    } catch (error) {
      console.error('Health data save error:', error);
      alert('データの保存に失敗しました');
    }
  };

  const loadRecentHealthData = () => {
    // TODO: Supabaseから過去のデータを読み込む
    // 現在はモックデータ
    setHealthData([
      { date: '2024-01-15', weight: 70.5, bodyFatPercentage: 15.2 },
      { date: '2024-01-14', weight: 70.8, bodyFatPercentage: 15.4 },
    ]);
  };

  return (
    <div className="space-y-6">
      <Card>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Scale className="h-5 w-5" />
            健康データ
          </h3>
          
          {isNativeApp() && (
            <div className="flex items-center gap-2 text-sm text-green-600">
              <Smartphone className="h-4 w-4" />
              <span>ネイティブアプリ</span>
            </div>
          )}
        </div>

        {/* ヘルスケア同期ボタン（ネイティブアプリの場合のみ表示） */}
        {isHealthKitAvailable && (
          <div className="mb-6 p-4 bg-blue-50 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-medium text-blue-900">iOSヘルスケア連携</h4>
                <p className="text-xs text-blue-700 mt-1">
                  ヘルスケアアプリからデータを自動取得できます
                </p>
              </div>
              <Button
                onClick={syncFromHealthKit}
                size="sm"
                className="flex items-center gap-2"
              >
                <Activity className="h-4 w-4" />
                同期
              </Button>
            </div>
          </div>
        )}

        {/* 手動入力フォーム */}
        <div className="space-y-4">
          <h4 className="text-sm font-medium text-gray-700">手動入力</h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
            onClick={saveHealthData}
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            記録を保存
          </Button>
        </div>

        {/* 最近のデータ表示 */}
        {healthData.length > 0 && (
          <div className="mt-6 pt-6 border-t border-gray-200">
            <h4 className="text-sm font-medium text-gray-700 mb-3">最近の記録</h4>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {healthData.slice(-5).reverse().map((record, index) => (
                <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                  <span className="text-sm text-gray-600">{record.date}</span>
                  <div className="flex items-center gap-4 text-sm">
                    {record.weight && (
                      <span className="text-blue-600">{record.weight}kg</span>
                    )}
                    {record.bodyFatPercentage && (
                      <span className="text-green-600">{record.bodyFatPercentage.toFixed(1)}%</span>
                    )}
                  </div>
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
          <p>• 現在の環境: {isNativeApp() ? 'ネイティブアプリ' : 'Webブラウザ'}</p>
          <p>• ヘルスケア連携: {isHealthKitAvailable ? '利用可能' : '利用不可'}</p>
          <p>• データ保存: 手動入力のみ対応（Supabase連携は実装予定）</p>
        </div>
      </Card>
    </div>
  );
};