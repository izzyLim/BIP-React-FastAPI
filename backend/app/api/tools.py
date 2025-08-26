"""
LLM Tools API
GPT, Claude 등 AI 모델이 사용할 도구 API들
"""

import json
from datetime import date, datetime
from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session
from sqlalchemy import text

from app.db.connection import get_db
from app.utils.indicators import calculate_indicators as calc_indicators
from app.utils.indicators import calculate_rsi, calculate_sma, calculate_ema

router = APIRouter(prefix="/tools", tags=["llm-tools"])


# === Internal Helper Functions (for Function Calling) ===

async def _get_price_data_internal(ticker: str, db: Session, period: str = "3M", interval: str = "1d"):
    """Function Calling용 내부 가격 데이터 조회 함수"""
    try:
        table_map = {
            "1m": "stock_price_1m",
            "1d": "stock_price_1d", 
            "1wk": "stock_price_1wk",
            "1mo": "stock_price_1mo",
        }
        
        table = table_map.get(interval, "stock_price_1d")
        
        # 기간별 LIMIT 설정
        period_limits = {
            "1d": 1, "5d": 5, "1mo": 30, "3mo": 90, 
            "6mo": 180, "1y": 365, "2y": 730, "5y": 1825
        }
        limit = period_limits.get(period, 90)
        
        query = text(f"""
            SELECT "timestamp", open, high, low, close, volume
            FROM {table}
            WHERE ticker = :ticker
            ORDER BY "timestamp" DESC
            LIMIT :limit
        """)
        
        result = db.execute(query, {"ticker": ticker, "limit": limit}).fetchall()
        
        data = [
            {
                "date": row.timestamp.isoformat() if row.timestamp else None,
                "open": float(row.open) if row.open else None,
                "high": float(row.high) if row.high else None, 
                "low": float(row.low) if row.low else None,
                "close": float(row.close) if row.close else None,
                "volume": int(row.volume) if row.volume else None
            }
            for row in reversed(result)  # DESC로 가져온 것을 다시 ASC로 정렬
        ]
        
        return {
            "ticker": ticker,
            "period": period,
            "interval": interval,
            "count": len(data),
            "data": data
        }
        
    except Exception as e:
        return {"error": f"가격 데이터 조회 실패: {str(e)}"}


# === Request/Response Models ===

class PriceRequest(BaseModel):
    ticker: str = Field(..., description="주식 티커 (예: AAPL, 005930)")
    period: str = Field("1y", description="기간 (1d, 5d, 1mo, 3mo, 6mo, 1y, 2y, 5y)")
    interval: str = Field("1d", description="간격 (1m, 5m, 15m, 30m, 1h, 1d, 1wk, 1mo)")

class IndicatorRequest(BaseModel):
    ticker: str = Field(..., description="주식 티커")
    period: str = Field("6mo", description="데이터 기간")
    indicators: List[str] = Field(..., description="지표 목록 (예: ['rsi(14)', 'ema(20)', 'sma(50)'])")

class SignalRequest(BaseModel):
    ticker: str = Field(..., description="주식 티커")
    rules: Dict[str, Any] = Field(..., description="매매 규칙 정의")
    period: str = Field("3mo", description="분석 기간")

class BacktestRequest(BaseModel):
    strategy: Dict[str, Any] = Field(..., description="전략 정의")
    tickers: List[str] = Field(..., description="대상 주식 목록")
    period: str = Field("1y", description="백테스트 기간")
    initial_cash: float = Field(100000, description="초기 자금")

class NewsRequest(BaseModel):
    ticker: Optional[str] = Field(None, description="주식 티커 (선택사항)")
    keyword: Optional[str] = Field(None, description="검색 키워드 (선택사항)")
    date_range: str = Field("7d", description="날짜 범위")
    limit: int = Field(10, description="결과 개수")


# === API Endpoints ===

@router.get("/health")
async def health_check():
    """LLM Tools API 헬스체크"""
    return {
        "status": "healthy",
        "timestamp": datetime.now(),
        "version": "1.0.0",
        "tools": [
            "prices", "indicators", "signals", "backtest", "news"
        ]
    }


@router.get("/prices")
async def get_price_data(
    ticker: str = Query(..., description="주식 티커"),
    period: str = Query("1y", description="데이터 기간"),
    interval: str = Query("1d", description="데이터 간격"),
    db: Session = Depends(get_db)
):
    """
    LLM이 사용할 가격 데이터 조회
    
    반환 형식:
    {
        "ticker": "AAPL",
        "period": "1y", 
        "interval": "1d",
        "data": [
            {"date": "2024-01-01", "open": 100, "high": 105, "low": 98, "close": 103, "volume": 1000000},
            ...
        ]
    }
    """
    try:
        # 기존 stocks.py의 prices 로직 재사용하되 LLM 친화적 형태로 반환
        table_map = {
            "1m": "stock_price_1m",
            "1d": "stock_price_1d", 
            "1wk": "stock_price_1wk",
            "1mo": "stock_price_1mo",
        }
        
        table = table_map.get(interval, "stock_price_1d")
        
        # 간단한 쿼리 예시 (실제로는 period 파싱 등 필요)
        query = text(f"""
            SELECT "timestamp", open, high, low, close, volume
            FROM {table}
            WHERE ticker = :ticker
            ORDER BY "timestamp" DESC
            LIMIT 1000
        """)
        
        result = db.execute(query, {"ticker": ticker}).fetchall()
        
        data = [
            {
                "date": row.timestamp.isoformat() if row.timestamp else None,
                "open": float(row.open) if row.open else None,
                "high": float(row.high) if row.high else None, 
                "low": float(row.low) if row.low else None,
                "close": float(row.close) if row.close else None,
                "volume": int(row.volume) if row.volume else None
            }
            for row in result
        ]
        
        return {
            "ticker": ticker,
            "period": period,
            "interval": interval,
            "count": len(data),
            "data": data
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"가격 데이터 조회 실패: {str(e)}")


