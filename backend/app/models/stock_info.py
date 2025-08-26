from sqlalchemy import Column, String, Boolean, Date, BigInteger, Numeric, DateTime, func
from sqlalchemy.orm import relationship

from app.models.base import Base



class StockInfo(Base):
    __tablename__ = "stock_info"

    ticker = Column(String(32), primary_key=True)              # row["symbolCode"]
    stock_name = Column(String(255), nullable=False)           # row["stockName"]
    stock_name_eng = Column(String(255))                       # row["stockNameEng"]
    market_type = Column(String(64))                           # row["stockExchangeType"]["name"]
    exchange_code = Column(String(32))                         # row["stockExchangeType"]["code"]
    currency_code = Column(String(16))                         # row["currencyType"]["code"]
    listing_date = Column(Date)                                 # listing_date
    par_value = Column(Numeric(18, 2))
    total_shares = Column(BigInteger)
    market_value = Column(Numeric(20, 2))
    data_source = Column(String(32), nullable=False, server_default="NAVER")
    active = Column(Boolean, nullable=False, server_default="true")

    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)


    watchlist_entries = relationship(
        "UserWatchlist",
        back_populates="stock",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )

    def __repr__(self) -> str:
        return f"<StockInfo {self.ticker}>"