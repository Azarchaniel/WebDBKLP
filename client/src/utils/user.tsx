import { login, loginGuest, logout as apiLogout } from "../API";
import { clearCache } from "./indexDb";

let lastLogTime = 0;

export const isUserLoggedIn = () => {
    const tokenExpiresAt = localStorage.getItem('tokenExpiresAt');
    const user = localStorage.getItem('user');

    if (!tokenExpiresAt || !user) {
        const now = Date.now();
        if (now - lastLogTime > 10000) {
            console.error('No session found. Please login to continue.');
            lastLogTime = now;
        }

        // Clear any incomplete auth state
        if (!tokenExpiresAt && user) localStorage.removeItem('user');
        if (tokenExpiresAt && !user) localStorage.removeItem('tokenExpiresAt');

        return false;
    }

    const now = Math.floor(Date.now() / 1000);
    if (parseInt(tokenExpiresAt, 10) < now) {
        localStorage.removeItem('tokenExpiresAt');
        localStorage.removeItem('user');
        return false;
    }

    return true;
};

export const loginUser = async (loginForm: {
    email: string,
    password: string
}) => {
    try {
        const res = await login(loginForm);

        if (res.status === 200) {
            // @ts-ignore
            const { user, tokenExpiresAt } = res.data;

            localStorage.setItem('tokenExpiresAt', tokenExpiresAt.toString());
            localStorage.setItem('user', JSON.stringify(user));
            return user;
        } else {
            throw new Error('Unexpected response');
        }
    } catch (err: any) {
        throw Error("Login Error:", err);
    }
}

export const loginGuestUser = async () => {
    try {
        const res = await loginGuest();

        if (res.status === 200) {
            // @ts-ignore
            const { user, tokenExpiresAt } = res.data;
            localStorage.setItem('tokenExpiresAt', tokenExpiresAt.toString());
            localStorage.setItem('user', JSON.stringify(user));
            return user;
        } else {
            throw new Error('Unexpected response');
        }
    } catch (err: any) {
        throw Error("Guest Login Error: " + err);
    }
}

export const logoutUser = async () => {
    try {
        await apiLogout();
    } catch (e) {
        console.warn("Error during API logout:", e);
        // Ignore errors, proceed with local cleanup
    }

    localStorage.removeItem('tokenExpiresAt');
    localStorage.removeItem('user');

    // Clear cached data
    await clearCache(); //clear IndexDB - cached Books data

    // Redirect to home page
    window.location.replace("/");
}