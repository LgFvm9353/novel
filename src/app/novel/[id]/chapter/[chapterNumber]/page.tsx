'use client'

import { useState, useEffect, useCallback } from 'react'
import { use } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { getChapter } from '@/lib/supabase/chapters'
import { getNovelById } from '@/lib/supabase/novels'
import ChapterContent from '@/components/reader/ChapterContent'
import ReaderSettings from '@/components/reader/ReaderSettings'
import Button from '@/components/ui/Button'

export default function ChapterPage({
  params,
}: {
  params: Promise<{ id: string; chapterNumber: string }>
}) {
  const { id, chapterNumber } = use(params)
  const router = useRouter()
  const [novel, setNovel] = useState<any>(null)
  const [chapter, setChapter] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  // 阅读设置
  const [fontSize, setFontSize] = useState(16)
  const [lineHeight, setLineHeight] = useState(1.8)
  const [bgColor, setBgColor] = useState('#ffffff')

  const loadData = useCallback(async () => {
    setLoading(true)

    const [novelResult, chapterResult] = await Promise.all([
      getNovelById(id),
      getChapter(id, parseInt(chapterNumber)),
    ])

    if (novelResult.data) {
      setNovel(novelResult.data)
    }

    if (chapterResult.data) {
      setChapter(chapterResult.data)
    }

    setLoading(false)
  }, [id, chapterNumber])

  useEffect(() => {
    loadData()
  }, [loadData])

  // 从 localStorage 加载阅读设置（只执行一次）
  useEffect(() => {
    const savedSettings = localStorage.getItem('readerSettings')
    if (savedSettings) {
      try {
        const settings = JSON.parse(savedSettings)
        setFontSize(settings.fontSize || 16)
        setLineHeight(settings.lineHeight || 1.8)
        setBgColor(settings.bgColor || '#ffffff')
      } catch (error) {
        console.error('Failed to parse reader settings:', error)
      }
    }
  }, []) // 只执行一次

  const saveSettings = (newSettings: any) => {
    localStorage.setItem('readerSettings', JSON.stringify(newSettings))
  }

  const handleFontSizeChange = (size: number) => {
    setFontSize(size)
    saveSettings({ fontSize: size, lineHeight, bgColor })
  }

  const handleLineHeightChange = (height: number) => {
    setLineHeight(height)
    saveSettings({ fontSize, lineHeight: height, bgColor })
  }

  const handleBgColorChange = (color: string) => {
    setBgColor(color)
    saveSettings({ fontSize, lineHeight, bgColor: color })
  }

  const handlePrevChapter = () => {
    const prevNumber = parseInt(chapterNumber) - 1
    if (prevNumber >= 1) {
      router.push(`/novel/${id}/chapter/${prevNumber}`)
    }
  }

  const handleNextChapter = () => {
    const nextNumber = parseInt(chapterNumber) + 1
    if (novel && nextNumber <= novel.total_chapters) {
      router.push(`/novel/${id}/chapter/${nextNumber}`)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">加载中...</div>
      </div>
    )
  }

  if (!chapter || !novel) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-gray-500 mb-4">章节不存在</div>
          <Link href={`/novel/${id}`}>
            <Button variant="primary">返回目录</Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: bgColor }}>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 顶部导航 */}
        <div className="flex items-center justify-between mb-6">
          <Link href={`/novel/${id}`}>
            <Button variant="outline" size="sm">
              ← 返回目录
            </Button>
          </Link>
          <div className="text-center flex-1 mx-4">
            <h2 className="text-lg font-semibold text-gray-900 truncate">
              {novel.title}
            </h2>
          </div>
          <ReaderSettings
            fontSize={fontSize}
            lineHeight={lineHeight}
            bgColor={bgColor}
            onFontSizeChange={handleFontSizeChange}
            onLineHeightChange={handleLineHeightChange}
            onBgColorChange={handleBgColorChange}
          />
        </div>

        {/* 章节内容 */}
        <ChapterContent
          chapter={chapter}
          fontSize={fontSize}
          lineHeight={lineHeight}
          bgColor={bgColor}
        />

        {/* 底部导航 */}
        <div className="flex items-center justify-center gap-4 mt-8">
          <Button
            variant="outline"
            onClick={handlePrevChapter}
            disabled={parseInt(chapterNumber) === 1}
          >
            ← 上一章
          </Button>
          <Link href={`/novel/${id}`}>
            <Button variant="secondary">目录</Button>
          </Link>
          <Button
            variant="outline"
            onClick={handleNextChapter}
            disabled={parseInt(chapterNumber) >= novel.total_chapters}
          >
            下一章 →
          </Button>
        </div>
      </div>
    </div>
  )
}
