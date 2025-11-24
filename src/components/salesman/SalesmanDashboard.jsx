import React, { useEffect } from 'react';
import { Routes, Route, Link, useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import Header from '../layout/Header';
import InvoiceForm from '../invoice/InvoiceForm';
import InvoiceList from '../invoice/InvoiceList';
import CustomerManagement from '../customer/CustomerManagement';
import SalesmanStats from './SalesmanStats';
import SafeIcon from '../../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';

const { FiPlus, FiFileText, FiUsers, FiBarChart3 } = FiIcons;

const SalesmanDashboard = () => {
  const location = useLocation();
  const navigate = useNavigate();

  // Persistent navigation state
  useEffect(() => {
    // Save current path to localStorage whenever it changes
    // Only save sub-paths of /salesman, but not the root /salesman itself
    if (location.pathname !== '/salesman') {
      localStorage.setItem('last_salesman_path', location.pathname);
    }
  }, [location]);

  useEffect(() => {
    // Restore last path on mount if on root /salesman
    const lastPath = localStorage.getItem('last_salesman_path');
    if (location.pathname === '/salesman' && lastPath && lastPath.startsWith('/salesman')) {
      navigate(lastPath, { replace: true });
    }
  }, []); // Run once on mount

  const navItems = [
    { path: '/salesman', label: 'Dashboard', icon: FiBarChart3 },
    { path: '/salesman/invoice/new', label: 'New Invoice', icon: FiPlus },
    { path: '/salesman/invoices', label: 'My Invoices', icon: FiFileText },
    { path: '/salesman/customers', label: 'Customers', icon: FiUsers }
  ];

  return (
    <div className="min-h-screen bg-[#f8f9fa]">
      <Header title="Sales Portal" />
      <div className="flex max-w-7xl mx-auto">
        <motion.nav 
          initial={{ x: -20, opacity: 0 }} 
          animate={{ x: 0, opacity: 1 }} 
          className="w-56 bg-white hidden md:block border-r border-gray-200 min-h-[calc(100vh-3.5rem)] sticky top-14"
        >
          <div className="p-4">
            <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4 px-3">Menu</h2>
            <ul className="space-y-1">
              {navItems.map((item) => {
                const isActive = location.pathname === item.path;
                return (
                  <li key={item.path}>
                    <Link
                      to={item.path}
                      className={`flex items-center space-x-3 px-3 py-2 rounded-lg transition-all duration-200 text-sm font-medium ${
                        isActive 
                          ? 'bg-red-50 text-red-600' 
                          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                      }`}
                    >
                      <SafeIcon icon={item.icon} className={`text-base ${isActive ? 'text-red-500' : 'text-gray-400'}`} />
                      <span>{item.label}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        </motion.nav>
        
        <main className="flex-1 p-4 md:p-6 lg:p-8 overflow-x-hidden">
          <Routes>
            <Route path="/" element={<SalesmanStats />} />
            <Route path="/invoice/new" element={<InvoiceForm />} />
            <Route path="/invoice/edit/:id" element={<InvoiceForm />} />
            <Route path="/invoices" element={<InvoiceList userRole="salesman" />} />
            <Route path="/customers" element={<CustomerManagement />} />
          </Routes>
        </main>
      </div>
    </div>
  );
};

export default SalesmanDashboard;