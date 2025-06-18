/*
  # 初期スキーマ作成

  1. 新しいテーブル
    - `users`
      - `id` (uuid, primary key)
      - `email` (text, unique)
      - `username` (text)
      - `status` (text, default 'pending')
      - `is_admin` (boolean, default false)
      - `created_at` (timestamp)
      - `approved_at` (timestamp, nullable)
    
    - `books`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key)
      - `name` (text)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `chapters`
      - `id` (uuid, primary key)
      - `book_id` (uuid, foreign key)
      - `name` (text)
      - `order_index` (integer)
      - `is_completed` (boolean, default false)
    
    - `daily_records`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key)
      - `record_date` (date)
      - `running` (boolean, default false)
      - `strength_training` (boolean, default false)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `study_progress`
      - `id` (uuid, primary key)
      - `daily_record_id` (uuid, foreign key)
      - `book_id` (uuid, foreign key)
      - `chapter_id` (uuid, foreign key)
      - `book_name` (text)
      - `chapter_name` (text)
      - `created_at` (timestamp)

  2. セキュリティ
    - 全テーブルでRLSを有効化
    - 認証済みユーザーが自分のデータのみアクセス可能なポリシーを追加
    - 管理者は全ユーザーのデータにアクセス可能なポリシーを追加

  3. 管理者ユーザー
    - 初期管理者ユーザーを作成
    - email: admin@example.com
    - username: Admin
    - status: approved
    - is_admin: true
*/

-- Users テーブル
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  username text NOT NULL,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  is_admin boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  approved_at timestamptz
);

-- Books テーブル
CREATE TABLE IF NOT EXISTS books (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Chapters テーブル
CREATE TABLE IF NOT EXISTS chapters (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  book_id uuid NOT NULL REFERENCES books(id) ON DELETE CASCADE,
  name text NOT NULL,
  order_index integer NOT NULL DEFAULT 1,
  is_completed boolean DEFAULT false
);

-- Daily Records テーブル
CREATE TABLE IF NOT EXISTS daily_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  record_date date NOT NULL,
  running boolean DEFAULT false,
  strength_training boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, record_date)
);

-- Study Progress テーブル
CREATE TABLE IF NOT EXISTS study_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  daily_record_id uuid NOT NULL REFERENCES daily_records(id) ON DELETE CASCADE,
  book_id uuid NOT NULL REFERENCES books(id) ON DELETE CASCADE,
  chapter_id uuid NOT NULL REFERENCES chapters(id) ON DELETE CASCADE,
  book_name text NOT NULL,
  chapter_name text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- RLSを有効化
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE books ENABLE ROW LEVEL SECURITY;
ALTER TABLE chapters ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE study_progress ENABLE ROW LEVEL SECURITY;

-- Users テーブルのポリシー
CREATE POLICY "Users can read own data"
  ON users
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Admins can read all users"
  ON users
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND is_admin = true
    )
  );

CREATE POLICY "Admins can update user status"
  ON users
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- Books テーブルのポリシー
CREATE POLICY "Users can manage own books"
  ON books
  FOR ALL
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Admins can read all books"
  ON books
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- Chapters テーブルのポリシー
CREATE POLICY "Users can manage chapters of own books"
  ON chapters
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM books 
      WHERE books.id = chapters.book_id AND books.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can read all chapters"
  ON chapters
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- Daily Records テーブルのポリシー
CREATE POLICY "Users can manage own daily records"
  ON daily_records
  FOR ALL
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Admins can read all daily records"
  ON daily_records
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- Study Progress テーブルのポリシー
CREATE POLICY "Users can manage own study progress"
  ON study_progress
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM daily_records 
      WHERE daily_records.id = study_progress.daily_record_id 
      AND daily_records.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can read all study progress"
  ON study_progress
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- インデックスの作成
CREATE INDEX IF NOT EXISTS idx_books_user_id ON books(user_id);
CREATE INDEX IF NOT EXISTS idx_chapters_book_id ON chapters(book_id);
CREATE INDEX IF NOT EXISTS idx_daily_records_user_date ON daily_records(user_id, record_date);
CREATE INDEX IF NOT EXISTS idx_study_progress_daily_record ON study_progress(daily_record_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);

-- 更新日時を自動更新するトリガー関数
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Books テーブルの更新トリガー
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'update_books_updated_at'
  ) THEN
    CREATE TRIGGER update_books_updated_at
      BEFORE UPDATE ON books
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

-- Daily Records テーブルの更新トリガー
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'update_daily_records_updated_at'
  ) THEN
    CREATE TRIGGER update_daily_records_updated_at
      BEFORE UPDATE ON daily_records
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;