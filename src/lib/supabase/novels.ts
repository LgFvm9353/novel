import { supabase } from './client'
import { Novel, NovelStatus } from '@/lib/types'

/**
 * 获取小说列表（带筛选、搜索、排序、分页）
 */
export async function getNovels({
  page = 1,
  pageSize = 12,
  categoryId,
  status,
  searchQuery,
  sortBy = 'updated_at',
  sortOrder = 'desc',
}: {
  page?: number
  pageSize?: number
  categoryId?: string
  status?: NovelStatus
  searchQuery?: string
  sortBy?: 'updated_at' | 'vote_count' | 'created_at'
  sortOrder?: 'asc' | 'desc'
} = {}) {
  try {
    // 如果有搜索关键词，需要特殊处理（因为要搜索作者名）
    if (searchQuery) {
      // 第一步：根据作者名找到作者ID
      const { data: authorsData } = await supabase
        .from('authors')
        .select('id')
        .ilike('name', `%${searchQuery}%`)

      const authorIds = authorsData?.map(a => a.id) || []

      // 第二步：分别查询标题匹配和作者匹配的小说，然后合并去重
      // 查询1：标题匹配
      let titleQuery = supabase
        .from('novels')
        .select(`
          *,
          authors!inner (
            id,
            name
          ),
          categories!inner (
            id,
            name
          )
        `, { count: 'estimated' })
        .ilike('title', `%${searchQuery}%`)

      if (categoryId) {
        titleQuery = titleQuery.eq('category_id', categoryId)
      }
      if (status) {
        titleQuery = titleQuery.eq('status', status)
      }

      const titleResult = await titleQuery

      // 查询2：作者匹配（如果有匹配的作者）
      let authorResult: any = { data: null, error: null, count: 0 }
      if (authorIds.length > 0) {
        let authorQuery = supabase
          .from('novels')
          .select(`
            *,
            authors!inner (
              id,
              name
            ),
            categories!inner (
              id,
              name
            )
          `, { count: 'estimated' })
          .in('author_id', authorIds)

        if (categoryId) {
          authorQuery = authorQuery.eq('category_id', categoryId)
        }
        if (status) {
          authorQuery = authorQuery.eq('status', status)
        }

        authorResult = await authorQuery
      }

      // 合并结果并去重（基于小说ID）
      const novelMap = new Map<string, any>()

      // 处理标题查询结果
      if (titleResult.data) {
        titleResult.data.forEach((novel: any) => {
          if (!novelMap.has(novel.id)) {
            novelMap.set(novel.id, novel)
          }
        })
      }

      // 处理作者查询结果
      if (authorResult.data) {
        authorResult.data.forEach((novel: any) => {
          if (!novelMap.has(novel.id)) {
            novelMap.set(novel.id, novel)
          }
        })
      }

      // 转换为数组并排序
      let allNovels = Array.from(novelMap.values())

      // 排序
      allNovels.sort((a, b) => {
        const aVal = a[sortBy]
        const bVal = b[sortBy]
        if (sortOrder === 'asc') {
          return aVal > bVal ? 1 : aVal < bVal ? -1 : 0
        } else {
          return aVal < bVal ? 1 : aVal > bVal ? -1 : 0
        }
      })

      // 分页
      const from = (page - 1) * pageSize
      const to = from + pageSize
      const paginatedNovels = allNovels.slice(from, to)

      return { 
        data: paginatedNovels, 
        count: novelMap.size // 使用去重后的实际数量
      }
    } else {
      // 没有搜索时，使用原来的逻辑
      let query = supabase
        .from('novels')
        .select(`
          *,
          authors!inner (
            id,
            name
          ),
          categories!inner (
            id,
            name
          )
        `, { count: 'estimated' })

      // 筛选：分类
      if (categoryId) {
        query = query.eq('category_id', categoryId)
      }

      // 筛选：状态
      if (status) {
        query = query.eq('status', status)
      }

      // 排序
      query = query.order(sortBy, { ascending: sortOrder === 'asc' })

      // 分页
      const from = (page - 1) * pageSize
      const to = from + pageSize - 1
      query = query.range(from, to)

      const { data, error, count } = await query

      if (error) {
        console.error('Error fetching novels:', error)
        return { data: [], count: 0, error: error.message }
      }

      return { data: data || [], count: count || 0 }
    }
  } catch (error) {
    console.error('Error in getNovels:', error)
    return { data: [], count: 0, error: '获取小说列表失败' }
  }
}

/**
 * 获取单个小说详情
 */
export async function getNovelById(id: string) {
  try {
    const { data, error } = await supabase
      .from('novels')
      .select(`
        *,
        authors (
          id,
          user_id,
          name,
          bio
        ),
        categories (
          id,
          name
        )
      `)
      .eq('id', id)
      .single()

    if (error) {
      return { data: null, error: error.message }
    }

    return { data }
  } catch (error) {
    return { data: null, error: '获取小说详情失败' }
  }
}

/**
 * 获取分类列表
 */
export async function getCategories() {
  try {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('name')

    if (error) {
      return { data: [], error: error.message }
    }

    return { data: data || [] }
  } catch (error) {
    return { data: [], error: '获取分类失败' }
  }
}

/**
 * 小说投票
 * @param novelId 小说ID
 * @param userId 用户ID
 */
export async function voteNovel(novelId: string, userId: string) {
  try {
    // 使用数据库函数来处理投票（更安全，绕过 RLS）
    const { data, error } = await supabase.rpc('increment_novel_vote_count', {
      novel_id_param: novelId,
      user_id_param: userId,
    })

    if (error) {
      console.error('Error voting novel:', error)
      // 处理特定的错误消息
      if (error.message?.includes('不能给自己的作品投票')) {
        return { error: '不能给自己的作品投票' }
      }
      if (error.message?.includes('小说不存在')) {
        return { error: '小说不存在' }
      }
      return { error: error.message || '投票失败' }
    }

    return { success: true, vote_count: data }
  } catch (error: any) {
    console.error('Error in voteNovel:', error)
    return { error: error.message || '投票失败' }
  }
}

/**
 * 检查用户是否已投票
 */
export async function hasUserVoted(novelId: string, userId: string) {
  try {
    const { data, error } = await supabase.rpc('has_user_voted', {
      novel_id_param: novelId,
      user_id_param: userId,
    })

    if (error) {
      console.error('Error checking vote status:', error)
      return false
    }

    return data || false
  } catch (error) {
    console.error('Error in hasUserVoted:', error)
    return false
  }
}