@router.post("/indicators")
async def calculate_indicators(request: IndicatorRequest, db: Session = Depends(get_db)):
    """
    지표 계산 (서버사이드)
    
    입력 예시:
    {
        "ticker": "AAPL",
        "period": "6mo", 
        "indicators": ["rsi(14)", "ema(20)", "sma(50)", "macd(12,26,9)"]
    }
    
    반환 예시:
    {
        "ticker": "AAPL",
        "period": "6mo",
        "indicators": {
            "rsi_14": [{"date": "2024-01-01", "value": 65.2}, ...],
            "ema_20": [{"date": "2024-01-01", "value": 150.5}, ...],
            "sma_50": [{"date": "2024-01-01", "value": 148.3}, ...],
            "macd": {
                "macd_line": [...],
                "signal_line": [...], 
                "histogram": [...]
            }
        }
    }
    """
    try:
        # 1. 먼저 가격 데이터 조회
        table_map = {
            "1m": "stock_price_1m",
            "1d": "stock_price_1d", 
            "1wk": "stock_price_1wk",
            "1mo": "stock_price_1mo",
        }
        
        table = table_map.get("1d", "stock_price_1d")  # 기본적으로 일봉 사용
        
        # period에 따른 limit 계산 (간단히 구현)
        period_to_days = {
            "1mo": 30, "3mo": 90, "6mo": 180, 
            "1y": 365, "2y": 730, "5y": 1825
        }
        limit = period_to_days.get(request.period, 180)
        
        query = text(f"""
            SELECT ticker, "timestamp", open, high, low, close, volume
            FROM {table}
            WHERE ticker = :ticker
            ORDER BY "timestamp" DESC
            LIMIT :limit
        """)
        
        result = db.execute(query, {"ticker": request.ticker, "limit": limit}).fetchall()
        
        if not result:
            raise HTTPException(status_code=404, detail=f"No price data found for ticker: {request.ticker}")
        
        # 2. 가격 데이터를 지표 계산 함수에 맞는 형태로 변환
        price_data = [
            {
                "date": row.timestamp.isoformat() if row.timestamp else None,
                "open": float(row.open) if row.open else None,
                "high": float(row.high) if row.high else None, 
                "low": float(row.low) if row.low else None,
                "close": float(row.close) if row.close else None,
                "volume": int(row.volume) if row.volume else None
            }
            for row in reversed(result)  # 오래된 것부터 정렬
        ]
        
        # 3. 지표 계산
        indicators_result = calc_indicators(price_data, request.indicators)
        
        return {
            "ticker": request.ticker,
            "period": request.period,
            "data_points": len(price_data),
            "indicators": indicators_result
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"지표 계산 실패: {str(e)}")


@router.post("/signals")
async def generate_signals(request: dict, db: Session = Depends(get_db)):
    """
    매매 시그널 생성
    - RSI 기반 시그널
    - 이동평균 크로스오버
    - 복합 조건 시그널
    """
    try:
        from app.utils.signals import generate_rsi_signals, generate_moving_average_signals, generate_composite_signals, calculate_signal_performance
        
        ticker = request.get("ticker", "AAPL")
        period = request.get("period", "1y")
        signal_type = request.get("signal_type", "rsi")  # rsi, ma_cross, composite
        
        # 가격 데이터 조회
        query = text(f"""
        SELECT timestamp, open, high, low, close, volume 
        FROM stock_price_1d 
        WHERE ticker = '{ticker}' 
        ORDER BY timestamp DESC 
        LIMIT 500
        """)
        
        result = db.execute(query).fetchall()
        
        if not result:
            return {"error": f"No data found for {ticker}", "signals": []}
        
        # 데이터 변환
        price_data = []
        for row in result:
            price_data.append({
                'date': str(row.timestamp),
                'open': float(row.open),
                'high': float(row.high), 
                'low': float(row.low),
                'close': float(row.close),
                'volume': int(row.volume)
            })
        
        price_data.reverse()  # 날짜 순으로 정렬
        
        signals = []
        
        if signal_type == "rsi":
            # RSI 계산 - price_data 전체를 전달
            rsi_result = calculate_rsi(price_data, 14)
            
            buy_threshold = request.get("rsi_buy", 30)
            sell_threshold = request.get("rsi_sell", 70) 
            signals = generate_rsi_signals(rsi_result, buy_threshold, sell_threshold)
            
        elif signal_type == "ma_cross":
            # 이동평균 교차 시그널
            short_period = request.get("short_ma", 20)
            long_period = request.get("long_ma", 50)
            
            sma_short_result = calculate_sma(price_data, short_period)
            sma_long_result = calculate_sma(price_data, long_period)
            
            signals = generate_moving_average_signals(price_data, sma_short_result, sma_long_result)
            
        elif signal_type == "composite":
            # 복합 시그널 (RSI + MA)
            indicators = {}
            
            # RSI 계산
            indicators['rsi_14'] = calculate_rsi(price_data, 14)
            
            # 이동평균 계산
            indicators['sma_20'] = calculate_sma(price_data, 20)
            indicators['sma_50'] = calculate_sma(price_data, 50)
            
            # 기본 룰 설정
            rules = request.get("rules", {
                "buy": {"rsi": {"below": 30}, "macd": {"golden_cross": True}},
                "sell": {"rsi": {"above": 70}}
            })
            
            signals = generate_composite_signals(price_data, indicators, rules)
        
        # 성과 분석
        performance = calculate_signal_performance(signals, price_data)
        
        return {
            "ticker": ticker,
            "period": period,
            "signal_type": signal_type,
            "total_signals": len(signals),
            "signals": signals[-20:] if len(signals) > 20 else signals,  # 최근 20개만
            "performance": performance
        }
        
    except Exception as e:
        return {"error": f"Signal generation failed: {str(e)}", "signals": []}
