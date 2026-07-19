import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { EyeIcon, EyeOffIcon } from '@heroicons/react/outline';
import toast from 'react-hot-toast';

const RegisterPage = () => {
    const [formData, setFormData] = useState({
        first_name: '',
        last_name: '',
        patronymic: '',
        phone: '',
        email: '',
        password: '',
        confirmPassword: '',
        birth_date: '',
    });
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const { register } = useAuth();
    const navigate = useNavigate();

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const validateForm = () => {
        if (!formData.first_name.trim()) {
            toast.error('Введите имя');
            return false;
        }
        if (!formData.last_name.trim()) {
            toast.error('Введите фамилию');
            return false;
        }
        if (!formData.phone.trim()) {
            toast.error('Введите номер телефона');
            return false;
        }
        if (formData.password.length < 6) {
            toast.error('Пароль должен быть не менее 6 символов');
            return false;
        }
        if (formData.password !== formData.confirmPassword) {
            toast.error('Пароли не совпадают');
            return false;
        }
        return true;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateForm()) return;

        setLoading(true);

        try {
            const { confirmPassword, ...userData } = formData;
            await register(userData);
            navigate('/login');
        } catch (error) {
            console.error('Ошибка регистрации:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-primary-100 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl w-full">
                {/* Заголовок */}
                <div className="text-center mb-8">
                    <Link to="/" className="inline-block">
                        <h1 className="text-3xl font-bold bg-gradient-to-r from-primary-600 to-primary-800 bg-clip-text text-transparent">
                            ОСОЗНАННЫЕ ЖЕНСКИЕ ТРЕНИРОВКИ
                        </h1>
                    </Link>
                    <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
                        Регистрация
                    </h2>
                    <p className="mt-2 text-sm text-gray-600">
                        Или{' '}
                        <Link to="/login" className="font-medium text-primary-600 hover:text-primary-500 transition">
                            войдите в систему
                        </Link>
                    </p>
                </div>

                {/* Форма регистрации */}
                <div className="bg-white rounded-2xl shadow-xl p-8">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Имя */}
                            <div>
                                <label htmlFor="first_name" className="block text-sm font-medium text-gray-700 mb-2">
                                    Имя *
                                </label>
                                <input
                                    id="first_name"
                                    name="first_name"
                                    type="text"
                                    required
                                    value={formData.first_name}
                                    onChange={handleChange}
                                    className="input-field"
                                    placeholder="Иван"
                                />
                            </div>

                            {/* Фамилия */}
                            <div>
                                <label htmlFor="last_name" className="block text-sm font-medium text-gray-700 mb-2">
                                    Фамилия *
                                </label>
                                <input
                                    id="last_name"
                                    name="last_name"
                                    type="text"
                                    required
                                    value={formData.last_name}
                                    onChange={handleChange}
                                    className="input-field"
                                    placeholder="Иванов"
                                />
                            </div>

                            {/* Отчество */}
                            <div>
                                <label htmlFor="patronymic" className="block text-sm font-medium text-gray-700 mb-2">
                                    Отчество
                                </label>
                                <input
                                    id="patronymic"
                                    name="patronymic"
                                    type="text"
                                    value={formData.patronymic}
                                    onChange={handleChange}
                                    className="input-field"
                                    placeholder="Иванович"
                                />
                            </div>

                            {/* Телефон */}
                            <div>
                                <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                                    Телефон *
                                </label>
                                <input
                                    id="phone"
                                    name="phone"
                                    type="tel"
                                    required
                                    value={formData.phone}
                                    onChange={handleChange}
                                    className="input-field"
                                    placeholder="89991112233"
                                />
                            </div>

                            {/* Email */}
                            <div>
                                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                                    Email *
                                </label>
                                <input
                                    id="email"
                                    name="email"
                                    type="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    className="input-field"
                                    placeholder="ivan@example.com"
                                />
                            </div>

                            {/* Дата рождения */}
                            <div>
                                <label htmlFor="birth_date" className="block text-sm font-medium text-gray-700 mb-2">
                                    Дата рождения *
                                </label>
                                <input
                                    id="birth_date"
                                    name="birth_date"
                                    type="date"
                                    value={formData.birth_date}
                                    onChange={handleChange}
                                    className="input-field"
                                />
                            </div>

                            {/* Пароль */}
                            <div>
                                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                                    Пароль *
                                </label>
                                <div className="relative">
                                    <input
                                        id="password"
                                        name="password"
                                        type={showPassword ? 'text' : 'password'}
                                        required
                                        value={formData.password}
                                        onChange={handleChange}
                                        className="input-field pr-10"
                                        placeholder="Минимум 6 символов"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute inset-y-0 right-0 pr-3 flex items-center"
                                    >
                                        {showPassword ? (
                                            <EyeOffIcon className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                                        ) : (
                                            <EyeIcon className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                                        )}
                                    </button>
                                </div>
                            </div>

                            {/* Подтверждение пароля */}
                            <div>
                                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                                    Подтвердите пароль *
                                </label>
                                <div className="relative">
                                    <input
                                        id="confirmPassword"
                                        name="confirmPassword"
                                        type={showConfirmPassword ? 'text' : 'password'}
                                        required
                                        value={formData.confirmPassword}
                                        onChange={handleChange}
                                        className="input-field pr-10"
                                        placeholder="Повторите пароль"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                        className="absolute inset-y-0 right-0 pr-3 flex items-center"
                                    >
                                        {showConfirmPassword ? (
                                            <EyeOffIcon className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                                        ) : (
                                            <EyeIcon className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/*<div className="flex items-center">*/}
                        {/*    <input*/}
                        {/*        id="agree"*/}
                        {/*        name="agree"*/}
                        {/*        type="checkbox"*/}
                        {/*        required*/}
                        {/*        className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"*/}
                        {/*    />*/}
                        {/*    <label htmlFor="agree" className="ml-2 block text-sm text-gray-700">*/}
                        {/*        Я согласен с условиями обработки персональных данных*/}
                        {/*    </label>*/}
                        {/*</div>*/}

                        {/* Кнопка регистрации */}
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full btn-primary py-3 px-2 text-sm sm:text-base md:text-lg disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105 transition-transform whitespace-normal break-words"
                        >
                            {loading ? (
                                <div className="flex items-center justify-center">
                                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                                    <span className="truncate">Регистрация...</span>
                                </div>
                            ) : (
                                <span className="block text-center">Зарегистрироваться</span>
                            )}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default RegisterPage;