from datetime import date
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_, text
from app.models.stock_info import StockInfo
from app.db.connection import get_db

# 프로젝트의 DB 세션 디펜던시 경로에 맞춰 조정


router = APIRouter(prefix="/stocks", tags=["stocks"])


@router.get("/search")
def search_stocks(
    q: str = Query(..., min_length=1),
    limit: int = Query(10, ge=1, le=50),
    active_only: bool = True,
    db: Session = Depends(get_db),
):
    query = db.query(StockInfo)
    if active_only:
        query = query.filter(StockInfo.active.is_(True))

    # ticker prefix 우선 + 이름 부분일치
    q_like = f"%{q}%"
    q_prefix = f"{q}%"
    rows = (
        query.filter(
            or_(
                StockInfo.ticker.ilike(q_prefix),
                StockInfo.stock_name.ilike(q_like),
                StockInfo.stock_name_eng.ilike(q_like),
            )
        )
        .order_by(StockInfo.ticker.asc())
        .limit(limit)
        .all()
    )
    return [
        {
            "ticker": r.ticker,
            "stock_name": r.stock_name,
            "stock_name_eng": r.stock_name_eng,
            "market_type": r.market_type,
            "exchange_code": r.exchange_code,
            "currency_code": r.currency_code,
            "active": r.active,
        }
        for r in rows
    ]


@router.get("/{ticker}")
def get_stock(ticker: str, db: Session = Depends(get_db)):
    r = db.query(StockInfo).filter(StockInfo.ticker == ticker).first()
    if not r:
        raise HTTPException(status_code=404, detail="ticker not found")
    return {
        "ticker": r.ticker,
        "stock_name": r.stock_name,
        "stock_name_eng": r.stock_name_eng,
        "market_type": r.market_type,
        "exchange_code": r.exchange_code,
        "currency_code": r.currency_code,
        "listing_date": r.listing_date,
        "par_value": r.par_value,
        "total_shares": r.total_shares,
        "market_value": r.market_value,
        "data_source": r.data_source,
        "active": r.active,
        "created_at": r.created_at,
        "updated_at": r.updated_at,
    }


@router.get("/{ticker}/prices")
def get_prices(
    ticker: str,
    interval: str = Query("1d", regex="^(1m|1d|1wk|1mo)$"),
    start: Optional[date] = Query(None, description="포함 시작 (UTC 날짜)"),
    end: Optional[date] = Query(None, description="포함 종료 (UTC 날짜)"),
    limit: Optional[int] = Query(
        None,
        ge=1,
        le=10000,
        description="1d 이외 구간에서만 의미. 1d & None => 전체(필터 없으면 모든 일봉)."
    ),
    order: str = Query("desc", regex="^(asc|desc)$"),
    db: Session = Depends(get_db),
):
    table_map = {
        "1m": "stock_price_1m",
        "1d": "stock_price_1d",
        "1wk": "stock_price_1wk",
        "1mo": "stock_price_1mo",
    }
    table = table_map[interval]

    # 기본 SQL
    # timestamp 컬럼이 timestamptz/ timestamp면 날짜 필터는 DATE("timestamp")
    conds = ["ticker = :ticker"]
    params = {"ticker": ticker}

    if start:
        conds.append('DATE("timestamp") >= :start')
        params["start"] = start
    if end:
        conds.append('DATE("timestamp") <= :end')
        params["end"] = end

    where_sql = " AND ".join(conds)

    order_sql = 'DESC' if order == 'desc' else 'ASC'

    # LIMIT 로직
    apply_limit = False
    eff_limit = None
    if interval == "1d":
        # 일봉: limit 파라미터 주면 존중, 없으면 전체(필터 없다면 많은 데이터 반환)
        if limit is not None:
            apply_limit = True
            eff_limit = limit
    else:
        # 비-일봉: limit 없으면 기본 1000 (가드)
        eff_limit = limit if limit is not None else 1000
        apply_limit = True

    limit_clause = "LIMIT :limit" if apply_limit else ""
    if apply_limit:
        params["limit"] = eff_limit

    sql = text(f"""
        SELECT ticker,
               "timestamp",
               timestamp_ny,
               timestamp_kst,
               open, high, low, close, volume
        FROM {table}
        WHERE {where_sql}
        ORDER BY "timestamp" {order_sql}
        {limit_clause}
    """)

    rows = db.execute(sql, params).mappings().all()  # 이 줄이 반드시 필요!
    return list(rows)    # 존재 여부(티커 미존재) 별도 체크 원하면 rows 비면 ticker 존재 여부 확인 추가    rows = db.execute(sql, params).mappings().all()    rows = db.execute(sql, params).mappings().all()
    # 존재 여부(티커 미존재) 별도 체크 원하면 rows 비면 ticker 존재 여부 확인 추가
    return list(rows)