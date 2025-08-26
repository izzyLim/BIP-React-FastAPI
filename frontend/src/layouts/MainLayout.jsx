import { useState, useEffect } from "react"
import Header from '../components/Header'
import Footer from '../components/Footer'
import Sidebar from "../components/Sidebar"

export default function MainLayout({ children, showSidebar = true }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  // 다크모드 적용: localStorage 또는 시스템 설정 감지
  useEffect(() => {
    const userTheme = localStorage.getItem('theme')
    const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    if (userTheme === 'dark' || (!userTheme && systemDark)) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [])

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 transition-colors">
      {/* 헤더 */}
      <Header onSidebarOpen={() => setSidebarOpen(true)} />

      {/* 모바일 사이드바 오버레이 */}
      {showSidebar && sidebarOpen && (
        <div className="fixed inset-0 z-50 sm:hidden">
          <div
            className="absolute inset-0 bg-black bg-opacity-40"
            onClick={() => setSidebarOpen(false)}
          />
          <div className="absolute left-0 top-0 h-full w-[80vw] max-w-xs bg-white dark:bg-gray-900 shadow-xl p-4 z-10">
            <button
              className="absolute top-2 right-2 text-gray-500 dark:text-gray-300"
              onClick={() => setSidebarOpen(false)}
              aria-label="사이드바 닫기"
            >
              <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M6 6l12 12M6 18L18 6" />
              </svg>
            </button>
            <Sidebar />
          </div>
        </div>
      )}

      {/* PC 사이드바 */}
      {showSidebar && (
        <aside className="hidden sm:block fixed top-[56px] left-0 h-[calc(100dvh-56px)] w-55 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 z-20">
          <Sidebar />
        </aside>
      )}

      {/* 본문 */}
      <main
        className="pt-[56px] transition-all text-gray-900 dark:text-gray-100"
        style={{
          marginLeft: showSidebar && window.innerWidth >= 640 ? "14rem" : 0,
        }}
      >
        {children}
      </main>

      {/* 푸터 (필요시) */}
      {/* <Footer /> */}
    </div>
  )
}
