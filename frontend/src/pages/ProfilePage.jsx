import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import MainLayout from '../layouts/MainLayout'
import { authAPI, userAPI } from '../utils/api'

export default function ProfilePage() {
  const navigate = useNavigate()

  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState({
    name: '',
    email: '',
    picture: '',
    organization: '',
    phone: '',
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || '',
    locale: navigator.language || 'ko-KR',
  })

  useEffect(() => {
    let isMounted = true
    setLoading(true)
    authAPI.getProfile()
      .then(data => {
        if (!isMounted) return
        const d = data || {}
        setForm(prev => ({
          ...prev,
          name: d.name || '',
          email: d.email || '',
          picture: d.picture || '',
          organization: d.organization || '',
          phone: d.phone || '',
          timezone: d.timezone || prev.timezone,
          locale: d.locale || prev.locale,
        }))
      })
      .catch(err => { if (err.response?.status === 401) navigate('/login', { replace: true }) })
      .finally(() => isMounted && setLoading(false))
    return () => { isMounted = false }
  }, [navigate, API_BASE_URL])

  const onChange = (e) => {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
  }

  const avatarPreview = form.picture
    || `https://ui-avatars.com/api/?name=${encodeURIComponent(form.name || form.email || 'U')}&background=0ea5e9&color=ffffff&size=160`

  const onSave = async (e) => {
    e.preventDefault()
    try {
      await userAPI.updateProfile({
        name: form.name,
        picture: form.picture,
        organization: form.organization,
        phone: form.phone,
        timezone: form.timezone,
        locale: form.locale,
      })
      alert('프로필이 저장되었습니다.')
    } catch (err) {
      console.error(err)
      alert('프로필 저장에 실패했습니다.')
    }
  }

  return (
    <MainLayout showSidebar>
      <div className="max-w-2xl space-y-6">
        <h1 className="text-2xl font-semibold">프로필</h1>

        {loading ? (
          <div className="animate-pulse space-y-4">
            <div className="h-20 w-20 rounded-full bg-gray-200 dark:bg-gray-800" />
            <div className="h-5 w-1/3 rounded bg-gray-200 dark:bg-gray-800" />
            <div className="h-10 w-full rounded bg-gray-200 dark:bg-gray-800" />
            <div className="h-10 w-full rounded bg-gray-200 dark:bg-gray-800" />
          </div>
        ) : (
          <section className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
            <div className="mb-4 flex items-center gap-4">
              <div className="h-20 w-20 overflow-hidden rounded-full border border-gray-200 bg-gray-100 dark:border-gray-700 dark:bg-gray-800">
                <img src={avatarPreview} alt="avatar" className="h-full w-full object-cover" />
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                구글 로그인 시 제공된 사진이 있다면 자동 사용됩니다. 없으면 아래 아바타 URL을 설정하세요.
              </div>
            </div>

            <form className="space-y-4" onSubmit={onSave}>
              <div>
                <label className="block text-sm text-gray-600 dark:text-gray-300">이름</label>
                <input name="name" type="text" value={form.name} onChange={onChange}
                  className="mt-1 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-gray-400 focus:outline-none focus:ring-0 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100" />
              </div>

              <div>
                <label className="block text-sm text-gray-600 dark:text-gray-300">이메일</label>
                <input name="email" type="email" value={form.email} disabled
                  className="mt-1 w-full cursor-not-allowed rounded-md border border-gray-300 bg-gray-100 px-3 py-2 text-sm text-gray-700 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300" />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-sm text-gray-600 dark:text-gray-300">조직</label>
                  <input name="organization" type="text" value={form.organization} onChange={onChange}
                    className="mt-1 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-gray-400 focus:outline-none focus:ring-0 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100" />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 dark:text-gray-300">전화번호</label>
                  <input name="phone" type="tel" value={form.phone} onChange={onChange}
                    className="mt-1 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-gray-400 focus:outline-none focus:ring-0 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100" />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-sm text-gray-600 dark:text-gray-300">시간대</label>
                  <input name="timezone" type="text" value={form.timezone} onChange={onChange}
                    className="mt-1 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-gray-400 focus:outline-none focus:ring-0 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100" />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 dark:text-gray-300">언어</label>
                  <input name="locale" type="text" value={form.locale} onChange={onChange}
                    className="mt-1 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-gray-400 focus:outline-none focus:ring-0 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100" />
                </div>
              </div>

              <div>
                <label className="block text-sm text-gray-600 dark:text-gray-300">프로필 사진 URL</label>
                <input
                  name="picture"
                  type="url"
                  value={form.picture}
                  onChange={onChange}
                  placeholder="https://example.com/avatar.png"
                  className="mt-1 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-gray-400 focus:outline-none focus:ring-0 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button type="submit"
                  className="rounded-md bg-gray-900 px-4 py-2 text-sm text-white hover:bg-gray-800 active:scale-95 dark:bg-gray-100 dark:text-gray-900 dark:hover:bg-gray-200">
                  저장
                </button>
                <button type="button" onClick={() => navigate('/profile/security')}
                  className="rounded-md border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 active:scale-95 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800">
                  비밀번호 변경
                </button>
              </div>
            </form>
          </section>
        )}
      </div>
    </MainLayout>
  )
}