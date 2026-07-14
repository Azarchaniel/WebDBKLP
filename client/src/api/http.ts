import axios, { AxiosRequestConfig, AxiosResponse } from "axios";

// In production the API is served from the same origin (Express serves both).
// In dev VITE_API_BASE_URL = http://localhost:4000 (set in .env).
// Use ?? so an explicitly-empty .env.production value stays as "" (same-origin).
export const baseUrl: string = import.meta.env.VITE_API_BASE_URL ?? "";
export const BATCH_SIZE = 5;

export const axiosInstance = axios.create({
    baseURL: baseUrl,
    withCredentials: true,
});

axiosInstance.interceptors.request.use(
    async (config: AxiosRequestConfig<any>): Promise<any> => {
        const publicRoutes = [
            '/books',
            '/autors',
            '/book/',
            '/autor/',
            '/lps',
            '/lp/',
            '/boardgames',
            '/boardgame/',
            '/quotes',
            '/quote/'
        ];

        const isPublicRoute = publicRoutes.some(route =>
            config.url?.includes(route) && config.method?.toLowerCase() === 'get'
        );

        config.headers = { ...config.headers, "Content-Type": "application/json" };

        const userStr = localStorage.getItem('user');
        const user = userStr ? JSON.parse(userStr) : null;
        const isGuest = user?.role === 'guest';

        if (!isPublicRoute && !isGuest) {
            const tokenExpiresAt = localStorage.getItem('tokenExpiresAt');
            if (tokenExpiresAt) {
                const expiresAt = parseInt(tokenExpiresAt, 10);
                const now = Date.now() / 1000;
                if (expiresAt - now < 60) {
                    try {
                        const response = await axios.post(baseUrl + '/refresh-token', {}, { withCredentials: true });
                        if (response.data.tokenExpiresAt) {
                            localStorage.setItem('tokenExpiresAt', response.data.tokenExpiresAt.toString());
                        }
                    } catch (e) {
                        console.warn('Proactive token refresh failed:', e);
                    }
                }
            }
        }

        return config;
    },
    (error) => {
        console.error("Request error:", error);
        return Promise.reject(error);
    }
);

axiosInstance.interceptors.response.use(
    (response: AxiosResponse) => response,
    (error) => {
        if (error.response?.status === 401) {
            console.warn("Unauthorized! Session may have expired.");
            localStorage.removeItem('user');
            localStorage.removeItem('tokenExpiresAt');
            window.location.href = '/';
            return Promise.reject(new Error('Session expired. Please log in again.'));
        }
        return Promise.reject(error);
    }
);