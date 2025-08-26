// libs/indicator/macd.js
export function calcMACD(data, fast=12, slow=26, signal=9) {
  if (!Array.isArray(data) || data.length < slow + signal) return []
  const ema = (arr, period) => {
    let k = 2 / (period + 1)
    let emaArr = []
    let prev
    arr.forEach((v, i) => {
      if (i < period - 1) return
      if (i === period - 1) {
        let sma = arr.slice(0, period).reduce((a, b) => a + b, 0) / period
        emaArr.push(sma)
        prev = sma
      } else {
        let val = v * k + prev * (1 - k)
        emaArr.push(val)
        prev = val
      }
    })
    return emaArr
  }
  const closes = data.map(d => d.close)
  const fastEma = ema(closes, fast)
  const slowEma = ema(closes, slow)
  const macdLine = fastEma.slice(slow - fast).map((v, i) => v - slowEma[i])
  const signalLine = ema(macdLine, signal)
  const hist = macdLine.slice(signal - 1).map((v, i) => v - signalLine[i])
  const result = []
  for (let i = slow + signal - 2; i < data.length; i++) {
    result.push({
      time: data[i].time,
      macd: macdLine[i - slow - signal + 2],
      signal: signalLine[i - slow - signal + 2],
      hist: hist[i - slow - signal + 2],
    })
  }
  return result
}