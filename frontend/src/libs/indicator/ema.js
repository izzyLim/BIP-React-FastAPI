/**
 * 지수이동평균(EMA) 계산 함수
 * @param {Array<{time: number, close: number}>} data
 * @param {number} period
 * @returns {Array<{time: number, value: number}>}
 */
export function calcEMA(data, period) {
  if (!Array.isArray(data) || data.length < period) return []
  const ema = []
  const k = 2 / (period + 1)
  let prev
  for (let i = 0; i < data.length; i++) {
    const { time, close } = data[i]
    if (i < period - 1) continue
    if (i === period - 1) {
      // 첫 EMA는 SMA로 시작
      const sma = data.slice(0, period).reduce((acc, d) => acc + d.close, 0) / period
      ema.push({ time, value: sma })
      prev = sma
    } else {
      const value = close * k + prev * (1 - k)
      ema.push({ time, value })
      prev = value
    }
  }
  return ema
}