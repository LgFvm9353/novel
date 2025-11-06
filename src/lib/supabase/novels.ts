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
        .select('*', { count: 'estimated' })
        .ilike('title', `%${searchQuery}%`)

      if (categoryId) {
        titleQuery = titleQuery.eq('category_id', categoryId)
      }
      if (status) {
        titleQuery = titleQuery.eq('status', status)
      }

      const titleResult = await titleQuery

      if (titleResult.error) {
        console.error('Error in title query:', titleResult.error)
        return { data: [], count: 0, error: titleResult.error.message }
      }

      // 查询2：作者匹配（如果有匹配的作者）
      let authorResult: any = { data: null, error: null, count: 0 }
      if (authorIds.length > 0) {
        let authorQuery = supabase
          .from('novels')
          .select('*', { count: 'estimated' })
          .in('author_id', authorIds)

        if (categoryId) {
          authorQuery = authorQuery.eq('category_id', categoryId)
        }
        if (status) {
          authorQuery = authorQuery.eq('status', status)
        }

        authorResult = await authorQuery
        
        if (authorResult.error) {
          console.error('Error in author query:', authorResult.error)
          // 如果作者查询失败，继续使用标题查询结果
        }
      }

      // 合并所有小说ID并去重
      const allNovelIds = new Set<string>()
      const novelsArray: any[] = []

      if (titleResult.data && Array.isArray(titleResult.data)) {
        titleResult.data.forEach((novel: any) => {
          if (novel?.id && !allNovelIds.has(novel.id)) {
            allNovelIds.add(novel.id)
            novelsArray.push(novel)
          }
        })
      }

      if (authorResult.data && Array.isArray(authorResult.data)) {
        authorResult.data.forEach((novel: any) => {
          if (novel?.id && !allNovelIds.has(novel.id)) {
            allNovelIds.add(novel.id)
            novelsArray.push(novel)
          }
        })
      }

      if (novelsArray.length === 0) {
        return { data: [], count: 0 }
      }

      // 获取所有唯一的作者ID和分类ID
      const novelAuthorIds = [...new Set(novelsArray.map((n: any) => n.author_id).filter(Boolean))]
      const novelCategoryIds = [...new Set(novelsArray.map((n: any) => n.category_id).filter(Boolean))]

      // 批量查询作者和分类
      const [authorsResult, categoriesResult] = await Promise.all([
        novelAuthorIds.length > 0
          ? supabase
              .from('authors')
              .select('id, name')
              .in('id', novelAuthorIds)
          : Promise.resolve({ data: [], error: null }),
        novelCategoryIds.length > 0
          ? supabase
              .from('categories')
              .select('id, name')
              .in('id', novelCategoryIds)
          : Promise.resolve({ data: [], error: null }),
      ])

      // 创建映射表
      const authorsMap = new Map(
        (authorsResult.data || []).map((a: any) => [a.id, a])
      )
      const categoriesMap = new Map(
        (categoriesResult.data || []).map((c: any) => [c.id, c])
      )

      // 组合数据并过滤
      const novelMap = new Map<string, any>()
      novelsArray.forEach((novel: any) => {
        if (novel?.id) {
          const novelWithRelations = {
            ...novel,
            authors: authorsMap.get(novel.author_id) || null,
            categories: categoriesMap.get(novel.category_id) || null,
          }
          // 只包含有作者和分类的小说
          if (novelWithRelations.authors && novelWithRelations.categories) {
            novelMap.set(novel.id, novelWithRelations)
          }
        }
      })

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
      // 没有搜索时，先尝试查询小说基本信息
      let query = supabase
        .from('novels')
        .select('*', { count: 'estimated' })

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

      const { data: novels, error, count } = await query

      if (error) {
        console.error('Error fetching novels:', error)
        return { data: [], count: 0, error: error.message }
      }

      if (!novels || novels.length === 0) {
        return { data: [], count: count || 0 }
      }

      // 获取所有唯一的作者ID和分类ID
      const authorIds = [...new Set(novels.map((n: any) => n.author_id).filter(Boolean))]
      const categoryIds = [...new Set(novels.map((n: any) => n.category_id).filter(Boolean))]

      // 批量查询作者和分类
      const [authorsResult, categoriesResult] = await Promise.all([
        authorIds.length > 0
          ? supabase
              .from('authors')
              .select('id, name')
              .in('id', authorIds)
          : Promise.resolve({ data: [], error: null }),
        categoryIds.length > 0
          ? supabase
              .from('categories')
              .select('id, name')
              .in('id', categoryIds)
          : Promise.resolve({ data: [], error: null }),
      ])

      // 创建映射表
      const authorsMap = new Map(
        (authorsResult.data || []).map((a: any) => [a.id, a])
      )
      const categoriesMap = new Map(
        (categoriesResult.data || []).map((c: any) => [c.id, c])
      )

      // 组合数据
      const novelsWithRelations = novels.map((novel: any) => ({
        ...novel,
        authors: authorsMap.get(novel.author_id) || null,
        categories: categoriesMap.get(novel.category_id) || null,
      }))

      // 过滤掉没有作者或分类的小说（确保数据完整性）
      const filteredData = novelsWithRelations.filter(
        (novel: any) => novel?.authors && novel?.categories
      )

      return { data: filteredData, count: count || 0 }
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
    // 先查询小说基本信息
    const { data: novel, error: novelError } = await supabase
      .from('novels')
      .select('*')
      .eq('id', id)
      .single()

    if (novelError || !novel) {
      return { data: null, error: novelError?.message || '小说不存在' }
    }

    // 分别查询作者和分类信息
    const [authorResult, categoryResult] = await Promise.all([
      supabase
        .from('authors')
        .select('id, user_id, name, bio')
        .eq('id', novel.author_id)
        .single(),
      novel.category_id
        ? supabase
            .from('categories')
            .select('id, name')
            .eq('id', novel.category_id)
            .single()
        : Promise.resolve({ data: null, error: null }),
    ])

    // 组合数据
    const result = {
      ...novel,
      authors: authorResult.data || null,
      categories: categoryResult.data || null,
    }

    return { data: result }
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

