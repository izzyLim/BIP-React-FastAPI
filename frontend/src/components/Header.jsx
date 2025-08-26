import ThemeToggle from './ThemeToggle'
import { useEffect, useRef, useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { authAPI } from '../utils/api'

export default function Header({ onSidebarOpen }) {
  const [open, setOpen] = useState(false)
  const [user, setUser] = useState(null)
  const mobileMenuRef = useRef(null)
  const pcMenuRef = useRef(null)
  const navigate = useNavigate()

  const logout = () => {
    authAPI.logout()
      .finally(() => {
        navigate('/login', { replace: true })
      })
  }

  useEffect(() => {
    const onClickOutside = (e) => {
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [])

  useEffect(() => {
    let isMounted = true
    authAPI.getProfile()
      .then(user => { if (isMounted) setUser(user) })
      .catch(() => {})
    return () => { isMounted = false }
  }, [])

  const getAvatarUrl = (u) => {
    const name = u?.name || ''
    const email = u?.email || ''
    if (u?.picture) return u.picture
    const label = name || email || 'U'
    const bg = '0ea5e9'
    const color = 'ffffff'
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(label)}&background=${bg}&color=${color}&size=160`
  }

  const avatarUrl = getAvatarUrl(user)

  return (
    <header className="w-full border-b border-gray-200 bg-white/80 backdrop-blur dark:border-gray-800 dark:bg-gray-900/80 fixed top-0 left-0 z-40">
      <div className="mx-auto flex max-w-7xl items-center gap-2 px-2 sm:px-4 py-2 sm:py-3 min-h-[56px]">
        {/* 모바일: 햄버거 메뉴 */}
        <button
          className="sm:hidden flex items-center justify-center h-10 w-10 rounded-md border border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 mr-2 text-gray-900 dark:text-gray-100"
          onClick={onSidebarOpen}
          aria-label="사이드바 열기"
        >
          <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="4" y="6" width="16" height="2" rx="1" fill="currentColor" />
            <rect x="4" y="12" width="16" height="2" rx="1" fill="currentColor" />
            <rect x="4" y="18" width="16" height="2" rx="1" fill="currentColor" />
          </svg>
        </button>

        {/* 좌측: 로고/타이틀 */}
        <span className="font-semibold text-xl text-gray-900 dark:text-gray-100">BIP</span>

        {/* 글로벌 내비게이션 */}
        <nav className="hidden sm:flex items-center gap-4 text-sm ml-6">
          <NavLink
            to="/main"
            className={({ isActive }) =>
              `px-2 py-1 rounded ${isActive ? 'text-gray-900 dark:text-gray-100 font-medium' : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200'}`
            }
          >
            Home
          </NavLink>
          <NavLink
            to="/marketdata/dashboard"
            className={({ isActive }) =>
              `px-2 py-1 rounded ${location.pathname.startsWith('/marketdata') || isActive ? 'text-gray-900 dark:text-gray-100 font-medium' : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200'}`
            }
            onClick={(e) => {
              e.preventDefault()
              navigate('/marketdata/dashboard')
            }}
          >
            Market Data
          </NavLink>
        </nav>

        {/* 모바일 내비게이션: 드롭다운 */}
        <div className="sm:hidden flex-1 flex justify-end">
          <div ref={mobileMenuRef} className="relative flex items-center gap-2">
            {/* 프로필 아바타 버튼 */}
            <button
              type="button"
              onClick={() => setOpen(v => !v)}
              onKeyDown={(e) => e.key === 'Escape' && setOpen(false)}
              className="relative h-9 w-9 overflow-hidden rounded-full border border-gray-200 bg-gray-100 text-gray-700 hover:opacity-90 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
              aria-haspopup="menu"
              aria-expanded={open}
              aria-label="User menu"
            >
              {avatarUrl ? (
                <img src={avatarUrl} alt="avatar" className="h-full w-full object-cover" />
              ) : (
                <span className="flex h-full w-full items-center justify-center text-sm font-semibold">
                  {(user?.name || user?.email || 'U').charAt(0).toUpperCase()}
                </span>
              )}
            </button>

            {/* 드롭다운 메뉴 */}
            {open && (
              <div className="absolute right-0 top-12 z-50 w-44 rounded-md border border-gray-200 bg-white p-1.5 text-sm shadow-lg dark:border-gray-700 dark:bg-gray-900">
                <button
                  type="button"
                  tabIndex={0}
                  onClick={() => { setOpen(false); navigate('/profile') }}
                  className="flex w-full items-center gap-2 rounded px-2 py-2 text-left text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-800"
                >
                  프로필
                </button>
                <button
                  type="button"
                  tabIndex={0}
                  onClick={logout}
                  className="flex w-full items-center gap-2 rounded px-2 py-2 text-left text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/30"
                >
                  로그아웃
                </button>
                <button
                  type="button"
                  tabIndex={0}
                  onClick={() => {
                    navigate('/main')
                    setOpen(false)
                  }}
                  className="block w-full text-left px-2 py-2 rounded text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  Home
                </button>
                <button
                  type="button"
                  tabIndex={0}
                  onClick={() => {
                    navigate('/marketdata/dashboard')
                    setOpen(false)
                  }}
                  className="block w-full text-left px-2 py-2 rounded text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  Market Data
                </button>
              </div>
            )}

            {/* 테마 토글 */}
            <ThemeToggle />
          </div>
        </div>

        {/* PC: 우측 프로필/테마 */}
        <div ref={pcMenuRef} className="hidden sm:flex ml-auto relative items-center gap-2">
          <button
            type="button"
            onClick={() => setOpen(v => !v)}
            onKeyDown={(e) => e.key === 'Escape' && setOpen(false)}
            className="relative h-9 w-9 overflow-hidden rounded-full border border-gray-200 bg-gray-100 text-gray-700 hover:opacity-90 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
            aria-haspopup="menu"
            aria-expanded={open}
            aria-label="User menu"
          >
            {avatarUrl ? (
              <img src={avatarUrl} alt="avatar" className="h-full w-full object-cover" />
            ) : (
              <span className="flex h-full w-full items-center justify-center text-sm font-semibold">
                {(user?.name || user?.email || 'U').charAt(0).toUpperCase()}
              </span>
            )}
          </button>
          {open && (
            <div className="absolute right-0 top-12 z-50 w-44 rounded-md border border-gray-200 bg-white p-1.5 text-sm shadow-lg dark:border-gray-700 dark:bg-gray-900">
              <button
                type="button"
                onClick={() => { setOpen(false); navigate('/profile') }}
                className="flex w-full items-center gap-2 rounded px-2 py-2 text-left text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-800"
              >
                프로필
              </button>
              <button
                type="button"
                onClick={logout}
                className="flex w-full items-center gap-2 rounded px-2 py-2 text-left text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/30"
              >
                로그아웃
              </button>
            </div>
          )}
          <ThemeToggle />
        </div>
      </div>
    </header>
  )
}
