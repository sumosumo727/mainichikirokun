/*
  # 管理者ユーザー作成

  1. 管理者ユーザーの作成
    - email: admin@example.com
    - username: Admin
    - status: approved
    - is_admin: true

  2. 注意事項
    - このマイグレーションはSupabase Authの外部でユーザーレコードを作成します
    - 実際のログインにはSupabase Authでの認証が必要です
    - 管理者は別途Supabase Authでアカウントを作成する必要があります
*/

-- 管理者ユーザーが存在しない場合のみ作成
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM users WHERE email = 'admin@example.com'
  ) THEN
    INSERT INTO users (
      id,
      email,
      username,
      status,
      is_admin,
      approved_at
    ) VALUES (
      gen_random_uuid(),
      'admin@example.com',
      'Admin',
      'approved',
      true,
      now()
    );
  END IF;
END $$;

-- 一般ユーザーのサンプルも作成（テスト用）
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM users WHERE email = 'user@example.com'
  ) THEN
    INSERT INTO users (
      id,
      email,
      username,
      status,
      is_admin,
      approved_at
    ) VALUES (
      gen_random_uuid(),
      'user@example.com',
      'TestUser',
      'approved',
      false,
      now()
    );
  END IF;
END $$;