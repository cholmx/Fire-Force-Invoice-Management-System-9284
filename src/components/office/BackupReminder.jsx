import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { backupScheduler } from '../../utils/backupScheduler';
import SafeIcon from '../../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';

const { FiX, FiDownload, FiClock, FiAlertCircle, FiCheckCircle } = FiIcons;

const BackupReminder = ({ onCreateBackup }) => {
  const [visible, setVisible] = useState(false);
  const [lastBackup, setLastBackup] = useState(null);
  const [daysSinceBackup, setDaysSinceBackup] = useState(0);

  // Check if reminder should be shown
  useEffect(() => {
    const checkReminder = () => {
      if (backupScheduler.isReminderDue()) {
        const lastBackupDate = backupScheduler.getLastBackupDate();
        setLastBackup(lastBackupDate);
        
        if (lastBackupDate) {
          const now = new Date();
          const diffTime = Math.abs(now - lastBackupDate);
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          setDaysSinceBackup(diffDays);
        }
        
        setVisible(true);
      }
    };

    // Check on component mount
    checkReminder();
    
    // Listen for reminder events
    const handleReminderEvent = (event) => {
      const { lastBackup } = event.detail;
      setLastBackup(lastBackup);
      
      if (lastBackup) {
        const now = new Date();
        const diffTime = Math.abs(now - new Date(lastBackup));
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        setDaysSinceBackup(diffDays);
      }
      
      setVisible(true);
    };
    
    window.addEventListener('backup-reminder-due', handleReminderEvent);
    
    return () => {
      window.removeEventListener('backup-reminder-due', handleReminderEvent);
    };
  }, []);

  // Dismiss the reminder
  const handleDismiss = () => {
    backupScheduler.dismissReminder();
    setVisible(false);
  };

  // Handle backup creation
  const handleBackupNow = () => {
    if (onCreateBackup && typeof onCreateBackup === 'function') {
      onCreateBackup();
    }
    handleDismiss();
  };

  if (!visible) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -50 }}
        className="fixed top-4 right-4 left-4 md:left-auto md:w-96 z-50"
      >
        <div className="bg-white rounded-lg shadow-xl border-l-4 border-amber-500 overflow-hidden">
          <div className="flex items-center justify-between bg-amber-50 p-4">
            <div className="flex items-center space-x-2">
              <SafeIcon icon={FiAlertCircle} className="text-amber-500 text-xl" />
              <h3 className="font-semibold text-amber-800">Backup Reminder</h3>
            </div>
            <button
              onClick={handleDismiss}
              className="text-gray-400 hover:text-gray-600"
              aria-label="Dismiss"
            >
              <SafeIcon icon={FiX} />
            </button>
          </div>
          
          <div className="p-4">
            <div className="mb-4">
              {daysSinceBackup > 0 ? (
                <p className="text-gray-700">
                  It's been <span className="font-bold text-amber-600">{daysSinceBackup} {daysSinceBackup === 1 ? 'day' : 'days'}</span> since your last backup.
                </p>
              ) : (
                <p className="text-gray-700">
                  Please download a backup of your system data to prevent data loss.
                </p>
              )}
              
              {lastBackup && (
                <div className="flex items-center text-sm text-gray-500 mt-2">
                  <SafeIcon icon={FiClock} className="mr-1" />
                  <span>Last backup: {new Date(lastBackup).toLocaleDateString()} at {new Date(lastBackup).toLocaleTimeString()}</span>
                </div>
              )}
            </div>
            
            <div className="flex space-x-3">
              <button
                onClick={handleBackupNow}
                className="flex-1 bg-brand-gradient hover:bg-brand-gradient-hover text-white py-2 px-4 rounded flex items-center justify-center space-x-2"
              >
                <SafeIcon icon={FiDownload} />
                <span>Backup Now</span>
              </button>
              
              <button
                onClick={handleDismiss}
                className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 px-4 rounded"
              >
                Remind Later
              </button>
            </div>
            
            <div className="mt-3 text-xs text-gray-500 flex items-center">
              <SafeIcon icon={FiCheckCircle} className="mr-1 text-green-500" />
              <span>Regular backups help protect your business data</span>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default BackupReminder;