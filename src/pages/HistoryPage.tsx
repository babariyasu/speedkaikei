import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import type { AccountingRecord } from '@/types/database'

export default function HistoryPage() {
  const [records, setRecords] = useState<AccountingRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  useEffect(() => {
    fetchHistory()
  }, [])

  async function fetchHistory() {
    // 会計記録と明細を一括取得
    const { data } = await supabase
      .from('accounting_records')
      .select(`
        *,
        accounting_record_items (*)
      `)
      .order('created_at', { ascending: false })

    if (data) setRecords(data)
    setLoading(false)
  }

  function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <div className="max-w-lg mx-auto">
      <div className="sticky top-0 bg-white border-b px-4 py-3 z-10">
        <h1 className="text-lg font-bold">会計履歴</h1>
      </div>

      <div className="p-4">
        {loading ? (
          <p className="text-center text-gray-400 py-12">読み込み中...</p>
        ) : records.length === 0 ? (
          <p className="text-center text-gray-400 py-12">会計履歴がありません</p>
        ) : (
          <div className="space-y-2">
            {records.map(record => {
              const exTaxTotal = record.total_amount - record.tax_amount
              return (
                <div key={record.id} className="bg-white rounded-xl border overflow-hidden">
                  {/* サマリー行（タップで明細を展開） */}
                  <button
                    onClick={() =>
                      setExpandedId(expandedId === record.id ? null : record.id)
                    }
                    className="w-full p-4 flex justify-between items-center text-left"
                  >
                    <div>
                      <p className="text-xs text-gray-400">{formatDate(record.created_at)}</p>
                      <p className="font-bold text-xl">¥{record.total_amount.toLocaleString()}</p>
                    </div>
                    <span className="text-gray-400 text-sm">
                      {expandedId === record.id ? '▲' : '▼'}
                    </span>
                  </button>

                  {/* 明細（展開時のみ表示） */}
                  {expandedId === record.id && record.accounting_record_items && (
                    <div className="border-t bg-gray-50">
                      {/* 商品明細 */}
                      <div className="px-4 py-3 space-y-1.5">
                        {record.accounting_record_items.map(item => (
                          <div key={item.id} className="flex justify-between text-sm">
                            <span className="text-gray-600">
                              {item.product_name} × {item.quantity}点
                            </span>
                            <span className="font-medium">
                              ¥{item.subtotal.toLocaleString()}
                            </span>
                          </div>
                        ))}
                      </div>

                      {/* 税・合計 */}
                      <div className="border-t px-4 py-3 space-y-1">
                        {record.tax_rate > 0 && (
                          <>
                            <div className="flex justify-between text-xs text-gray-400">
                              <span>小計（税抜）</span>
                              <span>¥{exTaxTotal.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between text-xs text-gray-400">
                              <span>消費税（{record.tax_rate}%）</span>
                              <span>¥{record.tax_amount.toLocaleString()}</span>
                            </div>
                          </>
                        )}
                        <div className="flex justify-between text-sm font-bold pt-1 border-t">
                          <span>合計（税込）</span>
                          <span>¥{record.total_amount.toLocaleString()}</span>
                        </div>
                      </div>

                      {/* お預かり・お釣り */}
                      <div className="border-t px-4 py-3 space-y-1 bg-blue-50">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-500">お預かり</span>
                          <span className="font-medium">¥{record.received_amount.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-500">お釣り</span>
                          <span className="font-bold text-blue-600">¥{record.change_amount.toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
