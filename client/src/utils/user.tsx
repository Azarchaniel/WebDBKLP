import { jwtDecode } from "jwt-decode";

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