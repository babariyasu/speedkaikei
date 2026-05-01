import { createContext, useContext, useState, ReactNode } from 'react'
import type { Product, CartItem } from '@/types/database'

type CartContextType = {
  cart: CartItem[]
  // 商品の数量をセット（0 以下でカートから削除）
  setItemQuantity: (product: Product, quantity: number) => void
  clearCart: () => void
  totalAmount: number  // 税込み合計
  totalItems: number   // 合計点数
}

const CartContext = createContext<CartContextType | null>(null)

export function CartProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>([])

  function setItemQuantity(product: Product, quantity: number) {
    if (quantity <= 0) {
      setCart(prev => prev.filter(i => i.product.id !== product.id))
    } else {
      setCart(prev => {
        const exists = prev.find(i => i.product.id === product.id)
        if (exists) {
          return prev.map(i =>
            i.product.id === product.id ? { ...i, quantity } : i
          )
        }
        return [...prev, { product, quantity }]
      })
    }
  }

  function clearCart() {
    setCart([])
  }

  const totalAmount = cart.reduce((sum, i) => sum + i.product.price * i.quantity, 0)
  const totalItems = cart.reduce((sum, i) => sum + i.quantity, 0)

  return (
    <CartContext.Provider value={{ cart, setItemQuantity, clearCart, totalAmount, totalItems }}>
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart は CartProvider の内側で使用してください')
  return ctx
}
