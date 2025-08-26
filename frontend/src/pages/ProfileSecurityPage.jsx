import { useState } from 'react'
import MainLayout from '../layouts/MainLayout'
import { useNavigate } from 'react-router-dom'
import { authAPI } from '../utils/api'

export default function ProfileSecurityPage() {
  const [form, setForm] = useState({ current_password: '', new_password: '', confirm: '' })
  const [submitting, setSubmitting] = useState(false)
  const navigate = useNavigate()

  const onChange = (e) => {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
  }

  const onSubmit = async (e) => {
    e.preventDefault()
    if (!form.new_password || form.new_password !== form.confirm) {
      alert('새 비밀번호 확인이 일치하지 않습니다.')
      return
    }
    setSubmitting(true)
    try {
      // TODO: 백엔드 엔드포인트 확인 (예: POST /auth/change-password)
      await authAPI.changePassword(form.current_password, form.new_password)
      alert('비밀번호가 변경되었습니다.')
      navigate('/profile')
    } catch (err) {
      console.error(err)
      alert('비밀번호 변경에 실패했습니다.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <MainLayout showSidebar>
      <div className="max-w-md">
        <h1 className="mb-4 text-2xl font-semibold">보안 설정</h1>
        <section className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
          <h2 className="mb-3 text-lg font-medium">비밀번호 변경</h2>
          <form className="space-y-4" onSubmit={onSubmit}>
            <div>
              <label className="block text-sm text-gray-600 dark:text-gray-300">현재 비밀번호</label>
              <input name="current_password" type="password" value={form.current_password} onChange={onChange}
                className="mt-1 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-gray-400 focus:outline-none focus:ring-0 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100" />
            </div>
            <div>
              <label className="block text-sm text-gray-600 dark:text-gray-300">새 비밀번호</label>
              <input name="new_password" type="password" value={form.new_password} onChange={onChange}
                className="mt-1 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-gray-400 focus:outline-none focus:ring-0 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100" />
            </div>
            <div>
              <label className="block text-sm text-gray-600 dark:text-gray-300">새 비밀번호 확인</label>
              <input name="confirm" type="password" value={form.confirm} onChange={onChange}
                className="mt-1 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-gray-400 focus:outline-none focus:ring-0 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100" />
            </div>
            <div className="mt-2 flex items-center justify-end gap-2">
              <button type="button" onClick={() => navigate('/profile')}
                className="rounded-md border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800" disabled={submitting}>
                취소
              </button>
              <button type="submit"
                className="rounded-md bg-gray-900 px-4 py-2 text-sm text-white hover:bg-gray-800 active:scale-95 disabled:opacity-60 dark:bg-gray-100 dark:text-gray-900 dark:hover:bg-gray-200"
                disabled={submitting}>
                변경
              </button>
            </div>
          </form>
        </section>
      </div>
    </MainLayout>
  )
}