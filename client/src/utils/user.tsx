import { jwtDecode } from "jwt-decode";
import { login, logout as apiLogout } from "../API";
import { clearCache } from "./indexDb";

let lastLogTime = 0;

export const isUserLoggedIn = () => {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');

    if (!token || !user) {
        const now = Date.now();
        if (now - lastLogTime > 10000) { // Check if 10 seconds have passed since the last log
            console.error('No token or user found. Please login to continue.');
            lastLogTime = now; // Update the last log time
        }

        // Clear any incomplete auth state
        if (!token && user) {
            localStorage.removeItem('user');
        }

        if (token && !user) {
            localStorage.removeItem('token');
            localStorage.removeItem('refreshToken');
        }

        return false; // No token or user, not logged in
    }

    try {
        const decoded = jwtDecode<{ exp?: number }>(token);
        const now = Math.floor(Date.now() / 1000);

        // Check if token is expired
        if (decoded.exp && now > decoded.exp) {
            // Token expired, clear all auth data
            localStorage.removeItem('token');
            localStorage.removeItem('refreshToken');
            localStorage.removeItem('user');
            return false;
        }

        // Token exists and is valid
        return true;
    } catch (error) {
        console.error("Error decoding token:", error);
        // Invalid token, clear auth data
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        return false;
    }
};

export const loginUser = async (loginForm: {
    email: string,
    password: string
}) => {
    try {
        const res = await login(loginForm); // Make the API call (assumes `login` is defined elsewhere)

        if (res.status === 200) {
            // @ts-ignore
            const { token, refreshToken, user } = res.data;

            // Save token to localStorage or sessionStorage
            localStorage.setItem('token', token);
            localStorage.setItem('refreshToken', refreshToken);
            localStorage.setItem('user', JSON.stringify(user));
            return user;
        } else {
            throw new Error('Unexpected response');
        }
    } catch (err: any) {
        throw Error("Login Error:", err);
    }
}

export const logoutUser = async () => {
    const refreshToken = localStorage.getItem('refreshToken');
    if (refreshToken) {
        try {
            await apiLogout(refreshToken);
        } catch (e) {
            console.warn("Error during API logout:", e);
            // Ignore errors, proceed with local cleanup
        }
    }

    // Explicitly remove authentication items
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');

    // Clean other data if needed
    localStorage.clear();

    // Clear cached data
    await clearCache(); //clear IndexDB - cached Books data

    // Redirect to home page
    window.location.replace("/");
}