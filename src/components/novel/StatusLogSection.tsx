'use client'

import { useState } from 'react'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'

interface StatusLog {
  id: string
  status_note: string
  created_at: string
  users: {
    username: string
  }
}

interface StatusLogSectionProps {
  statusLogs: StatusLog[]
  currentUserId?: string
  onAddStatusLog: (statusNote: string) => Promise<void>
}

export default function StatusLogSection({
  statusLogs,
  currentUserId,
  onAddStatusLog,
}: StatusLogSectionProps) {
  const [newStatusNote, setNewStatusNote] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newStatusNote.trim()) return

    setSubmitting(true)
    await onAddStatusLog(newStatusNote)
    setNewStatusNote('')
    setSubmitting(false)
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <Card className="p-6">
      <h2 className="text-xl font-bold text-gray-900 mb-4">
        状态情况记录
      </h2>
      <p className="text-sm text-gray-600 mb-4">
        读者可以在此记录小说的阅读状态、追更情况等备注信息
      </p>

      {/* 添加状态记录 */}
      {currentUserId ? (
        <form onSubmit={handleSubmit} className="mb-6">
          <div className="flex gap-2">
            <Input
              placeholder="记录你的状态（如：追更中、弃坑了、等完结等）"
              value={newStatusNote}
              onChange={(e) => setNewStatusNote(e.target.value)}
              disabled={submitting}
            />
            <Button
              type="submit"
              variant="primary"
              disabled={!newStatusNote.trim() || submitting}
            >
              {submitting ? '添加中...' : '添加'}
            </Button>
          </div>
        </form>
      ) : (
        <div className="mb-6 p-4 bg-gray-50 rounded-md text-center text-gray-600">
          请先登录后再添加状态记录
        </div>
      )}

      {/* 状态记录列表 */}
      {statusLogs.length === 0 ? (
        <div className="text-center py-6 text-gray-500">
          暂无状态记录
        </div>
      ) : (
        <div className="space-y-3">
          {statusLogs.map((log) => (
            <div
              key={log.id}
              className="p-3 bg-gray-50 rounded-md"
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-medium text-gray-900 text-sm">
                  {log.users.username}
                </span>
                <span className="text-xs text-gray-500">
                  {formatDate(log.created_at)}
                </span>
              </div>
              <p className="text-gray-700 text-sm">{log.status_note}</p>
            </div>
          ))}
        </div>
      )}
    </Card>
  )
}

