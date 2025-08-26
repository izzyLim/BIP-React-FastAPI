"""
Trading Backtest Utilities
간단한 백테스트 엔진
"""

from typing import List, Dict, Any, Optional
from datetime import datetime

class SimpleBacktest:
    def __init__(self, initial_cash: float = 100000):
        self.initial_cash = initial_cash
        self.cash = initial_cash
        self.position = 0  # 보유 주식 수
        self.trades = []
        self.portfolio_value = []
        
    def execute_signal(self, signal: Dict, price: float, date: str):
        """시그널에 따라 매매 실행"""
        if signal['signal'] == 'BUY' and self.cash > price:
            # 매수 (가용 현금의 일정 비율로 매수)
            buy_amount = min(self.cash * 0.95, self.cash)  # 95% 투자
            shares_to_buy = int(buy_amount // price)
            
            if shares_to_buy > 0:
                cost = shares_to_buy * price
                self.cash -= cost
                self.position += shares_to_buy
                
                self.trades.append({
                    "date": date,
                    "action": "BUY",
                    "shares": shares_to_buy,
                    "price": price,
                    "cost": cost,
                    "reason": signal.get('reason', ''),
                    "cash_after": self.cash,
                    "position_after": self.position
                })
        
        elif signal['signal'] == 'SELL' and self.position > 0:
            # 매도 (보유 주식의 일정 비율 매도)
            shares_to_sell = int(self.position * 0.95)  # 95% 매도
            
            if shares_to_sell > 0:
                revenue = shares_to_sell * price
                self.cash += revenue
                self.position -= shares_to_sell
                
                self.trades.append({
                    "date": date,
                    "action": "SELL", 
                    "shares": shares_to_sell,
                    "price": price,
                    "revenue": revenue,
                    "reason": signal.get('reason', ''),
                    "cash_after": self.cash,
                    "position_after": self.position
                })
    
    def calculate_portfolio_value(self, current_price: float, date: str):
        """현재 포트폴리오 가치 계산"""
        total_value = self.cash + (self.position * current_price)
        self.portfolio_value.append({
            "date": date,
            "cash": self.cash,
            "position": self.position,
            "stock_value": self.position * current_price,
            "total_value": total_value
        })
        return total_value
    
    def get_performance_metrics(self, final_price: float) -> Dict[str, Any]:
        """성과 지표 계산"""
        final_value = self.cash + (self.position * final_price)
        total_return = final_value - self.initial_cash
        total_return_pct = (total_return / self.initial_cash) * 100
        
        # Buy & Hold 수익률 계산 (첫 거래 시점부터)
        if self.trades:
            first_trade_price = self.trades[0]['price']
            buy_hold_shares = self.initial_cash // first_trade_price
            buy_hold_value = buy_hold_shares * final_price
            buy_hold_return = ((buy_hold_value - self.initial_cash) / self.initial_cash) * 100
        else:
            buy_hold_return = 0
        
        # 승률 계산
        profitable_trades = 0
        total_trades = len([t for t in self.trades if t['action'] == 'SELL'])
        
        if total_trades > 0:
            # 매도 거래에서 수익 계산 (단순화)
            for i, trade in enumerate(self.trades):
                if trade['action'] == 'SELL' and i > 0:
                    # 이전 매수 가격과 비교
                    prev_buy = next((t for t in reversed(self.trades[:i]) if t['action'] == 'BUY'), None)
                    if prev_buy and trade['price'] > prev_buy['price']:
                        profitable_trades += 1
        
        win_rate = (profitable_trades / max(total_trades, 1)) * 100
        
        return {
            "initial_cash": self.initial_cash,
            "final_value": final_value,
            "total_return": total_return,
            "total_return_pct": round(total_return_pct, 2),
            "buy_hold_return_pct": round(buy_hold_return, 2),
            "total_trades": len(self.trades),
            "profitable_trades": profitable_trades,
            "win_rate": round(win_rate, 2),
            "final_position": self.position,
            "final_cash": self.cash
        }


def run_backtest(
    price_data: List[Dict], 
    signals: List[Dict], 
    initial_cash: float = 100000
) -> Dict[str, Any]:
    """백테스트 실행"""
    
    if not price_data or not signals:
        return {"error": "Insufficient data for backtest"}
    
    backtest = SimpleBacktest(initial_cash)
    
    # 날짜별 가격 딕셔너리 생성
    price_dict = {p['date']: p for p in price_data}
    
    # 시그널 실행
    for signal in signals:
        signal_date = signal['date']
        if signal_date in price_dict:
            price = price_dict[signal_date]['close']
            backtest.execute_signal(signal, price, signal_date)
    
    # 일별 포트폴리오 가치 추적
    for price_point in price_data[-30:]:  # 최근 30일만
        backtest.calculate_portfolio_value(price_point['close'], price_point['date'])
    
    # 최종 성과 계산
    final_price = price_data[-1]['close']
    performance = backtest.get_performance_metrics(final_price)
    
    return {
        "backtest_results": {
            "performance": performance,
            "trades": backtest.trades,
            "portfolio_history": backtest.portfolio_value[-10:],  # 최근 10일만
            "trade_summary": {
                "total_trades": len(backtest.trades),
                "buy_trades": len([t for t in backtest.trades if t['action'] == 'BUY']),
                "sell_trades": len([t for t in backtest.trades if t['action'] == 'SELL'])
            }
        }
    }


def compare_strategies(
    price_data: List[Dict], 
    strategies: Dict[str, List[Dict]], 
    initial_cash: float = 100000
) -> Dict[str, Any]:
    """여러 전략 비교"""
    
    results = {}
    
    for strategy_name, signals in strategies.items():
        backtest_result = run_backtest(price_data, signals, initial_cash)
        if "error" not in backtest_result:
            results[strategy_name] = backtest_result["backtest_results"]["performance"]
    
    # 전략 순위
    if results:
        sorted_strategies = sorted(
            results.items(), 
            key=lambda x: x[1]['total_return_pct'], 
            reverse=True
        )
        
        return {
            "strategy_comparison": results,
            "ranking": [{"strategy": name, "return_pct": data['total_return_pct']} 
                       for name, data in sorted_strategies]
        }
    
    return {"error": "No valid backtest results"}
