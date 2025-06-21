import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { Scale, Activity, Save } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { useAppStore } from '../../store/appStore';
import { useAuthStore } from '../../store/authStore';

interface HealthDataModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedDate: Date;
}

export const HealthDataModal: React.FC<HealthDataModalProps> = ({
  isOpen,
  onClose,
  selectedDate,
}) => {
  const { healthData, addHealthData, updateHealthData, isLoading } = useAppStore();
  const { user } = useAuthStore();
  
  const [weight, setWeight] = useState<string>('');
  const [bodyFatPercentage, setBodyFatPercentage] = useState<string>('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (selectedDate) {
      const dateString = format(selectedDate, 'yyyy-MM-dd');
      const existingData = healthData.find(data => data.date === dateString);
      
      if (existingData) {
        setWeight(existingData.weight?.toString() || '');
        setBodyFatPercentage(existingData.bodyFatPercentage?.toString() || '');
      } else {
        setWeight('');
        setBodyFatPercentage('');
      }
    }
    setErrors({});
  }, [selectedDate, healthData, isOpen]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (weight && (isNaN(Number(weight)) || Number(weight) <= 0 || Number(weight) > 999)) {
      newErrors.weight = '体重は0.1〜999.9kgの範囲で入力してください';
    }
    
    if (bodyFatPercentage && (isNaN(Number(bodyFatPercentage)) || Number(bodyFatPercentage) < 0 || Number(bodyFatPercentage) > 100)) {
      newErrors.bodyFatPercentage = '体脂肪率は0〜100%の範囲で入力してください';
    }
    
    if (!weight && !bodyFatPercentage) {
      newErrors.general = '体重または体脂肪率のいずれかを入力してください';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!selectedDate || !user || !validateForm()) return;

    const dateString = format(selectedDate, 'yyyy-MM-dd');
    const existingData = healthData.find(data => data.date === dateString);

    const healthDataInput = {
      userId: user.id,
      date: dateString,
      weight: weight ? Number(weight) : null,
      bodyFatPercentage: bodyFatPercentage ? Number(bodyFatPercentage) : null,
    };

    try {
      if (existingData) {
        await updateHealthData(existingData.id, healthDataInput);
      } else {
        await addHealthData(healthDataInput);
      }
      onClose();
    } catch (error) {
      console.error('健康データ保存エラー:', error);
      setErrors({ general: '健康データの保存に失敗しました。もう一度お試しください。' });
    }
  };

  const handleModalClose = () => {
    setWeight('');
    setBodyFatPercentage('');
    setErrors({});
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleModalClose}
      title={`健康データ - ${format(selectedDate, 'yyyy年M月d日')}`}
      size="md"
    >
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* 体重入力 */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 mb-2">
              <Scale className="h-5 w-5 text-blue-600" />
              <h4 className="text-lg font-medium text-gray-900">体重</h4>
            </div>
            <div className="relative">
              <Input
                id="weight"
                type="number"
                step="0.1"
                min="0"
                max="999.9"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                placeholder="例: 65.5"
                error={errors.weight}
                className="pr-12"
              />
              <span className="absolute right-3 top-9 text-gray-500 text-sm">kg</span>
            </div>
          </div>

          {/* 体脂肪率入力 */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 mb-2">
              <Activity className="h-5 w-5 text-green-600" />
              <h4 className="text-lg font-medium text-gray-900">体脂肪率</h4>
            </div>
            <div className="relative">
              <Input
                id="bodyFatPercentage"
                type="number"
                step="0.1"
                min="0"
                max="100"
                value={bodyFatPercentage}
                onChange={(e) => setBodyFatPercentage(e.target.value)}
                placeholder="例: 15.2"
                error={errors.bodyFatPercentage}
                className="pr-12"
              />
              <span className="absolute right-3 top-9 text-gray-500 text-sm">%</span>
            </div>
          </div>
        </div>

        {/* 入力のヒント */}
        <div className="bg-blue-50 rounded-lg p-4">
          <h5 className="text-sm font-medium text-blue-900 mb-2">入力のヒント</h5>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• 体重は小数点第1位まで入力可能です（例: 65.5kg）</li>
            <li>• 体脂肪率は小数点第1位まで入力可能です（例: 15.2%）</li>
            <li>• どちらか一方のみの入力でも保存できます</li>
            <li>• 同じ日付のデータは上書きされます</li>
          </ul>
        </div>

        {errors.general && (
          <div className="bg-red-50 border border-red-200 rounded-md p-3">
            <p className="text-sm text-red-600">{errors.general}</p>
          </div>
        )}

        {/* アクション */}
        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button
            variant="outline"
            onClick={handleModalClose}
          >
            キャンセル
          </Button>
          <Button 
            onClick={handleSave} 
            className="flex items-center gap-2"
            disabled={isLoading}
          >
            <Save className="h-4 w-4" />
            {isLoading ? '保存中...' : '保存'}
          </Button>
        </div>
      </div>
    </Modal>
  );
};