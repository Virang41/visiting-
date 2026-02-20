import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/axios';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const token = localStorage.getItem('vp_token');
        if (token) {
            api.get('/auth/me')
                .then(res => setUser(res.data.user))
                .catch(() => localStorage.removeItem('vp_token'))
                .finally(() => setLoading(false));
        } else {
            setLoading(false);
        }
    }, []);

    const login = async (email, password) => {
        const res = await api.post('/auth/login', { email, password });
        const { token, user } = res.data;
        localStorage.setItem('vp_token', token);
        setUser(user);
        return user;
    };

    const logout = () => {
        localStorage.removeItem('vp_token');
        setUser(null);
    };

    const updateUser = (updatedUser) => setUser(updatedUser);

    return (
        <AuthContext.Provider value={{ user, loading, login, logout, updateUser }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be used within AuthProvider');
    return ctx;
};
