import LoadingSpinner from './LoadingSpinner'

interface LoadingPageProps {
  message?: string
}

export default function LoadingPage({ message = '加载中...' }: LoadingPageProps) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
      <LoadingSpinner size="lg" />
      <p className="mt-4 text-gray-600">{message}</p>
    </div>
  )
}

