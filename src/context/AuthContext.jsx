import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { getFromStorage, setToStorage, removeFromStorage, STORAGE_KEYS } from '../utils/storage';
import { useToast } from './ToastContext';

const STORAGE_AUTH_USER = 'sjstudio_auth_user_v1';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const { showToast } = useToast();
  const [user, setUser] = useState(() => {
    return getFromStorage(STORAGE_AUTH_USER, null);
  });
  const [loading, setLoading] = useState(true);

  // Sync Supabase Auth session if configured
  useEffect(() => {
    let subscription = null;

    if (isSupabaseConfigured && supabase) {
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session?.user) {
          fetchUserProfile(session.user);
        } else {
          setLoading(false);
        }
      });

      const { data } = supabase.auth.onAuthStateChange((_event, session) => {
        if (session?.user) {
          fetchUserProfile(session.user);
        } else {
          // If no local mock user, clear user
          const localUser = getFromStorage(STORAGE_AUTH_USER, null);
          if (localUser?.isSupabase) {
            setUser(null);
            removeFromStorage(STORAGE_AUTH_USER);
          }
          setLoading(false);
        }
      });
      subscription = data.subscription;
    } else {
      setLoading(false);
    }

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  async function fetchUserProfile(authUser) {
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authUser.id)
        .single();

      const userData = {
        id: authUser.id,
        email: authUser.email,
        fullName: profile?.full_name || authUser.user_metadata?.full_name || 'Fashion Connoisseur',
        role: profile?.role || 'customer',
        phone: profile?.phone || '',
        isSupabase: true,
      };

      setUser(userData);
      setToStorage(STORAGE_AUTH_USER, userData);
    } catch (err) {
      console.warn('Profile fetch error:', err);
    } finally {
      setLoading(false);
    }
  }

  // Login handler
  const login = async (email, password) => {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        showToast(error.message, 'error');
        return { success: false, error: error.message };
      }
      showToast('Signed in successfully', 'success');
      return { success: true, data };
    }

    // Local / Demo Login Simulation
    const isAdmin = email.toLowerCase().includes('admin');
    const demoUser = {
      id: `usr_${Math.random().toString(36).substr(2, 9)}`,
      email,
      fullName: isAdmin ? 'Studio Atelier Lead (Admin)' : 'Verified Customer',
      role: isAdmin ? 'admin' : 'customer',
      phone: '+91 98765 43210',
      isSupabase: false,
    };

    setUser(demoUser);
    setToStorage(STORAGE_AUTH_USER, demoUser);
    showToast(`Signed in as ${demoUser.fullName} (${demoUser.role})`, 'success');
    return { success: true, data: demoUser };
  };

  // Sign up handler
  const signup = async (email, password, fullName) => {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: fullName, role: 'customer' },
        },
      });
      if (error) {
        showToast(error.message, 'error');
        return { success: false, error: error.message };
      }
      showToast('Account created! Please check your email or sign in.', 'success');
      return { success: true, data };
    }

    // Local demo signup
    const newUser = {
      id: `usr_${Math.random().toString(36).substr(2, 9)}`,
      email,
      fullName: fullName || 'New Client',
      role: 'customer',
      phone: '',
      isSupabase: false,
    };

    setUser(newUser);
    setToStorage(STORAGE_AUTH_USER, newUser);
    showToast('Account created successfully!', 'success');
    return { success: true, data: newUser };
  };

  // Logout handler
  const logout = async () => {
    if (isSupabaseConfigured && supabase) {
      await supabase.auth.signOut();
    }
    setUser(null);
    removeFromStorage(STORAGE_AUTH_USER);
    removeFromStorage(STORAGE_KEYS.LAST_ORDER);
    showToast('Signed out', 'info');
  };

  // Instant switch for quick evaluation
  const loginAsDemoAdmin = () => {
    const adminUser = {
      id: 'usr_admin_demo',
      email: 'admin@sjstudio.fashion',
      fullName: 'Studio Atelier Admin',
      role: 'admin',
      phone: '+91 (080) 4920-8800',
      isSupabase: false,
    };
    setUser(adminUser);
    setToStorage(STORAGE_AUTH_USER, adminUser);
    showToast('Logged in as Verified Admin', 'success');
  };

  const loginAsDemoCustomer = () => {
    const customerUser = {
      id: 'usr_cust_demo',
      email: 'client@sjstudio.fashion',
      fullName: 'Bhoomi Client',
      role: 'customer',
      phone: '+91 98450 11223',
      isSupabase: false,
    };
    setUser(customerUser);
    setToStorage(STORAGE_AUTH_USER, customerUser);
    showToast('Logged in as Customer', 'success');
  };

  const updateProfile = (updates) => {
    setUser((prev) => {
      const updated = { ...prev, ...updates };
      setToStorage(STORAGE_AUTH_USER, updated);
      return updated;
    });
    showToast('Profile updated', 'success');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAdmin: user?.role === 'admin',
        loading,
        login,
        signup,
        logout,
        loginAsDemoAdmin,
        loginAsDemoCustomer,
        updateProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
