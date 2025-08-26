import { createChart, CrosshairMode } from "lightweight-charts";
import { useEffect, useRef, useState, useMemo } from "react";

export default function CandleChart({ data }) {
  const elRef = useRef(null);
  const seriesRef = useRef(null);
  const chartRef = useRef(null);

  // === 추가: 시간단위(일/주/월), 표시 기간 ===
  const [resolution, setResolution] = useState("1D"); // 1D | 1W | 1M
  const [range, setRange] = useState("1Y"); // 1M | 3M | 1Y | 3Y | 5Y | MAX

  // 원본 daily 데이터(역순 들어오면 정렬)
  const dailySorted = useMemo(() => {
    if (!Array.isArray(data)) return [];
    return [...data].sort(
      (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );
  }, [data]);

  // 주봉/월봉 집계
  const aggregated = useMemo(() => {
    if (!dailySorted.length) return [];
    if (resolution === "1D") {
      return dailySorted.map(d => ({
        time: Math.floor(new Date(d.timestamp).getTime() / 1000),
        open: +d.open,
        high: +d.high,
        low: +d.low,
        close: +d.close,
        volume: d.volume != null ? +d.volume : undefined,
      }));
    }

    const buckets = new Map();
    for (const d of dailySorted) {
      const dt = new Date(d.timestamp);
      // UTC 기준
      const y = dt.getUTCFullYear();
      const m = dt.getUTCMonth(); // 0-11
      let key;
      if (resolution === "1W") {
        // 주 시작(월요일) 날짜 계산
        const wd = dt.getUTCDay(); // 0=일
        const offset = (wd === 0 ? -6 : 1 - wd); // 월요일까지 이동
        const monday = new Date(Date.UTC(y, m, dt.getUTCDate() + offset));
        key = `W:${monday.toISOString().slice(0, 10)}`; // 예: W:2024-11-18
      } else {
        // 1M
        key = `M:${y}-${String(m + 1).padStart(2, "0")}`;
      }

      const o = +d.open, h = +d.high, l = +d.low, c = +d.close;
      const ts = dt.getTime();
      if (!buckets.has(key)) {
        buckets.set(key, {
          key,
            open: o,
          high: h,
          low: l,
          close: c,
          firstTs: ts,
          lastTs: ts,
          volume: d.volume != null ? +d.volume : 0,
        });
      } else {
        const bk = buckets.get(key);
        bk.high = Math.max(bk.high, h);
        bk.low = Math.min(bk.low, l);
        bk.close = c;
        if (ts < bk.firstTs) {
          bk.firstTs = ts;
          bk.open = o; // 가장 이른 날짜의 open
        }
        if (ts > bk.lastTs) bk.lastTs = ts;
        if (d.volume != null) bk.volume += +d.volume;
      }
    }

    // 정렬 (키의 firstTs 기준)
    const rows = [...buckets.values()].sort((a, b) => a.firstTs - b.firstTs);
    return rows.map(r => ({
      time: Math.floor((resolution === "1W" ? r.firstTs : r.firstTs) / 1000), // 주/월봉 시간은 구간 시작일
      open: r.open,
      high: r.high,
      low: r.low,
      close: r.close,
      volume: r.volume || undefined,
    }));
  }, [dailySorted, resolution]);

  // 기간 필터
  const filteredData = useMemo(() => {
    if (!aggregated.length) return [];
    if (range === "MAX") return aggregated;
    const endSec = aggregated[aggregated.length - 1].time;
    const endMs = endSec * 1000;
    const msInDay = 86400000;
    let startMs;
    switch (range) {
      case "1M": startMs = endMs - msInDay * 31; break;
      case "3M": startMs = endMs - msInDay * 93; break;
      case "1Y": startMs = endMs - msInDay * 365; break;
      case "3Y": startMs = endMs - msInDay * 365 * 3; break;
      case "5Y": startMs = endMs - msInDay * 365 * 5; break;
      default: return aggregated;
    }
    const startSec = Math.floor(startMs / 1000);
    const slice = aggregated.filter(c => c.time >= startSec);
    return slice.length ? slice : aggregated; // 비면 전체
  }, [aggregated, range]);

  useEffect(() => {
    if (!elRef.current) return;
    const dark = document.documentElement.classList.contains("dark");
    const chart = createChart(elRef.current, {
      width: elRef.current.clientWidth,
      height: 420,
      layout: {
        background: { color: dark ? "#0f172a" : "#ffffff" },
        textColor: dark ? "#e2e8f0" : "#334155",
      },
      grid: {
        vertLines: { color: dark ? "#1e293b" : "#f1f5f9" },
        horzLines: { color: dark ? "#1e293b" : "#f1f5f9" },
      },
      crosshair: { mode: CrosshairMode.Normal },
      timeScale: { borderColor: dark ? "#334155" : "#94a3b8" },
      rightPriceScale: { borderColor: dark ? "#334155" : "#94a3b8" },
    });
    chartRef.current = chart;

    if (typeof chart.addCandlestickSeries !== "function") {
      console.error("addCandlestickSeries not found. Received chart:", chart);
      return;
    }

    seriesRef.current = chart.addCandlestickSeries({
      upColor: "#16a34a",
      downColor: "#dc2626",
      borderUpColor: "#16a34a",
      borderDownColor: "#dc2626",
      wickUpColor: "#16a34a",
      wickDownColor: "#dc2626",
    });

    const ro = new ResizeObserver(() => {
      chart.applyOptions({ width: elRef.current.clientWidth });
    });
    ro.observe(elRef.current);

    return () => {
      ro.disconnect();
      chart.remove();
    };
  }, []);

  // 차트 데이터 반영
  useEffect(() => {
    if (!seriesRef.current) return;
    seriesRef.current.setData(filteredData);
    if (chartRef.current) chartRef.current.timeScale().fitContent();
  }, [filteredData]);

  const btnBase = "px-2 py-1 rounded text-xs font-medium border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700";
  const btnActive = "px-2 py-1 rounded text-xs font-semibold bg-indigo-600 text-white border border-indigo-600";

  const resolutions = [
    { key: "1D", label: "일봉" },
    { key: "1W", label: "주봉" },
    { key: "1M", label: "월봉" },
  ];
  const ranges = [
    { key: "1M", label: "1개월" },
    { key: "3M", label: "3개월" },
    { key: "1Y", label: "1년" },
    { key: "3Y", label: "3년" },
    { key: "5Y", label: "5년" },
    { key: "MAX", label: "전체" },
  ];

  return (
    <div className="w-full">
      <div className="flex flex-wrap items-center gap-2 mb-2">
        <div className="flex gap-1">
          {resolutions.map(r => (
            <button
              key={r.key}
              onClick={() => setResolution(r.key)}
              className={resolution === r.key ? btnActive : btnBase}
            >
              {r.label}
            </button>
          ))}
        </div>
        <div className="flex gap-1 ml-4">
          {ranges.map(r => (
            <button
              key={r.key}
              onClick={() => setRange(r.key)}
              className={range === r.key ? btnActive : btnBase}
            >
              {r.label}
            </button>
          ))}
        </div>
        <div className="ml-auto text-[11px] text-gray-500 dark:text-gray-400">
          {resolution} / {range} (캔들 {filteredData.length}개)
        </div>
      </div>
      <div ref={elRef} className="w-full" />
    </div>
  );

}