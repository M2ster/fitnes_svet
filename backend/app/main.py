from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from app.routers import auth, memberships, schedule, admin, upload, trainers, schedule_templates, public_gyms  # Добавляем schedule_templates
from app.database import engine
from app.models import models
from app.init_data import init_db
import os

# Создание таблиц
models.Base.metadata.create_all(bind=engine)

# Инициализация данных
init_db()

app = FastAPI(title="Fitness Studio API")

# Создаем директории для uploads
os.makedirs("uploads/trainers", exist_ok=True)
os.makedirs("uploads/users", exist_ok=True)
os.makedirs("uploads/gyms", exist_ok=True)

# Монтируем статические файлы
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

# Настройка CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "https://fitness-sveti.ru",
        "https://www.fitness-sveti.ru",
        "http://fitness-sveti.ru",  # временно для теста
        "http://www.fitness-sveti.ru"  # временно для теста
    ],
    allow_methods=["*"],
    allow_credentials=True,
    allow_headers=["*"],
    expose_headers=["*"],
)

# Подключаем роутеры
app.include_router(auth.router)
app.include_router(memberships.router)
app.include_router(schedule.router)
app.include_router(admin.router)
app.include_router(upload.router)
app.include_router(trainers.router)
app.include_router(schedule_templates.router)
app.include_router(public_gyms.router) # Добавляем роутер для шаблонов

@app.get("/")
def root():
    return {"message": "Fitness Studio API"}

@app.get("/health")
def health_check():
    return {"status": "ok"}

# Middleware для логирования
@app.middleware("http")
async def log_requests(request, call_next):
    print(f"Запрос: {request.method} {request.url}")
    print(f"Headers: {request.headers}")
    response = await call_next(request)
    print(f"Ответ: {response.status_code}")
    return response