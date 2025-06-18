/*
  # 管理者ユーザー作成用マイグレーション

  1. 管理者ユーザーの作成
    - 実際のSupabase Authユーザーと連携するため、
      このマイグレーションは手動でSupabase Authユーザーを作成した後に実行してください

  2. 手順
    - Supabase Dashboardで認証ユーザーを作成
    - そのユーザーIDを使用してusersテーブルにレコードを作成
*/

-- 管理者ユーザーを作成する関数
CREATE OR REPLACE FUNCTION create_admin_user(
  user_id uuid,
  user_email text,
  user_name text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO users (
    id,
    email,
    username,
    status,
    is_admin,
    approved_at
  ) VALUES (
    user_id,
    user_email,
    user_name,
    'approved',
    true,
    now()
  ) ON CONFLICT (id) DO UPDATE SET
    status = 'approved',
    is_admin = true,
    approved_at = now();
END;
$$;

-- 使用例（実際のユーザーIDに置き換えてください）:
-- SELECT create_admin_user('your-actual-user-id-here', 'admin@example.com', 'Admin');