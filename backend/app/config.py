from pydantic_settings import BaseSettings
from dotenv import load_dotenv
import os

load_dotenv()


class Settings(BaseSettings):
    DATABASE_URL: str
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30  # Добавляем это поле с значением по умолчанию

    class Config:
        env_file = ".env"
        extra = "ignore"  # Игнорировать лишние поля


settings = Settings()