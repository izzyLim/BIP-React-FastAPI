from fastapi import FastAPI, APIRouter, Request, Depends
from fastapi.responses import RedirectResponse
from starlette.middleware.sessions import SessionMiddleware
from starlette.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

from app.core.config import settings
from app.api import auth, stocks, watchlist, tools
from app.db.connection import get_db


app = FastAPI(title="BIP Stock Trading API")

# Session Middleware
app.add_middleware(
    SessionMiddleware,
    secret_key=settings.SESSION_SECRET_KEY
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:5174",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:5174",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def startup_event():
    """애플리케이션 시작 시 데이터베이스 연결 테스트"""
    try:
        from app.db.connection import engine
        from sqlalchemy import text
        
        with engine.connect() as connection:
            result = connection.execute(text("SELECT 1"))
            print("✅ Database connection successful!")
    except Exception as e:
        print(f"❌ Database connection failed: {e}")

# 여기서 router 바로 생성 + include
api_router = APIRouter(prefix="/api")
api_router.include_router(auth.router, tags=["auth"])
api_router.include_router(stocks.router,  tags=["stocks"])
api_router.include_router(watchlist.router,  tags=["watchlist"]) 
api_router.include_router(tools.router, tags=["llm-tools"]) 

app.include_router(api_router)

# 임시: Google OAuth 콜백 라우트 (Google Console 설정이 아직 /auth/google/callback로 되어 있음)
@app.get("/auth/google/callback")
async def temp_google_callback(request: Request, db: Session = Depends(get_db)):
    """임시 OAuth 콜백 - /api/auth/google/callback로 리다이렉트"""
    query_params = dict(request.query_params)
    query_string = "&".join([f"{k}={v}" for k, v in query_params.items()])
    redirect_url = f"/api/auth/google/callback?{query_string}"
    return RedirectResponse(url=redirect_url)

# 매퍼 등록용 임포트 (app 심볼을 오염시키지 않도록)
from app import models as _models  # noqa: F401