@router.post("/backtest")
async def run_strategy_backtest(request: BacktestRequest, db: Session = Depends(get_db)):
    """
    전략 백테스트
    - 시그널 기반 백테스트
    - 성과 분석
    - Buy & Hold 비교
    """
    try:
        from app.utils.backtest import run_backtest, compare_strategies
        from app.utils.signals import generate_rsi_signals, generate_moving_average_signals
        
        ticker = request.tickers[0] if request.tickers else "AAPL"
            
        period = request.period
        initial_cash = request.initial_cash
        strategy = request.strategy
        
        # 가격 데이터 조회
        query = text(f"""
        SELECT timestamp, open, high, low, close, volume 
        FROM stock_price_1d 
        WHERE ticker = '{ticker}' 
        ORDER BY timestamp DESC 
        LIMIT 500
        """)
        
        result = db.execute(query).fetchall()
        
        if not result:
            return {"error": f"No data found for {ticker}", "backtest": {}}
        
        # 데이터 변환
        price_data = []
        for row in result:
            price_data.append({
                'date': str(row.timestamp),
                'open': float(row.open),
                'high': float(row.high), 
                'low': float(row.low),
                'close': float(row.close),
                'volume': int(row.volume)
            })
        
        price_data.reverse()  # 날짜 순으로 정렬
        
        # 전략별 시그널 생성
        strategy_name = strategy.get("name", "RSI Strategy")
        
        if "RSI" in strategy_name.upper():
            # RSI 전략
            rsi_result = calculate_rsi(price_data, 14)
            
            buy_threshold = strategy.get("rsi_buy", 30)
            sell_threshold = strategy.get("rsi_sell", 70)
            signals = generate_rsi_signals(rsi_result, buy_threshold, sell_threshold)
            
        elif "MA" in strategy_name.upper() or "MOVING" in strategy_name.upper():
            # 이동평균 전략
            short_period = strategy.get("short_ma", 20)
            long_period = strategy.get("long_ma", 50)
            
            sma_short_result = calculate_sma(price_data, short_period)
            sma_long_result = calculate_sma(price_data, long_period)
            
            signals = generate_moving_average_signals(price_data, sma_short_result, sma_long_result)
        else:
            # 기본 RSI 전략
            rsi_result = calculate_rsi(price_data, 14)
            signals = generate_rsi_signals(rsi_result, 30, 70)
        
        # 백테스트 실행
        backtest_result = run_backtest(price_data, signals, initial_cash)
        
        if "error" in backtest_result:
            return {"error": backtest_result["error"], "backtest": {}}
        
        # 추가 정보
        backtest_result["ticker"] = ticker
        backtest_result["strategy"] = strategy
        backtest_result["period"] = period
        backtest_result["data_points"] = len(price_data)
        backtest_result["signals_generated"] = len(signals)
        
        return backtest_result
        
    except Exception as e:
        return {"error": f"Backtest failed: {str(e)}", "backtest": {}}


@router.post("/advanced-signals")
async def generate_advanced_signals(request: dict, db: Session = Depends(get_db)):
    """
    고급 복합 시그널 생성
    - 다중 지표 종합 분석
    - 신뢰도 기반 필터링  
    - 추세 확인
    """
    try:
        from app.utils.advanced_signals import generate_advanced_signals, filter_signals_by_trend, calculate_signal_strength
        
        ticker = request.get("ticker", "AAPL")
        period = request.get("period", "1y")
        min_confidence = request.get("min_confidence", 60)
        trend_filter = request.get("trend_filter", True)
        
        # 가격 데이터 조회  
        query = text(f"""
        SELECT timestamp, open, high, low, close, volume 
        FROM stock_price_1d 
        WHERE ticker = '{ticker}' 
        ORDER BY timestamp DESC 
        LIMIT 500
        """)
        
        result = db.execute(query).fetchall()
        
        if not result:
            return {"error": f"No data found for {ticker}", "signals": []}
        
        # 데이터 변환
        price_data = []
        for row in result:
            price_data.append({
                'date': str(row.timestamp),
                'open': float(row.open),
                'high': float(row.high), 
                'low': float(row.low),
                'close': float(row.close),
                'volume': int(row.volume)
            })
        
        price_data.reverse()  # 날짜 순으로 정렬
        
        # 모든 지표 계산
        all_indicators = {}
        
        # RSI 계산
        all_indicators['rsi_14'] = calculate_rsi(price_data, 14)
        
        # 이동평균 계산  
        all_indicators['sma_20'] = calculate_sma(price_data, 20)
        all_indicators['sma_50'] = calculate_sma(price_data, 50)
        all_indicators['ema_12'] = calculate_ema(price_data, 12)
        all_indicators['ema_26'] = calculate_ema(price_data, 26)
        
        # 분석 규칙 설정
        analysis_rules = {
            "min_confidence": min_confidence,
            "require_volume": request.get("require_volume", False),
            "trend_confirmation": trend_filter
        }
        
        # 고급 시그널 생성
        signals = generate_advanced_signals(price_data, all_indicators, analysis_rules)
        
        # 추세 필터링 적용
        if trend_filter:
            signals = filter_signals_by_trend(signals, price_data)
        
        # 최신 시장 상황 분석
        if price_data:
            latest_price = price_data[-1]
            latest_indicators = {
                'price': latest_price['close']
            }
            
            # 최신 지표값들 수집
            for indicator_name, indicator_data in all_indicators.items():
                if indicator_data:
                    latest_point = next((point for point in reversed(indicator_data) 
                                       if point['date'] == latest_price['date']), None)
                    if latest_point:
                        if indicator_name == 'rsi_14':
                            latest_indicators['rsi'] = latest_point['value']
                        elif indicator_name == 'sma_20':
                            latest_indicators['sma_20'] = latest_point['value']
                        elif indicator_name == 'sma_50':
                            latest_indicators['sma_50'] = latest_point['value']
            
            # 현재 시장 상황 분석
            current_analysis = calculate_signal_strength(latest_indicators, analysis_rules)
        else:
            current_analysis = {"signal": "NO_DATA", "confidence": 0}
        
        return {
            "ticker": ticker,
            "period": period,
            "analysis_type": "advanced_multi_indicator",
            "total_signals": len(signals),
            "signals": signals[-15:] if len(signals) > 15 else signals,  # 최근 15개
            "current_market_analysis": current_analysis,
            "parameters": {
                "min_confidence": min_confidence,
                "trend_filter": trend_filter,
                "indicators_used": list(all_indicators.keys())
            },
            "signal_summary": {
                "strong_buy": len([s for s in signals if s['signal'] == 'STRONG_BUY']),
                "buy": len([s for s in signals if s['signal'] == 'BUY']),
                "hold": len([s for s in signals if s['signal'] == 'HOLD']),
                "sell": len([s for s in signals if s['signal'] == 'SELL']),
                "strong_sell": len([s for s in signals if s['signal'] == 'STRONG_SELL']),
                "avg_confidence": round(sum(s['confidence'] for s in signals) / max(len(signals), 1), 1)
            }
        }
        
    except Exception as e:
        return {"error": f"Advanced signal generation failed: {str(e)}", "signals": []}


