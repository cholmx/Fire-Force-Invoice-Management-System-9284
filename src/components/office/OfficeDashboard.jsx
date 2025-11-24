import React, { useState, useEffect } from 'react';
import { Routes, Route, Link, useLocation, useNavigate } from 'react-router-dom';
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

const { FiBarChart3, FiFileText, FiUsers, FiSettings, FiUserCheck, FiShield } = FiIcons;

const OfficeDashboard = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [showBackupReminder, setShowBackupReminder] = useState(false);

  // Persistent navigation state
  useEffect(() => {
    // Save current path to localStorage whenever it changes
    // Only save sub-paths of /office, but not the root /office itself to avoid loops
    if (location.pathname !== '/office') {
      localStorage.setItem('last_office_path', location.pathname);
    }
  }, [location]);

  useEffect(() => {
    // Restore last path on mount if on root /office
    const lastPath = localStorage.getItem('last_office_path');
    if (location.pathname === '/office' && lastPath && lastPath.startsWith('/office')) {
      navigate(lastPath, { replace: true });
    }
  }, []); // Run once on mount

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
    { path: '/office/invoices', label: 'Invoices', icon: FiFileText },
    { path: '/office/customers', label: 'Customers', icon: FiUsers },
    { path: '/office/users', label: 'Users', icon: FiUserCheck },
    { path: '/office/backup', label: 'Backup', icon: FiShield },
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
    <div className="min-h-screen bg-[#f8f9fa]">
      <Header title="Office" />
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
          {/* Backup Reminder */}
          {showBackupReminder && location.pathname !== '/office/backup' && (
            <div className="mb-6">
              <BackupReminder onCreateBackup={handleBackupCreated} onDismiss={handleDismissReminder} />
            </div>
          )}
          
          <Routes>
            <Route path="/" element={<OfficeStats />} />
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