from fastapi import APIRouter, Depends, HTTPException, status, Body
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.db.connection import get_db
from app.core.security import get_current_user
from app.models.user import User as UserModel
from app.models.watchlist import UserWatchlist  # Watchlist 모델이 있어야 합니다
from app.schemas.watchlist import WatchlistAdd
from app.models.stock_info import StockInfo  # 반드시 import

router = APIRouter(prefix="/watchlist", tags=["watchlist"])

@router.get("/{ticker}")
def check_watchlist(ticker: str, db: Session = Depends(get_db), user: UserModel = Depends(get_current_user)):
    item = db.query(UserWatchlist).filter_by(user_id=user.id, ticker=ticker).first()
    return {"watching": bool(item)}

@router.patch("/{ticker}")
def update_watchlist(
    ticker: str,
    data: dict = Body(...),
    db: Session = Depends(get_db),
    user: UserModel = Depends(get_current_user)
):
    item = db.query(UserWatchlist).filter_by(user_id=user.id, ticker=ticker).first()
    if not item:
        raise HTTPException(status_code=404, detail="Not in watchlist")
    # note, position 둘 다 지원
    if "note" in data:
        item.note = data["note"]
    if "position" in data:
        item.position = data["position"]
    db.commit()
    return {"success": True}


@router.delete("/{ticker}")
def remove_watchlist(ticker: str, db: Session = Depends(get_db), user: UserModel = Depends(get_current_user)):
    item = db.query(UserWatchlist).filter_by(user_id=user.id, ticker=ticker).first()
    if not item:
        raise HTTPException(status_code=404, detail="Not in watchlist")
    db.delete(item)
    db.commit()
    return {"watching": False}

@router.get("")
def list_watchlist(db: Session = Depends(get_db), user: UserModel = Depends(get_current_user)):
    items = db.query(UserWatchlist).filter_by(user_id=user.id).order_by(UserWatchlist.position).all()
    result = []
    for item in items:
        stock = db.query(StockInfo).filter_by(ticker=item.ticker).first()
        result.append({
            "ticker": item.ticker,
            "position": item.position,
            "note": item.note,
            "name": stock.stock_name if stock else None,         # ← 필드명 맞춤
            "exchange": stock.market_type if stock else None,    # ← market_type 사용
        })
    return result

@router.post("")
def add_watchlist(data: WatchlistAdd, db: Session = Depends(get_db), user: UserModel = Depends(get_current_user)):
    ticker = data.ticker
    exists = db.query(UserWatchlist).filter_by(user_id=user.id, ticker=ticker).first()
    if exists:
        return {"watching": True}
    # position: 현재 유저의 최대 position + 1
    max_pos = db.query(func.max(UserWatchlist.position)).filter_by(user_id=user.id).scalar() or 0
    item = UserWatchlist(user_id=user.id, ticker=ticker, position=max_pos + 1)
    db.add(item)
    db.commit()
    return {"watching": True}


@router.patch("")
def update_positions(
    data: dict = Body(...),  # { positions: [{ticker: "AAPL", position: 1}, ...] }
    db: Session = Depends(get_db),
    user: UserModel = Depends(get_current_user)
):
    for entry in data["positions"]:
        item = db.query(UserWatchlist).filter_by(user_id=user.id, ticker=entry["ticker"]).first()
        if item:
            item.position = entry["position"]
    db.commit()
    return {"success": True}