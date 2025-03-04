import {jwtDecode} from "jwt-decode";
import {login} from "../API";

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
        } else {
            throw new Error('Unexpected response');
        }
    } catch (err: any) {
        throw Error("Login Error:", err);
    }
}

export const logoutUser = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    window.location.replace("/");
}