# app/core/config.py

import os
from dotenv import load_dotenv

# .env 파일에서 환경 변수 로드
load_dotenv()

class Settings:
    # 세션 암호화에 사용할 키
    SESSION_SECRET_KEY: str = os.getenv("SESSION_SECRET_KEY")

    # Google OAuth 2.0 설정
    GOOGLE_CLIENT_ID: str = os.getenv("GOOGLE_CLIENT_ID", "")
    GOOGLE_CLIENT_SECRET: str = os.getenv("GOOGLE_CLIENT_SECRET", "")

    # 데이터베이스 연결 URL (DATABASE_URL 환경 변수를 사용)
    SQLALCHEMY_DATABASE_URI: str = os.getenv(
        "DATABASE_URL")

settings = Settings()
