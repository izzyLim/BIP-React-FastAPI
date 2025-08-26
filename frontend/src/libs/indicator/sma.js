/**
 * 단순 이동평균(SMA) 계산 함수
 * @param {Array<{time: number, close: number}>} data - OHLCV 데이터 배열
 * @param {number} period - 이동평균 기간
 * @returns {Array<{time: number, value: number}>}
 */
export function calcSMA(data, period) {
  const sma = []
  for (let i = period - 1; i < data.length; i++) {
    const sum = data.slice(i - period + 1, i + 1).reduce((acc, d) => acc + d.close, 0)
    sma.push({
      time: data[i].time,
      value: sum / period,
    })
  }
  return sma
}