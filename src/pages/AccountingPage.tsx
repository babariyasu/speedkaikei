import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import type { Product, CartItem } from '@/types/database'

export default function AccountingPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [cart, setCart] = useState<CartItem[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    fetchProducts()
  }, [])

  // 在庫がある商品のみ取得
  async function fetchProducts() {
    setLoading(true)
    const { data } = await supabase
      .from('products')
      .select('*')
      .gt('stock', 0)
      .order('category')
      .order('name')
    if (data) setProducts(data)
    setLoading(false)
  }

  // カートに商品を追加（在庫数を上限とする）
  function addToCart(product: Product) {
    const inCart = cart.find(i => i.product.id === product.id)
    if (inCart && inCart.quantity >= product.stock) return

    setCart(prev => {
      const existing = prev.find(i => i.product.id === product.id)
      if (existing) {
        return prev.map(i =>
          i.product.id === product.id ? { ...i, quantity: i.quantity + 1 } : i
        )
      }
      return [...prev, { product, quantity: 1 }]
    })
  }

  // カートから商品を1つ減らす
  function removeFromCart(productId: string) {
    setCart(prev => {
      const existing = prev.find(i => i.product.id === productId)
      if (existing && existing.quantity > 1) {
        return prev.map(i =>
          i.product.id === productId ? { ...i, quantity: i.quantity - 1 } : i
        )
      }
      return prev.filter(i => i.product.id !== productId)
    })
  }

  // カート内のこの商品の数量を取得
  function cartQty(productId: string) {
    return cart.find(i => i.product.id === productId)?.quantity ?? 0
  }

  // 合計金額
  const total = cart.reduce((sum, i) => sum + i.product.price * i.quantity, 0)

  // 会計完了処理
  async function completeCheckout() {
    if (cart.length === 0) return
    setSubmitting(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // 会計記録を作成
      const { data: record, error: recordError } = await supabase
        .from('accounting_records')
        .insert({ user_id: user.id, total_amount: total })
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

      setCart([])
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
      fetchProducts()
    } catch (err) {
      console.error('会計エラー:', err)
      alert('会計処理に失敗しました')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="max-w-lg mx-auto">
      {/* ヘッダー */}
      <div className="sticky top-0 bg-white border-b px-4 py-3 z-10">
        <h1 className="text-lg font-bold">会計</h1>
      </div>

      {success && (
        <div className="mx-4 mt-4 bg-green-50 border border-green-200 rounded-xl p-3 text-green-700 text-sm font-medium">
          ✓ 会計が完了しました
        </div>
      )}

      {/* 商品一覧 */}
      <div className="p-4 space-y-2">
        {loading ? (
          <p className="text-center text-gray-400 py-12">読み込み中...</p>
        ) : products.length === 0 ? (
          <p className="text-center text-gray-400 py-12">在庫のある商品がありません</p>
        ) : (
          products.map(product => {
            const qty = cartQty(product.id)
            return (
              <div key={product.id} className="bg-white rounded-xl border p-3 flex gap-3 items-center">
                {product.image_url ? (
                  <img
                    src={product.image_url}
                    alt={product.name}
                    className="w-16 h-16 object-cover rounded-lg flex-shrink-0"
                  />
                ) : (
                  <div className="w-16 h-16 bg-gray-100 rounded-lg flex-shrink-0 flex items-center justify-center text-2xl">
                    📦
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{product.name}</p>
                  <p className="text-xs text-gray-400">{product.category}</p>
                  <p className="text-blue-600 font-bold text-sm">¥{product.price.toLocaleString()}</p>
                  <p className="text-xs text-gray-400">在庫: {product.stock}</p>
                </div>
                {/* 数量操作ボタン */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  {qty > 0 && (
                    <>
                      <button
                        onClick={() => removeFromCart(product.id)}
                        className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-lg font-bold text-gray-600 hover:bg-gray-200"
                      >−</button>
                      <span className="w-5 text-center font-bold text-sm">{qty}</span>
                    </>
                  )}
                  <button
                    onClick={() => addToCart(product)}
                    disabled={qty >= product.stock}
                    className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center text-lg font-bold disabled:opacity-40 hover:bg-blue-600"
                  >+</button>
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* カート・会計完了ボタン（カートに商品があるときのみ表示） */}
      {cart.length > 0 && (
        <div className="fixed bottom-20 left-0 right-0 max-w-lg mx-auto px-4">
          <div className="bg-white rounded-2xl shadow-lg border p-4">
            {/* カート内容 */}
            <div className="space-y-1 mb-3 max-h-28 overflow-y-auto">
              {cart.map(item => (
                <div key={item.product.id} className="flex justify-between text-sm">
                  <span className="text-gray-700">{item.product.name} × {item.quantity}</span>
                  <span className="font-medium">¥{(item.product.price * item.quantity).toLocaleString()}</span>
                </div>
              ))}
            </div>
            <div className="border-t pt-3 flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-400">合計</p>
                <p className="text-2xl font-bold">¥{total.toLocaleString()}</p>
              </div>
              <button
                onClick={completeCheckout}
                disabled={submitting}
                className="bg-blue-600 text-white px-6 py-3 rounded-xl font-bold disabled:opacity-50 hover:bg-blue-700"
              >
                {submitting ? '処理中...' : '会計完了'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
