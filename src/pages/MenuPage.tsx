import { Link } from 'react-router-dom'

const menuItems = [
  {
    to: '/accounting',
    label: '会計',
    description: '商品を選択して会計する',
    icon: '💰',
    color: 'bg-blue-50 border-blue-200',
    textColor: 'text-blue-700',
  },
  {
    to: '/products',
    label: '商品登録',
    description: '商品の追加・管理',
    icon: '📦',
    color: 'bg-green-50 border-green-200',
    textColor: 'text-green-700',
  },
  {
    to: '/history',
    label: '会計履歴',
    description: '過去の会計記録を確認',
    icon: '📋',
    color: 'bg-purple-50 border-purple-200',
    textColor: 'text-purple-700',
  },
  {
    to: '/settings',
    label: '設定',
    description: 'アカウント設定',
    icon: '⚙️',
    color: 'bg-gray-50 border-gray-200',
    textColor: 'text-gray-700',
  },
]

export default function MenuPage() {
  return (
    <div className="p-4 max-w-lg mx-auto">
      <div className="pt-8 pb-6">
        <h1 className="text-2xl font-bold text-gray-900">speedkaikei</h1>
        <p className="text-gray-400 text-sm mt-1">会計管理アプリ</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {menuItems.map(item => (
          <Link
            key={item.to}
            to={item.to}
            className={`border rounded-2xl p-5 flex flex-col gap-2 ${item.color} hover:shadow-md transition-shadow active:scale-95 transition-transform`}
          >
            <span className="text-3xl">{item.icon}</span>
            <div>
              <p className={`font-bold text-base ${item.textColor}`}>{item.label}</p>
              <p className="text-xs text-gray-400">{item.description}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
