'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/lib/store/authStore'
import ProtectedRoute from '@/components/auth/ProtectedRoute'
import Card from '@/components/ui/Card'
import Input from '@/components/ui/Input'
import Textarea from '@/components/ui/Textarea'
import Button from '@/components/ui/Button'
import LoadingPage from '@/components/ui/LoadingPage'
import ErrorMessage from '@/components/ui/ErrorMessage'
import EmptyState from '@/components/ui/EmptyState'
import {
  getAllAuthors,
  getNonAuthorUsers,
  createAuthor,
  updateAuthor,
  removeAuthor,
} from '@/lib/supabase/admin'

interface Author {
  id: string
  name: string  // 改为 'name'
  bio: string
  created_at: string
  user: {
    id: string
    username: string
  }
  novel_count?: number  // 小说数量（从getAllAuthors返回）
}

interface User {
  id: string
  username: string
  role: string
}

export default function AdminAuthorsPage() {
  const router = useRouter()
  const { user, userProfile } = useAuthStore()
  const [authors, setAuthors] = useState<Author[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [showForm, setShowForm] = useState(false)
  const [editingAuthor, setEditingAuthor] = useState<Author | null>(null)
  const [formData, setFormData] = useState({
    user_id: '',
    name: '',  // 改为 'name'
    bio: '',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadData = useCallback(async () => {
    setLoading(true)
    setError(null)

    // 获取作者列表
    const { data: authorsData, error: authorsError } = await getAllAuthors()

    if (authorsError) {
      setError(authorsError)
    } else {
      setAuthors(authorsData || [])
    }

    // 获取非作者用户列表（用于创建作者）
    const { data: usersData, error: usersError } = await getNonAuthorUsers()

    if (usersError) {
      console.error('Failed to load users:', usersError)
    } else {
      setUsers(usersData || [])
    }

    setLoading(false)
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!editingAuthor && !formData.user_id) {
      newErrors.user_id = '请选择用户'
    }

    if (!formData.name.trim()) {
      newErrors.name = '请输入笔名'
    } else if (formData.name.length < 2) {
      newErrors.name = '笔名至少需要2个字符'
    } else if (formData.name.length > 50) {
      newErrors.name = '笔名不能超过50个字符'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (submitting) {
      return
    }

    if (!validateForm()) {
      return
    }

    setSubmitting(true)
    setErrors({})

    if (editingAuthor) {
      // 更新作者信息
      const { error: err } = await updateAuthor(editingAuthor.id, {
        name: formData.name.trim(),  // 改为 'name'
        bio: formData.bio.trim(),
      })

      if (err) {
        setErrors({ submit: err })
        setSubmitting(false)
        return
      }

      alert('作者信息更新成功')
    } else {
      // 创建新作者
      const { error: err } = await createAuthor(
        formData.user_id,
        formData.name.trim(),
        formData.bio.trim()
      )

      if (err) {
        setErrors({ submit: err })
        setSubmitting(false)
        return
      }

      alert('作者创建成功')
    }

    // 重新加载数据
    await loadData()

    // 重置表单
    setFormData({ user_id: '', name: '', bio: '' })
    setShowForm(false)
    setEditingAuthor(null)
    setSubmitting(false)
  }

  const handleEdit = (author: Author) => {
    setEditingAuthor(author)
    setFormData({
      user_id: author.user.id,
      name: author.name,
      bio: author.bio,
    })
    setShowForm(true)
    window.scrollTo(0, 0)
  }

  const handleRemove = async (authorId: string, userId: string, username: string) => {
    if (
      !confirm(
        `确定要移除作者 "${username}" 的作者权限吗？如果该作者还有小说，则无法移除。`
      )
    ) {
      return
    }

    const { error: err } = await removeAuthor(authorId, userId)

    if (err) {
      alert(err)
    } else {
      alert('作者权限移除成功')
      await loadData()
    }
  }

  const handleCancel = () => {
    setFormData({ user_id: '', name: '', bio: '' })
    setEditingAuthor(null)
    setShowForm(false)
    setErrors({})
  }

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))

    // 清除对应字段的错误
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }))
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('zh-CN')
  }

  // 获取可用的用户列表（排除当前管理员，防止管理员添加自己为作者）
  const availableUsers = users.filter(
    (u) => user ? u.id !== user.id : true
  )

  if (loading) {
    return <LoadingPage message="加载作者列表..." />
  }

  return (
    <ProtectedRoute requiredRoles={['admin']}>
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* 页头 */}
          <div className="mb-6">
            <button
              onClick={() => router.push('/admin/dashboard')}
              className="text-blue-600 hover:text-blue-700 flex items-center mb-4"
            >
              ← 返回管理后台
            </button>
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">作者管理</h1>
                <p className="text-gray-600 mt-1">共 {authors.length} 位作者</p>
              </div>
              {!showForm && (
                <Button
                  variant="primary"
                  onClick={() => {
                    setShowForm(true)
                    setEditingAuthor(null)
                    setFormData({ user_id: '', name: '', bio: '' })
                  }}
                  disabled={availableUsers.length === 0}
                >
                  添加新作者
                </Button>
              )}
            </div>
          </div>

          {error && (
            <div className="mb-6">
              <ErrorMessage message={error} onRetry={loadData} />
            </div>
          )}

          {/* 作者表单 */}
          {showForm && (
            <Card className="p-6 mb-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                {editingAuthor ? '编辑作者信息' : '添加新作者'}
              </h2>

              <form onSubmit={handleSubmit} className="space-y-4">
                {errors.submit && <ErrorMessage message={errors.submit} />}

                {!editingAuthor && (
                  <div>
                    <label
                      htmlFor="user_id"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      选择用户 <span className="text-red-500">*</span>
                    </label>
                    <select
                      id="user_id"
                      name="user_id"
                      value={formData.user_id}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      disabled={submitting}
                      required
                    >
                      <option value="">请选择用户</option>
                      {availableUsers.map((user) => (
                        <option key={user.id} value={user.id}>
                          {user.username} ({user.role})
                        </option>
                      ))}
                    </select>
                    {errors.user_id && (
                      <p className="mt-1 text-sm text-red-600">
                        {errors.user_id}
                      </p>
                    )}
                    {availableUsers.length === 0 && (
                      <p className="mt-1 text-sm text-gray-500">
                        所有用户都已经是作者了
                      </p>
                    )}
                  </div>
                )}

                {editingAuthor && (
                  <div className="bg-gray-50 p-4 rounded-md">
                    <p className="text-sm text-gray-600">
                      用户名：
                      <span className="font-medium text-gray-900">
                        {editingAuthor.user.username}
                      </span>
                    </p>
                  </div>
                )}

                <Input
                  label="笔名"
                  name="name"
                  type="text"
                  placeholder="请输入笔名"
                  value={formData.name}
                  onChange={handleChange}
                  error={errors.name}
                  required
                  disabled={submitting}
                />

                <Textarea
                  label="个人简介"
                  name="bio"
                  placeholder="请输入作者简介（可选）"
                  value={formData.bio}
                  onChange={handleChange}
                  error={errors.bio}
                  rows={4}
                  disabled={submitting}
                />

                <div className="flex space-x-3">
                  <Button
                    type="submit"
                    variant="primary"
                    disabled={submitting}
                  >
                    {submitting
                      ? '保存中...'
                      : editingAuthor
                      ? '保存修改'
                      : '创建作者'}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleCancel}
                    disabled={submitting}
                  >
                    取消
                  </Button>
                </div>
              </form>
            </Card>
          )}

          {/* 作者列表 - 只在未显示表单时显示 */}
          {!showForm && (
            <Card className="p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">作者列表</h2>

              {authors.length === 0 ? (
                <EmptyState
                  title="还没有作者"
                  description="添加第一位作者，开始管理作者信息"
                  action={
                    availableUsers.length > 0
                      ? {
                          label: '添加新作者',
                          onClick: () => {
                            setShowForm(true)
                            setEditingAuthor(null)
                            setFormData({ user_id: '', name: '', bio: '' })
                          },
                        }
                      : undefined
                  }
                />
              ) : (
                <div className="space-y-4">
                  {authors.map((author) => (
                    <div
                      key={author.id}
                      className="border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors"
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <h3 className="text-lg font-bold text-gray-900">
                              {author.name}
                            </h3>
                            <span className="text-sm text-gray-500">
                              @{author.user.username}
                            </span>
                          </div>
                          {author.bio && (
                            <p className="text-gray-600 text-sm mb-3">
                              {author.bio}
                            </p>
                          )}
                          <div className="flex items-center space-x-4 text-sm text-gray-500">
                            <span>
                              {author.novel_count || 0} 部小说
                            </span>
                            <span>加入时间：{formatDate(author.created_at)}</span>
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(author)}
                          >
                            编辑
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              handleRemove(
                                author.id,
                                author.user.id,
                                author.user.username
                              )
                            }
                            className="text-red-600 hover:text-red-700 hover:border-red-300"
                          >
                            移除
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          )}
        </div>
      </div>
    </ProtectedRoute>
  )
}
