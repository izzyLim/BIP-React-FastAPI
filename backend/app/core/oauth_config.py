import os

# OAuth 설정을 중앙 관리
OAUTH_CONFIG = {
    "google": {
        "redirect_uri": os.getenv(
            "GOOGLE_CALLBACK_URL",
            "http://localhost:8000/auth/google/callback"
        )
    }
}

# 프론트엔드 URL
def get_frontend_url() -> str:
    return os.getenv("FRONTEND_URL", "http://localhost:5174")

# 지정된 provider의 설정 반환
def get_oauth_config(provider: str) -> dict:
    try:
        return OAUTH_CONFIG[provider]
    except KeyError:
        raise ValueError(f"Unknown OAuth provider: {provider}")
