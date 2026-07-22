from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import and_
from typing import List
from datetime import datetime, date, time, timedelta

from ..database import get_db
from ..models import models
from ..schemas import schedule as schemas
from .auth import get_current_user

router = APIRouter(prefix="/schedule", tags=["schedule"])



@router.options("/my/bookings")
@router.options("/my/upcoming")
@router.options("/cancel/{booking_id}")
@router.options("/book")
@router.options("/{date}")
async def options_handler():
    return {"message": "OK"}


def update_old_bookings_status(db: Session):
    """Автоматически обновляет статус прошедших занятий на VISITED"""
    try:
        now = datetime.now()

        # Находим все подтвержденные записи на прошедшие занятия
        old_bookings = db.query(models.Booking) \
            .join(models.Lesson) \
            .filter(
            models.Booking.status == models.BookingStatus.CONFIRMED,
            models.Lesson.date_lesson < now
        ) \
            .all()

        for booking in old_bookings:
            booking.status = models.BookingStatus.VISITED

        if old_bookings:
            db.commit()
            print(f"Обновлено {len(old_bookings)} записей на VISITED")
    except Exception as e:
        print(f"Ошибка при обновлении статусов: {e}")

# Получить расписание на конкретную дату
@router.get("/{date}", response_model=List[schemas.LessonResponse])
def get_schedule_by_date(
        date: date,
        db: Session = Depends(get_db)
):
    """Получить все занятия на указанную дату"""

    # Начало и конец выбранного дня
    start_datetime = datetime.combine(date, time.min)
    end_datetime = datetime.combine(date, time.max)

    # Получаем занятия с информацией о типе, зале и тренере
    lessons = db.query(models.Lesson) \
        .options(
        joinedload(models.Lesson.lesson_type),
        joinedload(models.Lesson.gym),
        joinedload(models.Lesson.trainer)
    ) \
        .filter(
        and_(
            models.Lesson.date_lesson >= start_datetime,
            models.Lesson.date_lesson <= end_datetime
        )
    ) \
        .order_by(models.Lesson.date_lesson) \
        .all()

    # Для каждого занятия добавляем информацию о свободных местах
    result = []
    for lesson in lessons:
        # Считаем количество подтвержденных записей
        booked_count = db.query(models.Booking) \
            .filter(
            and_(
                models.Booking.lesson_id == lesson.id,
                models.Booking.status.in_([models.BookingStatus.CONFIRMED, models.BookingStatus.VISITED])
            )
        ) \
            .count()

        lesson_dict = {
            "id": lesson.id,
            "type_lesson_id": lesson.type_lesson_id,
            "date_lesson": lesson.date_lesson,
            "gym_id": lesson.gym_id,
            "trainer_id": lesson.trainer_id,
            "lesson_type": lesson.lesson_type,
            "gym": lesson.gym,
            "trainer": lesson.trainer,
            "available_seats": lesson.lesson_type.capacity - booked_count,
            "booked_count": booked_count
        }
        result.append(lesson_dict)

    return result


# Получить конкретное занятие
@router.get("/lesson/{lesson_id}", response_model=schemas.LessonResponse)
def get_lesson(
        lesson_id: int,
        db: Session = Depends(get_db)
):
    lesson = db.query(models.Lesson) \
        .options(
        joinedload(models.Lesson.lesson_type),
        joinedload(models.Lesson.gym),
        joinedload(models.Lesson.trainer)
    ) \
        .filter(models.Lesson.id == lesson_id) \
        .first()

    if not lesson:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Занятие не найдено"
        )

    booked_count = db.query(models.Booking) \
        .filter(
        and_(
            models.Booking.lesson_id == lesson.id,
            models.Booking.status.in_([models.BookingStatus.CONFIRMED, models.BookingStatus.VISITED])
        )
    ) \
        .count()

    return {
        "id": lesson.id,
        "type_lesson_id": lesson.type_lesson_id,
        "date_lesson": lesson.date_lesson,
        "gym_id": lesson.gym_id,
        "trainer_id": lesson.trainer_id,
        "lesson_type": lesson.lesson_type,
        "gym": lesson.gym,
        "trainer": lesson.trainer,
        "available_seats": lesson.lesson_type.capacity - booked_count,
        "booked_count": booked_count
    }


