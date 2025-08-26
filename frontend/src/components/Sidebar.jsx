import { NavLink, useLocation } from 'react-router-dom'

export default function Sidebar() {
  const location = useLocation()
  const inMarket = location.pathname.startsWith('/marketdata')

  if (!inMarket) {
    // 다른 섹션 사이드바가 필요하면 이곳에 추가
    return null
  }

  const itemBase =
    'block rounded-md px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-800'
  const itemActive =
    'block rounded-md px-3 py-2 text-sm bg-gray-900 text-white dark:bg-gray-100 dark:text-gray-900'

  return (
    <aside className="w-56 shrink-0 border-gray-200 bg-white p-3 dark:border-gray-800 dark:bg-gray-900">
      <div className="mb-2 px-2 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
        Market Data
      </div>
      <nav className="space-y-1">
        <NavLink
          to="/marketdata/stock"
          className={({ isActive }) => (isActive ? itemActive : itemBase)}
        >
          Stock
        </NavLink>
        <NavLink
          to="/marketdata/dashboard"
          className={({ isActive }) => (isActive ? itemActive : itemBase)}
        >
          Dashboard
        </NavLink>
        <NavLink
          to="/marketdata/analysis"
          className={({ isActive }) => (isActive ? itemActive : itemBase)}
        >
          Analysis
        </NavLink>
        <NavLink
          to="/marketdata/watchlist"
          className={({ isActive }) => (isActive ? itemActive : itemBase)}
        >
          Watchlist
        </NavLink>
      </nav>
    </aside>
  )
}
