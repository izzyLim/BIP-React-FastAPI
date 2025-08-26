from fastapi import APIRouter, Request, Depends, HTTPException, Query
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session


from urllib.parse import urlencode

import httpx
from datetime import datetime, timedelta
from jose import jwt, JWTError

import os
from dotenv import load_dotenv

from app.db.connection import get_db
from app.services.user import get_user_by_email, create_user
from app.schemas.user import UserCreate, UserOut

from app.core.oauth_config import get_frontend_url
from app.core.security import get_current_user

from app.models.user import User as UserModel


load_dotenv()

router = APIRouter(prefix="/auth", tags=["auth"])

ALGORITHM = os.getenv("ALGORITHM")
SECRET_KEY = os.getenv("JWT_SECRET_KEY")

GOOGLE_CLIENT_ID     = os.getenv("GOOGLE_CLIENT_ID")
GOOGLE_CLIENT_SECRET = os.getenv("GOOGLE_CLIENT_SECRET")
GOOGLE_REDIRECT_URI  = os.getenv("GOOGLE_CALLBACK_URL", "http://localhost:8000/api/auth/google/callback")

GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token"
GOOGLE_USERINFO_URL = "https://openidconnect.googleapis.com/v1/userinfo"

@router.get("/me")
def read_me(user=Depends(get_current_user)):
    return {"email": user.email, "id": user.id, "name": user.name}

@router.get("/me-public")
def read_me_public(user=Depends(get_current_user)):
    return {"email": user.email, "id": user.id, "name": user.name}


# 1) OpenAPI 문서용 SecurityScheme
@router.get("/google", include_in_schema=False)
async def google_login():
    params = {
        "response_type": "code",
        "client_id": GOOGLE_CLIENT_ID,
        "redirect_uri": GOOGLE_REDIRECT_URI,
        "scope": "openid profile email",
        "access_type": "offline",
        "prompt": "consent",
        # TODO: generate & store a `state` value in session for CSRF protection and include it here:
        # "state": some_generated_state,
    }
    base = "https://accounts.google.com/o/oauth2/v2/auth"
    url = f"{base}?{urlencode(params)}"
    return RedirectResponse(url)




@router.get("/google/callback")
async def google_callback( request: Request,
    code: str = Query(...),  # authorization code
    db: Session = Depends(get_db),
):
    
    if not code:
        raise HTTPException(status_code=400, detail="Missing code in callback")

    # 1) 코드로 토큰 교환
    async with httpx.AsyncClient() as client:
        token_resp = await client.post(
            GOOGLE_TOKEN_URL,
            data={
                "code": code,
                "client_id": GOOGLE_CLIENT_ID,
                "client_secret": GOOGLE_CLIENT_SECRET,
                "redirect_uri": GOOGLE_REDIRECT_URI,
                "grant_type": "authorization_code",
            },
            headers={"Content-Type": "application/x-www-form-urlencoded"},
        )
        if token_resp.status_code != 200:
            raise HTTPException(
                status_code=502,
                detail=f"Failed to fetch token from Google: {token_resp.text}"
            )
        token_data = token_resp.json()
    
    access_token_from_google = token_data.get("access_token")
    refresh_token_from_google = token_data.get("refresh_token")  # 있을 수 있음
    if not access_token_from_google:
        raise HTTPException(status_code=502, detail="No access token in Google response")

    # 2) UserInfo 가져오기
    async with httpx.AsyncClient() as client:
        userinfo_resp = await client.get(
            GOOGLE_USERINFO_URL,
            headers={"Authorization": f"Bearer {access_token_from_google}"},
        )
        if userinfo_resp.status_code != 200:
            raise HTTPException(
                status_code=502,
                detail=f"Failed to fetch userinfo: {userinfo_resp.text}"
            )
        user_info = userinfo_resp.json()


    email = user_info.get("email")
    name = user_info.get("name") or ""
    picture = user_info.get("picture")

    if not email:
        raise HTTPException(status_code=400, detail="Google userinfo missing email")

    # 3) DB에 사용자 저장/조회
    user = get_user_by_email(db, email)
    if not user:
        user = create_user(
            db,
            UserCreate(
                email=email,
                name=name,
                picture=picture,
            ),
        )

    # 4) 내부 JWT 생성 (refresh_token을 포함시킬지 결정)
    access_token_expires = timedelta(minutes=60)
    expire = datetime.utcnow() + access_token_expires
    to_encode = {
        "sub": user.email,
        "exp": int(expire.timestamp()),  # JWT는 int timestamp여야 함!
        "provider": "google",
    }
    if refresh_token_from_google:
        to_encode["google_refresh_token"] = refresh_token_from_google

    jwt_token = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

    frontend = get_frontend_url()
    response = RedirectResponse(f"{frontend}/auth/success")
    response.set_cookie(
        key="access_token",
        value=jwt_token,
        httponly=True,
        samesite="lax",
        secure=False  # 운영 환경에서는 True
    )
    return response