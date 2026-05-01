import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { useSettings } from '@/context/SettingsContext'

export default function SettingsPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const { taxRate, saveTaxRate } = useSettings()

  const [taxRateInput, setTaxRateInput] = useState(String(taxRate))
  const [taxSaved, setTaxSaved] = useState(false)

  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  function handleSaveTaxRate() {
    const rate = Number(taxRateInput)
    if (isNaN(rate) || rate < 0 || rate > 100) return
    saveTaxRate(rate)
    setTaxSaved(true)
    setTimeout(() => setTaxSaved(false), 2000)
  }

  async function handlePasswordChange(e: React.FormEvent) {
    e.preventDefault()
    setMessage('')
    setError('')

    if (newPassword !== confirmPassword) {
      setError('パスワードが一致しません')
      return
    }
    if (newPassword.length < 6) {
      setError('パスワードは6文字以上で入力してください')
      return
    }

    setLoading(true)
    const { error } = await supabase.auth.updateUser({ password: newPassword })

    if (error) {
      setError('パスワードの変更に失敗しました')
    } else {
      setMessage('パスワードを変更しました')
      setNewPassword('')
      setConfirmPassword('')
    }
    setLoading(false)
  }

  async function handleLogout() {
    await supabase.auth.signOut()
    navigate('/login', { replace: true })
  }

  return (
    <div className="max-w-lg mx-auto">
      <div className="sticky top-0 bg-white border-b px-4 py-3 z-10">
        <h1 className="text-lg font-bold">設定</h1>
      </div>

      <div className="p-4 space-y-4">
        {/* アカウント情報 */}
        <div className="bg-white rounded-xl border p-4">
          <h2 className="text-sm font-semibold text-gray-500 mb-2">アカウント情報</h2>
          <p className="text-xs text-gray-400 mb-0.5">メールアドレス</p>
          <p className="font-medium">{user?.email}</p>
        </div>

        {/* 税率設定 */}
        <div className="bg-white rounded-xl border p-4">
          <h2 className="text-sm font-semibold text-gray-500 mb-3">税率設定</h2>
          <div className="flex items-center gap-3">
            <input
              type="number"
              value={taxRateInput}
              onChange={e => setTaxRateInput(e.target.value)}
              min="0"
              max="100"
              className="w-20 border-2 border-gray-200 rounded-xl px-3 py-2 text-center text-2xl font-bold focus:outline-none focus:border-blue-400"
            />
            <span className="text-2xl font-medium text-gray-500">%</span>
            <button
              onClick={handleSaveTaxRate}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700"
            >
              保存
            </button>
            {taxSaved && (
              <span className="text-green-600 text-sm font-medium">✓ 保存しました</span>
            )}
          </div>
          <p className="text-xs text-gray-400 mt-2 leading-relaxed">
            商品に設定した税込み価格から税抜き価格を自動計算します。<br />
            0% にすると税額の表示がなくなります。
          </p>
          {/* 現在の税率での計算例 */}
          {taxRate > 0 && (
            <div className="mt-3 bg-blue-50 rounded-lg p-3 text-sm text-blue-700">
              例）¥{(1000).toLocaleString()}（税込）→ 税抜 ¥{Math.round(1000 / (1 + taxRate / 100)).toLocaleString()}、消費税 ¥{Math.round(1000 * taxRate / (100 + taxRate)).toLocaleString()}
            </div>
          )}
        </div>

        {/* パスワード変更 */}
        <div className="bg-white rounded-xl border p-4">
          <h2 className="text-sm font-semibold text-gray-500 mb-3">パスワード変更</h2>
          <form onSubmit={handlePasswordChange} className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">新しいパスワード</label>
              <input
                type="password"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                required
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="6文字以上"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">パスワード（確認）</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                required
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="再入力"
              />
            </div>
            {error && <p className="text-red-500 text-sm">{error}</p>}
            {message && <p className="text-green-600 text-sm">{message}</p>}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-2 rounded-lg text-sm font-medium disabled:opacity-50 hover:bg-blue-700"
            >
              {loading ? '変更中...' : 'パスワードを変更'}
            </button>
          </form>
        </div>

        {/* ログアウト */}
        <button
          onClick={handleLogout}
          className="w-full bg-red-50 text-red-600 border border-red-200 py-3 rounded-xl font-medium hover:bg-red-100"
        >
          ログアウト
        </button>
      </div>
    </div>
  )
}
