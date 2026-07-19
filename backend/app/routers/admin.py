from fastapi import APIRouter, Depends, HTTPException, status, Response
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import and_, func, desc
from typing import List
from datetime import datetime, date, time, timedelta
import os
from fastapi.responses import JSONResponse

from ..database import get_db
from ..models import models
from ..schemas import (
    # Admin схемы
    DashboardStats,
    AdminUserResponse,
    AdminMembershipResponse,
    # Schedule схемы
    LessonResponse,
    LessonCreate,
    TypeLessonResponse,
    TypeLessonCreate,
    TrainerResponse,
    TrainerCreate,
    GymResponse,
    GymCreate,
    BookingCheckIn,
    # Membership схемы
    MembershipOfferResponse,
    MembershipOfferCreate,
    UserMembershipResponse
)
from .auth import get_current_user

router = APIRouter(prefix="/admin", tags=["admin"])

@router.api_route("/{path:path}", methods=["OPTIONS"])
async def options_universal(path: str):
    """Обработка всех preflight запросов"""
    return Response(
        status_code=200,
        headers={
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS, PATCH",
            "Access-Control-Allow-Headers": "*",
            "Access-Control-Max-Age": "3600",
        }
    )


# Проверка на админа
async def check_admin(current_user: models.User = Depends(get_current_user)):
    if not current_user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Требуются права администратора"
        )
    return current_user


# ========== СТАТИСТИКА ==========

@router.get("/stats", response_model=DashboardStats)
def get_dashboard_stats(
        admin: models.User = Depends(check_admin),
        db: Session = Depends(get_db)
):
    """Получить статистику для дашборда"""

    # Общее количество пользователей
    total_users = db.query(models.User).count()

    # Количество активных абонементов
    active_memberships = db.query(models.UserMembership) \
        .filter(
        and_(
            models.UserMembership.status == models.MembershipStatus.ACTIVE,
            models.UserMembership.end_date >= date.today(),
            models.UserMembership.remaining_classes > 0
        )
    ) \
        .count()

    # Занятия на сегодня
    today_start = datetime.combine(date.today(), time.min)
    today_end = datetime.combine(date.today(), time.max)

    today_lessons = db.query(models.Lesson) \
        .filter(
        and_(
            models.Lesson.date_lesson >= today_start,
            models.Lesson.date_lesson <= today_end
        )
    ) \
        .count()

    # Записи на сегодня
    today_bookings = db.query(models.Booking) \
        .join(models.Lesson) \
        .filter(
        and_(
            models.Lesson.date_lesson >= today_start,
            models.Lesson.date_lesson <= today_end,
            models.Booking.status != models.BookingStatus.CANCELLED
        )
    ) \
        .count()

    # Популярные занятия (за последние 30 дней)
    month_ago = datetime.now() - timedelta(days=30)

    popular_lessons = db.query(
        models.Lesson.type_lesson_id,
        models.TypeLesson.name,
        func.count(models.Booking.id).label('bookings_count')
    ) \
        .join(models.Lesson.lesson_type) \
        .outerjoin(models.Booking) \
        .filter(models.Lesson.date_lesson >= month_ago) \
        .group_by(models.Lesson.type_lesson_id, models.TypeLesson.name) \
        .order_by(desc('bookings_count')) \
        .limit(5) \
        .all()

    popular = []
    for lesson_id, name, count in popular_lessons:
        popular.append({"name": name, "count": count})

    # Количество записей за последние 7 дней
    week_ago = datetime.now() - timedelta(days=7)
    recent_bookings = db.query(models.Booking) \
        .filter(models.Booking.booking_time >= week_ago) \
        .count()

    return {
        "total_users": total_users,
        "active_memberships": active_memberships,
        "today_lessons": today_lessons,
        "today_bookings": today_bookings,
        "popular_lessons": popular,
        "recent_bookings": recent_bookings
    }


# ========== УПРАВЛЕНИЕ ПОЛЬЗОВАТЕЛЯМИ ==========

