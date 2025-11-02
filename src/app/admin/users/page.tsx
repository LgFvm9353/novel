'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/lib/store/authStore'
import ProtectedRoute from '@/components/auth/ProtectedRoute'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import LoadingPage from '@/components/ui/LoadingPage'
import ErrorMessage from '@/components/ui/ErrorMessage'
import { getAllUsers, updateUserRole, deleteUser } from '@/lib/supabase/admin'
import { UserRole } from '@/lib/types'

interface User {
  id: string
  username: string
  role: UserRole
  created_at: string
}

export default function AdminUsersPage() {
  const router = useRouter()
  const { user: currentUser } = useAuthStore()
  const [users, setUsers] = useState<User[]>([])
  const [filteredUsers, setFilteredUsers] = useState<User[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [roleFilter, setRoleFilter] = useState<'all' | UserRole>('all')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadUsers = useCallback(async () => {
    setLoading(true)
    setError(null)

    const { data, error: err } = await getAllUsers()

    if (err) {
      setError(err)
    } else {
      setUsers(data || [])
    }

    setLoading(false)
  }, [])

  const filterUsers = useCallback(() => {
    let filtered = users

    // 搜索过滤
    if (searchTerm) {
      filtered = filtered.filter((user) =>
        user.username.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // 角色过滤
    if (roleFilter !== 'all') {
      filtered = filtered.filter((user) => user.role === roleFilter)
    }

    setFilteredUsers(filtered)
  }, [users, searchTerm, roleFilter])

  useEffect(() => {
    loadUsers()
  }, [loadUsers])

  useEffect(() => {
    filterUsers()
  }, [filterUsers])

  const handleRoleChange = async (userId: string, newRole: UserRole) => {
    if (userId === currentUser?.id) {
      alert('不能修改自己的角色')
      return
    }

    if (!confirm(`确定要将该用户的角色修改为 ${getRoleLabel(newRole)} 吗？`)) {
      return
    }

    const { error: err } = await updateUserRole(userId, newRole)

    if (err) {
      alert(err)
    } else {
      // 更新本地列表
      setUsers(
        users.map((u) => (u.id === userId ? { ...u, role: newRole } : u))
      )
      alert('角色修改成功')
    }
  }

  const handleDeleteUser = async (userId: string, username: string) => {
    if (userId === currentUser?.id) {
      alert('不能删除自己的账号')
      return
    }

    if (
      !confirm(
        `确定要删除用户 "${username}" 吗？该操作将删除用户的所有数据，包括评论、状态记录等，如果是作者还会删除其小说和章节。此操作不可恢复！`
      )
    ) {
      return
    }

    const { error: err } = await deleteUser(userId)

    if (err) {
      alert(err)
    } else {
      // 更新本地列表
      setUsers(users.filter((u) => u.id !== userId))
      alert('用户删除成功')
    }
  }

  const getRoleLabel = (role: UserRole) => {
    const labels: Record<UserRole, string> = {
      reader: '读者',
      author: '作者',
      admin: '管理员',
    }
    return labels[role]
  }

  const getRoleColor = (role: UserRole) => {
    const colors: Record<UserRole, string> = {
      reader: 'bg-blue-100 text-blue-800',
      author: 'bg-green-100 text-green-800',
      admin: 'bg-red-100 text-red-800',
    }
    return colors[role]
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('zh-CN')
  }

  if (loading) {
    return <LoadingPage message="加载用户列表..." />
  }

  return (
    <ProtectedRoute requiredRoles={['admin']}>
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* 页头 */}
          <div className="mb-6">
            <button
              onClick={() => router.push('/admin/dashboard')}
              className="text-blue-600 hover:text-blue-700 flex items-center mb-4"
            >
              ← 返回管理后台
            </button>
            <h1 className="text-3xl font-bold text-gray-900">用户管理</h1>
            <p className="text-gray-600 mt-1">
              共 {users.length} 个用户，当前显示 {filteredUsers.length} 个
            </p>
          </div>

          {error && (
            <div className="mb-6">
              <ErrorMessage message={error} onRetry={loadUsers} />
            </div>
          )}

          {/* 搜索和筛选 */}
          <Card className="p-6 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  搜索用户
                </label>
                <input
                  type="text"
                  placeholder="输入用户名搜索..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  筛选角色
                </label>
                <select
                  value={roleFilter}
                  onChange={(e) =>
                    setRoleFilter(e.target.value as 'all' | UserRole)
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">全部角色</option>
                  <option value="reader">读者</option>
                  <option value="author">作者</option>
                  <option value="admin">管理员</option>
                </select>
              </div>
            </div>
          </Card>

          {/* 用户列表 */}
          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      用户名
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      角色
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      注册时间
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      操作
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="text-sm font-medium text-gray-900">
                            {user.username}
                            {user.id === currentUser?.id && (
                              <span className="ml-2 text-xs text-gray-500">
                                (当前用户)
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <select
                          value={user.role}
                          onChange={(e) =>
                            handleRoleChange(
                              user.id,
                              e.target.value as UserRole
                            )
                          }
                          disabled={user.id === currentUser?.id}
                          className={`text-xs font-medium rounded px-2 py-1 ${getRoleColor(
                            user.role
                          )} ${
                            user.id === currentUser?.id
                              ? 'opacity-50 cursor-not-allowed'
                              : 'cursor-pointer'
                          }`}
                        >
                          <option value="reader">读者</option>
                          <option value="author">作者</option>
                          <option value="admin">管理员</option>
                        </select>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(user.created_at)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            handleDeleteUser(user.id, user.username)
                          }
                          disabled={user.id === currentUser?.id}
                          className="text-red-600 hover:text-red-700 hover:border-red-300"
                        >
                          删除
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {filteredUsers.length === 0 && (
                <div className="text-center py-12 text-gray-500">
                  没有找到符合条件的用户
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>
    </ProtectedRoute>
  )
}
