export default function AuthLayout({ children }) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-base-200 p-4">
        {children}
      </div>
    )
  }