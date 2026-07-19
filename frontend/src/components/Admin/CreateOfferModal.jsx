import React, { useState, useEffect } from 'react';
import { XIcon, CheckCircleIcon } from '@heroicons/react/outline';
import { admin } from '../../services/api';
import toast from 'react-hot-toast';

const CreateOfferModal = ({ offer, onClose, onSuccess }) => {
    const [lessonTypes, setLessonTypes] = useState([]);
    const [lessonCounts, setLessonCounts] = useState([]);
    const [validDays, setValidDays] = useState([]);
    const [loading, setLoading] = useState(false);
    const [loadingData, setLoadingData] = useState(true);
    const [success, setSuccess] = useState(false);
    const [formData, setFormData] = useState({
        type_membership_id: offer?.type_membership_id || '',
        lesson_count_id: offer?.lesson_count_id || '',
        valid_days_id: offer?.valid_days_id || '',
        price: offer?.price || ''
    });

    const isEditing = !!offer;

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoadingData(true);

            // Загружаем типы занятий
            const typesResponse = await admin.getLessonTypes();
            setLessonTypes(typesResponse.data);

            // Загружаем доступные количества занятий
            try {
                const countsResponse = await admin.getLessonCounts();
                setLessonCounts(countsResponse.data);
            } catch (error) {
                console.log('Используем стандартные варианты количества занятий');
                setLessonCounts([
                    { id: 1, count: 4 },
                    { id: 2, count: 8 },
                    { id: 3, count: 12 },
                    { id: 4, count: 15 }
                ]);
            }

            // Загружаем доступные сроки действия
            try {
                const daysResponse = await admin.getValidDays();
                setValidDays(daysResponse.data);
            } catch (error) {
                console.log('Используем стандартные варианты сроков действия');
                setValidDays([
                    { id: 1, count_day: 35 },
                    { id: 2, count_day: 35 },
                    { id: 3, count_day: 45 },
                    { id: 4, count_day: 45 }
                ]);
            }

        } catch (error) {
            console.error('Ошибка загрузки данных:', error);
            toast.error('Не удалось загрузить данные');

            // В случае ошибки используем стандартные варианты
            setLessonCounts([
                { id: 1, count: 4 },
                { id: 2, count: 8 },
                { id: 3, count: 12 },
                { id: 4, count: 15 }
            ]);

            setValidDays([
                { id: 1, count_day: 35 },
                { id: 2, count_day: 35 },
                { id: 3, count_day: 45 },
                { id: 4, count_day: 45 }
            ]);
        } finally {
            setLoadingData(false);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.type_membership_id) {
            toast.error('Выберите тип занятия');
            return;
        }
        if (!formData.lesson_count_id) {
            toast.error('Выберите количество занятий');
            return;
        }
        if (!formData.valid_days_id) {
            toast.error('Выберите срок действия');
            return;
        }

        // Проверяем только что цена не отрицательная
        if (formData.price && parseFloat(formData.price) < 0) {
            toast.error('Цена не может быть отрицательной');
            return;
        }

        setLoading(true);
        try {
            // Преобразуем строки в числа
            const submitData = {
                type_membership_id: parseInt(formData.type_membership_id),
                lesson_count_id: parseInt(formData.lesson_count_id),
                valid_days_id: parseInt(formData.valid_days_id),
                price: formData.price ? parseFloat(formData.price) : 0
            };

            console.log('Отправка данных на сервер:', submitData);

            let response;
            if (isEditing) {
                response = await admin.updateMembershipOffer(offer.id, submitData);
                toast.success('Тип абонемента обновлен');
            } else {
                response = await admin.createMembershipOffer(submitData);
                toast.success('Тип абонемента создан');
            }

            console.log('Ответ сервера:', response.data);

            setSuccess(true);

            setTimeout(() => {
                onSuccess();
            }, 1500);
        } catch (error) {
            console.error('Ошибка:', error);

            if (error.response) {
                toast.error(error.response.data.detail || 'Ошибка сервера');
            } else if (error.request) {
                toast.error('Сервер не отвечает');
            } else {
                toast.error('Ошибка при отправке запроса');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
                {success ? (
                    // Экран успеха
                    <div className="p-8 text-center">
                        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <CheckCircleIcon className="w-10 h-10 text-green-500" />
                        </div>
                        <h3 className="text-2xl font-bold text-gray-900 mb-2">
                            {isEditing ? 'Тип абонемента обновлен!' : 'Тип абонемента создан!'}
                        </h3>
                        <p className="text-gray-600 mb-6">
                            {isEditing
                                ? 'Изменения успешно сохранены'
                                : 'Новый тип абонемента успешно добавлен в систему'}
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
                                <h2 className="text-2xl font-bold text-gray-900">
                                    {isEditing ? 'Редактирование типа абонемента' : 'Новый тип абонемента'}
                                </h2>
                                <button
                                    onClick={onClose}
                                    className="text-gray-400 hover:text-gray-600 transition p-2 hover:bg-gray-100 rounded-full"
                                >
                                    <XIcon className="w-6 h-6" />
                                </button>
                            </div>
                        </div>

                        {/* Форма */}
                        <div className="p-6">
                            {loadingData ? (
                                <div className="flex justify-center py-8">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                                </div>
                            ) : (
                                <form onSubmit={handleSubmit} className="space-y-6">
                                    {/* Тип занятия */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Тип занятия <span className="text-red-500">*</span>
                                        </label>
                                        <select
                                            name="type_membership_id"
                                            value={formData.type_membership_id}
                                            onChange={handleChange}
                                            className="input-field"
                                            required
                                        >
                                            <option value="">Выберите тип занятия</option>
                                            {lessonTypes.map(type => (
                                                <option key={type.id} value={type.id}>
                                                    {type.name} (вместимость: {type.capacity} чел)
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* Количество занятий */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Количество занятий <span className="text-red-500">*</span>
                                        </label>
                                        <select
                                            name="lesson_count_id"
                                            value={formData.lesson_count_id}
                                            onChange={handleChange}
                                            className="input-field"
                                            required
                                        >
                                            <option value="">Выберите количество</option>
                                            {lessonCounts.map(item => (
                                                <option key={item.id} value={item.id}>
                                                    {item.count} занятий
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* Срок действия */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Срок действия <span className="text-red-500">*</span>
                                        </label>
                                        <select
                                            name="valid_days_id"
                                            value={formData.valid_days_id}
                                            onChange={handleChange}
                                            className="input-field"
                                            required
                                        >
                                            <option value="">Выберите срок</option>
                                            {validDays.map(item => (
                                                <option key={item.id} value={item.id}>
                                                    {item.count_day} дней
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* Цена */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Цена (₽) <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="number"
                                            name="price"
                                            value={formData.price}
                                            onChange={handleChange}
                                            className="input-field"
                                            placeholder="Введите цену"
                                            step="any"
                                            required
                                        />
                                        <p className="text-xs text-gray-500 mt-1">
                                            Можно ввести любую цену (например: 2990, 3500.50, 0 - бесплатно)
                                        </p>
                                    </div>

                                    {/* Информация */}
                                    <div className="bg-blue-50 rounded-lg p-4">
                                        <h4 className="font-medium text-blue-800 mb-2">Информация:</h4>
                                        <p className="text-sm text-blue-700">
                                            {isEditing
                                                ? 'После сохранения изменения будут доступны пользователям при покупке абонементов.'
                                                : 'После создания тип абонемента появится в списке доступных для покупки пользователями.'}
                                        </p>
                                    </div>

                                    {/* Кнопки */}
                                    <div className="flex space-x-3 pt-4">
                                        <button
                                            type="button"
                                            onClick={onClose}
                                            className="flex-1 btn-secondary py-3"
                                        >
                                            Отмена
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={loading}
                                            className="flex-1 btn-primary py-3 disabled:opacity-50"
                                        >
                                            {loading ? (
                                                <div className="flex items-center justify-center">
                                                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                                                    Сохранение...
                                                </div>
                                            ) : (isEditing ? 'Сохранить' : 'Создать')}
                                        </button>
                                    </div>
                                </form>
                            )}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default CreateOfferModal;