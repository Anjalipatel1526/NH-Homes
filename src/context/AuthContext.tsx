import React, { createContext, useContext, useState, useEffect } from 'react';
import type { User, UserRole } from '../types';

interface AuthContextType {
  user: User | null;
  role: UserRole | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (username: string, password: string, portal: UserRole, rememberMe: boolean) => Promise<boolean>;
  logout: () => void;
  forgotPassword: (email: string) => Promise<boolean>;
  changePassword: (old: string, newPass: string) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<UserRole | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    let savedToken = localStorage.getItem('nh_homes_auth_token');
    let savedUser = localStorage.getItem('nh_homes_user');
    let savedRole = localStorage.getItem('nh_homes_role');

    if (!savedToken || !savedUser || !savedRole) {
      savedToken = sessionStorage.getItem('nh_homes_auth_token');
      savedUser = sessionStorage.getItem('nh_homes_user');
      savedRole = sessionStorage.getItem('nh_homes_role');
    }

    if (savedToken && savedUser && savedRole) {
      setUser(JSON.parse(savedUser));
      setRole(savedRole as UserRole);
      setIsAuthenticated(true);
    }
    setLoading(false);
  }, []);

  const login = async (username: string, password: string, portal: UserRole, rememberMe: boolean) => {
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 600));

    let authenticatedUser: User | null = null;

    if (portal === 'admin') {
      if (
        (username.toLowerCase() === 'admin@gmail.com' && password === 'admin@123') ||
        (username.toLowerCase() === 'rohan.m' && password === 'admin123')
      ) {
        authenticatedUser = {
          id: 'user-admin',
          username: 'rohan.m',
          email: 'rohan.m@nhhomes.in',
          role: 'admin',
          name: 'Admin',
          profileImage: '',
          entityId: 'emp-3'
        };
      }
    } else if (portal === 'employee') {
      if (username.toLowerCase() === 'vikram.s' && password === 'employee123') {
        authenticatedUser = {
          id: 'user-emp-1',
          username: 'vikram.s',
          email: 'vikram.s@nhhomes.in',
          role: 'employee',
          name: 'Vikram Singh',
          profileImage: '',
          entityId: 'emp-1'
        };
      } else if (username.toLowerCase() === 'neha.s' && password === 'employee123') {
        authenticatedUser = {
          id: 'user-emp-2',
          username: 'neha.s',
          email: 'neha.s@nhhomes.in',
          role: 'employee',
          name: 'Neha Sharma',
          profileImage: '',
          entityId: 'emp-2'
        };
      }
    } else if (portal === 'client') {
      if (username.toLowerCase() === 'amit.patel' && password === 'client123') {
        authenticatedUser = {
          id: 'user-clt-1',
          username: 'amit.patel',
          email: 'amit.patel@lntecc.com',
          role: 'client',
          name: 'Amit Patel',
          profileImage: '',
          entityId: 'clt-1'
        };
      } else if (username.toLowerCase() === 'rajesh' && password === 'client123') {
        authenticatedUser = {
          id: 'user-clt-2',
          username: 'rajesh',
          email: 'rajesh@rkinfra.in',
          role: 'client',
          name: 'Rajesh Khanna',
          profileImage: '',
          entityId: 'clt-2'
        };
      }
    }

    if (authenticatedUser) {
      setUser(authenticatedUser);
      setRole(portal);
      setIsAuthenticated(true);

      const fakeJwtToken = `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.${btoa(JSON.stringify(authenticatedUser))}.nh-homes-secret`;

      if (rememberMe) {
        localStorage.setItem('nh_homes_auth_token', fakeJwtToken);
        localStorage.setItem('nh_homes_user', JSON.stringify(authenticatedUser));
        localStorage.setItem('nh_homes_role', portal);
      } else {
        sessionStorage.setItem('nh_homes_auth_token', fakeJwtToken);
        sessionStorage.setItem('nh_homes_user', JSON.stringify(authenticatedUser));
        sessionStorage.setItem('nh_homes_role', portal);
      }
      return true;
    }

    return false;
  };

  const logout = () => {
    setUser(null);
    setRole(null);
    setIsAuthenticated(false);
    localStorage.removeItem('nh_homes_auth_token');
    localStorage.removeItem('nh_homes_user');
    localStorage.removeItem('nh_homes_role');
    sessionStorage.removeItem('nh_homes_auth_token');
    sessionStorage.removeItem('nh_homes_user');
    sessionStorage.removeItem('nh_homes_role');
  };

  const forgotPassword = async (email: string) => {
    await new Promise((resolve) => setTimeout(resolve, 500));
    console.log(`Sending password reset link to: ${email}`);
    return true; // Always return true for mock purposes
  };

  const changePassword = async (old: string, newPass: string) => {
    await new Promise((resolve) => setTimeout(resolve, 500));
    console.log(`Password changed. Old: ${old}, New: ${newPass}`);
    return true;
  };

  return (
    <AuthContext.Provider value={{ user, role, isAuthenticated, loading, login, logout, forgotPassword, changePassword }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
