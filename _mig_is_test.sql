-- 迁移：users 表增加 is_test 列（区分测试用户 vs 真实用户）
-- 用法：wrangler d1 execute szgaokao-db --remote --file=_mig_is_test.sql
ALTER TABLE users ADD COLUMN is_test INTEGER NOT NULL DEFAULT 0;

-- 回填：历史上由 verify_core_books.py 自动创建的测试账号（用户名前缀 vexa）
UPDATE users SET is_test = 1 WHERE username LIKE 'vexa%';
