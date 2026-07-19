from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from ..database import get_db
from ..models import models
from ..schemas.schedule import GymResponse

router = APIRouter(prefix="/public/gyms", tags=["public"])

@router.get("/", response_model=List[GymResponse])
def get_public_gyms(
    db: Session = Depends(get_db)
):
    """Публичный эндпоинт для получения списка всех залов"""
    gyms = db.query(models.Gym).all()
    return gyms

@router.get("/{gym_id}", response_model=GymResponse)
def get_public_gym(
    gym_id: int,
    db: Session = Depends(get_db)
):
    """Получить информацию о конкретном зале"""
    gym = db.query(models.Gym).filter(models.Gym.id == gym_id).first()
    if not gym:
        raise HTTPException(status_code=404, detail="Зал не найден")
    return gym