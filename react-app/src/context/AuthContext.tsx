import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { api } from '../services/api';

export type UserRole = 'Super Admin' | 'Admin' | 'HR' | 'Manager' | 'Team Lead' | 'Recruiter' | 'Normal User';

export interface Role {
  _id: string;
  name: string;
  description: string;
  isBuiltIn: boolean;
  reportsTo?: string;
  permissions: Record<string, { view: boolean; create: boolean; edit: boolean; delete: boolean }>;
}

interface User {
  _id: string;
  username: string;
  name: string;
  email: string;
  role: UserRole;
  customRoleId?: string;
  profileImage?: string;
}

interface AuthContextType {
  user: User | null;
  activeRole: Role | null;
  login: (username: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string, name: string, role: UserRole) => Promise<void>;
  logout: () => void;
  updateProfile: (data: Partial<User>) => void;
  changePassword: (oldPassword: string, newPassword: string) => Promise<void>;
  isAuthenticated: boolean;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        return JSON.parse(storedUser);
      } catch (e) {
        localStorage.removeItem('user');
        return null;
      }
    }
    return null;
  });
  const [activeRole, setActiveRole] = useState<Role | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchActiveRole = async (userObj: User) => {
    try {
      if (userObj.customRoleId) {
        const role = await api.getRoleById(userObj.customRoleId);
        setActiveRole(role);
      } else {
        const roles = await api.getRoles();
        const builtin = roles.find((r: Role) => r.name === userObj.role);
        setActiveRole(builtin || null);
      }
    } catch (error) {
      console.error('Failed to fetch active role:', error);
      setActiveRole(null);
    }
  };

  useEffect(() => {
    const initRole = async () => {
      if (user) {
        setLoading(true);
        await fetchActiveRole(user);
        setLoading(false);
      } else {
        setActiveRole(null);
      }
    };
    initRole();
  }, [user?.role, user?.customRoleId]);

  const login = async (username: string, password: string) => {
    setLoading(true);
    try {
      const data = await api.login({ username, password });
      setUser(data);
      localStorage.setItem('user', JSON.stringify(data));

      if (data) {
        await fetchActiveRole(data);
      }

      try {
        await api.punchIn();
      } catch (punchError) {
        console.log('Automatic punch-in skipped or failed:', punchError);
      }
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const register = async (username: string, email: string, password: string, name: string, role: UserRole) => {
    setLoading(true);
    try {
      const data = await api.register({ username, email, password, name, role });
      setUser(data);
      localStorage.setItem('user', JSON.stringify(data));
      await fetchActiveRole(data);
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    if (user?._id) {
      // Automatic Punch Out on Logout
      try {
        await api.punchOut();
      } catch (punchError) {
        console.error('Automatic punch-out failed during logout:', punchError);
      }

      try {
        await api.logout(user._id);
      } catch (error) {
        console.error('API logout error:', error);
      }
    }
    setUser(null);
    localStorage.removeItem('user');
  };

  const updateProfile = (data: Partial<User>) => {
    if (user) {
      const updatedUser = { ...user, ...data };
      setUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));
      if (data.customRoleId !== undefined || data.role !== undefined) {
        fetchActiveRole(updatedUser);
      }
    }
  };

  const changePassword = async (oldPassword: string, newPassword: string) => {
    if (!user?._id) return;
    setLoading(true);
    try {
      await api.changePassword(user._id, oldPassword, newPassword);
    } catch (error) {
      console.error('Password change error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const isAuthenticated = !!user;

  // Sync state across tabs (optional but good)
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'user') {
        if (e.newValue) {
          setUser(JSON.parse(e.newValue));
        } else {
          setUser(null);
        }
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  return (
    <AuthContext.Provider value={{ user, activeRole, login, register, logout, updateProfile, changePassword, isAuthenticated, loading }}>
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
