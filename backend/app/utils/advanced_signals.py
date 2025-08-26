"""
Advanced Trading Signals Generator
다중 지표 기반 정교한 매매 시그널 생성
"""

from typing import List, Dict, Any, Optional
from datetime import datetime

def calculate_signal_strength(indicators: Dict[str, float], rules: Dict) -> Dict[str, Any]:
    """시그널 강도 계산 (0-100점)"""
    
    bullish_signals = 0
    bearish_signals = 0
    total_weight = 0
    signal_details = []
    
    # RSI 분석
    if 'rsi' in indicators:
        rsi = indicators['rsi']
        weight = 25
        total_weight += weight
        
        if rsi <= 30:
            bullish_signals += weight
            signal_details.append(f"RSI 강한 매수신호({rsi:.1f})")
        elif rsi <= 40:
            bullish_signals += weight * 0.5
            signal_details.append(f"RSI 약한 매수신호({rsi:.1f})")
        elif rsi >= 70:
            bearish_signals += weight
            signal_details.append(f"RSI 강한 매도신호({rsi:.1f})")
        elif rsi >= 60:
            bearish_signals += weight * 0.5
            signal_details.append(f"RSI 약한 매도신호({rsi:.1f})")
        else:
            signal_details.append(f"RSI 중립({rsi:.1f})")
    
    # 이동평균 관계 분석
    if 'sma_20' in indicators and 'sma_50' in indicators:
        sma_20 = indicators['sma_20']
        sma_50 = indicators['sma_50']
        weight = 20
        total_weight += weight
        
        price_vs_sma20 = ((indicators.get('price', sma_20) - sma_20) / sma_20) * 100
        sma_divergence = ((sma_20 - sma_50) / sma_50) * 100
        
        if sma_20 > sma_50 and price_vs_sma20 > 0:
            bullish_signals += weight
            signal_details.append(f"이평선 강한 상승추세({sma_divergence:.1f}%)")
        elif sma_20 > sma_50:
            bullish_signals += weight * 0.5
            signal_details.append(f"이평선 약한 상승추세({sma_divergence:.1f}%)")
        elif sma_20 < sma_50 and price_vs_sma20 < 0:
            bearish_signals += weight
            signal_details.append(f"이평선 강한 하락추세({sma_divergence:.1f}%)")
        elif sma_20 < sma_50:
            bearish_signals += weight * 0.5
            signal_details.append(f"이평선 약한 하락추세({sma_divergence:.1f}%)")
    
    # 볼린저 밴드 분석 (간단 구현)
    if 'bb_upper' in indicators and 'bb_lower' in indicators:
        price = indicators.get('price', 0)
        bb_upper = indicators['bb_upper']
        bb_lower = indicators['bb_lower']
        bb_middle = (bb_upper + bb_lower) / 2
        weight = 15
        total_weight += weight
        
        if price <= bb_lower:
            bullish_signals += weight
            signal_details.append("볼밴 하단 터치(강한 매수)")
        elif price >= bb_upper:
            bearish_signals += weight
            signal_details.append("볼밴 상단 터치(강한 매도)")
        elif price < bb_middle:
            bullish_signals += weight * 0.3
            signal_details.append("볼밴 하반부(약한 매수)")
        elif price > bb_middle:
            bearish_signals += weight * 0.3
            signal_details.append("볼밴 상반부(약한 매도)")
    
    # 거래량 분석
    if 'volume_ratio' in indicators:
        volume_ratio = indicators['volume_ratio']  # 평균 대비 비율
        weight = 10
        total_weight += weight
        
        if volume_ratio > 2.0:
            # 고거래량 = 현재 추세 강화
            if bullish_signals > bearish_signals:
                bullish_signals += weight
                signal_details.append(f"고거래량 상승확신({volume_ratio:.1f}배)")
            else:
                bearish_signals += weight
                signal_details.append(f"고거래량 하락확신({volume_ratio:.1f}배)")
        elif volume_ratio > 1.5:
            if bullish_signals > bearish_signals:
                bullish_signals += weight * 0.5
                signal_details.append(f"높은거래량({volume_ratio:.1f}배)")
            else:
                bearish_signals += weight * 0.5
                signal_details.append(f"높은거래량({volume_ratio:.1f}배)")
    
    # MACD 분석 (단순화)
    if 'macd' in indicators and 'macd_signal' in indicators:
        macd = indicators['macd']
        macd_signal = indicators['macd_signal']
        weight = 20
        total_weight += weight
        
        if macd > macd_signal and macd > 0:
            bullish_signals += weight
            signal_details.append("MACD 강한 상승신호")
        elif macd > macd_signal:
            bullish_signals += weight * 0.7
            signal_details.append("MACD 상승신호")
        elif macd < macd_signal and macd < 0:
            bearish_signals += weight
            signal_details.append("MACD 강한 하락신호")
        elif macd < macd_signal:
            bearish_signals += weight * 0.7
            signal_details.append("MACD 하락신호")
    
    # 시그널 강도 계산
    if total_weight > 0:
        bullish_strength = (bullish_signals / total_weight) * 100
        bearish_strength = (bearish_signals / total_weight) * 100
    else:
        bullish_strength = bearish_strength = 0
    
    # 최종 판정
    net_strength = bullish_strength - bearish_strength
    
    if net_strength >= 30:
        signal = "STRONG_BUY"
        confidence = min(95, 60 + abs(net_strength))
    elif net_strength >= 15:
        signal = "BUY"
        confidence = min(85, 50 + abs(net_strength))
    elif net_strength <= -30:
        signal = "STRONG_SELL"
        confidence = min(95, 60 + abs(net_strength))
    elif net_strength <= -15:
        signal = "SELL"
        confidence = min(85, 50 + abs(net_strength))
    else:
        signal = "HOLD"
        confidence = max(30, 50 - abs(net_strength))
    
    return {
        "signal": signal,
        "confidence": round(confidence, 1),
        "bullish_strength": round(bullish_strength, 1),
        "bearish_strength": round(bearish_strength, 1),
        "net_strength": round(net_strength, 1),
        "signal_details": signal_details,
        "indicators_used": list(indicators.keys())
    }


