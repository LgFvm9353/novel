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
    <Card className="p-6 bg-white">
      {/* 标题和状态 */}
      <div className="flex items-start justify-between mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 flex-1 pr-4">{novel.title}</h1>
        <span className={`px-3 py-1 text-xs font-medium rounded ${getStatusColor(novel.status)} whitespace-nowrap`}>
          {novel.status}
        </span>
      </div>

      {/* 元信息 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 mb-6 pb-6 border-b border-gray-200">
        <div>
          <div className="text-xs text-gray-500 mb-1">作者</div>
          <div className="font-medium text-gray-900 text-sm">{novel.authors?.name || '未知'}</div>
        </div>
        <div>
          <div className="text-xs text-gray-500 mb-1">分类</div>
          <div className="font-medium text-gray-900 text-sm">{novel.categories?.name || '未分类'}</div>
        </div>
        <div>
          <div className="text-xs text-gray-500 mb-1">章节数</div>
          <div className="font-medium text-gray-900 text-sm">{novel.total_chapters} 章</div>
        </div>
        <div>
          <div className="text-xs text-gray-500 mb-1">总页数</div>
          <div className="font-medium text-gray-900 text-sm">{novel.total_pages} 页</div>
        </div>
      </div>

      {/* 简介 */}
      <div className="mb-6">
        <h3 className="text-base font-semibold text-gray-900 mb-3">作品简介</h3>
        <p className="text-gray-600 text-sm leading-relaxed whitespace-pre-wrap">
          {novel.description || '暂无简介'}
        </p>
      </div>

      {/* 作者简介 */}
      {novel.authors?.bio && (
        <div className="mb-6 pb-6 border-b border-gray-200">
          <h3 className="text-base font-semibold text-gray-900 mb-3">作者简介</h3>
          <p className="text-gray-600 text-sm leading-relaxed">{novel.authors.bio}</p>
        </div>
      )}

      {/* 统计和操作 */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pt-4">
        <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500">
          <span className="flex items-center gap-1">
            <svg className="w-4 h-4 text-orange-500" fill="currentColor" viewBox="0 0 20 20">
              <path d="M2 10.5a1.5 1.5 0 113 0v6a1.5 1.5 0 01-3 0v-6zM6 10.333v5.834a1 1 0 001.581.814l4.288-2.567a1 1 0 00.53-.814v-3.265a1 1 0 00.53-.814l4.288-2.567a1 1 0 00.53-.814V3.5a1.5 1.5 0 00-3 0v.667a1 1 0 01-1.581.814L8.53 2.48a1 1 0 00-1.06 0l-4.288 2.567a1 1 0 01-1.53-.814v-1a1.5 1.5 0 00-3 0v6z" />
            </svg>
            {novel.vote_count} 票
          </span>
          <span>创建于 {formatDate(novel.created_at)}</span>
          <span>更新于 {formatDate(novel.updated_at)}</span>
        </div>
        {showVoteButton && currentUserId && (
          <>
            {hasVoted ? (
              <span className="px-4 py-2 text-sm font-medium text-green-600 bg-green-50 rounded border border-green-200 inline-flex items-center gap-1">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                已投票
              </span>
            ) : onVote ? (
              <Button onClick={onVote} variant="primary" size="sm" className="whitespace-nowrap">
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

