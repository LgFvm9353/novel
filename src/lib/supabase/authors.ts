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
    // 先查询小说基本信息
    const { data: novels, error: novelsError } = await supabase
      .from('novels')
      .select('*')
      .eq('author_id', authorId)
      .order('created_at', { ascending: false })

    if (novelsError) {
      console.error('Error fetching author novels:', novelsError)
      return { data: null, error: novelsError.message }
    }

    if (!novels || novels.length === 0) {
      return { data: [], error: null }
    }

    // 获取所有唯一的分类ID
    const categoryIds = [...new Set(novels.map((n: any) => n.category_id).filter(Boolean))]

    // 批量查询分类信息
    const categoriesResult = categoryIds.length > 0
      ? await supabase
          .from('categories')
          .select('id, name')
          .in('id', categoryIds)
      : { data: [], error: null }

    // 创建分类映射表
    const categoriesMap = new Map(
      (categoriesResult.data || []).map((c: any) => [c.id, c])
    )

    // 组合数据，添加分类信息和章节数
    const novelsWithRelations = novels.map((novel: any) => {
      // 从 chapters JSONB 字段计算章节数
      const chapters = (novel.chapters as any[]) || []
      const chapterCount = Array.isArray(chapters) ? chapters.length : 0

      return {
        ...novel,
        category: categoriesMap.get(novel.category_id) || null,
        chapters: { count: chapterCount },
      }
    })

    return { data: novelsWithRelations, error: null }
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
    // 清空章节（将chapters JSONB字段设为空数组）
    await supabase.from('novels').update({ chapters: [] }).eq('id', novelId)

    // 删除所有评论（包括状态记录）
    await supabase.from('comments').delete().eq('novel_id', novelId)

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
 * 创建章节（添加到novels表的chapters JSONB字段）
 */
export async function createChapter(chapterData: {
  novel_id: string
  chapter_number: number
  title: string
  content: string
}) {
  try {
    // 获取当前小说数据
    const { data: novel, error: fetchError } = await supabase
      .from('novels')
      .select('chapters')
      .eq('id', chapterData.novel_id)
      .single()

    if (fetchError) {
      return { data: null, error: fetchError.message }
    }

    // 计算字数
    const wordCount = chapterData.content.length

    // 生成UUID（兼容浏览器环境）
    const generateUUID = () => {
      if (typeof crypto !== 'undefined' && crypto.randomUUID) {
        return crypto.randomUUID()
      }
      // 降级方案
      return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
        const r = Math.random() * 16 | 0
        const v = c === 'x' ? r : (r & 0x3 | 0x8)
        return v.toString(16)
      })
    }

    // 创建新章节对象
    const newChapter = {
      id: generateUUID(),
      chapter_number: chapterData.chapter_number,
      title: chapterData.title,
      content: chapterData.content,
      word_count: wordCount,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    // 获取现有章节数组
    const chapters = (novel?.chapters as any[]) || []

    // 检查章节编号是否已存在
    if (chapters.some(ch => ch.chapter_number === chapterData.chapter_number)) {
      return { data: null, error: '章节编号已存在' }
    }

    // 添加新章节并排序（安全处理chapter_number可能不存在的情况）
    const updatedChapters = [...chapters, newChapter].sort(
      (a, b) => (a.chapter_number || 0) - (b.chapter_number || 0)
    )

    // 更新novels表的chapters字段（触发器会自动更新total_chapters和total_pages）
    const { data: updatedNovel, error: updateError } = await supabase
      .from('novels')
      .update({ chapters: updatedChapters })
      .eq('id', chapterData.novel_id)
      .select()
      .single()

    if (updateError) {
      console.error('Error creating chapter:', updateError)
      return { data: null, error: updateError.message }
    }

    return { data: newChapter, error: null }
  } catch (error) {
    console.error('Error:', error)
    return { data: null, error: '创建章节失败' }
  }
}

