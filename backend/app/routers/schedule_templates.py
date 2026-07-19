from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import and_
from typing import List, Optional
from datetime import datetime, time, timedelta, date

from ..database import get_db
from ..models import models
from ..schemas import schedule as schemas
from .auth import get_current_user

router = APIRouter(prefix="/schedule-templates", tags=["schedule-templates"])


# Проверка на админа
async def check_admin(current_user: models.User = Depends(get_current_user)):
    if not current_user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Требуются права администратора"
        )
    return current_user


@router.get("/", response_model=List[schemas.ScheduleTemplateResponse])
def get_templates(
        db: Session = Depends(get_db),
        admin: models.User = Depends(check_admin)
):
    """Получить все шаблоны расписания (и активные, и неактивные)"""
    try:
        templates = db.query(models.ScheduleTemplate) \
            .options(
            joinedload(models.ScheduleTemplate.lesson_type),
            joinedload(models.ScheduleTemplate.trainer),
            joinedload(models.ScheduleTemplate.gym)
        ) \
            .order_by(
            models.ScheduleTemplate.is_active.desc(),  # Сначала активные
            models.ScheduleTemplate.weekday,
            models.ScheduleTemplate.start_time
        ) \
            .all()

        # Преобразуем время в строку для каждого шаблона
        result = []
        for template in templates:
            template_dict = {
                "id": template.id,
                "type_lesson_id": template.type_lesson_id,
                "trainer_id": template.trainer_id,
                "gym_id": template.gym_id,
                "weekday": template.weekday,
                "start_time": template.start_time.strftime("%H:%M") if template.start_time else "00:00",
                "duration": template.duration,
                "is_active": template.is_active,
                "lesson_type": template.lesson_type,
                "trainer": template.trainer,
                "gym": template.gym
            }
            result.append(template_dict)

        print(f"Загружено шаблонов: {len(result)}")
        return result
    except Exception as e:
        print(f"Ошибка при загрузке шаблонов: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{template_id}", response_model=schemas.ScheduleTemplateResponse)
def get_template(
        template_id: int,
        db: Session = Depends(get_db),
        admin: models.User = Depends(check_admin)
):
    """Получить шаблон по ID"""
    template = db.query(models.ScheduleTemplate) \
        .options(
        joinedload(models.ScheduleTemplate.lesson_type),
        joinedload(models.ScheduleTemplate.trainer),
        joinedload(models.ScheduleTemplate.gym)
    ) \
        .filter(models.ScheduleTemplate.id == template_id) \
        .first()

    if not template:
        raise HTTPException(status_code=404, detail="Шаблон не найден")

    # Преобразуем время в строку
    template_dict = {
        "id": template.id,
        "type_lesson_id": template.type_lesson_id,
        "trainer_id": template.trainer_id,
        "gym_id": template.gym_id,
        "weekday": template.weekday,
        "start_time": template.start_time.strftime("%H:%M") if template.start_time else "00:00",
        "duration": template.duration,
        "is_active": template.is_active,
        "lesson_type": template.lesson_type,
        "trainer": template.trainer,
        "gym": template.gym
    }

    return template_dict


@router.post("/", response_model=schemas.ScheduleTemplateResponse)
def create_template(
        template: schemas.ScheduleTemplateCreate,
        db: Session = Depends(get_db),
        admin: models.User = Depends(check_admin)
):
    """Создать шаблон расписания"""
    try:
        # Парсим время
        start_time = datetime.strptime(template.start_time, "%H:%M").time()

        db_template = models.ScheduleTemplate(
            type_lesson_id=template.type_lesson_id,
            trainer_id=template.trainer_id,
            gym_id=template.gym_id,
            weekday=template.weekday,
            start_time=start_time,
            duration=template.duration,
            is_active=template.is_active
        )
        db.add(db_template)
        db.commit()
        db.refresh(db_template)

        # Загружаем связанные данные
        db_template = db.query(models.ScheduleTemplate) \
            .options(
            joinedload(models.ScheduleTemplate.lesson_type),
            joinedload(models.ScheduleTemplate.trainer),
            joinedload(models.ScheduleTemplate.gym)
        ) \
            .filter(models.ScheduleTemplate.id == db_template.id) \
            .first()

        # Преобразуем время в строку
        template_dict = {
            "id": db_template.id,
            "type_lesson_id": db_template.type_lesson_id,
            "trainer_id": db_template.trainer_id,
            "gym_id": db_template.gym_id,
            "weekday": db_template.weekday,
            "start_time": db_template.start_time.strftime("%H:%M") if db_template.start_time else "00:00",
            "duration": db_template.duration,
            "is_active": db_template.is_active,
            "lesson_type": db_template.lesson_type,
            "trainer": db_template.trainer,
            "gym": db_template.gym
        }

        return template_dict
    except Exception as e:
        print(f"Ошибка при создании шаблона: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/{template_id}", response_model=schemas.ScheduleTemplateResponse)
