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
    <nav className="bg-white/95 backdrop-blur-md border-b border-gray-200/50 sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* 左侧 Logo 和导航 */}
          <div className="flex items-center">
            <Link 
              href="/" 
              className="text-xl font-bold text-gray-900 hover:text-orange-600 transition-colors duration-200"
            >
              小说网站
            </Link>
            <div className="ml-10 flex items-baseline space-x-2">
              <Link
                href="/"
                className="text-gray-600 hover:text-blue-600 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 hover:bg-blue-50"
              >
                首页
              </Link>
            </div>
          </div>

          {/* 右侧用户菜单 */}
          <div className="flex items-center space-x-2">
            {isAuthenticated && userProfile ? (
              <>
                {/* 用户信息 */}
                <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 rounded-lg border border-gray-200">
                  <span className="text-gray-700 text-sm font-medium">
                    {userProfile.username}
                  </span>
                  <span className="px-2 py-0.5 bg-gray-100 text-gray-700 text-xs font-medium rounded">
                    {userProfile.role === 'reader' ? '读者' : userProfile.role === 'author' ? '作者' : '管理员'}
                  </span>
                </div>

                {/* 作者后台链接 */}
                {isAuthor && (
                  <Link
                    href="/author/dashboard"
                    className="text-gray-600 hover:text-orange-600 px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-200 hover:bg-orange-50"
                  >
                    作者后台
                  </Link>
                )}

                {/* 管理员后台链接 */}
                {isAdmin && (
                  <Link
                    href="/admin/dashboard"
                    className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-200 hover:bg-gray-100"
                  >
                    管理后台
                  </Link>
                )}

                {/* 个人中心链接 */}
                <Link
                  href="/reader/profile"
                  className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 hover:bg-gray-100"
                >
                  个人中心
                </Link>

                {/* 退出按钮 */}
                <button
                  onClick={handleLogout}
                  className="text-gray-600 hover:text-red-600 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 hover:bg-red-50"
                >
                  退出
                </button>
              </>
            ) : (
              <>
                {/* 登录按钮 */}
                <Link
                  href="/login"
                  className="text-gray-600 hover:text-orange-600 px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 hover:bg-orange-50"
                >
                  登录
                </Link>

                {/* 注册按钮 */}
                <Link
                  href="/register"
                  className="bg-orange-500 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-orange-600 transition-colors duration-200"
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
