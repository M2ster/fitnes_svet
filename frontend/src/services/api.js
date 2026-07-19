import axios from 'axios';
import toast from 'react-hot-toast';
import { API_URL } from '../config';

const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
    withCredentials: true,
});

// Добавляем токен к каждому запросу
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Обрабатываем ответы
// Обрабатываем ответы
api.interceptors.response.use(
    (response) => {
        return response;
    },
    (error) => {
        // Проверяем, относится ли запрос к аутентификации
        const isAuthRequest = error.config?.url?.startsWith('/auth/');

        // Если это auth-запрос — не показываем тост, просто пробрасываем ошибку
        if (isAuthRequest) {
            return Promise.reject(error);
        }

        // Для всех остальных запросов показываем тосты
        if (error.response?.status === 401) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = '/login';
            toast.error('Сессия истекла, войдите снова');
        } else if (error.response?.status === 403) {
            toast.error('У вас нет прав для этого действия');
        } else if (error.response?.data?.detail) {
            toast.error(error.response.data.detail);
        } else if (error.code === 'ERR_NETWORK') {
            toast.error('Сервер недоступен. Проверьте подключение к бэкенду');
        } else {
            toast.error('Произошла ошибка');
        }
        return Promise.reject(error);
    }
);

// ========== AUTH ENDPOINTS ==========
export const auth = {
    login: (phone, password) => api.post('/auth/login/json', { phone, password }),
    register: (userData) => api.post('/auth/register', userData),
    me: () => api.get('/auth/me'),
};

// ========== SCHEDULE ENDPOINTS ==========
export const schedule = {
    getByDate: (date) => api.get(`/schedule/${date}`),
    getLesson: (lessonId) => api.get(`/schedule/lesson/${lessonId}`),
    book: (lessonId, membershipId) => api.post('/schedule/book', {
        lesson_id: lessonId,
        user_membership_id: membershipId
    }),
    cancel: (bookingId) => api.post(`/schedule/cancel/${bookingId}`),
    myBookings: () => api.get('/schedule/my/bookings'),
    upcoming: () => api.get('/schedule/my/upcoming'),
};

// ========== MEMBERSHIPS ENDPOINTS ==========
export const memberships = {
    getOffers: () => api.get('/memberships/offers'),
    getMy: () => api.get('/memberships/my'),
    buy: (membershipOfferId, startDate = null) => api.post('/memberships/buy', {
        membership_offer_id: membershipOfferId,
        start_date: startDate
    }),
};

// ========== PUBLIC TRAINERS ENDPOINTS ==========
export const trainers = {
    getAll: () => api.get('/trainers/'),
    getOne: (id) => api.get(`/trainers/${id}`),
};

// ========== PUBLIC GYMS ENDPOINTS ==========
export const publicGyms = {
    getAll: () => api.get('/public/gyms/'),
    getOne: (id) => api.get(`/public/gyms/${id}`),
};

// ========== UPLOAD ENDPOINTS ==========
export const upload = {
    trainerPhoto: (trainerId, file) => {
        const formData = new FormData();
        formData.append('file', file);
        return api.post(`/upload/trainer-photo/${trainerId}`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });
    },
    deleteTrainerPhoto: (trainerId) => api.delete(`/upload/trainer-photo/${trainerId}`),
    userPhoto: (userId, file) => {
        const formData = new FormData();
        formData.append('file', file);
        return api.post(`/upload/user-photo/${userId}`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });
    },
    gymPhoto: (gymId, file) => {
        const formData = new FormData();
        formData.append('file', file);
        return api.post(`/upload/gym-photo/${gymId}`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });
    },
};

// ========== ADMIN ENDPOINTS ==========
export const admin = {
    getStats: () => api.get('/admin/stats'),
    createLesson: (lessonData) => api.post('/admin/lessons', lessonData),
    updateLesson: (lessonId, lessonData) => api.put(`/admin/lessons/${lessonId}`, lessonData),
    deleteLesson: (lessonId) => api.delete(`/admin/lessons/${lessonId}`),
    getLessonBookings: (lessonId) => api.get(`/admin/lessons/${lessonId}/bookings`),
    checkin: (bookingId, status) => api.post('/admin/checkin', { booking_id: bookingId, status }),
    createLessonsBatch: (lessonsData) => api.post('/admin/lessons/batch', lessonsData),
    getUsers: (skip = 0, limit = 1000) => api.get('/admin/users', { params: { skip, limit } }),
    searchUsers: (query) => api.get('/admin/users/search', { params: { query } }),
    getUserDetails: (userId) => api.get(`/admin/users/${userId}`),
    createUser: (userData) => api.post('/auth/register', userData),
    getMemberships: (skip = 0, limit = 1000) => api.get('/admin/memberships', { params: { skip, limit } }),
    getExpiringMemberships: (days = 7) => api.get('/admin/memberships/expiring', { params: { days } }),
    createMembership: (data) => api.post('/memberships/admin/create', data),
    getTrainers: () => api.get('/admin/trainers'),
    getTrainer: (id) => api.get(`/admin/trainers/${id}`),
    createTrainer: (data) => api.post('/admin/trainers', data),
    updateTrainer: (id, data) => api.put(`/admin/trainers/${id}`, data),
    deleteTrainer: (id) => api.delete(`/admin/trainers/${id}`),
    getGyms: () => api.get('/admin/gyms'),
    getGym: (id) => api.get(`/admin/gyms/${id}`),
    createGym: (data) => api.post('/admin/gyms', data),
    updateGym: (id, data) => api.put(`/admin/gyms/${id}`, data),
    deleteGym: (id) => api.delete(`/admin/gyms/${id}`),
    getLessonTypes: () => api.get('/admin/lesson-types'),
    createLessonType: (data) => api.post('/admin/lesson-types', data),
    updateLessonType: (id, data) => api.put(`/admin/lesson-types/${id}`, data),
    deleteLessonType: (id) => api.delete(`/admin/lesson-types/${id}`),
    getMembershipOffers: () => api.get('/admin/membership-offers'),
    createMembershipOffer: (data) => api.post('/admin/membership-offers', data),
    updateMembershipOffer: (id, data) => api.put(`/admin/membership-offers/${id}`, data),
    deleteMembershipOffer: (id) => api.delete(`/admin/membership-offers/${id}`),
    getScheduleTemplates: () => api.get('/schedule-templates/'),
    getScheduleTemplate: (id) => api.get(`/schedule-templates/${id}`),
    createScheduleTemplate: (data) => api.post('/schedule-templates/', data),
    updateScheduleTemplate: (id, data) => api.put(`/schedule-templates/${id}`, data),
    deleteScheduleTemplate: (id) => api.delete(`/schedule-templates/${id}`),
    generateSchedule: (weeks, startDate) => api.post('/schedule-templates/generate', null, {
        params: { weeks, start_date: startDate }
    }),
    cleanupOldLessons: (days) => api.post('/schedule-templates/cleanup', null, {
        params: { days }
    }),
    getSalesReport: (startDate, endDate) => api.get('/admin/sales-report', { 
    params: { start_date: startDate, end_date: endDate } 
}),
};

export default api;