import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'

interface NovelInfoProps {
  novel: {
    id: string
    title: string
    description: string | null
    status: string
    total_chapters: number
    total_pages: number
    vote_count: number
    created_at: string
    updated_at: string
    authors: {
      id?: string
      name: string
      bio: string | null
      user_id?: string
    }
    categories: {
      name: string
    }
  }
  onVote?: () => void
  currentUserId?: string | null
  hasVoted?: boolean
  showVoteButton?: boolean
}

export default function NovelInfo({ novel, onVote, currentUserId, hasVoted = false, showVoteButton = true }: NovelInfoProps) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    })
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case '连载中':
        return 'bg-green-50 text-green-700 border border-green-200'
      case '已完结':
        return 'bg-blue-50 text-blue-700 border border-blue-200'
      case '已暂停':
        return 'bg-gray-50 text-gray-600 border border-gray-200'
      default:
        return 'bg-gray-50 text-gray-600 border border-gray-200'
    }
  }

  return (
    <Card className="p-6">
      {/* 标题和状态 */}
      <div className="flex items-start justify-between mb-4">
        <h1 className="text-3xl font-bold text-gray-900">{novel.title}</h1>
        <span className={`px-2.5 py-1 text-xs font-medium rounded border ${getStatusColor(novel.status)}`}>
          {novel.status}
        </span>
      </div>

      {/* 元信息 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div>
          <div className="text-sm text-gray-500">作者</div>
          <div className="font-medium text-gray-900">{novel.authors.name}</div>
        </div>
        <div>
          <div className="text-sm text-gray-500">分类</div>
          <div className="font-medium text-gray-900">{novel.categories.name}</div>
        </div>
        <div>
          <div className="text-sm text-gray-500">章节数</div>
          <div className="font-medium text-gray-900">{novel.total_chapters} 章</div>
        </div>
        <div>
          <div className="text-sm text-gray-500">总页数</div>
          <div className="font-medium text-gray-900">{novel.total_pages} 页</div>
        </div>
      </div>

      {/* 简介 */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">作品简介</h3>
        <p className="text-gray-600 whitespace-pre-wrap">
          {novel.description || '暂无简介'}
        </p>
      </div>

      {/* 作者简介 */}
      {novel.authors.bio && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">作者简介</h3>
          <p className="text-gray-600">{novel.authors.bio}</p>
        </div>
      )}

      {/* 统计和操作 */}
      <div className="flex items-center justify-between pt-4 border-t border-gray-200">
        <div className="flex gap-4 text-sm text-gray-600">
          <span>{novel.vote_count} 票</span>
          <span>创建于 {formatDate(novel.created_at)}</span>
          <span>更新于 {formatDate(novel.updated_at)}</span>
        </div>
        {showVoteButton && currentUserId && (
          <>
            {hasVoted ? (
              <span className="px-4 py-2 text-sm font-medium text-green-600 bg-green-50 rounded-lg border border-green-200">
                ✓ 已投票
              </span>
            ) : onVote ? (
              <Button onClick={onVote} variant="primary" size="sm">
                投票支持
              </Button>
            ) : null}
          </>
        )}
        {showVoteButton && !currentUserId && (
          <span className="text-sm text-gray-500">登录后可投票</span>
        )}
      </div>
    </Card>
  )
}

