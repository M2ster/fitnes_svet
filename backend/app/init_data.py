from sqlalchemy.orm import Session
from datetime import datetime, date, time, timedelta
from .database import SessionLocal
from .models import models
from .auth import get_password_hash


def init_db():
    """Инициализация базы данных начальными данными"""
    db = SessionLocal()

    try:
        # Проверяем, есть ли уже данные
        if db.query(models.TypeLesson).count() > 0:
            print("Данные уже существуют, инициализация не требуется")
            return

        print("🚀 Начинаем инициализацию базы данных...")

        # ========== ТИПЫ ЗАНЯТИЙ ==========
        print("📊 Создаем типы занятий...")
        lesson_types = [
            models.TypeLesson(
                name="Фитнес",
                capacity=10,
                description="Силовая тренировка для всего тела. Укрепление мышц, повышение выносливости, сжигание калорий."
            ),
            models.TypeLesson(
                name="Пилатес",
                capacity=9,
                description="Мягкая тренировка для укрепления мышц кора, улучшения осанки и гибкости. Подходит для любого уровня подготовки."
            ),
            models.TypeLesson(
                name="Растяжка",
                capacity=6,
                description="Тренировка на гибкость и расслабление. Улучшение эластичности мышц, снятие напряжения, профилактика травм."
            ),
            models.TypeLesson(
                name="Взрослая йога",
                capacity=9,
                description="Йога для взрослых. Гармония тела и разума, работа с дыханием, улучшение гибкости и снятие стресса."
            ),
            models.TypeLesson(
                name="Детская йога (3-7 лет)",
                capacity=4,
                description="Йога для самых маленьких. Игровая форма, развитие координации, гибкости и внимания."
            ),
            models.TypeLesson(
                name="Детская йога (7-13 лет)",
                capacity=4,
                description="Йога для школьников. Укрепление здоровья, снятие утомления после учебы, развитие концентрации."
            ),
            models.TypeLesson(
                name="Мать и дитя",
                capacity=8,
                description="Совместная тренировка мамы с ребенком. Укрепление связи, общее развитие, веселое времяпрепровождение."
            ),
            models.TypeLesson(
                name="Полный",
                capacity=10,
                description="Абонемент на все направления: фитнес, пилатес, йога, растяжка"
            ),
        ]
        db.add_all(lesson_types)
        db.flush()
        print(f"  ✅ Создано {len(lesson_types)} типов занятий")

        # ========== КОЛИЧЕСТВО ЗАНЯТИЙ В АБОНЕМЕНТЕ ==========
        print("📊 Создаем варианты количества занятий...")
        lesson_counts = [
            models.LessonCount(count=4),
            models.LessonCount(count=8),
            models.LessonCount(count=12),
            models.LessonCount(count=15),
        ]
        db.add_all(lesson_counts)
        db.flush()
        print(f"  ✅ Создано {len(lesson_counts)} вариантов")

        # ========== СРОКИ ДЕЙСТВИЯ АБОНЕМЕНТОВ ==========
        print("📊 Создаем сроки действия абонементов...")
        valid_days_list = [
            models.ValidDays(count_day=35),
            models.ValidDays(count_day=35),
            models.ValidDays(count_day=45),
            models.ValidDays(count_day=45),
        ]
        db.add_all(valid_days_list)
        db.flush()
        print(f"  ✅ Создано {len(valid_days_list)} вариантов")

        # ========== ТРЕНЕРЫ ==========
        print("👤 Создаем тренеров...")
        trainers = [
            models.Trainer(
                name="Лукашова Светлана",
                specialization="Фитнес, растяжка, пилатес",
                description="Инструктор программ: фитнесс, растяжка, пилатес, укрепление НТД. Стаж 8 лет. Сертифицированный тренер."
            ),
            models.Trainer(
                name="Устимовская Ирма",
                specialization="Взрослая и детская йога",
                description="Инструктор взрослой и детской йоги. Стаж 10 лет. Регулярно повышает квалификацию в Индии."
            ),
        ]
        db.add_all(trainers)
        db.flush()
        print(f"  ✅ Создано {len(trainers)} тренеров")

        # ========== ЗАЛЫ ==========
        print("🏋️ Создаем залы...")
        gyms = [
            models.Gym(
                name="Основной зал",
                description="Просторный зал для взрослых тренировок. Есть все необходимое оборудование: коврики, гантели, фитболы, резинки."
            ),
            models.Gym(
                name="Детский зал",
                description="Уютный зал для детских занятий. Яркое оформление, детские коврики, игрушки для йоги."
            ),
        ]
        db.add_all(gyms)
        db.flush()
        print(f"  ✅ Создано {len(gyms)} залов")

        # ========== ПРЕДЛОЖЕНИЯ АБОНЕМЕНТОВ (ИЗ ПРАЙСА) ==========
        print("🎫 Создаем предложения абонементов...")

        # Получаем ID для создания абонементов
        fitness = db.query(models.TypeLesson).filter(models.TypeLesson.name == "Фитнес").first()
        pilates = db.query(models.TypeLesson).filter(models.TypeLesson.name == "Пилатес").first()
        stretch = db.query(models.TypeLesson).filter(models.TypeLesson.name == "Растяжка").first()
        yoga = db.query(models.TypeLesson).filter(models.TypeLesson.name == "Взрослая йога").first()
        yoga_kids_3 = db.query(models.TypeLesson).filter(models.TypeLesson.name == "Детская йога (3-7 лет)").first()
        yoga_kids_7 = db.query(models.TypeLesson).filter(models.TypeLesson.name == "Детская йога (7-13 лет)").first()
        mother_child = db.query(models.TypeLesson).filter(models.TypeLesson.name == "Мать и дитя").first()
        full_type = db.query(models.TypeLesson).filter(models.TypeLesson.name == "Полный").first()

        # Абонементы из прайса
        membership_offers = [
            # Fitness • Pilates • Yoga (групповые)
            models.MembershipOffer(type_membership_id=fitness.id, lesson_count_id=1, valid_days_id=1, price=2800),
            models.MembershipOffer(type_membership_id=fitness.id, lesson_count_id=2, valid_days_id=2, price=4000),
            models.MembershipOffer(type_membership_id=fitness.id, lesson_count_id=3, valid_days_id=3, price=6000),
            models.MembershipOffer(type_membership_id=fitness.id, lesson_count_id=4, valid_days_id=4, price=7500),

            # Растяжка мини-группы
            models.MembershipOffer(type_membership_id=stretch.id, lesson_count_id=1, valid_days_id=1, price=3200),
            models.MembershipOffer(type_membership_id=stretch.id, lesson_count_id=2, valid_days_id=2, price=4800),
            models.MembershipOffer(type_membership_id=stretch.id, lesson_count_id=3, valid_days_id=3, price=7200),
            models.MembershipOffer(type_membership_id=stretch.id, lesson_count_id=4, valid_days_id=4, price=9000),

            # Полный Фитнесс+ мини (смешанный)
            models.MembershipOffer(type_membership_id=full_type.id, lesson_count_id=1, valid_days_id=1, price=3000),
            models.MembershipOffer(type_membership_id=full_type.id, lesson_count_id=2, valid_days_id=2, price=4400),
            models.MembershipOffer(type_membership_id=full_type.id, lesson_count_id=3, valid_days_id=3, price=6600),
            models.MembershipOffer(type_membership_id=full_type.id, lesson_count_id=4, valid_days_id=4, price=8250),

            # Мать и дитя
            models.MembershipOffer(type_membership_id=mother_child.id, lesson_count_id=1, valid_days_id=1, price=5600),
            models.MembershipOffer(type_membership_id=mother_child.id, lesson_count_id=2, valid_days_id=2, price=8000),
            models.MembershipOffer(type_membership_id=mother_child.id, lesson_count_id=3, valid_days_id=3, price=12000),
            models.MembershipOffer(type_membership_id=mother_child.id, lesson_count_id=4, valid_days_id=4, price=15000),

            # Детская йога
            models.MembershipOffer(type_membership_id=yoga_kids_3.id, lesson_count_id=1, valid_days_id=1, price=2400),
            models.MembershipOffer(type_membership_id=yoga_kids_3.id, lesson_count_id=2, valid_days_id=2, price=4000),
            models.MembershipOffer(type_membership_id=yoga_kids_3.id, lesson_count_id=3, valid_days_id=3, price=6000),
            models.MembershipOffer(type_membership_id=yoga_kids_3.id, lesson_count_id=4, valid_days_id=4, price=7500),
        ]

        db.add_all(membership_offers)
        db.flush()
        print(f"  ✅ Создано {len(membership_offers)} предложений абонементов")

        # ========== ТЕСТОВОЕ РАСПИСАНИЕ ==========
        print("📅 Создаем тестовое расписание на 14 дней...")

        start_date = date.today()

        weekly_schedule = {
            0: [  # Понедельник
                {"time": "09:00", "type": fitness, "gym": gyms[0], "trainer": trainers[0]},
                {"time": "10:00", "type": fitness, "gym": gyms[0], "trainer": trainers[0]},
                {"time": "11:30", "type": pilates, "gym": gyms[0], "trainer": trainers[0]},
                {"time": "11:30", "type": yoga_kids_3, "gym": gyms[1], "trainer": trainers[1]},
                {"time": "16:00", "type": yoga_kids_3, "gym": gyms[1], "trainer": trainers[1]},
                {"time": "17:00", "type": yoga_kids_7, "gym": gyms[1], "trainer": trainers[1]},
                {"time": "17:00", "type": pilates, "gym": gyms[0], "trainer": trainers[0]},
                {"time": "18:00", "type": fitness, "gym": gyms[0], "trainer": trainers[0]},
                {"time": "19:00", "type": stretch, "gym": gyms[0], "trainer": trainers[0]},
                {"time": "20:00", "type": fitness, "gym": gyms[0], "trainer": trainers[0]},
            ],
            1: [  # Вторник
                {"time": "09:00", "type": fitness, "gym": gyms[0], "trainer": trainers[0]},
                {"time": "10:00", "type": stretch, "gym": gyms[0], "trainer": trainers[0]},
                {"time": "11:30", "type": yoga_kids_3, "gym": gyms[1], "trainer": trainers[1]},
                {"time": "16:00", "type": yoga_kids_3, "gym": gyms[1], "trainer": trainers[1]},
                {"time": "17:00", "type": yoga_kids_7, "gym": gyms[1], "trainer": trainers[1]},
                {"time": "17:00", "type": stretch, "gym": gyms[0], "trainer": trainers[0]},
                {"time": "18:00", "type": fitness, "gym": gyms[0], "trainer": trainers[0]},
                {"time": "19:00", "type": fitness, "gym": gyms[0], "trainer": trainers[0]},
                {"time": "20:00", "type": yoga, "gym": gyms[0], "trainer": trainers[1]},
            ],
            2: [  # Среда
                {"time": "09:00", "type": pilates, "gym": gyms[0], "trainer": trainers[0]},
                {"time": "10:00", "type": stretch, "gym": gyms[0], "trainer": trainers[0]},
                {"time": "11:30", "type": yoga_kids_3, "gym": gyms[1], "trainer": trainers[1]},
                {"time": "16:00", "type": yoga_kids_3, "gym": gyms[1], "trainer": trainers[1]},
                {"time": "17:00", "type": yoga_kids_7, "gym": gyms[1], "trainer": trainers[1]},
                {"time": "17:00", "type": stretch, "gym": gyms[0], "trainer": trainers[0]},
                {"time": "18:00", "type": fitness, "gym": gyms[0], "trainer": trainers[0]},
                {"time": "19:00", "type": pilates, "gym": gyms[0], "trainer": trainers[0]},
                {"time": "20:00", "type": fitness, "gym": gyms[0], "trainer": trainers[0]},
            ],
            3: [  # Четверг
                {"time": "09:00", "type": fitness, "gym": gyms[0], "trainer": trainers[0]},
                {"time": "10:00", "type": pilates, "gym": gyms[0], "trainer": trainers[0]},
                {"time": "16:00", "type": yoga_kids_3, "gym": gyms[1], "trainer": trainers[1]},
                {"time": "17:00", "type": yoga_kids_7, "gym": gyms[1], "trainer": trainers[1]},
                {"time": "18:00", "type": fitness, "gym": gyms[0], "trainer": trainers[0]},
                {"time": "19:00", "type": fitness, "gym": gyms[0], "trainer": trainers[0]},
                {"time": "20:00", "type": fitness, "gym": gyms[0], "trainer": trainers[0]},
            ],
            4: [  # Пятница
                {"time": "09:00", "type": fitness, "gym": gyms[0], "trainer": trainers[0]},
                {"time": "10:00", "type": fitness, "gym": gyms[0], "trainer": trainers[0]},
                {"time": "11:30", "type": pilates, "gym": gyms[0], "trainer": trainers[0]},
                {"time": "11:30", "type": yoga_kids_3, "gym": gyms[1], "trainer": trainers[1]},
                {"time": "16:00", "type": yoga_kids_3, "gym": gyms[1], "trainer": trainers[1]},
                {"time": "17:00", "type": yoga_kids_7, "gym": gyms[1], "trainer": trainers[1]},
                {"time": "17:00", "type": stretch, "gym": gyms[0], "trainer": trainers[0]},
                {"time": "18:00", "type": fitness, "gym": gyms[0], "trainer": trainers[0]},
                {"time": "19:00", "type": pilates, "gym": gyms[0], "trainer": trainers[0]},
                {"time": "20:00", "type": yoga, "gym": gyms[0], "trainer": trainers[1]},
            ],
            5: [  # Суббота
                {"time": "09:00", "type": stretch, "gym": gyms[0], "trainer": trainers[0]},
                {"time": "10:00", "type": stretch, "gym": gyms[0], "trainer": trainers[0]},
                {"time": "11:30", "type": pilates, "gym": gyms[0], "trainer": trainers[0]},
                {"time": "13:00", "type": yoga, "gym": gyms[0], "trainer": trainers[1]},
            ],
        }

        lessons_created = 0

        for day_offset in range(14):
            current_date = start_date + timedelta(days=day_offset)
            weekday = current_date.weekday()

            if weekday == 6:
                continue

            day_schedule = weekly_schedule.get(weekday, [])

            for lesson_data in day_schedule:
                hour, minute = map(int, lesson_data["time"].split(":"))
                lesson_datetime = datetime.combine(current_date, time(hour, minute))

                lesson = models.Lesson(
                    type_lesson_id=lesson_data["type"].id,
                    date_lesson=lesson_datetime,
                    gym_id=lesson_data["gym"].id,
                    trainer_id=lesson_data["trainer"].id
                )
                db.add(lesson)
                lessons_created += 1

        db.commit()
        print(f"  ✅ Создано {lessons_created} занятий в расписании")

        # ========== ТЕСТОВЫЕ ПОЛЬЗОВАТЕЛИ ==========
        print("👤 Создаем тестовых пользователей...")

        test_user = models.User(
            first_name="Иван",
            last_name="Иванов",
            patronymic="Иванович",
            phone="+79991234567",
            email="test@test.com",
            birth_date=date(1990, 1, 1),
            is_admin=False,
            hashed_password=get_password_hash("pass123"),
            is_active=True
        )
        db.add(test_user)

        test_admin = models.User(
            first_name="Светлана",
            last_name="Лукашова",
            patronymic="",
            phone="+79991112233",
            email="admin@fitness.ru",
            birth_date=date(1985, 5, 15),
            is_admin=True,
            hashed_password=get_password_hash("admin123"),
            is_active=True
        )
        db.add(test_admin)

        test_user2 = models.User(
            first_name="Елена",
            last_name="Петрова",
            patronymic="Сергеевна",
            phone="+79992345678",
            email="elena@test.com",
            birth_date=date(1988, 3, 20),
            is_admin=False,
            hashed_password=get_password_hash("pass456"),
            is_active=True
        )
        db.add(test_user2)

        test_user3 = models.User(
            first_name="Ольга",
            last_name="Сидорова",
            patronymic="",
            phone="+79993456789",
            email="olga@test.com",
            birth_date=date(1995, 7, 12),
            is_admin=False,
            hashed_password=get_password_hash("pass789"),
            is_active=True
        )
        db.add(test_user3)

        db.commit()

        print("  ✅ Создано 4 тестовых пользователя:")
        print("     - Обычный пользователь 1: +79991234567 / pass123")
        print("     - Обычный пользователь 2: +79992345678 / pass456")
        print("     - Обычный пользователь 3: +79993456789 / pass789")
        print("     - Администратор: +79991112233 / admin123")

        print("\n" + "=" * 50)
        print("✅✅✅ ИНИЦИАЛИЗАЦИЯ ЗАВЕРШЕНА УСПЕШНО! ✅✅✅")
        print("=" * 50)
        print(f"📊 Типы занятий: {len(lesson_types)}")
        print(f"👥 Тренеры: {len(trainers)}")
        print(f"🏋️ Залы: {len(gyms)}")
        print(f"🎫 Абонементы: {len(membership_offers)}")
        print(f"📅 Занятия: {lessons_created}")
        print("=" * 50)

    except Exception as e:
        print(f"❌❌❌ ОШИБКА при инициализации базы данных: {e}")
        db.rollback()
        import traceback
        traceback.print_exc()
    finally:
        db.close()


if __name__ == "__main__":
    init_db()