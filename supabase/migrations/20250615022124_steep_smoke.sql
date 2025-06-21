-- 管理者用の認証ユーザーを作成（Supabase Auth）
-- 注意: この操作は手動で行う必要があります

-- 管理者ユーザーが既に存在する場合は更新
UPDATE users 
SET 
  status = 'approved',
  is_admin = true,
  approved_at = now()
WHERE email = 'admin@example.com';

-- 管理者ユーザーが存在しない場合は作成準備
-- 実際の認証ユーザーはSupabase Authで作成する必要があります

-- テスト用ユーザーも更新
UPDATE users 
SET 
  status = 'approved',
  approved_at = now()
WHERE email = 'user@example.com';