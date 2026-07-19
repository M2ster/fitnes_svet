from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from datetime import date, timedelta

from ..database import get_db
from ..models import models
from ..schemas import membership as schemas
from .auth import get_current_user

router = APIRouter(prefix="/memberships", tags=["memberships"])


@router.options("/my")
@router.options("/offers")
async def options_handler():
    return {"message": "OK"}

# Получить все доступные типы абонементов
@router.get("/offers", response_model=List[schemas.MembershipOfferResponse])
def get_membership_offers(db: Session = Depends(get_db)):
    offers = db.query(models.MembershipOffer).all()
    return offers


# Получить абонементы текущего пользователя
@router.get("/my", response_model=List[schemas.UserMembershipResponse])
def get_my_memberships(
        current_user: models.User = Depends(get_current_user),
        db: Session = Depends(get_db)
):
    memberships = db.query(models.UserMembership) \
        .filter(models.UserMembership.user_id == current_user.id) \
        .all()

    # Обновляем статус просроченных абонементов
    for m in memberships:
        if m.end_date < date.today() and m.status == models.MembershipStatus.ACTIVE:
            m.status = models.MembershipStatus.EXPIRED

    db.commit()
    return memberships


# Купить абонемент (для пользователя)
@router.post("/buy", response_model=schemas.UserMembershipResponse)
def buy_membership(
        membership_data: schemas.UserMembershipCreate,
        current_user: models.User = Depends(get_current_user),
        db: Session = Depends(get_db)
):
    # Получаем предложение абонемента
    offer = db.query(models.MembershipOffer) \
        .filter(models.MembershipOffer.id == membership_data.membership_offer_id) \
        .first()

    if not offer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Абонемент не найден"
        )

    # Получаем количество дней и занятий
    lesson_count = db.query(models.LessonCount) \
        .filter(models.LessonCount.id == offer.lesson_count_id) \
        .first()

    valid_days = db.query(models.ValidDays) \
        .filter(models.ValidDays.id == offer.valid_days_id) \
        .first()

    # Создаем абонемент пользователя
    new_membership = models.UserMembership(
        user_id=current_user.id,
        membership_offer_id=membership_data.membership_offer_id,
        purchase_date=membership_data.start_date or date.today(),
        start_date=membership_data.start_date or date.today(),
        end_date=(membership_data.start_date or date.today()) + timedelta(days=valid_days.count_day),
        remaining_classes=lesson_count.count,
        status=models.MembershipStatus.ACTIVE
    )

    db.add(new_membership)
    db.commit()
    db.refresh(new_membership)

    return new_membership


# Админ: создать абонемент пользователю
@router.post("/admin/create", response_model=schemas.UserMembershipResponse)
def create_membership_admin(
        membership_data: schemas.AdminMembershipCreate,
        current_user: models.User = Depends(get_current_user),
        db: Session = Depends(get_db)
):
    # Проверяем, что текущий пользователь - админ
    if not current_user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Только администратор может создавать абонементы"
        )

    # Проверяем, что пользователь существует
    user = db.query(models.User) \
        .filter(models.User.id == membership_data.user_id) \
        .first()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Пользователь не найден"
        )

    # Получаем предложение абонемента
    offer = db.query(models.MembershipOffer) \
        .filter(models.MembershipOffer.id == membership_data.membership_offer_id) \
        .first()

    if not offer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Абонемент не найден"
        )

    # Получаем количество дней и занятий
    lesson_count = db.query(models.LessonCount) \
        .filter(models.LessonCount.id == offer.lesson_count_id) \
        .first()

    valid_days = db.query(models.ValidDays) \
        .filter(models.ValidDays.id == offer.valid_days_id) \
        .first()

    # Создаем абонемент
    new_membership = models.UserMembership(
        user_id=membership_data.user_id,
        membership_offer_id=membership_data.membership_offer_id,
        purchase_date=membership_data.purchase_date,
        start_date=membership_data.start_date,
        end_date=membership_data.start_date + timedelta(days=valid_days.count_day),
        remaining_classes=lesson_count.count,
        status=models.MembershipStatus.ACTIVE
    )

    db.add(new_membership)
    db.commit()
    db.refresh(new_membership)

    return new_membership


# Получить все абонементы (только для админа)
@router.get("/admin/all", response_model=List[schemas.UserMembershipResponse])
def get_all_memberships(
        current_user: models.User = Depends(get_current_user),
        db: Session = Depends(get_db)
):
    if not current_user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Только для администратора"
        )

    memberships = db.query(models.UserMembership).all()
    return memberships