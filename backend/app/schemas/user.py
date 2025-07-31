from pydantic import BaseModel
from datetime import datetime
from typing import Optional

class UserBase(BaseModel):
    email: str
    name: str
    picture: Optional[str] = None

class UserCreate(BaseModel):
    email: str
    name: str
    picture: str | None = None

    class Config:
        orm_mode = True             # Pydantic v1
        # from_attributes = True    # Pydantic v2 사용 시 이 옵션으로 변경

class User(UserBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        orm_mode = True


class UserOut(BaseModel):
    id: int
    email: str
    name: str
    picture: str | None

    class Config:
        from_attributes = True  # Pydantic v2; v1이면 orm_mode = True