import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import ProtectedLayout from '@/components/ProtectedLayout'
import LoginPage from '@/pages/LoginPage'
import RegisterPage from '@/pages/RegisterPage'
import MenuPage from '@/pages/MenuPage'
import AccountingPage from '@/pages/AccountingPage'
import ProductsPage from '@/pages/ProductsPage'
import HistoryPage from '@/pages/HistoryPage'
import SettingsPage from '@/pages/SettingsPage'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* ルートは自動的にログインページへリダイレクト */}
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* 認証が必要なページ（ProtectedLayout でガード） */}
        <Route element={<ProtectedLayout />}>
          <Route path="/menu" element={<MenuPage />} />
          <Route path="/accounting" element={<AccountingPage />} />
          <Route path="/products" element={<ProductsPage />} />
          <Route path="/history" element={<HistoryPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
