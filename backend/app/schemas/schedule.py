from pydantic import BaseModel, ConfigDict
from datetime import datetime, date, time
from typing import Optional, List
from enum import Enum


class BookingStatus(str, Enum):
    CONFIRMED = "CONFIRMED"
    CANCELLED = "CANCELLED"
    VISITED = "VISITED"
    NO_SHOW = "NO_SHOW"


# Залы
class GymBase(BaseModel):
    name: str
    description: Optional[str] = None
    photo: Optional[str] = None


class GymCreate(GymBase):
    pass


class GymResponse(GymBase):
    id: int

    model_config = ConfigDict(from_attributes=True)


# Тренеры
class TrainerBase(BaseModel):
    name: str
    specialization: Optional[str] = None
    photo: Optional[str] = None
    description: Optional[str] = None


class TrainerCreate(TrainerBase):
    photo: Optional[str] = None


class TrainerResponse(TrainerBase):
    id: int

    model_config = ConfigDict(from_attributes=True)


# Типы занятий (для расписания)
class LessonTypeBase(BaseModel):
    name: str
    capacity: int
    description: Optional[str] = None
    duration: Optional[int] = 60


class LessonTypeResponse(LessonTypeBase):
    id: int

    model_config = ConfigDict(from_attributes=True)


# Занятия в расписании
class LessonBase(BaseModel):
    type_lesson_id: int
    date_lesson: datetime
    gym_id: int
    trainer_id: int


class LessonCreate(LessonBase):
    pass


class LessonResponse(BaseModel):
    id: int
    type_lesson_id: int
    date_lesson: datetime
    gym_id: int
    trainer_id: int
    lesson_type: Optional[LessonTypeResponse] = None
    gym: Optional[GymResponse] = None
    trainer: Optional[TrainerResponse] = None
    available_seats: Optional[int] = None
    booked_count: Optional[int] = None
    max_capacity: Optional[int] = None

    model_config = ConfigDict(from_attributes=True)


# Записи на занятия
class BookingBase(BaseModel):
    lesson_id: int
    user_membership_id: int


class BookingCreate(BookingBase):
    pass


class BookingResponse(BaseModel):
    id: int
    lesson_id: int
    user_id: int
    user_membership_id: int
    booking_time: datetime
    status: BookingStatus
    lesson: Optional[LessonResponse] = None

    model_config = ConfigDict(from_attributes=True)


# Для отмены бронирования
class BookingCancel(BaseModel):
    booking_id: int


# Для отметки посещения (админ)
class BookingCheckIn(BaseModel):
    booking_id: int
    status: BookingStatus


# Запрос на получение расписания по дате
class ScheduleRequest(BaseModel):
    date: date


# Шаблоны расписания
class ScheduleTemplateBase(BaseModel):
    type_lesson_id: int
    trainer_id: int
    gym_id: int
    weekday: int  # 0-6 (пн-вс)
    start_time: str  # формат "HH:MM"
    duration: Optional[int] = 60
    is_active: Optional[bool] = True


class ScheduleTemplateCreate(ScheduleTemplateBase):
    pass


class ScheduleTemplateResponse(ScheduleTemplateBase):
    id: int
    lesson_type: Optional[LessonTypeResponse] = None
    trainer: Optional[TrainerResponse] = None
    gym: Optional[GymResponse] = None

    model_config = ConfigDict(from_attributes=True)

    @property
    def start_time(self) -> str:
        """Преобразует time в строку формата HH:MM"""
        if hasattr(self, '_start_time') and self._start_time:
            return self._start_time.strftime("%H:%M")
        return "00:00"

    def __init__(self, **data):
        super().__init__(**data)
        # Сохраняем оригинальное время для преобразования
        if 'start_time' in data and isinstance(data['start_time'], time):
            self._start_time = data['start_time']