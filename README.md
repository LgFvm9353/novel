# 在线小说连载网站

基于 Next.js 14 + Supabase + Zustand 的在线小说连载平台。

## 项目结构

```
novel-website/
├── src/
│   ├── app/                    # Next.js App Router 页面
│   │   ├── page.tsx           # 首页
│   │   ├── login/             # 登录页面
│   │   ├── register/          # 注册页面
│   │   ├── novel/[id]/        # 小说详情页
│   │   ├── reader/            # 读者页面
│   │   ├── author/            # 作者后台
│   │   └── admin/             # 管理员后台
│   ├── components/             # 组件
│   │   ├── layout/            # 布局组件
│   │   └── ui/                # UI 基础组件
│   └── lib/                   # 工具库
│       ├── supabase/           # Supabase 客户端
│       ├── store/              # Zustand 状态管理
│       ├── types/              # TypeScript 类型定义
│       └── utils/              # 工具函数
├── .env.local                  # 环境变量（需自己创建）
└── package.json
```

## 路由列表

### 公共页面
- `/` - 首页（小说列表）
- `/login` - 登录页面
- `/register` - 注册页面
- `/novel/[id]` - 小说详情页
- `/novel/[id]/chapter/[chapterNumber]` - 章节阅读页

### 读者页面（需登录）
- `/reader/profile` - 个人中心

### 作者页面（需登录+作者权限）
- `/author/dashboard` - 作者后台首页
- `/author/novel/new` - 创建新小说
- `/author/novel/[id]/edit` - 编辑小说
- `/author/novel/[id]/chapters` - 章节管理

### 管理员页面（需登录+管理员权限）
- `/admin/dashboard` - 管理员后台
- `/admin/users` - 用户管理
- `/admin/authors` - 作者管理

## 环境配置

1. 复制 `.env.local.example` 为 `.env.local`
2. 在 Supabase Dashboard 获取以下信息：
   - `NEXT_PUBLIC_SUPABASE_URL` - Supabase 项目 URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase Anon Key

## 数据库初始化

1. 在 Supabase Dashboard 的 SQL Editor 中执行 `DATABASE_SCHEMA.sql`
2. 执行 `RLS_POLICIES.sql` 配置权限策略

## 开发

```bash
# 安装依赖（如果需要）
npm install

# 启动开发服务器
npm run dev
```

## 技术栈

- **Next.js 14** - React 框架
- **TypeScript** - 类型安全
- **Tailwind CSS** - 样式框架
- **Supabase** - 数据库和后端服务
- **Zustand** - 状态管理
