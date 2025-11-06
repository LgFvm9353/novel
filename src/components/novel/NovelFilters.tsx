'use client'

import { useState } from 'react'
import Button from '@/components/ui/Button'

interface NovelFiltersProps {
  categories: Array<{ id: string; name: string }>
  onFilterChange: (filters: {
    categoryId?: string
    status?: string
    sortBy: string
  }) => void
}

export default function NovelFilters({
  categories,
  onFilterChange,
}: NovelFiltersProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('')
  const [selectedStatus, setSelectedStatus] = useState<string>('')
  const [sortBy, setSortBy] = useState<string>('updated_at')

  const statuses = [
    { value: '', label: '全部状态' },
    { value: '连载中', label: '连载中' },
    { value: '已完结', label: '已完结' },
    { value: '已暂停', label: '已暂停' },
  ]

  const sortOptions = [
    { value: 'updated_at', label: '最新更新' },
    { value: 'vote_count', label: '最多投票' },
    { value: 'created_at', label: '最新发布' },
  ]

  const handleCategoryChange = (categoryId: string) => {
    setSelectedCategory(categoryId)
    onFilterChange({
      categoryId: categoryId || undefined,
      status: selectedStatus || undefined,
      sortBy,
    })
  }

  const handleStatusChange = (status: string) => {
    setSelectedStatus(status)
    onFilterChange({
      categoryId: selectedCategory || undefined,
      status: status || undefined,
      sortBy,
    })
  }

  const handleSortChange = (newSortBy: string) => {
    setSortBy(newSortBy)
    onFilterChange({
      categoryId: selectedCategory || undefined,
      status: selectedStatus || undefined,
      sortBy: newSortBy,
    })
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        {/* 分类筛选 */}
        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm text-gray-500 mr-2">分类：</span>
            <button
              onClick={() => handleCategoryChange('')}
              className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                selectedCategory === ''
                  ? 'bg-orange-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-orange-50 hover:text-orange-600'
              }`}
            >
              全部
            </button>
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => handleCategoryChange(category.id)}
                className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                  selectedCategory === category.id
                    ? 'bg-orange-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-orange-50 hover:text-orange-600'
                }`}
              >
                {category.name}
              </button>
            ))}
          </div>
        </div>

        {/* 状态和排序 */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">状态：</span>
            <select
              value={selectedStatus}
              onChange={(e) => handleStatusChange(e.target.value)}
              className="px-3 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-orange-500 focus:border-orange-500 bg-white"
            >
              {statuses.map((status) => (
                <option key={status.value} value={status.value}>
                  {status.label}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">排序：</span>
            <select
              value={sortBy}
              onChange={(e) => handleSortChange(e.target.value)}
              className="px-3 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-orange-500 focus:border-orange-500 bg-white"
            >
              {sortOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
    </div>
  )
}

