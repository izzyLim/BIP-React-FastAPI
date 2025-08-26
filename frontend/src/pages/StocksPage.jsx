import { useEffect, useState, useMemo } from "react";
import MainLayout from "../layouts/MainLayout";
import StockSearch from "../components/StockSearch";
import CandleChart from "../components/CandleChart";
import { stocksAPI, watchlistAPI } from '../utils/api'

export default function StocksPage() {
  const [ticker, setTicker] = useState(null);
  const [stock, setStock] = useState(null);
  const [stockLoading, setStockLoading] = useState(false);
  const [prices, setPrices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [watching, setWatching] = useState(false);
  const [watchLoading, setWatchLoading] = useState(false);

  const nf0 = useMemo(() => new Intl.NumberFormat(), []);
  const nf2 = useMemo(
    () => new Intl.NumberFormat(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
    []
  );

  // 상세 정보 로드
  useEffect(() => {
    if (!ticker) return;
    (async () => {
      setStockLoading(true);
      setError(null);
      try {
        const stockData = await stocksAPI.getStock(ticker);
        setStock(stockData);
        // watchlist 상태 확인
        const watchData = await watchlistAPI.check(ticker);
        setWatching(watchData.watching);
      } catch (e) {
        setStock(null);
        setError(e.message);
        setWatching(false);
      } finally {
        setStockLoading(false);
      }
    })();
  }, [ticker]);

  // 가격 로드
  useEffect(() => {
    if (!ticker) return;
    (async () => {
      setLoading(true);
      try {
        const pricesData = await stocksAPI.getPrices(ticker, '1d');
        setPrices(pricesData);
      } catch (e) {
        setPrices([]);
        setError((prev) => prev || e.message);
      } finally {
        setLoading(false);
      }
    })();
  }, [ticker]);

  // 별 클릭 핸들러
  async function toggleWatch() {
    if (!ticker) return;
    setWatchLoading(true);
    try {
      if (!watching) {
        // 등록
        await watchlistAPI.add(ticker);
        setWatching(true);
      } else {
        // 해제
        await watchlistAPI.remove(ticker);
        setWatching(false);
      }
    } finally {
      setWatchLoading(false);
    }
  }

  return (
    <MainLayout showSidebar>
      <div className="space-y-4">
        <h1 className="text-2xl font-semibold">Stocks</h1>

        <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
          <StockSearch onSelect={(s) => setTicker(s.ticker)} />
        </div>

        {error && <div className="text-sm text-red-600 dark:text-red-400">{error}</div>}

        {ticker && (
          <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                {ticker}
                {stock?.stock_name ? ` - ${stock.stock_name}` : ""}
                {stock?.stock_name_eng ? ` (${stock.stock_name_eng})` : ""}
                <button
                  onClick={toggleWatch}
                  disabled={watchLoading}
                  className="ml-2 text-xl transition-colors"
                  title={watching ? "왓치리스트에서 제거" : "왓치리스트에 추가"}
                  aria-label="Watchlist"
                >
                  {watching ? (
                    <span className="text-yellow-400">★</span>
                  ) : (
                    <span className="text-gray-300 dark:text-gray-600 hover:text-yellow-400">☆</span>
                  )}
                </button>
              </h3>
              {stock && (
                <span
                  className={`text-xs px-2 py-1 rounded ${
                    stock.active
                      ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200"
                      : "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300"
                  }`}
                >
                  {stock.active ? "ACTIVE" : "INACTIVE"}
                </span>
              )}
            </div>

            {stockLoading ? (
              <div className="text-sm text-gray-500 dark:text-gray-400">Loading details...</div>
            ) : stock ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <Field label="Market">{stock.market_type || "-"}</Field>
                <Field label="Exchange">{stock.exchange_code || "-"}</Field>
                <Field label="Currency">{stock.currency_code || "-"}</Field>
                <Field label="Listing Date">
                  {stock.listing_date ? new Date(stock.listing_date).toLocaleDateString() : "-"}
                </Field>
                <Field label="Par Value">
                  {stock.par_value != null ? nf2.format(stock.par_value) : "-"}
                </Field>
                <Field label="Total Shares">
                  {stock.total_shares != null ? nf0.format(stock.total_shares) : "-"}
                </Field>
                <Field label="Market Value">
                  {stock.market_value != null ? nf2.format(stock.market_value) : "-"}
                </Field>
                <Field label="Data Source">{stock.data_source || "-"}</Field>
                <Field label="Updated At">
                  {stock.updated_at ? new Date(stock.updated_at).toLocaleString() : "-"}
                </Field>
              </div>
            ) : (
              <div className="text-sm text-gray-500 dark:text-gray-400">No details.</div>
            )}
          </div>
        )}

        {ticker && (
          <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
            <h3 className="text-lg font-semibold mb-3">{ticker} - Daily Candles</h3>
            <CandleChart data={prices} loading={loading} />
          </div>
        )}
      </div>
    </MainLayout>
  );
}

function Field({ label, children }) {
  return (
    <div className="flex items-center gap-3">
      <div className="w-32 shrink-0 text-gray-500 dark:text-gray-400">{label}</div>
      <div className="text-gray-900 dark:text-gray-100">{children}</div>
    </div>
  );
}