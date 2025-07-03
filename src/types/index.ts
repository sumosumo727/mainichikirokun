export interface User {
  id: string;
  email: string;
  username: string;
  status: 'pending' | 'approved' | 'rejected';
  isAdmin: boolean;
  createdAt: Date;
  approvedAt?: Date;
}

export interface UserRegistration {
  email: string;
  password: string;
  confirmPassword: string;
  username: string;
  agreeToTerms: boolean;
}

export interface LoginForm {
  email: string;
  password: string;
}

export interface Book {
  id: string;
  userId: string;
  name: string;
  chapters: Chapter[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Chapter {
  id: string;
  bookId: string;
  name: string;
  order: number;
  isCompleted: boolean;
  completedDate?: string | null; // YYYY-MM-DD形式の完了日
}

export interface DailyRecord {
  id: string;
  userId: string;
  date: string; // YYYY-MM-DD
  training: {
    running: boolean;
    strength: boolean;
  };
  studyProgress: StudyProgress[];
  createdAt: Date;
  updatedAt: Date;
}

export interface StudyProgress {
  bookId: string;
  chapterId: string;
  bookName: string;
  chapterName: string;
}

export interface MonthlyStats {
  month: string; // YYYY-MM
  trainingRate: number;
  trainingBreakdown: {
    runningDays: number;
    strengthDays: number;
    totalTrainingDays: number;
  };
  bookProgress: Array<{
    bookName: string;
    completionRate: number;
    isCompleted: boolean;
    completedMonth?: string;
  }>;
}

export interface DailyInputModal {
  date: string;
  training: {
    running: boolean;
    strength: boolean;
  };
  selectedBooks: Array<{
    bookId: string;
    chapterIds: string[];
  }>;
}

// 健康データ関連の型定義
export interface BodyMetrics {
  id: string;
  userId: string;
  date: string; // YYYY-MM-DD
  weight?: number; // kg
  bodyFatPercentage?: number; // %
  createdAt: Date;
  updatedAt: Date;
}

export interface HealthKitData {
  weight: number;
  bodyFatPercentage: number;
  date: string;
}

// 統計期間の型定義
export type StatsPeriod = 'week' | 'month' | 'year';

// 体重・体脂肪率チャートデータの型定義
export interface BodyMetricsChartData {
  date: string;
  weight?: number;
  bodyFatPercentage?: number;
}

// 体重・体脂肪率の変化データ
export interface BodyMetricsTrend {
  current: {
    weight?: number;
    bodyFatPercentage?: number;
    date: string;
  };
  previous: {
    weight?: number;
    bodyFatPercentage?: number;
    date: string;
  };
  changes: {
    weight?: {
      value: number;
      percentage: number;
      isPositive: boolean;
    };
    bodyFatPercentage?: {
      value: number;
      percentage: number;
      isPositive: boolean;
    };
  };
}