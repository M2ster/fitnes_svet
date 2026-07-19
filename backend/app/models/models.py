from sqlalchemy import Column, Integer, String, Boolean, Date, DateTime, ForeignKey, Enum, Text, Float, Time
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum
from ..database import Base


# Определяем Enum классы
class MembershipStatus(enum.Enum):
    ACTIVE = "active"
    EXPIRED = "expired"
    USED = "used"
    CANCELLED = "cancelled"


class BookingStatus(str, enum.Enum):
    CONFIRMED = "CONFIRMED"
    CANCELLED = "CANCELLED"
    VISITED = "VISITED"
    NO_SHOW = "NO_SHOW"


# Модель пользователя
class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    first_name = Column(String(100), nullable=False)
    last_name = Column(String(100), nullable=False)
    patronymic = Column(String(100))
    phone = Column(String(20), unique=True, nullable=False, index=True)
    email = Column(String(255), unique=True, index=True)
    birth_date = Column(Date)
    photo = Column(String(500))
    is_admin = Column(Boolean, default=False)

    # Поля для аутентификации
    hashed_password = Column(String(255), nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Связи
    memberships = relationship("UserMembership", back_populates="user", cascade="all, delete-orphan")
    bookings = relationship("Booking", back_populates="user", cascade="all, delete-orphan")


# Типы занятий
class TypeLesson(Base):
    __tablename__ = "type_lesson"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    capacity = Column(Integer, nullable=False)
    description = Column(Text)
    photo = Column(String(500))

    # Связи
    lessons = relationship("Lesson", back_populates="lesson_type")
    membership_offers = relationship("MembershipOffer", back_populates="lesson_type")


# Количество дней действия
class ValidDays(Base):
    __tablename__ = "valid_days"

    id = Column(Integer, primary_key=True, index=True)
    count_day = Column(Integer, nullable=False)

    # Связи
    membership_offers = relationship("MembershipOffer", back_populates="valid_days")


# Количество занятий
class LessonCount(Base):
    __tablename__ = "lesson_count"

    id = Column(Integer, primary_key=True, index=True)
    count = Column(Integer, nullable=False)  # 4, 8, 12, 15

    # Связи
    membership_offers = relationship("MembershipOffer", back_populates="lesson_count")


# Предложения абонементов
class MembershipOffer(Base):
    __tablename__ = "membership_offers"

    id = Column(Integer, primary_key=True, index=True)
    type_membership_id = Column(Integer, ForeignKey("type_lesson.id"), nullable=False)
    lesson_count_id = Column(Integer, ForeignKey("lesson_count.id"), nullable=False)
    valid_days_id = Column(Integer, ForeignKey("valid_days.id"), nullable=False)
    price = Column(Float, nullable=False)

    # Связи
    lesson_type = relationship("TypeLesson", back_populates="membership_offers")
    lesson_count = relationship("LessonCount", back_populates="membership_offers")
    valid_days = relationship("ValidDays", back_populates="membership_offers")
    user_memberships = relationship("UserMembership", back_populates="membership_offer")


# Абонементы пользователей
class UserMembership(Base):
    __tablename__ = "user_memberships"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    membership_offer_id = Column(Integer, ForeignKey("membership_offers.id"), nullable=False)
    purchase_date = Column(Date, nullable=False)
    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=False)
    remaining_classes = Column(Integer, nullable=False)
    status = Column(Enum(MembershipStatus), default=MembershipStatus.ACTIVE)

    # Связи
    user = relationship("User", back_populates="memberships")
    membership_offer = relationship("MembershipOffer", back_populates="user_memberships")
    bookings = relationship("Booking", back_populates="user_membership")


# Залы
class Gym(Base):
    __tablename__ = "gym"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    description = Column(Text)
    photo = Column(String(500))

    # Связи
    lessons = relationship("Lesson", back_populates="gym")


# Тренеры
class Trainer(Base):
    __tablename__ = "trainers"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    specialization = Column(String(255))
    photo = Column(String(500))
    description = Column(Text)

    # Связи
    lessons = relationship("Lesson", back_populates="trainer")


# Занятия в расписании
class Lesson(Base):
    __tablename__ = "lessons"

    id = Column(Integer, primary_key=True, index=True)
    type_lesson_id = Column(Integer, ForeignKey("type_lesson.id"), nullable=False)
    date_lesson = Column(DateTime, nullable=False)  # Дата и время занятия
    gym_id = Column(Integer, ForeignKey("gym.id"), nullable=False)
    trainer_id = Column(Integer, ForeignKey("trainers.id"), nullable=False)

    # Связи
    lesson_type = relationship("TypeLesson", back_populates="lessons")
    gym = relationship("Gym", back_populates="lessons")
    trainer = relationship("Trainer", back_populates="lessons")
    bookings = relationship("Booking", back_populates="lesson")


# Записи на занятия
class Booking(Base):
    __tablename__ = "bookings"

    id = Column(Integer, primary_key=True, index=True)
    lesson_id = Column(Integer, ForeignKey("lessons.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    user_membership_id = Column(Integer, ForeignKey("user_memberships.id"), nullable=False)
    booking_time = Column(DateTime(timezone=True), server_default=func.now())
    status = Column(Enum(BookingStatus), default=BookingStatus.CONFIRMED)

    # Связи
    lesson = relationship("Lesson", back_populates="bookings")
    user = relationship("User", back_populates="bookings")
    user_membership = relationship("UserMembership", back_populates="bookings")


class ScheduleTemplate(Base):
    __tablename__ = "schedule_templates"

    id = Column(Integer, primary_key=True, index=True)
    type_lesson_id = Column(Integer, ForeignKey("type_lesson.id"), nullable=False)
    trainer_id = Column(Integer, ForeignKey("trainers.id"), nullable=False)
    gym_id = Column(Integer, ForeignKey("gym.id"), nullable=False)
    weekday = Column(Integer, nullable=False)  # 0-6 (пн-вс)
    start_time = Column(Time, nullable=False)
    duration = Column(Integer, default=60)  # длительность в минутах
    is_active = Column(Boolean, default=True)

    # Связи
    lesson_type = relationship("TypeLesson")
    trainer = relationship("Trainer")
    gym = relationship("Gym")