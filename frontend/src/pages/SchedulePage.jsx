import React, { useState, useEffect } from 'react';
import { format, addDays, subDays } from 'date-fns';
import { ru } from 'date-fns/locale';
import { ChevronLeftIcon, ChevronRightIcon, CalendarIcon } from '@heroicons/react/outline';
import { schedule } from '../services/api';
import LessonCard from '../components/Schedule/LessonCard';
import BookingModal from '../components/Schedule/BookingModal';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

const SchedulePage = () => {
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [lessons, setLessons] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedLesson, setSelectedLesson] = useState(null);
    const [showBookingModal, setShowBookingModal] = useState(false);
    const { user } = useAuth();

    useEffect(() => {
        loadSchedule();
    }, [selectedDate]);

    const loadSchedule = async () => {
        try {
            setLoading(true);
            const dateStr = format(selectedDate, 'yyyy-MM-dd');
            console.log('Загрузка расписания на:', dateStr);
            const response = await schedule.getByDate(dateStr);
            console.log('Расписание загружено:', response.data);

            // Сортируем по времени
            const sortedLessons = response.data.sort((a, b) =>
                new Date(a.date_lesson) - new Date(b.date_lesson)
            );
            setLessons(sortedLessons);
        } catch (error) {
            console.error('Ошибка загрузки расписания:', error);
            toast.error('Не удалось загрузить расписание');
        } finally {
            setLoading(false);
        }
    };

    const handlePrevDay = () => {
        setSelectedDate(subDays(selectedDate, 1));
    };

    const handleNextDay = () => {
        setSelectedDate(addDays(selectedDate, 1));
    };

    const handleToday = () => {
        setSelectedDate(new Date());
    };

    const handleBookLesson = (lesson) => {
        if (!user) {
            toast.error('Необходимо войти в систему');
            return;
        }
        setSelectedLesson(lesson);
        setShowBookingModal(true);
    };

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Заголовок */}
            <div className="mb-8">
                <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
                    Расписание занятий
                </h1>
                <p className="text-gray-600">
                    Выберите дату и запишитесь на тренировку
                </p>
            </div>

            {/* Навигация по датам */}
            <div className="bg-white rounded-xl shadow-md p-4 mb-8">
                <div className="flex items-center justify-between">
                    <button
                        onClick={handlePrevDay}
                        className="p-3 hover:bg-gray-100 rounded-full transition group"
                        title="Предыдущий день"
                    >
                        <ChevronLeftIcon className="w-6 h-6 text-gray-600 group-hover:text-primary-600" />
                    </button>

                    <div className="flex-1 text-center">
                        <div className="flex items-center justify-center space-x-2">
                            <CalendarIcon className="w-6 h-6 text-primary-500" />
                            <div>
                                <div className="text-2xl md:text-3xl font-bold text-gray-800">
                                    {format(selectedDate, 'd MMMM', { locale: ru })}
                                </div>
                                <div className="text-gray-500 text-sm md:text-base">
                                    {format(selectedDate, 'EEEE', { locale: ru })}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center space-x-2">
                        <button
                            onClick={handleToday}
                            className="px-4 py-2 text-sm font-medium text-primary-600 hover:text-primary-700 hover:bg-primary-50 rounded-lg transition"
                        >
                            Сегодня
                        </button>
                        <button
                            onClick={handleNextDay}
                            className="p-3 hover:bg-gray-100 rounded-full transition group"
                            title="Следующий день"
                        >
                            <ChevronRightIcon className="w-6 h-6 text-gray-600 group-hover:text-primary-600" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Список занятий */}
            {loading ? (
                <div className="flex flex-col items-center justify-center h-64">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mb-4"></div>
                    <p className="text-gray-500">Загрузка расписания...</p>
                </div>
            ) : lessons.length === 0 ? (
                <div className="text-center py-16 bg-white rounded-xl shadow">
                    <CalendarIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-xl font-medium text-gray-700 mb-2">Нет занятий</h3>
                    <p className="text-gray-500 mb-6">На этот день нет запланированных тренировок</p>
                    <button
                        onClick={handleNextDay}
                        className="btn-primary inline-flex items-center"
                    >
                        Смотреть следующий день
                        <ChevronRightIcon className="w-5 h-5 ml-2" />
                    </button>
                </div>
            ) : (
                <div className="grid gap-4">
                    {lessons.map((lesson) => (
                        <LessonCard
                            key={lesson.id}
                            lesson={lesson}
                            onBook={() => handleBookLesson(lesson)}
                        />
                    ))}
                </div>
            )}

            {/* Модальное окно записи */}
            {showBookingModal && selectedLesson && (
                <BookingModal
                    lesson={selectedLesson}
                    onClose={() => {
                        setShowBookingModal(false);
                        setSelectedLesson(null);
                    }}
                    onSuccess={() => {
                        loadSchedule();
                        setShowBookingModal(false);
                        setSelectedLesson(null);
                    }}
                />
            )}
        </div>
    );
};

export default SchedulePage;