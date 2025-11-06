import { supabase } from './client'
import { UserRole } from '@/lib/types'

/**
 * 获取所有用户
 */
export async function getAllUsers() {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching users:', error)
      return { data: null, error: error.message }
    }

    return { data, error: null }
  } catch (error) {
    console.error('Error:', error)
    return { data: null, error: '获取用户列表失败' }
  }
}

/**
 * 获取非作者用户列表（用于创建新作者时选择）
 */
export async function getNonAuthorUsers() {
  try {
    // 先获取所有作者的用户ID
    const { data: authors, error: authorsError } = await supabase
      .from('authors')
      .select('user_id')

    if (authorsError) {
      console.error('Error fetching authors:', authorsError)
      return { data: null, error: authorsError.message }
    }

    const authorUserIds = authors?.map(a => a.user_id).filter(Boolean) || []

    // 获取所有用户
    const { data: allUsers, error: usersError } = await supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false })

    if (usersError) {
      console.error('Error fetching users:', usersError)
      return { data: null, error: usersError.message }
    }

    // 在内存中过滤掉已经是作者的用户
    const nonAuthorUsers = (allUsers || []).filter(
      (user) => !authorUserIds.includes(user.id)
    )

    return { data: nonAuthorUsers, error: null }
  } catch (error) {
    console.error('Error:', error)
    return { data: null, error: '获取用户列表失败' }
  }
}

/**
 * 更新用户角色
 */
export async function updateUserRole(userId: string, role: UserRole) {
  try {
    const { data, error } = await supabase
      .from('users')
      .update({ role })
      .eq('id', userId)
      .select()
      .single()

    if (error) {
      console.error('Error updating user role:', error)
      return { data: null, error: error.message }
    }

    return { data, error: null }
  } catch (error) {
    console.error('Error:', error)
    return { data: null, error: '更新用户角色失败' }
  }
}

/**
 * 删除用户（需要先删除相关数据）
 */
export async function deleteUser(userId: string) {
  try {
    // 删除用户的评论（包括状态记录，因为状态记录也存储在comments表中）
    await supabase.from('comments').delete().eq('user_id', userId)

    // 如果是作者，删除作者信息（级联删除小说和章节）
    const { data: author, error: authorError } = await supabase
      .from('authors')
      .select('id')
      .eq('user_id', userId)
      .single()

    // 如果用户不是作者，authorError.code 会是 'PGRST116'，这是正常的
    if (authorError && authorError.code !== 'PGRST116') {
      console.error('Error checking author:', authorError)
      return { error: '检查作者信息失败' }
    }

    if (author) {
      // 获取作者的所有小说
      const { data: novels } = await supabase
        .from('novels')
        .select('id')
        .eq('author_id', author.id)

      if (novels && novels.length > 0) {
        const novelIds = novels.map((n) => n.id)

        // 清空章节（将chapters JSONB字段设为空数组）
        await supabase.from('novels').update({ chapters: [] }).in('id', novelIds)

        // 删除评论（包括状态记录）
        await supabase.from('comments').delete().in('novel_id', novelIds)

        // 删除小说
        await supabase.from('novels').delete().in('id', novelIds)
      }

      // 删除作者信息
      await supabase.from('authors').delete().eq('id', author.id)
    }

    // 最后删除用户
    const { error } = await supabase.from('users').delete().eq('id', userId)

    if (error) {
      console.error('Error deleting user:', error)
      return { error: error.message }
    }

    return { error: null }
  } catch (error) {
    console.error('Error:', error)
    return { error: '删除用户失败' }
  }
}

/**
 * 获取所有作者
 */
export async function getAllAuthors() {
  try {
    // 先获取作者列表和用户信息
    const { data: authors, error: authorsError } = await supabase
      .from('authors')
      .select(`
        *,
        user:users!authors_user_id_fkey(id, username)
      `)
      .order('created_at', { ascending: false })

    if (authorsError) {
      console.error('Error fetching authors:', authorsError)
      return { data: null, error: authorsError.message }
    }

    if (!authors || authors.length === 0) {
      return { data: [], error: null }
    }

    // 获取每个作者的小说数量
    const authorsWithNovelCount = await Promise.all(
      authors.map(async (author) => {
        const { count, error: countError } = await supabase
          .from('novels')
          .select('*', { count: 'exact', head: true })
          .eq('author_id', author.id)

        return {
          ...author,
          novel_count: countError ? 0 : (count || 0),
        }
      })
    )

    return { data: authorsWithNovelCount, error: null }
  } catch (error) {
    console.error('Error:', error)
    return { data: null, error: '获取作者列表失败' }
  }
}

/**
 * 创建作者（将普通用户提升为作者）
 */
