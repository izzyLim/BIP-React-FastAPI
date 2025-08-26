import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import LoginPage from './pages/LoginPage'
import DashboardPage from './pages/DashboardPage'
import AuthSuccess from './pages/AuthSuccess'
import ProfilePage from './pages/ProfilePage'
import ProfileSecurityPage from './pages/ProfileSecurityPage'
import HomePage from './pages/HomePage'
import StocksPage from './pages/StocksPage'
import AnalysisPage from './pages/AnalysisPage'
import WatchlistPage from './pages/WatchlistPage' // WatchlistPage 임포트

export default function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/main" element={<HomePage />} />  {/* 홈을 /main으로 매핑 */}
        <Route path="/marketdata/dashboard" element={<DashboardPage />} /> {/* 기존 대시보드를 마켓 데이터 섹션으로 */}
        <Route path="/marketdata/stock" element={<StocksPage />} />
        <Route path="/marketdata/analysis" element={<AnalysisPage />} />
        <Route path="/marketdata/watchlist" element={<WatchlistPage />} /> 
        {/* /marketdata 루트 접근 시 대시보드로 리다이렉트 */}
        <Route path="/marketdata" element={<Navigate to="/marketdata/dashboard" replace />} />
        <Route path="/auth/success" element={<AuthSuccess />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/profile/security" element={<ProfileSecurityPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
