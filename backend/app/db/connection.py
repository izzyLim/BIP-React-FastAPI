from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.core.config import settings

DATABASE_URL = settings.SQLALCHEMY_DATABASE_URI

# Pool connection 설정 추가
engine = create_engine(
    DATABASE_URL,
    pool_pre_ping=True,  # 연결 상태 확인
    pool_recycle=300,    # 5분마다 연결 재사용
    echo=False           # SQL 로그 비활성화
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()