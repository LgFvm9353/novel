import Link from 'next/link'
import Image from 'next/image'
import Card from '@/components/ui/Card'

interface NovelCardProps {
  novel: {
    id: string
    title: string
    description: string | null
    cover_image: string | null
    status: string
    total_chapters: number
    vote_count: number
    updated_at: string
    authors: {
      name: string
    }
    categories: {
      name: string
    }
  }
}

// 将 formatDate 移到组件外部，避免每次渲染都创建新函数
const formatDate = (dateString: string) => {
  const date = new Date(dateString)
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
}

export default function NovelCard({ novel }: NovelCardProps) {

  const getStatusColor = (status: string) => {
    switch (status) {
      case '连载中':
        return 'bg-green-50 text-green-700 border-green-200'
      case '已完结':
        return 'bg-blue-50 text-blue-700 border-blue-200'
      case '已暂停':
        return 'bg-gray-50 text-gray-600 border-gray-200'
      default:
        return 'bg-gray-50 text-gray-600 border-gray-200'
    }
  }

  return (
    <Link href={`/novel/${novel.id}`}>
      <Card className="group overflow-hidden border border-gray-200 hover:border-gray-300 hover:shadow-md transition-all duration-200 cursor-pointer h-full">
        <div className="flex flex-col h-full">
          {/* 封面区域 */}
          <div className="relative aspect-[3/4] overflow-hidden bg-gray-100">
            {novel.cover_image ? (
              <Image 
                src={novel.cover_image} 
                alt={novel.title}
                fill
                className="object-cover"
                loading="lazy"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gray-50">
                <div className="text-center text-gray-400">
                  <div className="text-2xl mb-1">📖</div>
                  <div className="text-xs">暂无封面</div>
                </div>
              </div>
            )}
            {/* 状态标签 */}
            <div className="absolute top-2 right-2">
              <span className={`inline-block px-2 py-0.5 text-xs font-medium rounded border ${getStatusColor(novel.status)}`}>
                {novel.status}
              </span>
            </div>
          </div>

          {/* 信息区域 */}
          <div className="p-3 flex-1 flex flex-col bg-white">
            {/* 标题 */}
            <h3 className="font-semibold text-base mb-1.5 line-clamp-2 text-gray-900 group-hover:text-orange-600 transition-colors">
              {novel.title}
            </h3>

            {/* 简介 */}
            <p className="text-gray-600 text-xs mb-2.5 line-clamp-2 flex-1 leading-relaxed">
              {novel.description || '暂无简介'}
            </p>

            {/* 元信息 */}
            <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-gray-500 mb-2">
              <span className="font-medium text-gray-700">{novel.authors.name}</span>
              <span className="text-gray-300">·</span>
              <span>{novel.categories.name}</span>
              <span className="text-gray-300">·</span>
              <span>{novel.total_chapters}章</span>
            </div>

            {/* 底部信息 */}
            <div className="flex items-center justify-between pt-2 mt-auto border-t border-gray-100">
              <span className="text-xs text-gray-400">
                {formatDate(novel.updated_at)}
              </span>
              {novel.vote_count > 0 && (
                <span className="text-xs text-orange-600 font-medium">
                  {novel.vote_count}票
                </span>
              )}
            </div>
          </div>
        </div>
      </Card>
    </Link>
  )
}

