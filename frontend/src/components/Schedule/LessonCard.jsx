import React from 'react';
import { format } from 'date-fns';
import { 
  ClockIcon, 
  LocationMarkerIcon,
  UserGroupIcon,
  EyeIcon  // Добавляем иконку для просмотра
} from '@heroicons/react/outline';
import TrainerPhoto from '../UI/TrainerPhoto';
import { useAuth } from '../../contexts/AuthContext';

const LessonCard = ({ lesson, onBook, onViewBookings }) => {
  const { isAdmin } = useAuth();
  const {
    lesson_type,
    trainer,
    gym,
    date_lesson,
    available_seats,
    booked_count
  } = lesson;

  const timeStr = format(new Date(date_lesson), 'HH:mm');
  const isAvailable = available_seats > 0;
  const capacity = lesson_type?.capacity || 0;
  const capacityPercentage = (booked_count / capacity) * 100;

  const getCapacityColor = () => {
    if (capacityPercentage >= 80) return 'bg-red-500';
    if (capacityPercentage >= 50) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const getSeatsWord = (count) => {
    const lastDigit = count % 10;
    const lastTwoDigits = count % 100;

    if (lastTwoDigits >= 11 && lastTwoDigits <= 14) {
      return 'мест';
    }
    if (lastDigit === 1) {
      return 'место';
    }
    if (lastDigit >= 2 && lastDigit <= 4) {
      return 'места';
    }
    return 'мест';
  };

  return (
    <div className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
      <div className="p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
          {/* Левая часть - основная информация */}
          <div className="flex-1">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                  {lesson_type?.name || 'Занятие'}
                </h3>
                <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                  <div className="flex items-center">
                    <ClockIcon className="w-5 h-5 mr-1 text-primary-500" />
                    <span>{timeStr}</span>
                  </div>
                  <div className="flex items-center">
                    <LocationMarkerIcon className="w-5 h-5 mr-1 text-primary-500" />
                    <span>{gym?.name || 'Зал'}</span>
                  </div>
                  <div className="flex items-center">
                    <UserGroupIcon className="w-5 h-5 mr-1 text-primary-500" />
                    <span>{booked_count || 0}/{capacity}</span>
                  </div>
                </div>
              </div>
              
              {/* Индикатор свободных мест на мобильных */}
              <div className="lg:hidden">
                <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                  isAvailable ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                }`}>
                  {isAvailable ? `${available_seats} мест` : 'Нет мест'}
                </div>
              </div>
            </div>

            {/* Информация о тренере с фото */}
            <div className="flex items-center mb-4 p-3 bg-gray-50 rounded-lg">
              <TrainerPhoto trainer={trainer} className="w-16 h-16 rounded-full mr-4 border-2 border-primary-200" />
              <div>
                <p className="font-semibold text-gray-900 text-lg">{trainer?.name || 'Тренер'}</p>
                <p className="text-sm text-gray-500">{trainer?.specialization || ''}</p>
              </div>
            </div>
          </div>

          {/* Правая часть - места и кнопки */}
          <div className="lg:ml-8 lg:text-right">
            {/* Индикатор мест для десктопа */}
            <div className="hidden lg:block mb-4">
              <div className="text-sm text-gray-500 mb-2">
                Вместимость: {capacity} чел
              </div>
              <div className="relative w-48 h-2 bg-gray-200 rounded-full mb-2">
                <div
                  className={`absolute top-0 left-0 h-full rounded-full transition-all duration-300 ${getCapacityColor()}`}
                  style={{ width: `${capacityPercentage}%` }}
                />
              </div>
              <div className="text-sm">
                <span className={isAvailable ? 'text-green-600 font-medium' : 'text-red-600 font-medium'}>
                  {isAvailable 
                    ? `${available_seats} ${getSeatsWord(available_seats)} свободно` 
                    : 'Мест нет'}
                </span>
                <span className="text-gray-400 text-xs ml-2">
                  (записано: {booked_count || 0})
                </span>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              {/* Кнопка просмотра записей (только для админа) */}
              {isAdmin && onViewBookings && (
                <button
                  onClick={() => onViewBookings(lesson)}
                  className="p-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition"
                  title="Просмотреть записи"
                >
                  <EyeIcon className="w-5 h-5" />
                </button>
              )}

              {/* Кнопка записи */}
              {isAvailable ? (
                <button
                  onClick={onBook}
                  className="flex-1 lg:flex-none btn-primary px-8 py-3 text-lg transform hover:scale-105 transition-transform"
                >
                  Записаться
                </button>
              ) : (
                <button
                  disabled
                  className="flex-1 lg:flex-none bg-gray-300 text-gray-600 px-8 py-3 rounded-lg text-lg cursor-not-allowed"
                >
                  Мест нет
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Прогресс-бар для мобильных */}
        <div className="lg:hidden mt-4">
          <div className="flex justify-between text-sm text-gray-500 mb-1">
            <span>Вместимость: {capacity} чел</span>
            <span>Записано: {booked_count || 0}</span>
          </div>
          <div className="relative w-full h-2 bg-gray-200 rounded-full">
            <div
              className={`absolute top-0 left-0 h-full rounded-full transition-all duration-300 ${getCapacityColor()}`}
              style={{ width: `${capacityPercentage}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default LessonCard;