/**
 * 更新章节（更新novels表的chapters JSONB字段中的章节）
 */
export async function updateChapter(
  novelId: string,
  chapterNumber: number,
  updates: {
    title?: string
    content?: string
  }
) {
  try {
    // 获取当前小说数据
    const { data: novel, error: fetchError } = await supabase
      .from('novels')
      .select('chapters')
      .eq('id', novelId)
      .single()

    if (fetchError) {
      return { data: null, error: fetchError.message }
    }

    // 获取现有章节数组
    const chapters = (novel?.chapters as any[]) || []

    // 查找要更新的章节
    const chapterIndex = chapters.findIndex(
      (ch: any) => ch.chapter_number === chapterNumber
    )

    if (chapterIndex === -1) {
      return { data: null, error: '章节不存在' }
    }

    // 更新章节数据
    const updatedChapter = {
      ...chapters[chapterIndex],
      ...updates,
      updated_at: new Date().toISOString(),
    }

    // 如果有内容更新，重新计算字数
    if (updates.content) {
      updatedChapter.word_count = updates.content.length
    }

    // 更新章节数组
    chapters[chapterIndex] = updatedChapter

    // 更新novels表的chapters字段（触发器会自动更新total_chapters和total_pages）
    const { data: updatedNovel, error: updateError } = await supabase
      .from('novels')
      .update({ chapters })
      .eq('id', novelId)
      .select()
      .single()

    if (updateError) {
      console.error('Error updating chapter:', updateError)
      return { data: null, error: updateError.message }
    }

    return { data: updatedChapter, error: null }
  } catch (error) {
    console.error('Error:', error)
    return { data: null, error: '更新章节失败' }
  }
}

/**
 * 删除章节（从novels表的chapters JSONB字段中删除）
 */
export async function deleteChapter(novelId: string, chapterNumber: number) {
  try {
    // 获取当前小说数据
    const { data: novel, error: fetchError } = await supabase
      .from('novels')
      .select('chapters')
      .eq('id', novelId)
      .single()

    if (fetchError) {
      return { error: fetchError.message }
    }

    // 获取现有章节数组
    const chapters = (novel?.chapters as any[]) || []

    // 过滤掉要删除的章节
    const updatedChapters = chapters.filter(
      (ch: any) => ch.chapter_number !== chapterNumber
    )

    // 更新novels表的chapters字段（触发器会自动更新total_chapters和total_pages）
    const { error: updateError } = await supabase
      .from('novels')
      .update({ chapters: updatedChapters })
      .eq('id', novelId)

    if (updateError) {
      console.error('Error deleting chapter:', updateError)
      return { error: updateError.message }
    }

    return { error: null }
  } catch (error) {
    console.error('Error:', error)
    return { error: '删除章节失败' }
  }
}

/**
 * 更新小说的章节数（从chapters JSONB字段计算，触发器会自动更新，此函数已不需要）
 */
async function updateNovelChapterCount(novelId: string) {
  // 此函数已不需要，数据库触发器会自动更新章节数和页数
  // 保留此函数以避免破坏现有代码调用
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

    // 获取章节总数（从novels表的chapters JSONB字段统计）
    const { data: novels } = await supabase
      .from('novels')
      .select('id, chapters')
      .eq('author_id', authorId)

    const novelIds = novels?.map((n) => n?.id).filter(Boolean) || []

    let chapterCount = 0
    let commentCount = 0

    if (novelIds.length > 0 && novels && Array.isArray(novels)) {
      // 从chapters JSONB字段统计章节数
      chapterCount = novels.reduce((sum, novel) => {
        if (!novel) return sum
        const chapters = (novel.chapters as any[]) || []
        return sum + (Array.isArray(chapters) ? chapters.length : 0)
      }, 0)

      const { count: comments, error } = await supabase
        .from('comments')
        .select('*', { count: 'exact', head: true })
        .in('novel_id', novelIds)

      if (!error) {
        commentCount = comments || 0
      }
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

