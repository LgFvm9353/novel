import { UserRole } from '@/lib/types'

/**
 * 权限控制工具函数
 */

// 定义所有权限类型
export type Permission =
  | 'view_novels'
  | 'add_comments'
  | 'add_status_logs'
  | 'create_novel'
  | 'edit_own_novel'
  | 'delete_own_novel'
  | 'create_chapter'
  | 'edit_own_chapter'
  | 'delete_own_chapter'
  | 'edit_any_novel'
  | 'delete_any_novel'
  | 'edit_any_chapter'
  | 'delete_any_chapter'
  | 'manage_users'
  | 'manage_authors'
  | 'manage_categories'
  | 'delete_comments'

// 角色权限映射
export const ROLE_PERMISSIONS = {
  reader: ['view_novels', 'add_comments', 'add_status_logs'],
  author: [
    'view_novels',
    'add_comments',
    'add_status_logs',
    'create_novel',
    'edit_own_novel',
    'delete_own_novel',
    'create_chapter',
    'edit_own_chapter',
    'delete_own_chapter',
  ],
  admin: [
    'view_novels',
    'add_comments',
    'add_status_logs',
    'create_novel',
    'edit_own_novel',
    'delete_own_novel',
    'create_chapter',
    'edit_own_chapter',
    'delete_own_chapter',
    'edit_any_novel',
    'delete_any_novel',
    'edit_any_chapter',
    'delete_any_chapter',
    'manage_users',
    'manage_authors',
    'manage_categories',
    'delete_comments',
  ],
} as const

/**
 * 检查用户是否有指定权限
 */
export function hasPermission(
  userRole: UserRole | null | undefined,
  permission: Permission | string
): boolean {
  if (!userRole) return false
  return (ROLE_PERMISSIONS[userRole] as readonly string[]).includes(permission) || false
}

/**
 * 检查用户是否有任意一个权限
 */
export function hasAnyPermission(
  userRole: UserRole | null | undefined,
  permissions: (Permission | string)[]
): boolean {
  if (!userRole) return false
  return permissions.some((p) => hasPermission(userRole, p))
}

/**
 * 检查用户是否有所有指定权限
 */
export function hasAllPermissions(
  userRole: UserRole | null | undefined,
  permissions: (Permission | string)[]
): boolean {
  if (!userRole) return false
  return permissions.every((p) => hasPermission(userRole, p))
}

/**
 * 检查用户是否是指定角色
 */
export function hasRole(
  userRole: UserRole | null | undefined,
  role: UserRole
): boolean {
  return userRole === role
}

/**
 * 检查用户是否是任意一个指定角色
 */
export function hasAnyRole(
  userRole: UserRole | null | undefined,
  roles: UserRole[]
): boolean {
  if (!userRole) return false
  return roles.includes(userRole)
}

/**
 * 检查是否是作者或管理员
 */
export function isAuthorOrAdmin(
  userRole: UserRole | null | undefined
): boolean {
  return hasAnyRole(userRole, ['author', 'admin'])
}

/**
 * 检查是否是管理员
 */
export function isAdmin(userRole: UserRole | null | undefined): boolean {
  return hasRole(userRole, 'admin')
}

/**
 * 检查用户是否可以编辑指定资源
 * @param userRole 用户角色
 * @param resourceOwnerId 资源所有者ID
 * @param currentUserId 当前用户ID
 */
export function canEditResource(
  userRole: UserRole | null | undefined,
  resourceOwnerId: string,
  currentUserId: string | undefined
): boolean {
  if (!userRole || !currentUserId) return false

  // 管理员可以编辑任何资源
  if (isAdmin(userRole)) return true

  // 资源所有者可以编辑自己的资源
  return resourceOwnerId === currentUserId
}

