'use client'

import { useEffect } from 'react'
import { useAuthStore } from '@/lib/store/authStore'
import { getCurrentUser } from '@/lib/supabase/auth'
import { supabase } from '@/lib/supabase/client'

/**
 * 认证提供者组件
 * 用于初始化用户认证状态并监听 Supabase Auth 变化
 * 应在根布局中使用，确保全局只初始化一次
 */
export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const { user, userProfile, setUser, setUserProfile, setInitialized } = useAuthStore()

  useEffect(() => {
    let mounted = true
    let authListener: any = null

    const initAuth = async () => {
      try {
        // 首次检查登录状态
        const { data } = await getCurrentUser()
        
        if (!mounted) return
        
        if (data) {
          setUser(data.user)
          setUserProfile(data.profile)
        }
      } catch (error) {
        console.error('Error initializing auth:', error)
      } finally {
        setInitialized(true)
      }

      // 监听 Supabase Auth 状态变化（登录、退出、token刷新等）
      authListener = supabase.auth.onAuthStateChange(
        async (event, session) => {
          console.log('Auth state changed:', event, session?.user?.id)
          
          if (!mounted) return
          
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
        }
      )
    }

    // 只在首次加载时初始化
    if (!user && !userProfile) {
      initAuth()
    }

    return () => {
      mounted = false
      if (authListener?.subscription) {
        authListener.subscription.unsubscribe()
      }
    }
  }, [user, userProfile, setUser, setUserProfile, setInitialized])

  return <>{children}</>
}

