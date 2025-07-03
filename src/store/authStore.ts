import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User } from '../types';
import { 
  signInWithEmail, 
  signUpWithEmail, 
  signOut, 
  getCurrentUser,
  getUserProfile,
  createUserProfile
} from '../lib/supabase';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (userData: any) => Promise<void>;
  logout: () => void;
  setUser: (user: User | null) => void;
  setToken: (token: string | null) => void;
  checkAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,

      login: async (email, password) => {
        set({ isLoading: true });
        try {
          const { data, error } = await signInWithEmail(email, password);
          
          if (error) {
            throw new Error(error.message);
          }

          if (data.user && data.session) {
            // ユーザープロファイルを取得
            const { data: profile, error: profileError } = await getUserProfile(data.user.id);
            
            if (profileError) {
              // プロファイルが存在しない場合は作成
              if (profileError.code === 'PGRST116') {
                const { data: newProfile, error: createError } = await createUserProfile(
                  data.user.id,
                  data.user.email || '',
                  data.user.user_metadata?.username || data.user.email?.split('@')[0] || 'User'
                );
                
                if (createError) {
                  throw new Error('ユーザープロファイルの作成に失敗しました');
                }
                
                const user: User = {
                  id: newProfile.id,
                  email: newProfile.email,
                  username: newProfile.username,
                  status: newProfile.status,
                  isAdmin: newProfile.is_admin,
                  createdAt: new Date(newProfile.created_at),
                  approvedAt: newProfile.approved_at ? new Date(newProfile.approved_at) : undefined,
                };

                set({
                  user,
                  token: data.session.access_token,
                  isAuthenticated: true,
                  isLoading: false,
                });
                return;
              } else {
                throw new Error('ユーザープロファイルの取得に失敗しました');
              }
            }

            if (!profile) {
              throw new Error('ユーザープロファイルが見つかりません');
            }

            // ユーザーが承認されているかチェック
            if (profile.status !== 'approved') {
              throw new Error('アカウントが承認されていません。管理者の承認をお待ちください。');
            }

            const user: User = {
              id: profile.id,
              email: profile.email,
              username: profile.username,
              status: profile.status,
              isAdmin: profile.is_admin,
              createdAt: new Date(profile.created_at),
              approvedAt: profile.approved_at ? new Date(profile.approved_at) : undefined,
            };

            set({
              user,
              token: data.session.access_token,
              isAuthenticated: true,
              isLoading: false,
            });
          }
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      register: async (userData) => {
        set({ isLoading: true });
        try {
          const { data, error } = await signUpWithEmail(
            userData.email,
            userData.password,
            userData.username
          );

          if (error) {
            throw new Error(error.message);
          }

          if (data.user) {
            // ユーザープロファイルを作成
            const { error: profileError } = await createUserProfile(
              data.user.id,
              userData.email,
              userData.username
            );

            if (profileError) {
              throw new Error('ユーザープロファイルの作成に失敗しました');
            }
          }

          set({ isLoading: false });
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      logout: async () => {
        try {
          await signOut();
        } catch (error) {
          console.warn('ログアウトエラー:', error);
        }
        
        set({
          user: null,
          token: null,
          isAuthenticated: false,
        });
      },

      setUser: (user) => set({ user, isAuthenticated: !!user }),
      setToken: (token) => set({ token }),

      checkAuth: async () => {
        try {
          const user = await getCurrentUser();
          if (user) {
            const { data: profile, error: profileError } = await getUserProfile(user.id);
            if (profile && profile.status === 'approved') {
              const userProfile: User = {
                id: profile.id,
                email: profile.email,
                username: profile.username,
                status: profile.status,
                isAdmin: profile.is_admin,
                createdAt: new Date(profile.created_at),
                approvedAt: profile.approved_at ? new Date(profile.approved_at) : undefined,
              };
              set({ user: userProfile, isAuthenticated: true });
            } else {
              // Profile doesn't exist or user is not approved - clear auth state
              set({ user: null, token: null, isAuthenticated: false });
            }
          } else {
            // No user found - clear auth state
            set({ user: null, token: null, isAuthenticated: false });
          }
        } catch (error) {
          console.error('認証チェックエラー:', error);
          // Clear auth state on any error (including session_not_found)
          set({ user: null, token: null, isAuthenticated: false });
        }
      },
    }),
    {
      name: 'auth-storage',
    }
  )
);