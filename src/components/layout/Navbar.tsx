'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/lib/store/authStore'
import { logoutUser } from '@/lib/supabase/auth'
import { hasAnyRole } from '@/lib/utils/permissions'

export default function Navbar() {
  const router = useRouter()
  const { user, userProfile, logout: storeLogout } = useAuthStore()
  const isAuthenticated = !!user
  const isAuthor = hasAnyRole(userProfile?.role, ['author'])  // 修复：管理员不应该看到作者后台
  const isAdmin = hasAnyRole(userProfile?.role, ['admin'])

  const handleLogout = async () => {
    await logoutUser()
    storeLogout()
    router.push('/login')
  }

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-14">
          {/* 左侧 Logo 和导航 */}
          <div className="flex items-center gap-8">
            <Link 
              href="/" 
              className="text-2xl font-bold text-orange-500 hover:text-orange-600 transition-colors"
            >
              小说网站
            </Link>
            <div className="hidden md:flex items-center gap-1">
              <Link
                href="/"
                className="px-4 py-2 text-gray-700 hover:text-orange-500 text-sm font-medium transition-colors"
              >
                首页
              </Link>
            </div>
          </div>

          {/* 右侧用户菜单 */}
          <div className="flex items-center gap-3">
            {isAuthenticated && userProfile ? (
              <>
                {/* 作者后台链接 */}
                {isAuthor && (
                  <Link
                    href="/author/dashboard"
                    className="hidden md:block px-4 py-2 text-gray-700 hover:text-orange-500 text-sm font-medium transition-colors"
                  >
                    作家中心
                  </Link>
                )}

                {/* 管理员后台链接 */}
                {isAdmin && (
                  <Link
                    href="/admin/dashboard"
                    className="hidden md:block px-4 py-2 text-gray-700 hover:text-orange-500 text-sm font-medium transition-colors"
                  >
                    管理后台
                  </Link>
                )}

                {/* 用户信息下拉区域 */}
                <div className="flex items-center gap-2 px-3 py-1.5">
                  <span className="text-gray-700 text-sm">
                    {userProfile.username}
                  </span>
                  <span className="px-2 py-0.5 bg-orange-50 text-orange-600 text-xs font-medium rounded">
                    {userProfile.role === 'reader' ? '读者' : userProfile.role === 'author' ? '作家' : '管理员'}
                  </span>
                </div>

                {/* 退出按钮 */}
                <button
                  onClick={handleLogout}
                  className="text-gray-500 hover:text-gray-700 px-3 py-2 text-sm transition-colors"
                >
                  退出
                </button>
              </>
            ) : (
              <>
                {/* 登录按钮 */}
                <Link
                  href="/login"
                  className="px-4 py-2 text-gray-700 hover:text-orange-500 text-sm font-medium transition-colors"
                >
                  登录
                </Link>

                {/* 注册按钮 */}
                <Link
                  href="/register"
                  className="bg-orange-500 text-white px-5 py-2 rounded text-sm font-medium hover:bg-orange-600 transition-colors"
                >
                  注册
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}
