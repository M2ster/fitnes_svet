import React, { useState, useEffect } from 'react';
import { XIcon, CreditCardIcon, CalendarIcon, CheckCircleIcon } from '@heroicons/react/outline';
import { memberships, admin } from '../../services/api';
import toast from 'react-hot-toast';
import { format, addDays } from 'date-fns';

const CreateMembershipModal = ({ user, onClose, onSuccess }) => {
    const [offers, setOffers] = useState([]);
    const [selectedOfferId, setSelectedOfferId] = useState('');
    const [startDate, setStartDate] = useState(format(new Date(), 'yyyy-MM-dd'));
    const [loading, setLoading] = useState(false);
    const [loadingOffers, setLoadingOffers] = useState(true);
    const [success, setSuccess] = useState(false);

    useEffect(() => {
        loadOffers();
    }, []);

    const loadOffers = async () => {
        try {
            setLoadingOffers(true);
            const response = await memberships.getOffers();
            setOffers(response.data);
        } catch (error) {
            console.error('Ошибка загрузки предложений:', error);
            toast.error('Не удалось загрузить типы абонементов');
        } finally {
            setLoadingOffers(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!selectedOfferId) {
            toast.error('Выберите тип абонемента');
            return;
        }

        setLoading(true);
        try {
            await admin.createMembership({
                user_id: user.id,
                membership_offer_id: parseInt(selectedOfferId),
                start_date: startDate
            });

            setSuccess(true);
            toast.success('Абонемент успешно добавлен!');

            setTimeout(() => {
                onSuccess();
            }, 1500);
        } catch (error) {
            console.error('Ошибка создания абонемента:', error);
        } finally {
            setLoading(false);
        }
    };

    const selectedOffer = offers.find(o => o.id === parseInt(selectedOfferId));

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                {success ? (
                    // Экран успеха
                    <div className="p-8 text-center">
                        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <CheckCircleIcon className="w-10 h-10 text-green-500" />
                        </div>
                        <h3 className="text-2xl font-bold text-gray-900 mb-2">
                            Абонемент добавлен!
                        </h3>
                        <p className="text-gray-600 mb-6">
                            Абонемент успешно добавлен пользователю {user?.first_name} {user?.last_name}
                        </p>
                        <button
                            onClick={onSuccess}
                            className="btn-primary px-8 py-3"
                        >
                            Закрыть
                        </button>
                    </div>
                ) : (
                    <>
                        {/* Заголовок */}
                        <div className="sticky top-0 bg-white border-b border-gray-200 p-6">
                            <div className="flex justify-between items-center">
                                <div className="flex items-center">
                                    <CreditCardIcon className="w-6 h-6 text-primary-500 mr-2" />
                                    <h2 className="text-2xl font-bold text-gray-900">
                                        Добавление абонемента
                                    </h2>
                                </div>
                                <button
                                    onClick={onClose}
                                    className="text-gray-400 hover:text-gray-600 transition p-2 hover:bg-gray-100 rounded-full"
                                >
                                    <XIcon className="w-6 h-6" />
                                </button>
                            </div>
                        </div>

                        {/* Контент */}
                        <div className="p-6">
                            {/* Информация о пользователе */}
                            <div className="bg-primary-50 rounded-xl p-4 mb-6">
                                <h3 className="font-medium text-primary-800 mb-2">Пользователь:</h3>
                                <p className="text-lg font-semibold text-gray-900">
                                    {user?.last_name} {user?.first_name} {user?.patronymic}
                                </p>
                                <p className="text-sm text-gray-600 mt-1">
                                    Телефон: {user?.phone}
                                </p>
                            </div>

                            <form onSubmit={handleSubmit}>
                                {/* Выбор абонемента */}
                                <div className="mb-6">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Тип абонемента *
                                    </label>

                                    {loadingOffers ? (
                                        <div className="flex justify-center py-8">
                                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                                        </div>
                                    ) : (
                                        <div className="space-y-3 max-h-60 overflow-y-auto pr-2">
                                            {offers.map((offer) => (
                                                <label
                                                    key={offer.id}
                                                    className={`block p-4 border-2 rounded-xl cursor-pointer transition ${
                                                        selectedOfferId === offer.id.toString()
                                                            ? 'border-primary-500 bg-primary-50'
                                                            : 'border-gray-200 hover:border-primary-300'
                                                    }`}
                                                >
                                                    <input
                                                        type="radio"
                                                        name="offer"
                                                        value={offer.id}
                                                        checked={selectedOfferId === offer.id.toString()}
                                                        onChange={(e) => setSelectedOfferId(e.target.value)}
                                                        className="sr-only"
                                                    />
                                                    <div className="flex justify-between items-center">
                                                        <div>
                                                            <p className="font-bold text-gray-900">
                                                                {offer.lesson_type?.name || 'Абонемент'}
                                                            </p>
                                                            <p className="text-sm text-gray-600">
                                                                {offer.lesson_count?.count} занятий · {offer.valid_days?.count_day} дней
                                                            </p>
                                                            {/* Добавляем описание для полного абонемента */}
                                                            {offer.lesson_type?.name === 'Полный' && (
                                                                <p className="text-xs text-green-600 mt-1">
                                                                    ✓ Все направления: фитнес, пилатес, йога, растяжка
                                                                </p>
                                                            )}
                                                        </div>
                                                        <div className="text-right">
                                                            <p className="text-lg font-bold text-primary-600">
                                                                {offer.price} ₽
                                                            </p>
                                                            {selectedOfferId === offer.id.toString() && (
                                                                <CheckCircleIcon className="w-5 h-5 text-primary-500 ml-2" />
                                                            )}
                                                        </div>
                                                    </div>
                                                </label>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* Дата начала */}
                                <div className="mb-6">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Дата начала
                                    </label>
                                    <div className="relative">
                                        <CalendarIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                                        <input
                                            type="date"
                                            value={startDate}
                                            onChange={(e) => setStartDate(e.target.value)}
                                            className="input-field pl-10"
                                            min={format(new Date(), 'yyyy-MM-dd')}
                                        />
                                    </div>
                                    {selectedOffer && (
                                        <p className="text-sm text-gray-500 mt-2">
                                            Абонемент будет действовать до: {format(addDays(new Date(startDate), selectedOffer.valid_days?.count_day || 30), 'dd.MM.yyyy')}
                                        </p>
                                    )}
                                </div>

                                {/* Информация о списании */}
                                {selectedOffer && (
                                    <div className="bg-blue-50 rounded-lg p-4 mb-6">
                                        <h4 className="font-medium text-blue-800 mb-2">Информация об абонементе:</h4>
                                        <ul className="text-sm text-blue-700 space-y-1">
                                            <li>• Количество занятий: {selectedOffer.lesson_count?.count}</li>
                                            <li>• Срок действия: {selectedOffer.valid_days?.count_day} дней</li>
                                            <li>• Стоимость: {selectedOffer.price} ₽</li>
                                        </ul>
                                    </div>
                                )}

                                {/* Кнопки */}
                                <div className="flex space-x-3">
                                    <button
                                        type="button"
                                        onClick={onClose}
                                        className="flex-1 btn-secondary py-3"
                                    >
                                        Отмена
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={loading || !selectedOfferId}
                                        className="flex-1 btn-primary py-3 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {loading ? (
                                            <div className="flex items-center justify-center">
                                                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                                                Добавление...
                                            </div>
                                        ) : 'Добавить абонемент'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default CreateMembershipModal;