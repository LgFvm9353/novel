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
    <Link href={`/novel/${novel.id}`} className="block">
      <div className="group bg-white rounded-lg overflow-hidden border border-gray-200 hover:border-orange-300 hover:shadow-lg transition-all duration-200 cursor-pointer h-full flex flex-col">
          {/* 封面区域 */}
          <div className="relative aspect-[3/4] overflow-hidden bg-gray-100">
            {novel.cover_image ? (
              <Image 
                src={novel.cover_image} 
                alt={novel.title}
                fill
              className="object-cover group-hover:scale-105 transition-transform duration-300"
                loading="lazy"
              sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 20vw"
              />
            ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
                <div className="text-center text-gray-400">
                <div className="text-3xl mb-1">📖</div>
                  <div className="text-xs">暂无封面</div>
                </div>
              </div>
            )}
            {/* 状态标签 */}
            <div className="absolute top-2 right-2">
            <span className={`inline-block px-2 py-0.5 text-xs font-medium rounded ${getStatusColor(novel.status)}`}>
                {novel.status}
              </span>
            </div>
          </div>

          {/* 信息区域 */}
        <div className="p-3 flex-1 flex flex-col">
            {/* 标题 */}
          <h3 className="font-semibold text-sm mb-2 line-clamp-2 text-gray-900 group-hover:text-orange-500 transition-colors leading-snug">
              {novel.title}
            </h3>

          {/* 作者和分类 */}
          <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-2">
            <span className="text-gray-700">{novel.authors?.name || '未知'}</span>
              <span className="text-gray-300">·</span>
            <span>{novel.categories?.name || '未分类'}</span>
            </div>

            {/* 底部信息 */}
          <div className="flex items-center justify-between mt-auto pt-2 border-t border-gray-100">
              <span className="text-xs text-gray-400">
              {novel.total_chapters}章
              </span>
              {novel.vote_count > 0 && (
              <span className="text-xs text-orange-500 font-medium flex items-center gap-1">
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M2 10.5a1.5 1.5 0 113 0v6a1.5 1.5 0 01-3 0v-6zM6 10.333v5.834a1 1 0 001.581.814l4.288-2.567a1 1 0 00.53-.814v-3.265a1 1 0 00.53-.814l4.288-2.567a1 1 0 00.53-.814V3.5a1.5 1.5 0 00-3 0v.667a1 1 0 01-1.581.814L8.53 2.48a1 1 0 00-1.06 0l-4.288 2.567a1 1 0 01-1.53-.814v-1a1.5 1.5 0 00-3 0v6z" />
                </svg>
                {novel.vote_count}
                </span>
              )}
            </div>
          </div>
        </div>
    </Link>
  )
}

