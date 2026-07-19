import os
import shutil
import uuid
from datetime import datetime
from typing import List
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from fastapi.responses import FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session
from PIL import Image
import io

from ..database import get_db
from ..models import models
from .auth import get_current_user

router = APIRouter(prefix="/upload", tags=["upload"])

# Конфигурация
UPLOAD_DIR = "uploads"
TRAINER_PHOTOS_DIR = f"{UPLOAD_DIR}/trainers"
USER_PHOTOS_DIR = f"{UPLOAD_DIR}/users"
GYM_PHOTOS_DIR = f"{UPLOAD_DIR}/gyms"

# Создаем директории, если их нет
os.makedirs(TRAINER_PHOTOS_DIR, exist_ok=True)
os.makedirs(USER_PHOTOS_DIR, exist_ok=True)
os.makedirs(GYM_PHOTOS_DIR, exist_ok=True)

# Разрешенные форматы изображений
ALLOWED_EXTENSIONS = {'.jpg', '.jpeg', '.png', '.gif', '.webp'}
MAX_FILE_SIZE = 5 * 1024 * 1024  # 5 MB


# Проверка на админа
async def check_admin(current_user: models.User = Depends(get_current_user)):
    if not current_user.is_admin:
        raise HTTPException(
            status_code=403,
            detail="Требуются права администратора"
        )
    return current_user


def validate_image(file: UploadFile):
    """Проверка файла изображения"""
    # Проверка расширения
    file_ext = os.path.splitext(file.filename)[1].lower()
    if file_ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"Неподдерживаемый формат файла. Разрешены: {', '.join(ALLOWED_EXTENSIONS)}"
        )

    # Проверка размера
    file.file.seek(0, 2)  # Перемещаем указатель в конец файла
    file_size = file.file.tell()
    file.file.seek(0)  # Возвращаем указатель в начало

    if file_size > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=400,
            detail=f"Файл слишком большой. Максимальный размер: {MAX_FILE_SIZE // (1024 * 1024)}MB"
        )

    return file_ext


def optimize_image(file: UploadFile, output_path: str, max_size=(800, 800)):
    """Оптимизация изображения"""
    try:
        # Читаем изображение
        image_data = file.file.read()
        image = Image.open(io.BytesIO(image_data))

        # Конвертируем в RGB если нужно
        if image.mode in ('RGBA', 'P'):
            image = image.convert('RGB')

        # Изменяем размер, сохраняя пропорции
        image.thumbnail(max_size, Image.Resampling.LANCZOS)

        # Сохраняем с оптимизацией
        quality = 85
        image.save(output_path, 'JPEG', quality=quality, optimize=True)

        return True
    except Exception as e:
        print(f"Ошибка оптимизации изображения: {e}")
        return False


# ========== ЗАГРУЗКА ФОТО ТРЕНЕРОВ ==========

@router.post("/trainer-photo/{trainer_id}")
async def upload_trainer_photo(
        trainer_id: int,
        file: UploadFile = File(...),
        admin: models.User = Depends(check_admin),
        db: Session = Depends(get_db)
):
    """Загрузить фото тренера"""

    # Проверяем существование тренера
    trainer = db.query(models.Trainer).filter(models.Trainer.id == trainer_id).first()
    if not trainer:
        raise HTTPException(status_code=404, detail="Тренер не найден")

    try:
        # Валидация файла
        file_ext = validate_image(file)

        # Генерируем уникальное имя файла
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        unique_id = str(uuid.uuid4())[:8]
        filename = f"{trainer_id}_{timestamp}_{unique_id}{file_ext}"
        file_path = f"{TRAINER_PHOTOS_DIR}/{filename}"

        # Оптимизируем и сохраняем изображение
        success = optimize_image(file, file_path)

        if not success:
            # Если оптимизация не удалась, сохраняем как есть
            file.file.seek(0)
            with open(file_path, "wb") as buffer:
                shutil.copyfileobj(file.file, buffer)

        # Удаляем старое фото, если оно есть
        if trainer.photo:
            old_photo_path = trainer.photo.replace("/uploads/", f"{UPLOAD_DIR}/")
            if os.path.exists(old_photo_path):
                os.remove(old_photo_path)

        # Сохраняем путь в базе данных
        photo_url = f"/uploads/trainers/{filename}"
        trainer.photo = photo_url
        db.commit()

        return JSONResponse({
            "success": True,
            "message": "Фото успешно загружено",
            "photo_url": photo_url,
            "trainer_id": trainer_id
        })

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Ошибка при загрузке: {str(e)}")


@router.delete("/trainer-photo/{trainer_id}")
async def delete_trainer_photo(
        trainer_id: int,
        admin: models.User = Depends(check_admin),
        db: Session = Depends(get_db)
):
    """Удалить фото тренера"""

    trainer = db.query(models.Trainer).filter(models.Trainer.id == trainer_id).first()
    if not trainer:
        raise HTTPException(status_code=404, detail="Тренер не найден")

    if trainer.photo:
        # Извлекаем имя файла из URL
        filename = trainer.photo.split("/")[-1]
        file_path = f"{TRAINER_PHOTOS_DIR}/{filename}"

        if os.path.exists(file_path):
            os.remove(file_path)

        trainer.photo = None
        db.commit()

        return {"message": "Фото удалено", "success": True}

    return {"message": "У тренера нет фото", "success": True}


