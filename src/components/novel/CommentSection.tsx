'use client'

import { useState } from 'react'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Textarea from '@/components/ui/Textarea'

interface Comment {
  id: string
  content: string
  created_at: string
  users: {
    username: string
  }
  user_id: string
}

interface CommentSectionProps {
  comments: Comment[]
  currentUserId?: string
  onAddComment: (content: string) => Promise<void>
  onDeleteComment: (commentId: string) => Promise<void>
}

export default function CommentSection({
  comments,
  currentUserId,
  onAddComment,
  onDeleteComment,
}: CommentSectionProps) {
  const [newComment, setNewComment] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newComment.trim()) return

    setSubmitting(true)
    await onAddComment(newComment)
    setNewComment('')
    setSubmitting(false)
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))

    if (days === 0) {
      const hours = Math.floor(diff / (1000 * 60 * 60))
      if (hours === 0) {
        const minutes = Math.floor(diff / (1000 * 60))
        return minutes === 0 ? '刚刚' : `${minutes}分钟前`
      }
      return `${hours}小时前`
    }
    if (days < 7) return `${days}天前`
    return date.toLocaleDateString('zh-CN')
  }

  return (
    <Card className="p-6 bg-white">
      <h2 className="text-lg font-bold text-gray-900 mb-4 pb-3 border-b border-gray-200">
        读者评论 <span className="text-gray-500 font-normal">({comments.length})</span>
      </h2>

      {/* 发表评论 */}
      {currentUserId ? (
        <form onSubmit={handleSubmit} className="mb-6 pb-6 border-b border-gray-200">
          <Textarea
            placeholder="写下你的评论..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            disabled={submitting}
            className="mb-3"
            rows={4}
          />
          <div className="flex justify-end">
            <Button
              type="submit"
              variant="primary"
              size="sm"
              disabled={!newComment.trim() || submitting}
              className="px-6"
            >
              {submitting ? '发表中...' : '发表评论'}
            </Button>
          </div>
        </form>
      ) : (
        <div className="mb-6 pb-6 p-4 bg-gray-50 rounded text-center text-sm text-gray-500 border-b border-gray-200">
          请先登录后再发表评论
        </div>
      )}

      {/* 评论列表 */}
      {comments.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          还没有评论，来发表第一条评论吧！
        </div>
      ) : (
        <div className="space-y-4">
          {comments.map((comment) => (
            <div
              key={comment.id}
              className="pb-4 border-b border-gray-100 last:border-b-0 last:pb-0"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-gray-900 text-sm">
                    {comment.users.username}
                  </span>
                  <span className="text-xs text-gray-400">
                    {formatDate(comment.created_at)}
                  </span>
                </div>
                {currentUserId === comment.user_id && (
                  <button
                    onClick={() => onDeleteComment(comment.id)}
                    className="text-xs text-gray-400 hover:text-red-500 transition-colors"
                  >
                    删除
                  </button>
                )}
              </div>
              <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-wrap">{comment.content}</p>
            </div>
          ))}
        </div>
      )}
    </Card>
  )
}

