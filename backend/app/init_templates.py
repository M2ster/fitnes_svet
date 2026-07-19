from sqlalchemy.orm import Session
from datetime import time
from .database import SessionLocal
from .models import models


def init_templates():
    """Создать шаблоны из существующего расписания"""
    db = SessionLocal()

    try:
        # Проверяем, есть ли уже шаблоны
        if db.query(models.ScheduleTemplate).count() > 0:
            print("Шаблоны уже существуют")
            return

        # Получаем уникальные комбинации из существующих занятий
        lessons = db.query(models.Lesson).all()

        if not lessons:
            print("Нет занятий для создания шаблонов")
            return

        templates_data = set()

        for lesson in lessons:
            # Получаем день недели (0-6)
            weekday = lesson.date_lesson.weekday()
            # Получаем время
            start_time = lesson.date_lesson.time()

            templates_data.add((
                lesson.type_lesson_id,
                lesson.trainer_id,
                lesson.gym_id,
                weekday,
                start_time
            ))

        # Создаем шаблоны
        created_count = 0
        for type_id, trainer_id, gym_id, weekday, start_time in templates_data:
            template = models.ScheduleTemplate(
                type_lesson_id=type_id,
                trainer_id=trainer_id,
                gym_id=gym_id,
                weekday=weekday,
                start_time=start_time,
                duration=60,
                is_active=True
            )
            db.add(template)
            created_count += 1

        db.commit()
        print(f"Создано {created_count} шаблонов расписания")

    except Exception as e:
        print(f"Ошибка при создании шаблонов: {e}")
        db.rollback()
    finally:
        db.close()


if __name__ == "__main__":
    init_templates()