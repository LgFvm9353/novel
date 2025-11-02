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
import { getAuthorByUserId, createNovel } from '@/lib/supabase/authors'
import { getCategories } from '@/lib/supabase/novels'

interface Category {
  id: string
  name: string
}

export default function NewNovelPage() {
  const router = useRouter()
  const { user } = useAuthStore()
  const [authorId, setAuthorId] = useState<string | null>(null)
  const [categories, setCategories] = useState<Category[]>([])
  const [formData, setFormData] = useState({
    title: '',
    category_id: '',
    description: '',
    cover_image: '',
    status: 'ongoing',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  const loadInitialData = useCallback(async () => {
    if (!user) return

    setLoading(true)

    // 获取作者信息
    const { data: author, error: authorError } = await getAuthorByUserId(user.id)

    if (authorError || !author) {
      alert('获取作者信息失败')
      router.push('/author/dashboard')
      return
    }

    setAuthorId(author.id)

    // 获取分类列表
    const { data: categoriesData, error: categoriesError } = await getCategories()

    if (categoriesError) {
      alert('获取分类列表失败')
    } else {
      setCategories(categoriesData || [])
      // 设置默认分类
      if (categoriesData && categoriesData.length > 0) {
        setFormData((prev) => ({ ...prev, category_id: categoriesData[0].id }))
      }
    }

    setLoading(false)
  }, [user, router])

  useEffect(() => {
    if (!user) return

    loadInitialData()
  }, [user, loadInitialData])

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.title.trim()) {
      newErrors.title = '请输入小说标题'
    } else if (formData.title.length < 2) {
      newErrors.title = '标题至少需要2个字符'
    } else if (formData.title.length > 100) {
      newErrors.title = '标题不能超过100个字符'
    }

    if (!formData.category_id) {
      newErrors.category_id = '请选择小说分类'
    }

    if (!formData.description.trim()) {
      newErrors.description = '请输入小说简介'
    } else if (formData.description.length < 10) {
      newErrors.description = '简介至少需要10个字符'
    } else if (formData.description.length > 1000) {
      newErrors.description = '简介不能超过1000个字符'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (submitting) {
      return
    }

    if (!validateForm() || !authorId) {
      return
    }

    setSubmitting(true)
    setErrors({})

    const { data, error } = await createNovel({
      title: formData.title.trim(),
      author_id: authorId,
      category_id: formData.category_id,
      description: formData.description.trim(),
      cover_image: formData.cover_image.trim() || undefined,
      status: formData.status,
    })

    if (error) {
      setErrors({ submit: error })
      setSubmitting(false)
      return
    }

    // 创建成功，跳转到章节管理页面
    router.push(`/author/novel/${data?.id}/chapters`)
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

  if (loading) {
    return <LoadingPage message="加载中..." />
  }

  return (
    <ProtectedRoute requiredRoles={['author', 'admin']}>
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-6">
            <button
              onClick={() => router.back()}
              className="text-blue-600 hover:text-blue-700 flex items-center"
            >
              ← 返回
            </button>
          </div>

          <Card className="p-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-6">
              创建新小说
            </h1>

            <form onSubmit={handleSubmit} className="space-y-6">
              {errors.submit && <ErrorMessage message={errors.submit} />}

              <Input
                label="小说标题"
                name="title"
                type="text"
                placeholder="请输入小说标题"
                value={formData.title}
                onChange={handleChange}
                error={errors.title}
                required
                disabled={submitting}
              />

              <div>
                <label
                  htmlFor="category_id"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  小说分类 <span className="text-red-500">*</span>
                </label>
                <select
                  id="category_id"
                  name="category_id"
                  value={formData.category_id}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={submitting}
                  required
                >
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
                {errors.category_id && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.category_id}
                  </p>
                )}
              </div>

              <Textarea
                label="小说简介"
                name="description"
                placeholder="请输入小说简介（至少10个字符）"
                value={formData.description}
                onChange={handleChange}
                error={errors.description}
                rows={6}
                required
                disabled={submitting}
              />

              <Input
                label="封面图片链接（可选）"
                name="cover_image"
                type="url"
                placeholder="https://example.com/cover.jpg"
                value={formData.cover_image}
                onChange={handleChange}
                error={errors.cover_image}
                disabled={submitting}
              />

              <div>
                <label
                  htmlFor="status"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  小说状态
                </label>
                <select
                  id="status"
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={submitting}
                >
                  <option value="ongoing">连载中</option>
                  <option value="finished">已完结</option>
                  <option value="paused">暂停</option>
                </select>
              </div>

              <div className="flex space-x-4 pt-4">
                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  className="flex-1"
                  disabled={submitting}
                >
                  {submitting ? '创建中...' : '创建小说'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="lg"
                  onClick={() => router.back()}
                  disabled={submitting}
                >
                  取消
                </Button>
              </div>
            </form>
          </Card>
        </div>
      </div>
    </ProtectedRoute>
  )
}