@router.get("/users", response_model=List[AdminUserResponse])
def get_all_users(
        admin: models.User = Depends(check_admin),
        db: Session = Depends(get_db),
        skip: int = 0,
        limit: int = 100
):
    """Получить список всех пользователей"""

    users = db.query(models.User) \
        .order_by(models.User.created_at.desc()) \
        .offset(skip) \
        .limit(limit) \
        .all()

    result = []
    for user in users:
        memberships_count = db.query(models.UserMembership) \
            .filter(models.UserMembership.user_id == user.id) \
            .count()

        user_dict = {
            "id": user.id,
            "first_name": user.first_name,
            "last_name": user.last_name,
            "patronymic": user.patronymic,
            "phone": user.phone,
            "email": user.email,
            "birth_date": user.birth_date,
            "is_admin": user.is_admin,
            "is_active": user.is_active,
            "created_at": user.created_at,
            "memberships_count": memberships_count
        }
        result.append(user_dict)

    return result


@router.get("/users/search", response_model=List[AdminUserResponse])
def search_users(
        query: str,
        admin: models.User = Depends(check_admin),
        db: Session = Depends(get_db)
):
    """Поиск пользователей по имени, телефону или email"""

    search = f"%{query}%"

    users = db.query(models.User) \
        .filter(
        (models.User.first_name.ilike(search)) |
        (models.User.last_name.ilike(search)) |
        (models.User.patronymic.ilike(search)) |
        (models.User.phone.ilike(search)) |
        (models.User.email.ilike(search))
    ) \
        .order_by(models.User.created_at.desc()) \
        .all()

    result = []
    for user in users:
        memberships_count = db.query(models.UserMembership) \
            .filter(models.UserMembership.user_id == user.id) \
            .count()

        user_dict = {
            "id": user.id,
            "first_name": user.first_name,
            "last_name": user.last_name,
            "patronymic": user.patronymic,
            "phone": user.phone,
            "email": user.email,
            "birth_date": user.birth_date,
            "is_admin": user.is_admin,
            "is_active": user.is_active,
            "created_at": user.created_at,
            "memberships_count": memberships_count
        }
        result.append(user_dict)

    return result


@router.get("/users/{user_id}", response_model=AdminUserResponse)
def get_user_details(
        user_id: int,
        admin: models.User = Depends(check_admin),
        db: Session = Depends(get_db)
):
    """Получить детальную информацию о пользователе"""

    user = db.query(models.User) \
        .filter(models.User.id == user_id) \
        .first()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Пользователь не найден"
        )

    memberships_count = db.query(models.UserMembership) \
        .filter(models.UserMembership.user_id == user.id) \
        .count()

    return {
        "id": user.id,
        "first_name": user.first_name,
        "last_name": user.last_name,
        "patronymic": user.patronymic,
        "phone": user.phone,
        "email": user.email,
        "birth_date": user.birth_date,
        "is_admin": user.is_admin,
        "is_active": user.is_active,
        "created_at": user.created_at,
        "memberships_count": memberships_count
    }


# ========== УПРАВЛЕНИЕ АБОНЕМЕНТАМИ ==========

@router.get("/memberships", response_model=List[AdminMembershipResponse])
def get_all_memberships(
        admin: models.User = Depends(check_admin),
        db: Session = Depends(get_db),
        skip: int = 0,
        limit: int = 100
):
    """Получить список всех абонементов"""

    memberships = db.query(models.UserMembership) \
        .options(
        joinedload(models.UserMembership.user),
        joinedload(models.UserMembership.membership_offer)
        .joinedload(models.MembershipOffer.lesson_type)
    ) \
        .order_by(models.UserMembership.purchase_date.desc()) \
        .offset(skip) \
        .limit(limit) \
        .all()

    result = []
    for m in memberships:
        result.append({
            "id": m.id,
            "user_id": m.user_id,
            "user_name": f"{m.user.last_name} {m.user.first_name}",
            "membership_offer_id": m.membership_offer_id,
            "offer_name": m.membership_offer.lesson_type.name if m.membership_offer and m.membership_offer.lesson_type else "Абонемент",
            "purchase_date": m.purchase_date,
            "start_date": m.start_date,
            "end_date": m.end_date,
            "remaining_classes": m.remaining_classes,
            "status": m.status.value
        })

    return result


