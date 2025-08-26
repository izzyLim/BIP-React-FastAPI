export function calcRSI(data, period = 14) {
  if (!Array.isArray(data) || data.length < period) return []
  let rsiArr = []
  let gains = 0
  let losses = 0

  for (let i = 1; i < period; i++) {
    const diff = data[i].close - data[i - 1].close
    if (diff >= 0) gains += diff
    else losses -= diff
  }

  for (let i = period; i < data.length; i++) {
    const diff = data[i].close - data[i - 1].close
    if (diff >= 0) {
      gains = (gains * (period - 1) + diff) / period
      losses = (losses * (period - 1)) / period
    } else {
      gains = (gains * (period - 1)) / period
      losses = (losses * (period - 1) - diff) / period
    }
    const rs = losses === 0 ? 100 : gains / losses
    const rsi = 100 - 100 / (1 + rs)
    rsiArr.push({ time: data[i].time, value: rsi })
  }
  return rsiArr
}