# Записаться на занятие
@router.post("/book", response_model=schemas.BookingResponse)
def book_lesson(
        booking_data: schemas.BookingCreate,
        current_user: models.User = Depends(get_current_user),
        db: Session = Depends(get_db)
):
    """Записаться на занятие"""
    try:
        print(f"Попытка записи: пользователь {current_user.id}, данные: {booking_data}")

        # Проверяем, существует ли занятие
        lesson = db.query(models.Lesson) \
            .options(joinedload(models.Lesson.lesson_type)) \
            .filter(models.Lesson.id == booking_data.lesson_id) \
            .first()

        if not lesson:
            print(f"Занятие {booking_data.lesson_id} не найдено")
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Занятие не найдено"
            )

        print(f"Занятие найдено: {lesson.id}, тип: {lesson.lesson_type.name if lesson.lesson_type else 'None'}")

        # Проверяем, не прошло ли уже занятие
        if lesson.date_lesson < datetime.now():
            print(f"Занятие уже прошло: {lesson.date_lesson}")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Нельзя записаться на прошедшее занятие"
            )

        # Проверяем, есть ли уже запись у пользователя на это занятие
        existing_booking = db.query(models.Booking) \
            .filter(
            and_(
                models.Booking.lesson_id == lesson.id,
                models.Booking.user_id == current_user.id,
                models.Booking.status != models.BookingStatus.CANCELLED
            )
        ) \
            .first()

        if existing_booking:
            print(f"У пользователя {current_user.id} уже есть запись на занятие {lesson.id}")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Вы уже записаны на это занятие"
            )

        # Проверяем, есть ли свободные места
        booked_count = db.query(models.Booking) \
            .filter(
            and_(
                models.Booking.lesson_id == lesson.id,
                models.Booking.status.in_([models.BookingStatus.CONFIRMED, models.BookingStatus.VISITED])
            )
        ) \
            .count()

        print(f"Записано: {booked_count}, вместимость: {lesson.lesson_type.capacity if lesson.lesson_type else 0}")

        if booked_count >= lesson.lesson_type.capacity:
            print("Нет свободных мест")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Нет свободных мест"
            )

        # Проверяем абонемент пользователя
        print(f"Проверка абонемента {booking_data.user_membership_id} для пользователя {current_user.id}")

        membership = db.query(models.UserMembership) \
            .options(joinedload(models.UserMembership.membership_offer)) \
            .filter(
            and_(
                models.UserMembership.id == booking_data.user_membership_id,
                models.UserMembership.user_id == current_user.id,
                models.UserMembership.status == models.MembershipStatus.ACTIVE,
                models.UserMembership.end_date >= date.today(),
                models.UserMembership.remaining_classes > 0
            )
        ) \
            .first()

        if not membership:
            print(f"Абонемент {booking_data.user_membership_id} недействителен")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Абонемент недействителен или закончился"
            )

        lesson_date = lesson.date_lesson.date()  # получаем только дату
        membership_end_date = membership.end_date

        if lesson_date > membership_end_date:
            print(f"Дата занятия {lesson_date} позже окончания абонемента {membership_end_date}")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Абонемент действует до {membership_end_date.strftime('%d.%m.%Y')}. Вы не можете записаться на более позднюю дату"
            )

        print(f"Абонемент найден: {membership.id}, осталось занятий: {membership.remaining_classes}, действует до: {membership.end_date}")

        # ===== ПРОВЕРКА СООТВЕТСТВИЯ ТИПА ЗАНЯТИЯ ТИПУ АБОНЕМЕНТА =====
        membership_lesson_type = membership.membership_offer.lesson_type
        membership_type_name = membership_lesson_type.name.lower() if membership_lesson_type else ""
        lesson_type_name = lesson.lesson_type.name.lower() if lesson.lesson_type else ""

        print(f"Тип абонемента: {membership_type_name}, Тип занятия: {lesson_type_name}")

        # Проверяем соответствие
        is_match = False

        # 1. Если абонемент "Полный" - можно на всё, кроме детской йоги
        if "полный" in membership_type_name:
            if "детская" not in lesson_type_name:
                is_match = True
                print("Абонемент 'Полный' - разрешены все взрослые направления")
            else:
                print("Абонемент 'Полный' НЕ работает для детской йоги")

        # 2. Специальная проверка для "Йога в гамаках" (только "Полный")
        elif "йога в гамаках" in lesson_type_name:
            # Разрешена только для "Полный" (уже обработано выше, но если не "Полный" - запрещено)
            print("Йога в гамаках доступна только по абонементу 'Полный'")
            # is_match останется False, т.к. мы в этом блоке только если не "Полный"

        # 3. Проверка для "Танцы" (доступны по "Полный" и "Фитнес")
        elif "танцы" in lesson_type_name:
            # Разрешена для "Полный" или для абонементов группы "Фитнес"
            if "полный" in membership_type_name or any(
                    x in membership_type_name for x in ["фитнес", "пилатес", "йога"]):
                is_match = True
                print("Танцы доступны по абонементам 'Полный' и 'Фитнес'")

        # 4. Проверка для детской йоги (можно на любую детскую йогу)
        elif "детская йога" in membership_type_name and "детская йога" in lesson_type_name:
            is_match = True

        # 5. Проверка для взрослой йоги
        elif "взрослая йога" in membership_type_name and "взрослая йога" in lesson_type_name:
            is_match = True

        # 6. Проверка для фитнес-пилатес-йога (включая танцы, исключая йога в гамаках и детскую)
        elif any(x in membership_type_name for x in ["фитнес", "пилатес", "йога"]) and \
                any(x in lesson_type_name for x in ["фитнес", "пилатес", "йога", "танцы"]):
            # Исключаем йога в гамаках и детскую йогу
            if "йога в гамаках" not in lesson_type_name and "детская" not in lesson_type_name:
                is_match = True

        # 7. Проверка для растяжки
        elif "растяжка" in membership_type_name and "растяжка" in lesson_type_name:
            is_match = True

        # 8. Проверка для разовых абонементов (они привязаны к конкретному типу)
        elif membership_type_name in lesson_type_name or lesson_type_name in membership_type_name:
            # Проверяем, что это не перекрестные случаи
            if "йога" not in membership_type_name or "йога" in lesson_type_name:
                is_match = True

        if not is_match:
            print(
                f"Несоответствие типов: абонемент '{membership_type_name}' нельзя использовать для занятия '{lesson_type_name}'")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Этот абонемент можно использовать только для занятий типа '{membership_lesson_type.name}'"
            )
        # ===== КОНЕЦ ПРОВЕРКИ =====

        # Создаем бронирование
        try:
            # Создаем запись
            booking = models.Booking(
                lesson_id=booking_data.lesson_id,
                user_id=current_user.id,
                user_membership_id=booking_data.user_membership_id,
                status=models.BookingStatus.CONFIRMED
            )
            db.add(booking)

            # Уменьшаем количество оставшихся занятий
            membership.remaining_classes -= 1
            print(f"Осталось занятий: {membership.remaining_classes}")

            # Если занятия закончились, меняем статус
            if membership.remaining_classes == 0:
                membership.status = models.MembershipStatus.USED
                print("Абонемент использован")

            db.commit()
            db.refresh(booking)
            print("Транзакция успешно завершена")

            return booking

        except Exception as e:
            db.rollback()
            print(f"Ошибка при записи в БД: {str(e)}")
            import traceback
            traceback.print_exc()
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Ошибка при записи: {str(e)}"
            )

    except HTTPException:
        raise
    except Exception as e:
        print(f"Необработанная ошибка: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Внутренняя ошибка сервера: {str(e)}"
        )

