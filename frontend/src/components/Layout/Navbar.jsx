import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import {
    CalendarIcon,
    UserIcon,
    CreditCardIcon,
    HomeIcon,
    LogoutIcon,
    MenuIcon,
    XIcon,
    ShieldCheckIcon,
    PhotographIcon,
    TemplateIcon
} from '@heroicons/react/outline';

const Navbar = () => {
    const { user, logout, isAdmin } = useAuth();
    const navigate = useNavigate();
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    console.log('Navbar рендерится, пользователь:', user); // Добавь для отладки

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const navLinks = [
        { to: '/', label: 'Главная', icon: HomeIcon, public: true },
        { to: '/directions', label: 'Направления', icon: TemplateIcon, public: true },
        { to: '/gyms', label: 'Залы', icon: PhotographIcon, public: true },
        { to: '/schedule', label: 'Расписание', icon: CalendarIcon, public: false },
        { to: '/memberships', label: 'Абонементы', icon: CreditCardIcon, public: false },
        { to: '/profile', label: 'Профиль', icon: UserIcon, public: false },
    ];

    if (isAdmin) {
        navLinks.push({ to: '/admin', label: 'Админ', icon: ShieldCheckIcon, public: false });
    }

    return (
        <nav className="bg-white shadow-lg sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">
                    {/* Логотип */}
                    <div className="flex items-center">
                        <Link to="/" className="flex items-center space-x-2 group">
                            <span className="text-2xl font-bold bg-gradient-to-r from-primary-500 to-primary-700 bg-clip-text text-transparent group-hover:from-primary-600 group-hover:to-primary-800 transition whitespace-nowrap">
                                ✨ Свети
                            </span>
                        </Link>
                    </div>

                    {/* Десктопное меню */}
                    <div className="hidden md:flex items-center justify-end space-x-1 flex-1">
                        {navLinks.map((link) => {
                            if (!link.public && !user) return null;
                            const Icon = link.icon;
                            return (
                                <Link
                                    key={link.to}
                                    to={link.to}
                                    className="nav-link group whitespace-nowrap"
                                >
                                    <Icon className="w-5 h-5 group-hover:text-primary-600 transition" />
                                    <span>{link.label}</span>
                                </Link>
                            );
                        })}

                        {user ? (
                            <button
                                onClick={handleLogout}
                                className="nav-link text-red-600 hover:text-red-700 group whitespace-nowrap"
                            >
                                <LogoutIcon className="w-5 h-5" />
                                <span>Выйти</span>
                            </button>
                        ) : (
                            <div className="flex items-center space-x-2 ml-4">
                                <Link to="/login" className="btn-primary whitespace-nowrap">
                                    Войти
                                </Link>
                                <Link to="/register" className="btn-secondary whitespace-nowrap">
                                    Регистрация
                                </Link>
                            </div>
                        )}
                    </div>

                    {/* Мобильное меню кнопка */}
                    <div className="md:hidden flex items-center">
                        <button
                            onClick={() => setIsMenuOpen(!isMenuOpen)}
                            className="text-gray-700 hover:text-primary-600 focus:outline-none p-2"
                            aria-label="Меню"
                        >
                            {isMenuOpen ? (
                                <XIcon className="w-6 h-6" />
                            ) : (
                                <MenuIcon className="w-6 h-6" />
                            )}
                        </button>
                    </div>
                </div>
            </div>

            {/* Мобильное меню */}
            {isMenuOpen && (
                <div className="md:hidden bg-white border-t border-gray-200">
                    <div className="px-2 pt-2 pb-3 space-y-1">
                        {navLinks.map((link) => {
                            if (!link.public && !user) return null;
                            const Icon = link.icon;
                            return (
                                <Link
                                    key={link.to}
                                    to={link.to}
                                    className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-primary-600 hover:bg-primary-50 transition"
                                    onClick={() => setIsMenuOpen(false)}
                                >
                                    <div className="flex items-center space-x-2">
                                        <Icon className="w-5 h-5" />
                                        <span>{link.label}</span>
                                    </div>
                                </Link>
                            );
                        })}

                        {user ? (
                            <button
                                onClick={() => {
                                    handleLogout();
                                    setIsMenuOpen(false);
                                }}
                                className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-red-600 hover:text-red-700 hover:bg-red-50 transition"
                            >
                                <div className="flex items-center space-x-2">
                                    <LogoutIcon className="w-5 h-5" />
                                    <span>Выйти</span>
                                </div>
                            </button>
                        ) : (
                            <div className="pt-4 pb-3 border-t border-gray-200">
                                <div className="flex items-center px-5 space-x-3">
                                    <Link
                                        to="/login"
                                        className="btn-primary flex-1 text-center"
                                        onClick={() => setIsMenuOpen(false)}
                                    >
                                        Войти
                                    </Link>
                                    <Link
                                        to="/register"
                                        className="btn-secondary flex-1 text-center"
                                        onClick={() => setIsMenuOpen(false)}
                                    >
                                        Регистрация
                                    </Link>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </nav>
    );
};

export default Navbar;