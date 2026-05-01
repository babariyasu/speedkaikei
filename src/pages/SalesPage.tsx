import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { useCart } from '@/context/CartContext'
import { useSettings } from '@/context/SettingsContext'
import type { Product } from '@/types/database'

export default function SalesPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState<string>('全て')
  const { cart, setItemQuantity, totalAmount, totalItems } = useCart()
  const { taxRate } = useSettings()
  const navigate = useNavigate()

  useEffect(() => {
    fetchProducts()
  }, [])

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

  // 商品から分類を重複なく取得
  const categories = ['全て', ...new Set(products.map(p => p.category))]

  // 選択中の分類でフィルタ
  const filtered =
    selectedCategory === '全て'
      ? products
      : products.filter(p => p.category === selectedCategory)

  // カート内の数量を取得
  function cartQty(productId: string) {
    return cart.find(i => i.product.id === productId)?.quantity ?? 0
  }

  // +/- ボタン操作（在庫数を上限とする）
  function handleDelta(product: Product, delta: number) {
    const next = Math.max(0, Math.min(cartQty(product.id) + delta, product.stock))
    setItemQuantity(product, next)
  }

  // 税込み価格から税抜き価格を逆算
  function exTaxPrice(priceInc: number): number {
    return Math.round(priceInc / (1 + taxRate / 100))
  }

  return (
    <div className="max-w-lg mx-auto">
      {/* ヘッダー + 分類タブ */}
      <div className="sticky top-0 bg-white z-10 border-b shadow-sm">
        <div className="px-4 pt-3 pb-1">
          <h1 className="text-lg font-bold">販売</h1>
        </div>
        {/* 横スクロール可能な分類タブ */}
        <div className="flex gap-2 px-4 pb-3 overflow-x-auto">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                selectedCategory === cat
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* 商品グリッド */}
      <div className="p-3 pb-36">
        {loading ? (
          <p className="text-center text-gray-400 py-16">読み込み中...</p>
        ) : filtered.length === 0 ? (
          <p className="text-center text-gray-400 py-16">この分類に商品がありません</p>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {filtered.map(product => {
              const qty = cartQty(product.id)
              const inCart = qty > 0
              return (
                <div
                  key={product.id}
                  className={`bg-white rounded-xl border-2 p-3 transition-all ${
                    inCart ? 'border-blue-400 shadow-sm' : 'border-gray-200'
                  }`}
                >
                  {/* 商品画像 */}
                  {product.image_url ? (
                    <img
                      src={product.image_url}
                      alt={product.name}
                      className="w-full h-28 object-cover rounded-lg mb-2"
                    />
                  ) : (
                    <div className="w-full h-28 bg-gray-100 rounded-lg mb-2 flex items-center justify-center text-4xl">
                      📦
                    </div>
                  )}

                  {/* 商品情報 */}
                  <p className="font-semibold text-sm leading-tight mb-0.5 line-clamp-2">
                    {product.name}
                  </p>
                  <p className="text-xs text-gray-400 mb-1">{product.category}</p>
                  <p className="text-blue-600 font-bold text-base">
                    ¥{product.price.toLocaleString()}
                    <span className="text-xs text-gray-400 font-normal ml-0.5">税込</span>
                  </p>
                  {/* 税率が設定されている場合は税抜き価格も表示 */}
                  {taxRate > 0 && (
                    <p className="text-xs text-gray-400">
                      税抜 ¥{exTaxPrice(product.price).toLocaleString()}
                    </p>
                  )}
                  <p className="text-xs text-gray-300 mb-3">在庫 {product.stock}</p>

                  {/* 数量操作ボタン */}
                  <div className="flex items-center justify-between">
                    <button
                      onClick={() => handleDelta(product, -1)}
                      disabled={qty === 0}
                      className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center text-xl font-bold text-gray-500 disabled:opacity-25 hover:bg-gray-200 active:scale-95"
                    >
                      −
                    </button>
                    <span
                      className={`text-xl font-bold w-8 text-center ${
                        inCart ? 'text-blue-600' : 'text-gray-300'
                      }`}
                    >
                      {qty}
                    </span>
                    <button
                      onClick={() => handleDelta(product, 1)}
                      disabled={qty >= product.stock}
                      className="w-9 h-9 rounded-full bg-blue-500 text-white flex items-center justify-center text-xl font-bold disabled:opacity-25 hover:bg-blue-600 active:scale-95"
                    >
                      +
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* 会計へ進むバー（カートに商品があるときのみ表示） */}
      {totalItems > 0 && (
        <div className="fixed bottom-20 left-0 right-0 max-w-lg mx-auto px-4">
          <button
            onClick={() => navigate('/checkout')}
            className="w-full bg-blue-600 text-white py-4 rounded-2xl font-bold text-base shadow-xl flex items-center justify-between px-5 hover:bg-blue-700 active:scale-[0.98] transition-transform"
          >
            <span className="bg-white text-blue-600 rounded-full min-w-[2rem] h-8 flex items-center justify-center px-2 text-sm font-bold">
              {totalItems}点
            </span>
            <span>会計へ進む</span>
            <span>¥{totalAmount.toLocaleString()}</span>
          </button>
        </div>
      )}
    </div>
  )
}
