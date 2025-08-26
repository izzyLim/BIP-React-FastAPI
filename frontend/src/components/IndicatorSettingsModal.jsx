import React from "react"

export default function IndicatorSettingsModal({
  open,
  anchorRef,
  onClose,
  sma1Period, setSma1Period, sma1Color, setSma1Color, showSMA1, setShowSMA1,
  sma2Period, setSma2Period, sma2Color, setSma2Color, showSMA2, setShowSMA2,
  ema1Period, setEma1Period, ema1Color, setEma1Color, showEMA1, setShowEMA1,
  ema2Period, setEma2Period, ema2Color, setEma2Color, showEMA2, setShowEMA2,
  ema3Period, setEma3Period, ema3Color, setEma3Color, showEMA3, setShowEMA3,
  rsiPeriod, setRsiPeriod, rsiColor, setRsiColor, showRSI, setShowRSI,
  bollingerPeriod, setBollingerPeriod, bollingerK, setBollingerK, bollingerColor, setBollingerColor, showBollinger, setShowBollinger,
  macdFast, setMacdFast, macdSlow, setMacdSlow, macdSignal, setMacdSignal, macdColor, setMacdColor, showMACD, setShowMACD,
  macdSignalColor, setMacdSignalColor, macdHistColor, setMacdHistColor,
}) {
  const MODAL_WIDTH = 400

  const [pos, setPos] = React.useState({ top: 0, left: 0 })
  React.useLayoutEffect(() => {
    if (anchorRef?.current && open) {
      const rect = anchorRef.current.getBoundingClientRect()
      let left = rect.left + window.scrollX
      // 오른쪽이 짤리면 왼쪽으로 보정
      if (left + MODAL_WIDTH > window.innerWidth - 8) {
        left = window.innerWidth - MODAL_WIDTH - 30
        if (left < 8) left = 8 // 너무 왼쪽도 방지
      }
      setPos({
        top: rect.bottom + window.scrollY + 8,
        left,
      })
    }
  }, [open, anchorRef])

  const isDark = document.documentElement.classList.contains("dark")

  function SMAColorPicker({ color, onChange, disabled }) {
    const [show, setShow] = React.useState(false)
    const chipRef = React.useRef(null)
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
            if (!disabled) setShow(v => !v)
          }}
        />
        {show && (
          <div style={{
            position: "absolute",
            zIndex: 999,
            top: 28,
            right: 0,
            background: isDark ? "#1e293b" : "white",
            boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
            borderRadius: 8,
          }}>
            <input
              type="color"
              value={color}
              onChange={e => onChange(e.target.value)}
              disabled={disabled}
              className="w-8 h-8 border rounded"
              style={{ background: isDark ? "#1e293b" : "#fff" }}
            />
          </div>
        )}
      </span>
    )
  }

  if (!open) return null

  return (
    <div
      style={{
        position: "fixed",
        top: pos.top,
        left: pos.left,
        minWidth: MODAL_WIDTH,
        maxWidth: MODAL_WIDTH,
        background: isDark ? "#1e293b" : "#fff",
        borderRadius: 12,
        boxShadow: "0 4px 24px rgba(0,0,0,0.18)",
        padding: 24,
        border: isDark ? "1px solid #334155" : "1px solid #e5e7eb",
        color: isDark ? "#f1f5f9" : "#222",
        zIndex: 1000,
      }}
    >
      <h2 className="text-lg font-bold mb-4">지표 설정</h2>
      <div className="flex flex-col gap-4">
        {/* SMA1 */}
        <div className="flex items-center gap-2 select-none">
          <span
            className="text-sm font-medium cursor-pointer"
            style={{
              color: showSMA1 ? sma1Color : "#888",
              opacity: showSMA1 ? 1 : 0.4,
              transition: "color 0.2s, opacity 0.2s",
            }}
            onClick={() => setShowSMA1(v => !v)}
            tabIndex={0}
            role="button"
            aria-pressed={showSMA1}
          >
            SMA
          </span>
          <input
            type="number"
            min={1}
            max={500}
            value={sma1Period}
            onChange={e => setSma1Period(Number(e.target.value))}
            className={`w-12 px-1 py-0.5 border rounded text-xs ${isDark ? "bg-gray-800 text-gray-100 border-gray-700" : "bg-white text-gray-900 border-gray-300"}`}
            style={{ opacity: showSMA1 ? 1 : 0.4 }}
            disabled={!showSMA1}
          />
          <SMAColorPicker
            color={sma1Color}
            onChange={setSma1Color}
            disabled={!showSMA1}
          />
        </div>
        {/* SMA2 */}
        <div className="flex items-center gap-2 select-none">
          <span
            className="text-sm font-medium cursor-pointer"
            style={{
              color: showSMA2 ? sma2Color : "#888",
              opacity: showSMA2 ? 1 : 0.4,
              transition: "color 0.2s, opacity 0.2s",
            }}
            onClick={() => setShowSMA2(v => !v)}
            tabIndex={0}
            role="button"
            aria-pressed={showSMA2}
          >
            SMA
          </span>
          <input
            type="number"
            min={1}
            max={500}
            value={sma2Period}
            onChange={e => setSma2Period(Number(e.target.value))}
            className={`w-12 px-1 py-0.5 border rounded text-xs ${isDark ? "bg-gray-800 text-gray-100 border-gray-700" : "bg-white text-gray-900 border-gray-300"}`}
            style={{ opacity: showSMA2 ? 1 : 0.4 }}
            disabled={!showSMA2}
          />
          <SMAColorPicker
            color={sma2Color}
            onChange={setSma2Color}
            disabled={!showSMA2}
          />
        </div>
        {/* EMA1 */}
        <div className="flex items-center gap-2 select-none">
          <span
            className="text-sm font-medium cursor-pointer"
            style={{
              color: showEMA1 ? ema1Color : "#888",
              opacity: showEMA1 ? 1 : 0.4,
              transition: "color 0.2s, opacity 0.2s",
            }}
            onClick={() => setShowEMA1(v => !v)}
            tabIndex={0}
            role="button"
            aria-pressed={showEMA1}
          >
            EMA
          </span>
          <input
            type="number"
            min={1}
            max={500}
            value={ema1Period}
            onChange={e => setEma1Period(Number(e.target.value))}
            className={`w-12 px-1 py-0.5 border rounded text-xs ${isDark ? "bg-gray-800 text-gray-100 border-gray-700" : "bg-white text-gray-900 border-gray-300"}`}
            style={{ opacity: showEMA1 ? 1 : 0.4 }}
            disabled={!showEMA1}
          />
          <SMAColorPicker
            color={ema1Color}
            onChange={setEma1Color}
            disabled={!showEMA1}
          />
        </div>
        {/* EMA2 */}
        <div className="flex items-center gap-2 select-none">
          <span
            className="text-sm font-medium cursor-pointer"
            style={{
              color: showEMA2 ? ema2Color : "#888",
              opacity: showEMA2 ? 1 : 0.4,
              transition: "color 0.2s, opacity 0.2s",
            }}
            onClick={() => setShowEMA2(v => !v)}
            tabIndex={0}
            role="button"
            aria-pressed={showEMA2}
          >
            EMA
          </span>
          <input
            type="number"
            min={1}
            max={500}
            value={ema2Period}
            onChange={e => setEma2Period(Number(e.target.value))}
            className={`w-12 px-1 py-0.5 border rounded text-xs ${isDark ? "bg-gray-800 text-gray-100 border-gray-700" : "bg-white text-gray-900 border-gray-300"}`}
            style={{ opacity: showEMA2 ? 1 : 0.4 }}
            disabled={!showEMA2}
          />
          <SMAColorPicker
            color={ema2Color}
            onChange={setEma2Color}
            disabled={!showEMA2}
          />
        </div>
        {/* EMA3 */}
        <div className="flex items-center gap-2 select-none">
          <span
            className="text-sm font-medium cursor-pointer"
            style={{
              color: showEMA3 ? ema3Color : "#888",
              opacity: showEMA3 ? 1 : 0.4,
              transition: "color 0.2s, opacity 0.2s",
            }}
            onClick={() => setShowEMA3(v => !v)}
            tabIndex={0}
            role="button"
            aria-pressed={showEMA3}
          >
            EMA
          </span>
          <input
            type="number"
            min={1}
            max={500}
            value={ema3Period}
            onChange={e => setEma3Period(Number(e.target.value))}
            className={`w-12 px-1 py-0.5 border rounded text-xs ${isDark ? "bg-gray-800 text-gray-100 border-gray-700" : "bg-white text-gray-900 border-gray-300"}`}
            style={{ opacity: showEMA3 ? 1 : 0.4 }}
            disabled={!showEMA3}
          />
          <SMAColorPicker
            color={ema3Color}
            onChange={setEma3Color}
            disabled={!showEMA3}
          />
        </div>
        {/* RSI */}
        <div className="flex items-center gap-4 select-none">
          <span
            className="text-sm font-medium cursor-pointer"
            style={{
              color: showRSI ? rsiColor : "#888",
              opacity: showRSI ? 1 : 0.4,
              transition: "color 0.2s, opacity 0.2s",
            }}
            onClick={() => setShowRSI(v => !v)}
            tabIndex={0}
            role="button"
            aria-pressed={showRSI}
          >
            RSI
          </span>
          <input
            type="number"
            min={2}
            max={100}
            value={rsiPeriod}
            onChange={e => setRsiPeriod(Number(e.target.value))}
            className={`w-12 px-1 py-0.5 border rounded text-xs ${isDark ? "bg-gray-800 text-gray-100 border-gray-700" : "bg-white text-gray-900 border-gray-300"}`}
            style={{ opacity: showRSI ? 1 : 0.4 }}
            disabled={!showRSI}
          />
          <SMAColorPicker
            color={rsiColor}
            onChange={setRsiColor}
            disabled={!showRSI}
          />
        </div>
        {/* Bollinger Band */}
        <div className="flex items-center gap-2 select-none">
          <span
            className="text-sm font-medium cursor-pointer"
            style={{
              color: showBollinger ? bollingerColor : "#888",
              opacity: showBollinger ? 1 : 0.4,
              transition: "color 0.2s, opacity 0.2s",
            }}
            onClick={() => setShowBollinger(v => !v)}
            tabIndex={0}
            role="button"
            aria-pressed={showBollinger}
          >
            Bollinger
          </span>
          <input
            type="number"
            min={2}
            max={100}
            value={bollingerPeriod}
            onChange={e => {
              const v = Number(e.target.value)
              setBollingerPeriod(isNaN(v) || v < 2 ? 2 : v)
            }}
            className={`w-12 px-1 py-0.5 border rounded text-xs ${isDark ? "bg-gray-800 text-gray-100 border-gray-700" : "bg-white text-gray-900 border-gray-300"}`}
            style={{ opacity: showBollinger ? 1 : 0.4 }}
            disabled={!showBollinger}
            title="기간"
          />
          <span className="text-xs">기간</span>
          <input
            type="number"
            min={1}
            max={5}
            step={0.1}
            value={bollingerK}
            onChange={e => setBollingerK(Number(e.target.value))}
            className={`w-11 px-1 py-0.5 border rounded text-xs ${isDark ? "bg-gray-800 text-gray-100 border-gray-700" : "bg-white text-gray-900 border-gray-300"}`}
            style={{ opacity: showBollinger ? 1 : 0.4 }}
            disabled={!showBollinger}
            title="표준편차"
          />
          <span className="text-xs">K</span>
          <SMAColorPicker
            color={bollingerColor}
            onChange={setBollingerColor}
            disabled={!showBollinger}
          />
        </div>
        {/* MACD */}
        <div className="flex items-center gap-2 select-none">
          <span
            className="text-sm font-medium cursor-pointer"
            style={{
              color: showMACD ? macdColor : "#888",
              opacity: showMACD ? 1 : 0.4,
              transition: "color 0.2s, opacity 0.2s",
            }}
            onClick={() => setShowMACD(v => !v)}
            tabIndex={0}
            role="button"
            aria-pressed={showMACD}
          >
            MACD
          </span>
          <input
            type="number"
            min={2}
            max={50}
            value={macdFast}
            onChange={e => setMacdFast(Math.max(2, Number(e.target.value)))}
            className={`w-10 px-1 py-0.5 border rounded text-xs ${isDark ? "bg-gray-800 text-gray-100 border-gray-700" : "bg-white text-gray-900 border-gray-300"}`}
            style={{ opacity: showMACD ? 1 : 0.4 }}
            disabled={!showMACD}
            title="Fast"
          />
          <span className="text-xs">Fast</span>
          <input
            type="number"
            min={2}
            max={100}
            value={macdSlow}
            onChange={e => setMacdSlow(Math.max(2, Number(e.target.value)))}
            className={`w-10 px-1 py-0.5 border rounded text-xs ${isDark ? "bg-gray-800 text-gray-100 border-gray-700" : "bg-white text-gray-900 border-gray-300"}`}
            style={{ opacity: showMACD ? 1 : 0.4 }}
            disabled={!showMACD}
            title="Slow"
          />
          <span className="text-xs">Slow</span>
          <input
            type="number"
            min={2}
            max={50}
            value={macdSignal}
            onChange={e => setMacdSignal(Math.max(2, Number(e.target.value)))}
            className={`w-10 px-1 py-0.5 border rounded text-xs ${isDark ? "bg-gray-800 text-gray-100 border-gray-700" : "bg-white text-gray-900 border-gray-300"}`}
            style={{ opacity: showMACD ? 1 : 0.4 }}
            disabled={!showMACD}
            title="Signal"
          />
          <span className="text-xs">Signal</span>
          <SMAColorPicker
            color={macdColor}
            onChange={setMacdColor}
            disabled={!showMACD}
          />
          <SMAColorPicker
            color={macdSignalColor}
            onChange={setMacdSignalColor}
            disabled={!showMACD}
          />
        </div>
      </div>
      <div className="flex justify-end gap-2 mt-6">
        <button onClick={onClose} className={`px-3 py-1 rounded ${isDark ? "bg-gray-700 text-gray-100" : "bg-gray-200"}`}>닫기</button>
      </div>
    </div>
  )
}