import MainLayout from '../layouts/MainLayout'

import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { authAPI } from '../utils/api'

export default function DashboardPage() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    let isMounted = true
    setLoading(true)

    authAPI.getProfile()
      .then(data => {
        if (isMounted) setUser(data)
      })
      .catch(err => {
        // 인증 실패 시 로그인 페이지로 이동
        console.error('Auth error:', err)
        if (isMounted) {
          navigate('/login', { replace: true })
        }
      })
      .finally(() => {
        if (isMounted) setLoading(false)
      })

    return () => {
      isMounted = false
    }
  }, [navigate])

  return (
    <MainLayout showSidebar>
      <div>
        {loading ? (
          // 스켈레톤 로딩
          <div className="p-4 animate-pulse">
            <div className="h-6 w-48 rounded mb-4 bg-gray-200 dark:bg-gray-800"></div>
            <div className="h-4 w-full rounded mb-2 bg-gray-200 dark:bg-gray-800"></div>
            <div className="h-4 w-5/6 rounded bg-gray-200 dark:bg-gray-800"></div>
          </div>
        ) : user ? (
          <div className="p-4">
            <h2 className="text-xl font-semibold">환영합니다, {user.name || user.email}님!</h2>
          </div>
        ) : (
          <div className="p-4">정보를 불러올 수 없습니다.</div>
        )}
        {/* 이하 대시보드 내용 */}
      </div>
    </MainLayout>
  )
}
