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

    # LLM API 설정
    OPENAI_API_KEY: str = os.getenv("OPENAI_API_KEY", "")
    ANTHROPIC_API_KEY: str = os.getenv("ANTHROPIC_API_KEY", "")
    DEFAULT_LLM_PROVIDER: str = os.getenv("DEFAULT_LLM_PROVIDER", "openai")  # openai, anthropic, mock
    
    # LLM 모델 설정
    LLM_MODEL_OPENAI: str = os.getenv("LLM_MODEL_OPENAI", "gpt-4o-mini")
    LLM_MODEL_ANTHROPIC: str = os.getenv("LLM_MODEL_ANTHROPIC", "claude-3-sonnet-20240229")
    LLM_MAX_TOKENS: int = int(os.getenv("LLM_MAX_TOKENS", "2000"))
    LLM_TEMPERATURE: float = float(os.getenv("LLM_TEMPERATURE", "0.3"))

    # 데이터베이스 연결 URL (DATABASE_URL 환경 변수를 사용)
    SQLALCHEMY_DATABASE_URI: str = os.getenv(
        "DATABASE_URL")

settings = Settings()
