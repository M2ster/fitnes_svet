import React, { useState } from 'react';
import { CameraIcon, XCircleIcon } from '@heroicons/react/outline';
import { upload } from '../../services/api';
import TrainerPhoto from '../UI/TrainerPhoto';
import toast from 'react-hot-toast';

const TrainerPhotoUpload = ({ trainer, onPhotoUpdate }) => {
    const [uploading, setUploading] = useState(false);

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
            const response = await upload.trainerPhoto(trainer.id, file);
            console.log('Ответ сервера:', response.data);

            if (response.data.success) {
                toast.success('Фото успешно загружено');
                if (onPhotoUpdate) {
                    onPhotoUpdate(response.data.photo_url);
                }
            } else {
                throw new Error('Ошибка загрузки');
            }
        } catch (error) {
            console.error('Ошибка загрузки фото:', error);
            toast.error('Не удалось загрузить фото');
        } finally {
            setUploading(false);
        }
    };

    const handleDeletePhoto = async () => {
        if (!window.confirm('Удалить фото?')) return;

        setUploading(true);
        try {
            const response = await upload.deleteTrainerPhoto(trainer.id);
            console.log('Ответ сервера:', response.data);

            if (response.data.success) {
                trainer.photo = null;
                toast.success('Фото удалено');
                if (onPhotoUpdate) {
                    onPhotoUpdate(null);
                }
            }
        } catch (error) {
            console.error('Ошибка удаления фото:', error);
            toast.error('Не удалось удалить фото');
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="flex flex-col items-center">
            <div className="relative group">
                {/* Фото */}
                <TrainerPhoto trainer={trainer} className="w-32 h-32 rounded-full border-4 border-white shadow-lg" />

                {/* Кнопка загрузки при наведении */}
                <label className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                    <CameraIcon className="w-8 h-8 text-white" />
                    <input
                        type="file"
                        className="hidden"
                        accept="image/*"
                        onChange={handleFileChange}
                        disabled={uploading}
                    />
                </label>

                {/* Кнопка удаления */}
                {trainer.photo && (
                    <button
                        onClick={handleDeletePhoto}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition shadow-lg"
                        disabled={uploading}
                        title="Удалить фото"
                    >
                        <XCircleIcon className="w-5 h-5" />
                    </button>
                )}
            </div>

            {/* Индикатор загрузки */}
            {uploading && (
                <div className="mt-2 text-sm text-[#8B6B4D] flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[#8B6B4D] mr-2"></div>
                    Загрузка...
                </div>
            )}

            <p className="mt-2 text-sm text-[#A5896C]">
                Нажмите на фото для загрузки (макс. 5MB)
            </p>
        </div>
    );
};

export default TrainerPhotoUpload;