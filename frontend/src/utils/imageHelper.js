import { API_URL } from '../config';

export const getFullImageUrl = (url) => {
    if (!url) return null;
    
    // Если URL содержит IP с портом 8000 или localhost, заменяем на наш домен
    if (url.includes('195.209.219.38:8000') || 
        url.includes('46.173.27.140:8000') || 
        url.includes('localhost:8000')) {
        // Извлекаем путь после /uploads
        const match = url.match(/\/uploads\/(.+)$/);
        if (match) {
            const baseUrl = API_URL.replace('/api', '');
            return `${baseUrl}/uploads/${match[1]}`;
        }
    }
    
    // Если уже HTTPS URL с нашим доменом
    if (url.startsWith('https://fitness-sveti.ru')) {
        return url;
    }
    
    // Если начинается с HTTP но не наш домен
    if (url.startsWith('http://')) {
        const baseUrl = API_URL.replace('/api', '');
        const match = url.match(/\/uploads\/(.+)$/);
        if (match) {
            return `${baseUrl}/uploads/${match[1]}`;
        }
    }
    
    // Если путь начинается с /uploads
    if (url.startsWith('/uploads')) {
        const baseUrl = API_URL.replace('/api', '');
        return `${baseUrl}${url}`;
    }
    
    // Если просто имя файла (для залов)
    if (url.match(/\.(jpg|jpeg|png|gif|webp)$/i)) {
        const baseUrl = API_URL.replace('/api', '');
        return `${baseUrl}/uploads/gyms/${url}`;
    }
    
    return url;
};

export const getTrainerInitials = (name) => {
    if (!name) return 'ТР';
    return name
        .split(' ')
        .map(word => word[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
};

// Добавим функцию для залов
export const getGymImageUrl = (gym) => {
    if (!gym) return null;
    const photoUrl = gym.photo || gym.image || gym.main_image;
    return getFullImageUrl(photoUrl);
};