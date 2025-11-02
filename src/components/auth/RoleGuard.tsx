'use client'

import { useAuthStore } from '@/lib/store/authStore'
import { UserRole } from '@/lib/types'
import { hasAnyRole } from '@/lib/utils/permissions'

interface RoleGuardProps {
  children: React.ReactNode
  requiredRoles: UserRole[]
  fallback?: React.ReactNode
}

/**
 * 角色保护组件
 * 用于根据用户角色显示或隐藏内容
 */
export default function RoleGuard({
  children,
  requiredRoles,
  fallback = null,
}: RoleGuardProps) {
  const { userProfile } = useAuthStore()

  if (!hasAnyRole(userProfile?.role, requiredRoles)) {
    return <>{fallback}</>
  }

  return <>{children}</>
}

