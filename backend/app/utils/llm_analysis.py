"""
LLM-based Market Analysis
OpenAI/Claude API를 활용한 자연어 기반 시장 분석
"""

import json
import asyncio
from typing import List, Dict, Any, Optional
from datetime import datetime

# LLM API 클라이언트들 (설치된 경우에만 import)
try:
    import openai
    HAS_OPENAI = True
except ImportError:
    HAS_OPENAI = False

try:
    import anthropic
    HAS_ANTHROPIC = True
except ImportError:
    HAS_ANTHROPIC = False

from app.core.config import settings

def format_data_for_llm(
    price_data: List[Dict], 
    indicators: Dict[str, List[Dict]],
    recent_days: int = 30
) -> str:
    """LLM 분석을 위한 데이터 포맷팅"""
    
    # 최근 데이터만 선택
    recent_prices = price_data[-recent_days:] if len(price_data) > recent_days else price_data
    
    # 가격 추세 계산
    if len(recent_prices) >= 2:
        price_change = recent_prices[-1]['close'] - recent_prices[0]['close']
        price_change_pct = (price_change / recent_prices[0]['close']) * 100
        
        # 변동성 계산
        daily_changes = []
        for i in range(1, len(recent_prices)):
            daily_change = (recent_prices[i]['close'] - recent_prices[i-1]['close']) / recent_prices[i-1]['close']
            daily_changes.append(abs(daily_change))
        volatility = (sum(daily_changes) / len(daily_changes)) * 100 if daily_changes else 0
    else:
        price_change_pct = 0
        volatility = 0
    
    # 현재 지표값들
    current_indicators = {}
    for name, data in indicators.items():
        if data:
            latest = data[-1] if data else None
            if latest:
                current_indicators[name] = latest['value']
    
    # 포맷팅된 분석 데이터
    analysis_data = {
        "price_summary": {
            "current_price": recent_prices[-1]['close'] if recent_prices else 0,
            "period_change_pct": round(price_change_pct, 2),
            "volatility_pct": round(volatility, 2),
            "volume_trend": "증가" if len(recent_prices) >= 2 and recent_prices[-1]['volume'] > recent_prices[-2]['volume'] else "감소"
        },
        "technical_indicators": current_indicators,
        "price_levels": {
            "recent_high": max(p['high'] for p in recent_prices) if recent_prices else 0,
            "recent_low": min(p['low'] for p in recent_prices) if recent_prices else 0,
            "support_level": min(p['low'] for p in recent_prices[-10:]) if len(recent_prices) >= 10 else 0,
            "resistance_level": max(p['high'] for p in recent_prices[-10:]) if len(recent_prices) >= 10 else 0
        },
        "recent_price_action": [
            {
                "date": p['date'],
                "close": p['close'],
                "volume": p['volume']
            } for p in recent_prices[-7:]  # 최근 7일
        ]
    }
    
    return json.dumps(analysis_data, indent=2)


def create_analysis_prompt(ticker: str, formatted_data: str, analysis_type: str = "comprehensive") -> str:
    """LLM 분석용 프롬프트 생성"""
    
    base_prompt = f"""
당신은 경험 많은 주식 애널리스트입니다. {ticker} 종목에 대한 분석을 요청받았습니다.

=== 주요 데이터 ===
{formatted_data}

=== 분석 요청 사항 ===
"""
    
    if analysis_type == "comprehensive":
        prompt = base_prompt + """
1. 현재 기술적 상황 요약
2. 매수/매도/관망 추천 (BUY/SELL/HOLD)
3. 추천 이유 (3-5가지 핵심 포인트)
4. 주의사항 및 리스크
5. 목표가 또는 손절가 제안
6. 투자 기간 추천 (단기/중기/장기)

=== 응답 형식 ===
JSON 형태로 응답해주세요:
{
  "recommendation": "BUY|SELL|HOLD",
  "confidence": 1-100,
  "summary": "한줄 요약",
  "key_points": ["포인트1", "포인트2", "포인트3"],
  "risks": ["리스크1", "리스크2"],
  "price_targets": {
    "target_price": 숫자,
    "stop_loss": 숫자
  },
  "investment_horizon": "단기|중기|장기",
  "technical_summary": "기술적 분석 요약"
}
"""
    
    elif analysis_type == "quick":
        prompt = base_prompt + """
간단한 매매 의견만 제시해주세요:

=== 응답 형식 ===
JSON 형태로 응답:
{
  "recommendation": "BUY|SELL|HOLD",
  "confidence": 1-100,
  "reason": "간단한 이유 (1-2문장)"
}
"""
    
    return prompt


