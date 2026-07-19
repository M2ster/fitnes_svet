import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Layout from './components/Layout/Layout';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DirectionsPage from './pages/DirectionsPage'; // Импорт направлений
import SchedulePage from './pages/SchedulePage';
import MembershipsPage from './pages/MembershipsPage';
import ProfilePage from './pages/ProfilePage';
import AdminPage from './pages/AdminPage';
import GymsPage from './pages/GymsPage';

const PrivateRoute = ({ children, adminOnly = false }) => {
    const { user, loading, isAdmin } = useAuth();

    if (loading) {
        return <div className="flex justify-center items-center h-screen">Загрузка...</div>;
    }

    if (!user) {
        return <Navigate to="/login" />;
    }

    if (adminOnly && !isAdmin) {
        return <Navigate to="/" />;
    }

    return children;
};

function AppRoutes() {
    return (
        <Layout>
            <Routes>
                {/* Публичные маршруты */}
                <Route path="/" element={<HomePage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
                <Route path="/directions" element={<DirectionsPage />} /> {/* Новый маршрут */}
                <Route path="/gyms" element={<GymsPage />} />

                {/* Защищенные маршруты */}
                <Route
                    path="/schedule"
                    element={
                        <PrivateRoute>
                            <SchedulePage />
                        </PrivateRoute>
                    }
                />

                <Route
                    path="/memberships"
                    element={
                        <PrivateRoute>
                            <MembershipsPage />
                        </PrivateRoute>
                    }
                />

                <Route
                    path="/profile"
                    element={
                        <PrivateRoute>
                            <ProfilePage />
                        </PrivateRoute>
                    }
                />

                {/* Админ маршрут */}
                <Route
                    path="/admin"
                    element={
                        <PrivateRoute adminOnly>
                            <AdminPage />
                        </PrivateRoute>
                    }
                />
            </Routes>
        </Layout>
    );
}

function App() {
    return (
        <Router>
            <AuthProvider>
                <Toaster
                    position="top-right"
                    toastOptions={{
                        duration: 4000,
                        style: {
                            background: '#fff',
                            color: '#2C1810',
                            border: '1px solid #E8DDD2',
                            fontFamily: 'Montserrat, sans-serif',
                        },
                        success: {
                            iconTheme: {
                                primary: '#8B6B4D',
                                secondary: '#fff',
                            },
                        },
                        error: {
                            iconTheme: {
                                primary: '#dc2626',
                                secondary: '#fff',
                            },
                        },
                    }}
                />
                <AppRoutes />
            </AuthProvider>
        </Router>
    );
}

export default App;