from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from ..database import get_db
from ..models import models
from ..schemas.schedule import TrainerResponse

router = APIRouter(prefix="/trainers", tags=["trainers"])

@router.get("/", response_model=List[TrainerResponse])
def get_public_trainers(
    db: Session = Depends(get_db)
):
    """Публичный эндпоинт для получения списка всех тренеров (доступен без авторизации)"""
    trainers = db.query(models.Trainer).all()
    return trainers

@router.get("/{trainer_id}", response_model=TrainerResponse)
def get_public_trainer(
    trainer_id: int,
    db: Session = Depends(get_db)
):
    """Получить информацию о конкретном тренере"""
    trainer = db.query(models.Trainer).filter(models.Trainer.id == trainer_id).first()
    if not trainer:
        raise HTTPException(status_code=404, detail="Тренер не найден")
    return trainer