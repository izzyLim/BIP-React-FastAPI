from sqlalchemy import (
    Column, BigInteger, Integer, String, Text, DateTime, func,
    ForeignKey, UniqueConstraint, Index
)
from sqlalchemy.orm import relationship
from app.models.base import Base


class UserWatchlist(Base):
    __tablename__ = "user_watchlist"
    __table_args__ = (
        UniqueConstraint("user_id", "ticker", name="uq_user_watchlist_user_ticker"),
        Index("idx_user_watchlist_user", "user_id"),
        Index("idx_user_watchlist_user_pos", "user_id", "position"),
        Index("idx_user_watchlist_user_created", "user_id", "created_at"),
    )

    id = Column(BigInteger, primary_key=True, autoincrement=True, index=True)
    user_id = Column(BigInteger, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    ticker = Column(String(32), ForeignKey("stock_info.ticker", ondelete="CASCADE"), nullable=False)
    position = Column(Integer, nullable=False, server_default="0")
    note = Column(Text)

    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    user = relationship("User", back_populates="watchlist_items")
    stock = relationship("StockInfo", back_populates="watchlist_entries")