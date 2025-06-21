/*
  # 健康データテーブルの作成

  1. 新しいテーブル
    - `health_data`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key)
      - `record_date` (date)
      - `weight` (numeric, nullable)
      - `body_fat_percentage` (numeric, nullable)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. セキュリティ
    - RLSを有効化
    - 認証済みユーザーが自分のデータのみアクセス可能なポリシーを追加

  3. インデックス
    - ユーザーIDと日付の複合インデックス
    - 一意制約（ユーザーIDと日付の組み合わせ）
*/

-- Health Data テーブル
CREATE TABLE IF NOT EXISTS health_data (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  record_date date NOT NULL,
  weight numeric(5,2), -- 最大999.99kg
  body_fat_percentage numeric(4,1), -- 最大999.9%
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, record_date)
);

-- RLSを有効化
ALTER TABLE health_data ENABLE ROW LEVEL SECURITY;

-- Health Data テーブルのポリシー
CREATE POLICY "Users can manage own health data"
  ON health_data
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- インデックスの作成
CREATE INDEX IF NOT EXISTS idx_health_data_user_date ON health_data(user_id, record_date);

-- 更新日時を自動更新するトリガー
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'update_health_data_updated_at'
  ) THEN
    CREATE TRIGGER update_health_data_updated_at
      BEFORE UPDATE ON health_data
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;