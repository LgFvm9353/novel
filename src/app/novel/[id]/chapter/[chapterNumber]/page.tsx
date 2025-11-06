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

    try {
      const chapterNum = parseInt(chapterNumber)
      if (isNaN(chapterNum) || chapterNum < 1) {
        setLoading(false)
        return
      }

      const [novelResult, chapterResult] = await Promise.all([
        getNovelById(id),
        getChapter(id, chapterNum),
      ])

      if (novelResult.data) {
        setNovel(novelResult.data)
      }

      if (chapterResult.data) {
        setChapter(chapterResult.data)
      }
    } catch (error) {
      console.error('Error loading chapter data:', error)
    } finally {
      setLoading(false)
    }
  }, [id, chapterNumber])

  useEffect(() => {
    loadData()
  }, [loadData])

  // 从 localStorage 加载阅读设置（只执行一次）
  useEffect(() => {
    if (typeof window === 'undefined') return // SSR安全检查
    
    try {
      const savedSettings = localStorage.getItem('readerSettings')
      if (savedSettings) {
        const settings = JSON.parse(savedSettings)
        setFontSize(settings.fontSize || 16)
        setLineHeight(settings.lineHeight || 1.8)
        setBgColor(settings.bgColor || '#ffffff')
      }
    } catch (error) {
      console.error('Failed to parse reader settings:', error)
    }
  }, []) // 只执行一次

  const saveSettings = (newSettings: any) => {
    if (typeof window === 'undefined') return // SSR安全检查
    try {
      localStorage.setItem('readerSettings', JSON.stringify(newSettings))
    } catch (error) {
      console.error('Failed to save reader settings:', error)
    }
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
    if (novel && novel.total_chapters && nextNumber <= novel.total_chapters) {
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
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* 顶部导航 */}
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-200">
          <Link href={`/novel/${id}`}>
            <button className="px-4 py-2 text-sm text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 transition-colors">
              ← 返回目录
            </button>
          </Link>
          <div className="text-center flex-1 mx-4 min-w-0">
            <h2 className="text-base font-semibold text-gray-900 truncate">
              {novel.title}
            </h2>
            <p className="text-xs text-gray-500 mt-1 truncate">
              第{chapterNumber}章
            </p>
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
        <div className="flex items-center justify-center gap-3 mt-10 pt-6 border-t border-gray-200">
          <button
            onClick={handlePrevChapter}
            disabled={parseInt(chapterNumber) === 1}
            className="px-5 py-2 text-sm text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            ← 上一章
          </button>
          <Link href={`/novel/${id}`}>
            <button className="px-5 py-2 text-sm text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 transition-colors">
              目录
            </button>
          </Link>
          <button
            onClick={handleNextChapter}
            disabled={!novel?.total_chapters || parseInt(chapterNumber) >= novel.total_chapters}
            className="px-5 py-2 text-sm text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            下一章 →
          </button>
        </div>
      </div>
    </div>
  )
}
