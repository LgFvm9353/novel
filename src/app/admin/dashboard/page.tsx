'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/lib/store/authStore'
import ProtectedRoute from '@/components/auth/ProtectedRoute'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import LoadingPage from '@/components/ui/LoadingPage'
import ErrorMessage from '@/components/ui/ErrorMessage'
import { getSystemStats } from '@/lib/supabase/admin'

interface SystemStats {
  userCount: number
  authorCount: number
  novelCount: number
  chapterCount: number
  commentCount: number
  totalViews: number
}

export default function AdminDashboardPage() {
  const router = useRouter()
  const { userProfile } = useAuthStore()
  const [stats, setStats] = useState<SystemStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadStats = useCallback(async () => {
    setLoading(true)
    setError(null)

    const { data, error: err } = await getSystemStats()

    if (err) {
      setError(err)
    } else {
      setStats(data)
    }

    setLoading(false)
  }, [])

  useEffect(() => {
    loadStats()
  }, [loadStats])

  if (loading) {
    return <LoadingPage message="加载系统统计..." />
  }

  return (
    <ProtectedRoute requiredRoles={['admin']}>
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* 页头 */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">管理员后台</h1>
            <p className="text-gray-600 mt-1">系统管理和数据统计</p>
          </div>

          {error && (
            <div className="mb-6">
              <ErrorMessage message={error} onRetry={loadStats} />
            </div>
          )}

          {/* 统计卡片 */}
          {stats && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <Card className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm text-gray-600 mb-1">用户总数</div>
                    <div className="text-3xl font-bold text-gray-900">
                      {stats.userCount}
                    </div>
                  </div>
                  <div className="text-blue-600">
                    <svg
                      className="w-12 h-12"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                      />
                    </svg>
                  </div>
                </div>
              </Card>

              <Card className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm text-gray-600 mb-1">作者总数</div>
                    <div className="text-3xl font-bold text-gray-900">
                      {stats.authorCount}
                    </div>
                  </div>
                  <div className="text-green-600">
                    <svg
                      className="w-12 h-12"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                      />
                    </svg>
                  </div>
                </div>
              </Card>

              <Card className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm text-gray-600 mb-1">小说总数</div>
                    <div className="text-3xl font-bold text-gray-900">
                      {stats.novelCount}
                    </div>
                  </div>
                  <div className="text-purple-600">
                    <svg
                      className="w-12 h-12"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                      />
                    </svg>
                  </div>
                </div>
              </Card>

              <Card className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm text-gray-600 mb-1">章节总数</div>
                    <div className="text-3xl font-bold text-gray-900">
                      {stats.chapterCount}
                    </div>
                  </div>
                  <div className="text-yellow-600">
                    <svg
                      className="w-12 h-12"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                  </div>
                </div>
              </Card>

              <Card className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm text-gray-600 mb-1">评论总数</div>
                    <div className="text-3xl font-bold text-gray-900">
                      {stats.commentCount}
                    </div>
                  </div>
                  <div className="text-red-600">
                    <svg
                      className="w-12 h-12"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z"
                      />
                    </svg>
                  </div>
                </div>
              </Card>

              <Card className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm text-gray-600 mb-1">总阅读量</div>
                    <div className="text-3xl font-bold text-gray-900">
                      {stats.totalViews.toLocaleString()}
                    </div>
                  </div>
                  <div className="text-indigo-600">
                    <svg
                      className="w-12 h-12"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                      />
                    </svg>
                  </div>
                </div>
              </Card>
            </div>
          )}

          {/* 管理功能 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-3">
                用户管理
              </h3>
              <p className="text-gray-600 text-sm mb-4">
                管理所有用户，修改用户角色和权限
              </p>
              <Button
                variant="primary"
                className="w-full"
                onClick={() => router.push('/admin/users')}
              >
                进入用户管理
              </Button>
            </Card>

            <Card className="p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-3">
                作者管理
              </h3>
              <p className="text-gray-600 text-sm mb-4">
                管理作者信息，添加或移除作者权限
              </p>
              <Button
                variant="primary"
                className="w-full"
                onClick={() => router.push('/admin/authors')}
              >
                进入作者管理
              </Button>
            </Card>

            <Card className="p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-3">
                分类管理
              </h3>
              <p className="text-gray-600 text-sm mb-4">
                管理小说分类，添加、编辑或删除分类
              </p>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => alert('分类管理功能开发中...')}
              >
                即将推出
              </Button>
            </Card>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  )
}
