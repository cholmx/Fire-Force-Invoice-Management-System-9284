import React, { useState, useEffect } from 'react';
import { Routes, Route, Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import Header from '../layout/Header';
import InvoiceForm from '../invoice/InvoiceForm';
import InvoiceList from '../invoice/InvoiceList';
import CustomerManagement from '../customer/CustomerManagement';
import OfficeStats from './OfficeStats';
import Settings from './Settings';
import UserManagement from './UserManagement';
import BackupSystem from './BackupSystem';
import BackupReminder from './BackupReminder';
import { backupScheduler } from '../../utils/backupScheduler';
import SafeIcon from '../../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';

const { FiBarChart3, FiFileText, FiUsers, FiSettings, FiUserCheck, FiPlus, FiShield } = FiIcons;

const OfficeDashboard = () => {
  const location = useLocation();
  const [showBackupReminder, setShowBackupReminder] = useState(false);

  // Check if a backup reminder should be shown
  useEffect(() => {
    const checkReminder = () => {
      if (backupScheduler.isReminderDue()) {
        setShowBackupReminder(true);
      }
    };
    
    // Initial check
    checkReminder();
    
    // Setup listener for reminder events
    const handleReminderEvent = () => {
      setShowBackupReminder(true);
    };
    
    window.addEventListener('backup-reminder-due', handleReminderEvent);
    
    // Check periodically (every 15 minutes)
    const intervalId = setInterval(checkReminder, 15 * 60 * 1000);
    
    return () => {
      window.removeEventListener('backup-reminder-due', handleReminderEvent);
      clearInterval(intervalId);
    };
  }, []);

  const navItems = [
    { path: '/office', label: 'Dashboard', icon: FiBarChart3 },
    { path: '/office/invoice/new', label: 'New Invoice', icon: FiPlus },
    { path: '/office/invoices', label: 'All Invoices', icon: FiFileText },
    { path: '/office/customers', label: 'Customers', icon: FiUsers },
    { path: '/office/users', label: 'User Management', icon: FiUserCheck },
    { path: '/office/backup', label: 'Backup System', icon: FiShield },
    { path: '/office/settings', label: 'Settings', icon: FiSettings }
  ];

  const handleBackupCreated = () => {
    setShowBackupReminder(false);
    // Set last backup date
    localStorage.setItem('last_backup_date', new Date().toISOString());
  };

  const handleDismissReminder = () => {
    setShowBackupReminder(false);
    backupScheduler.dismissReminder();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header title="Office Dashboard" />
      
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
          {/* Backup Reminder */}
          {showBackupReminder && location.pathname !== '/office/backup' && (
            <BackupReminder 
              onCreateBackup={handleBackupCreated} 
              onDismiss={handleDismissReminder}
            />
          )}
          
          <Routes>
            <Route path="/" element={<OfficeStats />} />
            <Route path="/invoice/new" element={<InvoiceForm />} />
            <Route path="/invoice/edit/:id" element={<InvoiceForm />} />
            <Route path="/invoices" element={<InvoiceList userRole="office" />} />
            <Route path="/customers" element={<CustomerManagement />} />
            <Route path="/users" element={<UserManagement />} />
            <Route path="/backup" element={<BackupSystem />} />
            <Route path="/settings" element={<Settings />} />
          </Routes>
        </main>
      </div>
    </div>
  );
};

export default OfficeDashboard;