@router.get("/memberships/expiring")
def get_expiring_memberships(
        days: int = 7,
        admin: models.User = Depends(check_admin),
        db: Session = Depends(get_db)
):
    """Получить абонементы, истекающие через N дней"""

    expiry_date = date.today() + timedelta(days=days)

    memberships = db.query(models.UserMembership) \
        .options(
        joinedload(models.UserMembership.user),
        joinedload(models.UserMembership.membership_offer)
        .joinedload(models.MembershipOffer.lesson_type)
    ) \
        .filter(
        and_(
            models.UserMembership.end_date <= expiry_date,
            models.UserMembership.end_date >= date.today(),
            models.UserMembership.status == models.MembershipStatus.ACTIVE,
            models.UserMembership.remaining_classes > 0
        )
    ) \
        .all()

    result = []
    for m in memberships:
        days_left = (m.end_date - date.today()).days
        result.append({
            "id": m.id,
            "user_name": f"{m.user.last_name} {m.user.first_name}",
            "user_phone": m.user.phone,
            "offer_name": m.membership_offer.lesson_type.name if m.membership_offer and m.membership_offer.lesson_type else "Абонемент",
            "end_date": m.end_date.isoformat(),
            "days_left": days_left,
            "remaining_classes": m.remaining_classes
        })

    return result


# ========== УПРАВЛЕНИЕ ТИПАМИ ЗАНЯТИЙ ==========

@router.get("/lesson-types", response_model=List[TypeLessonResponse])
def get_lesson_types(
        admin: models.User = Depends(check_admin),
        db: Session = Depends(get_db)
):
    """Получить все типы занятий"""
    types = db.query(models.TypeLesson).all()
    return types


@router.post("/lesson-types", response_model=TypeLessonResponse)
def create_lesson_type(
        type_data: TypeLessonCreate,
        admin: models.User = Depends(check_admin),
        db: Session = Depends(get_db)
):
    """Создать новый тип занятия"""
    lesson_type = models.TypeLesson(**type_data.model_dump())
    db.add(lesson_type)
    db.commit()
    db.refresh(lesson_type)
    return lesson_type


# ========== УПРАВЛЕНИЕ ТРЕНЕРАМИ ==========

@router.get("/trainers", response_model=List[TrainerResponse])
def get_trainers(
        admin: models.User = Depends(check_admin),
        db: Session = Depends(get_db)
):
    """Получить всех тренеров"""
    trainers = db.query(models.Trainer).all()
    return trainers


@router.get("/trainers/{trainer_id}", response_model=TrainerResponse)
def get_trainer(
        trainer_id: int,
        admin: models.User = Depends(check_admin),
        db: Session = Depends(get_db)
):
    """Получить тренера по ID"""
    trainer = db.query(models.Trainer).filter(models.Trainer.id == trainer_id).first()
    if not trainer:
        raise HTTPException(status_code=404, detail="Тренер не найден")
    return trainer


@router.post("/trainers", response_model=TrainerResponse)
def create_trainer(
        trainer_data: TrainerCreate,
        admin: models.User = Depends(check_admin),
        db: Session = Depends(get_db)
):
    """Создать нового тренера"""
    trainer = models.Trainer(**trainer_data.model_dump())
    db.add(trainer)
    db.commit()
    db.refresh(trainer)
    return trainer


