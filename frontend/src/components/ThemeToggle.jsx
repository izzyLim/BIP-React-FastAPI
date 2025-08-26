import useTheme from '../hooks/useTheme'

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme()
  const iconClass = 'h-5 w-5'

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className="h-9 w-9 inline-flex items-center justify-center rounded-full border border-gray-200 bg-white text-gray-700 shadow-sm hover:bg-gray-50 active:scale-95 focus:outline-none focus:ring-0 focus:ring-grey-500 focus:ring-offset-0 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200 dark:hover:bg-gray-800 dark:focus:ring-offset-gray-900 transition"
      title={theme === 'dark' ? '라이트 모드' : '다크 모드'}
      aria-label="Toggle theme"
    >
      {theme === 'dark' ? (
        // Sun (outline)
        <svg viewBox="0 0 24 24" className={iconClass} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2" />
          <path d="M12 20v2" />
          <path d="M4.93 4.93l1.41 1.41" />
          <path d="M17.66 17.66l1.41 1.41" />
          <path d="M2 12h2" />
          <path d="M20 12h2" />
          <path d="M6.34 17.66l-1.41 1.41" />
          <path d="M19.07 4.93l-1.41 1.41" />
        </svg>
      ) : (
        // Moon (outline)
        <svg viewBox="0 0 24 24" className={iconClass} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
        </svg>
      )}
    </button>
  )
}