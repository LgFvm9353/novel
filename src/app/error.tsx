'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import Button from '@/components/ui/Button'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // 记录错误到控制台（生产环境应记录到日志服务）
    console.error('Error:', error)
  }, [error])

  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="text-center max-w-md mx-auto px-4">
        <h1 className="text-5xl font-bold text-gray-900 mb-4">出错了</h1>
        <p className="text-gray-600 mb-6">
          抱歉，页面加载时出现了错误。请稍后重试。
        </p>
        {error.message && (
          <p className="text-sm text-gray-500 mb-8 bg-gray-50 p-4 rounded-lg">
            {error.message}
          </p>
        )}
        <div className="flex gap-4 justify-center">
          <Button onClick={reset} variant="primary">
            重试
          </Button>
          <Link href="/">
            <Button variant="outline">返回首页</Button>
          </Link>
        </div>
      </div>
    </div>
  )
}

