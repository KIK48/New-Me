import React, { createContext, useContext, useState, useEffect } from 'react';
import * as SecureStore from 'expo-secure-store';

type AuthContextType = {
    token: string | null;
    login: (token: string) => Promise<void>;
    logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: {children: React.ReactNode}) {
    const [token, setToken] = useState<string | null>(null);

    useEffect(() => {
        SecureStore.getItemAsync('token').then(setToken);
    }, []);

    const login = async (newToken: string) => {
        await SecureStore.setItemAsync('token', newToken);
        setToken(newToken);
    };
    
    const logout = async () => {
        await SecureStore.deleteItemAsync('token');
        setToken(null);
    };

    return (
        <AuthContext.Provider value={{ token, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) throw new Error('useAuth must be used inside AuthProvider');
    return context;
}