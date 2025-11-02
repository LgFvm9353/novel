'use client'

import { useState, useEffect, useCallback } from 'react'
import { getNovels, getCategories } from '@/lib/supabase/novels'
import { cache, CACHE_KEYS } from '@/lib/cache'
import NovelCard from '@/components/novel/NovelCard'
import NovelFilters from '@/components/novel/NovelFilters'
import Button from '@/components/ui/Button'

export default function Home() {
  const [novels, setNovels] = useState<any[]>([])
  const [categories, setCategories] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [searchQuery, setSearchQuery] = useState('')
  const [filters, setFilters] = useState<{
    categoryId?: string
    status?: string
    sortBy: string
  }>({ sortBy: 'updated_at' })

  const pageSize = 12

  const loadCategories = useCallback(async () => {
    // 先检查缓存
    const cached = cache.get<any[]>(CACHE_KEYS.CATEGORIES)
    if (cached) {
      setCategories(cached)
      return
    }

    // 缓存未命中，获取数据
    const { data } = await getCategories()
    if (data) {
      setCategories(data)
      // 缓存 30 分钟（分类很少变化）
      cache.set(CACHE_KEYS.CATEGORIES, data, 30 * 60 * 1000)
    }
  }, [])

  const loadNovels = useCallback(async () => {
    setLoading(true)
    const { data, count } = await getNovels({
      page,
      pageSize,
      categoryId: filters.categoryId,
      status: filters.status as any,
      searchQuery: searchQuery || undefined,
      sortBy: filters.sortBy as any,
    })
    setNovels(data)
    setTotalCount(count)
    setLoading(false)
  }, [page, filters, searchQuery, pageSize])

  // 加载分类
  useEffect(() => {
    loadCategories()
  }, [loadCategories])

  // 加载小说列表
  useEffect(() => {
    loadNovels()
  }, [loadNovels])

  const handleFilterChange = (newFilters: typeof filters) => {
    setFilters(newFilters)
    setPage(1) // 重置到第一页
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setPage(1)
  }

  const totalPages = Math.ceil(totalCount / pageSize)

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 标题和搜索 */}
        <div className="mb-8">
          <div className="text-center mb-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              精选小说
            </h1>
            <p className="text-gray-500 text-sm">发现精彩故事，开启阅读之旅</p>
          </div>
          <form onSubmit={handleSearch} className="max-w-2xl mx-auto">
            <div className="relative flex items-center gap-2">
              <div className="relative flex-1">
                <input
                  type="text"
                  placeholder="搜索小说标题或作者..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-4 py-2.5 pl-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-orange-500 focus:border-orange-500 bg-white text-gray-900 placeholder-gray-400"
                />
                <svg
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </div>
              <Button
                type="submit"
                variant="primary"
                className="px-5 py-2.5 rounded-lg"
              >
                搜索
              </Button>
            </div>
          </form>
        </div>

        {/* 筛选器 */}
        <div className="bg-white rounded-lg p-4 mb-6 border border-gray-200">
          <NovelFilters categories={categories} onFilterChange={handleFilterChange} />
        </div>

        {/* 小说列表 */}
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-flex items-center gap-2 text-gray-500">
              <svg
                className="animate-spin h-5 w-5 text-blue-500"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              <span>加载中...</span>
            </div>
          </div>
        ) : novels.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📖</div>
            <div className="text-gray-500 text-lg">暂无小说</div>
            <p className="text-gray-400 text-sm mt-2">试试调整筛选条件或搜索其他关键词</p>
          </div>
        ) : (
          <>
            {/* 结果统计 */}
            <div className="mb-6 flex items-center justify-between">
              <p className="text-sm text-gray-600">
                共找到 <span className="font-bold text-blue-600">{totalCount}</span> 本小说
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
              {novels.map((novel) => (
                <NovelCard key={novel.id} novel={novel} />
              ))}
            </div>

            {/* 分页 */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-3 mt-8">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(page - 1)}
                  disabled={page === 1}
                  className="px-4 py-2 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span className="flex items-center gap-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    上一页
                  </span>
                </Button>
                <div className="flex items-center gap-2">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum: number
                    if (totalPages <= 5) {
                      pageNum = i + 1
                    } else if (page <= 3) {
                      pageNum = i + 1
                    } else if (page >= totalPages - 2) {
                      pageNum = totalPages - 4 + i
                    } else {
                      pageNum = page - 2 + i
                    }
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setPage(pageNum)}
                        className={`px-3 py-1 rounded text-sm transition-colors duration-200 ${
                          page === pageNum
                            ? 'bg-orange-500 text-white'
                            : 'bg-white border border-gray-300 text-gray-700 hover:border-orange-400 hover:text-orange-600'
                        }`}
                      >
                        {pageNum}
                      </button>
                    )
                  })}
                </div>
                <span className="text-sm text-gray-600 px-3">
                  第 {page} / {totalPages} 页
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(page + 1)}
                  disabled={page === totalPages}
                  className="px-4 py-2 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span className="flex items-center gap-1">
                    下一页
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </span>
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
