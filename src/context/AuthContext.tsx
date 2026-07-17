import React, { createContext, useContext, useState, useEffect } from 'react';
import type { User, UserRole } from '../types';
import { supabase } from '../lib/supabase';

interface AuthContextType {
  user: User | null;
  role: UserRole | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (username: string, password: string, rememberMe: boolean) => Promise<UserRole | null>;
  logout: () => void;
  forgotPassword: (email: string) => Promise<boolean>;
  changePassword: (old: string, newPass: string) => Promise<boolean>;
  updateProfileImage: (url: string) => Promise<boolean>;
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

  const login = async (username: string, password: string, rememberMe: boolean): Promise<UserRole | null> => {
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 600));

    let authenticatedUser: User | null = null;
    let detectedRole: UserRole | null = null;

    // 1. Try Admin check
    if (
      (username.toLowerCase() === 'admin@gmail.com' && password === 'admin@123') ||
      ((username.toLowerCase() === 'rohan.m' || username.toLowerCase() === 'rohan.m@nhhomes.in') && password === 'admin123')
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
      detectedRole = 'admin';
    } 
    // 2. Try Employee check
    else if ((username.toLowerCase() === 'vikram.s' || username.toLowerCase() === 'vikram.s@nhhomes.in') && password === 'employee123') {
      authenticatedUser = {
        id: 'user-emp-1',
        username: 'vikram.s',
        email: 'vikram.s@nhhomes.in',
        role: 'employee',
        name: 'Vikram Singh',
        profileImage: '',
        entityId: 'emp-1'
      };
      detectedRole = 'employee';
    } else if ((username.toLowerCase() === 'neha.s' || username.toLowerCase() === 'neha.s@nhhomes.in') && password === 'employee123') {
      authenticatedUser = {
        id: 'user-emp-2',
        username: 'neha.s',
        email: 'neha.s@nhhomes.in',
        role: 'employee',
        name: 'Neha Sharma',
        profileImage: '',
        entityId: 'emp-2'
      };
      detectedRole = 'employee';
    } else {
      // Query Supabase directly
      try {
        let dbEmp = null;
        const { data: empByEmail } = await supabase
          .from('employees')
          .select('*')
          .eq('email', username.toLowerCase())
          .maybeSingle();
        dbEmp = empByEmail;

        if (!dbEmp) {
          const { data: empByUsername } = await supabase
            .from('employees')
            .select('*')
            .eq('username', username.toLowerCase())
            .maybeSingle();
          dbEmp = empByUsername;
        }

        if (dbEmp && password === 'employee123') {
          authenticatedUser = {
            id: `user-${dbEmp.id}`,
            username: dbEmp.username || dbEmp.email.split('@')[0],
            email: dbEmp.email,
            role: 'employee',
            name: dbEmp.name,
            profileImage: dbEmp.profile_picture || dbEmp.avatar || '',
            entityId: dbEmp.id
          };
          detectedRole = 'employee';
        }
      } catch (err) {
        console.error('Failed to query Supabase directly for employee login:', err);
      }

      // Try dynamic employee check fallback
      if (!authenticatedUser) {
        const localEmployees = localStorage.getItem('nh_homes_db_v2_employees');
        if (localEmployees) {
          const employeesList = JSON.parse(localEmployees);
          const matchedEmployee = employeesList.find(
            (e: any) =>
              (e.email.toLowerCase() === username.toLowerCase() || e.username.toLowerCase() === username.toLowerCase())
          );
          // Default to employee123 as placeholder password
          if (matchedEmployee && password === 'employee123') {
            authenticatedUser = {
              id: `user-${matchedEmployee.id}`,
              username: matchedEmployee.username,
              email: matchedEmployee.email,
              role: 'employee',
              name: matchedEmployee.name,
              profileImage: matchedEmployee.profilePicture,
              entityId: matchedEmployee.id
            };
            detectedRole = 'employee';
          }
        }
      }
    }

    // 3. Try Client check
    if (!authenticatedUser) {
      if ((username.toLowerCase() === 'amit.patel' || username.toLowerCase() === 'amit.patel@lntecc.com') && password === 'client123') {
        authenticatedUser = {
          id: 'user-clt-1',
          username: 'amit.patel',
          email: 'amit.patel@lntecc.com',
          role: 'client',
          name: 'Amit Patel',
          profileImage: '',
          entityId: 'clt-1'
        };
        detectedRole = 'client';
      } else if ((username.toLowerCase() === 'rajesh' || username.toLowerCase() === 'rajesh@rkinfra.in') && password === 'client123') {
        authenticatedUser = {
          id: 'user-clt-2',
          username: 'rajesh',
          email: 'rajesh@rkinfra.in',
          role: 'client',
          name: 'Rajesh Khanna',
          profileImage: '',
          entityId: 'clt-2'
        };
        detectedRole = 'client';
      } else {
        // Query Supabase directly
        try {
          let dbClient = null;
          const { data: clientByEmail } = await supabase
            .from('clients')
            .select('*')
            .eq('email', username.toLowerCase())
            .eq('password', password)
            .maybeSingle();
          dbClient = clientByEmail;

          if (!dbClient) {
            const { data: clientByClientId } = await supabase
              .from('clients')
              .select('*')
              .eq('client_id', username.toLowerCase())
              .eq('password', password)
              .maybeSingle();
            dbClient = clientByClientId;
          }

          if (!dbClient) {
            const { data: clientByName } = await supabase
              .from('clients')
              .select('*')
              .eq('name', username.toLowerCase())
              .eq('password', password)
              .maybeSingle();
            dbClient = clientByName;
          }

          if (dbClient) {
            authenticatedUser = {
              id: `user-${dbClient.id}`,
              username: dbClient.client_id || dbClient.email.split('@')[0],
              email: dbClient.email,
              role: 'client',
              name: dbClient.name,
              profileImage: dbClient.profile_image,
              entityId: dbClient.id
            };
            detectedRole = 'client';
          }
        } catch (err) {
          console.error('Failed to query Supabase directly for client login:', err);
        }

        // Fallback to localStorage
        if (!authenticatedUser) {
          const localClients = localStorage.getItem('nh_homes_db_v2_clients');
          if (localClients) {
            const clientsList = JSON.parse(localClients);
            const matchedClient = clientsList.find(
              (c: any) => 
                (c.email.toLowerCase() === username.toLowerCase() || 
                 c.name.toLowerCase() === username.toLowerCase() ||
                 (c.client_id && c.client_id.toLowerCase() === username.toLowerCase())) && 
                c.password === password
            );
            if (matchedClient) {
              authenticatedUser = {
                id: `user-${matchedClient.id}`,
                username: matchedClient.client_id || matchedClient.email.split('@')[0],
                email: matchedClient.email,
                role: 'client',
                name: matchedClient.name,
                profileImage: matchedClient.profileImage,
                entityId: matchedClient.id
              };
              detectedRole = 'client';
            }
          }
        }
      }
    }

    if (authenticatedUser && detectedRole) {
      setUser(authenticatedUser);
      setRole(detectedRole);
      setIsAuthenticated(true);

      const fakeJwtToken = `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.${btoa(JSON.stringify(authenticatedUser))}.nh-homes-secret`;

      if (rememberMe) {
        localStorage.setItem('nh_homes_auth_token', fakeJwtToken);
        localStorage.setItem('nh_homes_user', JSON.stringify(authenticatedUser));
        localStorage.setItem('nh_homes_role', detectedRole);
      } else {
        sessionStorage.setItem('nh_homes_auth_token', fakeJwtToken);
        sessionStorage.setItem('nh_homes_user', JSON.stringify(authenticatedUser));
        sessionStorage.setItem('nh_homes_role', detectedRole);
      }
      return detectedRole;
    }

    return null;
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

  const updateProfileImage = async (imageUrl: string): Promise<boolean> => {
    if (!user) return false;

    try {
      if (role === 'client') {
        const { error } = await supabase
          .from('clients')
          .update({ profile_image: imageUrl })
          .eq('id', user.entityId);
        if (error) throw error;
      } else {
        // employee or admin
        const { error } = await supabase
          .from('employees')
          .update({ profile_picture: imageUrl })
          .eq('id', user.entityId);
        if (error) throw error;
      }
    } catch (err) {
      console.error('Failed to update profile image in Supabase:', err);
    }

    const updatedUser = { ...user, profileImage: imageUrl };
    setUser(updatedUser);

    if (localStorage.getItem('nh_homes_user')) {
      localStorage.setItem('nh_homes_user', JSON.stringify(updatedUser));
    } else if (sessionStorage.getItem('nh_homes_user')) {
      sessionStorage.setItem('nh_homes_user', JSON.stringify(updatedUser));
    }

    return true;
  };

  return (
    <AuthContext.Provider value={{ user, role, isAuthenticated, loading, login, logout, forgotPassword, changePassword, updateProfileImage }}>
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
