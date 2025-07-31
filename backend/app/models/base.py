# app/models/base.py

from sqlalchemy.orm import declarative_base

# 모든 ORM 모델이 상속할 Base 클래스
Base = declarative_base()