def parse_llm_response(response_text: str) -> Dict[str, Any]:
    """LLM 응답 파싱 및 검증"""
    
    try:
        # JSON 추출 시도
        response_text = response_text.strip()
        if response_text.startswith('```json'):
            response_text = response_text.replace('```json', '').replace('```', '')
        
        parsed = json.loads(response_text)
        
        # 필수 필드 검증
        if 'recommendation' not in parsed:
            parsed['recommendation'] = 'HOLD'
        
        if 'confidence' not in parsed:
            parsed['confidence'] = 50
        
        # 신뢰도 범위 검증
        parsed['confidence'] = max(1, min(100, parsed['confidence']))
        
        # 추천 형식 정규화
        rec = parsed['recommendation'].upper()
        if rec not in ['BUY', 'SELL', 'HOLD']:
            parsed['recommendation'] = 'HOLD'
        
        return parsed
        
    except (json.JSONDecodeError, KeyError) as e:
        # 파싱 실패시 기본값 반환
        return {
            "recommendation": "HOLD",
            "confidence": 30,
            "summary": "LLM 응답 파싱 실패",
            "error": str(e),
            "raw_response": response_text[:500]  # 처음 500자만
        }


def validate_llm_analysis(analysis: Dict[str, Any], price_data: List[Dict]) -> Dict[str, Any]:
    """LLM 분석 결과 검증 및 보정"""
    
    current_price = price_data[-1]['close'] if price_data else 0
    
    # 목표가 검증
    if 'price_targets' in analysis:
        targets = analysis['price_targets']
        
        # 목표가가 현재가의 ±50% 범위를 벗어나면 경고
        if 'target_price' in targets:
            target = targets['target_price']
            if isinstance(target, (int, float)):
                deviation = abs(target - current_price) / current_price
                if deviation > 0.5:  # 50% 이상 차이
                    analysis['warnings'] = analysis.get('warnings', [])
                    analysis['warnings'].append(f"목표가 {target}가 현재가 {current_price}와 {deviation*100:.1f}% 차이남")
        
        # 손절가 검증
        if 'stop_loss' in targets:
            stop_loss = targets['stop_loss']
            if isinstance(stop_loss, (int, float)):
                if analysis['recommendation'] == 'BUY' and stop_loss > current_price:
                    analysis['warnings'] = analysis.get('warnings', [])
                    analysis['warnings'].append("매수 추천인데 손절가가 현재가보다 높음")
    
    # 신뢰도 재검증
    if analysis.get('confidence', 0) > 90:
        analysis['warnings'] = analysis.get('warnings', [])
        analysis['warnings'].append("매우 높은 신뢰도 - 검토 필요")
    
    return analysis

async def call_openai_api(
    prompt: str = None, 
    system_message: str = None,
    messages: List[Dict] = None,
    tools: List[Dict] = None,
    tool_choice: str = None
) -> Dict[str, Any]:
    """OpenAI GPT API 호출 (Function Calling 지원)"""
    if not HAS_OPENAI or not settings.OPENAI_API_KEY:
        return {"success": False, "error": "OpenAI API key not configured or openai package not installed"}
    
    try:
        client = openai.AsyncOpenAI(api_key=settings.OPENAI_API_KEY)
        
        # messages가 제공되지 않으면 prompt와 system_message로 구성
        if messages is None:
            messages = []
            if system_message:
                messages.append({"role": "system", "content": system_message})
            if prompt:
                messages.append({"role": "user", "content": prompt})
        
        # API 호출 파라미터 구성
        api_params = {
            "model": settings.LLM_MODEL_OPENAI,
            "messages": messages,
            "temperature": settings.LLM_TEMPERATURE,
            "max_tokens": settings.LLM_MAX_TOKENS
        }
        
        # Function calling 파라미터 추가
        if tools:
            api_params["tools"] = tools
            if tool_choice:
                api_params["tool_choice"] = tool_choice
        
        response = await client.chat.completions.create(**api_params)
        
        # Function calling이 있는 경우 전체 응답 반환
        if tools:
            return {
                "success": True,
                "response": {
                    "content": response.choices[0].message.content,
                    "tool_calls": response.choices[0].message.tool_calls or []
                }
            }
        else:
            # 기존 호환성을 위해 문자열 반환도 지원
            return {
                "success": True,
                "response": {"content": response.choices[0].message.content}
            }
        
    except Exception as e:
        return {"success": False, "error": f"OpenAI API call failed: {str(e)}"}

