import React, { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react';
import { User } from '../types';
import { authService } from '../lib/auth';

interface AuthContextType {
  user: User | null;
  isAuthLoading: boolean;
  login: (email: string, password?: string) => Promise<boolean>;
  logout: () => Promise<void>;
  triggerRecovery: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const isInitializedRef = useRef(false);

  // Initialize auth session
  useEffect(() => {
    if (isInitializedRef.current) return;
    isInitializedRef.current = true;

    console.log('Initializing Auth Context...');

    // CACHE BUSTER: Check if user needs a hard refresh
    const lastBuildVersion = '2025-12-28-v2'; // Match Store.tsx version
    const cachedVersion = localStorage.getItem('tj_build_version');
    if (cachedVersion && cachedVersion !== lastBuildVersion) {
      console.warn('New version detected! Clearing old cached state...');
      localStorage.removeItem('supabase.auth.token');
      localStorage.setItem('tj_build_version', lastBuildVersion);
      if (typeof window !== 'undefined' && !window.location.search.includes('refreshed=1')) {
        console.log('Forcing hard refresh for new version...');
        window.location.href = window.location.pathname + '?refreshed=1';
        return;
      }
    }
    localStorage.setItem('tj_build_version', lastBuildVersion);

    // Verify Session First
    console.log("Verifying Identity Protocol...");
    authService.getSession().then(sessionUser => {
      if (sessionUser) {
        setUser({ email: sessionUser.email, isAdmin: sessionUser.isAdmin });
        console.log("Session restored:", sessionUser.email);
      } else {
        console.log("No active session found. Operating in public mode.");
      }
      setIsAuthLoading(false);
    }).catch(err => {
      console.error("Auth Session Check Failed:", err);
      setIsAuthLoading(false);
    });

    // Setup auth state listener
    const authListener = authService.onAuthStateChange(sessionUser => {
      if (sessionUser) {
        setUser({ email: sessionUser.email, isAdmin: sessionUser.isAdmin });
      } else {
        setUser(null);
      }
    });

    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, []);

  const login = async (email: string, password?: string): Promise<boolean> => {
    if (!password) return false;

    console.log('Authenticating with Supabase...');

    const authUser = await authService.login(email, password);
    if (authUser) {
      setUser({ email: authUser.email, isAdmin: authUser.isAdmin });
      console.log('Login successful:', authUser.email);
      return true;
    }

    console.error('Login failed');
    return false;
  };

  const logout = async (): Promise<void> => {
    console.log('Logging out...');
    await authService.logout();
    setUser(null);
    console.log('Logout successful');
  };

  const triggerRecovery = () => {
    console.log("Security Alert: Unauthorized access attempt. Email dispatched.");
  };

  return (
    <AuthContext.Provider value={{
      user,
      isAuthLoading,
      login,
      logout,
      triggerRecovery,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export default AuthProvider;
