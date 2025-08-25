import { createContext, useState, useContext, ReactNode, useEffect, useCallback } from 'react';
import { IUser } from '../../type';
import { jwtDecode } from "jwt-decode";

interface AuthContextType {
    currentUser: IUser | null;
    isLoading: boolean; // Optional: To handle initial loading state
    login: (userData: IUser) => void; // Your login function might do more
    logout: () => void; // Your logout function
    isLoggedIn: boolean;
    checkTokenValidity: () => boolean; // Add function to verify token validity
}

// Create the context with a default value
const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [currentUser, setCurrentUser] = useState<IUser | null>(null);
    const [isLoading, setIsLoading] = useState(true); // Start loading

    // Function to check if token is valid
    const checkTokenValidity = useCallback((): boolean => {
        const token = localStorage.getItem("token");
        if (!token) {
            return false;
        }

        try {
            const decoded = jwtDecode<{ exp?: number }>(token);
            const now = Date.now() / 1000;

            if (!decoded.exp || decoded.exp < now) {
                // Token expired: clear user state and storage
                localStorage.removeItem("token");
                localStorage.removeItem("refreshToken");
                localStorage.removeItem("user");
                setCurrentUser(null);
                return false;
            }
            return true;
        } catch (error) {
            console.error("Error decoding token:", error);
            localStorage.removeItem("token");
            localStorage.removeItem("refreshToken");
            localStorage.removeItem("user");
            setCurrentUser(null);
            return false;
        }
    }, []);

    // Effect to load user from localStorage on initial mount and verify token
    useEffect(() => {
        try {
            if (checkTokenValidity()) {
                const storedUser = localStorage.getItem('user');
                if (storedUser) {
                    setCurrentUser(JSON.parse(storedUser));
                }
            }
        } catch (error) {
            console.error("Failed to parse user from localStorage", error);
            localStorage.removeItem('user'); // Clear corrupted data
        } finally {
            setIsLoading(false); // Done loading initial state
        }
    }, [checkTokenValidity]);

    // Periodically check token validity
    useEffect(() => {
        const tokenCheckInterval = setInterval(() => {
            checkTokenValidity();
        }, 60000); // Check every minute

        return () => clearInterval(tokenCheckInterval);
    }, [checkTokenValidity]);

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

    // Only consider logged in if we have a user AND a valid token
    const isLoggedIn = currentUser !== null && checkTokenValidity();

    const value = {
        currentUser,
        isLoading,
        login,
        logout,
        isLoggedIn,
        checkTokenValidity
    };

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