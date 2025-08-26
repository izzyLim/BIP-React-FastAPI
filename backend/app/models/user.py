from sqlalchemy import Column, BigInteger, String, Text, TIMESTAMP, func
from sqlalchemy.orm import relationship
from app.models.base import Base

class User(Base):
    __tablename__ = "users"

    id = Column(BigInteger, primary_key=True, index=True, autoincrement=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    name = Column(String(120))              # DB는 NOT NULL 아님
    picture = Column(Text)
    # 선택: DB 스키마와 맞추려면 아래도 추가 가능
    organization = Column(String(120))
    phone = Column(String(50))
    timezone = Column(String(64))
    locale = Column(String(16))

    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(TIMESTAMP(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    watchlist_items = relationship(
        "UserWatchlist",
        back_populates="user",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )
