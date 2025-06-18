-- 管理者ユーザーを作成/更新する関数（改良版）
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
  -- まず、指定されたIDのユーザーが存在するかチェック
  IF EXISTS (SELECT 1 FROM users WHERE id = user_id) THEN
    -- 既存ユーザーを管理者に更新
    UPDATE users SET
      status = 'approved',
      is_admin = true,
      approved_at = now()
    WHERE id = user_id;
  ELSE
    -- 新しいユーザーを作成
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
    );
  END IF;
END;
$$;

-- 既存のメールアドレスを管理者に昇格させる関数
CREATE OR REPLACE FUNCTION promote_user_to_admin(user_email text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE users SET
    status = 'approved',
    is_admin = true,
    approved_at = now()
  WHERE email = user_email;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'User with email % not found', user_email;
  END IF;
END;
$$;

-- 使用例:
-- 1. 新しい管理者ユーザーを作成する場合:
--    SELECT create_admin_user('your-actual-user-id-here', 'admin@example.com', 'Admin');
--
-- 2. 既存のユーザーを管理者に昇格させる場合:
--    SELECT promote_user_to_admin('existing-user@example.com');