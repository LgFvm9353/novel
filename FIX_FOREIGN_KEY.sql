-- ============================================
-- 修复 novels 表的外键约束
-- 解决 Supabase 无法识别关系的问题
-- ============================================

-- 1. 检查并清理无效的 author_id（如果有的话）
-- 注意：如果表中已有数据，先确保所有 author_id 都有效
-- DELETE FROM public.novels WHERE author_id NOT IN (SELECT id FROM public.authors);

-- 2. 添加外键约束（如果不存在）
-- 先删除可能存在的旧约束
DO $$ 
BEGIN
    -- 检查是否存在外键约束
    IF NOT EXISTS (
        SELECT 1 
        FROM pg_constraint 
        WHERE conrelid = 'public.novels'::regclass 
        AND conname = 'novels_author_id_fkey'
    ) THEN
        -- 添加外键约束
        ALTER TABLE public.novels
        ADD CONSTRAINT novels_author_id_fkey 
        FOREIGN KEY (author_id) 
        REFERENCES public.authors(id) 
        ON DELETE CASCADE;
    END IF;
END $$;

-- 3. 确保 category_id 的外键约束存在（如果之前没有）
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM pg_constraint 
        WHERE conrelid = 'public.novels'::regclass 
        AND conname = 'novels_category_id_fkey'
    ) THEN
        ALTER TABLE public.novels
        ADD CONSTRAINT novels_category_id_fkey 
        FOREIGN KEY (category_id) 
        REFERENCES public.categories(id) 
        ON DELETE SET NULL;
    END IF;
END $$;

-- 4. 验证外键约束
SELECT 
    tc.table_name, 
    kcu.column_name, 
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name,
    tc.constraint_name
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
    AND tc.table_name = 'novels'
ORDER BY tc.table_name, kcu.column_name;

-- 5. 刷新 PostgREST schema cache（在 Supabase Dashboard 中执行）
-- 注意：Supabase 会自动刷新，但可能需要等待几秒钟
-- 或者重启 Supabase 项目

-- ============================================
-- 完成
-- ============================================
-- 执行此脚本后，Supabase 应该能够识别 novels 和 authors 之间的关系
-- 如果仍然无法识别，请等待几秒钟让 Supabase 刷新 schema cache
-- 或者在 Supabase Dashboard 中手动刷新

