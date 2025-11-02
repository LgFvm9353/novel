'use client'

import { useState } from 'react'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'

interface ReaderSettingsProps {
  fontSize: number
  lineHeight: number
  bgColor: string
  onFontSizeChange: (size: number) => void
  onLineHeightChange: (height: number) => void
  onBgColorChange: (color: string) => void
}

export default function ReaderSettings({
  fontSize,
  lineHeight,
  bgColor,
  onFontSizeChange,
  onLineHeightChange,
  onBgColorChange,
}: ReaderSettingsProps) {
  const [showSettings, setShowSettings] = useState(false)

  const bgColors = [
    { name: '白色', value: '#ffffff' },
    { name: '护眼绿', value: '#e4f4e4' },
    { name: '米黄', value: '#fef9e7' },
    { name: '浅灰', value: '#f5f5f5' },
  ]

  return (
    <div className="relative">
      <Button
        variant="outline"
        size="sm"
        onClick={() => setShowSettings(!showSettings)}
      >
        阅读设置
      </Button>

      {showSettings && (
        <Card className="absolute right-0 top-12 p-4 w-64 z-10 shadow-lg">
          <div className="space-y-4">
            {/* 字体大小 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                字体大小
              </label>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onFontSizeChange(Math.max(12, fontSize - 2))}
                >
                  A-
                </Button>
                <span className="text-sm text-gray-600 flex-1 text-center">
                  {fontSize}px
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onFontSizeChange(Math.min(24, fontSize + 2))}
                >
                  A+
                </Button>
              </div>
            </div>

            {/* 行间距 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                行间距
              </label>
              <select
                value={lineHeight}
                onChange={(e) => onLineHeightChange(Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              >
                <option value={1.5}>紧凑 (1.5)</option>
                <option value={1.8}>标准 (1.8)</option>
                <option value={2.0}>宽松 (2.0)</option>
                <option value={2.5}>超宽 (2.5)</option>
              </select>
            </div>

            {/* 背景色 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                背景颜色
              </label>
              <div className="grid grid-cols-2 gap-2">
                {bgColors.map((color) => (
                  <button
                    key={color.value}
                    onClick={() => onBgColorChange(color.value)}
                    className={`px-3 py-2 text-sm rounded-md border ${
                      bgColor === color.value
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                    style={{ backgroundColor: color.value }}
                  >
                    {color.name}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </Card>
      )}
    </div>
  )
}

