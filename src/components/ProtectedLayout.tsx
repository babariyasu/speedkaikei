import { useEffect } from 'react'
import { Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import Navigation from './Navigation'

// 認証が必要なページを包むレイアウトコンポーネント
// 未ログインの場合はログインページへリダイレクトする
export default function ProtectedLayout() {
  const { user, loading } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (!loading && !user) {
      navigate('/login', { replace: true })
    }
  }, [user, loading, navigate])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-400">読み込み中...</p>
      </div>
    )
  }

  if (!user) return null

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* 各ページのコンテンツ */}
      <Outlet />
      {/* 画面下部のナビゲーションバー */}
      <Navigation />
    </div>
  )
}
