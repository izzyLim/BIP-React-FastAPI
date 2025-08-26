# ---- Base image ----
FROM python:3.11-slim

# ---- Set working directory ----
WORKDIR /app

# 필요한 시스템 패키지(예: psycopg2, build-essential 등) 있으면 추가
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential curl && rm -rf /var/lib/apt/lists/*

# 의존성 사전 설치
# requirements.txt 또는 pyproject.toml/poetry.lock 등 프로젝트에 맞게 조정
COPY requirements.txt /app/requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

# 앱 소스 복사
COPY . /app

EXPOSE 8000

# compose에서 command로 uvicorn을 지정하므로 여기 CMD는 선택
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
