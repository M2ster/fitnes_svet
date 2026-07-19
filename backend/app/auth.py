from passlib.context import CryptContext
from datetime import datetime, timedelta
from typing import Optional
from jose import JWTError, jwt
from .config import settings

# Создаем контекст для хэширования паролей
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def verify_password(plain_password, hashed_password):
    """Проверка пароля"""
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password):
    """Хэширование пароля с проверкой длины"""
    # bcrypt имеет ограничение в 72 байта
    # Если пароль длиннее, обрезаем его
    if len(password.encode('utf-8')) > 72:
        # Обрезаем до 72 байт
        password_bytes = password.encode('utf-8')[:72]
        # Декодируем обратно в строку, игнорируя ошибки
        password = password_bytes.decode('utf-8', errors='ignore')

    return pwd_context.hash(password)


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)

    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt