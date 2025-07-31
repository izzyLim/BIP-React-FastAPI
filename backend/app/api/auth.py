from fastapi import APIRouter, Request, Depends, HTTPException, Query
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session
from fastapi.security import OAuth2PasswordRequestForm, OAuth2PasswordBearer, OAuth2AuthorizationCodeBearer, SecurityScopes

from authlib.integrations.starlette_client import OAuth

from urllib.parse import urlencode

import httpx
from datetime import datetime, timedelta
from jose import jwt, JWTError

import os
from dotenv import load_dotenv

from app.db.connection import get_db
from app.services.user import get_user_by_email, create_user
from app.schemas.user import UserCreate, UserOut

from app.core.oauth_config import get_frontend_url, get_oauth_config
from app.core.security import get_current_user

from app.models.user import User as UserModel


load_dotenv()
oauth = OAuth()

router = APIRouter(prefix="/auth")

ALGORITHM = os.getenv("ALGORITHM")
SECRET_KEY = os.getenv("JWT_SECRET_KEY")

GOOGLE_CLIENT_ID     = os.getenv("GOOGLE_CLIENT_ID")
GOOGLE_CLIENT_SECRET = os.getenv("GOOGLE_CLIENT_SECRET")
GOOGLE_REDIRECT_URI  = os.getenv("GOOGLE_REDIRECT_URI", "http://localhost:8000/auth/google/callback")

GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token"
GOOGLE_USERINFO_URL = "https://openidconnect.googleapis.com/v1/userinfo"

@router.get("/me", response_model=UserOut)
def read_me(current_user: UserModel = Depends(get_current_user)):
    return current_user


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


'''
google_oauth2_scheme = OAuth2AuthorizationCodeBearer(
    authorizationUrl="https://accounts.google.com/o/oauth2/auth",
    tokenUrl="https://oauth2.googleapis.com/token",
    scopes={
        "openid":  "OpenID Connect scope",
        "profile": "View your basic profile info",
        "email":   "View your email address",
    },
)

@router.get("/google", include_in_schema=False)
async def google_login():
    """
    브라우저에서 이 엔드포인트를 호출하면,
    OpenAPI UI의 “Authorize” 버튼 대신 manual redirect를 원할 때 사용합니다.
    """
    params = {
        "response_type": "code",
        "client_id":     GOOGLE_CLIENT_ID,
        "redirect_uri":  GOOGLE_REDIRECT_URI,
        "scope":         "openid profile email",
        "access_type":   "offline",   # refresh token 발급 요청
        "prompt":        "consent",   # 매번 동의 화면을 띄워서 refresh token을 확실히 받기 위함
    }
    url = "https://accounts.google.com/o/oauth2/auth?" + "&".join(f"{k}={v}" for k,v in params.items())
    return RedirectResponse(url)

@router.get("/auth/google")
async def auth_google(code: str):
    token_url = "https://accounts.google.com/o/oauth2/token"
    params = {
        "code": code,
        "client_id": GOOGLE_CLIENT_ID,
        "client_secret": GOOGLE_CLIENT_SECRET,
        "redirect_uri": GOOGLE_REDIRECT_URI,
        "grant_type": "authorization_code",
    }
    headers = {"Accept": "application/json"}
    async with httpx.AsyncClient() as client:
        response = await client.post(token_url, params=params, headers=headers)
        print(response)
        access_token = response.json()
        print(response)
        token = access_token['access_token']
        print(token)
    async with httpx.AsyncClient() as client:
        headers.update({'Authorization': f"Bearer {token}"})
        response = await client.get('https://www.googleapis.com/oauth2/v1/userinfo', headers=headers)
# data come from Google
        data_from_google = response.json()
# extract email from google data
        email_from_google = data_from_google['email']
# token creation using email from google
        access_token_expire = timedelta(minutes=10)
        for_token = email_from_google
        expire = datetime.utcnow() + access_token_expire
        to_encode = {"exp": expire, "sub": str(for_token)}
        access_token = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
        return {"access token": access_token, "token_type": "bearer", "expire_in": expire}
'''

@router.get("/google/callback")
async def google_callback(
    request: Request,
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
        "exp": expire,
        "provider": "google",
    }
    if refresh_token_from_google:
        to_encode["google_refresh_token"] = refresh_token_from_google  # 필요 시 저장하거나 암호화

    jwt_token = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

    # 5) 프론트로 리다이렉트 (토큰 전달 방식은 URL 파라미터 또는 안전한 쿠키 등)
    frontend = get_frontend_url()
    return RedirectResponse(f"{frontend}/auth/success?token={jwt_token}")