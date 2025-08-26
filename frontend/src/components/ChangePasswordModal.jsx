import { useState } from 'react'
import { authAPI } from '../utils/api'

export default function ChangePasswordModal({ open, onClose, onSuccess }) {
  const [form, setForm] = useState({ current_password: '', new_password: '', confirm: '' })
  const [submitting, setSubmitting] = useState(false)

  if (!open) return null

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
      // TODO: 백엔드의 변경 엔드포인트/필드명 확인 필요 (예: POST /auth/change-password)
      await authAPI.changePassword(form.current_password, form.new_password)
      alert('비밀번호가 변경되었습니다.')
      onSuccess?.()
    } catch (err) {
      console.error(err)
      alert('비밀번호 변경에 실패했습니다.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative w-full max-w-md rounded-lg border border-gray-200 bg-white p-5 shadow-lg dark:border-gray-700 dark:bg-gray-900">
        <h3 className="mb-4 text-lg font-semibold">비밀번호 변경</h3>
        <form className="space-y-4" onSubmit={onSubmit}>
          <div>
            <label className="block text-sm text-gray-600 dark:text-gray-300">현재 비밀번호</label>
            <input
              name="current_password"
              type="password"
              value={form.current_password}
              onChange={onChange}
              className="mt-1 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-gray-400 focus:outline-none focus:ring-0 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-600 dark:text-gray-300">새 비밀번호</label>
            <input
              name="new_password"
              type="password"
              value={form.new_password}
              onChange={onChange}
              className="mt-1 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-gray-400 focus:outline-none focus:ring-0 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-600 dark:text-gray-300">새 비밀번호 확인</label>
            <input
              name="confirm"
              type="password"
              value={form.confirm}
              onChange={onChange}
              className="mt-1 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-gray-400 focus:outline-none focus:ring-0 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
            />
          </div>
          <div className="mt-2 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800"
              disabled={submitting}
            >
              취소
            </button>
            <button
              type="submit"
              className="rounded-md bg-gray-900 px-4 py-2 text-sm text-white hover:bg-gray-800 active:scale-95 disabled:opacity-60 dark:bg-gray-100 dark:text-gray-900 dark:hover:bg-gray-200"
              disabled={submitting}
            >
              변경
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}