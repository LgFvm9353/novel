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
    try {
    const { data, count } = await getNovels({
      page,
      pageSize,
      categoryId: filters.categoryId,
      status: filters.status as any,
      searchQuery: searchQuery || undefined,
      sortBy: filters.sortBy as any,
    })
      setNovels(data || [])
      setTotalCount(count || 0)
    } catch (error) {
      console.error('Error loading novels:', error)
      setNovels([])
      setTotalCount(0)
    } finally {
    setLoading(false)
    }
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
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* 搜索栏 */}
        <div className="mb-6">
          <form onSubmit={handleSearch} className="max-w-2xl mx-auto">
            <div className="relative flex items-center">
              <div className="relative flex-1">
                <input
                  type="text"
                  placeholder="搜索小说、作者..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-4 py-3 pl-11 pr-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-white text-gray-900 placeholder-gray-400"
                />
                <svg
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
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
              <button
                type="submit"
                className="ml-3 px-6 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors font-medium"
              >
                搜索
              </button>
            </div>
          </form>
        </div>

        {/* 筛选器 */}
        <div className="mb-6">
          <NovelFilters categories={categories} onFilterChange={handleFilterChange} />
        </div>

        {/* 小说列表 */}
        {loading ? (
          <div className="text-center py-20">
            <div className="inline-flex items-center gap-3 text-gray-500">
              <svg
                className="animate-spin h-6 w-6 text-orange-500"
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
              <span className="text-base">加载中...</span>
            </div>
          </div>
        ) : novels.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">📖</div>
            <div className="text-gray-600 text-lg font-medium mb-2">暂无小说</div>
            <p className="text-gray-400 text-sm">试试调整筛选条件或搜索其他关键词</p>
          </div>
        ) : (
          <>
            {/* 结果统计 */}
            <div className="mb-4 flex items-center justify-between">
              <p className="text-sm text-gray-600">
                共找到 <span className="font-semibold text-orange-500">{totalCount}</span> 本小说
              </p>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 mb-8">
              {novels.map((novel) => (
                <NovelCard key={novel.id} novel={novel} />
              ))}
            </div>

            {/* 分页 */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-2 mt-10">
                <button
                  onClick={() => setPage(page - 1)}
                  disabled={page === 1}
                  className="px-4 py-2 text-sm text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                    上一页
                </button>
                <div className="flex items-center gap-1">
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
                        className={`min-w-[40px] px-3 py-2 text-sm rounded transition-colors ${
                          page === pageNum
                            ? 'bg-orange-500 text-white font-medium'
                            : 'bg-white border border-gray-300 text-gray-700 hover:border-orange-400 hover:text-orange-500'
                        }`}
                      >
                        {pageNum}
                      </button>
                    )
                  })}
                </div>
                <button
                  onClick={() => setPage(page + 1)}
                  disabled={page === totalPages}
                  className="px-4 py-2 text-sm text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  下一页
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
