import { supabase } from './client'

/**
 * 获取小说评论列表（排除状态记录，只获取普通评论）
 */
export async function getCommentsByNovelId(novelId: string) {
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
      .is('status_note', null)  // 只获取普通评论，排除状态记录
      .order('created_at', { ascending: false })

    if (error) {
      return { data: [], error: error.message }
    }

    return { data: data || [] }
  } catch (error) {
    return { data: [], error: '获取评论失败' }
  }
}

/**
 * 添加评论
 */
export async function addComment(novelId: string, userId: string, content: string) {
  try {
    const { data, error } = await supabase
      .from('comments')
      .insert({
        novel_id: novelId,
        user_id: userId,
        content,
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
    return { data: null, error: '添加评论失败' }
  }
}

/**
 * 删除评论
 */
export async function deleteComment(commentId: string) {
  try {
    const { error } = await supabase
      .from('comments')
      .delete()
      .eq('id', commentId)

    if (error) {
      return { error: error.message }
    }

    return { success: true }
  } catch (error) {
    return { error: '删除评论失败' }
  }
}

