import React, { useState } from 'react';
import { XIcon, CheckCircleIcon } from '@heroicons/react/outline';
import { memberships } from '../../services/api';
import toast from 'react-hot-toast';

const BuyMembershipModal = ({ offer, onClose, onSuccess }) => {
    const [loading, setLoading] = useState(false);
    const [confirmed, setConfirmed] = useState(false);

    const { lesson_type, price, lesson_count, valid_days } = offer;
    const lessonsCount = lesson_count?.count || 4;
    const daysCount = valid_days?.count_day || 30;

    const handleBuy = async () => {
        setLoading(true);
        try {
            await memberships.buy(offer.id);
            toast.success('Абонемент успешно приобретен!');
            setConfirmed(true);
            setTimeout(() => {
                onSuccess();
            }, 1500);
        } catch (error) {
            console.error('Ошибка покупки:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl max-w-md w-full animate-fadeIn">
                <div className="p-6">
                    {confirmed ? (
                        // Успешная покупка
                        <div className="text-center py-8">
                            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <CheckCircleIcon className="w-10 h-10 text-green-500" />
                            </div>
                            <h3 className="text-2xl font-bold text-gray-900 mb-2">
                                Абонемент куплен!
                            </h3>
                            <p className="text-gray-600 mb-6">
                                Теперь вы можете записываться на занятия
                            </p>
                            <button
                                onClick={onSuccess}
                                className="btn-primary w-full"
                            >
                                Отлично
                            </button>
                        </div>
                    ) : (
                        // Подтверждение покупки
                        <>
                            <div className="flex justify-between items-center mb-4">
                                <h2 className="text-2xl font-bold text-gray-900">
                                    Подтверждение покупки
                                </h2>
                                <button
                                    onClick={onClose}
                                    className="text-gray-400 hover:text-gray-600 transition p-2 hover:bg-gray-100 rounded-full"
                                >
                                    <XIcon className="w-6 h-6" />
                                </button>
                            </div>

                            <div className="mb-6">
                                <h3 className="font-semibold text-lg mb-2">
                                    {lesson_type?.name}
                                </h3>
                                <p className="text-gray-600 mb-4">
                                    {lessonsCount} занятий · {daysCount} дней
                                </p>

                                <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Стоимость:</span>
                                        <span className="font-semibold">{price} ₽</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Цена за занятие:</span>
                                        <span className="font-semibold">{(price / lessonsCount).toFixed(0)} ₽</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Срок действия:</span>
                                        <span className="font-semibold">{daysCount} дней</span>
                                    </div>
                                </div>

                                <div className="mt-4 p-3 bg-blue-50 rounded-lg text-sm text-blue-700">
                                    💡 После покупки абонемент появится в разделе "Мои абонементы"
                                </div>
                            </div>

                            <div className="flex space-x-3">
                                <button
                                    onClick={onClose}
                                    className="flex-1 btn-secondary py-3"
                                >
                                    Отмена
                                </button>
                                <button
                                    onClick={handleBuy}
                                    disabled={loading}
                                    className="flex-1 btn-primary py-3 disabled:opacity-50"
                                >
                                    {loading ? 'Покупка...' : 'Подтвердить'}
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default BuyMembershipModal;