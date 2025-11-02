import Card from '@/components/ui/Card'

interface ChapterContentProps {
  chapter: {
    chapter_number: number
    title: string
    content: string
    word_count: number
    created_at: string
  }
  fontSize: number
  lineHeight: number
  bgColor: string
}

export default function ChapterContent({
  chapter,
  fontSize,
  lineHeight,
  bgColor,
}: ChapterContentProps) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    })
  }

  return (
    <Card className="p-8" style={{ backgroundColor: bgColor }}>
      {/* 章节标题 */}
      <div className="mb-6 pb-4 border-b border-gray-200">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          第{chapter.chapter_number}章 {chapter.title}
        </h1>
        <div className="flex gap-4 text-sm text-gray-500">
          <span>字数：{chapter.word_count}</span>
          <span>发布于：{formatDate(chapter.created_at)}</span>
        </div>
      </div>

      {/* 章节内容 */}
      <div
        className="prose max-w-none"
        style={{
          fontSize: `${fontSize}px`,
          lineHeight: lineHeight,
          color: '#333',
        }}
      >
        {chapter.content.split('\n').map((paragraph, index) => (
          <p key={index} className="mb-4 indent-8">
            {paragraph}
          </p>
        ))}
      </div>

      {/* 章节结束 */}
      <div className="mt-8 pt-6 border-t border-gray-200 text-center text-gray-500">
        --- 本章完 ---
      </div>
    </Card>
  )
}