@router.post("/llm-analysis")
async def llm_market_analysis(request: dict, db: Session = Depends(get_db)):
    """
    LLM 기반 시장 분석
    - 기존 tools API 결과들을 종합하여 LLM 분석
    - 룰베이스 + LLM 해석의 하이브리드 접근
    """
    try:
        from app.utils.llm_analysis import format_data_for_llm, create_analysis_prompt, parse_llm_response, validate_llm_analysis
        
        ticker = request.get("ticker", "AAPL")
        analysis_type = request.get("analysis_type", "comprehensive")
        llm_provider = request.get("llm_provider", "mock")
        
        # === 1단계: 기존 tools API들 활용해서 데이터 수집 ===
        
        # 가격 데이터 수집 (직접 DB 쿼리)
        query = text(f"""
        SELECT timestamp, open, high, low, close, volume 
        FROM stock_price_1d 
        WHERE ticker = '{ticker}' 
        ORDER BY timestamp DESC 
        LIMIT 100
        """)
        
        result = db.execute(query).fetchall()
        
        if not result:
            return {"error": f"가격 데이터 조회 실패: No data found for {ticker}", "analysis": {}}
        
        # 데이터 변환
        price_data = []
        for row in result:
            price_data.append({
                'date': str(row.timestamp),
                'open': float(row.open),
                'high': float(row.high), 
                'low': float(row.low),
                'close': float(row.close),
                'volume': int(row.volume)
            })
        
        price_data.reverse()  # 날짜 순으로 정렬
        
        # 지표 계산
        indicators_data = {
            'rsi_14': calculate_rsi(price_data, 14),
            'sma_20': calculate_sma(price_data, 20),
            'sma_50': calculate_sma(price_data, 50),
            'ema_12': calculate_ema(price_data, 12)
        }
        
        # 룰베이스 시그널 생성 (기존 generate_signals 함수 활용)
        signals_request = {
            "ticker": ticker,
            "signal_type": "rsi",
            "rsi_buy": 30,
            "rsi_sell": 70
        }
        rsi_signals_response = await generate_signals(signals_request, db)
        
        # 고급 시그널 생성 (기존 generate_advanced_signals 함수 활용)
        advanced_signals_request = {
            "ticker": ticker,
            "min_confidence": 60,
            "trend_filter": True
        }
        advanced_signals_response = await generate_advanced_signals(advanced_signals_request, db)
        
        # === 2단계: 수집된 데이터를 LLM 분석용으로 포맷팅 ===
        
        # 가격 변화율 계산
        price_changes = []
        if len(price_data) >= 2:
            for i in range(1, min(len(price_data), 21)):  # 최근 20일
                prev_close = price_data[-(i+1)]["close"]
                curr_close = price_data[-i]["close"]
                change_pct = ((curr_close - prev_close) / prev_close) * 100
                price_changes.append({
                    "date": price_data[-i]["date"],
                    "change_pct": round(change_pct, 2),
                    "close": curr_close,
                    "volume": price_data[-i]["volume"]
                })
        
        # 현재 지표값들 추출
        current_indicators = {}
        for indicator_name, indicator_data in indicators_data.items():
            if indicator_data:
                latest_value = indicator_data[-1]["value"] if indicator_data else None
                current_indicators[indicator_name] = latest_value
        
        # 볼륨 분석
        volume_analysis = {}
        if len(price_data) >= 10:
            recent_volumes = [p["volume"] for p in price_data[-10:]]
            avg_volume = sum(recent_volumes) / len(recent_volumes)
            current_volume = price_data[-1]["volume"]
            volume_analysis = {
                "current_volume": current_volume,
                "avg_10d_volume": round(avg_volume),
                "volume_ratio": round(current_volume / avg_volume, 2),
                "volume_trend": "증가" if current_volume > avg_volume else "감소"
            }
        
        analysis_data = {
            "ticker": ticker,
            "analysis_timestamp": datetime.now().isoformat(),
            "price_data": {
                "current_price": price_data[-1]["close"] if price_data else 0,
                "price_change_1d": round(((price_data[-1]["close"] - price_data[-2]["close"]) / price_data[-2]["close"]) * 100, 2) if len(price_data) >= 2 else 0,
                "price_change_5d": round(((price_data[-1]["close"] - price_data[-6]["close"]) / price_data[-6]["close"]) * 100, 2) if len(price_data) >= 6 else 0,
                "price_change_20d": round(((price_data[-1]["close"] - price_data[-21]["close"]) / price_data[-21]["close"]) * 100, 2) if len(price_data) >= 21 else 0,
                "recent_price_action": price_changes[:10],  # 최근 10일
                "high_52w": max([p["high"] for p in price_data]) if price_data else 0,
                "low_52w": min([p["low"] for p in price_data]) if price_data else 0,
                "data_points": len(price_data)
            },
            "technical_indicators": {
                "current_values": current_indicators,
                "rsi_14": {
                    "current": current_indicators.get("rsi_14", 0),
                    "status": "overbought" if current_indicators.get("rsi_14", 50) > 70 else "oversold" if current_indicators.get("rsi_14", 50) < 30 else "neutral",
                    "recent_history": [{"date": point["date"], "value": point["value"]} for point in indicators_data.get("rsi_14", [])[-5:]]
                },
                "moving_averages": {
                    "sma_20": current_indicators.get("sma_20", 0),
                    "sma_50": current_indicators.get("sma_50", 0),
                    "price_vs_sma20": round(((price_data[-1]["close"] / current_indicators.get("sma_20", price_data[-1]["close"])) - 1) * 100, 2) if current_indicators.get("sma_20") else 0,
                    "price_vs_sma50": round(((price_data[-1]["close"] / current_indicators.get("sma_50", price_data[-1]["close"])) - 1) * 100, 2) if current_indicators.get("sma_50") else 0,
                    "ma_alignment": "bullish" if current_indicators.get("sma_20", 0) > current_indicators.get("sma_50", 0) else "bearish"
                }
            },
            "volume_analysis": volume_analysis,
            "rule_based_signals": {
                "rsi_signals": {
                    "total_signals": rsi_signals_response.get("total_signals", 0),
                    "buy_signals": rsi_signals_response.get("performance", {}).get("buy_signals", 0),
                    "sell_signals": rsi_signals_response.get("performance", {}).get("sell_signals", 0),
                    "recent_signals": rsi_signals_response.get("signals", [])[:8],  # 최근 8개
                    "signal_frequency": rsi_signals_response.get("total_signals", 0) / max(len(price_data) / 30, 1)  # 월평균 신호 횟수
                },
                "advanced_signals": {
                    "signal_summary": advanced_signals_response.get("signal_summary", {}),
                    "current_market_analysis": advanced_signals_response.get("current_market_analysis", {}),
                    "recent_signals": advanced_signals_response.get("signals", [])[:5],
                    "total_signals": advanced_signals_response.get("total_signals", 0),
                    "avg_confidence": advanced_signals_response.get("signal_summary", {}).get("avg_confidence", 0)
                }
            },
            "market_context": {
                "volatility_estimate": round(sum([abs(pc["change_pct"]) for pc in price_changes[:10]]) / min(len(price_changes), 10), 2) if price_changes else 0,
                "trend_direction": "up" if price_data[-1]["close"] > price_data[-10]["close"] else "down" if len(price_data) >= 10 else "neutral",
                "momentum": "strong" if abs(price_changes[0]["change_pct"]) > 2 else "weak" if price_changes else "neutral"
            }
        }
        
        # JSON 형태로 LLM에게 전달할 데이터 포맷팅
        formatted_data = json.dumps(analysis_data, indent=2, ensure_ascii=False)
        
        # === 3단계: LLM 분석 프롬프트 생성 ===
        
        enhanced_prompt = f"""
당신은 15년 경력의 전문 주식 시장 애널리스트입니다. 
제공된 종합적인 기술적 데이터를 바탕으로 {ticker} 주식을 분석해주세요.

=== 기술적 분석 데이터 ===
{formatted_data}

=== 분석 요구사항 ===
다음 항목들을 포함한 상세한 다차원 분석을 제공해주세요:

1. **기술적 신호 분석**: 
   - RSI 신호 평가 (과매수/과매도 상태)
   - 이동평균선 추세와 교차점 분석
   - 고급 복합 신호들의 신뢰도 평가

2. **신호 일관성 및 충돌**:
   - 서로 다른 지표들 간의 일치/불일치 식별
   - 상충되는 신호들과 그 의미
   - 전반적인 신호 강도와 확신 수준 평가

3. **시장 맥락 및 타이밍**:
   - 최근 가격 움직임 대비 현재 시장 위치
   - 거래량 분석과 가격 움직임의 확인
   - 단기 vs 중기 추세 정렬 상태

4. **리스크 평가**:
   - 핵심 기술적 지지/저항 수준
   - 잠재적 반전 신호 또는 추세 지속 패턴
   - 시장 변동성 고려사항

5. **투자 추천**:
   - 명확한 매수/매도/보유 추천과 확신 수준
   - 진입/청산 전략 및 타이밍 고려사항
   - 신호 강도에 기반한 포지션 사이징 추천

6. **추가 인사이트**:
   - 기술적 분석에서 놓칠 수 있는 요소들 (펀더멘털, 뉴스, 거시경제 요인)
   - 대안 시나리오와 비상 계획
   - 시장 체제 고려사항

=== 응답 형식 ===
Respond in JSON format with detailed analysis:
{{
  "recommendation": "BUY|SELL|HOLD",
  "confidence": 1-100,
  "executive_summary": "2-3 sentence investment thesis",
  "technical_analysis": {{
    "rsi_interpretation": "Detailed RSI analysis with specific levels and implications",
    "moving_average_analysis": "SMA/EMA trend analysis and crossover signals",
    "advanced_signals_assessment": "Composite signal evaluation and reliability",
    "volume_analysis": "Volume confirmation and divergence analysis"
  }},
  "signal_synthesis": {{
    "bullish_factors": ["Specific bullish technical factors"],
    "bearish_factors": ["Specific bearish technical factors"],
    "signal_consistency": "Overall consistency assessment between indicators",
    "conviction_level": "High/Medium/Low with reasoning"
  }},
  "risk_reward": {{
    "upside_potential": "Specific upside targets and probability",
    "downside_risk": "Key support levels and risk scenarios", 
    "risk_reward_ratio": "Estimated risk/reward ratio",
    "stop_loss_levels": "Recommended stop-loss levels"
  }},
  "trading_strategy": {{
    "entry_strategy": "Optimal entry points and timing",
    "exit_strategy": "Profit-taking and stop-loss strategy",
    "position_sizing": "Recommended position size based on conviction",
    "time_horizon": "Recommended holding period"
  }},
  "market_context": {{
    "current_trend": "Short/medium/long-term trend assessment",
    "momentum_analysis": "Price momentum and sustainability",
    "volatility_regime": "Current volatility environment",
    "market_positioning": "Where stock stands in current market cycle"
  }},
  "limitations_and_caveats": [
    "Key limitations of this technical analysis",
    "External factors not captured in technical data",
    "Scenarios that could invalidate this analysis"
  ],
  "detailed_reasoning": "Comprehensive step-by-step analysis explaining the investment thesis"
}}
"""
        
        # === 4단계: LLM 분석 실행 ===
        
        # LLM 분석 수행
        from app.utils.llm_analysis import call_llm_api, parse_llm_response
        
        try:
            # 실제 LLM 호출 또는 Mock 응답
            system_message = "당신은 15년 이상의 경력을 가진 수석 퀀트 애널리스트이자 포트폴리오 매니저입니다. 기술적 분석, 리스크 관리, 체계적 거래 전략에 전문성을 가지고 있습니다. 기술적 지표를 바탕으로 상세하고 실행 가능한 투자 분석을 한국어로 제공해주세요. 모든 응답은 반드시 한국어로 작성해주세요."
            
            llm_response = await call_llm_api(
                prompt=enhanced_prompt,
                provider=llm_provider,
                system_message=system_message
            )
            
            # LLM 응답 파싱
            llm_analysis = parse_llm_response(llm_response)
            
        except Exception as llm_error:
            # LLM 호출 실패시 fallback
            print(f"LLM API 호출 실패: {llm_error}")
            
            # 룰베이스 결과들 종합해서 Mock 분석 생성
            rsi_signals_count = rsi_signals_response.get("total_signals", 0)
            advanced_summary = advanced_signals_response.get("signal_summary", {})
            current_analysis = advanced_signals_response.get("current_market_analysis", {})
            
            # 신호 일치성 분석
            buy_signals = advanced_summary.get("buy", 0) + advanced_summary.get("strong_buy", 0)
            sell_signals = advanced_summary.get("sell", 0) + advanced_summary.get("strong_sell", 0)
            
            if buy_signals > sell_signals:
                mock_recommendation = "BUY"
                mock_confidence = min(85, 60 + (buy_signals - sell_signals) * 5)
                consistency = "매수 신호 우세"
            elif sell_signals > buy_signals:
                mock_recommendation = "SELL"
                mock_confidence = min(85, 60 + (sell_signals - buy_signals) * 5)
                consistency = "매도 신호 우세"
            else:
                mock_recommendation = "HOLD"
                mock_confidence = 50
                consistency = "신호 혼재"
            
            llm_analysis = {
                "recommendation": mock_recommendation,
                "confidence": mock_confidence,
                "summary": f"룰베이스 분석 종합: {consistency}로 {mock_recommendation} 추천",
                "rule_analysis": {
                    "consistency": consistency,
                    "strengths": [f"RSI 시그널 {rsi_signals_count}개 생성", f"고급분석 평균 신뢰도 {advanced_summary.get('avg_confidence', 0)}%"],
                    "weaknesses": ["시장 감정 미반영", "뉴스 영향 미고려"]
                },
                "additional_insights": [
                    "거시경제 상황 고려 필요",
                    "섹터별 트렌드 분석 권장",
                    "변동성 구간에서 포지션 크기 조절 고려"
                ],
                "risks": [
                    "룰베이스 분석의 한계",
                    "급격한 시장 변화 시 지연 반응",
                    "뉴스/이벤트 영향 미반영"
                ],
                "reasoning": f"RSI 기반 {rsi_signals_count}개 신호와 고급 복합 분석 결과를 종합. {consistency} 상황에서 {mock_recommendation} 포지션이 적절해 보임."
            }
        
        # TODO: 실제 LLM API 호출
        # elif llm_provider == "openai":
        #     llm_analysis = await call_openai_api(enhanced_prompt)
        
        # === 5단계: 결과 종합 및 반환 ===
        
        return {
            "ticker": ticker,
            "analysis_type": "hybrid_llm_analysis",
            "timestamp": datetime.now().isoformat(),
            "llm_analysis": llm_analysis,
            "source_data": {
                "price_points": len(price_data),
                "indicators_calculated": len(indicators_data),
                "rsi_signals": rsi_signals_response.get("total_signals", 0),
                "advanced_signals": len(advanced_signals_response.get("signals", []))
            },
            "rule_based_summary": {
                "rsi_signals": rsi_signals_response.get("performance", {}),
                "advanced_analysis": advanced_signals_response.get("signal_summary", {}),
                "current_technical_state": advanced_signals_response.get("current_market_analysis", {})
            },
            "methodology": "기존 tools API 결과를 LLM이 종합 분석",
            "disclaimer": "이는 참고용 분석이며 투자 결정의 유일한 근거로 사용해서는 안됩니다."
        }
        
    except Exception as e:
        return {"error": f"LLM analysis failed: {str(e)}", "analysis": {}}


