import { createContext, useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const AuthContext = createContext(null);

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [token, setToken] = useState(localStorage.getItem('token'));
    const navigate = useNavigate();

    const login = (newToken) => {
        localStorage.setItem('token', newToken);
        setToken(newToken);
        navigate('/Dashboard'); // Redirect to dashboard on successful login
    };

    const logout = () => {
        localStorage.removeItem('token');
        setToken(null);
        navigate('/'); // Redirect to landing page on logout
    };

    const value = {
        token,
        login,
        logout,
        isAuthenticated: !!token,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};