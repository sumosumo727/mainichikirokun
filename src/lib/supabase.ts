import { createClient } from '@supabase/supabase-js';
import type { Database } from '../types/database';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);

// 認証ヘルパー関数
export const getCurrentUser = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  return user;
};

export const signInWithEmail = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  return { data, error };
};

export const signUpWithEmail = async (email: string, password: string, username: string) => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        username,
      },
    },
  });
  return { data, error };
};

export const signOut = async () => {
  const { error } = await supabase.auth.signOut();
  return { error };
};

// ユーザープロファイル関連
export const getUserProfile = async (userId: string) => {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single();
  
  return { data, error };
};

export const createUserProfile = async (userId: string, email: string, username: string) => {
  const { data, error } = await supabase
    .from('users')
    .insert({
      id: userId,
      email,
      username,
      status: 'pending',
      is_admin: false,
    })
    .select()
    .single();
  
  return { data, error };
};

// Books関連
export const getBooks = async (userId: string) => {
  const { data, error } = await supabase
    .from('books')
    .select(`
      *,
      chapters (*)
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  
  return { data, error };
};

export const createBook = async (userId: string, name: string) => {
  const { data, error } = await supabase
    .from('books')
    .insert({
      user_id: userId,
      name,
    })
    .select()
    .single();
  
  return { data, error };
};

export const updateBook = async (bookId: string, name: string) => {
  const { data, error } = await supabase
    .from('books')
    .update({ name })
    .eq('id', bookId)
    .select()
    .single();
  
  return { data, error };
};

export const deleteBook = async (bookId: string) => {
  const { error } = await supabase
    .from('books')
    .delete()
    .eq('id', bookId);
  
  return { error };
};

// Chapters関連
export const createChapters = async (bookId: string, chapters: Array<{ name: string; order_index: number }>) => {
  const { data, error } = await supabase
    .from('chapters')
    .insert(
      chapters.map(chapter => ({
        book_id: bookId,
        name: chapter.name,
        order_index: chapter.order_index,
      }))
    )
    .select();
  
  return { data, error };
};

export const updateChapter = async (chapterId: string, updates: { name?: string; is_completed?: boolean }) => {
  const { data, error } = await supabase
    .from('chapters')
    .update(updates)
    .eq('id', chapterId)
    .select()
    .single();
  
  return { data, error };
};

export const deleteChapters = async (bookId: string) => {
  const { error } = await supabase
    .from('chapters')
    .delete()
    .eq('book_id', bookId);
  
  return { error };
};

// Daily Records関連
export const getDailyRecords = async (userId: string) => {
  const { data, error } = await supabase
    .from('daily_records')
    .select(`
      *,
      study_progress (*)
    `)
    .eq('user_id', userId)
    .order('record_date', { ascending: false });
  
  return { data, error };
};

export const createDailyRecord = async (userId: string, recordData: {
  record_date: string;
  running: boolean;
  strength_training: boolean;
}) => {
  const { data, error } = await supabase
    .from('daily_records')
    .insert({
      user_id: userId,
      ...recordData,
    })
    .select()
    .single();
  
  return { data, error };
};

export const updateDailyRecord = async (recordId: string, updates: {
  running?: boolean;
  strength_training?: boolean;
}) => {
  const { data, error } = await supabase
    .from('daily_records')
    .update(updates)
    .eq('id', recordId)
    .select()
    .single();
  
  return { data, error };
};

export const upsertDailyRecord = async (userId: string, recordData: {
  record_date: string;
  running: boolean;
  strength_training: boolean;
}) => {
  const { data, error } = await supabase
    .from('daily_records')
    .upsert({
      user_id: userId,
      ...recordData,
    }, {
      onConflict: 'user_id,record_date'
    })
    .select()
    .single();
  
  return { data, error };
};

// Study Progress関連
export const createStudyProgress = async (dailyRecordId: string, studyData: Array<{
  book_id: string;
  chapter_id: string;
  book_name: string;
  chapter_name: string;
}>) => {
  const { data, error } = await supabase
    .from('study_progress')
    .insert(
      studyData.map(study => ({
        daily_record_id: dailyRecordId,
        ...study,
      }))
    )
    .select();
  
  return { data, error };
};

export const deleteStudyProgress = async (dailyRecordId: string) => {
  const { error } = await supabase
    .from('study_progress')
    .delete()
    .eq('daily_record_id', dailyRecordId);
  
  return { error };
};

// 管理者機能
export const getPendingUsers = async () => {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('status', 'pending')
    .order('created_at', { ascending: false });
  
  return { data, error };
};

export const approveUser = async (userId: string) => {
  const { data, error } = await supabase
    .from('users')
    .update({
      status: 'approved',
      approved_at: new Date().toISOString(),
    })
    .eq('id', userId)
    .select()
    .single();
  
  return { data, error };
};

export const rejectUser = async (userId: string) => {
  const { data, error } = await supabase
    .from('users')
    .update({
      status: 'rejected',
    })
    .eq('id', userId)
    .select()
    .single();
  
  return { data, error };
};