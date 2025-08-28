import React, { createContext, useContext, useState, useEffect } from 'react';

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
      // IT override account check
      if (username === 'cholmx' && password === '?74Beverlydrive') {
        const userData = {
          id: 'it_admin',
          username: 'cholmx',
          name: 'IT Administrator',
          role: 'office' // Give IT admin access to office dashboard
        };
        setUser(userData);
        localStorage.setItem('fireforce_user', JSON.stringify(userData));
        return { success: true };
      }

      // Fixed office user credentials
      if (username === 'ffoffice1' && password === 'ffpassword') {
        const userData = {
          id: 'office1',
          username: 'ffoffice1',
          name: 'Office Administrator',
          role: 'office'
        };
        setUser(userData);
        localStorage.setItem('fireforce_user', JSON.stringify(userData));
        return { success: true };
      }

      // Check salesmen users from localStorage
      const savedUsers = localStorage.getItem('fireforce_users');
      if (savedUsers) {
        const users = JSON.parse(savedUsers);
        const foundUser = users.find(u => 
          u.username === username && 
          u.password === password && 
          u.role === 'salesman'
        );

        if (foundUser) {
          const userData = {
            id: foundUser.id,
            username: foundUser.username,
            name: foundUser.name,
            role: foundUser.role
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