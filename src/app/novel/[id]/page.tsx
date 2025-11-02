'use client'

import { useState, useEffect, useCallback } from 'react'
import { use } from 'react'
import { getNovelById, voteNovel, hasUserVoted } from '@/lib/supabase/novels'
import { getChaptersByNovelId } from '@/lib/supabase/chapters'
import { getCommentsByNovelId, addComment, deleteComment } from '@/lib/supabase/comments'
import { getStatusLogsByNovelId, addStatusLog } from '@/lib/supabase/statusLogs'
import { useAuthStore } from '@/lib/store/authStore'
import NovelInfo from '@/components/novel/NovelInfo'
import ChapterList from '@/components/novel/ChapterList'
import CommentSection from '@/components/novel/CommentSection'
import StatusLogSection from '@/components/novel/StatusLogSection'

export default function NovelDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const { userProfile } = useAuthStore()
  const [novel, setNovel] = useState<any>(null)
  const [chapters, setChapters] = useState<any[]>([])
  const [comments, setComments] = useState<any[]>([])
  const [statusLogs, setStatusLogs] = useState<any[]>([])
  const [hasVoted, setHasVoted] = useState(false)
  const [loading, setLoading] = useState(true)
  const [chapterPage, setChapterPage] = useState(1)
  const [chapterTotalPages, setChapterTotalPages] = useState(0)

  const pageSize = 20

  const loadNovelData = useCallback(async () => {
    setLoading(true)

    // 优先加载核心数据（小说信息）
    const novelResult = await getNovelById(id)
    if (novelResult.data) {
      setNovel(novelResult.data)
      setLoading(false) // 核心数据加载完成即可显示
    }

    // 延迟加载次要数据（评论、状态日志），不阻塞页面显示
    Promise.all([
      getCommentsByNovelId(id),
      getStatusLogsByNovelId(id),
    ]).then(([commentsResult, statusLogsResult]) => {
      setComments(commentsResult.data)
      setStatusLogs(statusLogsResult.data)
    })

    // 投票状态检查延迟到用户交互时（点击投票按钮时）
    // 这样可以减少初始加载时的请求数量
  }, [id])

  const loadChapters = useCallback(async () => {
    const { data, count } = await getChaptersByNovelId(id, chapterPage, pageSize)
    setChapters(data)
    setChapterTotalPages(Math.ceil(count / pageSize))
  }, [id, chapterPage, pageSize])

  useEffect(() => {
    loadNovelData()
  }, [loadNovelData])

  useEffect(() => {
    loadChapters()
  }, [loadChapters])

  const handleVote = async () => {
    if (!userProfile) {
      alert('请先登录')
      return
    }

    // 在用户交互时检查投票状态（延迟检查）
    if (!hasVoted && userProfile.id) {
      const voted = await hasUserVoted(id, userProfile.id)
      if (voted) {
        setHasVoted(true)
        alert('您已经投过票了')
        return
      }
    }

    if (hasVoted) {
      alert('您已经投过票了')
      return
    }

    const { success, vote_count, error } = await voteNovel(id, userProfile.id)

    if (error) {
      if (error.includes('已经投过票')) {
        setHasVoted(true)
      }
      alert(error)
      return
    }

    if (success && vote_count !== undefined) {
      // 乐观更新：直接更新小说的投票数和投票状态
      setNovel((prev: any) => ({
        ...prev,
        vote_count,
      }))
      setHasVoted(true)
      alert('投票成功！')
    }
  }

  const handleAddComment = async (content: string) => {
    if (!userProfile) return

    const { data, error } = await addComment(id, userProfile.id, content)
    if (!error && data) {
      // 乐观更新：直接添加到列表，无需重新加载
      setComments([data, ...comments])
    }
  }

  const handleDeleteComment = async (commentId: string) => {
    if (!confirm('确定要删除这条评论吗？')) return

    const { error } = await deleteComment(commentId)
    if (!error) {
      // 乐观更新：直接从列表中移除
      setComments(comments.filter(c => c.id !== commentId))
    }
  }

  const handleAddStatusLog = async (statusNote: string) => {
    if (!userProfile) return

    const { data, error } = await addStatusLog(id, userProfile.id, statusNote)
    if (!error && data) {
      // 乐观更新：直接添加到列表
      setStatusLogs([data, ...statusLogs])
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">加载中...</div>
      </div>
    )
  }

  if (!novel) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">小说不存在</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* 小说信息 */}
          <NovelInfo 
            novel={novel} 
            onVote={handleVote}
            currentUserId={userProfile?.id}
            hasVoted={hasVoted}
            showVoteButton={
              // 如果是作者，不显示投票按钮（不能给自己投票）
              novel?.authors?.user_id !== userProfile?.id
            }
          />

          {/* 章节列表 */}
          <ChapterList
            novelId={id}
            chapters={chapters}
            currentPage={chapterPage}
            totalPages={chapterTotalPages}
            onPageChange={setChapterPage}
          />

          {/* 评论区 */}
          <CommentSection
            comments={comments}
            currentUserId={userProfile?.id}
            onAddComment={handleAddComment}
            onDeleteComment={handleDeleteComment}
          />

          {/* 状态记录 - 移到下方 */}
          <StatusLogSection
            statusLogs={statusLogs}
            currentUserId={userProfile?.id}
            onAddStatusLog={handleAddStatusLog}
          />
        </div>
      </div>
    </div>
  )
}
