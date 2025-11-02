import { supabase } from './client'
import { User } from '@/lib/types'

/**
 * 获取用户信息
 */
export async function getUserProfile(userId: string) {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single()

    if (error) {
      console.error('Error fetching user profile:', error)
      return { data: null, error: error.message }
    }

    return { data: data as User, error: null }
  } catch (error) {
    console.error('Error:', error)
    return { data: null, error: '获取用户信息失败' }
  }
}

/**
 * 更新用户信息
 */
export async function updateUserProfile(
  userId: string,
  updates: Partial<User>
) {
  try {
    const { data, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', userId)
      .select()
      .single()

    if (error) {
      console.error('Error updating user profile:', error)
      return { data: null, error: error.message }
    }

    return { data: data as User, error: null }
  } catch (error) {
    console.error('Error:', error)
    return { data: null, error: '更新用户信息失败' }
  }
}

/**
 * 获取用户的评论列表
 */
export async function getUserComments(userId: string) {
  try {
    const { data, error } = await supabase
      .from('comments')
      .select(
        `
        *,
        novel:novels!comments_novel_id_fkey(id, title)
      `
      )
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching user comments:', error)
      return { data: null, error: error.message }
    }

    return { data, error: null }
  } catch (error) {
    console.error('Error:', error)
    return { data: null, error: '获取评论列表失败' }
  }
}

/**
 * 获取用户的状态记录列表
 */
export async function getUserStatusLogs(userId: string) {
  try {
    const { data, error } = await supabase
      .from('novel_status_logs')
      .select(
        `
        *,
        novel:novels!novel_status_logs_novel_id_fkey(id, title, cover_image)
      `
      )
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching user status logs:', error)
      return { data: null, error: error.message }
    }

    return { data, error: null }
  } catch (error) {
    console.error('Error:', error)
    return { data: null, error: '获取状态记录失败' }
  }
}

/**
 * 删除用户评论
 */
export async function deleteUserComment(commentId: string, userId: string) {
  try {
    const { error } = await supabase
      .from('comments')
      .delete()
      .eq('id', commentId)
      .eq('user_id', userId)

    if (error) {
      console.error('Error deleting comment:', error)
      return { error: error.message }
    }

    return { error: null }
  } catch (error) {
    console.error('Error:', error)
    return { error: '删除评论失败' }
  }
}

/**
 * 删除用户状态记录
 */
export async function deleteUserStatusLog(logId: string, userId: string) {
  try {
    const { error } = await supabase
      .from('novel_status_logs')
      .delete()
      .eq('id', logId)
      .eq('user_id', userId)

    if (error) {
      console.error('Error deleting status log:', error)
      return { error: error.message }
    }

    return { error: null }
  } catch (error) {
    console.error('Error:', error)
    return { error: '删除状态记录失败' }
  }
}

