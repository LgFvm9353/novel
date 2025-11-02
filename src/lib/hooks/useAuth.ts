'use client'

import { useEffect, useState } from 'react'
import { useAuthStore } from '@/lib/store/authStore'
import { getCurrentUser, logoutUser } from '@/lib/supabase/auth'
import { supabase } from '@/lib/supabase/client'

export function useAuth() {
  const { user, userProfile, setUser, setUserProfile, logout: storeLogout } = useAuthStore()
  const [loading, setLoading] = useState(true)

  // 初始化时检查登录状态并监听 auth 状态变化
  useEffect(() => {
    // 首次检查登录状态
    checkAuth()

    // 监听 Supabase Auth 状态变化（登录、退出、token刷新等）
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session?.user?.id)
        
        if (session?.user) {
          // 用户已登录，获取完整的用户信息
          const { data } = await getCurrentUser()
          if (data) {
            setUser(data.user)
            setUserProfile(data.profile)
          }
        } else {
          // 用户已退出
          setUser(null)
          setUserProfile(null)
        }
        
        setLoading(false)
      }
    )

    // 清理监听器
    return () => {
      authListener.subscription.unsubscribe()
    }
  }, [setUser, setUserProfile])

  const checkAuth = async () => {
    setLoading(true)
    try {
      const { data } = await getCurrentUser()
      if (data) {
        setUser(data.user)
        setUserProfile(data.profile)
      } else {
        setUser(null)
        setUserProfile(null)
      }
    } catch (error) {
      console.error('Error checking auth:', error)
      setUser(null)
      setUserProfile(null)
    } finally {
      setLoading(false)
    }
  }

  const logout = async () => {
    await logoutUser()
    storeLogout()
  }

  return {
    user,
    userProfile,
    isAuthenticated: !!user,
    isReader: userProfile?.role === 'reader',
    isAuthor: userProfile?.role === 'author',
    isAdmin: userProfile?.role === 'admin',
    loading,
    logout,
    checkAuth,
  }
}

