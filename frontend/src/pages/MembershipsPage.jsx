import React, { useState, useEffect } from 'react';
import { memberships } from '../services/api';
import { CreditCardIcon, CheckCircleIcon, ClockIcon } from '@heroicons/react/outline';
import toast from 'react-hot-toast';

const MembershipsPage = () => {
    const [offers, setOffers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeCategory, setActiveCategory] = useState('fitness');

    useEffect(() => {
        loadOffers();
    }, []);

    const loadOffers = async () => {
        try {
            setLoading(true);
            const response = await memberships.getOffers();
            console.log('Все абонементы:', response.data);
            setOffers(response.data);
        } catch (error) {
            console.error('Ошибка загрузки абонементов:', error);
            toast.error('Не удалось загрузить абонементы');
        } finally {
            setLoading(false);
        }
    };

    // Категории абонементов
    const categories = [
        {
            id: 'fitness',
            name: 'Фитнес • Пилатес • Йога',
            types: ['Фитнес', 'Пилатес', 'Взрослая йога'],
            prices: [2800, 4000, 6000, 7500]
        },
        {
            id: 'stretching',
            name: 'Растяжка (мини-группы)',
            types: ['Растяжка'],
            prices: [3200, 4800, 7200, 9000]
        },
        {
            id: 'full',
            name: 'Полный (все направления, кроме детской)',
            types: ['Полный'],
            prices: [3000, 4400, 6600, 8250]
        },
        {
            id: 'kids',
            name: 'Детская йога',
            types: ['Детская йога (3-7 лет)', 'Детская йога (7-13 лет)'],
            prices: [2400, 4000, 6000, 7500]
        },
        {
            id: 'single',
            name: 'Разовые занятия',
            types: ['Фитнес', 'Пилатес', 'Взрослая йога', 'Растяжка', 'Детская йога (3-7 лет)', 'Детская йога (7-13 лет)'],
            prices: [600, 800, 900] // Разные цены для разных направлений
        },
    ];

    // Фильтруем абонементы по категории
    const getOffersByCategory = (category) => {
        return offers.filter(offer => {
            const typeName = offer.lesson_type?.name || '';
            const price = offer.price;
            const lessonCount = offer.lesson_count?.count || 0;

            // Исключаем "Мать и дитя" полностью
            if (typeName.includes('Мать и дитя')) return false;

            if (category.id === 'single') {
                // Для разовых - только с количеством занятий = 1
                return lessonCount === 1;
            }

            // Для остальных категорий - проверяем тип и цену
            const typeMatches = category.types.some(type => typeName.includes(type));
            const priceMatches = category.prices.includes(price);

            return typeMatches && priceMatches && lessonCount > 1;
        });
    };

    // Группируем по количеству занятий для отображения
    const groupByLessonCount = (offers) => {
        const groups = {};
        offers.forEach(offer => {
            const count = offer.lesson_count?.count || 4;
            if (!groups[count]) {
                groups[count] = [];
            }
            groups[count].push(offer);
        });
        return groups;
    };

    const currentOffers = getOffersByCategory(categories.find(c => c.id === activeCategory));
    const groupedOffers = groupByLessonCount(currentOffers);

    // Сортировка количества занятий
    const sortedCounts = Object.keys(groupedOffers).sort((a, b) => parseInt(a) - parseInt(b));

    // Получаем название текущей категории для отображения
    const currentCategory = categories.find(c => c.id === activeCategory);

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Заголовок */}
            <div className="mb-8">
                <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
                    Абонементы
                </h1>
                <p className="text-gray-600">
                    Выберите подходящий вариант и приобретите в студии
                </p>
            </div>
            {/* Информационный блок */}
            <div className="mt-8 bg-primary-50 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-primary-800 mb-2">Как приобрести абонемент?</h3>
                <p className="text-primary-700 mb-4">
                    Абонементы можно приобрести непосредственно в студии у администратора.
                    После оплаты администратор добавит абонемент в вашу учетную запись.
                </p>
            </div>

            {/* Категории */}
            <div className="flex flex-wrap gap-2 mb-8">
                {categories.map((category) => (
                    <button
                        key={category.id}
                        onClick={() => setActiveCategory(category.id)}
                        className={`px-4 py-2 rounded-lg font-medium transition ${
                            activeCategory === category.id
                                ? 'bg-primary-500 text-white'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                    >
                        {category.name}
                    </button>
                ))}
            </div>

            {loading ? (
                <div className="flex justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                </div>
            ) : currentOffers.length === 0 ? (
                <div className="text-center py-16 bg-white rounded-xl shadow">
                    <CreditCardIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-xl font-medium text-gray-700 mb-2">Нет абонементов в этой категории</h3>
                </div>
            ) : (
                <div className="space-y-8">
                    {sortedCounts.map((count) => (
                        <div key={count}>
                            <h2 className="text-2xl font-bold text-gray-800 mb-4">
                                {count} занятий
                            </h2>
                            <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                {groupedOffers[count].map((offer) => (
                                    <div key={offer.id} className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition-all duration-300">
                                        <div className="p-6">
                                            {/* Тип абонемента */}
                                            <div className="mb-3">
                        <span className={`text-sm font-medium px-3 py-1 rounded-full ${
                            offer.lesson_type?.name === 'Полный'
                                ? 'bg-green-100 text-green-700'
                                : 'bg-primary-50 text-primary-600'
                        }`}>
                          {offer.lesson_type?.name || 'Абонемент'}
                        </span>
                                            </div>

                                            {/* Количество занятий */}
                                            <div className="flex justify-between items-start mb-4">
                                                <h3 className="text-2xl font-bold text-gray-900">
                                                    {offer.lesson_count?.count || 4} занятия
                                                </h3>
                                            </div>

                                            {/* Цена */}
                                            <div className="mb-4">
                                                <span className="text-3xl font-bold text-primary-600">{offer.price} ₽</span>
                                                <span className="text-gray-500 text-sm ml-2">
                          / {offer.valid_days?.count_day || 35} дней
                        </span>
                                            </div>

                                            {/* Характеристики */}
                                            <div className="space-y-3 mb-6">
                                                <div className="flex items-center text-gray-600">
                                                    <CheckCircleIcon className="w-5 h-5 text-green-500 mr-2" />
                                                    <span>{offer.lesson_count?.count || 4} тренировок</span>
                                                </div>
                                                <div className="flex items-center text-gray-600">
                                                    <ClockIcon className="w-5 h-5 text-primary-500 mr-2" />
                                                    <span>Срок {offer.valid_days?.count_day || 35} дней</span>
                                                </div>
                                                {offer.lesson_count?.count && (
                                                    <div className="flex items-center text-gray-600">
                            <span className="text-sm">
                              Цена за занятие: {Math.round(offer.price / offer.lesson_count.count)} ₽
                            </span>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Дополнительное описание для полного абонемента */}
                                            {offer.lesson_type?.name === 'Полный' && (
                                                <div className="mb-4 text-xs text-green-600 bg-green-50 p-2 rounded">
                                                    ✓ Фитнес • Пилатес • Йога • Растяжка
                                                </div>
                                            )}

                                            {/* Информация о покупке */}
                                            <div className="text-center text-sm text-gray-500 border-t pt-4">
                                                <p>Приобрести можно в студии</p>
                                                <p className="text-xs text-gray-400 mt-1">
                                                    После оплаты администратор активирует абонемент
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            )}


        </div>
    );
};

export default MembershipsPage;