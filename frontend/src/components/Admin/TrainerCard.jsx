import React, { useState } from 'react';
import { PencilIcon, TrashIcon, CheckIcon, XIcon } from '@heroicons/react/outline';
import TrainerPhotoUpload from './TrainerPhotoUpload';
import toast from 'react-hot-toast';

const TrainerCard = ({ trainer, onDelete, onUpdate }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [editForm, setEditForm] = useState({
        name: trainer.name || '',
        specialization: trainer.specialization || '',
        description: trainer.description || ''
    });

    const handleSaveEdit = async () => {
        if (!editForm.name.trim()) {
            toast.error('Имя не может быть пустым');
            return;
        }

        try {
            // Сохраняем текущее фото
            const updateData = {
                ...editForm,
                photo: trainer.photo  // Добавляем текущее фото в данные для обновления
            };

            await onUpdate(trainer.id, updateData);
            toast.success('Данные обновлены');
            setIsEditing(false);
        } catch (error) {
            console.error('Ошибка обновления:', error);
            const errorMessage = error.response?.data?.detail || 'Не удалось обновить данные';
            toast.error(errorMessage);
        }
    };

    const handleCancelEdit = () => {
        setEditForm({
            name: trainer.name || '',
            specialization: trainer.specialization || '',
            description: trainer.description || ''
        });
        setIsEditing(false);
    };

    const handleDelete = async () => {
        if (!window.confirm(`Вы уверены, что хотите удалить тренера ${trainer.name}?`)) {
            return;
        }

        setDeleting(true);
        try {
            await onDelete(trainer.id);
            // Не показываем toast здесь, так как это сделает родительский компонент
        } catch (error) {
            console.error('Ошибка при удалении:', error);
            const errorMessage = error.response?.data?.detail || 'Не удалось удалить тренера';
            toast.error(errorMessage);
        } finally {
            setDeleting(false);
        }
    };

    const handlePhotoUpdate = (photoUrl) => {
        // Обновляем фото в карточке
        trainer.photo = photoUrl;
    };

    // Формируем полный URL для фото
    const getFullImageUrl = (url) => {
        if (!url) return null;
        if (url.startsWith('http')) return url;
        return `http://localhost:8000${url}`;
    };

    return (
        <div className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition-all duration-300">
            <div className="p-6">
                {/* Компонент загрузки фото */}
                <TrainerPhotoUpload trainer={trainer} onPhotoUpdate={handlePhotoUpdate} />

                {isEditing ? (
                    // Режим редактирования
                    <div className="mt-4 space-y-3">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Имя *
                            </label>
                            <input
                                type="text"
                                value={editForm.name}
                                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                                className="input-field text-center font-semibold"
                                placeholder="Имя тренера"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Специализация
                            </label>
                            <input
                                type="text"
                                value={editForm.specialization}
                                onChange={(e) => setEditForm({ ...editForm, specialization: e.target.value })}
                                className="input-field text-center text-sm"
                                placeholder="Фитнес, растяжка, пилатес"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Описание
                            </label>
                            <textarea
                                value={editForm.description}
                                onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                                className="input-field text-sm"
                                rows="3"
                                placeholder="Опыт работы, достижения, специализация..."
                            />
                        </div>

                        <div className="flex space-x-2">
                            <button
                                onClick={handleSaveEdit}
                                className="flex-1 bg-green-500 text-white py-2 rounded-lg hover:bg-green-600 transition flex items-center justify-center"
                            >
                                <CheckIcon className="w-5 h-5 mr-1" />
                                Сохранить
                            </button>
                            <button
                                onClick={handleCancelEdit}
                                className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg hover:bg-gray-300 transition flex items-center justify-center"
                            >
                                <XIcon className="w-5 h-5 mr-1" />
                                Отмена
                            </button>
                        </div>
                    </div>
                ) : (
                    // Режим просмотра
                    <>
                        <h3 className="mt-4 text-xl font-bold text-gray-900 text-center">
                            {trainer.name}
                        </h3>

                        {trainer.specialization && (
                            <p className="text-primary-600 text-center text-sm mb-2">
                                {trainer.specialization}
                            </p>
                        )}

                        {trainer.description && (
                            <p className="text-gray-600 text-sm text-center mb-4 line-clamp-3">
                                {trainer.description}
                            </p>
                        )}

                        <div className="flex justify-center space-x-2">
                            <button
                                onClick={() => setIsEditing(true)}
                                className="p-2 text-gray-600 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition"
                                title="Редактировать"
                                disabled={deleting}
                            >
                                <PencilIcon className="w-5 h-5" />
                            </button>
                            <button
                                onClick={handleDelete}
                                className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                                title="Удалить"
                                disabled={deleting}
                            >
                                {deleting ? (
                                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-red-600"></div>
                                ) : (
                                    <TrashIcon className="w-5 h-5" />
                                )}
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default TrainerCard;