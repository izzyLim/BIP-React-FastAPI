# scripts/generate_jwt_secret.py

import secrets

def generate_jwt_secret():
    """256비트 (32바이트) 랜덤 시크릿 키 생성"""
    return secrets.token_urlsafe(32)

print(f"JWT_SECRET_KEY={generate_jwt_secret()}")