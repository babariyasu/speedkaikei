// データベーステーブルの型定義

export type Product = {
  id: string
  user_id: string
  name: string
  price: number
  category: string
  image_url: string | null
  stock: number
  created_at: string
}

export type AccountingRecord = {
  id: string
  user_id: string
  total_amount: number
  created_at: string
  // JOINで取得する明細データ
  accounting_record_items?: AccountingRecordItem[]
}

export type AccountingRecordItem = {
  id: string
  record_id: string
  product_id: string | null
  product_name: string
  price: number
  quantity: number
  subtotal: number
}

// 会計画面のカート内アイテム
export type CartItem = {
  product: Product
  quantity: number
}
