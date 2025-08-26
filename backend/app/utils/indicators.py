"""
Technical Indicators Calculator
기본 Python으로 구현된 기술적 지표 계산 유틸리티
"""

import re
from typing import List, Dict, Any, Optional
from datetime import datetime

try:
    import pandas as pd
    import numpy as np
    HAS_PANDAS = True
except ImportError:
    HAS_PANDAS = False

try:
    import talib
    HAS_TALIB = True
except ImportError:
    HAS_TALIB = False


def parse_indicator_string(indicator: str) -> tuple:
    """
    지표 문자열 파싱
    예: "rsi(14)" -> ("rsi", [14])
    예: "macd(12,26,9)" -> ("macd", [12, 26, 9])
    """
    match = re.match(r'(\w+)(?:\(([^)]+)\))?', indicator.lower())
    if not match:
        return indicator.lower(), []
    
    name = match.group(1)
    params_str = match.group(2)
    
    if params_str:
        params = [int(p.strip()) for p in params_str.split(',')]
    else:
        params = []
    
    return name, params


def calculate_rsi(data: List[Dict], period: int = 14) -> List[Dict]:
    """RSI 계산 - 프론트엔드와 동일한 방식으로 구현"""
    if len(data) < period + 1:
        return []
    
    result = []
    gains = 0.0
    losses = 0.0
    
    # 첫 번째 period-1개의 변화량으로 초기 gains/losses 계산
    for i in range(1, period):
        diff = data[i]['close'] - data[i-1]['close']
        if diff >= 0:
            gains += diff
        else:
            losses -= diff
    
    # period번째부터 RSI 계산
    for i in range(period, len(data)):
        diff = data[i]['close'] - data[i-1]['close']
        
        # 지수평활법으로 평균 계산
        if diff >= 0:
            gains = (gains * (period - 1) + diff) / period
            losses = (losses * (period - 1)) / period
        else:
            gains = (gains * (period - 1)) / period
            losses = (losses * (period - 1) - diff) / period
        
        # RSI 계산
        if losses == 0:
            rsi = 100.0
        else:
            rs = gains / losses
            rsi = 100 - 100 / (1 + rs)
        
        result.append({
            "date": data[i]['date'],
            "value": round(rsi, 2)
        })
    
    return result


def calculate_sma(data: List[Dict], period: int = 20) -> List[Dict]:
    """SMA 계산 - 순수 Python 구현"""
    if len(data) < period:
        return []
    
    result = []
    for i in range(period - 1, len(data)):
        close_sum = sum(data[j]['close'] for j in range(i - period + 1, i + 1))
        sma = close_sum / period
        
        result.append({
            "date": data[i]['date'],
            "value": round(sma, 2)
        })
    
    return result


def calculate_ema(data: List[Dict], period: int = 20) -> List[Dict]:
    """EMA 계산 - 순수 Python 구현"""
    if len(data) < period:
        return []
    
    result = []
    multiplier = 2 / (period + 1)
    
    # 첫 번째 EMA는 SMA로 계산
    sma = sum(data[i]['close'] for i in range(period)) / period
    result.append({
        "date": data[period - 1]['date'],
        "value": round(sma, 2)
    })
    
    # 이후 EMA 계산
    ema = sma
    for i in range(period, len(data)):
        ema = (data[i]['close'] * multiplier) + (ema * (1 - multiplier))
        result.append({
            "date": data[i]['date'],
            "value": round(ema, 2)
        })
    
    return result


