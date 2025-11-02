// 用户角色类型
export type UserRole = 'reader' | 'admin' | 'author'

// 小说状态类型
export type NovelStatus = '连载中' | '已完结' | '已暂停'

// 作者等级类型
export type AuthorLevel = '新手' | '签约' | '白金'

// 用户信息
export interface User {
  id: string
  role: UserRole
  username: string
  created_at: string
}

// 作者信息
export interface Author {
  id: string
  user_id: string
  name: string
  bio: string | null
  level: AuthorLevel
  is_transcript: boolean
  created_at: string
}

// 分类信息
export interface Category {
  id: string
  name: string
  created_at: string
}

// 小说信息
export interface Novel {
  id: string
  title: string
  author_id: string
  category_id: string
  description: string | null
  cover_image: string | null
  status: NovelStatus
  total_chapters: number
  total_pages: number
  vote_count: number
  created_at: string
  updated_at: string
}

// 章节信息
export interface Chapter {
  id: string
  novel_id: string
  chapter_number: number
  title: string
  content: string
  word_count: number
  created_at: string
  updated_at: string
}

// 评论信息
export interface Comment {
  id: string
  novel_id: string
  user_id: string
  content: string
  created_at: string
}

// 小说状态记录
export interface NovelStatusLog {
  id: string
  novel_id: string
  user_id: string
  status_note: string
  created_at: string
}