# Отменить запись
@router.post("/cancel/{booking_id}")
def cancel_booking(
        booking_id: int,
        current_user: models.User = Depends(get_current_user),
        db: Session = Depends(get_db)
):
    """Отменить запись"""
    try:
        # Находим запись
        booking = db.query(models.Booking) \
            .options(
            joinedload(models.Booking.lesson),
            joinedload(models.Booking.user_membership)
        ) \
            .filter(models.Booking.id == booking_id) \
            .first()

        if not booking:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Запись не найдена"
            )

        # Проверяем, что это запись текущего пользователя
        if booking.user_id != current_user.id and not current_user.is_admin:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Нельзя отменить чужую запись"
            )

        lesson_date = booking.lesson.date_lesson
        now = datetime.now()

        # Проверяем, не прошло ли уже занятие
        if lesson_date < now:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Нельзя отменить запись на прошедшее занятие"
            )

        # Проверка: нельзя отменить за 3 часа до начала
        hours_before = (lesson_date - now).total_seconds() / 3600

        if hours_before < 3:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Нельзя отменить запись менее чем за 3 часа до начала занятия. До начала осталось {int(hours_before)} ч."
            )

        # Отменяем запись
        try:
            # Получаем абонемент
            membership = booking.user_membership

            if not membership:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Абонемент не найден"
                )

            # Проверяем, что абонемент еще не истек на момент занятия
            lesson_date_only = lesson_date.date()
            membership_end_date = membership.end_date

            if lesson_date_only > membership_end_date:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Нельзя вернуть занятие в абонемент, который уже истек {membership_end_date.strftime('%d.%m.%Y')}"
                )

            # Меняем статус записи
            booking.status = models.BookingStatus.CANCELLED

            # Возвращаем занятие в абонемент
            membership.remaining_classes += 1

            # Если абонемент был использован полностью, возвращаем ему активный статус
            if membership.status == models.MembershipStatus.USED:
                membership.status = models.MembershipStatus.ACTIVE

            # Если абонемент был истекшим, но дата занятия в пределах срока - возвращаем активный
            if membership.status == models.MembershipStatus.EXPIRED and lesson_date_only <= membership_end_date:
                membership.status = models.MembershipStatus.ACTIVE

            db.commit()

            return {"message": "Запись успешно отменена"}

        except HTTPException:
            raise
        except Exception as e:
            db.rollback()
            print(f"Ошибка при отмене: {e}")
            import traceback
            traceback.print_exc()
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Ошибка при отмене: {str(e)}"
            )

    except HTTPException:
        raise
    except Exception as e:
        print(f"Ошибка в cancel_booking: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Ошибка при отмене: {str(e)}"
        )

