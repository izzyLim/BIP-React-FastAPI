"""
LLM Function Calling Tools Definition
LLM이 선택적으로 사용할 수 있는 도구들의 정의
"""

from typing import Dict, Any, List

def get_available_tools():
    """LLM이 사용할 수 있는 도구들의 정의"""
    
    return [
        {
            "type": "function",
            "function": {
                "name": "get_stock_prices",
                "description": "주식의 가격 데이터를 조회합니다. 차트 분석이나 가격 추세 확인 시 사용하세요.",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "ticker": {
                            "type": "string",
                            "description": "주식 심볼 (예: AAPL, TSLA)"
                        }
                    },
                    "required": ["ticker"]
                }
            }
        },
        {
            "type": "function", 
            "function": {
                "name": "calculate_technical_indicators",
                "description": "RSI, 이동평균 등 기술적 지표를 계산합니다. 과매수/과매도 상태 확인 시 사용하세요.",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "ticker": {
                            "type": "string",
                            "description": "주식 심볼"
                        },
                        "indicators": {
                            "type": "array",
                            "items": {"type": "string"},
                            "description": "계산할 지표들 (예: ['rsi_14', 'sma_20', 'ema_12'])"
                        }
                    },
                    "required": ["ticker", "indicators"]
                }
            }
        },
        {
            "type": "function",
            "function": {
                "name": "generate_trading_signals", 
                "description": "매매 시그널을 생성합니다. 구체적인 매수/매도 타이밍을 찾을 때 사용하세요.",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "ticker": {
                            "type": "string",
                            "description": "주식 심볼"
                        },
                        "signal_type": {
                            "type": "string",
                            "description": "시그널 타입 (rsi, ma_cross, composite)",
                            "enum": ["rsi", "ma_cross", "composite"]
                        },
                        "rsi_buy": {
                            "type": "number",
                            "description": "RSI 매수 기준 (기본: 30)",
                            "default": 30
                        },
                        "rsi_sell": {
                            "type": "number", 
                            "description": "RSI 매도 기준 (기본: 70)",
                            "default": 70
                        }
                    },
                    "required": ["ticker", "signal_type"]
                }
            }
        },
        {
            "type": "function",
            "function": {
                "name": "run_strategy_backtest",
                "description": "매매 전략의 백테스트를 실행합니다. 전략의 수익성을 검증할 때 사용하세요.",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "ticker": {
                            "type": "string",
                            "description": "주식 심볼"
                        },
                        "strategy": {
                            "type": "string",
                            "description": "전략 타입 (rsi_strategy, ma_crossover)",
                            "default": "rsi_strategy"
                        },
                        "initial_cash": {
                            "type": "number",
                            "description": "초기 자금 (기본: 100000)",
                            "default": 100000
                        }
                    },
                    "required": ["ticker"]
                }
            }
        },
        {
            "type": "function",
            "function": {
                "name": "get_advanced_analysis",
                "description": "다중 지표를 종합한 고급 분석을 수행합니다. 정교한 분석이 필요할 때 사용하세요.",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "ticker": {
                            "type": "string", 
                            "description": "주식 심볼"
                        },
                        "min_confidence": {
                            "type": "number",
                            "description": "최소 신뢰도 (기본: 60)",
                            "default": 60
                        },
                        "trend_filter": {
                            "type": "boolean",
                            "description": "추세 필터링 적용 여부 (기본: true)",
                            "default": True
                        }
                    },
                    "required": ["ticker"]
                }
            }
        }
    ]


