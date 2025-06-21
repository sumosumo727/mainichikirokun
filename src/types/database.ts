export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          username: string
          status: 'pending' | 'approved' | 'rejected'
          is_admin: boolean
          created_at: string
          approved_at: string | null
        }
        Insert: {
          id?: string
          email: string
          username: string
          status?: 'pending' | 'approved' | 'rejected'
          is_admin?: boolean
          created_at?: string
          approved_at?: string | null
        }
        Update: {
          id?: string
          email?: string
          username?: string
          status?: 'pending' | 'approved' | 'rejected'
          is_admin?: boolean
          created_at?: string
          approved_at?: string | null
        }
      }
      books: {
        Row: {
          id: string
          user_id: string
          name: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          created_at?: string
          updated_at?: string
        }
      }
      chapters: {
        Row: {
          id: string
          book_id: string
          name: string
          order_index: number
          is_completed: boolean
        }
        Insert: {
          id?: string
          book_id: string
          name: string
          order_index?: number
          is_completed?: boolean
        }
        Update: {
          id?: string
          book_id?: string
          name?: string
          order_index?: number
          is_completed?: boolean
        }
      }
      daily_records: {
        Row: {
          id: string
          user_id: string
          record_date: string
          running: boolean
          strength_training: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          record_date: string
          running?: boolean
          strength_training?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          record_date?: string
          running?: boolean
          strength_training?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      study_progress: {
        Row: {
          id: string
          daily_record_id: string
          book_id: string
          chapter_id: string
          book_name: string
          chapter_name: string
          created_at: string
        }
        Insert: {
          id?: string
          daily_record_id: string
          book_id: string
          chapter_id: string
          book_name: string
          chapter_name: string
          created_at?: string
        }
        Update: {
          id?: string
          daily_record_id?: string
          book_id?: string
          chapter_id?: string
          book_name?: string
          chapter_name?: string
          created_at?: string
        }
      }
      health_data: {
        Row: {
          id: string
          user_id: string
          record_date: string
          weight: number | null
          body_fat_percentage: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          record_date: string
          weight?: number | null
          body_fat_percentage?: number | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          record_date?: string
          weight?: number | null
          body_fat_percentage?: number | null
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}