# Мои записи
@router.get("/my/bookings", response_model=List[schemas.BookingResponse])
def get_my_bookings(
        current_user: models.User = Depends(get_current_user),
        db: Session = Depends(get_db)
):
    """Получить все записи текущего пользователя"""
    try:
        update_old_bookings_status(db)
        bookings = db.query(models.Booking) \
            .options(
            joinedload(models.Booking.lesson)
            .joinedload(models.Lesson.lesson_type),
            joinedload(models.Booking.lesson)
            .joinedload(models.Lesson.gym),
            joinedload(models.Booking.lesson)
            .joinedload(models.Lesson.trainer)
        ) \
            .filter(models.Booking.user_id == current_user.id) \
            .order_by(models.Booking.booking_time.desc()) \
            .all()

        return bookings

    except Exception as e:
        print(f"Ошибка в get_my_bookings: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Ошибка при загрузке записей: {str(e)}"
        )


# Мои будущие записи
@router.get("/my/upcoming", response_model=List[schemas.BookingResponse])
def get_my_upcoming_bookings(
        current_user: models.User = Depends(get_current_user),
        db: Session = Depends(get_db)
):
    """Получить будущие записи пользователя"""
    try:
        update_old_bookings_status(db)
        now = datetime.now()

        # Получаем записи, у которых занятие в будущем и статус подтвержден
        bookings = db.query(models.Booking) \
            .options(
            joinedload(models.Booking.lesson)
            .joinedload(models.Lesson.lesson_type),
            joinedload(models.Booking.lesson)
            .joinedload(models.Lesson.gym),
            joinedload(models.Booking.lesson)
            .joinedload(models.Lesson.trainer)
        ) \
            .join(models.Lesson, models.Booking.lesson_id == models.Lesson.id) \
            .filter(
            models.Booking.user_id == current_user.id,
            models.Lesson.date_lesson >= now,
            models.Booking.status == models.BookingStatus.CONFIRMED
        ) \
            .order_by(models.Lesson.date_lesson) \
            .all()

        return bookings

    except Exception as e:
        print(f"Ошибка в get_my_upcoming_bookings: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Ошибка при загрузке записей: {str(e)}"
        )