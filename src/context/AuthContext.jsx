import React, { createContext, useContext, useState, useEffect } from 'react';
import supabase from '../lib/supabase';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for existing session
    const savedUser = localStorage.getItem('fireforce_user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
    setLoading(false);
  }, []);

  const login = async (username, password) => {
    try {
      // Check office user first
      const { data: officeData, error: officeError } = await supabase
        .from('office_info_ff2024')
        .select('*')
        .limit(1)
        .single();

      if (!officeError && username === 'office1' && password === (officeData.password_hash || 'password')) {
        const userData = {
          id: 'office1',
          username: 'office1',
          name: 'Office Administrator',
          role: 'office'
        };
        setUser(userData);
        localStorage.setItem('fireforce_user', JSON.stringify(userData));
        return { success: true };
      }

      // Check salesmen users
      const { data: users, error: usersError } = await supabase
        .from('users_ff2024')
        .select('*')
        .eq('username', username)
        .eq('role', 'salesman');

      if (usersError) {
        console.error('Database error:', usersError);
        return { success: false, error: 'Database connection error' };
      }

      if (users && users.length > 0) {
        const user = users[0];
        if (user.password_hash === password) {
          const userData = {
            id: user.id,
            username: user.username,
            name: user.name,
            role: user.role
          };
          setUser(userData);
          localStorage.setItem('fireforce_user', JSON.stringify(userData));
          return { success: true };
        }
      }

      return { success: false, error: 'Invalid credentials' };
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: 'Connection error' };
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('fireforce_user');
  };

  const value = {
    user,
    login,
    logout,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};