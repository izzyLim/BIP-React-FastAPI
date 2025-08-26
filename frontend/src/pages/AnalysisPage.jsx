import { useEffect, useState, useRef } from "react"
import MainLayout from "../layouts/MainLayout"
import { createChart } from "lightweight-charts"
import { ChromePicker } from "react-color"
import { calcSMA } from "../libs/indicator/sma"
import { calcEMA } from "../libs/indicator/ema"
import { calcRSI } from "../libs/indicator/rsi"
import IndicatorSettingsModal from "../components/IndicatorSettingsModal"
import AIAnalysisOverlay from "../components/AIAnalysisOverlay"
import { calcBollinger } from "../libs/indicator/bollinger"
import { calcMACD } from "../libs/indicator/macd"
import { getCompositeSignals } from "../libs/strategy/compositeSignals"
import { watchlistAPI, stocksAPI, toolsAPI } from "../utils/api"

export default function AnalysisPage() {
  const [watchlist, setWatchlist] = useState([])
  const [selected, setSelected] = useState("")
  const [ohlcv, setOhlcv] = useState([])
  const [error, setError] = useState("")
  
  // AI 분석 관련 상태
  const [showAIAnalysis, setShowAIAnalysis] = useState(false)
  const [aiAnalysisLoading, setAiAnalysisLoading] = useState(false)
  const [aiAnalysisResult, setAiAnalysisResult] = useState(null)
  const [aiAnalysisError, setAiAnalysisError] = useState("")
  const [showSMA1, setShowSMA1] = useState(true)
  const [showSMA2, setShowSMA2] = useState(true)
  const [showEMA1, setShowEMA1] = useState(true)
  const [showEMA2, setShowEMA2] = useState(true)
  const [showEMA3, setShowEMA3] = useState(true)
  const [showRSI, setShowRSI] = useState(true)
  const [showBollinger, setShowBollinger] = useState(true)
  const [showMACD, setShowMACD] = useState(true)
  const [sma1Period, setSma1Period] = useState(50)
  const [sma2Period, setSma2Period] = useState(200)
  const [ema1Period, setEma1Period] = useState(20)
  const [ema2Period, setEma2Period] = useState(50)
  const [ema3Period, setEma3Period] = useState(100)
  const [rsiPeriod, setRsiPeriod] = useState(14)
  const [bollingerPeriod, setBollingerPeriod] = useState(20)
  const [bollingerK, setBollingerK] = useState(2)
  const [macdFast, setMacdFast] = useState(12)
  const [macdSlow, setMacdSlow] = useState(26)
  const [macdSignal, setMacdSignal] = useState(9)
  const [sma1Color, setSma1Color] = useState("#f59e42")
  const [sma2Color, setSma2Color] = useState("#3b82f6")
  const [ema1Color, setEma1Color] = useState("#10b981")
  const [ema2Color, setEma2Color] = useState("#f43f5e")
  const [ema3Color, setEma3Color] = useState("#6366f1")
  const [rsiColor, setRsiColor] = useState("#fbbf24")
  const [bollingerColor, setBollingerColor] = useState("#60a5fa")
  const [macdColor, setMacdColor] = useState("#0ea5e9")
  const [macdSignalColor, setMacdSignalColor] = useState("#f43f5e")
  const [macdHistColor, setMacdHistColor] = useState("#a3e635")
  const [showIndicatorModal, setShowIndicatorModal] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const indicatorBtnRef = useRef(null)
  
  const chartRef = useRef()
  const chartObj = useRef(null)
  const sma1SeriesRef = useRef(null)
  const sma2SeriesRef = useRef(null)
  const ema1SeriesRef = useRef(null)
  const ema2SeriesRef = useRef(null)
  const ema3SeriesRef = useRef(null)
  const rsiSeriesRef = useRef(null)
  const bollingerSeriesRef = useRef(null)
  const macdLineSeriesRef = useRef(null)
  const macdSignalSeriesRef = useRef(null)
  const macdHistSeriesRef = useRef(null)

  // 관심종목 목록 불러오기
  useEffect(() => {
    watchlistAPI.getList()
      .then(data => {
        if (Array.isArray(data)) {
          setWatchlist(data)
          if (data.length > 0) setSelected(data[0].ticker)
        } else {
          setWatchlist([])
        }
      })
      .catch(() => setWatchlist([]))
  }, [])

  // 1일봉 데이터 불러오기
  useEffect(() => {
    if (!selected) return
    setError("")
    stocksAPI.getPrices(selected, "1d")
      .then(data => {
        if (Array.isArray(data)) setOhlcv(data)
        else setOhlcv([])
      })
      .catch(e => {
        setOhlcv([])
        setError(e.message)
      })
  }, [selected])

  // AI 분석 함수
  const handleAIAnalysis = async (analysisType = 'smart-analysis') => {
    if (!selected) {
      setAiAnalysisError("종목을 먼저 선택해주세요.")
      return
    }

    console.log('AI 분석 시작:', { analysisType, selected })
    setAiAnalysisLoading(true)
    setAiAnalysisError("")
    setShowAIAnalysis(true)

    try {
      const params = {
        query: `${selected} 주식을 분석해줘`,
        ticker: selected,
        llm_provider: 'openai'
      }

      console.log('API 호출 파라미터:', params)

      let result
      switch(analysisType) {
        case 'smart-analysis':
          result = await toolsAPI.getSmartAnalysis(params)
          break
        case 'llm-analysis':
          result = await toolsAPI.getLLMAnalysis(params)
          break
        case 'advanced-signals':
          result = await toolsAPI.getAdvancedAnalysis(params)
          break
        default:
          result = await toolsAPI.getSmartAnalysis(params)
      }

      console.log('API 응답 결과:', result)
      setAiAnalysisResult(result)
    } catch (error) {
      console.error('API 호출 에러:', error)
      setAiAnalysisError(error.message || "분석 중 오류가 발생했습니다.")
    } finally {
      setAiAnalysisLoading(false)
    }
  }

  // 다크모드 상태 감지
  const [isDark, setIsDark] = useState(() =>
    document.documentElement.classList.contains("dark")
  )
  useEffect(() => {
    const observer = new MutationObserver(() => {
      setIsDark(document.documentElement.classList.contains("dark"))
    })
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] })
    return () => observer.disconnect()
  }, [])

  // 차트 생성 및 데이터 세팅
  useEffect(() => {
    if (!chartRef.current || !Array.isArray(ohlcv) || ohlcv.length === 0) return

    // 기존 차트 제거
    if (chartObj.current) {
      chartObj.current.remove()
      chartObj.current = null
    }

    // 다크모드 옵션 적용
    const chart = createChart(chartRef.current, {
      width: chartRef.current.offsetWidth,
      height: chartRef.current.offsetHeight,
      layout: {
        background: { color: isDark ? "#0f172a" : "#ffffff" },
        textColor: isDark ? "#e2e8f0" : "#334155",
      },
      grid: {
        vertLines: { color: isDark ? "#1e293b" : "#f1f5f9" },
        horzLines: { color: isDark ? "#1e293b" : "#f1f5f9" },
      },
      rightPriceScale: { borderColor: isDark ? "#334155" : "#94a3b8" },
      timeScale: { 
        borderColor: isDark ? "#334155" : "#94a3b8",
        timeVisible: true,
        secondsVisible: true,
        tickMarkFormatter: (time) => {
          const candle = ohlcv.find(d => {
            const t = Date.parse(d.timestamp)
            return Math.floor(t / 1000) === (typeof time === "number" ? time : time.timestamp)
          })
          if (candle && candle.timestamp_ny) {
            return candle.timestamp_ny.slice(0, 10)
          }
          const d = new Date((typeof time === "number" ? time : time.timestamp) * 1000)
          return d.toISOString().slice(0, 10)
        }
      },
    })

    chart.applyOptions({
      localization: {
        dateFormat: 'yyyy-MM-dd',
      }
    })

    // 캔들 차트
    const candleSeries = chart.addCandlestickSeries({
      upColor: "#16a34a",
      downColor: "#dc2626",
      borderUpColor: "#16a34a",
      borderDownColor: "#dc2626",
      wickUpColor: "#16a34a",
      wickDownColor: "#dc2626",
      priceScaleId: "right",
    })
    // 캔들(가격) 시리즈: 위 70%
    candleSeries.priceScale().applyOptions({
      scaleMargins: { top: 0, bottom: 0.4 }, // 아래 30%는 RSI+볼륨
      minValue: 0,
    })

    // RSI 시리즈: 중간 20% (별도 priceScaleId 사용)
    const rsiPriceScaleId = "rsi"
    const rsiSeries = chart.addLineSeries({
      color: rsiColor,
      lineWidth: 1,
      priceScaleId: rsiPriceScaleId,
      overlay: false, // 반드시 false!
    })
    chart.priceScale(rsiPriceScaleId).applyOptions({
      scaleMargins: { top: 0.6, bottom: 0.3 },
      // autoScale: true, // 기본값이 true이므로 생략 가능
      // minValue: 0,
      // maxValue: 100,
    })

    // 거래량 차트
    const volumeSeries = chart.addHistogramSeries({
      color: "#8884d8",
      priceFormat: { type: "volume" },
      priceScaleId: "",
      overlay: false,
    })
    // 볼륨 시리즈: 아래 10%
    volumeSeries.priceScale().applyOptions({
      scaleMargins: { top: 0.93, bottom: 0 },
    })

    // 데이터 변환
    const candleData = ohlcv
      .map(d => {
        let time
        if (d.timestamp) {
          const t = Date.parse(d.timestamp)
          time = isNaN(t) ? undefined : Math.floor(t / 1000)
        }
        return time !== undefined && d.open !== undefined
          ? {
              time,
              open: d.open,
              high: d.high,
              low: d.low,
              close: d.close,
              timestamp_ny: d.timestamp_ny,
            }
          : null
      })
      .filter(Boolean)
      .sort((a, b) => a.time - b.time)

    const volumeData = ohlcv
      .map(d => {
        let time
        if (d.timestamp) {
          const t = Date.parse(d.timestamp)
          time = isNaN(t) ? undefined : Math.floor(t / 1000)
        }
        return time !== undefined && d.volume !== undefined
          ? {
              time,
              value: d.volume,
              color: d.close > d.open ? "#26a69a" : "#ef5350",
            }
          : null
      })
      .filter(Boolean)
      .sort((a, b) => a.time - b.time)

    // SMA 데이터 계산
    const sma1Data = calcSMA(candleData, sma1Period).sort((a, b) => a.time - b.time)
    const sma2Data = calcSMA(candleData, sma2Period).sort((a, b) => a.time - b.time)

    // EMA 데이터 계산
    const ema1Data = calcEMA(candleData, ema1Period).sort((a, b) => a.time - b.time)
    const ema2Data = calcEMA(candleData, ema2Period).sort((a, b) => a.time - b.time)
    const ema3Data = calcEMA(candleData, ema3Period).sort((a, b) => a.time - b.time)

    // RSI 데이터 계산
    const rsiData = calcRSI(candleData, rsiPeriod).sort((a, b) => a.time - b.time)

    // Bollinger Bands 데이터 계산
    const bollingerData = calcBollinger(candleData, bollingerPeriod, bollingerK)

    // MACD 데이터 계산
    const macdData = calcMACD(candleData, macdFast, macdSlow, macdSignal)

    // SMA 시리즈 추가 (색상 state 사용)
    const sma1Series = chart.addLineSeries({
      color: sma1Color,
      lineWidth: 1,
      priceScaleId: "right",
      overlay: true,
    })
    const sma2Series = chart.addLineSeries({
      color: sma2Color,
      lineWidth: 1,
      priceScaleId: "right",
      overlay: true,
    })
    const ema1Series = chart.addLineSeries({
      color: ema1Color,
      lineWidth: 1,
      priceScaleId: "right",
      overlay: true,
    })
    const ema2Series = chart.addLineSeries({
      color: ema2Color,
      lineWidth: 1,
      priceScaleId: "right",
      overlay: true,
    })
    const ema3Series = chart.addLineSeries({
      color: ema3Color,
      lineWidth: 1,
      priceScaleId: "right",
      overlay: true,
    })
    let bollingerSeries
    if (showBollinger) {
      // 상단 밴드
      const bbUpperSeries = chart.addLineSeries({
        color: bollingerColor,
        lineWidth: 1,
        priceScaleId: "right",
        overlay: true,
      })
      bbUpperSeries.setData(bollingerData.map(d => ({ time: d.time, value: d.upper }))) 

      // 하단 밴드
      const bbLowerSeries = chart.addLineSeries({
        color: bollingerColor,
        lineWidth: 1,
        priceScaleId: "right",
        overlay: true,
        lineStyle: 2,
      })
      bbLowerSeries.setData(bollingerData.map(d => ({ time: d.time, value: d.lower })))

      // 중간선 (SMA)
      const bbMiddleSeries = chart.addLineSeries({
        color: bollingerColor,
        lineWidth: 1,
        priceScaleId: "right",
        overlay: true,
        lineStyle: 0,
      })
      bbMiddleSeries.setData(bollingerData.map(d => ({ time: d.time, value: d.middle })))
    }

    // MACD 별도 priceScaleId로 하단에 표시
    let macdLineSeries, macdSignalSeries, macdHistSeries
    if (showMACD) {
      const macdPriceScaleId = "macd"
      macdLineSeries = chart.addLineSeries({
        color: macdColor,
        lineWidth: 1,
        priceScaleId: macdPriceScaleId,
        overlay: false,
      })
      macdSignalSeries = chart.addLineSeries({
        color: macdSignalColor,
        lineWidth: 1,
        priceScaleId: macdPriceScaleId,
        overlay: false,
      })
      macdHistSeries = chart.addHistogramSeries({
        color: macdHistColor,
        priceScaleId: macdPriceScaleId,
        overlay: false,
      })
      chart.priceScale(macdPriceScaleId).applyOptions({
        scaleMargins: { top: 0.7, bottom: 0.091 }, // RSI/볼륨 아래에 위치
      })
    }

    // 데이터 세팅
    candleSeries.setData(candleData)
    volumeSeries.setData(volumeData)
    sma1Series.setData(showSMA1 ? sma1Data : [])
    sma2Series.setData(showSMA2 ? sma2Data : [])
    ema1Series.setData(showEMA1 ? ema1Data : [])
    ema2Series.setData(showEMA2 ? ema2Data : [])
    ema3Series.setData(showEMA3 ? ema3Data : [])
    rsiSeries.setData(showRSI ? rsiData : [])
    if (showBollinger) {
      // 상단 밴드
      const bbUpperSeries = chart.addLineSeries({
        color: bollingerColor,
        lineWidth: 1,
        priceScaleId: "right",
        overlay: true,
      })
      bbUpperSeries.setData(bollingerData.map(d => ({ time: d.time, value: d.upper }))) 

      // 하단 밴드
      const bbLowerSeries = chart.addLineSeries({
        color: bollingerColor,
        lineWidth: 1,
        priceScaleId: "right",
        overlay: true,
        lineStyle: 2,
      })
      bbLowerSeries.setData(bollingerData.map(d => ({ time: d.time, value: d.lower })))

      // 중간선 (SMA)
      const bbMiddleSeries = chart.addLineSeries({
        color: bollingerColor,
        lineWidth: 1,
        priceScaleId: "right",
        overlay: true,
        lineStyle: 0,
      })
      bbMiddleSeries.setData(bollingerData.map(d => ({ time: d.time, value: d.middle })))
    }
    if (showMACD) {
      macdLineSeries.setData(macdData.map(d => ({ time: d.time, value: d.macd })))
      macdSignalSeries.setData(macdData.map(d => ({ time: d.time, value: d.signal })))
      macdHistSeries.setData(macdData.map(d => ({
        time: d.time,
        value: d.hist,
        color: d.hist >= 0 ? "#0ea5e9" : "#f43f5e",
      })))
    }

    // === 마커 생성 및 적용 ===
    const candleTimes = candleData.map(c => c.time)
    const smaCrossMarkers = getSmaCrossMarkers(sma1Data, sma2Data, candleTimes)
    const compositeSignals = getCompositeSignals({
      sma1Data,
      sma2Data,
      rsiData,
      bollingerData,
      macdData,
    })
    const compositeMarkers = compositeSignals.map(sig => ({
      time: sig.time,
      position: sig.type === "buy" ? "belowBar" : "aboveBar",
      color: sig.type === "buy" ? "#22c55e" : "#ef4444",
      shape: sig.type === "buy" ? "arrowUp" : "arrowDown",
      text: sig.reason,
    }))
    const allMarkers = [...smaCrossMarkers, ...compositeMarkers].sort((a, b) => a.time - b.time)
    candleSeries.setMarkers(allMarkers)

    // === 과매수/과매도 기준선 추가 ===
    const overboughtLine = rsiSeries.createPriceLine({
      price: 70,
      color: "#ef4444", // 빨간색
      lineWidth: 1,
      lineStyle: 2, // dashed
      axisLabelVisible: true,
      title: "과매수",
    })
    const oversoldLine = rsiSeries.createPriceLine({
      price: 30,
      color: "#3b82f6", // 파란색
      lineWidth: 1,
      lineStyle: 2, // dashed
      axisLabelVisible: true,
      title: "과매도",
    })
    // ============================

    // 차트 객체 및 시리즈 참조 저장
    chartObj.current = chart
    sma1SeriesRef.current = sma1Series
    sma2SeriesRef.current = sma2Series
    ema1SeriesRef.current = ema1Series
    ema2SeriesRef.current = ema2Series
    ema3SeriesRef.current = ema3Series
    rsiSeriesRef.current = rsiSeries
    bollingerSeriesRef.current = bollingerSeries
    macdLineSeriesRef.current = macdLineSeries
    macdSignalSeriesRef.current = macdSignalSeries
    macdHistSeriesRef.current = macdHistSeries

    // 항상 fitContent 호출! (이 부분을 visibleRange보다 먼저 호출)
    chart.timeScale().fitContent()

    // 1년치만 보이도록 visibleRange 설정 (setData, fitContent 이후에!)
    if (candleData.length > 0) {
      const last = candleData[candleData.length - 1].time
      // 1년(365일) 전 타임스탬프 계산 (초 단위)
      const oneYearAgo = last - (60 * 60 * 24 * 365)
      // visibleRange: from ~ to
      chart.timeScale().setVisibleRange({
        from: oneYearAgo,
        to: last,
      })
    }

    // 툴팁용 커스텀 div 생성
    let tooltip = document.getElementById("custom-tooltip")
    if (!tooltip) {
      tooltip = document.createElement("div")
      tooltip.id = "custom-tooltip"
      tooltip.style.position = "absolute"
      tooltip.style.zIndex = 20
      tooltip.style.pointerEvents = "none"
      tooltip.style.background = "rgba(30,41,59,0.95)"
      tooltip.style.color = "#fff"
      tooltip.style.padding = "4px 8px"
      tooltip.style.borderRadius = "4px"
      tooltip.style.fontSize = "12px"
      tooltip.style.display = "none"
      chartRef.current.appendChild(tooltip)
    }

    chart.subscribeCrosshairMove(param => {
      if (!param.time || !param.seriesPrices) {
        tooltip.style.display = "none"
        return
      }
      const price = param.seriesPrices.get(candleSeries)
      if (!price) {
        tooltip.style.display = "none"
        return
      }
      const data = candleData.find(c => c.time === param.time)
      let dateStr = ""
      if (data && data.timestamp_ny) {
        const [y, m, day] = data.timestamp_ny.slice(0, 10).split("-")
        dateStr = `${y}년 ${m}월 ${day}일`
      } else if (typeof param.time === "number" && !isNaN(param.time)) {
        const dateObj = new Date(param.time * 1000)
        if (!isNaN(dateObj.getTime())) {
          dateStr = `${dateObj.getFullYear()}년 ${String(dateObj.getMonth() + 1).padStart(2, "0")}월 ${String(dateObj.getDate()).padStart(2, "0")}일`
        } else {
          dateStr = ""
        }
      } else {
        dateStr = ""
      }
      tooltip.innerHTML = `<div>${dateStr}</div>`
      tooltip.style.display = "block"
      if (param.point) {
        tooltip.style.left = param.point.x + 20 + "px"
        tooltip.style.top = (param.point.y - 20) + "px"
      }
    })

    // 반응형
    const ro = new window.ResizeObserver(() => {
      if (chartRef.current && chartObj.current) {
        chartObj.current.applyOptions({
          width: chartRef.current.offsetWidth,
          height: chartRef.current.offsetHeight,
        })
      }
    })
    ro.observe(chartRef.current)

    return () => {
      ro.disconnect()
      if (chartObj.current) {
        chartObj.current.remove()
        chartObj.current = null
      }
    }
  }, [
    ohlcv,
    sma1Color, sma2Color, ema1Color, ema2Color, ema3Color, rsiColor, bollingerColor,
    sma1Period, sma2Period, ema1Period, ema2Period, ema3Period, rsiPeriod, bollingerPeriod, bollingerK,
    showSMA1, showSMA2, showEMA1, showEMA2, showEMA3, showRSI, showBollinger,
    macdFast, macdSlow, macdSignal, macdColor, macdSignalColor, macdHistColor, showMACD,
    isDark // ← 이 부분 추가!
  ])

  // SMA/EMA 토글/색상 변경 시 차트 업데이트
  useEffect(() => {
    if (!chartObj.current || !sma1SeriesRef.current || !sma2SeriesRef.current || !ema1SeriesRef.current || !ema2SeriesRef.current || !ema3SeriesRef.current || !rsiSeriesRef.current) return

    const candleData = ohlcv
      .map(d => {
        let time
        if (d.timestamp) {
          const t = Date.parse(d.timestamp)
          time = isNaN(t) ? undefined : Math.floor(t / 1000)
        }
        return time !== undefined && d.open !== undefined
          ? {
              time,
              open: d.open,
              high: d.high,
              low: d.low,
              close: d.close,
              timestamp_ny: d.timestamp_ny,
            }
          : null
      })
      .filter(Boolean)
      .sort((a, b) => a.time - b.time)

    const sma1Data = calcSMA(candleData, sma1Period)
    const sma2Data = calcSMA(candleData, sma2Period)
    const ema1Data = calcEMA(candleData, ema1Period)
    const ema2Data = calcEMA(candleData, ema2Period)
    const ema3Data = calcEMA(candleData, ema3Period)
    const rsiData = calcRSI(candleData, rsiPeriod)
    const bbData = calcBollinger(candleData, bollingerPeriod, bollingerK)
    const macdData = calcMACD(candleData, macdFast, macdSlow, macdSignal)

    sma1SeriesRef.current.applyOptions({ color: sma1Color })
    sma2SeriesRef.current.applyOptions({ color: sma2Color })
    ema1SeriesRef.current.applyOptions({ color: ema1Color })
    ema2SeriesRef.current.applyOptions({ color: ema2Color })
    ema3SeriesRef.current.applyOptions({ color: ema3Color })
    rsiSeriesRef.current.applyOptions({ color: rsiColor })
    //bollingerSeriesRef.current.applyOptions({ color: bollingerColor })
    sma1SeriesRef.current.setData(showSMA1 ? sma1Data : [])
    sma2SeriesRef.current.setData(showSMA2 ? sma2Data : [])
    ema1SeriesRef.current.setData(showEMA1 ? ema1Data : [])
    ema2SeriesRef.current.setData(showEMA2 ? ema2Data : [])
    ema3SeriesRef.current.setData(showEMA3 ? ema3Data : [])
    rsiSeriesRef.current.setData(showRSI ? rsiData : [])
    //bollingerSeriesRef.current.setData(showBollinger ? bbData : [])
  }, [showSMA1, showSMA2, showEMA1, showEMA2, showEMA3, showRSI, showBollinger, sma1Color, sma2Color, ema1Color, ema2Color, ema3Color, rsiColor, bollingerColor, ohlcv])

  // 커스텀 컬러피커 (react-color)
  function SMAColorPicker({ color, onChange, disabled }) {
    const [show, setShow] = useState(false)
    const chipRef = useRef(null)

    return (
      <span style={{ position: "relative", display: "inline-block", overflow: "visible" }}>
        <span
          ref={chipRef}
          style={{
            display: "inline-block",
            width: 20,
            height: 20,
            borderRadius: "50%",
            background: color,
            border: "2px solid #ccc",
            opacity: disabled ? 0.4 : 1,
            cursor: "pointer",
          }}
          onClick={e => {
            e.stopPropagation()
            setShow(v => !v)
          }}
        />
        {show && (
          <div style={{
            position: "absolute",
            zIndex: 999,
            top: 28,
            right: 0, // ← left 대신 right 사용!
            background: "white",
            boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
            borderRadius: 8,
          }}>
            <ChromePicker
              color={color}
              onChange={c => onChange(c.hex)}
              disableAlpha
            />
          </div>
        )}
      </span>
    )
  }

  function getSmaCrossMarkers(sma1, sma2, candleTimes) {
    // time을 기준으로 두 SMA 배열을 매핑
    const sma1Map = Object.fromEntries(sma1.map(d => [d.time, d.value]))
    const sma2Map = Object.fromEntries(sma2.map(d => [d.time, d.value]))
    const markers = []

    // candleTimes(=candleData의 time) 순회
    for (let i = 1; i < candleTimes.length; i++) {
      const tPrev = candleTimes[i - 1]
      const tCurr = candleTimes[i]
      // 두 SMA 모두 값이 있는 시점만 비교
      if (
        sma1Map[tPrev] !== undefined && sma2Map[tPrev] !== undefined &&
        sma1Map[tCurr] !== undefined && sma2Map[tCurr] !== undefined
      ) {
        // 골든크로스
        if (sma1Map[tPrev] < sma2Map[tPrev] && sma1Map[tCurr] >= sma2Map[tCurr]) {
          markers.push({
            time: tCurr,
            position: "belowBar",
            color: "#16a34a",
            shape: "arrowUp",
            text: "골든크로스",
          })
        }
        // 데드크로스
        if (sma1Map[tPrev] > sma2Map[tPrev] && sma1Map[tCurr] <= sma2Map[tCurr]) {
          markers.push({
            time: tCurr,
            position: "aboveBar",
            color: "#dc2626",
            shape: "arrowDown",
            text: "데드크로스",
          })
        }
      }
    }
    return markers
  }

  return (
    <MainLayout>
      {/* 본문 */}
      <div className="flex flex-col w-full max-w-full bg-white dark:bg-gray-900 min-h-[calc(100dvh-56px)] pt-4 pb-8">
        {/* --- 관심종목 드롭다운 & 컨트롤 버튼들 --- */}
        <div className="flex items-center justify-between px-4 sm:px-8 mb-2">
          {/* 관심종목 드롭다운 */}
          <select
            className="border rounded px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
            value={selected}
            onChange={e => setSelected(e.target.value)}
          >
            {watchlist.length === 0 && <option value="">관심종목 없음</option>}
            {watchlist.map(item => (
              <option key={item.ticker} value={item.ticker}>
                {item.name
                  ? `${item.name} (${item.ticker})`
                  : item.ticker}
              </option>
            ))}
          </select>
          
          {/* 컨트롤 버튼들 */}
          <div className="flex items-center gap-2">
            {/* AI 분석 버튼들 */}
            <div className="flex items-center gap-1">
              <button
                className="px-3 py-2 rounded bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={() => handleAIAnalysis('smart-analysis')}
                disabled={!selected || aiAnalysisLoading}
              >
                {aiAnalysisLoading ? '🔄' : '🤖'} AI 분석
              </button>
              <button
                className="px-2 py-2 rounded border border-gray-300 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 hover:bg-gray-200 dark:hover:bg-gray-700 text-sm transition disabled:opacity-50"
                onClick={() => handleAIAnalysis('advanced-signals')}
                disabled={!selected || aiAnalysisLoading}
                title="기술적 분석"
              >
                📊
              </button>
              <button
                className="px-2 py-2 rounded border border-gray-300 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 hover:bg-gray-200 dark:hover:bg-gray-700 text-sm transition disabled:opacity-50"
                onClick={() => handleAIAnalysis('llm-analysis')}
                disabled={!selected || aiAnalysisLoading}
                title="LLM 분석"
              >
                💡
              </button>
            </div>
            
            {/* 지표설정 버튼 */}
            <button
              ref={indicatorBtnRef}
              className="px-3 py-2 rounded border border-gray-300 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 hover:bg-gray-200 dark:hover:bg-gray-700 text-sm font-medium transition"
              onClick={() => setShowIndicatorModal(true)}
            >
              지표설정
            </button>
          </div>
        </div>

        {/* 차트 영역 */}
        <div
          ref={chartRef}
          className="mx-2 my-2 sm:mx-8 sm:my-8 rounded-lg shadow-lg
            bg-white dark:bg-slate-800/80
            transition-colors relative"
          style={{
            height: "320px",
            minHeight: "200px",
            maxHeight: "60vh",
            overflow: "visible",
            ...(window.innerWidth >= 1024
              ? { height: "80vh", maxHeight: "80vh" }
              : {}),
          }}
        >
          {/* AI 분석 오버레이 - 차트 영역 내부 */}
          {showAIAnalysis && (
            <AIAnalysisOverlay
              show={showAIAnalysis}
              onClose={() => {
                setShowAIAnalysis(false)
                setAiAnalysisResult(null)
                setAiAnalysisError("")
              }}
              loading={aiAnalysisLoading}
              result={aiAnalysisResult}
              error={aiAnalysisError}
              ticker={selected}
              isInChart={true}
            />
          )}

          {error && (
            <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-80 dark:bg-gray-900 dark:bg-opacity-80 p-4">
              <div className="text-center">
                <p className="text-sm text-red-500">{error}</p>
              </div>
            </div>
          )}
        </div>

        {/* 커스텀 툴팁 */}
        <div id="custom-tooltip" style={{
          position: "absolute",
          pointerEvents: "none",
          background: "rgba(30,41,59,0.95)",
          color: "#fff",
          padding: "4px 8px",
          borderRadius: "4px",
          fontSize: "12px",
          display: "none",
          zIndex: 20,
        }}></div>

        {/* 인디케이터 설정 모달 */}
        {showIndicatorModal && (
          <IndicatorSettingsModal
            open={showIndicatorModal}
            anchorRef={indicatorBtnRef}
            anchorOrigin={{ vertical: "bottom", horizontal: "left" }} // 버튼 아래 왼쪽 정렬
            onClose={() => setShowIndicatorModal(false)}
            sma1Period={sma1Period}
            setSma1Period={setSma1Period}
            sma1Color={sma1Color}
            setSma1Color={setSma1Color}
            showSMA1={showSMA1}
            setShowSMA1={setShowSMA1}
            sma2Period={sma2Period}
            setSma2Period={setSma2Period}
            sma2Color={sma2Color}
            setSma2Color={setSma2Color}
            showSMA2={showSMA2}
            setShowSMA2={setShowSMA2}
            ema1Period={ema1Period}
            setEma1Period={setEma1Period}
            ema1Color={ema1Color}
            setEma1Color={setEma1Color}
            showEMA1={showEMA1}
            setShowEMA1={setShowEMA1}
            ema2Period={ema2Period}
            setEma2Period={setEma2Period}
            ema2Color={ema2Color}
            setEma2Color={setEma2Color}
            showEMA2={showEMA2}
            setShowEMA2={setShowEMA2}
            ema3Period={ema3Period}
            setEma3Period={setEma3Period}
            ema3Color={ema3Color}
            setEma3Color={setEma3Color}
            showEMA3={showEMA3}
            setShowEMA3={setShowEMA3}
            rsiPeriod={rsiPeriod}
            setRsiPeriod={setRsiPeriod}
            rsiColor={rsiColor}
            setRsiColor={setRsiColor}
            showRSI={showRSI}
            setShowRSI={setShowRSI}
            bollingerPeriod={bollingerPeriod}
            setBollingerPeriod={setBollingerPeriod}
            bollingerK={bollingerK}
            setBollingerK={setBollingerK}
            bollingerColor={bollingerColor}
            setBollingerColor={setBollingerColor}
            showBollinger={showBollinger}
            setShowBollinger={setShowBollinger}
            macdFast={macdFast}
            setMacdFast={setMacdFast}
            macdSlow={macdSlow}
            setMacdSlow={setMacdSlow}
            macdSignal={macdSignal}
            setMacdSignal={setMacdSignal}
            macdColor={macdColor}
            setMacdColor={setMacdColor}
            showMACD={showMACD}
            setShowMACD={setShowMACD}
            macdSignalColor={macdSignalColor}
            setMacdSignalColor={setMacdSignalColor}
            macdHistColor={macdHistColor}
            setMacdHistColor={setMacdHistColor}
          />
        )}
      </div>
    </MainLayout>
  )
}

