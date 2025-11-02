/**
 * 环境变量测试页面
 * 仅用于验证 Vercel 环境变量配置
 * 验证完成后应删除此文件
 */
export default function TestEnvPage() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  return (
    <div className="min-h-screen p-8 bg-gray-50">
      <div className="max-w-2xl mx-auto bg-white rounded-lg shadow p-6">
        <h1 className="text-2xl font-bold mb-4">环境变量测试</h1>
        
        <div className="space-y-4">
          <div>
            <h2 className="font-semibold text-gray-700 mb-2">NEXT_PUBLIC_SUPABASE_URL</h2>
            <div className="bg-gray-100 p-3 rounded">
              {supabaseUrl ? (
                <p className="text-green-600 break-all">{supabaseUrl}</p>
              ) : (
                <p className="text-red-600">❌ 未设置</p>
              )}
            </div>
          </div>

          <div>
            <h2 className="font-semibold text-gray-700 mb-2">NEXT_PUBLIC_SUPABASE_ANON_KEY</h2>
            <div className="bg-gray-100 p-3 rounded">
              {supabaseKey ? (
                <div>
                  <p className="text-green-600">✅ 已设置</p>
                  <p className="text-xs text-gray-500 mt-2 break-all">
                    {supabaseKey.substring(0, 50)}...
                  </p>
                </div>
              ) : (
                <p className="text-red-600">❌ 未设置</p>
              )}
            </div>
          </div>

          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <h3 className="font-semibold text-blue-900 mb-2">检查清单：</h3>
            <ul className="list-disc list-inside space-y-1 text-sm text-blue-800">
              <li>变量名必须以 NEXT_PUBLIC_ 开头</li>
              <li>变量名大小写完全匹配</li>
              <li>已为所有环境配置（Production, Preview, Development）</li>
              <li>配置后已重新部署项目</li>
            </ul>
          </div>

          <div className="mt-4">
            <a
              href="/"
              className="text-orange-600 hover:underline"
            >
              ← 返回首页
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}

