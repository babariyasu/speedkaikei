// データベーステーブルの型定義

export type Product = {
  id: string
  user_id: string
  name: string
  price: number      // 税込み価格
  category: string
  image_url: string | null
  stock: number
  created_at: string
}

export type AccountingRecord = {
  id: string
  user_id: string
  total_amount: number     // 税込み合計
  received_amount: number  // お預かり金額
  change_amount: number    // お釣り
  tax_rate: number         // 会計時の税率（%）
  tax_amount: number       // 消費税額（内税）
  created_at: string
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

// 販売画面のカートアイテム
export type CartItem = {
  product: Product
  quantity: number
}
