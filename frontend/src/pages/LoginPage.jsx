import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { EyeIcon, EyeOffIcon } from '@heroicons/react/outline';

const LoginPage = () => {
    const [phone, setPhone] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            await login(phone, password);
            console.log('Вход успешен, перенаправление...');
            navigate('/');  // или '/profile'
        } catch (error) {
            console.error('Ошибка входа:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-primary-100 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full">
                {/* Заголовок */}
                <div className="text-center mb-8">
                    <Link to="/" className="inline-block">
                        <h1 className="text-3xl font-bold bg-gradient-to-r from-primary-600 to-primary-800 bg-clip-text text-transparent">
                            ОСОЗНАННЫЕ ЖЕНСКИЕ ТРЕНИРОВКИ
                        </h1>
                    </Link>
                    <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
                        Вход в систему
                    </h2>
                    <p className="mt-2 text-sm text-gray-600">
                        Или{' '}
                        <Link to="/register" className="font-medium text-primary-600 hover:text-primary-500 transition">
                            зарегистрируйтесь
                        </Link>
                    </p>
                </div>

                {/* Форма входа */}
                <div className="bg-white rounded-2xl shadow-xl p-8">
                    <form className="space-y-6" onSubmit={handleSubmit}>
                        <div>
                            <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                                Номер телефона
                            </label>
                            <input
                                id="phone"
                                name="phone"
                                type="tel"
                                required
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                                className="input-field"
                                placeholder="89991112233"
                            />
                        </div>

                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                                Пароль
                            </label>
                            <div className="relative">
                                <input
                                    id="password"
                                    name="password"
                                    type={showPassword ? 'text' : 'password'}
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="input-field pr-10"
                                    placeholder="Введите пароль"
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

                        <div>
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full btn-primary py-3 text-lg disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105 transition-transform"
                            >
                                {loading ? (
                                    <div className="flex items-center justify-center">
                                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        Вход...
                                    </div>
                                ) : 'Войти'}
                            </button>
                        </div>
                    </form>

                    {/*/!* Тестовые данные *!/*/}
                    {/*<div className="mt-8 pt-6 border-t border-gray-200">*/}
                    {/*    <h3 className="text-sm font-medium text-gray-700 mb-3">Тестовые аккаунты:</h3>*/}
                    {/*    <div className="space-y-2 text-sm">*/}
                    {/*        <div className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">*/}
                    {/*            <div>*/}
                    {/*                <p className="font-medium text-gray-900">Пользователь</p>*/}
                    {/*                <p className="text-gray-600">+79991234567 / pass123</p>*/}
                    {/*            </div>*/}
                    {/*            <button*/}
                    {/*                onClick={() => {*/}
                    {/*                    setPhone('+79991234567');*/}
                    {/*                    setPassword('pass123');*/}
                    {/*                }}*/}
                    {/*                className="text-primary-600 hover:text-primary-700 text-xs font-medium"*/}
                    {/*            >*/}
                    {/*                Вставить*/}
                    {/*            </button>*/}
                    {/*        </div>*/}
                    {/*        <div className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">*/}
                    {/*            <div>*/}
                    {/*                <p className="font-medium text-gray-900">Администратор</p>*/}
                    {/*                <p className="text-gray-600">+79991112233 / admin123</p>*/}
                    {/*            </div>*/}
                    {/*            <button*/}
                    {/*                onClick={() => {*/}
                    {/*                    setPhone('+79991112233');*/}
                    {/*                    setPassword('admin123');*/}
                    {/*                }}*/}
                    {/*                className="text-primary-600 hover:text-primary-700 text-xs font-medium"*/}
                    {/*            >*/}
                    {/*                Вставить*/}
                    {/*            </button>*/}
                    {/*        </div>*/}
                    {/*    </div>*/}
                    {/*</div>*/}
                </div>
            </div>
        </div>
    );
};

export default LoginPage;