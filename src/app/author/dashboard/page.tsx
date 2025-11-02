'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/lib/store/authStore'
import ProtectedRoute from '@/components/auth/ProtectedRoute'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import LoadingPage from '@/components/ui/LoadingPage'
import ErrorMessage from '@/components/ui/ErrorMessage'
import EmptyState from '@/components/ui/EmptyState'
import {
  getAuthorByUserId,
  getAuthorNovels,
  getAuthorStats,
  deleteNovel,
} from '@/lib/supabase/authors'

interface Novel {
  id: string
  title: string
  description: string
  cover_image: string | null
  status: string
  total_chapters: number
  created_at: string
  category: {
    id: string
    name: string
  }
}

interface AuthorStats {
  novelCount: number
  chapterCount: number
  commentCount: number
  viewCount: number
}

export default function AuthorDashboardPage() {
  const router = useRouter()
  const { user, userProfile } = useAuthStore()
  const [authorId, setAuthorId] = useState<string | null>(null)
  const [novels, setNovels] = useState<Novel[]>([])
  const [stats, setStats] = useState<AuthorStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadAuthorData = useCallback(async () => {
    if (!user) return

    setLoading(true)
    setError(null)

    // 获取作者信息
    const { data: author, error: authorError } = await getAuthorByUserId(user.id)

    if (authorError) {
      setError(authorError)
      setLoading(false)
      return
    }

    if (!author) {
      setError('您还不是作者，请联系管理员开通作者权限')
      setLoading(false)
      return
    }

    setAuthorId(author.id)

    // 获取作者的小说列表
    const { data: novelsData, error: novelsError } = await getAuthorNovels(
      author.id
    )

    if (novelsError) {
      setError(novelsError)
      setLoading(false)
      return
    }

    setNovels(novelsData || [])

    // 获取统计信息
    const { data: statsData, error: statsError } = await getAuthorStats(author.id)

    if (statsError) {
      console.error('Failed to load stats:', statsError)
    } else {
      setStats(statsData)
    }

    setLoading(false)
  }, [user])

  useEffect(() => {
    if (!user) return

    loadAuthorData()
  }, [user, loadAuthorData])

  const handleDeleteNovel = async (novelId: string) => {
    if (!confirm('确定要删除这部小说吗？所有章节和评论也将被删除。')) {
      return
    }

    const { error: deleteError } = await deleteNovel(novelId)

    if (deleteError) {
      alert(deleteError)
    } else {
      setNovels(novels.filter((n) => n.id !== novelId))
      // 重新加载统计信息
      if (authorId) {
        const { data: statsData } = await getAuthorStats(authorId)
        if (statsData) setStats(statsData)
      }
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('zh-CN')
  }

  const statusLabels: Record<string, string> = {
    ongoing: '连载中',
    finished: '已完结',
    paused: '暂停',
  }

  const statusColors: Record<string, string> = {
    ongoing: 'bg-green-100 text-green-800',
    finished: 'bg-blue-100 text-blue-800',
    paused: 'bg-yellow-100 text-yellow-800',
  }

  if (loading) {
    return <LoadingPage message="加载作者信息..." />
  }

  if (error && !authorId) {
    return (
      <ProtectedRoute requiredRoles={['author', 'admin']}>
        <div className="min-h-screen bg-gray-50 py-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <ErrorMessage message={error} />
          </div>
        </div>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute requiredRoles={['author', 'admin']}>
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* 页头 */}
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">作者后台</h1>
              <p className="text-gray-600 mt-1">管理您的小说和章节</p>
            </div>
            <Button
              variant="primary"
              onClick={() => router.push('/author/novel/new')}
            >
              创建新小说
            </Button>
          </div>

          {/* 统计卡片 */}
          {stats && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <Card className="p-6">
                <div className="text-sm text-gray-600 mb-1">小说总数</div>
                <div className="text-3xl font-bold text-gray-900">
                  {stats.novelCount}
                </div>
              </Card>
              <Card className="p-6">
                <div className="text-sm text-gray-600 mb-1">章节总数</div>
                <div className="text-3xl font-bold text-gray-900">
                  {stats.chapterCount}
                </div>
              </Card>
              <Card className="p-6">
                <div className="text-sm text-gray-600 mb-1">评论总数</div>
                <div className="text-3xl font-bold text-gray-900">
                  {stats.commentCount}
                </div>
              </Card>
            </div>
          )}

          {/* 小说列表 */}
          <Card className="p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6">我的小说</h2>

            {novels.length === 0 ? (
              <EmptyState
                title="还没有创建小说"
                description="创建您的第一部小说，开始您的创作之旅"
                action={{
                  label: '创建新小说',
                  onClick: () => router.push('/author/novel/new'),
                }}
              />
            ) : (
              <div className="space-y-4">
                {novels.map((novel) => (
                  <div
                    key={novel.id}
                    className="border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors"
                  >
                    <div className="flex items-start space-x-4">
                      {novel.cover_image && (
                        <img
                          src={novel.cover_image}
                          alt={novel.title}
                          className="w-20 h-28 object-cover rounded"
                        />
                      )}
                      <div className="flex-1">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <h3 className="text-lg font-bold text-gray-900">
                              {novel.title}
                            </h3>
                            <div className="flex items-center space-x-3 mt-1">
                              <span className="text-sm text-gray-500">
                                {novel.category.name}
                              </span>
                              <span
                                className={`inline-block px-2 py-1 text-xs font-medium rounded ${
                                  statusColors[novel.status] ||
                                  'bg-gray-100 text-gray-800'
                                }`}
                              >
                                {statusLabels[novel.status] || novel.status}
                              </span>
                            </div>
                          </div>
                          <span className="text-sm text-gray-500">
                            {formatDate(novel.created_at)}
                          </span>
                        </div>

                        <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                          {novel.description}
                        </p>

                        <div className="flex items-center space-x-4 text-sm text-gray-500 mb-4">
                          <span>{novel.total_chapters || 0} 章节</span>
                        </div>
                      </div>
                    </div>
                    
                    {/* 按钮组 - 从最左边开始 */}
                    <div className="flex space-x-3 mt-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          router.push(`/author/novel/${novel.id}/chapters`)
                        }
                      >
                        章节管理
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          router.push(`/author/novel/${novel.id}/edit`)
                        }
                      >
                        编辑小说
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => router.push(`/novel/${novel.id}`)}
                      >
                        查看详情
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteNovel(novel.id)}
                        className="text-red-600 hover:text-red-700 hover:border-red-300"
                      >
                        删除
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>
    </ProtectedRoute>
  )
}
