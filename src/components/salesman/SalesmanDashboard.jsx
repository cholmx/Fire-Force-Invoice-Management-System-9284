import React from 'react';
import { Routes, Route, Link, useLocation } from 'react-router-dom';
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

  const navItems = [
    { path: '/salesman', label: 'Dashboard', icon: FiBarChart3 },
    { path: '/salesman/invoice/new', label: 'New Invoice', icon: FiPlus },
    { path: '/salesman/invoices', label: 'My Invoices', icon: FiFileText },
    { path: '/salesman/customers', label: 'Customers', icon: FiUsers }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Header title="Sales Dashboard" />
      <div className="flex">
        <motion.nav
          initial={{ x: -300 }}
          animate={{ x: 0 }}
          className="w-64 bg-white shadow-lg h-screen sticky top-0"
        >
          <div className="p-6">
            <h2 className="text-lg font-title font-semibold text-gray-900 mb-6">Navigation</h2>
            <ul className="space-y-2">
              {navItems.map((item) => {
                const isActive = location.pathname === item.path;
                return (
                  <li key={item.path}>
                    <Link
                      to={item.path}
                      className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                        isActive
                          ? 'bg-brand-gradient text-white'
                          : 'text-gray-700 hover:bg-red-50 hover:text-gradient-start'
                      }`}
                    >
                      <SafeIcon icon={item.icon} className="text-lg" />
                      <span className="font-medium">{item.label}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        </motion.nav>

        <main className="flex-1 p-6">
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