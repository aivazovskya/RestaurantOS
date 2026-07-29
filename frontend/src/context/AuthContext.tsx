import React, { createContext, useContext, useState, useEffect } from 'react';
import { loginApi, courierLoginApi, getMeApi, setAuthToken } from '../services/api';

export interface UserProfile {
  id: string;
  email?: string;
  fullName?: string;
  phone?: string;
  role: string; // OWNER, MANAGER, STOREKEEPER, CHEF, COURIER
  organizationId?: string;
  branchId?: string;
  branchIds: string[];
  courierId?: string;
}

interface AuthContextType {
  token: string | null;
  user: UserProfile | null;
  isLoading: boolean;
  login: (email: string, pass: string) => Promise<void>;
  courierLogin: (phone: string, pin: string) => Promise<void>;
  logout: () => void;
  hasRole: (...roles: string[]) => boolean;
}

const AuthContext = createContext<AuthContextType>({
  token: null,
  user: null,
  isLoading: true,
  login: async () => {},
  courierLogin: async () => {},
  logout: () => {},
  hasRole: () => false,
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setTokenState] = useState<string | null>(() => localStorage.getItem('restaurantos_access_token'));
  const [user, setUser] = useState<UserProfile | null>(() => {
    const saved = localStorage.getItem('restaurantos_user_profile');
    return saved ? JSON.parse(saved) : null;
  });
  const [isLoading, setIsLoading] = useState(true);

  const updateToken = (newToken: string | null, newUser: UserProfile | null) => {
    setTokenState(newToken);
    setUser(newUser);
    setAuthToken(newToken);

    if (newToken && newUser) {
      localStorage.setItem('restaurantos_access_token', newToken);
      localStorage.setItem('restaurantos_user_profile', JSON.stringify(newUser));
    } else {
      localStorage.removeItem('restaurantos_access_token');
      localStorage.removeItem('restaurantos_user_profile');
    }
  };

  const initAuth = async () => {
    if (token) {
      setAuthToken(token);
      try {
        const userData = await getMeApi();
        setUser(userData);
        localStorage.setItem('restaurantos_user_profile', JSON.stringify(userData));
      } catch (err) {
        console.warn('Saved token expired or invalid:', err);
        updateToken(null, null);
      }
    } else {
      setAuthToken(null);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    initAuth();
  }, []);

  const login = async (email: string, pass: string) => {
    const res = await loginApi(email, pass);
    updateToken(res.accessToken, res.user);
  };

  const courierLogin = async (phone: string, pin: string) => {
    const res = await courierLoginApi(phone, pin);
    updateToken(res.accessToken, res.user);
  };

  const logout = () => {
    updateToken(null, null);
  };

  const hasRole = (...roles: string[]) => {
    if (!user) return false;
    return roles.includes(user.role);
  };

  return (
    <AuthContext.Provider value={{ token, user, isLoading, login, courierLogin, logout, hasRole }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
