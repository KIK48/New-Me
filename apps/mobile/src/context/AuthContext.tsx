import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import * as SecureStore from 'expo-secure-store';
import { API_URL } from '../api/client';

type Tokens = { token: string; refreshToken: string };

type AuthContextType = {
    token: string | null;
    login: (token: string, refreshToken: string) => Promise<void>;
    logout: () => Promise<void>;
    // Drop-in replacement for fetch on authenticated routes: attaches the
    // Authorization header, and on a 401 transparently refreshes the access
    // token once and retries before giving up. If the refresh token itself
    // is invalid/expired, logs out — which flips RootNavigator back to the
    // AuthStack, so the user lands on Login instead of a silently broken screen.
    authorizedFetch: (url: string, options?: RequestInit) => Promise<Response>;
};

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: {children: React.ReactNode}) {
    const [token, setToken] = useState<string | null>(null);

    // Refs mirror state for use inside authorizedFetch/refresh logic, which
    // can run mid-render-cycle (e.g. a screen's Promise.all firing several
    // authorizedFetch calls at once) and needs the latest values synchronously.
    const tokenRef = useRef<string | null>(null);
    const refreshTokenRef = useRef<string | null>(null);
    // Dedupes concurrent 401s: without this, N parallel requests failing at
    // once would each call /auth/refresh, and since refresh tokens rotate
    // (single-use), only the first would succeed — the rest would see their
    // now-stale refresh token rejected and wrongly force a logout.
    const refreshPromiseRef = useRef<Promise<Tokens | null> | null>(null);

    useEffect(() => {
        Promise.all([
            SecureStore.getItemAsync('token'),
            SecureStore.getItemAsync('refreshToken'),
        ]).then(([storedToken, storedRefreshToken]) => {
            tokenRef.current = storedToken;
            refreshTokenRef.current = storedRefreshToken;
            setToken(storedToken);
        });
    }, []);

    async function persistTokens(newToken: string, newRefreshToken: string) {
        tokenRef.current = newToken;
        refreshTokenRef.current = newRefreshToken;
        await Promise.all([
            SecureStore.setItemAsync('token', newToken),
            SecureStore.setItemAsync('refreshToken', newRefreshToken),
        ]);
        setToken(newToken);
    }

    const login = async (newToken: string, newRefreshToken: string) => {
        await persistTokens(newToken, newRefreshToken);
    };

    const logout = async () => {
        const refreshToken = refreshTokenRef.current;
        tokenRef.current = null;
        refreshTokenRef.current = null;
        await Promise.all([
            SecureStore.deleteItemAsync('token'),
            SecureStore.deleteItemAsync('refreshToken'),
        ]);
        setToken(null);

        // Best-effort server-side revoke so a stolen refresh token can't
        // keep working for its remaining 30 days after an explicit logout.
        if (refreshToken) {
            try {
                await fetch(`${API_URL}/auth/logout`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ refreshToken }),
                });
            } catch {
                // Offline or server down — local logout already happened, which
                // is what actually matters for the user.
            }
        }
    };

    async function refreshTokens(): Promise<Tokens | null> {
        if (refreshPromiseRef.current) return refreshPromiseRef.current;

        const promise = (async (): Promise<Tokens | null> => {
            const currentRefreshToken = refreshTokenRef.current;
            if (!currentRefreshToken) return null;

            try {
                const res = await fetch(`${API_URL}/auth/refresh`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ refreshToken: currentRefreshToken }),
                });
                if (!res.ok) return null;

                const data = await res.json();
                await persistTokens(data.token, data.refreshToken);
                return data;
            } catch {
                return null;
            }
        })();

        refreshPromiseRef.current = promise;
        try {
            return await promise;
        } finally {
            refreshPromiseRef.current = null;
        }
    }

    async function authorizedFetch(url: string, options: RequestInit = {}): Promise<Response> {
        const res = await fetch(url, {
            ...options,
            headers: { ...options.headers, Authorization: `Bearer ${tokenRef.current}` },
        });
        if (res.status !== 401) return res;

        const refreshed = await refreshTokens();
        if (!refreshed) {
            await logout();
            return res;
        }

        return fetch(url, {
            ...options,
            headers: { ...options.headers, Authorization: `Bearer ${refreshed.token}` },
        });
    }

    return (
        <AuthContext.Provider value={{ token, login, logout, authorizedFetch }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) throw new Error('useAuth must be used inside AuthProvider');
    return context;
}
