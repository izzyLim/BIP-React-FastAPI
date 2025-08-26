import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import MainLayout from '../layouts/MainLayout'
import { authAPI } from '../utils/api'

export default function HomePage() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

    useEffect(() => {
    authAPI.getProfile()
      .then(data => setUser(data))
      .catch(() => navigate('/login', { replace: true }))
  }, [navigate])

  return (
    <MainLayout showSidebar={false}>
      <div className="p-6 max-w-7xl mx-auto">
        <div className="space-y-10">
          <div className="flex items-end justify-between">
            <div>
              <h1 className="text-2xl font-semibold">
                {loading ? '로딩 중…' : `안녕하세요, ${user?.name || user?.email || '사용자'}님`}
              </h1>
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                오늘의 마켓과 내 정보를 한눈에 보세요.
              </p>
            </div>
          <div className="hidden sm:flex gap-2">
            <Link to="/marketdata/stock" className="rounded-md border px-3 py-2 text-sm hover:bg-gray-100 dark:border-gray-700 dark:hover:bg-gray-800">
              Stock
            </Link>
            <Link to="/marketdata/dashboard" className="rounded-md border px-3 py-2 text-sm hover:bg-gray-100 dark:border-gray-700 dark:hover:bg-gray-800">
              Dashboard
            </Link>
            <Link to="/marketdata/analysis" className="rounded-md border px-3 py-2 text-sm hover:bg-gray-100 dark:border-gray-700 dark:hover:bg-gray-800">
              Analysis
            </Link>
            <Link to="/marketdata/watchlist" className="rounded-md border px-3 py-2 text-sm hover:bg-gray-100 dark:border-gray-700 dark:hover:bg-gray-800">
              Watchlist
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {/* 시장 스냅샷 */}
          <section className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
            <h2 className="mb-3 text-sm font-medium text-gray-600 dark:text-gray-300">시장 스냅샷</h2>
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between"><span>KOSPI</span><span className="font-semibold">—</span></div>
              <div className="flex items-center justify-between"><span>KOSDAQ</span><span className="font-semibold">—</span></div>
              <div className="flex items-center justify-between"><span>S&P 500</span><span className="font-semibold">—</span></div>
            </div>
            <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">실데이터 연동 시 API로 교체</p>
          </section>

          {/* 관심종목 미리보기 */}
          <section className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
            <h2 className="mb-3 text-sm font-medium text-gray-600 dark:text-gray-300">관심종목</h2>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center justify-between"><span>—</span><span className="text-gray-500">—%</span></li>
              <li className="flex items-center justify-between"><span>—</span><span className="text-gray-500">—%</span></li>
              <li className="flex items-center justify-between"><span>—</span><span className="text-gray-500">—%</span></li>
            </ul>
            <Link to="/marketdata/stock" className="mt-3 inline-block text-xs text-gray-600 underline dark:text-gray-400">더보기</Link>
          </section>

          {/* 빠른 작업 */}
          <section className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
            <h2 className="mb-3 text-sm font-medium text-gray-600 dark:text-gray-300">빠른 작업</h2>
            <div className="flex flex-wrap gap-2">
              <Link to="/marketdata/stock" className="rounded-md bg-gray-900 px-3 py-1.5 text-xs text-white hover:bg-gray-800 dark:bg-gray-100 dark:text-gray-900 dark:hover:bg-gray-200">종목 찾기</Link>
              <Link to="/marketdata/analysis" className="rounded-md border px-3 py-1.5 text-xs hover:bg-gray-100 dark:border-gray-700 dark:hover:bg-gray-800">차트 분석</Link>
              <Link to="/marketdata/dashboard" className="rounded-md border px-3 py-1.5 text-xs hover:bg-gray-100 dark:border-gray-700 dark:hover:bg-gray-800">마켓 대시보드</Link>
            </div>
          </section>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {/* 최근 활동 */}
          <section className="md:col-span-2 rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
            <h2 className="mb-3 text-sm font-medium text-gray-600 dark:text-gray-300">최근 활동</h2>
            <div className="text-sm text-gray-500 dark:text-gray-400">최근 기록이 없습니다.</div>
          </section>

          {/* 뉴스 헤드라인 */}
          <section className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
            <h2 className="mb-3 text-sm font-medium text-gray-600 dark:text-gray-300">뉴스</h2>
            <ul className="space-y-2 text-sm">
              <li className="line-clamp-2 text-gray-700 dark:text-gray-200">—</li>
              <li className="line-clamp-2 text-gray-700 dark:text-gray-200">—</li>
              <li className="line-clamp-2 text-gray-700 dark:text-gray-200">—</li>
            </ul>
          </section>
        </div>
      </div>
      </div>
    </MainLayout>
  )
}