@router.put("/trainers/{trainer_id}", response_model=TrainerResponse)
def update_trainer(
        trainer_id: int,
        trainer_data: TrainerCreate,
        admin: models.User = Depends(check_admin),
        db: Session = Depends(get_db)
):
    """Обновить данные тренера"""
    trainer = db.query(models.Trainer).filter(models.Trainer.id == trainer_id).first()
    if not trainer:
        raise HTTPException(status_code=404, detail="Тренер не найден")

    # Сохраняем текущее фото
    current_photo = trainer.photo

    # Обновляем только переданные поля
    update_data = trainer_data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(trainer, key, value)

    # Восстанавливаем фото, если оно не было передано в запросе
    if not hasattr(trainer_data, 'photo') or trainer_data.photo is None:
        trainer.photo = current_photo

    db.commit()
    db.refresh(trainer)
    return trainer


@router.delete("/trainers/{trainer_id}")
def delete_trainer(
        trainer_id: int,
        admin: models.User = Depends(check_admin),
        db: Session = Depends(get_db)
):
    """Удалить тренера"""
    trainer = db.query(models.Trainer).filter(models.Trainer.id == trainer_id).first()
    if not trainer:
        raise HTTPException(status_code=404, detail="Тренер не найден")

    # Проверяем, есть ли у тренера занятия
    lessons_count = db.query(models.Lesson).filter(models.Lesson.trainer_id == trainer_id).count()
    if lessons_count > 0:
        raise HTTPException(
            status_code=400,
            detail=f"Нельзя удалить тренера, у которого есть занятия ({lessons_count})"
        )

    # Удаляем фото, если есть
    if trainer.photo:
        try:
            filename = trainer.photo.split("/")[-1]
            file_path = f"uploads/trainers/{filename}"
            if os.path.exists(file_path):
                os.remove(file_path)
        except Exception as e:
            print(f"Ошибка при удалении фото: {e}")

    db.delete(trainer)
    db.commit()

    return {"message": "Тренер успешно удален", "success": True}


# ========== УПРАВЛЕНИЕ ЗАЛАМИ ==========

# ========== УПРАВЛЕНИЕ ЗАЛАМИ ==========

@router.get("/gyms", response_model=List[GymResponse])
def get_gyms(
        admin: models.User = Depends(check_admin),
        db: Session = Depends(get_db)
):
    """Получить все залы"""
    gyms = db.query(models.Gym).all()
    return gyms


@router.get("/gyms/{gym_id}", response_model=GymResponse)
def get_gym(
        gym_id: int,
        admin: models.User = Depends(check_admin),
        db: Session = Depends(get_db)
):
    """Получить зал по ID"""
    gym = db.query(models.Gym).filter(models.Gym.id == gym_id).first()
    if not gym:
        raise HTTPException(status_code=404, detail="Зал не найден")
    return gym


@router.post("/gyms", response_model=GymResponse)
def create_gym(
        gym_data: GymCreate,
        admin: models.User = Depends(check_admin),
        db: Session = Depends(get_db)
):
    """Создать новый зал"""
    gym = models.Gym(**gym_data.model_dump())
    db.add(gym)
    db.commit()
    db.refresh(gym)
    return gym


@router.put("/gyms/{gym_id}", response_model=GymResponse)
def update_gym(
        gym_id: int,
        gym_data: GymCreate,
        admin: models.User = Depends(check_admin),
        db: Session = Depends(get_db)
):
    """Обновить данные зала"""
    gym = db.query(models.Gym).filter(models.Gym.id == gym_id).first()
    if not gym:
        raise HTTPException(status_code=404, detail="Зал не найден")

    # Сохраняем текущее фото
    current_photo = gym.photo

    # Обновляем поля
    for key, value in gym_data.model_dump().items():
        setattr(gym, key, value)

    # Если фото не было в данных, восстанавливаем
    if not gym_data.photo:
        gym.photo = current_photo

    db.commit()
    db.refresh(gym)
    return gym


