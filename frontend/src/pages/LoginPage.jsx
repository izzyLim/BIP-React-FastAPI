import AuthLayout from '../layouts/AuthLayout'
import { authAPI } from '../utils/api'

export default function LoginPage() {
  const handleLogin = () => {
    authAPI.loginWithGoogle()
  }

  return (
    <AuthLayout>
      <div className="bg-white shadow-md rounded-lg p-8 w-full max-w-sm text-center">
        <h1 className="text-2xl font-bold mb-4">Welcome!</h1>
        <button onClick={handleLogin} className="btn btn-primary w-full">
          Login with Google
        </button>
      </div>
    </AuthLayout>
  )
}