export async function createAuthor(userId: string, pen_name: string, bio?: string) {
  try {
    // 1. 检查用户是否已经是作者
    const { data: existingAuthor, error: checkError } = await supabase
      .from('authors')
      .select('id, name')
      .eq('user_id', userId)
      .single()

    if (checkError && checkError.code !== 'PGRST116') {
      // PGRST116 是"未找到记录"的错误代码，这是正常的
      console.error('Error checking existing author:', checkError)
      return { data: null, error: '检查作者状态失败' }
    }

    if (existingAuthor) {
      return { data: null, error: `该用户已经是作者（笔名：${existingAuthor.name}）` }
    }

    // 2. 检查用户是否存在
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, role')
      .eq('id', userId)
      .single()

    if (userError || !user) {
      return { data: null, error: '用户不存在' }
    }

    // 3. 先更新用户角色
    const { error: roleError } = await updateUserRole(userId, 'author')

    if (roleError) {
      return { data: null, error: roleError }
    }

    // 4. 创建作者信息
    const { data, error } = await supabase
      .from('authors')
      .insert({
        user_id: userId,
        name: pen_name,  
        bio: bio || '',
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating author:', error)
      // 如果创建失败，回滚用户角色
      await updateUserRole(userId, user.role || 'reader')
      
      // 处理唯一约束错误
      if (error.code === '23505') {
        return { data: null, error: '笔名已被使用' }
      }
      
      return { data: null, error: error.message }
    }

    return { data, error: null }
  } catch (error) {
    console.error('Error:', error)
    return { data: null, error: '创建作者失败' }
  }
}

/**
 * 更新作者信息
 */
export async function updateAuthor(
  authorId: string,
  updates: {
    name?: string
    bio?: string
  }
) {
  try {
    const { data, error } = await supabase
      .from('authors')
      .update(updates)
      .eq('id', authorId)
      .select()
      .single()

    if (error) {
      console.error('Error updating author:', error)
      return { data: null, error: error.message }
    }

    return { data, error: null }
  } catch (error) {
    console.error('Error:', error)
    return { data: null, error: '更新作者信息失败' }
  }
}

/**
 * 删除作者（将作者降级为普通用户）
 */
export async function removeAuthor(authorId: string, userId: string) {
  try {
    // 获取作者的所有小说
    const { data: novels } = await supabase
      .from('novels')
      .select('id')
      .eq('author_id', authorId)

    if (novels && novels.length > 0) {
      return {
        error: '该作者还有小说，请先删除或转移所有小说后再进行操作',
      }
    }

    // 删除作者信息
    const { error: deleteError } = await supabase
      .from('authors')
      .delete()
      .eq('id', authorId)

    if (deleteError) {
      console.error('Error deleting author:', deleteError)
      return { error: deleteError.message }
    }

    // 将用户角色降级为普通读者
    await updateUserRole(userId, 'reader')

    return { error: null }
  } catch (error) {
    console.error('Error:', error)
    return { error: '删除作者失败' }
  }
}

/**
 * 获取系统统计信息
 */
export async function getSystemStats() {
  try {
    // 获取用户总数
    const { count: userCount } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })

    // 获取作者总数
    const { count: authorCount } = await supabase
      .from('authors')
      .select('*', { count: 'exact', head: true })

    // 获取小说总数
    const { count: novelCount } = await supabase
      .from('novels')
      .select('*', { count: 'exact', head: true })

    // 获取章节总数（从novels表的chapters JSONB字段统计）
    const { data: novels } = await supabase
      .from('novels')
      .select('chapters')
    
    const chapterCount = novels?.reduce((sum, novel) => {
      if (!novel) return sum
      const chapters = (novel.chapters as any[]) || []
      return sum + (Array.isArray(chapters) ? chapters.length : 0)
    }, 0) || 0

    // 获取评论总数
    const { count: commentCount } = await supabase
      .from('comments')
      .select('*', { count: 'exact', head: true })

    return {
      data: {
        userCount: userCount || 0,
        authorCount: authorCount || 0,
        novelCount: novelCount || 0,
        chapterCount: chapterCount || 0,
        commentCount: commentCount || 0,
        totalViews: 0,  // 数据库中不存在 view_count 字段
      },
      error: null,
    }
  } catch (error) {
    console.error('Error:', error)
    return {
      data: null,
      error: '获取系统统计失败',
    }
  }
}

/**
 * 获取所有分类
 */
export async function getCategories() {
  try {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('name', { ascending: true })

    if (error) {
      console.error('Error fetching categories:', error)
      return { data: null, error: error.message }
    }

    return { data, error: null }
  } catch (error) {
    console.error('Error:', error)
    return { data: null, error: '获取分类列表失败' }
  }
}

/**
 * 创建分类
 */
export async function createCategory(name: string) {
  try {
    const { data, error } = await supabase
      .from('categories')
      .insert({ name })
      .select()
      .single()

    if (error) {
      console.error('Error creating category:', error)
      return { data: null, error: error.message }
    }

    return { data, error: null }
  } catch (error) {
    console.error('Error:', error)
    return { data: null, error: '创建分类失败' }
  }
}

/**
 * 更新分类
 */
export async function updateCategory(categoryId: string, name: string) {
  try {
    const { data, error } = await supabase
      .from('categories')
      .update({ name })
      .eq('id', categoryId)
      .select()
      .single()

    if (error) {
      console.error('Error updating category:', error)
      return { data: null, error: error.message }
    }

    return { data, error: null }
  } catch (error) {
    console.error('Error:', error)
    return { data: null, error: '更新分类失败' }
  }
}

/**
 * 删除分类
 */
export async function deleteCategory(categoryId: string) {
  try {
    // 检查是否有小说使用该分类
    const { count } = await supabase
      .from('novels')
      .select('*', { count: 'exact', head: true })
      .eq('category_id', categoryId)

    if (count && count > 0) {
      return { error: '该分类下还有小说，无法删除' }
    }

    const { error } = await supabase
      .from('categories')
      .delete()
      .eq('id', categoryId)

    if (error) {
      console.error('Error deleting category:', error)
      return { error: error.message }
    }

    return { error: null }
  } catch (error) {
    console.error('Error:', error)
    return { error: '删除分类失败' }
  }
}

