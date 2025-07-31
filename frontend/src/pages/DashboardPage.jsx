import MainLayout from '../layouts/MainLayout'



import { useEffect, useState } from 'react'
import axios from 'axios'

export default function DashboardPage() {
  const [user, setUser] = useState(null)
  const token = localStorage.getItem('access_token')

  useEffect(() => {
    if (!token) return
    axios
      .get('http://localhost:8000/auth/me', {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then(res => {
        setUser(res.data)
      })
  }, [token])

  return (
    <MainLayout showSidebar>
    <div>
      {user ? (
        <div className="p-4">
          <h2 className="text-xl font-semibold">환영합니다, {user.name || user.email}님!</h2>
        </div>
      ) : (
        <div className="p-4">로딩 중...</div>
      )}
      {/* 이하 대시보드 내용 */}
    </div>
    </MainLayout>
  )
}
