from pydantic import BaseModel, ConfigDict, Field, EmailStr
from datetime import date, datetime
from typing import Optional


# Базовая схема пользователя
class UserBase(BaseModel):
    first_name: str = Field(..., min_length=1, max_length=100)
    last_name: str = Field(..., min_length=1, max_length=100)
    patronymic: Optional[str] = Field(None, max_length=100)
    phone: str = Field(..., pattern=r'^\+?[0-9]{10,15}$')
    email: Optional[EmailStr] = None
    birth_date: Optional[date] = None
    photo: Optional[str] = None


# Схема для регистрации
class UserCreate(UserBase):
    password: str = Field(..., min_length=6)


# Схема для ответа
class UserResponse(UserBase):
    id: int
    is_admin: bool
    is_active: bool
    created_at: datetime
    updated_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


# Схема для логина
class UserLogin(BaseModel):
    phone: str
    password: str


# Схема для токена
class Token(BaseModel):
    access_token: str
    token_type: str


class TokenData(BaseModel):
    user_id: Optional[int] = None