import React from 'react';
import { CheckCircleIcon } from '@heroicons/react/outline';

const MembershipCard = ({ offer, onBuy }) => {
    const { price, lesson_count, valid_days } = offer;

    // Получаем количество занятий и дней из связанных таблиц
    const lessonsCount = lesson_count?.count || 4;
    const daysCount = valid_days?.count_day || 30;

    // Рассчитываем цену за занятие
    const pricePerLesson = (price / lessonsCount).toFixed(0);

    return (
        <div className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 group">
            <div className="p-6">
                {/* Заголовок */}
                <h3 className="text-xl font-bold text-gray-800 mb-2">
                    {lessonsCount} занятий
                </h3>

                {/* Цена */}
                <div className="mb-4">
                    <span className="text-3xl font-bold text-primary-600">{price} ₽</span>
                    <span className="text-gray-500 text-sm ml-2">/ {daysCount} дней</span>
                </div>

                {/* Цена за занятие */}
                <p className="text-sm text-gray-500 mb-4">
                    {pricePerLesson} ₽ за занятие
                </p>

                {/* Преимущества */}
                <ul className="space-y-2 mb-6">
                    <li className="flex items-center text-sm text-gray-600">
                        <CheckCircleIcon className="w-4 h-4 text-green-500 mr-2" />
                        <span>{lessonsCount} тренировок</span>
                    </li>
                    <li className="flex items-center text-sm text-gray-600">
                        <CheckCircleIcon className="w-4 h-4 text-green-500 mr-2" />
                        <span>Срок действия {daysCount} дней</span>
                    </li>
                    <li className="flex items-center text-sm text-gray-600">
                        <CheckCircleIcon className="w-4 h-4 text-green-500 mr-2" />
                        <span>Замораживание не предусмотрено</span>
                    </li>
                </ul>

                {/* Кнопка */}
                <button
                    onClick={onBuy}
                    className="w-full bg-gradient-to-r from-primary-500 to-primary-600 text-white py-3 rounded-lg font-semibold hover:from-primary-600 hover:to-primary-700 transition transform group-hover:scale-105"
                >
                    Купить абонемент
                </button>
            </div>
        </div>
    );
};

export default MembershipCard;