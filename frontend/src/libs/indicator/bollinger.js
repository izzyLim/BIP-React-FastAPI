export function calcBollinger(data, period = 20, k = 2) {
  if (!Array.isArray(data) || data.length < period) return []
  const result = []
  for (let i = period - 1; i < data.length; i++) {
    const slice = data.slice(i - period + 1, i + 1)
    const closes = slice.map(d => d.close)
    const mean = closes.reduce((a, b) => a + b, 0) / period
    const variance = closes.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / period
    const std = Math.sqrt(variance)
    result.push({
      time: data[i].time,
      upper: mean + k * std,
      middle: mean,
      lower: mean - k * std,
    })
  }
  return result
}