@router.delete("/gyms/{gym_id}")
def delete_gym(
        gym_id: int,
        admin: models.User = Depends(check_admin),
        db: Session = Depends(get_db)
):
    """Удалить зал"""
    gym = db.query(models.Gym).filter(models.Gym.id == gym_id).first()
    if not gym:
        raise HTTPException(status_code=404, detail="Зал не найден")

    # Проверяем, есть ли занятия в этом зале
    lessons_count = db.query(models.Lesson).filter(models.Lesson.gym_id == gym_id).count()
    if lessons_count > 0:
        raise HTTPException(
            status_code=400,
            detail=f"Нельзя удалить зал, в котором запланированы занятия ({lessons_count})"
        )

    # Удаляем фото, если есть
    if gym.photo:
        try:
            filename = gym.photo.split("/")[-1]
            file_path = f"uploads/gyms/{filename}"
            if os.path.exists(file_path):
                os.remove(file_path)
        except Exception as e:
            print(f"Ошибка при удалении фото: {e}")

    db.delete(gym)
    db.commit()

    return {"message": "Зал успешно удален", "success": True}


# ========== УПРАВЛЕНИЕ ТИПАМИ АБОНЕМЕНТОВ ==========

@router.get("/membership-offers", response_model=List[MembershipOfferResponse])
def get_membership_offers(
        admin: models.User = Depends(check_admin),
        db: Session = Depends(get_db)
):
    """Получить все типы абонементов"""
    offers = db.query(models.MembershipOffer).all()
    return offers


@router.post("/membership-offers", response_model=MembershipOfferResponse)
def create_membership_offer(
        offer_data: MembershipOfferCreate,
        admin: models.User = Depends(check_admin),
        db: Session = Depends(get_db)
):
    """Создать новый тип абонемента"""

    # Проверяем существование связанных записей
    lesson_type = db.query(models.TypeLesson).filter(models.TypeLesson.id == offer_data.type_membership_id).first()
    if not lesson_type:
        raise HTTPException(status_code=404, detail="Тип занятия не найден")

    # Получаем количество занятий
    lesson_count = db.query(models.LessonCount).filter(models.LessonCount.id == offer_data.lesson_count_id).first()
    if not lesson_count:
        raise HTTPException(status_code=404, detail="Количество занятий не найдено")

    # Получаем срок действия
    valid_days = db.query(models.ValidDays).filter(models.ValidDays.id == offer_data.valid_days_id).first()
    if not valid_days:
        raise HTTPException(status_code=404, detail="Срок действия не найден")

    # Создаем предложение
    offer = models.MembershipOffer(
        type_membership_id=offer_data.type_membership_id,
        lesson_count_id=offer_data.lesson_count_id,
        valid_days_id=offer_data.valid_days_id,
        price=offer_data.price
    )

    db.add(offer)
    db.commit()
    db.refresh(offer)
    return offer


@router.put("/membership-offers/{offer_id}", response_model=MembershipOfferResponse)
def update_membership_offer(
        offer_id: int,
        offer_data: MembershipOfferCreate,
        admin: models.User = Depends(check_admin),
        db: Session = Depends(get_db)
):
    """Обновить тип абонемента"""

    offer = db.query(models.MembershipOffer).filter(models.MembershipOffer.id == offer_id).first()
    if not offer:
        raise HTTPException(status_code=404, detail="Тип абонемента не найден")

    for key, value in offer_data.model_dump().items():
        setattr(offer, key, value)

    db.commit()
    db.refresh(offer)
    return offer


@router.delete("/membership-offers/{offer_id}")
def delete_membership_offer(
        offer_id: int,
        admin: models.User = Depends(check_admin),
        db: Session = Depends(get_db)
):
    """Удалить тип абонемента"""

    offer = db.query(models.MembershipOffer).filter(models.MembershipOffer.id == offer_id).first()
    if not offer:
        raise HTTPException(status_code=404, detail="Тип абонемента не найден")

    # Проверяем, есть ли абонементы этого типа у пользователей
    memberships_count = db.query(models.UserMembership) \
        .filter(models.UserMembership.membership_offer_id == offer_id) \
        .count()

    if memberships_count > 0:
        raise HTTPException(
            status_code=400,
            detail=f"Нельзя удалить тип абонемента, который используется в {memberships_count} абонементах пользователей"
        )

    db.delete(offer)
    db.commit()

    return {"message": "Тип абонемента удален", "success": True}