# ========== ЗАГРУЗКА ФОТО ПОЛЬЗОВАТЕЛЕЙ ==========

@router.post("/user-photo/{user_id}")
async def upload_user_photo(
        user_id: int,
        file: UploadFile = File(...),
        current_user: models.User = Depends(get_current_user),
        db: Session = Depends(get_db)
):
    """Загрузить фото пользователя (доступно только самому пользователю или админу)"""

    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Пользователь не найден")

    # Проверяем права (только свой профиль или админ)
    if current_user.id != user_id and not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Нет прав для загрузки фото")

    try:
        file_ext = validate_image(file)

        # Генерируем имя файла
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        unique_id = str(uuid.uuid4())[:8]
        filename = f"user_{user_id}_{timestamp}_{unique_id}{file_ext}"
        file_path = f"{USER_PHOTOS_DIR}/{filename}"

        # Оптимизируем изображение
        success = optimize_image(file, file_path, max_size=(400, 400))

        if not success:
            file.file.seek(0)
            with open(file_path, "wb") as buffer:
                shutil.copyfileobj(file.file, buffer)

        # Удаляем старое фото
        if user.photo:
            old_photo_path = user.photo.replace("/uploads/", f"{UPLOAD_DIR}/")
            if os.path.exists(old_photo_path):
                os.remove(old_photo_path)

        # Сохраняем путь
        photo_url = f"/uploads/users/{filename}"
        user.photo = photo_url
        db.commit()

        return {
            "success": True,
            "message": "Фото успешно загружено",
            "photo_url": photo_url
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Ошибка при загрузке: {str(e)}")


# ========== ЗАГРУЗКА ФОТО ЗАЛОВ ==========

@router.post("/gym-photo/{gym_id}")
async def upload_gym_photo(
        gym_id: int,
        file: UploadFile = File(...),
        admin: models.User = Depends(check_admin),
        db: Session = Depends(get_db)
):
    """Загрузить фото зала"""

    gym = db.query(models.Gym).filter(models.Gym.id == gym_id).first()
    if not gym:
        raise HTTPException(status_code=404, detail="Зал не найден")

    try:
        file_ext = validate_image(file)

        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        unique_id = str(uuid.uuid4())[:8]
        filename = f"gym_{gym_id}_{timestamp}_{unique_id}{file_ext}"
        file_path = f"{GYM_PHOTOS_DIR}/{filename}"

        # Оптимизируем изображение
        success = optimize_image(file, file_path, max_size=(1200, 800))

        if not success:
            file.file.seek(0)
            with open(file_path, "wb") as buffer:
                shutil.copyfileobj(file.file, buffer)

        if gym.photo:
            old_photo_path = gym.photo.replace("/uploads/", f"{UPLOAD_DIR}/")
            if os.path.exists(old_photo_path):
                os.remove(old_photo_path)

        photo_url = f"/uploads/gyms/{filename}"
        gym.photo = photo_url
        db.commit()

        return {
            "success": True,
            "message": "Фото успешно загружено",
            "photo_url": photo_url
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Ошибка при загрузке: {str(e)}")


# ========== ПОЛУЧЕНИЕ ФОТО ==========

@router.get("/file/{file_type}/{filename}")
async def get_file(file_type: str, filename: str):
    """Получить файл по типу и имени"""

    # Определяем директорию
    if file_type == "trainers":
        file_path = f"{TRAINER_PHOTOS_DIR}/{filename}"
    elif file_type == "users":
        file_path = f"{USER_PHOTOS_DIR}/{filename}"
    elif file_type == "gyms":
        file_path = f"{GYM_PHOTOS_DIR}/{filename}"
    else:
        raise HTTPException(status_code=400, detail="Неверный тип файла")

    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="Файл не найден")

    return FileResponse(file_path)


# ========== ИНФОРМАЦИЯ О ФАЙЛАХ ==========

@router.get("/trainer-photo/{trainer_id}/info")
async def get_trainer_photo_info(
        trainer_id: int,
        db: Session = Depends(get_db)
):
    """Получить информацию о фото тренера"""

    trainer = db.query(models.Trainer).filter(models.Trainer.id == trainer_id).first()
    if not trainer or not trainer.photo:
        return {"has_photo": False}

    filename = trainer.photo.split("/")[-1]
    file_path = f"{TRAINER_PHOTOS_DIR}/{filename}"

    if os.path.exists(file_path):
        stat = os.stat(file_path)
        return {
            "has_photo": True,
            "photo_url": trainer.photo,
            "file_size": stat.st_size,
            "modified": datetime.fromtimestamp(stat.st_mtime).isoformat()
        }

    return {"has_photo": False}