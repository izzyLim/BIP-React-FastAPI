/**
 * 여러 지표를 조합해 복합 매수/매도 신호를 생성합니다.
 * 각 신호가 2개 이상 동시에 발생하면 신호로 간주합니다.
 * @param {Object} params - 각 지표별 데이터 배열
 * @returns {Array} signals [{ time, type: "buy"|"sell", reason }]
 */
export function getCompositeSignals({ sma1Data, sma2Data, rsiData, bollingerData, macdData }) {
  const signals = []
  // time 기준으로 데이터 매핑
  const sma1Map = Object.fromEntries(sma1Data.map(d => [d.time, d.value]))
  const sma2Map = Object.fromEntries(sma2Data.map(d => [d.time, d.value]))
  const rsiMap = Object.fromEntries(rsiData.map(d => [d.time, d.value]))
  const bbMap = Object.fromEntries(bollingerData.map(d => [d.time, d]))
  const macdMap = Object.fromEntries(macdData.map(d => [d.time, d]))

  // 공통 time 배열 추출 (SMA1 기준)
  const allTimes = sma1Data.map(d => d.time)
  for (let i = 1; i < allTimes.length; i++) {
    const tPrev = allTimes[i - 1]
    const tCurr = allTimes[i]
    let buyCount = 0
    let sellCount = 0

    // SMA 골든/데드크로스
    if (
      sma1Map[tPrev] < sma2Map[tPrev] && sma1Map[tCurr] >= sma2Map[tCurr]
    ) buyCount++
    if (
      sma1Map[tPrev] > sma2Map[tPrev] && sma1Map[tCurr] <= sma2Map[tCurr]
    ) sellCount++

    // RSI
    if (rsiMap[tCurr] !== undefined) {
      if (rsiMap[tCurr] <= 35) buyCount++
      if (rsiMap[tCurr] >= 65) sellCount++
    }

    // MACD 골든/데드크로스
    if (
      macdMap[tPrev] && macdMap[tCurr] &&
      macdMap[tPrev].macd < macdMap[tPrev].signal &&
      macdMap[tCurr].macd >= macdMap[tCurr].signal
    ) buyCount++
    if (
      macdMap[tPrev] && macdMap[tCurr] &&
      macdMap[tPrev].macd > macdMap[tPrev].signal &&
      macdMap[tCurr].macd <= macdMap[tCurr].signal
    ) sellCount++

    // 볼린저 하단/상단 부근
    if (bbMap[tCurr] && bbMap[tCurr].close <= bbMap[tCurr].lower * 1.03) buyCount++
    if (bbMap[tCurr] && bbMap[tCurr].close >= bbMap[tCurr].upper * 0.97) sellCount++

    // 2개 이상 신호가 동시에 발생하면 신호로 간주
    if (buyCount >= 2) {
      signals.push({ time: tCurr, type: "buy", reason: `복합 매수신호(${buyCount}개)` })
    }
    if (sellCount >= 2) {
      signals.push({ time: tCurr, type: "sell", reason: `복합 매도신호(${sellCount}개)` })
    }
  }
  return signals
}