import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { authAPI } from '../utils/api'

export default function AuthSuccess() {
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // 1. 사용자 정보 가져오기 (쿠키 기반)
    authAPI.getProfile()
      .then(data => {
        setName(data.name || data.email)
        // 2. 잠깐 환영 메시지 보여주고 메인으로
        setTimeout(() => {
          navigate('/main', { replace: true })
        }, 1500)
      })
      .catch(() => {
        navigate('/login')
      })
      .finally(() => setLoading(false))
  }, [navigate])

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
