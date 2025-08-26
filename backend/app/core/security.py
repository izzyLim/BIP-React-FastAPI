import os
from datetime import datetime, timedelta
from jose import jwt, JWTError
from fastapi import Depends, HTTPException, Cookie, Response
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

from app.services.user import get_user_by_email
from app.db.connection import get_db
from sqlalchemy.orm import Session


# JWT 설정
SECRET_KEY = os.getenv("JWT_SECRET_KEY")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "60"))
bearer_scheme = HTTPBearer(auto_error=False)  # ← 이 부분!


def create_access_token(data: dict, refresh_token: str = None) -> str:
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    if refresh_token:
        to_encode.update({"refresh_token": refresh_token})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


def verify_jwt_token(token: str):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if not email:
            raise HTTPException(status_code=401, detail="Malformed token")
        return payload  # 필요한 추가 정보도 포함되어 있음
    except JWTError:
        raise HTTPException(status_code=401, detail="Could not validate credentials")

def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
    jwt_token: str = Cookie(None, alias="access_token"),
    db: Session = Depends(get_db),
):
    token = credentials.credentials if credentials else jwt_token
    if not token:
        raise HTTPException(status_code=401, detail="No token provided")
    try:
        payload = verify_jwt_token(token)
    except Exception as e:
        print(f"Token verify failed: {e}")
        raise
    email = payload.get("sub")
    user = get_user_by_email(db, email)
    if not user:
        print(f"User not found for email: {email}")
        raise HTTPException(status_code=401, detail="User not found")
    return user

# 로그인/소셜 로그인 성공 시 access_token을 쿠키로 내려주는 예시
def set_access_token_cookie(response: Response, access_token: str):
    response.set_cookie(
        key="access_token",
        value=access_token,
        httponly=True,
        samesite="lax",
        secure=False  # 운영 환경에서는 True로!
    )