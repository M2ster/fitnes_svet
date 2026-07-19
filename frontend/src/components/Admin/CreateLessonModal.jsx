import React, { useState, useEffect } from 'react';
import { XIcon, CalendarIcon, ClockIcon, UserIcon, MapIcon } from '@heroicons/react/outline';
import { admin } from '../../services/api';
import toast from 'react-hot-toast';

const CreateLessonModal = ({ onClose, onSuccess }) => {
    const [formData, setFormData] = useState({
        type_lesson_id: '',
        date_lesson: '',
        time_lesson: '09:00',
        gym_id: '',
        trainer_id: ''
    });
    const [lessonTypes, setLessonTypes] = useState([]);
    const [gyms, setGyms] = useState([]);
    const [trainers, setTrainers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [loadingData, setLoadingData] = useState(true);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoadingData(true);
            // Загружаем все необходимые данные
            const [typesRes, gymsRes, trainersRes] = await Promise.all([
                admin.getLessonTypes(),
                admin.getGyms(),
                admin.getTrainers()
            ]);

            setLessonTypes(typesRes.data || []);
            setGyms(gymsRes.data || []);
            setTrainers(trainersRes.data || []);
        } catch (error) {
            console.error('Ошибка загрузки данных:', error);
            toast.error('Не удалось загрузить данные для формы');
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

        // Валидация
        if (!formData.type_lesson_id) {
            toast.error('Выберите тип занятия');
            return;
        }
        if (!formData.date_lesson) {
            toast.error('Выберите дату');
            return;
        }
        if (!formData.gym_id) {
            toast.error('Выберите зал');
            return;
        }
        if (!formData.trainer_id) {
            toast.error('Выберите тренера');
            return;
        }

        setLoading(true);
        try {
            // Формируем дату и время
            const dateTimeStr = `${formData.date_lesson}T${formData.time_lesson}:00`;

            await admin.createLesson({
                type_lesson_id: parseInt(formData.type_lesson_id),
                date_lesson: dateTimeStr,
                gym_id: parseInt(formData.gym_id),
                trainer_id: parseInt(formData.trainer_id)
            });

            toast.success('Занятие успешно создано!');
            onSuccess();
        } catch (error) {
            console.error('Ошибка создания занятия:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
                {/* Заголовок */}
                <div className="sticky top-0 bg-white border-b border-gray-200 p-6">
                    <div className="flex justify-between items-center">
                        <h2 className="text-2xl font-bold text-gray-900">
                            Создание нового занятия
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
                                            {type.name} (до {type.capacity} чел)
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Дата и время */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Дата *
                                    </label>
                                    <div className="relative">
                                        <CalendarIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                                        <input
                                            type="date"
                                            name="date_lesson"
                                            value={formData.date_lesson}
                                            onChange={handleChange}
                                            className="input-field pl-10"
                                            min={new Date().toISOString().split('T')[0]}
                                            required
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Время *
                                    </label>
                                    <div className="relative">
                                        <ClockIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                                        <input
                                            type="time"
                                            name="time_lesson"
                                            value={formData.time_lesson}
                                            onChange={handleChange}
                                            className="input-field pl-10"
                                            required
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Зал */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
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

                            {/* Тренер */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
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
                                    {loading ? 'Создание...' : 'Создать занятие'}
                                </button>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
};

export default CreateLessonModal;