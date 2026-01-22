import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { toast } from 'sonner';
import { api } from '../utils/api';
import { useLanguage } from './LanguageContext';
interface BackendUser {
  user_id: string;
  full_name?: string | null;
  email: string;
  role?: string;
  is_active?: boolean;
}
interface User {
  id: string;
  name: string;
  email: string;
  role: 'guest' | 'user' | 'admin';
  researchInterests?: string;
}
interface AuthContextType {
  user: User | null;
  login: (provider: 'google' | 'github') => void;
  loginWithCredentials: (email: string, password: string, isAdmin?: boolean) => Promise<void>;
  signup: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  updateProfile: (data: Partial<User>) => Promise<void>;
  loading: boolean;
  transformUser: (backendUser: BackendUser) => User;
  setUser: (user: User | null) => void;
}
const AuthContext = createContext<AuthContextType | undefined>(undefined);
export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const { t } = useLanguage();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const transformUser = (backendUser: BackendUser): User => ({
    id: backendUser.user_id,
    name: backendUser.full_name || backendUser.email,
    email: backendUser.email,
    role: (backendUser.role?.toLowerCase() as User['role']) || 'user',
    researchInterests: '',
  });
  useEffect(() => {
    const checkAuth = async () => {
      const token = api.getToken();
      if (token) {
        try {
          const userData = await api.getCurrentUser();
          setUser(transformUser(userData));
        } catch (error: any) {
          if (error.message !== 'BACKEND_NOT_CONNECTED') {
            console.error('Auth error:', error);
          }
          api.setToken(null);
        }
      }
      setLoading(false);
    };
    checkAuth();
  }, []);
  const login = async (provider: 'google' | 'github') => {
    try {
      let oauthUrl: string;
      if (provider === 'google') {
        oauthUrl = await api.getGoogleOAuthUrl();
      } else {
        oauthUrl = await api.getGithubOAuthUrl();
      }
      
      if (!oauthUrl || oauthUrl.trim() === '') {
        throw new Error(`Received empty OAuth URL for ${provider}`);
      }
      
      window.location.href = oauthUrl;
    } catch (error: any) {
      console.error(`Failed to get ${provider} OAuth URL:`, error);
      toast.error(t('failedToInitiateLogin'));
    }
  };
  const loginWithCredentials = async (email: string, password: string, isAdmin = false) => {
    try {
      const tokenResponse = await api.login(email, password);
      api.setToken(tokenResponse.access_token);
      const currentUser = await api.getCurrentUser();
      const mappedUser = transformUser(currentUser);
      setUser(mappedUser);
      if (isAdmin && mappedUser.role !== 'admin') {
        toast.error(t('accountNotAdmin'));
        return;
      }
      toast.success(`${t('welcomeBack')}, ${mappedUser.name}!`);
    } catch (error: any) {
      if (error.message === 'BACKEND_NOT_CONNECTED') {
        toast.error(t('backendNotConnected'));
      } else {
        toast.error(t('loginFailed'));
      }
      throw error;
    }
  };
  const signup = async (name: string, email: string, password: string) => {
    try {
      const tokenResponse = await api.signup(name, email, password);
      api.setToken(tokenResponse.access_token);
      const currentUser = await api.getCurrentUser();
      setUser(transformUser(currentUser));
      toast.success(`${t('accountCreatedSuccess')}, ${name}!`);
    } catch (error: any) {
      if (error.message === 'BACKEND_NOT_CONNECTED') {
        toast.error(t('backendNotConnected'));
      } else {
        toast.error(t('signupFailed'));
      }
      throw error;
    }
  };
  const logout = async () => {
    api.logout();
    setUser(null);
      toast.success(t('loggedOutSuccess'));
  };
  const updateProfile = async (data: Partial<User> | { full_name?: string; old_password?: string; new_password?: string; researchInterests?: string }) => {
    try {
      const updateData: any = {};
      if ((data as any).researchInterests !== undefined) {
        updateData.researchInterests = (data as any).researchInterests;
      }
      if ((data as any).name !== undefined) {
        updateData.full_name = (data as any).name;
      }
      if ((data as any).full_name !== undefined) {
        updateData.full_name = (data as any).full_name;
      }
      if ((data as any).old_password !== undefined) {
        updateData.old_password = (data as any).old_password;
      }
      if ((data as any).new_password !== undefined) {
        updateData.new_password = (data as any).new_password;
      }
      const updatedUser = await api.updateProfile(updateData);
      const mappedUser = transformUser(updatedUser);
      setUser(mappedUser);
      toast.success(t('profileUpdatedSuccess'));
    } catch (error: any) {
      if (error.message === 'BACKEND_NOT_CONNECTED') {
        toast.error(t('backendNotConnected'));
      } else {
        toast.error(t('failedToUpdateProfile'));
      }
      throw error;
    }
  };
  return (
    <AuthContext.Provider value={{ user, login, loginWithCredentials, signup, logout, updateProfile, loading, transformUser, setUser }}>
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