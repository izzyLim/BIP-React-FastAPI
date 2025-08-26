/**
 * 통일된 API 클라이언트
 * 모든 백엔드 API 호출을 위한 중앙화된 유틸리티
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

/**
 * API 요청을 위한 기본 설정
 */
const defaultOptions = {
  credentials: 'include',
  headers: {
    'Content-Type': 'application/json',
  },
};

/**
 * API 요청 헬퍼 함수
 */
const apiRequest = async (endpoint, options = {}) => {
  const url = `${API_BASE_URL}${endpoint}`;
  const config = {
    ...defaultOptions,
    ...options,
    headers: {
      ...defaultOptions.headers,
      ...options.headers,
    },
  };

  try {
    const response = await fetch(url, config);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    // 응답이 JSON인지 확인
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      return await response.json();
    }
    
    return response;
  } catch (error) {
    console.error(`API request failed: ${endpoint}`, error);
    throw error;
  }
};

/**
 * 인증 관련 API
 */
export const authAPI = {
  // Google OAuth 로그인 (리다이렉트)
  loginWithGoogle: () => {
    window.location.href = `${API_BASE_URL}/api/auth/google`;
  },
  
  // 현재 사용자 정보 조회
  getProfile: () => apiRequest('/api/auth/me'),
  
  // 로그아웃
  logout: () => apiRequest('/api/auth/logout', { method: 'POST' }),
  
  // 비밀번호 변경
  changePassword: (currentPassword, newPassword) => 
    apiRequest('/api/auth/change-password', {
      method: 'POST',
      body: JSON.stringify({
        current_password: currentPassword,
        new_password: newPassword,
      }),
    }),
};

/**
 * 주식 관련 API
 */
export const stocksAPI = {
  // 주식 검색
  search: (query, limit = 10) => 
    apiRequest(`/api/stocks/search?q=${encodeURIComponent(query)}&limit=${limit}`),
  
  // 특정 주식 정보 조회
  getStock: (ticker) => 
    apiRequest(`/api/stocks/${encodeURIComponent(ticker)}`),
  
  // 주식 가격 데이터 조회
  getPrices: (ticker, interval = '1d') => 
    apiRequest(`/api/stocks/${encodeURIComponent(ticker)}/prices?interval=${interval}`),
};

/**
 * 관심종목 관련 API
 */
export const watchlistAPI = {
  // 관심종목 목록 조회
  getList: () => apiRequest('/api/watchlist'),
  
  // 관심종목 추가
  add: (ticker) => 
    apiRequest('/api/watchlist', {
      method: 'POST',
      body: JSON.stringify({ ticker }),
    }),
  
  // 관심종목 제거
  remove: (ticker) => 
    apiRequest(`/api/watchlist/${encodeURIComponent(ticker)}`, {
      method: 'DELETE',
    }),
  
  // 관심종목 메모 업데이트
  updateNote: (ticker, note) =>
    apiRequest(`/api/watchlist/${encodeURIComponent(ticker)}`, {
      method: 'PATCH',
      body: JSON.stringify({ note }),
    }),
  
  // 관심종목 순서 업데이트
  updatePositions: (positions) =>
    apiRequest('/api/watchlist', {
      method: 'PATCH',
      body: JSON.stringify({ positions }),
    }),
  
  // 특정 종목이 관심종목인지 확인
  check: (ticker) => 
    apiRequest(`/api/watchlist/${encodeURIComponent(ticker)}`),
};

/**
 * 사용자 관련 API
 */
export const userAPI = {
  // 사용자 정보 업데이트
  updateProfile: (userData) => 
    apiRequest('/api/users/me', {
      method: 'PATCH',
      body: JSON.stringify(userData),
    }),
};

/**
 * LLM Tools API
 */
export const toolsAPI = {
  // 가격 데이터 조회
  getPrices: (ticker, period = '1y', interval = '1d') =>
    apiRequest(`/api/tools/prices?ticker=${ticker}&period=${period}&interval=${interval}`),
  
  // 기술적 지표 계산
  calculateIndicators: (ticker, indicators) =>
    apiRequest('/api/tools/indicators', {
      method: 'POST',
      body: JSON.stringify({ ticker, indicators }),
    }),
  
  // 매매 신호 생성
  generateSignals: (params) =>
    apiRequest('/api/tools/signals', {
      method: 'POST',
      body: JSON.stringify(params),
    }),
  
  // 백테스트 실행
  runBacktest: (params) =>
    apiRequest('/api/tools/backtest', {
      method: 'POST',
      body: JSON.stringify(params),
    }),
  
  // 고급 분석
  getAdvancedAnalysis: (params) =>
    apiRequest('/api/tools/advanced-signals', {
      method: 'POST',
      body: JSON.stringify(params),
    }),
  
  // LLM 분석
  getLLMAnalysis: (params) =>
    apiRequest('/api/tools/llm-analysis', {
      method: 'POST',
      body: JSON.stringify(params),
    }),
  
  // 스마트 분석 (Function Calling)
  getSmartAnalysis: (params) =>
    apiRequest('/api/tools/smart-analysis', {
      method: 'POST',
      body: JSON.stringify(params),
    }),
};

/**
 * 직접 API 요청이 필요한 경우를 위한 low-level 함수
 */
export const api = {
  get: (endpoint) => apiRequest(endpoint, { method: 'GET' }),
  post: (endpoint, data) => apiRequest(endpoint, { 
    method: 'POST', 
    body: JSON.stringify(data) 
  }),
  patch: (endpoint, data) => apiRequest(endpoint, { 
    method: 'PATCH', 
    body: JSON.stringify(data) 
  }),
  delete: (endpoint) => apiRequest(endpoint, { method: 'DELETE' }),
};

export default {
  auth: authAPI,
  stocks: stocksAPI,
  watchlist: watchlistAPI,
  user: userAPI,
  tools: toolsAPI,
  api,
};