# ========== УПРАВЛЕНИЕ РАСПИСАНИЕМ ==========


@router.options("/lessons/{lesson_id}")
async def options_lesson_delete():
    """Обработка preflight запроса для DELETE"""
    return Response(
        status_code=200,
        headers={
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
            "Access-Control-Allow-Headers": "*",
            "Access-Control-Max-Age": "3600",
        }
    )


@router.post("/lessons", response_model=LessonResponse)
def create_lesson(
        lesson_data: LessonCreate,
        admin: models.User = Depends(check_admin),
        db: Session = Depends(get_db)
):
    """Создать занятие в расписании"""

    # Проверяем, что тип занятия существует
    lesson_type = db.query(models.TypeLesson).filter(models.TypeLesson.id == lesson_data.type_lesson_id).first()
    if not lesson_type:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Тип занятия не найден"
        )

    # Проверяем, что зал существует
    gym = db.query(models.Gym).filter(models.Gym.id == lesson_data.gym_id).first()
    if not gym:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Зал не найден"
        )

    # Проверяем, что тренер существует
    trainer = db.query(models.Trainer).filter(models.Trainer.id == lesson_data.trainer_id).first()
    if not trainer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Тренер не найден"
        )

    # Создаем занятие
    lesson = models.Lesson(**lesson_data.model_dump())
    db.add(lesson)
    db.commit()
    db.refresh(lesson)

    return lesson


@router.put("/lessons/{lesson_id}", response_model=LessonResponse)
def update_lesson(
        lesson_id: int,
        lesson_data: LessonCreate,
        admin: models.User = Depends(check_admin),
        db: Session = Depends(get_db)
):
    """Обновить занятие"""

    lesson = db.query(models.Lesson).filter(models.Lesson.id == lesson_id).first()
    if not lesson:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Занятие не найдено"
        )

    for key, value in lesson_data.model_dump().items():
        setattr(lesson, key, value)

    db.commit()
    db.refresh(lesson)

    return lesson


@router.delete("/lessons/{lesson_id}")
def delete_lesson(
        lesson_id: int,
        admin: models.User = Depends(check_admin),
        db: Session = Depends(get_db)
):
    """Удалить занятие"""
    try:
        lesson = db.query(models.Lesson).filter(models.Lesson.id == lesson_id).first()
        if not lesson:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Занятие не найдено"
            )

        # Проверяем, есть ли НЕОТМЕНЕННЫЕ записи на это занятие
        active_bookings_count = db.query(models.Booking) \
            .filter(
            and_(
                models.Booking.lesson_id == lesson_id,
                models.Booking.status != models.BookingStatus.CANCELLED
            )
        ) \
            .count()

        if active_bookings_count > 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Нельзя удалить занятие, на которое есть активные записи ({active_bookings_count})"
            )

        # Если есть только отмененные записи - удаляем и их тоже
        cancelled_bookings = db.query(models.Booking) \
            .filter(
            and_(
                models.Booking.lesson_id == lesson_id,
                models.Booking.status == models.BookingStatus.CANCELLED
            )
        ) \
            .all()

        # Удаляем отмененные записи
        for booking in cancelled_bookings:
            db.delete(booking)

        # Удаляем само занятие
        db.delete(lesson)
        db.commit()

        return {
            "message": f"Занятие удалено, также удалено {len(cancelled_bookings)} отмененных записей",
            "success": True
        }
    except HTTPException:
        raise
    except Exception as e:
        print(f"Ошибка при удалении занятия: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Ошибка при удалении: {str(e)}"
        )

