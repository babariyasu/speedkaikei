import { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { useSettings } from '@/context/SettingsContext'
import type { Product } from '@/types/database'

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { taxRate } = useSettings()

  const [form, setForm] = useState({
    name: '',
    price: '',
    selectedCategory: '',
    newCategory: '',
    stock: '',
  })
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchProducts()
  }, [])

  async function fetchProducts() {
    setLoading(true)
    const { data } = await supabase
      .from('products')
      .select('*')
      .order('category')
      .order('name')

    if (data) {
      setProducts(data)
      // 登録済み商品から分類を重複なく抽出
      const cats = [...new Set(data.map((p: Product) => p.category))].filter(Boolean)
      setCategories(cats as string[])
    }
    setLoading(false)
  }

  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setImageFile(file)
    setImagePreview(URL.createObjectURL(file))
  }

  function resetForm() {
    setForm({ name: '', price: '', selectedCategory: '', newCategory: '', stock: '' })
    setImageFile(null)
    setImagePreview(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
    setError('')
    setShowForm(false)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    // 分類は新規入力を優先、なければプルダウン選択値を使用
    const category = form.newCategory.trim() || form.selectedCategory
    if (!category) {
      setError('分類を選択または入力してください')
      return
    }

    setSubmitting(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      let imageUrl: string | null = null

      // 画像が選択されている場合は Supabase Storage にアップロード
      if (imageFile) {
        const ext = imageFile.name.split('.').pop()
        const fileName = `${user.id}/${Date.now()}.${ext}`
        const { error: uploadError } = await supabase.storage
          .from('product-images')
          .upload(fileName, imageFile)
        if (uploadError) throw uploadError

        const { data: { publicUrl } } = supabase.storage
          .from('product-images')
          .getPublicUrl(fileName)
        imageUrl = publicUrl
      }

      const { error: insertError } = await supabase.from('products').insert({
        user_id: user.id,
        name: form.name.trim(),
        price: Number(form.price),
        category,
        image_url: imageUrl,
        stock: Number(form.stock),
      })
      if (insertError) throw insertError

      resetForm()
      fetchProducts()
    } catch (err) {
      console.error('登録エラー:', err)
      setError('商品の登録に失敗しました')
    } finally {
      setSubmitting(false)
    }
  }

  async function deleteProduct(id: string) {
    if (!confirm('この商品を削除しますか？')) return
    await supabase.from('products').delete().eq('id', id)
    fetchProducts()
  }

  // 税抜き価格を逆算
  function exTaxPrice(priceInc: number): number {
    return Math.round(priceInc / (1 + taxRate / 100))
  }

  return (
    <div className="max-w-lg mx-auto">
      {/* ヘッダー */}
      <div className="sticky top-0 bg-white border-b px-4 py-3 z-10 flex justify-between items-center">
        <h1 className="text-lg font-bold">商品登録</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-blue-600 text-white px-4 py-1.5 rounded-lg text-sm font-medium"
        >
          {showForm ? 'キャンセル' : '+ 新規登録'}
        </button>
      </div>

      {/* 商品登録フォーム */}
      {showForm && (
        <div className="p-4 bg-white border-b">
          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">商品名 *</label>
              <input
                type="text"
                value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
                required
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="商品名を入力"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                価格（税込み） *
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={form.price}
                  onChange={e => setForm({ ...form, price: e.target.value })}
                  required
                  min="0"
                  className="flex-1 border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="0"
                />
                <span className="text-sm text-gray-500">円（税込）</span>
              </div>
              {/* 入力中の税抜き価格プレビュー */}
              {taxRate > 0 && form.price && (
                <p className="text-xs text-gray-400 mt-1">
                  税抜 ¥{exTaxPrice(Number(form.price)).toLocaleString()} ／ 消費税 ¥{(Number(form.price) - exTaxPrice(Number(form.price))).toLocaleString()}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">分類 *</label>
              {/* 過去に登録した分類はプルダウンで選択可能 */}
              {categories.length > 0 && (
                <select
                  value={form.selectedCategory}
                  onChange={e => setForm({ ...form, selectedCategory: e.target.value, newCategory: '' })}
                  className="w-full border rounded-lg px-3 py-2 text-sm mb-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">-- 既存の分類から選択 --</option>
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              )}
              <input
                type="text"
                value={form.newCategory}
                onChange={e => setForm({ ...form, newCategory: e.target.value, selectedCategory: '' })}
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder={categories.length > 0 ? '新しい分類を入力（任意）' : '分類名を入力'}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">在庫数 *</label>
              <input
                type="number"
                value={form.stock}
                onChange={e => setForm({ ...form, stock: e.target.value })}
                required
                min="0"
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="0"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">商品画像（任意）</label>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="w-full text-sm text-gray-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              />
              {imagePreview && (
                <img src={imagePreview} alt="プレビュー" className="mt-2 h-28 w-28 object-cover rounded-lg" />
              )}
            </div>

            {error && <p className="text-red-500 text-sm">{error}</p>}

            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-blue-600 text-white py-2.5 rounded-lg font-medium disabled:opacity-50 hover:bg-blue-700"
            >
              {submitting ? '登録中...' : '商品を登録する'}
            </button>
          </form>
        </div>
      )}

      {/* 商品一覧 */}
      <div className="p-4">
        {loading ? (
          <p className="text-center text-gray-400 py-12">読み込み中...</p>
        ) : products.length === 0 ? (
          <p className="text-center text-gray-400 py-12">商品が登録されていません</p>
        ) : (
          <div className="space-y-2">
            {products.map(product => (
              <div key={product.id} className="bg-white rounded-xl border p-3 flex gap-3">
                {product.image_url ? (
                  <img src={product.image_url} alt={product.name} className="w-16 h-16 object-cover rounded-lg flex-shrink-0" />
                ) : (
                  <div className="w-16 h-16 bg-gray-100 rounded-lg flex-shrink-0 flex items-center justify-center text-2xl">📦</div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{product.name}</p>
                  <p className="text-xs text-gray-400">{product.category}</p>
                  <p className="text-blue-600 font-bold text-sm">
                    ¥{product.price.toLocaleString()}
                    <span className="text-gray-400 font-normal text-xs ml-0.5">税込</span>
                  </p>
                  {taxRate > 0 && (
                    <p className="text-xs text-gray-400">
                      税抜 ¥{exTaxPrice(product.price).toLocaleString()}
                    </p>
                  )}
                  <p className="text-xs text-gray-500">在庫: {product.stock}</p>
                </div>
                <button
                  onClick={() => deleteProduct(product.id)}
                  className="text-red-400 hover:text-red-600 text-sm self-start flex-shrink-0"
                >
                  削除
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