def calculate_macd(data: List[Dict], fast: int = 12, slow: int = 26, signal: int = 9) -> Dict[str, List[Dict]]:
    """MACD 계산 - 순수 Python 구현"""
    if len(data) < slow:
        return {"macd_line": [], "signal_line": [], "histogram": []}
    
    # EMA 계산
    ema_fast = calculate_ema(data, fast)
    ema_slow = calculate_ema(data, slow)
    
    # MACD 라인 계산
    macd_line = []
    start_idx = slow - 1  # slow EMA부터 시작
    
    for i in range(len(ema_slow)):
        # ema_fast에서 해당하는 인덱스 찾기
        fast_idx = i + (slow - fast)
        if fast_idx < len(ema_fast):
            macd_val = ema_fast[fast_idx]['value'] - ema_slow[i]['value']
            macd_line.append({
                "date": ema_slow[i]['date'],
                "value": round(macd_val, 4)
            })
    
    # Signal line (MACD의 EMA)
    if len(macd_line) >= signal:
        signal_line = []
        multiplier = 2 / (signal + 1)
        
        # 첫 번째 signal은 SMA
        sma = sum(macd_line[i]['value'] for i in range(signal)) / signal
        signal_line.append({
            "date": macd_line[signal - 1]['date'],
            "value": round(sma, 4)
        })
        
        # 이후 signal line
        signal_ema = sma
        for i in range(signal, len(macd_line)):
            signal_ema = (macd_line[i]['value'] * multiplier) + (signal_ema * (1 - multiplier))
            signal_line.append({
                "date": macd_line[i]['date'],
                "value": round(signal_ema, 4)
            })
    else:
        signal_line = []
    
    # Histogram
    histogram = []
    for i in range(len(signal_line)):
        if i < len(macd_line):
            hist_val = macd_line[i + signal - 1]['value'] - signal_line[i]['value']
            histogram.append({
                "date": signal_line[i]['date'],
                "value": round(hist_val, 4)
            })
    
    return {
        "macd_line": macd_line,
        "signal_line": signal_line,
        "histogram": histogram
    }


def calculate_bollinger_bands(data: List[Dict], period: int = 20, std_dev: int = 2) -> Dict[str, List[Dict]]:
    """볼린저 밴드 계산 - 순수 Python 구현"""
    if len(data) < period:
        return {"upper": [], "middle": [], "lower": []}
    
    result = {"upper": [], "middle": [], "lower": []}
    
    for i in range(period - 1, len(data)):
        # 해당 구간의 평균과 표준편차 계산
        closes = [data[j]['close'] for j in range(i - period + 1, i + 1)]
        mean = sum(closes) / period
        
        # 표준편차 계산
        variance = sum((x - mean) ** 2 for x in closes) / period
        std = variance ** 0.5
        
        upper = mean + (std * std_dev)
        lower = mean - (std * std_dev)
        
        date_str = data[i]['date']
        result["upper"].append({"date": date_str, "value": round(upper, 2)})
        result["middle"].append({"date": date_str, "value": round(mean, 2)})
        result["lower"].append({"date": date_str, "value": round(lower, 2)})
    
    return result


def calculate_indicators(price_data: List[Dict], indicators: List[str]) -> Dict[str, Any]:
    """
    주어진 가격 데이터와 지표 목록으로 모든 지표 계산
    
    Args:
        price_data: [{"date": "2024-01-01", "open": 100, "high": 105, "low": 98, "close": 103, "volume": 1000}, ...]
        indicators: ["rsi(14)", "ema(20)", "sma(50)", "macd(12,26,9)", "bb(20,2)"]
    
    Returns:
        {
            "rsi_14": [...],
            "ema_20": [...],
            "sma_50": [...],
            "macd": {...},
            "bb_20_2": {...}
        }
    """
    if not price_data:
        return {}
    
    # 날짜순으로 정렬 (오래된 것부터)
    sorted_data = sorted(price_data, key=lambda x: x['date'])
    
    results = {}
    
    for indicator in indicators:
        name, params = parse_indicator_string(indicator)
        
        try:
            if name == 'rsi':
                period = params[0] if params else 14
                key = f"rsi_{period}"
                results[key] = calculate_rsi(sorted_data, period)
                
            elif name == 'sma':
                period = params[0] if params else 20
                key = f"sma_{period}"
                results[key] = calculate_sma(sorted_data, period)
                
            elif name == 'ema':
                period = params[0] if params else 20
                key = f"ema_{period}"
                results[key] = calculate_ema(sorted_data, period)
                
            elif name == 'macd':
                fast = params[0] if len(params) > 0 else 12
                slow = params[1] if len(params) > 1 else 26
                signal = params[2] if len(params) > 2 else 9
                key = f"macd_{fast}_{slow}_{signal}"
                results[key] = calculate_macd(sorted_data, fast, slow, signal)
                
            elif name in ['bb', 'bollinger']:
                period = params[0] if len(params) > 0 else 20
                std_dev = params[1] if len(params) > 1 else 2
                key = f"bb_{period}_{std_dev}"
                results[key] = calculate_bollinger_bands(sorted_data, period, std_dev)
                
            else:
                results[f"error_{name}"] = f"Unknown indicator: {name}"
                
        except Exception as e:
            results[f"error_{name}"] = f"Error calculating {name}: {str(e)}"
    
    return results
