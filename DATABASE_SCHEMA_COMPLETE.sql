-- ============================================
-- 在线小说网站 - 完整数据库结构
-- 核心表：novels（小说）、authors（作者）、comments（评论）
-- 辅助表：users（用户）、categories（分类）
-- 说明：此结构满足课程设计要求（3个核心表）+ 代码实际需要（2个辅助表）
-- ============================================

-- ============================================
-- 辅助表1：用户表 (users) - 管理员功能必需
-- ============================================
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL DEFAULT 'reader' CHECK (role IN ('reader', 'admin', 'author')),
    username TEXT UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 辅助表2：分类表 (categories) - 代码大量使用
-- ============================================
CREATE TABLE IF NOT EXISTS public.categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 核心表1：小说信息表 (novels) - 课程设计要求
-- ============================================
CREATE TABLE IF NOT EXISTS public.novels (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),  -- 小说编号
    title TEXT NOT NULL,                            -- 小说名称
    author_id UUID NOT NULL,                        -- 作者编号（外键关联authors表）
    category_id UUID REFERENCES public.categories(id),  -- 所属栏目ID
    category TEXT,                                  -- 所属栏目（文本字段，用于课程设计要求）
    description TEXT,                               -- 书评/简介
    cover_image TEXT,                               -- 封面图片
    status TEXT DEFAULT '连载中',                   -- 小说状态
    total_chapters INTEGER DEFAULT 0,               -- 小说章节数
    total_pages INTEGER DEFAULT 0,                  -- 小说页数
    vote_count INTEGER DEFAULT 0,                   -- 投票数量
    chapters JSONB,                                 -- 章节内容（JSONB格式，用于存储章节数据）
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 核心表2：作者信息表 (authors) - 课程设计要求
-- ============================================
CREATE TABLE IF NOT EXISTS public.authors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),  -- 作者编号
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,  -- 用户ID（代码需要）
    name TEXT NOT NULL,                             -- 姓名
    bio TEXT,                                       -- 个人简介
    level TEXT DEFAULT '新手' CHECK (level IN ('新手', '签约', '白金')),  -- 作者等级
    novel_ids UUID[],                               -- 所发表小说编号（数组，课程设计要求）
    is_transcript BOOLEAN DEFAULT FALSE,            -- 是否转录
    comment_id UUID,                                -- 留言编号（关联comments表，课程设计要求）
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 核心表3：评论信息表 (comments) - 课程设计要求
-- ============================================
CREATE TABLE IF NOT EXISTS public.comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),  -- 留言编号
    novel_id UUID NOT NULL REFERENCES public.novels(id) ON DELETE CASCADE,  -- 关联小说编号
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,  -- 用户ID（代码需要）
    content TEXT NOT NULL,                          -- 留言内容
    management_category TEXT,                       -- 评论管理类别（课程设计要求）
    price_per_thousand_words DECIMAL(10,2),         -- 每千字收费标准（课程设计要求）
    ranking INTEGER,                                -- 排行榜排名（课程设计要求）
    novel_status TEXT,                              -- 小说状态（课程设计要求）
    novel_category TEXT,                            -- 小说类别（课程设计要求）
    status_note TEXT,                              -- 状态记录（合并novel_status_logs功能）
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 创建索引以优化查询性能
-- ============================================
-- 用户表索引
CREATE INDEX IF NOT EXISTS idx_users_username ON public.users(username);
CREATE INDEX IF NOT EXISTS idx_users_role ON public.users(role);

-- 分类表索引
CREATE INDEX IF NOT EXISTS idx_categories_name ON public.categories(name);

