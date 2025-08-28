import React, { createContext, useContext, useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';

const DataContext = createContext();

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};

export const DataProvider = ({ children }) => {
  const [invoices, setInvoices] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [users, setUsers] = useState([]);
  const [officeInfo, setOfficeInfo] = useState({});
  const [settings, setSettings] = useState({ taxRate: 8.0 });
  const [loading, setLoading] = useState(true);

  // Load data from localStorage
  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    try {
      setLoading(true);
      
      // Load all data from localStorage
      const savedInvoices = localStorage.getItem('fireforce_invoices');
      const savedCustomers = localStorage.getItem('fireforce_customers');
      const savedUsers = localStorage.getItem('fireforce_users');
      const savedOfficeInfo = localStorage.getItem('fireforce_office');
      const savedSettings = localStorage.getItem('fireforce_settings');

      if (savedInvoices) setInvoices(JSON.parse(savedInvoices));
      if (savedCustomers) setCustomers(JSON.parse(savedCustomers));
      if (savedUsers) setUsers(JSON.parse(savedUsers));
      if (savedOfficeInfo) setOfficeInfo(JSON.parse(savedOfficeInfo));
      if (savedSettings) setSettings(JSON.parse(savedSettings));

      console.log('All data loaded from localStorage successfully');
    } catch (error) {
      console.error('Error loading data from localStorage:', error);
    } finally {
      setLoading(false);
    }
  };

  // Save data to localStorage
  const saveToLocalStorage = (key, data) => {
    try {
      localStorage.setItem(key, JSON.stringify(data));
    } catch (error) {
      console.error('Error saving to localStorage:', error);
      throw error;
    }
  };

  // Invoice operations
  const addInvoice = async (invoiceData) => {
    try {
      const newInvoice = {
        ...invoiceData,
        id: uuidv4(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        archived: false
      };

      const updatedInvoices = [...invoices, newInvoice];
      setInvoices(updatedInvoices);
      saveToLocalStorage('fireforce_invoices', updatedInvoices);
      
      return newInvoice;
    } catch (error) {
      console.error('Error adding invoice:', error);
      throw error;
    }
  };

  const updateInvoice = async (id, updates) => {
    try {
      const updatedInvoices = invoices.map(invoice =>
        invoice.id === id
          ? { ...invoice, ...updates, updatedAt: new Date().toISOString() }
          : invoice
      );
      
      setInvoices(updatedInvoices);
      saveToLocalStorage('fireforce_invoices', updatedInvoices);
    } catch (error) {
      console.error('Error updating invoice:', error);
      throw error;
    }
  };

  const deleteInvoice = async (id) => {
    try {
      const updatedInvoices = invoices.filter(invoice => invoice.id !== id);
      setInvoices(updatedInvoices);
      saveToLocalStorage('fireforce_invoices', updatedInvoices);
    } catch (error) {
      console.error('Error deleting invoice:', error);
      throw error;
    }
  };

  // Customer operations
  const addCustomer = async (customerData) => {
    try {
      const newCustomer = {
        ...customerData,
        id: uuidv4(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      const updatedCustomers = [...customers, newCustomer];
      setCustomers(updatedCustomers);
      saveToLocalStorage('fireforce_customers', updatedCustomers);
      
      return newCustomer;
    } catch (error) {
      console.error('Error adding customer:', error);
      throw error;
    }
  };

  const updateCustomer = async (id, updates) => {
    try {
      const updatedCustomers = customers.map(customer =>
        customer.id === id
          ? { ...customer, ...updates, updatedAt: new Date().toISOString() }
          : customer
      );
      
      setCustomers(updatedCustomers);
      saveToLocalStorage('fireforce_customers', updatedCustomers);
    } catch (error) {
      console.error('Error updating customer:', error);
      throw error;
    }
  };

  const deleteCustomer = async (id) => {
    try {
      const updatedCustomers = customers.filter(customer => customer.id !== id);
      setCustomers(updatedCustomers);
      saveToLocalStorage('fireforce_customers', updatedCustomers);
    } catch (error) {
      console.error('Error deleting customer:', error);
      throw error;
    }
  };

  // User operations
  const addUser = async (userData) => {
    try {
      const newUser = {
        ...userData,
        id: uuidv4(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      const updatedUsers = [...users, newUser];
      setUsers(updatedUsers);
      saveToLocalStorage('fireforce_users', updatedUsers);
      
      return newUser;
    } catch (error) {
      console.error('Error adding user:', error);
      throw error;
    }
  };

  const updateUser = async (id, updates) => {
    try {
      const updatedUsers = users.map(user =>
        user.id === id
          ? { ...user, ...updates, updatedAt: new Date().toISOString() }
          : user
      );
      
      setUsers(updatedUsers);
      saveToLocalStorage('fireforce_users', updatedUsers);
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  };

  const deleteUser = async (id) => {
    try {
      const updatedUsers = users.filter(user => user.id !== id);
      setUsers(updatedUsers);
      saveToLocalStorage('fireforce_users', updatedUsers);
    } catch (error) {
      console.error('Error deleting user:', error);
      throw error;
    }
  };

  // Settings operations
  const updateSettings = async (newSettings) => {
    try {
      console.log('Updating settings:', newSettings);
      const updatedSettings = { ...settings, ...newSettings };
      setSettings(updatedSettings);
      saveToLocalStorage('fireforce_settings', updatedSettings);
      console.log('Settings updated successfully');
    } catch (error) {
      console.error('Error updating settings:', error);
      throw error;
    }
  };

  // Office info operations
  const updateOfficeInfo = async (updates) => {
    try {
      console.log('Updating office info:', updates);
      const updatedOfficeInfo = { ...officeInfo, ...updates };
      setOfficeInfo(updatedOfficeInfo);
      saveToLocalStorage('fireforce_office', updatedOfficeInfo);
      console.log('Office info updated successfully');
    } catch (error) {
      console.error('Error updating office info:', error);
      throw error;
    }
  };

  const value = {
    invoices,
    customers,
    users,
    officeInfo,
    settings,
    loading,
    addInvoice,
    updateInvoice,
    deleteInvoice,
    addCustomer,
    updateCustomer,
    deleteCustomer,
    addUser,
    updateUser,
    deleteUser,
    updateOfficeInfo,
    updateSettings,
    loadAllData
  };

  return (
    <DataContext.Provider value={value}>
      {children}
    </DataContext.Provider>
  );
};