def generate_advanced_signals(
    price_data: List[Dict], 
    all_indicators: Dict[str, List[Dict]],
    analysis_rules: Dict = None
) -> List[Dict]:
    """고급 복합 시그널 생성"""
    
    if not analysis_rules:
        analysis_rules = {
            "min_confidence": 60,
            "require_volume": False,
            "trend_confirmation": True
        }
    
    signals = []
    
    # 각 날짜별로 모든 지표 종합 분석
    for i, price_point in enumerate(price_data):
        date = price_point['date']
        
        # 현재 날짜의 모든 지표값 수집
        current_indicators = {
            'price': price_point['close']
        }
        
        # RSI
        if 'rsi_14' in all_indicators:
            rsi_point = next((r for r in all_indicators['rsi_14'] if r['date'] == date), None)
            if rsi_point:
                current_indicators['rsi'] = rsi_point['value']
        
        # 이동평균
        if 'sma_20' in all_indicators:
            sma20_point = next((s for s in all_indicators['sma_20'] if s['date'] == date), None)
            if sma20_point:
                current_indicators['sma_20'] = sma20_point['value']
                
        if 'sma_50' in all_indicators:
            sma50_point = next((s for s in all_indicators['sma_50'] if s['date'] == date), None)
            if sma50_point:
                current_indicators['sma_50'] = sma50_point['value']
        
        # 거래량 비율 (최근 20일 평균 대비)
        if i >= 20:
            recent_volumes = [price_data[j]['volume'] for j in range(i-19, i+1)]
            avg_volume = sum(recent_volumes) / len(recent_volumes)
            current_indicators['volume_ratio'] = price_point['volume'] / avg_volume
        
        # 충분한 지표가 있을 때만 분석
        if len(current_indicators) >= 3:
            analysis = calculate_signal_strength(current_indicators, analysis_rules)
            
            # 설정된 최소 신뢰도 이상일 때만 시그널 생성
            if analysis['confidence'] >= analysis_rules['min_confidence']:
                signals.append({
                    "date": date,
                    "signal": analysis['signal'],
                    "price": price_point['close'],
                    "confidence": analysis['confidence'],
                    "reason": f"복합분석 {analysis['signal']} (신뢰도: {analysis['confidence']}%)",
                    "indicator": "Multi_Indicator",
                    "analysis": analysis,
                    "bullish_strength": analysis['bullish_strength'],
                    "bearish_strength": analysis['bearish_strength']
                })
    
    return signals


def filter_signals_by_trend(signals: List[Dict], price_data: List[Dict]) -> List[Dict]:
    """추세 확인을 통한 시그널 필터링"""
    
    if len(signals) < 2:
        return signals
    
    filtered_signals = []
    
    for signal in signals:
        signal_date = signal['date']
        
        # 해당 날짜의 가격 데이터 찾기
        price_point = next((p for p in price_data if p['date'] == signal_date), None)
        if not price_point:
            continue
        
        # 추세 확인 (최근 5일 가격 추세)
        signal_index = next((i for i, p in enumerate(price_data) if p['date'] == signal_date), None)
        if signal_index is None or signal_index < 5:
            filtered_signals.append(signal)
            continue
        
        recent_prices = [price_data[i]['close'] for i in range(signal_index-4, signal_index+1)]
        trend_slope = (recent_prices[-1] - recent_prices[0]) / len(recent_prices)
        
        # 시그널과 추세 일치성 확인
        signal_type = signal['signal']
        
        if signal_type in ['BUY', 'STRONG_BUY'] and trend_slope > 0:
            # 상승 추세에서 매수 시그널 = 좋음
            signal['trend_confirmation'] = True
            filtered_signals.append(signal)
        elif signal_type in ['SELL', 'STRONG_SELL'] and trend_slope < 0:
            # 하락 추세에서 매도 시그널 = 좋음  
            signal['trend_confirmation'] = True
            filtered_signals.append(signal)
        elif signal_type == 'HOLD':
            # HOLD는 항상 포함
            signal['trend_confirmation'] = None
            filtered_signals.append(signal)
        else:
            # 추세와 반대 시그널 = 제외하거나 신뢰도 하락
            signal['trend_confirmation'] = False
            signal['confidence'] = signal['confidence'] * 0.7  # 신뢰도 30% 감소
            if signal['confidence'] >= 50:  # 여전히 50% 이상이면 포함
                filtered_signals.append(signal)
    
    return filtered_signals
