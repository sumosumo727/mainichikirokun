/*
  # ユーザーデータの修正

  1. 問題
    - モックユーザーのIDがusersテーブルに存在しない
    - 外部キー制約により書籍作成が失敗

  2. 解決策
    - 認証済みユーザーのプロファイルを確実に作成
    - モックユーザーのIDを正しく設定
*/

-- 既存のモックユーザーを削除（存在する場合）
DELETE FROM users WHERE email IN ('admin@example.com', 'user@example.com');

-- 新しいモックユーザーを作成（固定IDで）
INSERT INTO users (
  id,
  email,
  username,
  status,
  is_admin,
  approved_at
) VALUES 
(
  '550e8400-e29b-41d4-a716-446655440000',
  'admin@example.com',
  'Admin',
  'approved',
  true,
  now()
),
(
  '550e8400-e29b-41d4-a716-446655440001',
  'user@example.com',
  'TestUser',
  'approved',
  false,
  now()
) ON CONFLICT (email) DO UPDATE SET
  id = EXCLUDED.id,
  username = EXCLUDED.username,
  status = EXCLUDED.status,
  is_admin = EXCLUDED.is_admin,
  approved_at = EXCLUDED.approved_at;