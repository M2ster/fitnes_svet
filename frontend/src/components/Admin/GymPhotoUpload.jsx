import React, { useState } from 'react';
import { CameraIcon, XCircleIcon, PhotographIcon } from '@heroicons/react/outline';
import { upload } from '../../services/api';
import toast from 'react-hot-toast';

const GymPhotoUpload = ({ gym, onPhotoUpdate }) => {
    const [uploading, setUploading] = useState(false);
    const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

    const getFullImageUrl = (url) => {
        if (!url) return null;
        if (url.startsWith('http')) return url;
        return `${API_URL}${url}`;
    };

    const handleFileChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (file.size > 5 * 1024 * 1024) {
            toast.error('Файл слишком большой. Максимальный размер 5MB');
            return;
        }

        if (!file.type.startsWith('image/')) {
            toast.error('Пожалуйста, выберите изображение');
            return;
        }

        setUploading(true);
        try {
            const response = await upload.gymPhoto(gym.id, file);

            if (response.data.success) {
                toast.success('Фото успешно загружено');
                if (onPhotoUpdate) {
                    onPhotoUpdate(response.data.photo_url);
                }
            }
        } catch (error) {
            console.error('Ошибка загрузки фото:', error);
            toast.error('Не удалось загрузить фото');
        } finally {
            setUploading(false);
        }
    };

    const handleDeletePhoto = async () => {
        if (!window.confirm('Удалить фото зала?')) return;

        setUploading(true);
        try {
            // Здесь должен быть эндпоинт для удаления фото зала
            // Если его нет, пока просто обновляем локально
            if (onPhotoUpdate) {
                onPhotoUpdate(null);
            }
            toast.success('Фото удалено');
        } catch (error) {
            console.error('Ошибка удаления фото:', error);
            toast.error('Не удалось удалить фото');
        } finally {
            setUploading(false);
        }
    };

    const photoUrl = getFullImageUrl(gym.photo);

    return (
        <div className="relative group h-48 bg-gray-100">
            {photoUrl ? (
                <img
                    src={photoUrl}
                    alt={gym.name}
                    className="w-full h-full object-cover"
                />
            ) : (
                <div className="w-full h-full flex items-center justify-center bg-gray-200">
                    <PhotographIcon className="w-12 h-12 text-gray-400" />
                </div>
            )}

            {/* Кнопка загрузки при наведении */}
            <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity">
                <label className="cursor-pointer p-2 bg-white rounded-full hover:bg-gray-100 transition">
                    <CameraIcon className="w-6 h-6 text-gray-700" />
                    <input
                        type="file"
                        className="hidden"
                        accept="image/*"
                        onChange={handleFileChange}
                        disabled={uploading}
                    />
                </label>

                {photoUrl && (
                    <button
                        onClick={handleDeletePhoto}
                        className="ml-2 p-2 bg-white rounded-full hover:bg-red-100 transition"
                        disabled={uploading}
                    >
                        <XCircleIcon className="w-6 h-6 text-red-600" />
                    </button>
                )}
            </div>

            {/* Индикатор загрузки */}
            {uploading && (
                <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                </div>
            )}
        </div>
    );
};

export default GymPhotoUpload;