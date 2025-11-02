import { supabase } from './client'

// 状态值映射：英文 -> 中文（匹配数据库）
const statusMap: Record<string, string> = {
  ongoing: '连载中',
  finished: '已完结',
  paused: '已暂停',
}

const reverseStatusMap: Record<string, string> = {
  连载中: 'ongoing',
  已完结: 'finished',
  已暂停: 'paused',
}

/**
 * 获取作者信息
 */
export async function getAuthorByUserId(userId: string) {
  try {
    const { data, error } = await supabase
      .from('authors')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        // 没有找到作者记录
        return { data: null, error: null }
      }
      console.error('Error fetching author:', error)
      return { data: null, error: error.message }
    }

    return { data, error: null }
  } catch (error) {
    console.error('Error:', error)
    return { data: null, error: '获取作者信息失败' }
  }
}

/**
 * 获取作者的所有小说
 */
export async function getAuthorNovels(authorId: string) {
  try {
    const { data, error } = await supabase
      .from('novels')
      .select(
        `
        *,
        category:categories!novels_category_id_fkey(id, name),
        chapters:chapters(count)
      `
      )
      .eq('author_id', authorId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching author novels:', error)
      return { data: null, error: error.message }
    }

    return { data, error: null }
  } catch (error) {
    console.error('Error:', error)
    return { data: null, error: '获取小说列表失败' }
  }
}

/**
 * 创建新小说
 */
export async function createNovel(novelData: {
  title: string
  author_id: string
  category_id: string
  description: string
  cover_image?: string
  status?: string
}) {
  try {
    // 将英文状态转换为中文
    const dbStatus = novelData.status ? statusMap[novelData.status] || novelData.status : '连载中'
    
    const { data, error } = await supabase
      .from('novels')
      .insert({
        ...novelData,
        status: dbStatus,
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating novel:', error)
      return { data: null, error: error.message }
    }

    return { data, error: null }
  } catch (error) {
    console.error('Error:', error)
    return { data: null, error: '创建小说失败' }
  }
}

/**
 * 更新小说信息
 */
export async function updateNovel(
  novelId: string,
  updates: {
    title?: string
    category_id?: string
    description?: string
    cover_image?: string
    status?: string
  }
) {
  try {
    // 将英文状态转换为中文
    const dbUpdates = { ...updates }
    if (dbUpdates.status) {
      dbUpdates.status = statusMap[dbUpdates.status] || dbUpdates.status
    }
    
    const { data, error } = await supabase
      .from('novels')
      .update(dbUpdates)
      .eq('id', novelId)
      .select()
      .single()

    if (error) {
      console.error('Error updating novel:', error)
      return { data: null, error: error.message }
    }

    return { data, error: null }
  } catch (error) {
    console.error('Error:', error)
    return { data: null, error: '更新小说失败' }
  }
}

/**
 * 删除小说
 */
export async function deleteNovel(novelId: string) {
  try {
    // 先删除所有章节
    await supabase.from('chapters').delete().eq('novel_id', novelId)

    // 删除所有评论
    await supabase.from('comments').delete().eq('novel_id', novelId)

    // 删除所有状态记录
    await supabase.from('novel_status_logs').delete().eq('novel_id', novelId)

    // 最后删除小说
    const { error } = await supabase.from('novels').delete().eq('id', novelId)

    if (error) {
      console.error('Error deleting novel:', error)
      return { error: error.message }
    }

    return { error: null }
  } catch (error) {
    console.error('Error:', error)
    return { error: '删除小说失败' }
  }
}

/**
 * 创建章节
 */
export async function createChapter(chapterData: {
  novel_id: string
  chapter_number: number
  title: string
  content: string
}) {
  try {
    // 计算字数
    const wordCount = chapterData.content.length
    
    const { data, error } = await supabase
      .from('chapters')
      .insert({
        ...chapterData,
        word_count: wordCount,
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating chapter:', error)
      return { data: null, error: error.message }
    }

    // 注意：数据库触发器会自动更新章节数和页数，无需手动调用

    return { data, error: null }
  } catch (error) {
    console.error('Error:', error)
    return { data: null, error: '创建章节失败' }
  }
}

/**
 * 更新章节
 */
export async function updateChapter(
  chapterId: string,
  updates: {
    title?: string
    content?: string
  }
) {
  try {
    // 如果有内容更新，计算字数
    const updateData: any = { ...updates }
    if (updates.content) {
      updateData.word_count = updates.content.length
    }
    
    const { data, error } = await supabase
      .from('chapters')
      .update(updateData)
      .eq('id', chapterId)
      .select()
      .single()

    if (error) {
      console.error('Error updating chapter:', error)
      return { data: null, error: error.message }
    }

    return { data, error: null }
  } catch (error) {
    console.error('Error:', error)
    return { data: null, error: '更新章节失败' }
  }
}

/**
 * 删除章节
 */
export async function deleteChapter(chapterId: string, novelId: string) {
  try {
    const { error } = await supabase
      .from('chapters')
      .delete()
      .eq('id', chapterId)

    if (error) {
      console.error('Error deleting chapter:', error)
      return { error: error.message }
    }

    // 注意：数据库触发器会自动更新章节数和页数，无需手动调用

    return { error: null }
  } catch (error) {
    console.error('Error:', error)
    return { error: '删除章节失败' }
  }
}

/**
 * 更新小说的章节数
 */
async function updateNovelChapterCount(novelId: string) {
  try {
    const { count } = await supabase
      .from('chapters')
      .select('*', { count: 'exact', head: true })
      .eq('novel_id', novelId)

    const { error } = await supabase
      .from('novels')
      .update({ total_chapters: count || 0 })
      .eq('id', novelId)
    
    if (error) {
      console.error('Error updating novel chapter count:', error)
    }
  } catch (error) {
    console.error('Error in updateNovelChapterCount:', error)
  }
}

/**
 * 获取作者统计信息
 */
export async function getAuthorStats(authorId: string) {
  try {
    // 获取小说总数
    const { count: novelCount } = await supabase
      .from('novels')
      .select('*', { count: 'exact', head: true })
      .eq('author_id', authorId)

    // 获取章节总数
    const { data: novels } = await supabase
      .from('novels')
      .select('id')
      .eq('author_id', authorId)

    const novelIds = novels?.map((n) => n.id) || []

    let chapterCount = 0
    let commentCount = 0

    if (novelIds.length > 0) {
      const { count: chapters } = await supabase
        .from('chapters')
        .select('*', { count: 'exact', head: true })
        .in('novel_id', novelIds)

      const { count: comments } = await supabase
        .from('comments')
        .select('*', { count: 'exact', head: true })
        .in('novel_id', novelIds)

      chapterCount = chapters || 0
      commentCount = comments || 0
    }

    return {
      data: {
        novelCount: novelCount || 0,
        chapterCount,
        commentCount,
        viewCount: 0,  // 数据库中不存在此字段，暂时返回 0
      },
      error: null,
    }
  } catch (error) {
    console.error('Error:', error)
    return {
      data: null,
      error: '获取统计信息失败',
    }
  }
}

