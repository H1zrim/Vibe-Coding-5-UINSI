import React, { createContext, useContext, useState, useEffect } from 'react';
import { authApi } from '../api/authApi';
import toast from 'react-hot-toast';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('siperpu_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem('siperpu_token') || null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const verifyUser = async () => {
      if (token) {
        try {
          const res = await authApi.getMe();
          if (res.success && res.data?.user) {
            setUser(res.data.user);
            localStorage.setItem('siperpu_user', JSON.stringify(res.data.user));
          }
        } catch (err) {
          console.error('Session expired:', err);
          logout(false);
        }
      }
      setLoading(false);
    };

    verifyUser();
  }, [token]);

  const login = async (username, password) => {
    try {
      const res = await authApi.login({ username, password });
      if (res.success && res.data) {
        const { token: newToken, user: userData } = res.data;
        setToken(newToken);
        setUser(userData);
        localStorage.setItem('siperpu_token', newToken);
        localStorage.setItem('siperpu_user', JSON.stringify(userData));
        toast.success(`Selamat datang, ${userData.name}!`);
        return { success: true, user: userData };
      }
      throw new Error(res.message || 'Login gagal.');
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Username atau password salah.';
      toast.error(msg);
      return { success: false, message: msg };
    }
  };

  const register = async (formData) => {
    try {
      const res = await authApi.register(formData);
      if (res.success && res.data) {
        const { token: newToken, user: userData } = res.data;
        setToken(newToken);
        setUser(userData);
        localStorage.setItem('siperpu_token', newToken);
        localStorage.setItem('siperpu_user', JSON.stringify(userData));
        toast.success('Registrasi berhasil! Selamat datang.');
        return { success: true, user: userData };
      }
      throw new Error(res.message || 'Registrasi gagal.');
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Registrasi gagal.';
      toast.error(msg);
      return { success: false, message: msg };
    }
  };

  const logout = async (notify = true) => {
    try {
      if (token) {
        await authApi.logout().catch(() => {});
      }
    } finally {
      setToken(null);
      setUser(null);
      localStorage.removeItem('siperpu_token');
      localStorage.removeItem('siperpu_user');
      if (notify) {
        toast.success('Anda telah keluar dari sistem.');
      }
    }
  };

  const isAdmin = user?.role === 'pengurus';
  const isStudent = user?.role === 'mahasiswa';

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        register,
        logout,
        isAdmin,
        isStudent,
        isAuthenticated: !!token && !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
