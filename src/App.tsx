import React, { useEffect } from 'react';
import { AuthPage } from './pages/AuthPage';
import { DashboardPage } from './pages/DashboardPage';
import { useAuthStore } from './store/authStore';

function App() {
  const { isAuthenticated, checkAuth } = useAuthStore();

  useEffect(() => {
    // アプリ起動時に認証状態をチェック
    checkAuth();
  }, [checkAuth]);

  if (!isAuthenticated) {
    return <AuthPage />;
  }

  return <DashboardPage />;
}

export default App;