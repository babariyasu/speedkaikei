import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { useCart } from '@/context/CartContext'
import { useSettings } from '@/context/SettingsContext'

// お預かり金額のクイック選択候補
const QUICK_AMOUNTS = [500, 1000, 2000, 5000, 10000]

export default function CheckoutPage() {
  const { cart, clearCart, totalAmount, totalItems } = useCart()
  const { taxRate } = useSettings()
  const navigate = useNavigate()
  const [receivedInput, setReceivedInput] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const received = Number(receivedInput) || 0
  const change = received - totalAmount

  // 税込み合計から消費税額と税抜き合計を逆算
  const taxAmount = taxRate > 0
    ? Math.round(totalAmount * taxRate / (100 + taxRate))
    : 0
  const exTaxTotal = totalAmount - taxAmount

  // 合計以上のクイック金額のみ表示
  const quickAmounts = QUICK_AMOUNTS.filter(v => v >= totalAmount)

  async function completeCheckout() {
    if (cart.length === 0 || received < totalAmount) return
    setSubmitting(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // 会計記録を作成
      const { data: record, error: recordError } = await supabase
        .from('accounting_records')
        .insert({
          user_id: user.id,
          total_amount: totalAmount,
          received_amount: received,
          change_amount: change,
          tax_rate: taxRate,
          tax_amount: taxAmount,
        })
        .select()
        .single()
      if (recordError) throw recordError

      // 会計明細を一括登録
      await supabase.from('accounting_record_items').insert(
        cart.map(item => ({
          record_id: record.id,
          product_id: item.product.id,
          product_name: item.product.name,
          price: item.product.price,
          quantity: item.quantity,
          subtotal: item.product.price * item.quantity,
        }))
      )

      // 在庫を差し引く
      for (const item of cart) {
        await supabase
          .from('products')
          .update({ stock: item.product.stock - item.quantity })
          .eq('id', item.product.id)
      }

      clearCart()
      navigate('/sales', { replace: true })
    } catch (err) {
      console.error('会計エラー:', err)
      alert('会計処理に失敗しました')
    } finally {
      setSubmitting(false)
    }
  }

  // カートが空の場合
  if (cart.length === 0) {
    return (
      <div className="max-w-lg mx-auto min-h-screen bg-gray-50 flex flex-col items-center justify-center gap-4">
        <p className="text-gray-400">カートが空です</p>
        <button
          onClick={() => navigate('/sales')}
          className="text-blue-600 font-medium"
        >
          ← 販売画面へ戻る
        </button>
      </div>
    )
  }

  return (
    <div className="max-w-lg mx-auto min-h-screen bg-gray-50 pb-8">
      {/* ヘッダー（ナビなしのフル画面） */}
      <div className="sticky top-0 bg-white border-b px-4 py-3 z-10 flex items-center gap-3">
        <button
          onClick={() => navigate(-1)}
          className="text-blue-600 font-medium flex items-center gap-1"
        >
          ← 戻る
        </button>
        <h1 className="text-lg font-bold">会計</h1>
        <span className="ml-auto text-sm text-gray-400">{totalItems}点</span>
      </div>

      <div className="p-4 space-y-4">
        {/* 注文内容 */}
        <div className="bg-white rounded-2xl border overflow-hidden">
          <div className="px-4 py-2.5 bg-gray-50 border-b">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">注文内容</p>
          </div>
          <div className="divide-y">
            {cart.map(item => (
              <div key={item.product.id} className="px-4 py-3 flex justify-between items-center">
                <div>
                  <p className="font-medium text-sm">{item.product.name}</p>
                  <p className="text-xs text-gray-400">
                    ¥{item.product.price.toLocaleString()} × {item.quantity}点
                  </p>
                </div>
                <p className="font-bold text-sm">
                  ¥{(item.product.price * item.quantity).toLocaleString()}
                </p>
              </div>
            ))}
          </div>

          {/* 金額サマリー */}
          <div className="border-t px-4 py-3 bg-gray-50 space-y-1.5">
            {taxRate > 0 && (
              <>
                <div className="flex justify-between text-sm text-gray-500">
                  <span>小計（税抜）</span>
                  <span>¥{exTaxTotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm text-gray-500">
                  <span>消費税（{taxRate}%）</span>
                  <span>¥{taxAmount.toLocaleString()}</span>
                </div>
              </>
            )}
            <div className="flex justify-between font-bold text-xl pt-1 border-t">
              <span>合計（税込）</span>
              <span className="text-blue-600">¥{totalAmount.toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* お預かり金額入力 */}
        <div className="bg-white rounded-2xl border p-4">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
            お預かり金額
          </p>
          <div className="flex items-center gap-2 mb-3">
            <input
              type="number"
              value={receivedInput}
              onChange={e => setReceivedInput(e.target.value)}
              min="0"
              className="flex-1 border-2 border-gray-200 rounded-xl px-4 py-3 text-3xl font-bold text-right focus:outline-none focus:border-blue-400"
              placeholder="0"
            />
            <span className="text-xl font-medium text-gray-500">円</span>
          </div>

          {/* クイック金額ボタン */}
          <div className="flex flex-wrap gap-2">
            {/* ぴったりボタン */}
            <button
              onClick={() => setReceivedInput(String(totalAmount))}
              className="px-3 py-1.5 bg-blue-50 text-blue-700 border border-blue-200 rounded-lg text-sm font-semibold hover:bg-blue-100"
            >
              ぴったり
            </button>
            {quickAmounts.map(v => (
              <button
                key={v}
                onClick={() => setReceivedInput(String(v))}
                className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200"
              >
                ¥{v.toLocaleString()}
              </button>
            ))}
          </div>
        </div>

        {/* お釣り表示 */}
        <div
          className={`rounded-2xl border p-4 transition-colors ${
            received > 0 && change >= 0
              ? 'bg-green-50 border-green-300'
              : 'bg-white border-gray-200'
          }`}
        >
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
            お釣り
          </p>
          {received === 0 ? (
            <p className="text-4xl font-bold text-gray-200">---</p>
          ) : change < 0 ? (
            <div>
              <p className="text-4xl font-bold text-red-400">¥0</p>
              <p className="text-red-500 text-sm mt-1">
                ¥{Math.abs(change).toLocaleString()} 不足しています
              </p>
            </div>
          ) : (
            <p className="text-5xl font-bold text-green-600">
              ¥{change.toLocaleString()}
            </p>
          )}
        </div>

        {/* 会計完了ボタン */}
        <button
          onClick={completeCheckout}
          disabled={submitting || received < totalAmount || received === 0}
          className="w-full bg-blue-600 text-white py-5 rounded-2xl font-bold text-xl disabled:opacity-30 hover:bg-blue-700 active:scale-[0.98] transition-all shadow-lg"
        >
          {submitting ? '処理中...' : '会計完了'}
        </button>
      </div>
    </div>
  )
}
