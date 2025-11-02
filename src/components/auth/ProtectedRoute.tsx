'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/lib/store/authStore'
import { UserRole } from '@/lib/types'
import { hasAnyRole } from '@/lib/utils/permissions'

interface ProtectedRouteProps {
  children: React.ReactNode
  requiredRoles?: UserRole[]
  redirectTo?: string
  loadingComponent?: React.ReactNode
}

/**
 * 路由保护组件
 * 用于保护需要特定角色才能访问的页面
 */
export default function ProtectedRoute({
  children,
  requiredRoles,
  redirectTo = '/login',
  loadingComponent,
}: ProtectedRouteProps) {
  const router = useRouter()
  const { user, userProfile } = useAuthStore()

  useEffect(() => {
    // 如果没有登录，重定向到登录页
    if (!user) {
      router.push(redirectTo)
      return
    }

    // 如果需要特定角色，检查用户是否有权限
    if (requiredRoles && !hasAnyRole(userProfile?.role, requiredRoles)) {
      router.push('/') // 重定向到首页
    }
  }, [user, userProfile, requiredRoles, redirectTo, router])

  // 如果没有登录或没有权限，显示加载状态
  if (!user || (requiredRoles && !hasAnyRole(userProfile?.role, requiredRoles))) {
    return loadingComponent || (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-600">加载中...</div>
      </div>
    )
  }

  return <>{children}</>
}

