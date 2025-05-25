import {jwtDecode} from "jwt-decode";
import {login, logout as apiLogout} from "../API";
import {clearCache} from "./indexDb";

let lastLogTime = 0;

export const isUserLoggedIn = () => {
    const token = localStorage.getItem('token');

    if (!token) {
        const now = Date.now();
        if (now - lastLogTime > 10000) { // Check if 10 seconds have passed since the last log
            console.error('No token found. Please login to continue.');
            lastLogTime = now; // Update the last log time
        }

        return false; // No token, user is not logged in
    }

    try {
        const decoded = jwtDecode(token);
        const now = Math.floor(Date.now() / 1000);

        // Token exists and is valid
        return !(decoded.exp && now > decoded.exp);
    } catch (error) {
        console.error("Error decoding token:", error);
        return false; // Token is invalid
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
            const {token, refreshToken, user} = res.data;

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
            // Ignore errors, proceed with local cleanup
        }
    }
    localStorage.clear(); //clean all data
    await clearCache(); //clear IndexDB - cached Books data
    window.location.replace("/");
}