-- 小说表索引
CREATE INDEX IF NOT EXISTS idx_novels_author_id ON public.novels(author_id);
CREATE INDEX IF NOT EXISTS idx_novels_category_id ON public.novels(category_id);
CREATE INDEX IF NOT EXISTS idx_novels_category ON public.novels(category);
CREATE INDEX IF NOT EXISTS idx_novels_status ON public.novels(status);
CREATE INDEX IF NOT EXISTS idx_novels_updated_at ON public.novels(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_novels_vote_count ON public.novels(vote_count DESC);
CREATE INDEX IF NOT EXISTS idx_novels_chapters ON public.novels USING GIN (chapters);  -- GIN索引用于JSONB

-- 作者表索引
CREATE INDEX IF NOT EXISTS idx_authors_user_id ON public.authors(user_id);
CREATE INDEX IF NOT EXISTS idx_authors_level ON public.authors(level);

-- 评论表索引
CREATE INDEX IF NOT EXISTS idx_comments_novel_id ON public.comments(novel_id);
CREATE INDEX IF NOT EXISTS idx_comments_user_id ON public.comments(user_id);
CREATE INDEX IF NOT EXISTS idx_comments_ranking ON public.comments(ranking);

-- ============================================
-- 创建更新时间触发器函数
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 为novels表创建更新时间触发器
CREATE TRIGGER update_novels_updated_at 
    BEFORE UPDATE ON public.novels
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 函数：自动更新作者的小说编号数组
-- ============================================
CREATE OR REPLACE FUNCTION update_author_novel_ids()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE public.authors
        SET novel_ids = array_append(COALESCE(novel_ids, ARRAY[]::UUID[]), NEW.id)
        WHERE id = NEW.author_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE public.authors
        SET novel_ids = array_remove(novel_ids, OLD.id)
        WHERE id = OLD.author_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- 创建触发器：当小说增删时自动更新作者的小说编号数组
CREATE TRIGGER update_author_novel_ids_trigger
AFTER INSERT OR DELETE ON public.novels
FOR EACH ROW EXECUTE FUNCTION update_author_novel_ids();

-- ============================================
-- 函数：自动更新小说的章节数和页数（基于chapters JSONB）
-- ============================================
CREATE OR REPLACE FUNCTION update_novel_stats_from_jsonb()
RETURNS TRIGGER AS $$
BEGIN
    -- 处理INSERT和UPDATE两种情况
    IF TG_OP = 'INSERT' OR (TG_OP = 'UPDATE' AND (NEW.chapters IS DISTINCT FROM OLD.chapters)) THEN
        IF NEW.chapters IS NOT NULL THEN
            NEW.total_chapters = jsonb_array_length(NEW.chapters);
            -- 计算总页数（假设每章平均500字，如果word_count为0则使用字符数估算）
            NEW.total_pages = COALESCE(
                (SELECT GREATEST(
                    SUM((chapter->>'word_count')::INTEGER) / 500,
                    SUM(LENGTH(chapter->>'content')) / 500
                )
                 FROM jsonb_array_elements(NEW.chapters) AS chapter),
                0
            );
        ELSE
            NEW.total_chapters = 0;
            NEW.total_pages = 0;
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 创建触发器：更新时自动计算章节数和页数
CREATE TRIGGER update_novel_stats_trigger
BEFORE INSERT OR UPDATE ON public.novels
FOR EACH ROW 
EXECUTE FUNCTION update_novel_stats_from_jsonb();

-- ============================================
-- 启用行级安全（RLS）
-- ============================================
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.novels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.authors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;

-- ============================================
-- RLS 策略 - 宽松规则（允许所有操作）
-- ============================================

-- 删除可能存在的旧策略
DROP POLICY IF EXISTS "users_select_policy" ON public.users;
DROP POLICY IF EXISTS "users_insert_policy" ON public.users;
DROP POLICY IF EXISTS "users_update_policy" ON public.users;
DROP POLICY IF EXISTS "users_delete_policy" ON public.users;
DROP POLICY IF EXISTS "categories_select_policy" ON public.categories;
DROP POLICY IF EXISTS "categories_insert_policy" ON public.categories;
DROP POLICY IF EXISTS "categories_update_policy" ON public.categories;
DROP POLICY IF EXISTS "categories_delete_policy" ON public.categories;
DROP POLICY IF EXISTS "novels_select_policy" ON public.novels;
DROP POLICY IF EXISTS "novels_insert_policy" ON public.novels;
DROP POLICY IF EXISTS "novels_update_policy" ON public.novels;
DROP POLICY IF EXISTS "novels_delete_policy" ON public.novels;
DROP POLICY IF EXISTS "authors_select_policy" ON public.authors;
DROP POLICY IF EXISTS "authors_insert_policy" ON public.authors;
DROP POLICY IF EXISTS "authors_update_policy" ON public.authors;
DROP POLICY IF EXISTS "authors_delete_policy" ON public.authors;
DROP POLICY IF EXISTS "comments_select_policy" ON public.comments;
DROP POLICY IF EXISTS "comments_insert_policy" ON public.comments;
DROP POLICY IF EXISTS "comments_update_policy" ON public.comments;
DROP POLICY IF EXISTS "comments_delete_policy" ON public.comments;

-- 用户表策略：所有人都可以查看、插入、更新、删除
CREATE POLICY "users_select_policy"
    ON public.users FOR SELECT
    USING (true);

CREATE POLICY "users_insert_policy"
    ON public.users FOR INSERT
    WITH CHECK (true);

CREATE POLICY "users_update_policy"
    ON public.users FOR UPDATE
    USING (true)
    WITH CHECK (true);

CREATE POLICY "users_delete_policy"
    ON public.users FOR DELETE
    USING (true);

-- 分类表策略：所有人都可以查看、插入、更新、删除
CREATE POLICY "categories_select_policy"
    ON public.categories FOR SELECT
    USING (true);

CREATE POLICY "categories_insert_policy"
    ON public.categories FOR INSERT
    WITH CHECK (true);

CREATE POLICY "categories_update_policy"
    ON public.categories FOR UPDATE
    USING (true)
    WITH CHECK (true);

CREATE POLICY "categories_delete_policy"
    ON public.categories FOR DELETE
    USING (true);

-- 小说表策略：所有人都可以查看、插入、更新、删除
CREATE POLICY "novels_select_policy"
    ON public.novels FOR SELECT
    USING (true);

CREATE POLICY "novels_insert_policy"
    ON public.novels FOR INSERT
    WITH CHECK (true);

CREATE POLICY "novels_update_policy"
    ON public.novels FOR UPDATE
    USING (true)
    WITH CHECK (true);

CREATE POLICY "novels_delete_policy"
    ON public.novels FOR DELETE
    USING (true);

-- 作者表策略：所有人都可以查看、插入、更新、删除
CREATE POLICY "authors_select_policy"
    ON public.authors FOR SELECT
    USING (true);

CREATE POLICY "authors_insert_policy"
    ON public.authors FOR INSERT
    WITH CHECK (true);

CREATE POLICY "authors_update_policy"
    ON public.authors FOR UPDATE
    USING (true)
    WITH CHECK (true);

CREATE POLICY "authors_delete_policy"
    ON public.authors FOR DELETE
    USING (true);

-- 评论表策略：所有人都可以查看、插入、更新、删除
CREATE POLICY "comments_select_policy"
    ON public.comments FOR SELECT
    USING (true);

CREATE POLICY "comments_insert_policy"
    ON public.comments FOR INSERT
    WITH CHECK (true);

CREATE POLICY "comments_update_policy"
    ON public.comments FOR UPDATE
    USING (true)
    WITH CHECK (true);

CREATE POLICY "comments_delete_policy"
    ON public.comments FOR DELETE
    USING (true);

-- ============================================
-- 初始化分类数据
-- ============================================
INSERT INTO public.categories (name) VALUES
    ('玄幻'),
    ('都市'),
    ('历史'),
    ('科幻'),
    ('武侠'),
    ('言情')
ON CONFLICT (name) DO NOTHING;

-- ============================================
-- 分析表以更新统计信息
-- ============================================
ANALYZE public.users;
ANALYZE public.categories;
ANALYZE public.novels;
ANALYZE public.authors;
ANALYZE public.comments;

-- ============================================
-- 完成
-- ============================================
-- 数据库结构创建完成
-- 
-- 表结构说明：
-- 1. 核心表（课程设计要求）：novels, authors, comments
-- 2. 辅助表（代码功能需要）：users, categories
-- 
-- 设计特点：
-- 1. chapters数据存储在novels表的JSONB字段中，避免单独的表
-- 2. novel_status_logs功能合并到comments表的status_note字段
-- 3. 所有表已启用RLS，策略设置为宽松模式（允许所有操作）
-- 4. 自动触发器更新作者的小说编号数组和小说统计信息
