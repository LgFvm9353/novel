import Link from 'next/link'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'

interface ChapterListProps {
  novelId: string
  chapters: Array<{
    id: string
    chapter_number: number
    title: string
    word_count: number
    created_at: string
  }>
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
}

export default function ChapterList({
  novelId,
  chapters,
  currentPage,
  totalPages,
  onPageChange,
}: ChapterListProps) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('zh-CN', {
      month: '2-digit',
      day: '2-digit',
    })
  }

  return (
    <Card className="p-6 bg-white">
      <h2 className="text-lg font-bold text-gray-900 mb-4 pb-3 border-b border-gray-200">
        章节列表
      </h2>

      {chapters.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          暂无章节
        </div>
      ) : (
        <>
          <div className="space-y-1">
            {chapters.map((chapter) => (
              <Link
                key={chapter.id}
                href={`/novel/${novelId}/chapter/${chapter.chapter_number}`}
                className="block px-4 py-3 hover:bg-orange-50 rounded transition-colors border-b border-gray-100 last:border-b-0"
              >
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <span className="text-xs font-medium text-gray-500 whitespace-nowrap">
                      第{chapter.chapter_number}章
                    </span>
                    <span className="text-gray-900 hover:text-orange-500 text-sm truncate">
                      {chapter.title}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-gray-400 whitespace-nowrap">
                    <span>{chapter.word_count}字</span>
                    <span>{formatDate(chapter.created_at)}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {/* 分页 */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-2 mt-6 pt-4 border-t border-gray-200">
              <button
                onClick={() => onPageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="px-4 py-2 text-sm text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                上一页
              </button>
              <span className="text-sm text-gray-600 px-3">
                第 {currentPage} / {totalPages} 页
              </span>
              <button
                onClick={() => onPageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="px-4 py-2 text-sm text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                下一页
              </button>
            </div>
          )}
        </>
      )}
    </Card>
  )
}

