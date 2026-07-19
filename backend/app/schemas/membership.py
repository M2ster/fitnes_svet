from pydantic import BaseModel, ConfigDict, Field
from datetime import date, datetime
from typing import Optional, List
from enum import Enum


class MembershipStatus(str, Enum):
    ACTIVE = "active"
    EXPIRED = "expired"
    USED = "used"
    CANCELLED = "cancelled"


# Типы занятий
class TypeLessonBase(BaseModel):
    name: str
    capacity: int
    description: Optional[str] = None
    photo: Optional[str] = None


class TypeLessonCreate(TypeLessonBase):
    pass


class TypeLessonResponse(TypeLessonBase):
    id: int

    model_config = ConfigDict(from_attributes=True)


# Количество занятий
class LessonCountBase(BaseModel):
    count: int


class LessonCountResponse(LessonCountBase):
    id: int

    model_config = ConfigDict(from_attributes=True)


# Сроки действия
class ValidDaysBase(BaseModel):
    count_day: int


class ValidDaysResponse(ValidDaysBase):
    id: int

    model_config = ConfigDict(from_attributes=True)


# Предложения абонементов
class MembershipOfferBase(BaseModel):
    type_membership_id: int
    lesson_count_id: int
    valid_days_id: int
    price: float


class MembershipOfferCreate(MembershipOfferBase):
    pass


class MembershipOfferResponse(MembershipOfferBase):
    id: int
    lesson_type: Optional[TypeLessonResponse] = None
    lesson_count: Optional[LessonCountResponse] = None
    valid_days: Optional[ValidDaysResponse] = None

    model_config = ConfigDict(from_attributes=True)


# Абонементы пользователей
class UserMembershipBase(BaseModel):
    user_id: int
    membership_offer_id: int
    purchase_date: date
    start_date: date
    end_date: date
    remaining_classes: int
    status: MembershipStatus


class UserMembershipCreate(BaseModel):
    membership_offer_id: int
    start_date: Optional[date] = Field(default_factory=date.today)


class UserMembershipResponse(UserMembershipBase):
    id: int
    membership_offer: Optional[MembershipOfferResponse] = None

    model_config = ConfigDict(from_attributes=True)


# Для админа - создание абонемента пользователю
class AdminMembershipCreate(BaseModel):
    user_id: int
    membership_offer_id: int
    purchase_date: Optional[date] = Field(default_factory=date.today)
    start_date: Optional[date] = Field(default_factory=date.today)