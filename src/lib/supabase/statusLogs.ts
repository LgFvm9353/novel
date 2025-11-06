import { supabase } from './client'

/**
 * 获取小说状态记录（从comments表的status_note字段，过滤出有status_note的记录）
 */
export async function getStatusLogsByNovelId(novelId: string) {
  try {
    const { data, error } = await supabase
      .from('comments')
      .select(`
        *,
        users (
          username
        )
      `)
      .eq('novel_id', novelId)
      .not('status_note', 'is', null)  // 只获取有status_note的记录
      .order('created_at', { ascending: false })
      .limit(10)

    if (error) {
      return { data: [], error: error.message }
    }

    return { data: data || [] }
  } catch (error) {
    return { data: [], error: '获取状态记录失败' }
  }
}

/**
 * 添加状态记录（插入到comments表，使用status_note字段）
 */
export async function addStatusLog(novelId: string, userId: string, statusNote: string) {
  try {
    const { data, error } = await supabase
      .from('comments')
      .insert({
        novel_id: novelId,
        user_id: userId,
        content: statusNote,  // 同时作为评论内容
        status_note: statusNote,  // 状态记录
      })
      .select(`
        *,
        users (
          username
        )
      `)
      .single()

    if (error) {
      return { data: null, error: error.message }
    }

    return { data }
  } catch (error) {
    return { data: null, error: '添加状态记录失败' }
  }
}
