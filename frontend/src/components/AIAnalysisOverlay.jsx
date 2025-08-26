import { useState } from 'react'

export default function AIAnalysisOverlay({ 
  show, 
  onClose, 
  loading, 
  result, 
  error,
  ticker,
  isInChart = false
}) {
  const [isMinimized, setIsMinimized] = useState(false)
  const [isPinned, setIsPinned] = useState(false)

  if (!show) return null

  // 차트 내부 모드
  if (isInChart) {
    return (
      <div className="absolute inset-0 z-50 pointer-events-none">
        {/* 반투명 배경 - 블러 제거 */}
        <div className="absolute inset-0 bg-black/15 rounded-lg" />
        
        {/* 오버레이 패널 - 차트 내부 */}
        <div 
          className={`absolute bg-white/90 dark:bg-gray-900/90 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl pointer-events-auto transition-all duration-300 ${
            isMinimized 
              ? 'w-16 h-16 right-4 bottom-4' 
              : 'left-4 right-4 top-4 bottom-4 sm:left-4 sm:right-auto sm:w-80'
          }`}
        >
          {isMinimized ? (
            // 최소화된 상태
            <div className="w-full h-full flex items-center justify-center">
              <button
                onClick={() => setIsMinimized(false)}
                className="text-2xl hover:scale-110 transition-transform"
                title="확장"
              >
                📊
              </button>
            </div>
          ) : (
            // 확장된 상태
            <div className="h-full flex flex-col">
              {/* 헤더 */}
              <div className="flex items-center justify-between p-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50 rounded-t-lg">
                <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-sm">
                  🤖 AI 분석 - {ticker}
                </h3>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setIsPinned(!isPinned)}
                    className={`p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-800 transition ${
                      isPinned ? 'text-blue-600' : 'text-gray-500'
                    }`}
                    title={isPinned ? '고정 해제' : '고정'}
                  >
                    📌
                  </button>
                  <button
                    onClick={() => setIsMinimized(true)}
                    className="p-1.5 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition"
                    title="최소화"
                  >
                    📱
                  </button>
                  <button
                    onClick={onClose}
                    className="p-1.5 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition"
                    title="닫기"
                  >
                    ❌
                  </button>
                </div>
              </div>

              {/* 콘텐츠 영역 */}
              <div className="flex-1 overflow-y-auto p-3">
                {/* 디버그 정보 */}
                <div className="mb-2 text-xs text-gray-500">
                  로딩: {loading ? 'true' : 'false'} | 
                  결과: {result ? 'true' : 'false'} | 
                  에러: {error ? 'true' : 'false'}
                </div>
                
                {loading && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-center">
                      <div className="animate-spin text-2xl">🔄</div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="text-green-500">✅</span>
                        <span className="text-xs text-gray-600 dark:text-gray-400">
                          가격 데이터 수집 완료
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-blue-500 animate-pulse">⏳</span>
                        <span className="text-xs text-gray-600 dark:text-gray-400">
                          AI 분석 진행중...
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {error && (
                  <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-red-500">❌</span>
                      <span className="font-medium text-red-700 dark:text-red-300 text-sm">
                        분석 오류
                      </span>
                    </div>
                    <p className="text-xs text-red-600 dark:text-red-400">
                      {error}
                    </p>
                  </div>
                )}

                {result && !loading && (
                  <div className="space-y-3">
                    {/* 디버그: 원시 결과 표시 */}
                    <div className="text-xs text-gray-600 dark:text-gray-400">
                      <details>
                        <summary>디버그: 전체 결과</summary>
                        <pre className="mt-2 text-xs overflow-auto max-h-32">
                          {JSON.stringify(result, null, 2)}
                        </pre>
                      </details>
                    </div>

                    {/* 전체 점수 */}
                    {result.analysis_result?.overall_score && (
                      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg p-3">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-xl">🎯</span>
                          <span className="font-semibold text-gray-900 dark:text-gray-100 text-sm">
                            종합 점수
                          </span>
                        </div>
                        <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                          {result.analysis_result.overall_score}/100
                        </div>
                      </div>
                    )}

                    {/* 추천사항 표시 */}
                    {result.final_analysis?.recommendation && (
                      <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3">
                        <div className="font-semibold text-sm">추천: {result.final_analysis.recommendation}</div>
                        <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                          신뢰도: {result.final_analysis.confidence}%
                        </div>
                        {(result.final_analysis.llm_response || result.final_analysis.reasoning) && (
                          <div className="text-xs text-gray-600 dark:text-gray-400 mt-2 max-h-32 overflow-y-auto">
                            <div className="whitespace-pre-wrap">
                              {result.final_analysis.llm_response || result.final_analysis.reasoning}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* 주요 발견사항 */}
                    {result.final_analysis?.key_findings && (
                      <div className="space-y-2">
                        <h4 className="font-semibold text-gray-900 dark:text-gray-100 text-sm flex items-center gap-2">
                          <span>💡</span>
                          주요 발견사항
                        </h4>
                        <div className="space-y-1">
                          {result.final_analysis.key_findings.slice(0, 3).map((finding, index) => (
                            <div key={index} className="text-xs text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 rounded p-2">
                              • {finding}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* 기존 코드들... */}
                    {result.analysis_result?.insights && (
                      <div className="space-y-2">
                        <h4 className="font-semibold text-gray-900 dark:text-gray-100 text-sm flex items-center gap-2">
                          <span>💡</span>
                          주요 인사이트
                        </h4>
                        <div className="space-y-1">
                          {result.analysis_result.insights.slice(0, 3).map((insight, index) => (
                            <div key={index} className="text-xs text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 rounded p-2">
                              • {insight}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* 추천 액션 */}
                    {result.analysis_result?.recommendations && (
                      <div className="space-y-2">
                        <h4 className="font-semibold text-gray-900 dark:text-gray-100 text-sm flex items-center gap-2">
                          <span>🎯</span>
                          추천 액션
                        </h4>
                        <div className="space-y-1">
                          {result.analysis_result.recommendations.slice(0, 2).map((rec, index) => (
                            <div key={index} className="text-xs text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 rounded p-2">
                              • {rec}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    )
  }

  // 기존 전체 화면 모드 (백업용)
  return (
    <div className="fixed inset-0 z-30 pointer-events-none">
      {/* 반투명 배경 */}
      <div className="absolute inset-0 bg-black/10 backdrop-blur-[1px]" />
      
      {/* 오버레이 패널 - 왼쪽 위치 */}
      <div 
        className={`absolute bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl pointer-events-auto transition-all duration-300 ${
          isMinimized 
            ? 'w-16 h-16 left-4 bottom-4' 
            : 'left-4 sm:left-8 w-80 sm:w-96 max-w-[calc(100vw-2rem)]'
        }`}
        style={{
          top: isMinimized ? 'auto' : '140px',
          bottom: isMinimized ? '16px' : '16px',
        }}
      >
        {isMinimized ? (
          // 최소화된 상태
          <div className="w-full h-full flex items-center justify-center">
            <button
              onClick={() => setIsMinimized(false)}
              className="text-2xl hover:scale-110 transition-transform"
              title="확장"
            >
              📊
            </button>
          </div>
        ) : (
          // 확장된 상태
          <div className="h-full flex flex-col max-h-[calc(100vh-160px)]">
            {/* 헤더 */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                🤖 AI 분석 - {ticker}
              </h3>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setIsPinned(!isPinned)}
                  className={`p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-800 transition ${
                    isPinned ? 'text-blue-600' : 'text-gray-500'
                  }`}
                  title={isPinned ? '고정 해제' : '고정'}
                >
                  📌
                </button>
                <button
                  onClick={() => setIsMinimized(true)}
                  className="p-1.5 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition"
                  title="최소화"
                >
                  📱
                </button>
                <button
                  onClick={onClose}
                  className="p-1.5 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition"
                  title="닫기"
                >
                  ❌
                </button>
              </div>
            </div>

            {/* 콘텐츠 영역 */}
            <div className="flex-1 overflow-y-auto p-4">
              {loading && (
                <div className="space-y-4">
                  <div className="flex items-center justify-center">
                    <div className="animate-spin text-2xl">🔄</div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-green-500">✅</span>
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        가격 데이터 수집 완료
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-blue-500 animate-pulse">⏳</span>
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        AI 분석 진행중...
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-gray-400">⏸️</span>
                      <span className="text-sm text-gray-400">
                        결과 생성 대기중
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {error && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-red-500">❌</span>
                    <span className="font-medium text-red-700 dark:text-red-300">
                      분석 오류
                    </span>
                  </div>
                  <p className="text-sm text-red-600 dark:text-red-400">
                    {error}
                  </p>
                </div>
              )}

              {result && !loading && (
                <div className="space-y-6">
                  {/* 최종 AI 분석 결과 */}
                  {result.final_analysis && (
                    <div className="bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <span className="text-2xl">🤖</span>
                        <span className="font-semibold text-gray-900 dark:text-gray-100 text-lg">
                          AI 최종 분석
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <div className="bg-white dark:bg-gray-800 rounded-lg p-3 border">
                          <div className="text-sm text-gray-600 dark:text-gray-400">투자 추천</div>
                          <div className={`text-xl font-bold ${
                            result.final_analysis.recommendation === 'BUY' ? 'text-green-600' :
                            result.final_analysis.recommendation === 'SELL' ? 'text-red-600' :
                            'text-yellow-600'
                          }`}>
                            {result.final_analysis.recommendation}
                          </div>
                        </div>
                        
                        <div className="bg-white dark:bg-gray-800 rounded-lg p-3 border">
                          <div className="text-sm text-gray-600 dark:text-gray-400">신뢰도</div>
                          <div className="text-xl font-bold text-blue-600">
                            {result.final_analysis.confidence}%
                          </div>
                        </div>
                      </div>

                      {/* OpenAI 상세 분석 */}
                      {(result.final_analysis.llm_response || result.final_analysis.reasoning) && (
                        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border">
                          <h5 className="font-semibold mb-3 text-gray-900 dark:text-white">📊 상세 분석 리포트</h5>
                          <div className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap max-h-60 overflow-y-auto">
                            {result.final_analysis.llm_response || result.final_analysis.reasoning}
                          </div>
                        </div>
                      )}

                      {/* 주요 발견사항 */}
                      {result.final_analysis.key_findings && (
                        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border">
                          <h5 className="font-semibold mb-3 text-gray-900 dark:text-white">💡 주요 발견사항</h5>
                          <ul className="space-y-2">
                            {result.final_analysis.key_findings.map((finding, index) => (
                              <li key={index} className="flex items-start">
                                <span className="text-blue-500 mr-2 mt-1">•</span>
                                <span className="text-sm text-gray-700 dark:text-gray-300">{finding}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}

                  {/* 전체 점수 */}
                  {result.analysis_result?.overall_score && (
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-2xl">🎯</span>
                        <span className="font-semibold text-gray-900 dark:text-gray-100">
                          종합 점수
                        </span>
                      </div>
                      <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                        {result.analysis_result.overall_score}/100
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mt-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full transition-all duration-1000"
                          style={{ width: `${result.analysis_result.overall_score}%` }}
                        ></div>
                      </div>
                    </div>
                  )}

                  {/* 주요 인사이트 */}
                  {result.analysis_result?.insights && (
                    <div className="space-y-3">
                      <h4 className="font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                        <span>💡</span>
                        주요 인사이트
                      </h4>
                      <div className="space-y-2">
                        {result.analysis_result.insights.map((insight, index) => (
                          <div key={index} className="text-sm text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
                            • {insight}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 추천 액션 */}
                  {result.analysis_result?.recommendations && (
                    <div className="space-y-3">
                      <h4 className="font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                        <span>🎯</span>
                        추천 액션
                      </h4>
                      <div className="space-y-2">
                        {result.analysis_result.recommendations.map((rec, index) => (
                          <div key={index} className="text-sm text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 rounded-lg p-3">
                            • {rec}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 기술적 분석 상세 */}
                  {result.analysis_result?.technical_analysis && (
                    <div className="space-y-3">
                      <h4 className="font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                        <span>📈</span>
                        기술적 분석
                      </h4>
                      <div className="grid grid-cols-2 gap-3">
                        {Object.entries(result.analysis_result.technical_analysis).map(([key, value]) => (
                          <div key={key} className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
                            <div className="text-xs text-gray-500 dark:text-gray-400 uppercase mb-1">
                              {key.replace('_', ' ')}
                            </div>
                            <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                              {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 시장 컨텍스트 */}
                  {result.analysis_result?.market_context && (
                    <div className="space-y-3">
                      <h4 className="font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                        <span>🌍</span>
                        시장 컨텍스트
                      </h4>
                      <div className="text-sm text-gray-600 dark:text-gray-400 bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3">
                        {result.analysis_result.market_context}
                      </div>
                    </div>
                  )}

                  {/* 원시 결과 (디버깅용) */}
                  {result.raw_response && (
                    <div className="space-y-3">
                      <h4 className="font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                        <span>🔍</span>
                        상세 분석
                      </h4>
                      <div className="text-sm text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 rounded-lg p-3 max-h-40 overflow-y-auto">
                        <pre className="whitespace-pre-wrap">
                          {result.raw_response}
                        </pre>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
