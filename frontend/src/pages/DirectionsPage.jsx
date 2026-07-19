import React from 'react';
import { Link } from 'react-router-dom';
import {
    ChevronRightIcon
} from '@heroicons/react/outline';

const DirectionsPage = () => {
    // Данные о направлениях
    const directions = [
        {
            id: 1,
            name: 'Фитнес',
            description: 'Силовые тренировки для всего тела',
            icon: '💪',
            color: 'from-orange-400 to-red-500',
            image: '/images/directions/fitness.jpg'
        },
        {
            id: 2,
            name: 'Пилатес',
            description: 'Мягкая тренировка для мышц кора и осанки',
            icon: '🧘',
            color: 'from-green-400 to-emerald-500',
            image: '/images/directions/pilates.jpg'
        },
        {
            id: 3,
            name: 'Растяжка',
            description: 'Тренировка на гибкость и расслабление',
            icon: '🤸',
            color: 'from-purple-400 to-pink-500',
            image: '/images/directions/stretching.jpg'
        },
        {
            id: 4,
            name: 'Взрослая йога',
            description: 'Гармония тела и разума',
            icon: '🕉️',
            color: 'from-blue-400 to-indigo-500',
            image: '/images/directions/yoga-adult.jpg'
        },
        {
            id: 5,
            name: 'Детская йога (3-7 лет)',
            description: 'Йога для самых маленьких',
            icon: '👧',
            color: 'from-yellow-400 to-orange-500',
            image: '/images/directions/yoga-kids-1.jpg'
        },
        {
            id: 6,
            name: 'Детская йога (7-13 лет)',
            description: 'Йога для школьников',
            icon: '👦',
            color: 'from-indigo-400 to-blue-500',
            image: '/images/directions/yoga-kids-2.jpg'
        }
    ];

    return (
        <div className="min-h-screen bg-[#F5F0E9]">
            {/* Hero секция */}
            <section className="relative bg-gradient-to-r from-[#8B6B4D] to-[#6B4F3A] text-white py-16 md:py-20 lg:py-24">
                <div className="absolute inset-0 bg-black opacity-20"></div>
                <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-4 md:mb-6">
                        Наши направления
                    </h1>
                    <p className="text-base sm:text-lg md:text-xl max-w-3xl mx-auto opacity-90 px-4">
                        Выберите занятие по душе и начните свой путь к здоровью
                    </p>
                </div>
            </section>

            {/* Список направлений */}
            <section className="py-12 md:py-16 lg:py-20">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="space-y-16">
                        {directions.map((direction, index) => (
                            <div
                                key={direction.id}
                                className={`flex flex-col ${
                                    index % 2 === 0 ? 'lg:flex-row' : 'lg:flex-row-reverse'
                                } gap-8 lg:gap-12 items-center`}
                            >
                                {/* Фото */}
                                <div className="lg:w-1/2">
                                    <div className="relative h-64 md:h-80 lg:h-96 rounded-lg overflow-hidden shadow-2xl">
                                        <img
                                            src={direction.image}
                                            alt={direction.name}
                                            className="w-full h-full object-cover object-center"
                                            onError={(e) => {
                                                e.target.src = 'https://via.placeholder.com/800x600?text=Фото+скоро+будет';
                                            }}
                                        />
                                        <div className={`absolute inset-0 bg-gradient-to-r ${direction.color} opacity-20`}></div>
                                    </div>
                                </div>

                                {/* Описание */}
                                <div className="lg:w-1/2 space-y-4">
                                    <div className="flex items-center space-x-4">
                                        <span className="text-5xl">{direction.icon}</span>
                                        <h2 className="font-serif text-3xl md:text-4xl font-bold text-[#2C1810]">
                                            {direction.name}
                                        </h2>
                                    </div>

                                    <p className="text-lg text-[#6B4F3A] leading-relaxed">
                                        {direction.description}
                                    </p>

                                    <div className="pt-4">
                                        <Link
                                            to="/schedule"
                                            className="inline-flex items-center px-6 py-3 bg-[#8B6B4D] text-white font-medium hover:bg-[#6B4F3A] transition group"
                                        >
                                            Расписание
                                            <ChevronRightIcon className="w-5 h-5 ml-2 group-hover:translate-x-1 transition" />
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>
        </div>
    );
};

export default DirectionsPage;