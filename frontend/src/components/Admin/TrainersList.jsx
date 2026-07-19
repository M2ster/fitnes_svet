import React, { useState, useEffect } from 'react';
import { admin } from '../../services/api';
import TrainerCard from './TrainerCard';
import { PlusIcon, RefreshIcon } from '@heroicons/react/outline';
import toast from 'react-hot-toast';

const TrainersList = () => {
    const [trainers, setTrainers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showAddForm, setShowAddForm] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [newTrainer, setNewTrainer] = useState({
        name: '',
        specialization: '',
        description: ''
    });

    useEffect(() => {
        loadTrainers();
    }, []);

    const loadTrainers = async () => {
        try {
            setLoading(true);
            console.log('Загрузка списка тренеров...');
            const response = await admin.getTrainers();
            console.log('Тренеры загружены:', response.data);
            setTrainers(response.data || []);
        } catch (error) {
            console.error('Ошибка загрузки тренеров:', error);
            toast.error('Не удалось загрузить список тренеров');
            setTrainers([]);
        } finally {
            setLoading(false);
        }
    };

    const handleAddTrainer = async () => {
        if (!newTrainer.name.trim()) {
            toast.error('Введите имя тренера');
            return;
        }

        setSubmitting(true);
        try {
            console.log('Создание нового тренера:', newTrainer);
            const response = await admin.createTrainer(newTrainer);
            console.log('Тренер создан:', response.data);

            toast.success('Тренер успешно добавлен');
            setShowAddForm(false);
            setNewTrainer({ name: '', specialization: '', description: '' });
            loadTrainers(); // Перезагружаем список
        } catch (error) {
            console.error('Ошибка добавления тренера:', error);
            const errorMessage = error.response?.data?.detail || 'Не удалось добавить тренера';
            toast.error(errorMessage);
        } finally {
            setSubmitting(false);
        }
    };

    const handleUpdateTrainer = async (trainerId, data) => {
        try {
            console.log('Обновление тренера:', trainerId, data);
            const response = await admin.updateTrainer(trainerId, data);
            console.log('Тренер обновлен:', response.data);

            toast.success('Данные тренера обновлены');
            loadTrainers(); // Перезагружаем список
            return response.data;
        } catch (error) {
            console.error('Ошибка обновления тренера:', error);
            const errorMessage = error.response?.data?.detail || 'Не удалось обновить данные';
            toast.error(errorMessage);
            throw error; // Пробрасываем ошибку для обработки в карточке
        }
    };

    const handleDeleteTrainer = async (trainerId) => {
        try {
            console.log('Удаление тренера:', trainerId);
            const response = await admin.deleteTrainer(trainerId);
            console.log('Тренер удален:', response.data);

            toast.success('Тренер успешно удален');
            loadTrainers(); // Перезагружаем список
            return response.data;
        } catch (error) {
            console.error('Ошибка удаления тренера:', error);
            const errorMessage = error.response?.data?.detail || 'Не удалось удалить тренера';
            toast.error(errorMessage);
            throw error; // Пробрасываем ошибку для обработки в карточке
        }
    };

    return (
        <div className="space-y-6">
            {/* Заголовок и кнопки */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <h2 className="text-2xl font-bold text-gray-900">Управление тренерами</h2>
                <div className="flex space-x-2">
                    <button
                        onClick={loadTrainers}
                        className="btn-secondary flex items-center px-4 py-2"
                        title="Обновить список"
                        disabled={loading}
                    >
                        <RefreshIcon className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
                    </button>
                    <button
                        onClick={() => setShowAddForm(true)}
                        className="btn-primary flex items-center px-4 py-2"
                        disabled={loading}
                    >
                        <PlusIcon className="w-5 h-5 mr-2" />
                        Добавить тренера
                    </button>
                </div>
            </div>

            {/* Форма добавления нового тренера */}
            {showAddForm && (
                <div className="bg-white rounded-xl shadow-md p-6 border-2 border-primary-100">
                    <h3 className="text-lg font-semibold mb-4 text-primary-800">Новый тренер</h3>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Имя <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                value={newTrainer.name}
                                onChange={(e) => setNewTrainer({ ...newTrainer, name: e.target.value })}
                                className="input-field"
                                placeholder="Иванов Иван"
                                disabled={submitting}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Специализация
                            </label>
                            <input
                                type="text"
                                value={newTrainer.specialization}
                                onChange={(e) => setNewTrainer({ ...newTrainer, specialization: e.target.value })}
                                className="input-field"
                                placeholder="Фитнес, растяжка, пилатес"
                                disabled={submitting}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Описание
                            </label>
                            <textarea
                                value={newTrainer.description}
                                onChange={(e) => setNewTrainer({ ...newTrainer, description: e.target.value })}
                                className="input-field"
                                rows="3"
                                placeholder="Опыт работы, достижения, специализация..."
                                disabled={submitting}
                            />
                        </div>

                        <div className="flex space-x-3 pt-2">
                            <button
                                onClick={handleAddTrainer}
                                disabled={submitting || !newTrainer.name.trim()}
                                className="flex-1 btn-primary py-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {submitting ? (
                                    <div className="flex items-center justify-center">
                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                        Сохранение...
                                    </div>
                                ) : 'Сохранить'}
                            </button>
                            <button
                                onClick={() => {
                                    setShowAddForm(false);
                                    setNewTrainer({ name: '', specialization: '', description: '' });
                                }}
                                className="flex-1 btn-secondary py-2"
                                disabled={submitting}
                            >
                                Отмена
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Список тренеров */}
            {loading ? (
                <div className="flex justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                </div>
            ) : trainers.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-xl shadow">
                    <div className="text-gray-400 mb-3">
                        <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                        </svg>
                    </div>
                    <p className="text-gray-500 text-lg mb-4">Тренеры не найдены</p>
                    <button
                        onClick={() => setShowAddForm(true)}
                        className="btn-primary inline-flex items-center"
                    >
                        <PlusIcon className="w-5 h-5 mr-2" />
                        Добавить первого тренера
                    </button>
                </div>
            ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {trainers.map((trainer) => (
                        <TrainerCard
                            key={trainer.id}
                            trainer={trainer}
                            onDelete={handleDeleteTrainer}
                            onUpdate={handleUpdateTrainer}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

export default TrainersList;