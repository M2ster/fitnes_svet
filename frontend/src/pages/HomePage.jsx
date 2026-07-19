import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { trainers } from '../services/api';
import TrainerPhoto from '../components/UI/TrainerPhoto';
import {
    SparklesIcon,
    UsersIcon,
    HeartIcon,
    ClockIcon,
    StarIcon,
    ChevronRightIcon
} from '@heroicons/react/outline';

const HomePage = () => {
    const { user } = useAuth();
    const [trainersList, setTrainersList] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadTrainers();
    }, []);

    const loadTrainers = async () => {
        try {
            setLoading(true);
            const response = await trainers.getAll();
            if (response.data && response.data.length > 0) {
                // Сортируем: Светлана первой, остальные по алфавиту
                const sortedTrainers = [...response.data].sort((a, b) => {
                    if (a.name.includes('Светлана')) return -1;
                    if (b.name.includes('Светлана')) return 1;
                    return a.name.localeCompare(b.name);
                });
                setTrainersList(sortedTrainers);
            } else {
                setTrainersList([
                    {
                        id: 1,
                        name: 'Лукашова Светлана',
                        specialization: 'Фитнес, растяжка, пилатес',
                        description: 'Инструктор с 8-летним стажем. Поможет укрепить тело, улучшить осанку и обрести гибкость.',
                        photo: null
                    },
                    {
                        id: 2,
                        name: 'Устимовская Ирма',
                        specialization: 'Взрослая и детская йога',
                        description: 'Сертифицированный инструктор йоги. Работает с детьми и взрослыми.',
                        photo: null
                    }
                ]);
            }
        } catch (error) {
            console.error('Ошибка загрузки тренеров:', error);
            setTrainersList([
                {
                    id: 1,
                    name: 'Лукашова Светлана',
                    specialization: 'Фитнес, растяжка, пилатес',
                    description: 'Инструктор с 8-летним стажем.',
                    photo: null
                },
                {
                    id: 2,
                    name: 'Устимовская Ирма',
                    specialization: 'Взрослая и детская йога',
                    description: 'Сертифицированный инструктор йоги.',
                    photo: null
                }
            ]);
        } finally {
            setLoading(false);
        }
    };

    const features = [
        {
            icon: SparklesIcon,
            title: 'Опытные тренеры',
            description: 'Сертифицированные инструкторы с многолетним стажем',
        },
        {
            icon: UsersIcon,
            title: 'Небольшие группы',
            description: 'До 10 человек, индивидуальный подход к каждому',
        },
        {
            icon: HeartIcon,
            title: 'Разные направления',
            description: 'Фитнес, пилатес, растяжка, йога для взрослых и детей',
        },
        {
            icon: ClockIcon,
            title: 'Удобное расписание',
            description: 'Занятия утром, днем и вечером каждый день',
        }
    ];

    const reviews = [
        {
            id: 1,
            text: 'Отличная студия! Хожу на растяжку к Светлане, результаты уже через месяц. Очень уютно и профессионально!',
            author: 'Анна',
            rating: 5,
        },
        {
            id: 2,
            text: 'Вожу дочку на детскую йогу к Ирме. Ребенок в восторге, стал более спокойным и гибким. Спасибо!',
            author: 'Елена',
            rating: 5,
        },
        {
            id: 3,
            text: 'Прекрасное место для тренировок. Индивидуальный подход, приятная атмосфера. Рекомендую!',
            author: 'Михаил',
            rating: 5,
        }
    ];

    return (
        <div className="min-h-screen">
            {/* Hero секция - адаптирована для мобильных */}
            <section className="relative bg-[#F5F0E9] py-12 sm:py-16 md:py-20 lg:py-24 xl:py-32 overflow-hidden">
                {/* Декоративный узор - убираем на мобильных для производительности */}
                <div className="hidden sm:block absolute inset-0 opacity-5">
                    <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
                        <pattern id="pattern" x="0" y="0" width="60" height="60" patternUnits="userSpaceOnUse">
                            <path d="M30 30 L45 15 L30 0 L15 15 L30 30 L45 45 L30 60 L15 45 L30 30" stroke="#E8DDD2" fill="none" strokeWidth="1"/>
                        </pattern>
                        <rect width="100%" height="100%" fill="url(#pattern)"/>
                    </svg>
                </div>

                <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center max-w-4xl mx-auto">
                        {/* Заголовок - адаптивные размеры */}
                        <h1 className="font-serif text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-bold text-[#2C1810] mb-3 sm:mb-4 md:mb-6 leading-tight">
                            Осознанные
                            <span className="block text-[#8B6B4D] mt-1 sm:mt-2">тренировки</span>
                        </h1>

                        {/* Декоративная линия */}
                        <div className="w-16 sm:w-20 md:w-24 h-0.5 bg-[#8B6B4D] mx-auto my-4 sm:my-6 md:my-8"></div>

                        {/* Описание - адаптивный текст */}
                        <p className="text-sm sm:text-base md:text-lg lg:text-xl text-[#6B4F3A] mb-6 sm:mb-8 md:mb-10 lg:mb-12 max-w-2xl mx-auto px-4">
                            Фитнес, пилатес, растяжка и йога для взрослых и детей в уютной студии
                        </p>

                        {/* Статистика - компактно на мобильных */}
                        <div className="grid grid-cols-3 gap-2 sm:gap-3 md:gap-4 max-w-md mx-auto mb-6 sm:mb-8 md:mb-10 lg:mb-12">
                            <div className="text-center">
                                <div className="font-serif text-xl sm:text-2xl md:text-3xl font-bold text-[#8B6B4D]">5+</div>
                                <div className="text-[10px] sm:text-xs md:text-sm text-[#6B4F3A] uppercase tracking-wider">лет опыта</div>
                            </div>
                            <div className="text-center">
                                <div className="font-serif text-xl sm:text-2xl md:text-3xl font-bold text-[#8B6B4D]">500+</div>
                                <div className="text-[10px] sm:text-xs md:text-sm text-[#6B4F3A] uppercase tracking-wider">клиентов</div>
                            </div>
                            <div className="text-center">
                                <div className="font-serif text-xl sm:text-2xl md:text-3xl font-bold text-[#8B6B4D]">10+</div>
                                <div className="text-[10px] sm:text-xs md:text-sm text-[#6B4F3A] uppercase tracking-wider">занятий в день</div>
                            </div>
                        </div>

                        {!user && (
                            <div className="flex flex-col xs:flex-row gap-2 sm:gap-3 md:gap-4 justify-center px-4">
                                <Link
                                    to="/register"
                                    className="btn-primary px-4 sm:px-6 md:px-8 lg:px-10 py-2 sm:py-2.5 md:py-3 text-xs sm:text-sm md:text-base"
                                >
                                    Записаться
                                </Link>
                                <Link
                                    to="/schedule"
                                    className="btn-secondary px-4 sm:px-6 md:px-8 lg:px-10 py-2 sm:py-2.5 md:py-3 text-xs sm:text-sm md:text-base"
                                >
                                    Расписание
                                </Link>
                            </div>
                        )}
                    </div>
                </div>
            </section>

            {/* Преимущества */}
            <section className="py-12 sm:py-16 md:py-20 bg-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-8 sm:mb-12 md:mb-16">
                        <h2 className="section-title text-2xl sm:text-3xl md:text-4xl">Почему выбирают нас</h2>
                        <p className="section-subtitle text-sm sm:text-base md:text-lg">Мы создали идеальные условия для ваших тренировок</p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 md:gap-6 lg:gap-8">
                        {features.map((feature, index) => {
                            const Icon = feature.icon;
                            return (
                                <div
                                    key={index}
                                    className="card p-4 sm:p-5 md:p-6 lg:p-8 text-center group hover:-translate-y-2 transition-all duration-300"
                                >
                                    <div className="text-[#8B6B4D] mb-2 sm:mb-3 md:mb-4 flex justify-center">
                                        <Icon className="w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 lg:w-12 lg:h-12 group-hover:scale-110 transition-transform" />
                                    </div>
                                    <h3 className="font-serif text-base sm:text-lg md:text-xl font-bold text-[#2C1810] mb-1 sm:mb-2">{feature.title}</h3>
                                    <p className="text-[#6B4F3A] text-xs sm:text-sm leading-relaxed">{feature.description}</p>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </section>

            {/* Тренеры */}
            <section className="py-12 sm:py-16 md:py-20 bg-[#F5F0E9]">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-8 sm:mb-12 md:mb-16">
                        <h2 className="section-title text-2xl sm:text-3xl md:text-4xl">Наши тренеры</h2>
                        <p className="section-subtitle text-sm sm:text-base md:text-lg">Профессионалы своего дела с большим опытом</p>
                    </div>

                    {loading ? (
                        <div className="flex justify-center py-12">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#8B6B4D]"></div>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5 md:gap-6 lg:gap-8">
                            {trainersList.map((trainer) => (
                                <div
                                    key={trainer.id}
                                    className="bg-white border border-[#E8DDD2] shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden"
                                >
                                    {/* Мобильная версия (до md) - вертикальная */}
                                    <div className="flex flex-col md:hidden">
                                        <div className="w-full h-64 sm:h-72 bg-[#E8DDD2]">
                                            <TrainerPhoto trainer={trainer} className="w-full h-full object-cover object-center" />
                                        </div>
                                        <div className="p-5 sm:p-6">
                                            <h3 className="font-serif text-xl sm:text-2xl font-bold text-[#2C1810] mb-2">
                                                {trainer.name}
                                            </h3>
                                            <p className="text-[#8B6B4D] font-medium text-sm sm:text-base mb-3">
                                                {trainer.specialization}
                                            </p>
                                            <p className="text-[#6B4F3A] text-sm sm:text-base mb-4 leading-relaxed">
                                                {trainer.description}
                                            </p>
                                            <div className="flex items-center mb-4">
                                                {[...Array(5)].map((_, i) => (
                                                    <StarIcon key={i} className="w-4 h-4 sm:w-5 sm:h-5 text-[#8B6B4D] fill-current" />
                                                ))}
                                            </div>
                                            {/*<button className="text-[#8B6B4D] font-medium text-sm sm:text-base hover:text-[#6B4F3A] transition flex items-center group">*/}
                                            {/*    Записаться к тренеру*/}
                                            {/*    <ChevronRightIcon className="w-4 h-4 ml-1 group-hover:translate-x-1 transition" />*/}
                                            {/*</button>*/}
                                        </div>
                                    </div>

                                    {/* Десктоп версия (md и выше) - горизонтальная */}
                                    <div className="hidden md:flex md:flex-row">
                                        <div className="md:w-2/5 h-auto bg-[#E8DDD2]">
                                            <TrainerPhoto trainer={trainer} className="w-full h-full object-cover object-center" />
                                        </div>
                                        <div className="md:w-3/5 p-5 lg:p-6">
                                            <h3 className="font-serif text-xl lg:text-2xl font-bold text-[#2C1810] mb-2">
                                                {trainer.name}
                                            </h3>
                                            <p className="text-[#8B6B4D] font-medium text-sm lg:text-base mb-3">
                                                {trainer.specialization}
                                            </p>
                                            <p className="text-[#6B4F3A] text-sm lg:text-base mb-4 leading-relaxed line-clamp-3 lg:line-clamp-none">
                                                {trainer.description}
                                            </p>
                                            <div className="flex items-center mb-4">
                                                {[...Array(5)].map((_, i) => (
                                                    <StarIcon key={i} className="w-4 h-4 text-[#8B6B4D] fill-current" />
                                                ))}
                                            </div>
                                            {/*<button className="text-[#8B6B4D] font-medium text-sm lg:text-base hover:text-[#6B4F3A] transition flex items-center group">*/}
                                            {/*    Записаться к тренеру*/}
                                            {/*    <ChevronRightIcon className="w-4 h-4 ml-1 group-hover:translate-x-1 transition" />*/}
                                            {/*</button>*/}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </section>

            {/*/!* Отзывы *!/*/}
            {/*<section className="py-12 sm:py-16 md:py-20 bg-white">*/}
            {/*    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">*/}
            {/*        <div className="text-center mb-8 sm:mb-12 md:mb-16">*/}
            {/*            <h2 className="section-title text-2xl sm:text-3xl md:text-4xl">Отзывы наших клиентов</h2>*/}
            {/*            <p className="section-subtitle text-sm sm:text-base md:text-lg">Что говорят о нас те, кто уже занимается</p>*/}
            {/*        </div>*/}

            {/*        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 md:gap-6 lg:gap-8">*/}
            {/*            {reviews.map((review) => (*/}
            {/*                <div key={review.id} className="card p-4 sm:p-5 md:p-6 lg:p-8">*/}
            {/*                    <div className="flex mb-2 sm:mb-3 md:mb-4">*/}
            {/*                        {[...Array(review.rating)].map((_, i) => (*/}
            {/*                            <StarIcon key={i} className="w-3 h-3 sm:w-4 sm:h-4 text-[#8B6B4D] fill-current" />*/}
            {/*                        ))}*/}
            {/*                    </div>*/}
            {/*                    <p className="text-[#4A3A2C] text-xs sm:text-sm mb-3 sm:mb-4 italic leading-relaxed line-clamp-4">"{review.text}"</p>*/}
            {/*                    <div className="flex items-center justify-between">*/}
            {/*                        <div>*/}
            {/*                            <p className="font-serif font-bold text-[#2C1810] text-sm sm:text-base">— {review.author}</p>*/}
            {/*                        </div>*/}
            {/*                        <div className="w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10 bg-[#E8DDD2] rounded-full flex items-center justify-center">*/}
            {/*        <span className="text-[#8B6B4D] font-serif font-bold text-xs sm:text-sm">*/}
            {/*          {review.author.charAt(0)}*/}
            {/*        </span>*/}
            {/*                        </div>*/}
            {/*                    </div>*/}
            {/*                </div>*/}
            {/*            ))}*/}
            {/*        </div>*/}
            {/*    </div>*/}
            {/*</section>*/}

            {/* Призыв к действию */}
            {!user && (
                <section className="py-12 sm:py-16 md:py-20 bg-[#8B6B4D] text-white">
                    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                        <h2 className="font-serif text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-3 sm:mb-4 md:mb-6">
                            Готовы начать?
                        </h2>
                        <p className="text-sm sm:text-base md:text-lg lg:text-xl mb-6 sm:mb-8 md:mb-10 text-[#F5F0E9] px-4">
                            Приходите на пробное занятие и почувствуйте разницу!
                        </p>
                        <div className="flex flex-col xs:flex-row gap-2 sm:gap-3 md:gap-4 justify-center px-4">
                            <Link
                                to="/register"
                                className="bg-white text-[#8B6B4D] px-4 sm:px-6 md:px-8 lg:px-10 py-2 sm:py-2.5 md:py-3 text-xs sm:text-sm md:text-base font-medium hover:bg-[#F5F0E9] transition"
                            >
                                Записаться сейчас
                            </Link>
                            <Link
                                to="/schedule"
                                className="border-2 border-white text-white px-4 sm:px-6 md:px-8 lg:px-10 py-2 sm:py-2.5 md:py-3 text-xs sm:text-sm md:text-base font-medium hover:bg-white hover:text-[#8B6B4D] transition"
                            >
                                Посмотреть расписание
                            </Link>
                        </div>
                    </div>
                </section>
            )}
        </div>
    );
};

export default HomePage;