@router.get("/lessons/{lesson_id}/bookings")
def get_lesson_bookings(
        lesson_id: int,
        admin: models.User = Depends(check_admin),
        db: Session = Depends(get_db)
):
    """Получить все записи на занятие"""

    bookings = db.query(models.Booking) \
        .filter(
        models.Booking.lesson_id == lesson_id,
        models.Booking.status != models.BookingStatus.CANCELLED
    ) \
        .all()

    result = []
    for booking in bookings:
        result.append({
            "id": booking.id,
            "user_name": f"{booking.user.last_name} {booking.user.first_name}",
            "user_phone": booking.user.phone,
            "status": booking.status.value,
            "booking_time": booking.booking_time.isoformat() if booking.booking_time else None,
            "membership_remaining": booking.user_membership.remaining_classes if booking.user_membership else 0
        })

    return result


@router.post("/checkin")
def checkin_user(
        checkin_data: BookingCheckIn,
        admin: models.User = Depends(check_admin),
        db: Session = Depends(get_db)
):
    """Отметить посещение"""

    booking = db.query(models.Booking).filter(models.Booking.id == checkin_data.booking_id).first()
    if not booking:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Запись не найдена"
        )

    booking.status = checkin_data.status
    db.commit()

    status_text = "посетил" if checkin_data.status == models.BookingStatus.VISITED else "не посетил"

    return {"message": f"Отмечено, что пользователь {status_text} занятие"}


# ========== ОТЧЕТЫ ==========

@router.get("/sales-report")
def get_sales_report(
        start_date: str,
        end_date: str,
        admin: models.User = Depends(check_admin),
        db: Session = Depends(get_db)
):
    """Получить детальный отчет по продажам абонементов за период"""
    try:
        # Парсим даты
        start = datetime.strptime(start_date, "%Y-%m-%d").date()
        end = datetime.strptime(end_date, "%Y-%m-%d").date()

        # Получаем все абонементы, купленные в этот период
        memberships = db.query(models.UserMembership) \
            .options(
            joinedload(models.UserMembership.membership_offer)
            .joinedload(models.MembershipOffer.lesson_type),
            joinedload(models.UserMembership.membership_offer)
            .joinedload(models.MembershipOffer.lesson_count),
            joinedload(models.UserMembership.membership_offer)
            .joinedload(models.MembershipOffer.valid_days)
        ) \
            .filter(
            and_(
                models.UserMembership.purchase_date >= start,
                models.UserMembership.purchase_date <= end
            )
        ) \
            .all()

        # Собираем детальную статистику
        summary = {}
        total_sales = 0
        total_memberships = 0

        for m in memberships:
            offer = m.membership_offer
            lesson_type = offer.lesson_type.name if offer.lesson_type else "Абонемент"
            lessons_count = offer.lesson_count.count if offer.lesson_count else 0
            valid_days = offer.valid_days.count_day if offer.valid_days else 0
            price = offer.price

            # Создаем уникальный ключ для группировки
            key = f"{lesson_type} ({lessons_count} занятий, {valid_days} дней)"

            if key not in summary:
                summary[key] = {
                    "type": lesson_type,
                    "lessons": lessons_count,
                    "days": valid_days,
                    "price_per_item": price,
                    "count": 0,
                    "total": 0
                }

            summary[key]["count"] += 1
            summary[key]["total"] += price
            total_sales += price
            total_memberships += 1

        # Преобразуем в список для фронтенда
        report_data = []
        for key, data in summary.items():
            report_data.append({
                "name": key,
                "type": data["type"],
                "lessons": data["lessons"],
                "days": data["days"],
                "count": data["count"],
                "price_per_item": data["price_per_item"],
                "total": data["total"]
            })

        # Сортируем по сумме (от большей к меньшей)
        report_data.sort(key=lambda x: x["total"], reverse=True)

        return {
            "period": {
                "start": start.isoformat(),
                "end": end.isoformat()
            },
            "summary": report_data,
            "total_memberships": total_memberships,
            "total_sales": total_sales
        }

    except Exception as e:
        print(f"Ошибка при формировании отчета: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Ошибка при формировании отчета: {str(e)}"
        )