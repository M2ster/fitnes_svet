import React, { createContext, useState, useContext, useEffect } from "react";
import { auth } from "../services/api";
import toast from "react-hot-toast";

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const savedUser = localStorage.getItem("user");

    if (token && savedUser) {
      try {
        const parsedUser = JSON.parse(savedUser);
        setUser(parsedUser);
      } catch (e) {
        localStorage.removeItem("user");
      }
    }
    setLoading(false);
  }, []);

  const login = async (phone, password) => {
    try {
        const response = await auth.login(phone, password);

        const { access_token } = response.data;

        if (!access_token) {
            throw new Error('Токен не получен');
        }

        localStorage.setItem('token', access_token);

        const userResponse = await auth.me();

        if (!userResponse.data) {
            throw new Error('Данные пользователя не получены');
        }

        setUser(userResponse.data);
        localStorage.setItem('user', JSON.stringify(userResponse.data));

        toast.success('Успешный вход!');
        return userResponse.data;
    } catch (error) {
        // Универсальное сообщение об ошибке
        toast.error('Неверный логин или пароль');
        throw error;
    }
};

  const register = async (userData) => {
    try {
      const response = await auth.register(userData);
      toast.success("Регистрация успешна!");
      return response.data;
    } catch (error) {
      const errorMessage = error.response?.data?.detail || "Ошибка регистрации";
      toast.error(errorMessage);
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
    toast.success("Вы вышли из системы");
  };

  const value = {
    user,
    login,
    register,
    logout,
    loading,
    isAdmin: user?.is_admin || false,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
