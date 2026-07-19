import React, { useState, useEffect } from 'react';
import { CalendarIcon, RefreshIcon, TrashIcon } from '@heroicons/react/outline';
import { admin } from '../../services/api';
import toast from 'react-hot-toast';

const ScheduleGenerator = ({ onGenerate }) => {
    const [templates, setTemplates] = useState([]);
    const [loading, setLoading] = useState(false);
    const [generating, setGenerating] = useState(false);
    const [cleaning, setCleaning] = useState(false);
    const [weeks, setWeeks] = useState(4);
    const [startDate, setStartDate] = useState(
        new Date().toISOString().split('T')[0]
    );

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
        loadTemplates();
    }, []);

    const loadTemplates = async () => {
        try {
            setLoading(true);
            const response = await admin.getScheduleTemplates();
            setTemplates(response.data);
        } catch (error) {
            console.error('Ошибка загрузки шаблонов:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleGenerate = async () => {
        if (!window.confirm(`Сгенерировать расписание на ${weeks} недели вперед?`)) {
            return;
        }

        setGenerating(true);
        try {
            const response = await admin.generateSchedule(weeks, startDate);
            toast.success(`Создано ${response.data.created} занятий`);

            // Показываем информацию о пропущенных, если они есть
            if (response.data.skipped > 0) {
                toast.success(`${response.data.skipped} занятий уже существовали`, {
                    icon: 'ℹ️',
                    duration: 4000
                });
            }

            if (onGenerate) onGenerate();
        } catch (error) {
            console.error('Ошибка генерации:', error);
            toast.error('Не удалось сгенерировать расписание');
        } finally {
            setGenerating(false);
        }
    };

    const handleCleanup = async () => {
        if (!window.confirm('Удалить старые занятия без записей?')) {
            return;
        }

        setCleaning(true);
        try {
            const response = await admin.cleanupOldLessons(30);
            toast.success(`Удалено ${response.data.deleted} старых занятий`);
            if (onGenerate) onGenerate();
        } catch (error) {
            console.error('Ошибка очистки:', error);
            toast.error('Не удалось очистить старые занятия');
        } finally {
            setCleaning(false);
        }
    };

    return (
        <div className="bg-white rounded-xl shadow-md p-6 mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <CalendarIcon className="w-5 h-5 mr-2 text-primary-500" />
                Генерация расписания
            </h3>

            <div className="grid md:grid-cols-2 gap-6">
                {/* Левая колонка - настройки */}
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Количество недель
                        </label>
                        <select
                            value={weeks}
                            onChange={(e) => setWeeks(parseInt(e.target.value))}
                            className="input-field"
                        >
                            <option value="1">1 неделя</option>
                            <option value="2">2 недели</option>
                            <option value="4">4 недели</option>
                            <option value="8">8 недель</option>
                            <option value="12">12 недель</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Дата начала
                        </label>
                        <input
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            className="input-field"
                        />
                    </div>

                    <div className="flex space-x-3">
                        <button
                            onClick={handleGenerate}
                            disabled={generating}
                            className="flex-1 btn-primary py-2 flex items-center justify-center"
                        >
                            {generating ? (
                                <>
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                    Генерация...
                                </>
                            ) : (
                                <>
                                    <RefreshIcon className="w-4 h-4 mr-2" />
                                    Сгенерировать
                                </>
                            )}
                        </button>

                        <button
                            onClick={handleCleanup}
                            disabled={cleaning}
                            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition flex items-center"
                            title="Очистить старые занятия"
                        >
                            {cleaning ? (
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-700"></div>
                            ) : (
                                <TrashIcon className="w-4 h-4" />
                            )}
                        </button>
                    </div>
                </div>

                {/* Правая колонка - статистика шаблонов */}
                <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="font-medium text-gray-700 mb-2">Активные шаблоны</h4>
                    {loading ? (
                        <div className="flex justify-center py-4">
                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary-600"></div>
                        </div>
                    ) : (
                        <div className="space-y-2 max-h-48 overflow-y-auto">
                            {templates.length === 0 ? (
                                <p className="text-sm text-gray-500">Нет шаблонов расписания</p>
                            ) : (
                                templates.filter(t => t.is_active).map(template => (
                                    <div key={template.id} className="text-sm flex justify-between">
                    <span className="text-gray-600">
                      {weekdays[template.weekday]}, {template.start_time}
                    </span>
                                        <span className="font-medium text-gray-900">
                      {template.lesson_type?.name}
                    </span>
                                    </div>
                                ))
                            )}
                        </div>
                    )}
                </div>
            </div>

            <p className="text-xs text-gray-500 mt-4">
                * Генерация создает новые занятия из шаблонов, пропуская уже существующие.
                Старые занятия без записей можно удалить кнопкой очистки.
            </p>
        </div>
    );
};

export default ScheduleGenerator;