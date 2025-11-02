'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter, useParams } from 'next/navigation'
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
  getAuthorByUserId,
  createChapter,
  updateChapter,
  deleteChapter,
} from '@/lib/supabase/authors'
import { getNovelById } from '@/lib/supabase/novels'
import { getChaptersByNovelId } from '@/lib/supabase/chapters'

interface Chapter {
  id: string
  chapter_number: number
  title: string
  content: string
  word_count: number
  created_at: string
}

export default function ChapterManagementPage() {
  const router = useRouter()
  const params = useParams()
  const novelId = params?.id as string
  const { user } = useAuthStore()
  const [authorId, setAuthorId] = useState<string | null>(null)
  const [novelTitle, setNovelTitle] = useState('')
  const [chapters, setChapters] = useState<Chapter[]>([])
  const [showForm, setShowForm] = useState(false)
  const [editingChapter, setEditingChapter] = useState<Chapter | null>(null)
  const [formData, setFormData] = useState({
    title: '',
    content: '',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  const loadData = useCallback(async () => {
    if (!user || !novelId) return

    setLoading(true)

    // 获取作者信息
    const { data: author, error: authorError } = await getAuthorByUserId(user.id)

    if (authorError || !author) {
      alert('获取作者信息失败')
      router.push('/author/dashboard')
      return
    }

    setAuthorId(author.id)

    // 获取小说信息
    const { data: novel, error: novelError } = await getNovelById(novelId)

    if (novelError || !novel) {
      alert('获取小说信息失败')
      router.push('/author/dashboard')
      return
    }

    // 检查是否是该作者的小说
    if (novel.author_id !== author.id) {
      alert('您没有权限管理这部小说的章节')
      router.push('/author/dashboard')
      return
    }

    setNovelTitle(novel.title)

    // 获取章节列表
    const { data: chaptersData, error: chaptersError } = await getChaptersByNovelId(
      novelId,
      1,
      1000
    )

    if (chaptersError) {
      alert('获取章节列表失败')
    } else {
      setChapters(chaptersData || [])
    }

    setLoading(false)
  }, [user, novelId, router])

  useEffect(() => {
    if (!user || !novelId) return

    loadData()
  }, [user, novelId, loadData])

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.title.trim()) {
      newErrors.title = '请输入章节标题'
    } else if (formData.title.length > 100) {
      newErrors.title = '标题不能超过100个字符'
    }

    if (!formData.content.trim()) {
      newErrors.content = '请输入章节内容'
    } else if (formData.content.length < 50) {
      newErrors.content = '章节内容至少需要50个字符'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // 防止重复提交
    if (submitting) {
      return
    }

    if (!validateForm() || !novelId) {
      return
    }

    setSubmitting(true)
    setErrors({})

    if (editingChapter) {
      // 更新章节
      const { error } = await updateChapter(editingChapter.id, {
        title: formData.title.trim(),
        content: formData.content.trim(),
      })

      if (error) {
        setErrors({ submit: error })
        setSubmitting(false)
        return
      }

      // 更新本地列表
      setChapters(
        chapters.map((ch) =>
          ch.id === editingChapter.id
            ? {
                ...ch,
                title: formData.title.trim(),
                content: formData.content.trim(),
                word_count: formData.content.trim().length,
              }
            : ch
        )
      )

      alert('章节更新成功')
    } else {
      // 创建新章节
      const nextChapterNumber = chapters.length + 1

      const { data, error } = await createChapter({
        novel_id: novelId,
        chapter_number: nextChapterNumber,
        title: formData.title.trim(),
        content: formData.content.trim(),
      })

      if (error) {
        setErrors({ submit: error })
        setSubmitting(false)
        return
      }

      alert('章节创建成功')
    }

    // 重置表单
    setFormData({ title: '', content: '' })
    setShowForm(false)
    setEditingChapter(null)
    setSubmitting(false)
    
    // 最后重新加载章节列表（避免在提交过程中重新加载）
    if (!editingChapter) {
      // 只重新加载章节列表，不重新加载全部数据
      const { data: chaptersData } = await getChaptersByNovelId(novelId, 1, 1000)
      setChapters(chaptersData || [])
    }
  }

  const handleEdit = (chapter: Chapter) => {
    setEditingChapter(chapter)
    setFormData({
      title: chapter.title,
      content: chapter.content,
    })
    setShowForm(true)
    window.scrollTo(0, 0)
  }

  const handleDelete = async (chapterId: string) => {
    if (!confirm('确定要删除这个章节吗？')) {
      return
    }

    const { error } = await deleteChapter(chapterId, novelId)

    if (error) {
      alert(error)
    } else {
      // 重新加载章节列表
      await loadData()
    }
  }

  const handleCancel = () => {
    setFormData({ title: '', content: '' })
    setEditingChapter(null)
    setShowForm(false)
    setErrors({})
  }

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
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

  if (loading) {
    return <LoadingPage message="加载章节信息..." />
  }

  return (
    <ProtectedRoute requiredRoles={['author', 'admin']}>
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* 页头 */}
          <div className="mb-6">
            <button
              onClick={() => router.push('/author/dashboard')}
              className="text-blue-600 hover:text-blue-700 flex items-center mb-4"
            >
              ← 返回作者后台
            </button>
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">{novelTitle}</h1>
                <p className="text-gray-600 mt-1">章节管理</p>
              </div>
              {!showForm && (
                <Button
                  variant="primary"
                  onClick={() => {
                    setShowForm(true)
                    setEditingChapter(null)
                    setFormData({ title: '', content: '' })
                  }}
                >
                  添加新章节
                </Button>
              )}
            </div>
          </div>

          {/* 章节表单 */}
          {showForm && (
            <Card className="p-6 mb-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                {editingChapter ? '编辑章节' : '添加新章节'}
              </h2>

              <form onSubmit={handleSubmit} className="space-y-4">
                {errors.submit && <ErrorMessage message={errors.submit} />}

                <Input
                  label="章节标题"
                  name="title"
                  type="text"
                  placeholder="请输入章节标题"
                  value={formData.title}
                  onChange={handleChange}
                  error={errors.title}
                  required
                  disabled={submitting}
                />

                <Textarea
                  label="章节内容"
                  name="content"
                  placeholder="请输入章节内容（至少50个字符）"
                  value={formData.content}
                  onChange={handleChange}
                  error={errors.content}
                  rows={15}
                  required
                  disabled={submitting}
                />

                <div className="text-sm text-gray-500">
                  当前字数：{formData.content.length}
                </div>

                <div className="flex space-x-3">
                  <Button
                    type="submit"
                    variant="primary"
                    disabled={submitting}
                  >
                    {submitting
                      ? '保存中...'
                      : editingChapter
                      ? '保存修改'
                      : '创建章节'}
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

          {/* 章节列表 - 只在未显示表单时显示 */}
          {!showForm && (
            <Card className="p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                章节列表 ({chapters.length})
              </h2>

              {chapters.length === 0 ? (
                <EmptyState
                  title="还没有章节"
                  description="创建第一个章节，开始您的创作"
                  action={{
                    label: '添加新章节',
                    onClick: () => {
                      setShowForm(true)
                      setEditingChapter(null)
                      setFormData({ title: '', content: '' })
                    },
                  }}
                />
              ) : (
                <div className="space-y-3">
                  {chapters.map((chapter) => (
                    <div
                      key={chapter.id}
                      className="border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors"
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <span className="text-sm font-medium text-gray-500">
                              第 {chapter.chapter_number} 章
                            </span>
                            <h3 className="text-lg font-bold text-gray-900">
                              {chapter.title}
                            </h3>
                          </div>
                          <div className="flex items-center space-x-4 text-sm text-gray-500">
                            <span>{chapter.word_count} 字</span>
                            <span>{formatDate(chapter.created_at)}</span>
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(chapter)}
                          >
                            编辑
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              router.push(
                                `/novel/${novelId}/chapter/${chapter.chapter_number}`
                              )
                            }
                          >
                            预览
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDelete(chapter.id)}
                            className="text-red-600 hover:text-red-700 hover:border-red-300"
                          >
                            删除
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
