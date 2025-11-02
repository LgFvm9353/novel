'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { useAuthStore } from '@/lib/store/authStore'
import ProtectedRoute from '@/components/auth/ProtectedRoute'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import ErrorMessage from '@/components/ui/ErrorMessage'
import EmptyState from '@/components/ui/EmptyState'
import {
  getUserComments,
  getUserStatusLogs,
  deleteUserComment,
  deleteUserStatusLog,
} from '@/lib/supabase/users'
import { getAuthorByUserId } from '@/lib/supabase/authors'

interface Comment {
  id: string
  content: string
  created_at: string
  novel: {
    id: string
    title: string
  }
}

interface StatusLog {
  id: string
  status_note: string
  created_at: string
  novel: {
    id: string
    title: string
    cover_image: string | null
  }
}

interface AuthorInfo {
  id: string
  name: string
  bio: string | null
  level: string
  is_transcript: boolean
  created_at: string
}

export default function ReaderProfilePage() {
  const { user, userProfile } = useAuthStore()
  const [activeTab, setActiveTab] = useState<'comments' | 'status'>('comments')
  const [comments, setComments] = useState<Comment[]>([])
  const [statusLogs, setStatusLogs] = useState<StatusLog[]>([])
  const [authorInfo, setAuthorInfo] = useState<AuthorInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadData = useCallback(async () => {
    if (!user) return

    setLoading(true)
    setError(null)

    // 如果是作者，加载作者信息
    if (userProfile?.role === 'author' || userProfile?.role === 'admin') {
      const { data: authorData } = await getAuthorByUserId(user.id)
      if (authorData) {
        setAuthorInfo(authorData)
      }
    }

    if (activeTab === 'comments') {
      const { data, error: err } = await getUserComments(user.id)
      if (err) {
        setError(err)
      } else {
        setComments(data || [])
      }
    } else {
      const { data, error: err } = await getUserStatusLogs(user.id)
      if (err) {
        setError(err)
      } else {
        setStatusLogs(data || [])
      }
    }

    setLoading(false)
  }, [user, userProfile, activeTab])

  // 加载数据
  useEffect(() => {
    if (!user) return

    loadData()
  }, [user, loadData])

  // 删除评论
  const handleDeleteComment = async (commentId: string) => {
    if (!user || !confirm('确定要删除这条评论吗？')) return

    const { error: err } = await deleteUserComment(commentId, user.id)
    if (err) {
      alert(err)
    } else {
      setComments(comments.filter((c) => c.id !== commentId))
    }
  }

  // 删除状态记录
  const handleDeleteStatusLog = async (logId: string) => {
    if (!user || !confirm('确定要删除这条记录吗？')) return

    const { error: err } = await deleteUserStatusLog(logId, user.id)
    if (err) {
      alert(err)
    } else {
      setStatusLogs(statusLogs.filter((s) => s.id !== logId))
    }
  }

  // 格式化日期
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  // 计算使用天数
  const getDaysSinceJoin = () => {
    if (!userProfile?.created_at) return 0
    const joinDate = new Date(userProfile.created_at)
    const now = new Date()
    const diffTime = Math.abs(now.getTime() - joinDate.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  // 获取角色图标和颜色
  const getRoleInfo = () => {
    switch (userProfile?.role) {
      case 'reader':
        return { label: '读者', color: 'bg-gray-50 text-gray-700 border-gray-200' }
      case 'author':
        return { label: '作者', color: 'bg-green-50 text-green-700 border-green-200' }
      case 'admin':
        return { label: '管理员', color: 'bg-gray-100 text-gray-800 border-gray-300' }
      default:
        return { label: '用户', color: 'bg-gray-50 text-gray-700 border-gray-200' }
    }
  }

  const roleInfo = getRoleInfo()

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* 用户信息卡片 - 增强版 */}
          <Card className="mb-6 p-6">
            <div className="flex items-start">
              {/* 基本信息 */}
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-3xl font-bold text-gray-900">
                    {userProfile?.username}
                  </h1>
                  <span className={`px-2.5 py-1 rounded text-xs font-medium border ${roleInfo.color}`}>
                    {roleInfo.label}
                  </span>
                </div>

                {/* 作者信息 */}
                {authorInfo && (
                  <div className="mt-3 space-y-2">
                    <div className="flex items-center gap-4 text-sm">
                      <span className="text-gray-600">
                        <span className="font-medium">笔名：</span>
                        <span className="text-gray-900">{authorInfo.name}</span>
                      </span>
                      <span className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded border border-gray-200 text-xs font-medium">
                        {authorInfo.level}
                      </span>
                      {authorInfo.is_transcript && (
                        <span className="px-2 py-0.5 bg-orange-50 text-orange-700 rounded border border-orange-200 text-xs font-medium">
                          签约作者
                        </span>
                      )}
                    </div>
                    {authorInfo.bio && (
                      <p className="text-gray-600 text-sm">{authorInfo.bio}</p>
                    )}
                  </div>
                )}

                {/* 统计信息 - 纵向布局 */}
                <div className="mt-4 space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="text-gray-500">加入时间：</span>
                    <span className="text-gray-700 font-medium">
                      {userProfile?.created_at && formatDate(userProfile.created_at)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-500">使用天数：</span>
                    <span className="text-gray-700 font-medium">{getDaysSinceJoin()} 天</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-500">评论数：</span>
                    <span className="text-gray-700 font-medium">{comments.length}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-500">阅读记录：</span>
                    <span className="text-gray-700 font-medium">{statusLogs.length}</span>
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* 标签切换 */}
          <div className="mb-6 border-b border-gray-200 bg-white rounded-t-lg px-4">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('comments')}
                className={`
                  py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200
                  ${
                    activeTab === 'comments'
                      ? 'border-orange-500 text-orange-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }
                `}
              >
                我的评论 
                <span className="ml-2 px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded text-xs">
                  {comments.length}
                </span>
              </button>
              <button
                onClick={() => setActiveTab('status')}
                className={`
                  py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200
                  ${
                    activeTab === 'status'
                      ? 'border-orange-500 text-orange-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }
                `}
              >
                阅读记录
                <span className="ml-2 px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded text-xs">
                  {statusLogs.length}
                </span>
              </button>
            </nav>
          </div>

          {/* 内容区域 */}
          {loading ? (
            <div className="flex justify-center py-12">
              <LoadingSpinner size="lg" />
            </div>
          ) : error ? (
            <ErrorMessage message={error} onRetry={loadData} />
          ) : (
            <>
              {/* 评论列表 */}
              {activeTab === 'comments' && (
                <div className="space-y-4">
                  {comments.length === 0 ? (
                    <EmptyState
                      title="还没有评论"
                      description="快去阅读小说并发表您的看法吧"
                      action={{
                        label: '浏览小说',
                        onClick: () => (window.location.href = '/'),
                      }}
                    />
                  ) : (
                    comments.map((comment) => (
                      <Card key={comment.id} className="p-4">
                        <div className="flex justify-between items-start mb-2">
                          <Link
                            href={`/novel/${comment.novel.id}`}
                            className="text-blue-600 hover:text-blue-700 font-medium"
                          >
                            {comment.novel.title}
                          </Link>
                          <span className="text-sm text-gray-500">
                            {formatDate(comment.created_at)}
                          </span>
                        </div>
                        <p className="text-gray-700 mb-3">{comment.content}</p>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteComment(comment.id)}
                        >
                          删除
                        </Button>
                      </Card>
                    ))
                  )}
                </div>
              )}

              {/* 状态记录列表 */}
              {activeTab === 'status' && (
                <div className="space-y-4">
                  {statusLogs.length === 0 ? (
                    <EmptyState
                      title="还没有阅读记录"
                      description="标记您正在阅读或想读的小说，方便下次找到"
                      action={{
                        label: '浏览小说',
                        onClick: () => (window.location.href = '/'),
                      }}
                    />
                  ) : (
                    statusLogs.map((log) => (
                      <Card key={log.id} className="p-4">
                        <div className="flex items-start space-x-4">
                          {log.novel.cover_image && (
                            <img
                              src={log.novel.cover_image}
                              alt={log.novel.title}
                              className="w-16 h-20 object-cover rounded"
                            />
                          )}
                          <div className="flex-1">
                            <div className="flex justify-between items-start mb-2">
                              <Link
                                href={`/novel/${log.novel.id}`}
                                className="text-blue-600 hover:text-blue-700 font-medium"
                              >
                                {log.novel.title}
                              </Link>
                              <span className="text-sm text-gray-500">
                                {formatDate(log.created_at)}
                              </span>
                            </div>
                            <p className="text-gray-600 text-sm mb-3">
                              {log.status_note}
                            </p>
                          </div>
                        </div>
                        {/* 按钮从最左边开始 */}
                        <div className="mt-3">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteStatusLog(log.id)}
                          >
                            删除
                          </Button>
                        </div>
                      </Card>
                    ))
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </ProtectedRoute>
  )
}