@router.post("/smart-analysis")
async def smart_llm_analysis(request: dict, db: Session = Depends(get_db)):
    """
    스마트 LLM 분석 - Function Calling 방식
    - LLM이 필요에 따라 적절한 도구를 선택하여 사용
    - 단계별 분석 과정 추적 가능
    """
    try:
        from app.utils.function_calling import get_available_tools, execute_function_call, format_function_result_for_llm
        
        user_query = request.get("query", "AAPL 주식을 분석해주세요")
        ticker = request.get("ticker", "AAPL")
        max_iterations = request.get("max_iterations", 5)  # 최대 도구 사용 횟수
        llm_provider = request.get("llm_provider", "mock")
        
        # LLM이 사용할 수 있는 도구들 정의
        available_tools = get_available_tools()
        
        # 분석 과정 추적
        analysis_steps = []
        function_calls = []
        
        # === 실제 OpenAI Function Calling ===
        if llm_provider == "openai":
            from app.utils.llm_analysis import call_openai_api
            
            # 시작 메시지 설정
            initial_prompt = f"""
당신은 전문 주식 분석가입니다. {ticker} 주식을 분석해주세요.

사용자 요청: {user_query}

분석을 위해 필요한 도구들을 단계별로 선택하여 사용하세요:
1. 먼저 가격 데이터를 조회하세요
2. 기술적 지표를 계산하세요  
3. 매매 시그널을 생성하세요
4. 필요시 고급 분석을 수행하세요

모든 분석을 마친 후 한국어로 최종 투자 의견을 제시해주세요.
"""
            
            # OpenAI API 호출을 위한 메시지 구성
            messages = [
                {
                    "role": "system", 
                    "content": "당신은 전문 주식 분석가입니다. 제공된 도구들을 사용하여 체계적으로 주식을 분석하고, 모든 응답을 한국어로 제공하세요."
                },
                {"role": "user", "content": initial_prompt}
            ]
            
            # Function calling 진행
            step = 1
            while step <= max_iterations:
                try:
                    # OpenAI API 호출
                    response = await call_openai_api(
                        messages=messages,
                        tools=available_tools,
                        tool_choice="auto"
                    )
                    
                    if not response.get("success"):
                        break
                        
                    response_message = response["response"]
                    
                    # LLM의 사고 과정 기록
                    if response_message.get("content"):
                        analysis_steps.append({
                            "step": step,
                            "action": "llm_reasoning",
                            "thought": response_message["content"],
                            "timestamp": datetime.now().isoformat()
                        })
                    
                    # Function call 확인
                    tool_calls = response_message.get("tool_calls", [])
                    
                    if not tool_calls:
                        # 더 이상 function call이 없으면 종료
                        break
                    
                    # 각 tool call 실행
                    for tool_call in tool_calls:
                        function_name = tool_call.function.name
                        arguments = json.loads(tool_call.function.arguments)
                        
                        # 함수 실행
                        function_result = await execute_function_call(
                            function_name, 
                            arguments, 
                            db
                        )
                        
                        # 결과 저장
                        function_calls.append({
                            "call": {
                                "function": function_name,
                                "arguments": arguments
                            },
                            "result": function_result,
                            "formatted_result": format_function_result_for_llm(function_name, function_result)
                        })
                        
                        # LLM에게 함수 결과 전달
                        # OpenAI API 형식에 맞게 assistant 메시지 구성
                        assistant_message = {
                            "role": "assistant",
                            "content": response_message.get("content"),
                            "tool_calls": [
                                {
                                    "id": tool_call.id,
                                    "type": "function",
                                    "function": {
                                        "name": tool_call.function.name,
                                        "arguments": tool_call.function.arguments
                                    }
                                } for tool_call in tool_calls
                            ]
                        }
                        messages.append(assistant_message)
                        
                        # JSON serialization을 안전하게 처리
                        try:
                            # FastAPI Query 객체나 기타 직렬화 불가능한 객체 처리
                            def safe_json_serialize(obj):
                                try:
                                    return json.dumps(obj, ensure_ascii=False, default=str)
                                except (TypeError, ValueError):
                                    return json.dumps(str(obj), ensure_ascii=False)
                            
                            result_content = safe_json_serialize(function_result)
                        except Exception as json_error:
                            result_content = f"Function result serialization error: {str(json_error)}"
                        
                        messages.append({
                            "role": "tool",
                            "tool_call_id": tool_call.id,
                            "content": result_content
                        })
                    
                    step += 1
                    
                except Exception as e:
                    analysis_steps.append({
                        "step": step,
                        "action": "error",
                        "thought": f"OpenAI API 호출 중 오류 발생: {str(e)}",
                        "timestamp": datetime.now().isoformat()
                    })
                    break
            
            # 최종 분석 요청
            if function_calls:
                try:
                    messages.append({
                        "role": "user",
                        "content": f"""
모든 도구 사용이 완료되었습니다. 다음 데이터를 바탕으로 {ticker} 주식에 대한 최종 투자 의견을 한국어로 제시해주세요:

1. 투자 추천 (STRONG_BUY, BUY, HOLD, SELL, STRONG_SELL 중 하나)
2. 신뢰도 (0-100%)
3. 핵심 근거 3가지
4. 주요 리스크 요인

모든 응답은 반드시 한국어로 작성해주세요.
"""
                    })
                    
                    final_response = await call_openai_api(
                        messages=messages,
                        tools=None,  # 최종 응답에서는 도구 사용 안함
                        tool_choice=None
                    )
                    
                    if final_response.get("success"):
                        final_analysis_text = final_response["response"]["content"]
                        analysis_steps.append({
                            "step": step + 1,
                            "action": "final_analysis",
                            "thought": "OpenAI로부터 최종 분석을 성공적으로 받았습니다.",
                            "timestamp": datetime.now().isoformat()
                        })
                    else:
                        error_msg = final_response.get("error", "Unknown error")
                        final_analysis_text = f"최종 분석 생성 중 오류가 발생했습니다: {error_msg}"
                        analysis_steps.append({
                            "step": step + 1,
                            "action": "final_analysis_error",
                            "thought": f"최종 분석 API 호출 실패: {error_msg}",
                            "timestamp": datetime.now().isoformat()
                        })
                except Exception as final_error:
                    final_analysis_text = f"최종 분석 요청 중 예외 발생: {str(final_error)}"
                    analysis_steps.append({
                        "step": step + 1,
                        "action": "final_analysis_exception",
                        "thought": f"최종 분석 요청 중 예외: {str(final_error)}",
                        "timestamp": datetime.now().isoformat()
                    })
            else:
                final_analysis_text = "도구 사용 중 오류가 발생하여 분석을 완료할 수 없습니다."
        
        # === Mock LLM Function Calling 시뮬레이션 (fallback) ===
        else:
            # 기존 Mock 로직을 fallback으로 유지
            analysis_steps.append({
                "step": 1,
                "action": "query_analysis", 
                "thought": f"사용자가 {ticker} 주식 분석을 요청했습니다. 먼저 현재 가격과 최근 동향을 확인하겠습니다.",
                "timestamp": datetime.now().isoformat()
            })
            
            # 가격 데이터 조회
            price_result = await execute_function_call("get_stock_prices", {"ticker": ticker}, db)
            function_calls.append({
                "call": {"function": "get_stock_prices", "arguments": {"ticker": ticker}},
                "result": price_result,
                "formatted_result": format_function_result_for_llm("get_stock_prices", price_result)
            })
            
            # 기술적 지표 계산
            if "error" not in price_result:
                indicator_result = await execute_function_call(
                    "calculate_technical_indicators",
                    {"ticker": ticker, "indicators": ["rsi_14", "sma_20"]}, 
                    db
                )
                function_calls.append({
                    "call": {"function": "calculate_technical_indicators", "arguments": {"ticker": ticker, "indicators": ["rsi_14", "sma_20"]}},
                    "result": indicator_result,
                    "formatted_result": format_function_result_for_llm("calculate_technical_indicators", indicator_result)
                })
            
            final_analysis_text = "Mock 분석: 데이터 기반으로 중립적 의견을 제시합니다."
        
        # === 최종 종합 분석 ===
        
        # 모든 함수 호출 결과 수집
        all_results = {call["call"]["function"]: call["result"] for call in function_calls}
        
        # OpenAI 결과 파싱 (실제 LLM 응답 사용)
        if llm_provider == "openai" and 'final_analysis_text' in locals():
            # LLM 응답에서 구조화된 정보 추출 시도
            recommendation = "HOLD"
            confidence = 60
            reasoning = final_analysis_text
            
            # 간단한 키워드 기반 추천 추출
            text_lower = final_analysis_text.lower()
            if "strong_buy" in text_lower or "강력 매수" in text_lower:
                recommendation = "STRONG_BUY"
                confidence = 85
            elif "buy" in text_lower or "매수" in text_lower:
                recommendation = "BUY"
                confidence = 75
            elif "sell" in text_lower or "매도" in text_lower:
                recommendation = "SELL"
                confidence = 70
            elif "strong_sell" in text_lower or "강력 매도" in text_lower:
                recommendation = "STRONG_SELL"
                confidence = 80
            
            final_analysis = {
                "recommendation": recommendation,
                "confidence": confidence,
                "reasoning": reasoning,
                "key_findings": [
                    f"총 {len(function_calls)}개 도구 사용",
                    f"OpenAI GPT-4를 통한 실시간 분석",
                    "한국어 전문 분석 리포트 생성"
                ],
                "methodology": "실제 LLM Function Calling을 통한 단계별 전문 분석",
                "llm_response": final_analysis_text
            }
        else:
            # Mock 분석 결과 (fallback)
            if "get_stock_prices" in all_results and "error" not in all_results["get_stock_prices"]:
                current_price = all_results["get_stock_prices"]["data"][0]["close"]
                
                # RSI 기반 추천 (간단한 로직)
                if "calculate_technical_indicators" in all_results:
                    indicators = all_results["calculate_technical_indicators"].get("results", {})
                    rsi_data = indicators.get("rsi_14", [])
                    if rsi_data:
                        current_rsi = rsi_data[-1]["value"]
                        
                        if current_rsi < 30:
                            recommendation = "STRONG_BUY"
                            confidence = 85
                            reasoning = f"RSI {current_rsi:.1f}로 강한 과매도 상태, 반등 가능성 높음"
                        elif current_rsi < 40:
                            recommendation = "BUY" 
                            confidence = 70
                            reasoning = f"RSI {current_rsi:.1f}로 과매도 상태, 매수 고려 구간"
                        elif current_rsi > 70:
                            recommendation = "SELL"
                            confidence = 75
                            reasoning = f"RSI {current_rsi:.1f}로 과매수 상태, 매도 고려 구간"
                        else:
                            recommendation = "HOLD"
                            confidence = 60
                            reasoning = f"RSI {current_rsi:.1f}로 중립 구간, 추가 관찰 필요"
                    else:
                        recommendation = "HOLD"
                        confidence = 50
                        reasoning = "기술적 지표 데이터 부족"
                else:
                    recommendation = "HOLD"
                    confidence = 50
                    reasoning = "기술적 분석 데이터 없음"
            else:
                recommendation = "HOLD"
                confidence = 30
                reasoning = "가격 데이터 조회 실패"
            
            final_analysis = {
                "recommendation": recommendation,
                "confidence": confidence,
                "reasoning": reasoning,
                "key_findings": [
                    f"총 {len(function_calls)}개 도구 사용",
                    f"분석 과정 {len(analysis_steps)}단계 진행",
                    "데이터 기반 객관적 분석 수행"
                ],
                "methodology": "Mock LLM Function Calling 시뮬레이션"
            }
        
        return {
            "ticker": ticker,
            "user_query": user_query,
            "analysis_type": "smart_function_calling",
            "timestamp": datetime.now().isoformat(),
            "analysis_process": {
                "steps": analysis_steps,
                "function_calls": function_calls,
                "tools_used": [call["call"]["function"] for call in function_calls]
            },
            "final_analysis": final_analysis,
            "raw_data": all_results,
            "available_tools": [tool["function"]["name"] for tool in available_tools],
            "disclaimer": "이는 LLM Function Calling 데모이며 실제 투자 결정에 사용하지 마세요."
        }
        
    except Exception as e:
        return {"error": f"Smart analysis failed: {str(e)}", "analysis": {}}


@router.get("/news")
async def get_news(
    ticker: Optional[str] = Query(None, description="주식 티커"),
    keyword: Optional[str] = Query(None, description="검색 키워드"),
    date_range: str = Query("7d", description="날짜 범위"),
    limit: int = Query(10, description="결과 개수")
):
    """
    뉴스 데이터 조회 (원문/요약/감성분석)
    
    반환 예시:
    {
        "ticker": "AAPL",
        "news": [
            {
                "title": "Apple Reports Strong Q4 Earnings",
                "summary": "Apple exceeded expectations...",
                "sentiment": "positive",
                "sentiment_score": 0.85,
                "url": "https://...",
                "published_at": "2024-01-15T10:30:00Z"
            }
        ]
    }
    """
    # TODO: 뉴스 API 연동 및 감성분석 구현
    
    return {
        "ticker": ticker,
        "keyword": keyword,
        "date_range": date_range,
        "news": [],
        "message": "뉴스 기능 구현 예정"
    }
