from sqlalchemy.orm import Session
from app.models.user import User as UserModel
from app.schemas.user import UserCreate

def get_user_by_email(db: Session, email: str):
    return db.query(UserModel).filter(UserModel.email == email).first()

def create_user(db: Session, user: UserCreate):
    db_user = UserModel(email=user.email, name=user.name, picture=user.picture)
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user
