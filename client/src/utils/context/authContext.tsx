import { createContext, useState, useContext, ReactNode, useEffect, useCallback } from 'react';
import { IUser } from '../../type';

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

    // Login function updates state and localStorage
    const login = useCallback((userData: IUser) => {
        console.log('AuthContext: Attempting login with:', userData);
        try {
            console.log(userData);
            localStorage.setItem('user', JSON.stringify(userData));
            setCurrentUser(userData);
            console.log('AuthContext: setCurrentUser called successfully.');
            // Potentially navigate or other side effects
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