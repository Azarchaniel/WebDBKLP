import { createContext, useState, useContext, ReactNode, useEffect, useCallback, useMemo } from 'react';
import { IUser } from '../../type';
import { tryRefreshToken } from '../../API';

interface AuthContextType {
    currentUser: IUser | null;
    isLoading: boolean; // Optional: To handle initial loading state
    login: (userData: IUser) => void; // Your login function might do more
    logout: () => void; // Your logout function
    isLoggedIn: boolean;
    isGuest: boolean;
    checkTokenValidity: () => boolean; // Add function to verify token validity
}

// Create the context with a default value
const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [currentUser, setCurrentUser] = useState<IUser | null>(null);
    const [isLoading, setIsLoading] = useState(true); // Start loading

    // Pure read-only validity check — no side effects, safe to call during render
    const isTokenCurrentlyValid = useCallback((): boolean => {
        const tokenExpiresAt = localStorage.getItem("tokenExpiresAt");
        if (!tokenExpiresAt) return false;
        const now = Date.now() / 1000;
        return parseInt(tokenExpiresAt, 10) >= now;
    }, []);

    // Full validity check with side effects (clears state & storage when expired)
    const checkTokenValidity = useCallback((): boolean => {
        const tokenExpiresAt = localStorage.getItem("tokenExpiresAt");
        if (!tokenExpiresAt) {
            setCurrentUser(null);
            return false;
        }

        const now = Date.now() / 1000;
        if (parseInt(tokenExpiresAt, 10) < now) {
            localStorage.removeItem("tokenExpiresAt");
            localStorage.removeItem("user");
            setCurrentUser(null);
            return false;
        }
        return true;
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

    // Periodically check token validity, attempting a refresh before logging out
    useEffect(() => {
        const tokenCheckInterval = setInterval(async () => {
            if (isTokenCurrentlyValid()) return;

            // Access token expired — for non-guest users, try refresh before clearing state.
            const isGuest = currentUser?.role === 'guest';
            if (currentUser && !isGuest) {
                const ok = await tryRefreshToken();
                if (ok) return; // refresh succeeded; tokenExpiresAt updated
            }

            // Refresh not possible or failed — clear state.
            checkTokenValidity();
        }, 60000); // Check every minute

        return () => clearInterval(tokenCheckInterval);
    }, [checkTokenValidity, isTokenCurrentlyValid, currentUser]);

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
        localStorage.removeItem('tokenExpiresAt');
        localStorage.removeItem('user');
        setCurrentUser(null);
    }, []);

    // Only consider logged in if we have a user AND a valid token.
    // Uses the pure (side-effect-free) check so no state setter is called during render.
    const isLoggedIn = useMemo(
        () => currentUser !== null && isTokenCurrentlyValid(),
        [currentUser, isTokenCurrentlyValid]
    );
    const isGuest = currentUser?.role === 'guest';

    const value = {
        currentUser,
        isLoading,
        login,
        logout,
        isLoggedIn,
        isGuest,
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