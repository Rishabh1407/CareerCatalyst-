import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService, profileService } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem('careercatalyst_token'));
  const [loading, setLoading] = useState(true);

  const initAuth = async () => {
    const savedToken = localStorage.getItem('careercatalyst_token');
    if (savedToken) {
      try {
        const userRes = await authService.getMe();
        setUser(userRes.data);
        try {
          const profileRes = await profileService.getProfile();
          setProfile(profileRes.data);
        } catch {
          // Profile optional or uninitialized
        }
      } catch (err) {
        console.error('Failed to authenticate with saved token', err);
        localStorage.removeItem('careercatalyst_token');
        setToken(null);
        setUser(null);
      }
    }
    setLoading(false);
  };

  useEffect(() => {
    initAuth();
  }, []);

  const login = async (email, password) => {
    const response = await authService.login({ email, password });
    const { token: tokenData, user: userData } = response.data;
    localStorage.setItem('careercatalyst_token', tokenData.access_token);
    setToken(tokenData.access_token);
    setUser(userData);
    
    // Fetch profile
    try {
      const profileRes = await profileService.getProfile();
      setProfile(profileRes.data);
    } catch (e) {
      console.warn("Could not fetch profile on login", e);
    }

    return response.data;
  };

  const register = async (email, password) => {
    const response = await authService.register({ email, password });
    const { token: tokenData, user: userData } = response.data;
    localStorage.setItem('careercatalyst_token', tokenData.access_token);
    setToken(tokenData.access_token);
    setUser(userData);

    // Fetch newly initialized profile
    try {
      const profileRes = await profileService.getProfile();
      setProfile(profileRes.data);
    } catch (e) {
      console.warn("Could not fetch profile on register", e);
    }

    return response.data;
  };

  const logout = () => {
    localStorage.removeItem('careercatalyst_token');
    setToken(null);
    setUser(null);
    setProfile(null);
  };

  const refreshProfile = async () => {
    try {
      const profileRes = await profileService.getProfile();
      setProfile(profileRes.data);
      return profileRes.data;
    } catch (err) {
      console.error('Failed to refresh profile', err);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        token,
        loading,
        isAuthenticated: !!token && !!user,
        login,
        register,
        logout,
        refreshProfile,
        setProfile
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
