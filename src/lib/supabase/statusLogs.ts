import { supabase } from './client'

/**
 * 获取小说状态记录
 */
export async function getStatusLogsByNovelId(novelId: string) {
  try {
    const { data, error } = await supabase
      .from('novel_status_logs')
      .select(`
        *,
        users (
          username
        )
      `)
      .eq('novel_id', novelId)
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
 * 添加状态记录
 */
export async function addStatusLog(novelId: string, userId: string, statusNote: string) {
  try {
    const { data, error } = await supabase
      .from('novel_status_logs')
      .insert({
        novel_id: novelId,
        user_id: userId,
        status_note: statusNote,
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

