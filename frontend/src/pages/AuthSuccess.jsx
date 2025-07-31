import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import axios from 'axios'

export default function AuthSuccess() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(true)
  const token = searchParams.get('token')

  useEffect(() => {
    if (!token) return navigate('/login')

    // 1. 저장
    localStorage.setItem('access_token', token)

    // 2. 사용자 정보 가져오기 (예: /me)
    axios
      .get('http://localhost:8000/auth/me', {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then(res => {
        setName(res.data.name || res.data.email)
        // 3. 잠깐 환영 메시지 보여주고 메인으로
        setTimeout(() => {
          navigate('/main', { replace: true })
        }, 1500)
      })
      .catch(() => {
        navigate('/login')
      })
      .finally(() => setLoading(false))
  }, [token, navigate])

  if (loading) return <div>로그인 중...</div>

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-2">환영합니다, {name}님!</h1>
        <p>잠시만 기다려 주세요. 곧 대시보드로 이동합니다.</p>
      </div>
    </div>
  )
}
