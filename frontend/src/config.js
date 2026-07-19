const getBaseUrl = () => {
    if (process.env.REACT_APP_API_URL) {
        return process.env.REACT_APP_API_URL;
    }
    const hostname = window.location.hostname;
    if (hostname !== 'localhost' && hostname !== '127.0.0.1') {
        return `https://${hostname}/api`;
    }
    return 'http://localhost:8000';
};

export const API_URL = getBaseUrl();