async def execute_function_call(function_name: str, arguments: dict, db_session) -> dict:
    """LLM이 요청한 함수를 실제로 실행"""
    
    try:
        # 공통 import
        from app.api.tools import _get_price_data_internal, calculate_indicators
        from app.utils.indicators import calculate_rsi, calculate_sma, calculate_ema
        
        if function_name == "get_stock_prices":
            return await _get_price_data_internal(
                ticker=arguments["ticker"],
                db=db_session,
                period="1y"  # 1년으로 변경하여 충분한 데이터 확보
            )
            
        elif function_name == "calculate_technical_indicators":
            # 가격 데이터 먼저 조회
            price_response = await _get_price_data_internal(
                ticker=arguments["ticker"], 
                db=db_session,
                period="1y"  # 1년으로 변경하여 충분한 데이터 확보
            )
            if "error" in price_response:
                return price_response
                
            # 지표 계산
            price_data = []
            for price in price_response["data"]:
                price_data.append({
                    'date': price['date'],
                    'close': price['close'],
                    'high': price['high'],
                    'low': price['low'],
                    'open': price['open'],
                    'volume': price['volume']
                })
            
            results = {}
            for indicator in arguments["indicators"]:
                if indicator == "rsi_14":
                    results[indicator] = calculate_rsi(price_data, 14)
                elif indicator.startswith("sma_"):
                    period = int(indicator.split("_")[1])
                    results[indicator] = calculate_sma(price_data, period)
                elif indicator.startswith("ema_"):
                    period = int(indicator.split("_")[1])
                    results[indicator] = calculate_ema(price_data, period)
                    
            return {"results": results}
            
        elif function_name == "generate_trading_signals":
            from app.api.tools import generate_signals
            return await generate_signals(arguments, db_session)
            
        elif function_name == "run_strategy_backtest":
            from app.api.tools import run_strategy_backtest
            return await run_strategy_backtest(arguments, db_session)
            
        elif function_name == "get_advanced_analysis":
            from app.api.tools import generate_advanced_signals
            return await generate_advanced_signals(arguments, db_session)
            
        else:
            return {"error": f"Unknown function: {function_name}"}
            
    except Exception as e:
        return {"error": f"Function execution failed: {str(e)}"}


def format_function_result_for_llm(function_name: str, result: dict) -> str:
    """함수 실행 결과를 LLM이 이해하기 쉬운 형태로 포맷팅"""
    
    if function_name == "get_stock_prices":
        if "error" in result:
            return f"❌ get_stock_prices 실행 중 오류 발생: {result['error']}"
        
        data_count = result.get("count", 0)
        current_price = result["data"][0]["close"] if result.get("data") else 0
        return f"✅ 가격 데이터 조회 완료: {data_count}개 데이터, 현재가 ${current_price:.2f}"
    
    elif function_name == "calculate_technical_indicators":
        if "error" in result:
            return f"❌ calculate_technical_indicators 실행 중 오류 발생: {result['error']}"
        
        indicators = result.get("results", {})
        summary = []
        for indicator, data in indicators.items():
            if data and len(data) > 0:
                latest = data[-1]["value"]
                summary.append(f"{indicator}: {latest:.2f}")
        
        return f"✅ 지표 계산 완료: {', '.join(summary)}"
    
    elif function_name == "generate_trading_signals":
        if "error" in result:
            return f"❌ generate_trading_signals 실행 중 오류 발생: {result['error']}"
        
        total_signals = result.get("total_signals", 0)
        recent_signal = result.get("signals", [{}])[-1] if result.get("signals") else {}
        signal_type = recent_signal.get("signal", "없음")
        
        return f"✅ 매매 시그널 생성 완료: 총 {total_signals}개 시그널, 최근 시그널 {signal_type}"
    
    elif function_name == "run_strategy_backtest":
        if "error" in result:
            return f"❌ run_strategy_backtest 실행 중 오류 발생: {result['error']}"
        
        performance = result.get("performance", {})
        total_return = performance.get("total_return_pct", 0)
        
        return f"✅ 백테스트 완료: 총 수익률 {total_return:.2f}%"
    
    elif function_name == "get_advanced_analysis":
        if "error" in result:
            return f"❌ get_advanced_analysis 실행 중 오류 발생: {result['error']}"
        
        summary = result.get("signal_summary", {})
        avg_confidence = summary.get("avg_confidence", 0)
        total_signals = result.get("total_signals", 0)
        
        return f"✅ 고급 분석 완료: 총 {total_signals}개 시그널, 평균 신뢰도 {avg_confidence:.1f}%"
    
    else:
        return f"✅ {function_name} 실행 완료"
