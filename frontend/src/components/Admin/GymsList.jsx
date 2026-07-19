import React, { useState, useEffect } from 'react';
import { admin } from '../../services/api';
import GymPhotoUpload from './GymPhotoUpload';
import { PlusIcon, RefreshIcon, PencilIcon, TrashIcon, PhotographIcon } from '@heroicons/react/outline';
import toast from 'react-hot-toast';

const GymsList = () => {
    const [gyms, setGyms] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showAddForm, setShowAddForm] = useState(false);
    const [editingGym, setEditingGym] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        description: ''
    });

    useEffect(() => {
        loadGyms();
    }, []);

    const loadGyms = async () => {
        try {
            setLoading(true);
            const response = await admin.getGyms();
            setGyms(response.data || []);
        } catch (error) {
            console.error('Ошибка загрузки залов:', error);
            toast.error('Не удалось загрузить список залов');
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.name.trim()) {
            toast.error('Введите название зала');
            return;
        }

        try {
            if (editingGym) {
                await admin.updateGym(editingGym.id, formData);
                toast.success('Зал обновлен');
            } else {
                await admin.createGym(formData);
                toast.success('Зал создан');
            }

            setShowAddForm(false);
            setEditingGym(null);
            setFormData({ name: '', description: '' });
            loadGyms();
        } catch (error) {
            console.error('Ошибка сохранения:', error);
            toast.error('Не удалось сохранить зал');
        }
    };

    const handleEdit = (gym) => {
        setEditingGym(gym);
        setFormData({
            name: gym.name,
            description: gym.description || ''
        });
        setShowAddForm(true);
    };

    const handleDelete = async (gymId) => {
        if (!window.confirm('Вы уверены, что хотите удалить этот зал?')) {
            return;
        }

        try {
            await admin.deleteGym(gymId);
            toast.success('Зал удален');
            loadGyms();
        } catch (error) {
            console.error('Ошибка удаления:', error);
            toast.error('Не удалось удалить зал');
        }
    };

    const handleCancel = () => {
        setShowAddForm(false);
        setEditingGym(null);
        setFormData({ name: '', description: '' });
    };

    const handlePhotoUpdate = (gymId, photoUrl) => {
        setGyms(prev => prev.map(g =>
            g.id === gymId ? { ...g, photo: photoUrl } : g
        ));
    };

    return (
        <div className="space-y-6">
            {/* Заголовок и кнопки */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <h2 className="text-2xl font-bold text-gray-900">Управление залами</h2>
                <div className="flex space-x-2">
                    <button
                        onClick={loadGyms}
                        className="btn-secondary flex items-center px-4 py-2"
                        title="Обновить список"
                        disabled={loading}
                    >
                        <RefreshIcon className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
                    </button>
                    <button
                        onClick={() => {
                            setEditingGym(null);
                            setFormData({ name: '', description: '' });
                            setShowAddForm(true);
                        }}
                        className="btn-primary flex items-center px-4 py-2"
                        disabled={loading}
                    >
                        <PlusIcon className="w-5 h-5 mr-2" />
                        Добавить зал
                    </button>
                </div>
            </div>

            {/* Форма добавления/редактирования */}
            {showAddForm && (
                <div className="bg-white rounded-xl shadow-md p-6 border-2 border-primary-100">
                    <h3 className="text-lg font-semibold mb-4 text-primary-800">
                        {editingGym ? 'Редактирование зала' : 'Новый зал'}
                    </h3>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Название зала <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                name="name"
                                value={formData.name}
                                onChange={handleInputChange}
                                className="input-field"
                                placeholder="Основной зал"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Описание
                            </label>
                            <textarea
                                name="description"
                                value={formData.description}
                                onChange={handleInputChange}
                                className="input-field"
                                rows="3"
                                placeholder="Описание зала, оборудование, особенности..."
                            />
                        </div>

                        <div className="flex space-x-3 pt-2">
                            <button
                                type="submit"
                                className="flex-1 btn-primary py-2"
                            >
                                {editingGym ? 'Сохранить' : 'Создать'}
                            </button>
                            <button
                                type="button"
                                onClick={handleCancel}
                                className="flex-1 btn-secondary py-2"
                            >
                                Отмена
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Список залов */}
            {loading ? (
                <div className="flex justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                </div>
            ) : gyms.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-xl shadow">
                    <PhotographIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500 text-lg mb-4">Залы не найдены</p>
                    <button
                        onClick={() => {
                            setEditingGym(null);
                            setFormData({ name: '', description: '' });
                            setShowAddForm(true);
                        }}
                        className="btn-primary inline-flex items-center"
                    >
                        <PlusIcon className="w-5 h-5 mr-2" />
                        Добавить первый зал
                    </button>
                </div>
            ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {gyms.map((gym) => (
                        <div key={gym.id} className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition">
                            <GymPhotoUpload
                                gym={gym}
                                onPhotoUpdate={(url) => handlePhotoUpdate(gym.id, url)}
                            />
                            <div className="p-6">
                                <h3 className="text-xl font-bold text-gray-900 mb-2">{gym.name}</h3>
                                {gym.description && (
                                    <p className="text-gray-600 text-sm mb-4 line-clamp-2">{gym.description}</p>
                                )}
                                <div className="flex justify-end space-x-2">
                                    <button
                                        onClick={() => handleEdit(gym)}
                                        className="p-2 text-gray-600 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition"
                                        title="Редактировать"
                                    >
                                        <PencilIcon className="w-5 h-5" />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(gym.id)}
                                        className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                                        title="Удалить"
                                    >
                                        <TrashIcon className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default GymsList;