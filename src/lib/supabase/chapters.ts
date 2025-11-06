import { supabase } from './client'

/**
 * 获取小说的章节列表（从novels表的chapters JSONB字段）
 */
export async function getChaptersByNovelId(novelId: string, page = 1, pageSize = 20) {
  try {
    // 从novels表获取chapters JSONB字段
    const { data: novel, error } = await supabase
      .from('novels')
      .select('chapters')
      .eq('id', novelId)
      .single()

    if (error) {
      return { data: [], count: 0, error: error.message }
    }

    // 解析chapters JSONB数组
    let chapters = (novel?.chapters as any[]) || []
    
    // 排序（按chapter_number）- 创建新数组避免修改原数组
    chapters = [...chapters].sort((a, b) => (a.chapter_number || 0) - (b.chapter_number || 0))

    // 分页
    const from = (page - 1) * pageSize
    const to = from + pageSize
    const paginatedChapters = chapters.slice(from, to)

    return { 
      data: paginatedChapters, 
      count: chapters.length 
    }
  } catch (error) {
    return { data: [], count: 0, error: '获取章节列表失败' }
  }
}

/**
 * 获取单个章节详情（从novels表的chapters JSONB字段）
 */
export async function getChapter(novelId: string, chapterNumber: number) {
  try {
    // 从novels表获取chapters JSONB字段
    const { data: novel, error } = await supabase
      .from('novels')
      .select('chapters')
      .eq('id', novelId)
      .single()

    if (error) {
      return { data: null, error: error.message }
    }

    // 从chapters数组中查找指定章节
    const chapters = (novel?.chapters as any[]) || []
    const chapter = chapters.find(
      (ch: any) => ch.chapter_number === chapterNumber
    )

    if (!chapter) {
      return { data: null, error: '章节不存在' }
    }

    return { data: chapter }
  } catch (error) {
    return { data: null, error: '获取章节失败' }
  }
}
