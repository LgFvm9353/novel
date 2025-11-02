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
    <div className="mb-6 space-y-4">
      {/* 分类筛选 - 胶囊式标签 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          分类
        </label>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => handleCategoryChange('')}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors duration-200 ${
              selectedCategory === ''
                ? 'bg-orange-500 text-white'
                : 'bg-white border border-gray-300 text-gray-700 hover:border-orange-400 hover:text-orange-600'
            }`}
          >
            全部分类
          </button>
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => handleCategoryChange(category.id)}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors duration-200 ${
                selectedCategory === category.id
                  ? 'bg-orange-500 text-white'
                  : 'bg-white border border-gray-300 text-gray-700 hover:border-orange-400 hover:text-orange-600'
              }`}
            >
              {category.name}
            </button>
          ))}
        </div>
      </div>

      {/* 状态和排序 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* 状态筛选 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            状态
          </label>
          <select
            value={selectedStatus}
            onChange={(e) => handleStatusChange(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-orange-500 focus:border-orange-500 bg-white text-sm"
          >
            {statuses.map((status) => (
              <option key={status.value} value={status.value}>
                {status.label}
              </option>
            ))}
          </select>
        </div>

        {/* 排序 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            排序
          </label>
          <select
            value={sortBy}
            onChange={(e) => handleSortChange(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-orange-500 focus:border-orange-500 bg-white text-sm"
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
  )
}

