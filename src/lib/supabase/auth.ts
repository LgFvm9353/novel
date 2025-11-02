import { supabase } from './client'
import { UserRole } from '@/lib/types'

/**
 * 用户注册
 * 将用户名转换为 email 格式以适配 Supabase Auth
 */
export async function registerUser(username: string, password: string) {
  try {
    // 1. 转换用户名为 email 格式（使用 .app 域名以通过 Supabase 验证）
    const email = `${username}@novel.app`

    // 2. 使用 Supabase Auth 注册
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          username,
        },
      },
    })

    if (authError) {
      console.error('Auth error:', authError)
      
      // 处理各种错误类型
      const errorMsg = authError.message.toLowerCase()
      
      if (errorMsg.includes('already registered') || errorMsg.includes('already exists')) {
        return { error: '用户名已被注册' }
      }
      
      if (errorMsg.includes('rate limit') || errorMsg.includes('too many requests')) {
        return { error: 'For security purposes, you can only request this after some time.' }
      }
      
      if (errorMsg.includes('email') && errorMsg.includes('invalid')) {
        return { error: '用户名格式不正确' }
      }
      
      return { error: authError.message }
    }

    const user = authData.user

    if (!user) {
      return { error: '注册失败，未返回用户信息' }
    }

    let session = authData.session

    // 如果注册成功但没有返回 session，尝试自动登录以获取 session
    if (!session) {
      const {
        data: loginData,
        error: loginError,
      } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (loginError) {
        console.error('Auto login error:', loginError)
        return { error: '注册成功，但自动登录失败，请稍后重试' }
      }

      session = loginData.session
    }

    if (!session) {
      return { error: '注册失败，未能建立会话' }
    }

    // 3. 等待一小段时间，确保 Auth session 已建立
    await new Promise((resolve) => setTimeout(resolve, 100))

    // 4. 在 users 表中创建用户记录
    // 注意：此时 supabase client 会自动使用新创建用户的 session token
    const { error: dbError } = await supabase.from('users').insert({
      id: user.id,
      username,
      role: 'reader' as UserRole,
    })

    if (dbError) {
      console.error('Database error:', dbError)

      // 处理唯一索引冲突（用户记录已存在）的情况
      if (dbError.code === '23505') {
        await supabase.auth.signOut()
        return { error: '用户名已被注册' }
      }

      await supabase.auth.signOut()
      return { error: '注册失败，请稍后重试' }
    }

    // 5. 注册成功后退出登录，让用户手动登录
    await supabase.auth.signOut()

    return { data: user }
  } catch (error) {
    console.error('Registration error:', error)
    return { error: '注册过程中发生错误' }
  }
}

/**
 * 用户登录
 */
export async function loginUser(username: string, password: string) {
  try {
    // 1. 转换用户名为 email 格式（使用 .app 域名以通过 Supabase 验证）
    const email = `${username}@novel.app`

    // 2. 使用 Supabase Auth 登录
    const { data: authData, error: authError } =
      await supabase.auth.signInWithPassword({
        email,
        password,
      })

    if (authError) {
      return { error: '用户名或密码错误' }
    }

    if (!authData.user) {
      return { error: '登录失败' }
    }

    // 3. 获取用户信息
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', authData.user.id)
      .single()

    if (userError || !userData) {
      return { error: '获取用户信息失败' }
    }

    return { data: { user: authData.user, profile: userData } }
  } catch (error) {
    return { error: '登录过程中发生错误' }
  }
}

/**
 * 用户退出
 */
export async function logoutUser() {
  const { error } = await supabase.auth.signOut()
  return { error }
}

/**
 * 获取当前用户
 */
export async function getCurrentUser() {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { data: null }
    }

    // 获取用户信息
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single()

    if (userError || !userData) {
      return { data: null }
    }

    return { data: { user, profile: userData } }
  } catch (error) {
    return { data: null }
  }
}
