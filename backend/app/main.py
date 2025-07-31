from fastapi import FastAPI, APIRouter
from starlette.middleware.sessions import SessionMiddleware
from starlette.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.api import auth  # auth.py에서 router 가져옴


app = FastAPI(title="My Side Project API")

# Session Middleware
app.add_middleware(
    SessionMiddleware,
    secret_key=settings.SESSION_SECRET_KEY
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5174"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 여기서 router 바로 생성 + include
api_router = APIRouter()
api_router.include_router(auth.router, tags=["auth"])

app.include_router(api_router)
