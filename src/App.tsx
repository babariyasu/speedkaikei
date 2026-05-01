import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { CartProvider } from '@/context/CartContext'
import { SettingsProvider } from '@/context/SettingsContext'
import ProtectedLayout from '@/components/ProtectedLayout'
import LoginPage from '@/pages/LoginPage'
import RegisterPage from '@/pages/RegisterPage'
import SalesPage from '@/pages/SalesPage'
import CheckoutPage from '@/pages/CheckoutPage'
import ProductsPage from '@/pages/ProductsPage'
import HistoryPage from '@/pages/HistoryPage'
import SettingsPage from '@/pages/SettingsPage'

export default function App() {
  return (
    // 税率設定はアプリ全体で共有（SettingsProvider > CartProvider の順）
    <SettingsProvider>
      <CartProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />

            {/* 認証が必要なページ（ProtectedLayout でガード） */}
            <Route element={<ProtectedLayout />}>
              <Route path="/sales" element={<SalesPage />} />
              {/* 会計画面はナビバーを非表示にするため Navigation 側で制御 */}
              <Route path="/checkout" element={<CheckoutPage />} />
              <Route path="/products" element={<ProductsPage />} />
              <Route path="/history" element={<HistoryPage />} />
              <Route path="/settings" element={<SettingsPage />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </CartProvider>
    </SettingsProvider>
  )
}
