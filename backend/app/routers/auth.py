from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy.orm import Session, joinedload
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from typing import Any
from jose import JWTError, jwt  # Добавляем JWTError в импорт

from .. import auth
from ..models import models
from ..database import get_db
from ..models.models import User
from ..schemas.user import UserCreate, UserResponse, Token, UserLogin
from ..config import settings

router = APIRouter(prefix="/auth", tags=["authentication"])

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")

# ... остальной код

router = APIRouter(prefix="/auth", tags=["authentication"])

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")


@router.post("/register", response_model=UserResponse)
def register(user_data: UserCreate, db: Session = Depends(get_db)):
    # Проверяем, существует ли пользователь с таким телефоном
    existing_user = db.query(User).filter(User.phone == user_data.phone).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Пользователь с таким телефоном уже существует"
        )

    # Проверяем email, если он указан
    if user_data.email:
        existing_email = db.query(User).filter(User.email == user_data.email).first()
        if existing_email:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Пользователь с таким email уже существует"
            )

    # Создаем нового пользователя
    hashed_password = auth.get_password_hash(user_data.password)
    db_user = User(
        **user_data.model_dump(exclude={'password'}),
        hashed_password=hashed_password
    )

    db.add(db_user)
    db.commit()
    db.refresh(db_user)

    # ===== ВЫДАЧА БЕСПЛАТНОГО АБОНЕМЕНТА =====
    try:
        # Находим бесплатное предложение (Полный, 1 занятие, цена 0)
        free_offer = db.query(models.MembershipOffer)\
            .options(
                joinedload(models.MembershipOffer.lesson_count),
                joinedload(models.MembershipOffer.valid_days)
            )\
            .filter(
                models.MembershipOffer.price == 0,
                models.MembershipOffer.lesson_count.has(models.LessonCount.count == 1)
            )\
            .first()

        if free_offer:
            start_date = datetime.today()
            end_date = start_date + timedelta(days=free_offer.valid_days.count_day)

            new_membership = models.UserMembership(
                user_id=db_user.id,
                membership_offer_id=free_offer.id,
                purchase_date=start_date,
                start_date=start_date,
                end_date=end_date,
                remaining_classes=1,
                status=models.MembershipStatus.ACTIVE
            )

            db.add(new_membership)
            db.commit()
            print(f"✅ Бесплатный абонемент выдан пользователю {db_user.id}")
        else:
            print("⚠️ Бесплатный абонемент не найден")
    except Exception as e:
        print(f"❌ Ошибка при выдаче бесплатного абонемента: {e}")
        # Не прерываем регистрацию, если не удалось выдать абонемент
        import traceback
        traceback.print_exc()
    # ===== КОНЕЦ ВЫДАЧИ =====

    return db_user


@router.post("/login", response_model=Token)
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    # Ищем пользователя по телефону (в form_data.username придет телефон)
    user = db.query(User).filter(User.phone == form_data.username).first()

    if not user or not auth.verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Неверный телефон или пароль",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Пользователь деактивирован"
        )

    # Создаем токен
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = auth.create_access_token(
        data={"sub": str(user.id)}, expires_delta=access_token_expires
    )

    return {"access_token": access_token, "token_type": "bearer"}


@router.post("/login/json")  # Альтернативный логин через JSON
def login_json(user_data: UserLogin, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.phone == user_data.phone).first()

    if not user or not auth.verify_password(user_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Неверный телефон или пароль"
        )

    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = auth.create_access_token(
        data={"sub": str(user.id)}, expires_delta=access_token_expires
    )

    return {"access_token": access_token, "token_type": "bearer"}


# Зависимость для получения текущего пользователя
async def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Не удалось подтвердить учетные данные",
        headers={"WWW-Authenticate": "Bearer"},
    )

    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception

    user = db.query(User).filter(User.id == int(user_id)).first()
    if user is None:
        raise credentials_exception

    return user


@router.get("/me", response_model=UserResponse)
async def read_users_me(current_user: User = Depends(get_current_user)):
    return current_user