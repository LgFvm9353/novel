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
    <Card className="p-6">
      <h2 className="text-xl font-bold text-gray-900 mb-4">
        章节列表
      </h2>

      {chapters.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          暂无章节
        </div>
      ) : (
        <>
          <div className="space-y-2">
            {chapters.map((chapter) => (
              <Link
                key={chapter.id}
                href={`/novel/${novelId}/chapter/${chapter.chapter_number}`}
                className="block px-4 py-3 hover:bg-gray-50 rounded-md transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-gray-500 w-12">
                      第{chapter.chapter_number}章
                    </span>
                    <span className="text-gray-900 hover:text-blue-600">
                      {chapter.title}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <span>{chapter.word_count} 字</span>
                    <span>{formatDate(chapter.created_at)}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {/* 分页 */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-2 mt-6 pt-4 border-t border-gray-200">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onPageChange(currentPage - 1)}
                disabled={currentPage === 1}
              >
                上一页
              </Button>
              <span className="text-sm text-gray-600">
                第 {currentPage} / {totalPages} 页
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onPageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
              >
                下一页
              </Button>
            </div>
          )}
        </>
      )}
    </Card>
  )
}

