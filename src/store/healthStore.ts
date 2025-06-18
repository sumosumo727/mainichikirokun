import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { HealthData } from '../types';

interface HealthState {
  healthData: HealthData[];
  isLoading: boolean;
  
  // Actions
  addHealthData: (data: Omit<HealthData, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateHealthData: (id: string, updates: Partial<HealthData>) => void;
  deleteHealthData: (id: string) => void;
  getHealthDataByDateRange: (startDate: string, endDate: string) => HealthData[];
  getLatestHealthData: () => HealthData | null;
  
  // HealthKit integration (for future use)
  syncFromHealthKit: () => Promise<void>;
  isHealthKitAvailable: () => boolean;
}

export const useHealthStore = create<HealthState>()(
  persist(
    (set, get) => ({
      healthData: [],
      isLoading: false,

      addHealthData: (data) => {
        const newHealthData: HealthData = {
          id: Math.random().toString(36).substr(2, 9),
          ...data,
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        set((state) => ({
          healthData: [...state.healthData, newHealthData].sort(
            (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
          ),
        }));
      },

      updateHealthData: (id, updates) => {
        set((state) => ({
          healthData: state.healthData.map((item) =>
            item.id === id
              ? { ...item, ...updates, updatedAt: new Date() }
              : item
          ),
        }));
      },

      deleteHealthData: (id) => {
        set((state) => ({
          healthData: state.healthData.filter((item) => item.id !== id),
        }));
      },

      getHealthDataByDateRange: (startDate, endDate) => {
        const { healthData } = get();
        return healthData.filter((item) => {
          const itemDate = new Date(item.date);
          return itemDate >= new Date(startDate) && itemDate <= new Date(endDate);
        });
      },

      getLatestHealthData: () => {
        const { healthData } = get();
        if (healthData.length === 0) return null;
        
        return healthData.reduce((latest, current) => {
          return new Date(current.date) > new Date(latest.date) ? current : latest;
        });
      },

      syncFromHealthKit: async () => {
        set({ isLoading: true });
        try {
          // HealthKit同期の実装（将来のCapacitor対応時）
          if (typeof window !== 'undefined' && (window as any).Capacitor) {
            try {
              // 動的インポートを使用してCapacitorプラグインを読み込み
              const healthModule = await import('@capacitor-community/health').catch(() => null);
              
              if (!healthModule) {
                console.warn('HealthKit plugin not available');
                return;
              }

              const { Health } = healthModule;
              
              // 過去30日間のデータを取得
              const endDate = new Date();
              const startDate = new Date();
              startDate.setDate(endDate.getDate() - 30);

              const weightResult = await Health.queryHKitSampleType({
                sampleName: 'weight',
                startDate: startDate.toISOString(),
                endDate: endDate.toISOString(),
                limit: 30
              });

              const bodyFatResult = await Health.queryHKitSampleType({
                sampleName: 'body_fat_percentage',
                startDate: startDate.toISOString(),
                endDate: endDate.toISOString(),
                limit: 30
              });

              // データをマージして保存
              const mergedData = weightResult.resultData.map((weightItem: any) => {
                const date = weightItem.startDate.split('T')[0];
                const bodyFatItem = bodyFatResult.resultData.find((bf: any) => 
                  bf.startDate.split('T')[0] === date
                );

                return {
                  userId: '', // 実際のユーザーIDを設定
                  date,
                  weight: parseFloat(weightItem.value),
                  bodyFatPercentage: bodyFatItem ? parseFloat(bodyFatItem.value) * 100 : undefined,
                };
              });

              // 既存データと重複しないように追加
              const { healthData } = get();
              const existingDates = new Set(healthData.map(item => item.date));
              
              mergedData.forEach(data => {
                if (!existingDates.has(data.date)) {
                  get().addHealthData(data);
                }
              });
            } catch (importError) {
              console.warn('Failed to import HealthKit plugin:', importError);
            }
          } else {
            console.log('HealthKit is only available in native Capacitor apps');
          }
        } catch (error) {
          console.error('HealthKit sync error:', error);
        } finally {
          set({ isLoading: false });
        }
      },

      isHealthKitAvailable: () => {
        return typeof window !== 'undefined' && 
               (window as any).Capacitor !== undefined &&
               (window as any).Capacitor.isNativePlatform &&
               (window as any).Capacitor.isNativePlatform();
      },
    }),
    {
      name: 'health-storage',
    }
  )
);