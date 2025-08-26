"""
Trading Signals Generator
기본적인 매매 시그널 생성 유틸리티
"""

from typing import List, Dict, Any, Optional
from datetime import datetime

def generate_rsi_signals(rsi_data: List[Dict], buy_threshold: float = 30, sell_threshold: float = 70) -> List[Dict]:
    """RSI 기반 매매 시그널 생성"""
    signals = []
    
    for i, point in enumerate(rsi_data):
        if point['value'] <= buy_threshold:
            signals.append({
                "date": point['date'],
                "signal": "BUY", 
                "price": None,  # 가격은 별도로 조회 필요
                "reason": f"RSI oversold ({point['value']:.2f} <= {buy_threshold})",
                "indicator": "RSI",
                "value": point['value']
            })
        elif point['value'] >= sell_threshold:
            signals.append({
                "date": point['date'],
                "signal": "SELL",
                "price": None,
                "reason": f"RSI overbought ({point['value']:.2f} >= {sell_threshold})",
                "indicator": "RSI", 
                "value": point['value']
            })
    
    return signals


def generate_moving_average_signals(price_data: List[Dict], sma_short: List[Dict], sma_long: List[Dict]) -> List[Dict]:
    """이동평균 크로스오버 시그널 생성"""
    signals = []
    
    if len(sma_short) < 2 or len(sma_long) < 2:
        return signals
    
    # 날짜별로 데이터 정렬 및 매칭
    price_dict = {p['date']: p for p in price_data}
    sma_short_dict = {s['date']: s['value'] for s in sma_short}
    sma_long_dict = {s['date']: s['value'] for s in sma_long}
    
    prev_short = None
    prev_long = None
    
    for i, short_point in enumerate(sma_short[1:], 1):
        date = short_point['date']
        
        if date not in sma_long_dict:
            continue
            
        current_short = short_point['value']
        current_long = sma_long_dict[date]
        
        if prev_short is not None and prev_long is not None:
            # Golden Cross (단기 > 장기로 교차)
            if prev_short <= prev_long and current_short > current_long:
                signals.append({
                    "date": date,
                    "signal": "BUY",
                    "price": price_dict.get(date, {}).get('close'),
                    "reason": f"Golden Cross (Short MA: {current_short:.2f} > Long MA: {current_long:.2f})",
                    "indicator": "MA_Cross",
                    "short_ma": current_short,
                    "long_ma": current_long
                })
            
            # Death Cross (단기 < 장기로 교차)
            elif prev_short >= prev_long and current_short < current_long:
                signals.append({
                    "date": date,
                    "signal": "SELL", 
                    "price": price_dict.get(date, {}).get('close'),
                    "reason": f"Death Cross (Short MA: {current_short:.2f} < Long MA: {current_long:.2f})",
                    "indicator": "MA_Cross",
                    "short_ma": current_short,
                    "long_ma": current_long
                })
        
        prev_short = current_short
        prev_long = current_long
    
    return signals


def generate_composite_signals(
    price_data: List[Dict], 
    indicators: Dict[str, List[Dict]], 
    rules: Dict[str, Any]
) -> List[Dict]:
    """복합 조건 시그널 생성"""
    signals = []
    
    # 간단한 예시: RSI + 이동평균 조합
    buy_rules = rules.get('buy', {})
    sell_rules = rules.get('sell', {})
    
    # RSI 시그널
    if 'rsi' in buy_rules and 'rsi_14' in indicators:
        rsi_buy_threshold = buy_rules['rsi'].get('below', 30)
        rsi_signals = generate_rsi_signals(indicators['rsi_14'], buy_threshold=rsi_buy_threshold)
        signals.extend(rsi_signals)
    
    if 'rsi' in sell_rules and 'rsi_14' in indicators:
        rsi_sell_threshold = sell_rules['rsi'].get('above', 70)
        rsi_signals = generate_rsi_signals(indicators['rsi_14'], sell_threshold=rsi_sell_threshold)
        signals.extend(rsi_signals)
    
    # 이동평균 시그널
    if 'macd' in buy_rules and 'golden_cross' in buy_rules['macd']:
        if 'sma_20' in indicators and 'sma_50' in indicators:
            ma_signals = generate_moving_average_signals(
                price_data, indicators['sma_20'], indicators['sma_50']
            )
            signals.extend(ma_signals)
    
    # 날짜별로 정렬
    signals.sort(key=lambda x: x['date'])
    
    return signals


def calculate_signal_performance(signals: List[Dict], price_data: List[Dict]) -> Dict[str, Any]:
    """시그널 성과 분석"""
    if not signals:
        return {"total_signals": 0, "performance": "No signals generated"}
    
    price_dict = {p['date']: p['close'] for p in price_data}
    
    buy_signals = [s for s in signals if s['signal'] == 'BUY']
    sell_signals = [s for s in signals if s['signal'] == 'SELL']
    
    # 가격 정보 추가
    for signal in signals:
        if signal['price'] is None:
            signal['price'] = price_dict.get(signal['date'])
    
    return {
        "total_signals": len(signals),
        "buy_signals": len(buy_signals),
        "sell_signals": len(sell_signals),
        "signal_details": signals[-10:] if len(signals) > 10 else signals  # 최근 10개만
    }
