'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import { registerUser } from '@/lib/supabase/auth'

export default function RegisterPage() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    confirmPassword: '',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)

  // 表单验证
  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    // 用户名验证
    if (!formData.username) {
      newErrors.username = '请输入用户名'
    } else if (formData.username.length < 3) {
      newErrors.username = '用户名至少需要3个字符'
    } else if (formData.username.length > 20) {
      newErrors.username = '用户名不能超过20个字符'
    } else if (!/^[a-zA-Z0-9_\u4e00-\u9fa5]+$/.test(formData.username)) {
      newErrors.username = '用户名只能包含字母、数字、下划线和中文'
    }

    // 密码验证
    if (!formData.password) {
      newErrors.password = '请输入密码'
    } else if (formData.password.length < 6) {
      newErrors.password = '密码至少需要6个字符'
    }

    // 确认密码验证
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = '请确认密码'
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = '两次输入的密码不一致'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // 处理表单提交
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // 防止重复提交
    if (loading) {
      return
    }

    if (!validateForm()) {
      return
    }

    setLoading(true)
    setErrors({})

    try {
      const { error } = await registerUser(formData.username, formData.password)

      if (error) {
        // 处理特殊错误
        let errorMessage = error
        if (error.includes('For security purposes') || error.includes('Too Many Requests')) {
          errorMessage = '请求过于频繁，请等待 1 分钟后再试'
        } else if (error.includes('already registered') || error.includes('already exists')) {
          errorMessage = '用户名已被注册，请使用其他用户名'
        }
        
        setErrors({ submit: errorMessage })
        setLoading(false)
        return
      }

      // 注册成功，立即跳转到登录页面
      router.push('/login')
    } catch (err) {
      setErrors({ submit: '注册失败，请稍后重试' })
      setLoading(false)
    }
  }

  // 处理输入变化
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
    // 清除对应字段的错误
    if (errors[e.target.name]) {
      setErrors({
        ...errors,
        [e.target.name]: '',
      })
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-bold text-gray-900">
            注册新账号
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            已有账号？{' '}
            <Link
              href="/login"
              className="font-medium text-blue-600 hover:text-blue-500"
            >
              立即登录
            </Link>
          </p>
        </div>

        <Card className="p-8">
          <form className="space-y-6" onSubmit={handleSubmit}>
              {errors.submit && (
                <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md text-sm">
                  {errors.submit}
                </div>
              )}

              <Input
                label="用户名"
                name="username"
                type="text"
                placeholder="请输入用户名"
                value={formData.username}
                onChange={handleChange}
                error={errors.username}
                autoComplete="username"
                disabled={loading}
              />

              <Input
                label="密码"
                name="password"
                type="password"
                placeholder="请输入密码（至少6个字符）"
                value={formData.password}
                onChange={handleChange}
                error={errors.password}
                autoComplete="new-password"
                disabled={loading}
              />

              <Input
                label="确认密码"
                name="confirmPassword"
                type="password"
                placeholder="请再次输入密码"
                value={formData.confirmPassword}
                onChange={handleChange}
                error={errors.confirmPassword}
                autoComplete="new-password"
                disabled={loading}
              />

              <Button
                type="submit"
                variant="primary"
                size="lg"
                className="w-full"
                disabled={loading}
              >
                {loading ? '注册中...' : '注册'}
              </Button>
            </form>
        </Card>
      </div>
    </div>
  )
}
