from pydantic import BaseModel
from datetime import datetime, date
from typing import Optional, List

# Схема для статистики
class DashboardStats(BaseModel):
    total_users: int
    active_memberships: int
    today_lessons: int
    today_bookings: int
    popular_lessons: List[dict]
    recent_bookings: int

# Схема для списка пользователей (админ версия)
class AdminUserResponse(BaseModel):
    id: int
    first_name: str
    last_name: str
    patronymic: Optional[str] = None
    phone: str
    email: Optional[str] = None
    birth_date: Optional[date] = None
    is_admin: bool
    is_active: bool
    created_at: datetime
    memberships_count: int = 0

# Схема для списка абонементов (админ версия)
class AdminMembershipResponse(BaseModel):
    id: int
    user_id: int
    user_name: str
    membership_offer_id: int
    offer_name: str
    purchase_date: date
    start_date: date
    end_date: date
    remaining_classes: int
    status: str