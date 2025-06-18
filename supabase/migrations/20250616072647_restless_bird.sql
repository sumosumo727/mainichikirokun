-- モックユーザーとその関連データを完全に削除
DELETE FROM study_progress WHERE daily_record_id IN (
  SELECT id FROM daily_records WHERE user_id IN (
    SELECT id FROM users WHERE email IN ('admin@example.com', 'user@example.com')
  )
);

DELETE FROM daily_records WHERE user_id IN (
  SELECT id FROM users WHERE email IN ('admin@example.com', 'user@example.com')
);

DELETE FROM chapters WHERE book_id IN (
  SELECT id FROM books WHERE user_id IN (
    SELECT id FROM users WHERE email IN ('admin@example.com', 'user@example.com')
  )
);

DELETE FROM books WHERE user_id IN (
  SELECT id FROM users WHERE email IN ('admin@example.com', 'user@example.com')
);

DELETE FROM users WHERE email IN ('admin@example.com', 'user@example.com');

-- 確認用クエリ
SELECT 'Cleanup completed. Remaining users:' as message;
SELECT id, email, username, status, is_admin FROM users;