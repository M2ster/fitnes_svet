import React, { useState, useEffect } from 'react';
import { XIcon, CheckCircleIcon } from '@heroicons/react/outline';
import { admin } from '../../services/api';
import toast from 'react-hot-toast';

const CreateTemplateModal = ({ template, onClose, onSuccess }) => {
    const [lessonTypes, setLessonTypes] = useState([]);
    const [trainers, setTrainers] = useState([]);
    const [gyms, setGyms] = useState([]);
    const [loading, setLoading] = useState(false);
    const [loadingData, setLoadingData] = useState(true);
    const [success, setSuccess] = useState(false);

    const [formData, setFormData] = useState({
        type_lesson_id: template?.type_lesson_id || '',
        trainer_id: template?.trainer_id || '',
        gym_id: template?.gym_id || '',
        weekday: template?.weekday || '0',
        start_time: template?.start_time || '09:00',
        duration: template?.duration || 60,
        is_active: template?.is_active !== undefined ? template.is_active : true
    });

    const isEditing = !!template;
    const weekdays = [
        'Понедельник',
        'Вторник',
        'Среда',
        'Четверг',
        'Пятница',
        'Суббота',
        'Воскресенье'
    ];

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoadingData(true);

            // Загружаем все необходимые данные
            const [typesRes, trainersRes, gymsRes] = await Promise.all([
                admin.getLessonTypes(),
                admin.getTrainers(),
                admin.getGyms()
            ]);

            setLessonTypes(typesRes.data || []);
            setTrainers(trainersRes.data || []);
            setGyms(gymsRes.data || []);

        } catch (error) {
            console.error('Ошибка загрузки данных:', error);
            toast.error('Не удалось загрузить данные для формы');
        } finally {
            setLoadingData(false);
        }
    };

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Валидация
        if (!formData.type_lesson_id) {
            toast.error('Выберите тип занятия');
            return;
        }
        if (!formData.trainer_id) {
            toast.error('Выберите тренера');
            return;
        }
        if (!formData.gym_id) {
            toast.error('Выберите зал');
            return;
        }

        setLoading(true);
        try {
            const submitData = {
                type_lesson_id: parseInt(formData.type_lesson_id),
                trainer_id: parseInt(formData.trainer_id),
                gym_id: parseInt(formData.gym_id),
                weekday: parseInt(formData.weekday),
                start_time: formData.start_time,
                duration: parseInt(formData.duration),
                is_active: formData.is_active
            };

            console.log('Отправка данных:', submitData);

            let response;
            if (isEditing) {
                response = await admin.updateScheduleTemplate(template.id, submitData);
                toast.success('Шаблон обновлен');
            } else {
                response = await admin.createScheduleTemplate(submitData);
                toast.success('Шаблон создан');
            }

            console.log('Ответ:', response.data);
            setSuccess(true);

            setTimeout(() => {
                onSuccess();
            }, 1500);

        } catch (error) {
            console.error('Ошибка:', error);
            const errorMessage = error.response?.data?.detail || 'Не удалось сохранить шаблон';
            toast.error(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-none max-w-lg w-full max-h-[90vh] overflow-y-auto border border-[#E8DDD2]">
                {success ? (
                    // Экран успеха
                    <div className="p-8 text-center">
                        <div className="w-20 h-20 bg-green-100 rounded-none flex items-center justify-center mx-auto mb-4">
                            <CheckCircleIcon className="w-10 h-10 text-green-500" />
                        </div>
                        <h3 className="font-serif text-2xl font-bold text-[#2C1810] mb-2">
                            {isEditing ? 'Шаблон обновлен!' : 'Шаблон создан!'}
                        </h3>
                        <p className="text-[#6B4F3A] mb-6">
                            {isEditing
                                ? 'Изменения успешно сохранены'
                                : 'Новый шаблон добавлен в расписание'}
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
                        <div className="sticky top-0 bg-white border-b border-[#E8DDD2] p-6">
                            <div className="flex justify-between items-center">
                                <h2 className="font-serif text-2xl font-bold text-[#2C1810]">
                                    {isEditing ? 'Редактирование шаблона' : 'Новый шаблон'}
                                </h2>
                                <button
                                    onClick={onClose}
                                    className="text-[#A5896C] hover:text-[#6B4F3A] transition p-2 hover:bg-[#F5F0E9] rounded-none"
                                >
                                    <XIcon className="w-6 h-6" />
                                </button>
                            </div>
                        </div>

                        {/* Форма */}
                        <div className="p-6">
                            {loadingData ? (
                                <div className="flex justify-center py-8">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#8B6B4D]"></div>
                                </div>
                            ) : (
                                <form onSubmit={handleSubmit} className="space-y-4">
                                    {/* Тип занятия */}
                                    <div>
                                        <label className="block text-sm font-medium text-[#6B4F3A] mb-1">
                                            Тип занятия *
                                        </label>
                                        <select
                                            name="type_lesson_id"
                                            value={formData.type_lesson_id}
                                            onChange={handleChange}
                                            className="input-field"
                                            required
                                        >
                                            <option value="">Выберите тип занятия</option>
                                            {lessonTypes.map(type => (
                                                <option key={type.id} value={type.id}>
                                                    {type.name} (вместимость: {type.capacity})
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* Тренер */}
                                    <div>
                                        <label className="block text-sm font-medium text-[#6B4F3A] mb-1">
                                            Тренер *
                                        </label>
                                        <select
                                            name="trainer_id"
                                            value={formData.trainer_id}
                                            onChange={handleChange}
                                            className="input-field"
                                            required
                                        >
                                            <option value="">Выберите тренера</option>
                                            {trainers.map(trainer => (
                                                <option key={trainer.id} value={trainer.id}>
                                                    {trainer.name} - {trainer.specialization}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* Зал */}
                                    <div>
                                        <label className="block text-sm font-medium text-[#6B4F3A] mb-1">
                                            Зал *
                                        </label>
                                        <select
                                            name="gym_id"
                                            value={formData.gym_id}
                                            onChange={handleChange}
                                            className="input-field"
                                            required
                                        >
                                            <option value="">Выберите зал</option>
                                            {gyms.map(gym => (
                                                <option key={gym.id} value={gym.id}>
                                                    {gym.name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* День недели */}
                                    <div>
                                        <label className="block text-sm font-medium text-[#6B4F3A] mb-1">
                                            День недели *
                                        </label>
                                        <select
                                            name="weekday"
                                            value={formData.weekday}
                                            onChange={handleChange}
                                            className="input-field"
                                        >
                                            {weekdays.map((day, index) => (
                                                <option key={index} value={index}>
                                                    {day}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* Время начала */}
                                    <div>
                                        <label className="block text-sm font-medium text-[#6B4F3A] mb-1">
                                            Время начала *
                                        </label>
                                        <input
                                            type="time"
                                            name="start_time"
                                            value={formData.start_time}
                                            onChange={handleChange}
                                            className="input-field"
                                            required
                                        />
                                    </div>

                                    {/* Длительность */}
                                    <div>
                                        <label className="block text-sm font-medium text-[#6B4F3A] mb-1">
                                            Длительность (минут)
                                        </label>
                                        <select
                                            name="duration"
                                            value={formData.duration}
                                            onChange={handleChange}
                                            className="input-field"
                                        >
                                            <option value="45">45 минут</option>
                                            <option value="60">60 минут</option>
                                            <option value="90">90 минут</option>
                                            <option value="120">120 минут</option>
                                        </select>
                                    </div>

                                    {/* Активен */}
                                    <div className="flex items-center">
                                        <input
                                            type="checkbox"
                                            name="is_active"
                                            id="is_active"
                                            checked={formData.is_active}
                                            onChange={handleChange}
                                            className="h-4 w-4 text-[#8B6B4D] focus:ring-[#8B6B4D] border-[#D4C5B5] rounded-none"
                                        />
                                        <label htmlFor="is_active" className="ml-2 block text-sm text-[#6B4F3A]">
                                            Шаблон активен
                                        </label>
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

export default CreateTemplateModal;