import React, { useState, useEffect } from 'react';
import { publicGyms } from '../services/api';
import { PhotographIcon, LocationMarkerIcon, InformationCircleIcon, XCircleIcon } from '@heroicons/react/outline';
import toast from 'react-hot-toast';
import { getFullImageUrl } from '../utils/imageHelper';

const GymsPage = () => {
    const [gyms, setGyms] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedGym, setSelectedGym] = useState(null);

    useEffect(() => {
        loadGyms();
    }, []);

    const loadGyms = async () => {
        try {
            setLoading(true);
            const response = await publicGyms.getAll();
            setGyms(response.data);
        } catch (error) {
            console.error('Ошибка загрузки залов:', error);
            toast.error('Не удалось загрузить информацию о залах');
        } finally {
            setLoading(false);
        }
    };

    const GymCard = ({ gym }) => {
        const photoUrl = getFullImageUrl(gym.photo);

        return (
            <div
                className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition-all duration-300 cursor-pointer"
                onClick={() => setSelectedGym(gym)}
            >
                <div className="h-48 bg-gray-200 relative">
                    {photoUrl ? (
                        <img
                            src={photoUrl}
                            alt={gym.name}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                                e.target.onerror = null;
                                e.target.src = '';
                                e.target.parentElement.innerHTML = `
                                    <div class="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary-100 to-primary-200">
                                        <svg class="w-16 h-16 text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                                        </svg>
                                    </div>
                                `;
                            }}
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary-100 to-primary-200">
                            <PhotographIcon className="w-16 h-16 text-primary-400" />
                        </div>
                    )}
                </div>
                <div className="p-6">
                    <h3 className="text-xl font-bold text-gray-900 mb-2 flex items-center">
                        <LocationMarkerIcon className="w-5 h-5 text-primary-500 mr-2" />
                        {gym.name}
                    </h3>
                    {gym.description && (
                        <p className="text-gray-600 text-sm line-clamp-2">{gym.description}</p>
                    )}
                    <button
                        className="mt-4 text-primary-600 font-medium hover:text-primary-700 transition flex items-center text-sm"
                        onClick={(e) => {
                            e.stopPropagation();
                            setSelectedGym(gym);
                        }}
                    >
                        <InformationCircleIcon className="w-4 h-4 mr-1" />
                        Подробнее о зале
                    </button>
                </div>
            </div>
        );
    };

    const GymModal = ({ gym, onClose }) => {
        const photoUrl = getFullImageUrl(gym.photo);

        return (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
                    <div className="relative">
                        {photoUrl ? (
                            <img
                                src={photoUrl}
                                alt={gym.name}
                                className="w-full h-64 object-cover"
                                onError={(e) => {
                                    e.target.onerror = null;
                                    e.target.src = '';
                                    e.target.parentElement.innerHTML = `
                                        <div class="w-full h-64 bg-gradient-to-br from-primary-100 to-primary-200 flex items-center justify-center">
                                            <svg class="w-24 h-24 text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                                            </svg>
                                        </div>
                                    `;
                                }}
                            />
                        ) : (
                            <div className="w-full h-64 bg-gradient-to-br from-primary-100 to-primary-200 flex items-center justify-center">
                                <PhotographIcon className="w-24 h-24 text-primary-400" />
                            </div>
                        )}
                        <button
                            onClick={onClose}
                            className="absolute top-4 right-4 bg-white rounded-full p-2 shadow-lg hover:bg-gray-100 transition"
                        >
                            <XCircleIcon className="w-6 h-6 text-gray-600" />
                        </button>
                    </div>

                    <div className="p-8">
                        <h2 className="text-3xl font-bold text-gray-900 mb-4 flex items-center">
                            <LocationMarkerIcon className="w-6 h-6 text-primary-500 mr-2" />
                            {gym.name}
                        </h2>

                        {gym.description && (
                            <div className="mb-6">
                                <h3 className="text-lg font-semibold text-gray-800 mb-2">Описание</h3>
                                <p className="text-gray-600 leading-relaxed">{gym.description}</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="min-h-screen bg-[#F5F0E9]">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                {/* Заголовок */}
                <div className="text-center mb-12">
                    <h1 className="font-serif text-4xl md:text-5xl font-bold text-[#2C1810] mb-4">
                        Наши залы
                    </h1>
                    <p className="text-lg text-[#6B4F3A] max-w-2xl mx-auto">
                        Просторные и уютные залы для комфортных тренировок
                    </p>
                </div>

                {loading ? (
                    <div className="flex justify-center py-12">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#8B6B4D]"></div>
                    </div>
                ) : gyms.length === 0 ? (
                    <div className="text-center py-16 bg-white rounded-xl shadow">
                        <PhotographIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-xl font-medium text-gray-700 mb-2">Информация о залах скоро появится</h3>
                        <p className="text-gray-500">Следите за обновлениями</p>
                    </div>
                ) : (
                    <>
                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {gyms.map((gym) => (
                                <GymCard key={gym.id} gym={gym} />
                            ))}
                        </div>

                        {/* Модальное окно с детальной информацией */}
                        {selectedGym && (
                            <GymModal gym={selectedGym} onClose={() => setSelectedGym(null)} />
                        )}
                    </>
                )}
            </div>
        </div>
    );
};

export default GymsPage;
