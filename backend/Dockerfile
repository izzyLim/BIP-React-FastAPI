# ---- Base image ----
    FROM python:3.11-slim

    # ---- Set working directory ----
    WORKDIR /code
    
    # ---- Install system dependencies ----
    # (optional: psycopg2 필요하므로 build-essential libpq-dev 추가)
    RUN apt-get update && apt-get install -y \
        gcc \
        libpq-dev \
      && rm -rf /var/lib/apt/lists/*
    
    # ---- Copy requirements and install ----
    COPY ./requirements.txt /code/requirements.txt
    RUN pip install --no-cache-dir -r requirements.txt
    
    # ---- Copy application code ----
    COPY ./app /code/app
    
    # ---- Environment variables ----
    ENV PYTHONUNBUFFERED=1
    
    # ---- Command to run FastAPI ----
    CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
    