def update_template(
        template_id: int,
        template: schemas.ScheduleTemplateCreate,
        db: Session = Depends(get_db),
        admin: models.User = Depends(check_admin)
):
    """Обновить шаблон"""
    db_template = db.query(models.ScheduleTemplate).filter(models.ScheduleTemplate.id == template_id).first()
    if not db_template:
        raise HTTPException(status_code=404, detail="Шаблон не найден")

    try:
        start_time = datetime.strptime(template.start_time, "%H:%M").time()

        # Обновляем поля
        db_template.type_lesson_id = template.type_lesson_id
        db_template.trainer_id = template.trainer_id
        db_template.gym_id = template.gym_id
        db_template.weekday = template.weekday
        db_template.start_time = start_time
        db_template.duration = template.duration
        db_template.is_active = template.is_active

        db.commit()
        db.refresh(db_template)

        # Загружаем связанные данные
        db_template = db.query(models.ScheduleTemplate) \
            .options(
            joinedload(models.ScheduleTemplate.lesson_type),
            joinedload(models.ScheduleTemplate.trainer),
            joinedload(models.ScheduleTemplate.gym)
        ) \
            .filter(models.ScheduleTemplate.id == db_template.id) \
            .first()

        # Преобразуем время в строку
        template_dict = {
            "id": db_template.id,
            "type_lesson_id": db_template.type_lesson_id,
            "trainer_id": db_template.trainer_id,
            "gym_id": db_template.gym_id,
            "weekday": db_template.weekday,
            "start_time": db_template.start_time.strftime("%H:%M") if db_template.start_time else "00:00",
            "duration": db_template.duration,
            "is_active": db_template.is_active,
            "lesson_type": db_template.lesson_type,
            "trainer": db_template.trainer,
            "gym": db_template.gym
        }

        return template_dict
    except Exception as e:
        print(f"Ошибка при обновлении шаблона: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/{template_id}")
def delete_template(
        template_id: int,
        db: Session = Depends(get_db),
        admin: models.User = Depends(check_admin)
):
    """Удалить шаблон"""
    db_template = db.query(models.ScheduleTemplate).filter(models.ScheduleTemplate.id == template_id).first()
    if not db_template:
        raise HTTPException(status_code=404, detail="Шаблон не найден")

    try:
        db.delete(db_template)
        db.commit()
        return {"message": "Шаблон удален"}
    except Exception as e:
        print(f"Ошибка при удалении шаблона: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/generate")
def generate_schedule(
        weeks: int = 4,
        start_date: Optional[str] = None,
        db: Session = Depends(get_db),
        admin: models.User = Depends(check_admin)
):
    """Сгенерировать расписание на N недель вперед из шаблонов"""
    try:
        # Определяем дату начала
        if start_date:
            current_date = datetime.strptime(start_date, "%Y-%m-%d").date()
        else:
            current_date = date.today()

        # Получаем все активные шаблоны
        templates = db.query(models.ScheduleTemplate) \
            .filter(models.ScheduleTemplate.is_active == True) \
            .all()

        if not templates:
            raise HTTPException(status_code=400, detail="Нет активных шаблонов расписания")

        created_count = 0
        skipped_count = 0

        # Генерируем на указанное количество недель
        for week in range(weeks):
            week_start = current_date + timedelta(days=week * 7)

            for day_offset in range(7):
                current_day = week_start + timedelta(days=day_offset)
                weekday = current_day.weekday()  # 0-6 (пн-вс)

                # Ищем шаблоны для этого дня недели
                day_templates = [t for t in templates if t.weekday == weekday]

                for template in day_templates:
                    # Создаем дату и время занятия
                    lesson_datetime = datetime.combine(
                        current_day,
                        template.start_time
                    )

                    # Проверяем, не создано ли уже такое занятие
                    existing = db.query(models.Lesson).filter(
                        and_(
                            models.Lesson.type_lesson_id == template.type_lesson_id,
                            models.Lesson.trainer_id == template.trainer_id,
                            models.Lesson.gym_id == template.gym_id,
                            models.Lesson.date_lesson == lesson_datetime
                        )
                    ).first()

                    if existing:
                        skipped_count += 1
                        continue

                    # Создаем занятие
                    lesson = models.Lesson(
                        type_lesson_id=template.type_lesson_id,
                        date_lesson=lesson_datetime,
                        gym_id=template.gym_id,
                        trainer_id=template.trainer_id
                    )
                    db.add(lesson)
                    created_count += 1

        db.commit()

        return {
            "message": f"Расписание сгенерировано",
            "created": created_count,
            "skipped": skipped_count,
            "weeks": weeks,
            "start_date": current_date.isoformat()
        }
    except HTTPException:
        raise
    except Exception as e:
        print(f"Ошибка при генерации расписания: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/cleanup")
def cleanup_old_lessons(
        days: int = 30,
        db: Session = Depends(get_db),
        admin: models.User = Depends(check_admin)
):
    """Удалить старые занятия (прошедшие более days дней назад)"""
    try:
        cutoff_date = datetime.now() - timedelta(days=days)
        print(f"Поиск занятий старше: {cutoff_date}")

        # Сначала посмотрим, сколько всего старых занятий
        total_old = db.query(models.Lesson) \
            .filter(models.Lesson.date_lesson < cutoff_date) \
            .count()
        print(f"Всего старых занятий: {total_old}")

        # Находим старые занятия без записей
        old_lessons = db.query(models.Lesson) \
            .outerjoin(models.Booking) \
            .filter(
            models.Lesson.date_lesson < cutoff_date,
            models.Booking.id == None  # нет записей
        ) \
            .all()

        print(f"Найдено занятий без записей: {len(old_lessons)}")

        # Покажем, какие занятия будут удалены
        for lesson in old_lessons:
            print(f"  - ID: {lesson.id}, Дата: {lesson.date_lesson}, Тип: {lesson.type_lesson_id}")

        count = len(old_lessons)
        for lesson in old_lessons:
            db.delete(lesson)

        db.commit()

        return {
            "message": f"Удалено {count} старых занятий",
            "deleted": count,
            "cutoff_date": cutoff_date.isoformat()
        }
    except Exception as e:
        print(f"Ошибка при очистке: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))