async def call_claude_api(prompt: str, system_message: str = None) -> str:
    """Anthropic Claude API 호출"""
    if not HAS_ANTHROPIC or not settings.ANTHROPIC_API_KEY:
        raise ValueError("Anthropic API key not configured or anthropic package not installed")
    
    try:
        client = anthropic.AsyncAnthropic(api_key=settings.ANTHROPIC_API_KEY)
        
        # Claude는 system message를 별도 파라미터로 받음
        full_prompt = prompt
        if system_message:
            full_prompt = f"{system_message}\n\n{prompt}"
        
        message = await client.messages.create(
            model=settings.LLM_MODEL_ANTHROPIC,
            max_tokens=settings.LLM_MAX_TOKENS,
            temperature=settings.LLM_TEMPERATURE,
            messages=[
                {"role": "user", "content": full_prompt}
            ]
        )
        
        return message.content[0].text
        
    except Exception as e:
        raise ValueError(f"Claude API call failed: {str(e)}")

async def call_llm_api(
    prompt: str, 
    provider: str = "openai", 
    system_message: str = None
) -> str:
    """통합 LLM API 호출 함수"""
    
    if provider == "openai":
        result = await call_openai_api(prompt=prompt, system_message=system_message)
        if result.get("success"):
            return result["response"]["content"]
        else:
            raise ValueError(result.get("error", "OpenAI API call failed"))
    elif provider == "anthropic" or provider == "claude":
        return await call_claude_api(prompt, system_message)
    elif provider == "mock":
        # Mock 응답 (개발/테스트용)
        return generate_mock_llm_response(prompt)
    else:
        raise ValueError(f"Unsupported LLM provider: {provider}")

def generate_mock_llm_response(prompt: str) -> str:
    """Mock LLM 응답 생성 (실제 API 없을 때 사용)"""
    
    # 간단한 키워드 기반 Mock 응답
    if "BUY" in prompt.upper() or "매수" in prompt:
        recommendation = "BUY"
        confidence = 75
        reasoning = "기술적 지표가 상승 신호를 보이고 있습니다."
    elif "SELL" in prompt.upper() or "매도" in prompt:
        recommendation = "SELL"
        confidence = 70
        reasoning = "과매수 구간에서 조정 가능성이 높습니다."
    else:
        recommendation = "HOLD"
        confidence = 60
        reasoning = "현재 시장 상황에서는 관망이 적절해 보입니다."
    
    mock_response = {
        "recommendation": recommendation,
        "confidence": confidence,
        "summary": f"Mock LLM 분석: {recommendation} 추천",
        "rule_analysis": {
            "consistency": "지표들이 대체로 일치하는 신호를 보임",
            "strengths": ["기술적 분석 신호 명확"],
            "weaknesses": ["시장 감정 미반영"]
        },
        "additional_insights": [
            "실제 LLM 분석 시 더 정교한 해석 가능",
            "뉴스 및 시장 상황 종합 고려 필요"
        ],
        "risks": [
            "Mock 응답으로 실제 시장 분석 제한적",
            "실제 투자 결정에 사용 금지"
        ],
        "reasoning": reasoning
    }
    
    return json.dumps(mock_response, ensure_ascii=False, indent=2)
