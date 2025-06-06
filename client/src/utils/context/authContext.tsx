import { createContext, useState, useContext, ReactNode, useEffect, useCallback } from 'react';
import { IUser } from '../../type';
import {jwtDecode} from "jwt-decode";

interface AuthContextType {
    currentUser: IUser | null;
    isLoading: boolean; // Optional: To handle initial loading state
    login: (userData: IUser) => void; // Your login function might do more
    logout: () => void; // Your logout function
    isLoggedIn: boolean;
}

// Create the context with a default value
const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [currentUser, setCurrentUser] = useState<IUser | null>(null);
    const [isLoading, setIsLoading] = useState(true); // Start loading

    // Effect to load user from localStorage on initial mount
    useEffect(() => {
        try {
            const storedUser = localStorage.getItem('user');
            if (storedUser) {
                setCurrentUser(JSON.parse(storedUser));
            }
        } catch (error) {
            console.error("Failed to parse user from localStorage", error);
            localStorage.removeItem('user'); // Clear corrupted data
        } finally {
            setIsLoading(false); // Done loading initial state
        }
    }, []);

    useEffect(() => {
        const token = localStorage.getItem("token");
        if (token) {
            const { exp } = jwtDecode(token);
            const now = Date.now() / 1000;
            if (!exp || exp < now) {
                // Token expired: clear user state and storage
                localStorage.removeItem("token");
                localStorage.removeItem("refreshToken");
                setCurrentUser(null);
            }
        }
    }, []);

    // Login function updates state and localStorage
    const login = useCallback((userData: IUser) => {
        try {
            localStorage.setItem('user', JSON.stringify(userData));
            setCurrentUser(userData);
        } catch (error) {
            console.error("Failed to save user to localStorage", error);
        }
    }, []);

    // Logout function clears state and localStorage
    const logout = useCallback(() => {
        localStorage.removeItem('user');
        setCurrentUser(null);
        // Potentially navigate to login page
    }, []);

    const isLoggedIn = currentUser !== null;

    const value = { currentUser, isLoading, login, logout, isLoggedIn };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

// Custom hook to easily consume the context
export const useAuth = (): AuthContextType => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};