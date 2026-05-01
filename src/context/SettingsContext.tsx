import { createContext, useContext, useState, ReactNode } from 'react'

type SettingsContextType = {
  taxRate: number            // 税率（例: 10 = 10%）
  saveTaxRate: (rate: number) => void
}

const SettingsContext = createContext<SettingsContextType | null>(null)

export function SettingsProvider({ children }: { children: ReactNode }) {
  // 税率は localStorage に保存してページ再読み込み後も維持
  const [taxRate, setTaxRateState] = useState(() => {
    const stored = localStorage.getItem('speedkaikei_taxRate')
    return stored !== null ? Number(stored) : 10
  })

  function saveTaxRate(rate: number) {
    setTaxRateState(rate)
    localStorage.setItem('speedkaikei_taxRate', String(rate))
  }

  return (
    <SettingsContext.Provider value={{ taxRate, saveTaxRate }}>
      {children}
    </SettingsContext.Provider>
  )
}

export function useSettings() {
  const ctx = useContext(SettingsContext)
  if (!ctx) throw new Error('useSettings は SettingsProvider の内側で使用してください')
  return ctx
}
