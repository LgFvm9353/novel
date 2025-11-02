import { supabase } from './client'

/**
 * 获取小说的章节列表
 */
export async function getChaptersByNovelId(novelId: string, page = 1, pageSize = 20) {
  try {
    const from = (page - 1) * pageSize
    const to = from + pageSize - 1

    const { data, error, count } = await supabase
      .from('chapters')
      .select('*', { count: 'estimated' })  // 使用估计计数提升性能
      .eq('novel_id', novelId)
      .order('chapter_number', { ascending: true })
      .range(from, to)

    if (error) {
      return { data: [], count: 0, error: error.message }
    }

    return { data: data || [], count: count || 0 }
  } catch (error) {
    return { data: [], count: 0, error: '获取章节列表失败' }
  }
}

/**
 * 获取单个章节详情
 */
export async function getChapter(novelId: string, chapterNumber: number) {
  try {
    const { data, error } = await supabase
      .from('chapters')
      .select('*')
      .eq('novel_id', novelId)
      .eq('chapter_number', chapterNumber)
      .single()

    if (error) {
      return { data: null, error: error.message }
    }

    return { data }
  } catch (error) {
    return { data: null, error: '获取章节失败' }
  }
}

