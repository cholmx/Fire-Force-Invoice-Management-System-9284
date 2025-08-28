import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useData } from '../../context/DataContext';
import SafeIcon from '../../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';
import BackupReminder from './BackupReminder';
import { backupScheduler } from '../../utils/backupScheduler';

const { FiDownload, FiUpload, FiDatabase, FiSave, FiRefreshCw, FiCalendar, FiClock, FiCheck, FiAlertCircle, FiFileText, FiUsers, FiSettings, FiShield } = FiIcons;

const BackupSystem = () => {
  const { invoices, customers, users, officeInfo, settings, loadAllData } = useData();
  const [notification, setNotification] = useState(null);
  const [backupHistory, setBackupHistory] = useState([]);
  const [isCreatingBackup, setIsCreatingBackup] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [restoreProgress, setRestoreProgress] = useState({
    status: '',
    progress: 0,
    message: ''
  });
  const fileInputRef = useRef(null);

  // Get backup statistics
  const getBackupStats = () => {
    return {
      invoices: invoices.length,
      customers: customers.length,
      users: users.length,
      totalRecords: invoices.length + customers.length + users.length + 1, // +1 for office info
      lastBackup: localStorage.getItem('last_backup_date'),
      autoBackupEnabled: localStorage.getItem('auto_backup_enabled') === 'true',
      remindersDismissed: localStorage.getItem('reminder_dismissed_date')
    };
  };

  // Show notification
  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 5000);
  };

  // Fixed office information that should always remain the same
  const fixedOfficeInfo = {
    companyName: 'Fire Force',
    address: 'P.O. Box 552, Columbiana Ohio 44408',
    phone: '330-482-9300',
    emergencyPhone: '724-586-6577',
    email: 'Lizfireforce@yahoo.com',
    serviceEmail: 'fireforcebutler@gmail.com',
    username: 'ffoffice1',
    password: 'ffpassword', // This would normally be hashed in a real system
    ohPhone: '330-482-9300',
    ohEmail: 'Lizfireforce@yahoo.com',
    paPhone: '724-586-6577',
    paEmail: 'fireforcebutler@gmail.com'
  };

  // Create full backup
  const createFullBackup = async () => {
    try {
      setIsCreatingBackup(true);

      const backupData = {
        version: '1.0',
        timestamp: new Date().toISOString(),
        system: 'Fire Force Invoice System',
        data: {
          invoices: invoices,
          customers: customers,
          users: users.map(user => ({
            ...user,
            password: '***ENCRYPTED***' // Don't backup actual passwords
          })),
          officeInfo: fixedOfficeInfo, // Use fixed office info
          settings: settings
        },
        metadata: {
          totalInvoices: invoices.length,
          totalCustomers: customers.length,
          totalUsers: users.length,
          createdBy: 'System Administrator',
          backupType: 'Full System Backup'
        }
      };

      // Create downloadable file
      const blob = new Blob([JSON.stringify(backupData, null, 2)], {
        type: 'application/json'
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `fireforce_backup_${new Date().toISOString().split('T')[0]}_${Date.now()}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      // Update backup history
      const newBackup = {
        id: Date.now(),
        timestamp: new Date().toISOString(),
        type: 'Full Backup',
        records: backupData.metadata.totalInvoices + backupData.metadata.totalCustomers + backupData.metadata.totalUsers,
        size: blob.size
      };

      const history = JSON.parse(localStorage.getItem('backup_history') || '[]');
      history.unshift(newBackup);
      history.splice(10); // Keep only last 10 backups in history
      localStorage.setItem('backup_history', JSON.stringify(history));
      localStorage.setItem('last_backup_date', new Date().toISOString());
      setBackupHistory(history);

      showNotification('Full backup created successfully!', 'success');
    } catch (error) {
      console.error('Backup creation failed:', error);
      showNotification('Failed to create backup: ' + error.message, 'error');
    } finally {
      setIsCreatingBackup(false);
    }
  };

  // Export specific data type
  const exportDataType = (dataType) => {
    try {
      let data = [];
      let filename = '';

      switch (dataType) {
        case 'invoices':
          data = invoices;
          filename = `fireforce_invoices_${new Date().toISOString().split('T')[0]}.json`;
          break;
        case 'customers':
          data = customers;
          filename = `fireforce_customers_${new Date().toISOString().split('T')[0]}.json`;
          break;
        case 'users':
          data = users.map(user => ({
            ...user,
            password: '***ENCRYPTED***'
          }));
          filename = `fireforce_users_${new Date().toISOString().split('T')[0]}.json`;
          break;
        default:
          throw new Error('Invalid data type');
      }

      const exportData = {
        version: '1.0',
        timestamp: new Date().toISOString(),
        dataType: dataType,
        records: data.length,
        data: data
      };

      const blob = new Blob([JSON.stringify(exportData, null, 2)], {
        type: 'application/json'
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      showNotification(`${dataType.charAt(0).toUpperCase() + dataType.slice(1)} exported successfully!`, 'success');
    } catch (error) {
      showNotification('Export failed: ' + error.message, 'error');
    }
  };

  // Actual database restore functionality
  const performDatabaseRestore = async (backupData) => {
    try {
      setRestoreProgress({
        status: 'processing',
        progress: 10,
        message: 'Starting restore process...'
      });

      // First, verify the backup data structure
      if (!backupData.data || !backupData.version || !backupData.timestamp) {
        throw new Error('Invalid backup file structure');
      }

      setRestoreProgress({
        status: 'processing',
        progress: 20,
        message: 'Restoring customers...'
      });

      // Restore customers
      if (backupData.data.customers && Array.isArray(backupData.data.customers)) {
        localStorage.setItem('fireforce_customers', JSON.stringify(backupData.data.customers));
      }

      setRestoreProgress({
        status: 'processing',
        progress: 40,
        message: 'Restoring users...'
      });

      // Restore users (only salesmen, preserve office accounts)
      if (backupData.data.users && Array.isArray(backupData.data.users)) {
        const salesmenUsers = backupData.data.users.filter(user => user.role === 'salesman');
        localStorage.setItem('fireforce_users', JSON.stringify(salesmenUsers));
      }

      setRestoreProgress({
        status: 'processing',
        progress: 60,
        message: 'Restoring invoices...'
      });

      // Restore invoices
      if (backupData.data.invoices && Array.isArray(backupData.data.invoices)) {
        localStorage.setItem('fireforce_invoices', JSON.stringify(backupData.data.invoices));
      }

      setRestoreProgress({
        status: 'processing',
        progress: 80,
        message: 'Restoring settings...'
      });

      // Restore settings
      if (backupData.data.settings) {
        localStorage.setItem('fireforce_settings', JSON.stringify(backupData.data.settings));
      }

      setRestoreProgress({
        status: 'processing',
        progress: 95,
        message: 'Finalizing restore...'
      });

      // Reload all data
      await loadAllData();

      setRestoreProgress({
        status: 'completed',
        progress: 100,
        message: 'Restore completed successfully!'
      });

      return true;
    } catch (error) {
      console.error('Database restore failed:', error);
      setRestoreProgress({
        status: 'error',
        progress: 0,
        message: 'Restore failed: ' + error.message
      });
      return false;
    }
  };

  // Handle file restore
  const handleFileRestore = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    try {
      setIsRestoring(true);
      setRestoreProgress({
        status: 'starting',
        progress: 0,
        message: 'Reading backup file...'
      });

      const text = await file.text();
      const backupData = JSON.parse(text);

      // Validate backup file
      if (!backupData.version || !backupData.data) {
        throw new Error('Invalid backup file format');
      }

      // Show confirmation dialog
      const confirmed = window.confirm(
        `Are you sure you want to restore from this backup?\n\n` +
        `Backup Date: ${new Date(backupData.timestamp).toLocaleString()}\n` +
        `Invoices: ${backupData.metadata?.totalInvoices || 'N/A'}\n` +
        `Customers: ${backupData.metadata?.totalCustomers || 'N/A'}\n` +
        `Users: ${backupData.metadata?.totalUsers || 'N/A'}\n\n` +
        `WARNING: This will replace all current data except for office information!`
      );

      if (!confirmed) {
        setIsRestoring(false);
        setRestoreProgress({
          status: '',
          progress: 0,
          message: ''
        });
        return;
      }

      // Perform the actual database restore
      const success = await performDatabaseRestore(backupData);

      if (success) {
        showNotification('Database restored successfully!', 'success');
        // Update last backup date since we just restored from a backup
        localStorage.setItem('last_backup_date', new Date().toISOString());
      } else {
        showNotification('Restore failed. Please check the console for details.', 'error');
      }
    } catch (error) {
      console.error('Restore failed:', error);
      showNotification('Restore failed: ' + error.message, 'error');
      setRestoreProgress({
        status: 'error',
        progress: 0,
        message: 'Error: ' + error.message
      });
    } finally {
      setIsRestoring(false);
      // Clear file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Toggle auto backup
  const toggleAutoBackup = () => {
    const current = localStorage.getItem('auto_backup_enabled') === 'true';
    localStorage.setItem('auto_backup_enabled', (!current).toString());
    showNotification(
      `Auto backup ${!current ? 'enabled' : 'disabled'}. ${!current ? 'Daily backups will be created automatically.' : ''}`,
      'success'
    );
  };

  // Format file size
  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Load backup history on component mount
  React.useEffect(() => {
    const history = JSON.parse(localStorage.getItem('backup_history') || '[]');
    setBackupHistory(history);

    // Request notification permission
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  const stats = getBackupStats();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-3">
        <SafeIcon icon={FiShield} className="text-2xl text-blue-600" />
        <h2 className="text-2xl font-title font-bold text-gray-900">Backup & Restore System</h2>
      </div>

      {/* Backup Reminder */}
      <BackupReminder onCreateBackup={createFullBackup} />

      {/* Notification */}
      {notification && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className={`p-4 rounded-lg flex items-start space-x-2 ${
            notification.type === 'success'
              ? 'bg-green-50 text-green-800 border border-green-200'
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}
        >
          <SafeIcon icon={notification.type === 'success' ? FiCheck : FiAlertCircle} className="flex-shrink-0 mt-0.5" />
          <span className="text-sm">{notification.message}</span>
        </motion.div>
      )}

      {/* System Status */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-xl shadow-lg"
      >
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-title font-semibold text-gray-900">System Status</h3>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
                <SafeIcon icon={FiFileText} className="text-blue-600 text-xl" />
              </div>
              <div className="text-2xl font-bold text-gray-900">{stats.invoices}</div>
              <div className="text-sm text-gray-600">Invoices</div>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
                <SafeIcon icon={FiUsers} className="text-green-600 text-xl" />
              </div>
              <div className="text-2xl font-bold text-gray-900">{stats.customers}</div>
              <div className="text-sm text-gray-600">Customers</div>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-2">
                <SafeIcon icon={FiSettings} className="text-purple-600 text-xl" />
              </div>
              <div className="text-2xl font-bold text-gray-900">{stats.users}</div>
              <div className="text-sm text-gray-600">Users</div>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-2">
                <SafeIcon icon={FiDatabase} className="text-orange-600 text-xl" />
              </div>
              <div className="text-2xl font-bold text-gray-900">{stats.totalRecords}</div>
              <div className="text-sm text-gray-600">Total Records</div>
            </div>
          </div>

          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-gray-700">Last Backup</div>
                <div className="text-sm text-gray-600">
                  {stats.lastBackup ? new Date(stats.lastBackup).toLocaleString() : 'Never'}
                </div>
              </div>
              <div>
                <div className="text-sm font-medium text-gray-700">Auto Backup</div>
                <div className={`text-sm ${stats.autoBackupEnabled ? 'text-green-600' : 'text-red-600'}`}>
                  {stats.autoBackupEnabled ? 'Enabled' : 'Disabled'}
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Office Information Display */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white rounded-xl shadow-lg"
      >
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-title font-semibold text-gray-900">Office Information</h3>
          <p className="text-sm text-gray-600 mt-1">
            This information is preserved during backup/restore operations
          </p>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium text-gray-900 mb-4">Company Information</h4>
              <div className="space-y-3 text-sm text-gray-600">
                <div>
                  <strong>Company:</strong> {fixedOfficeInfo.companyName}
                </div>
                <div>
                  <strong>Address:</strong> {fixedOfficeInfo.address}
                </div>
                <div>
                  <strong>Username:</strong> {fixedOfficeInfo.username}
                </div>
              </div>
            </div>
            <div>
              <h4 className="font-medium text-gray-900 mb-4">Contact Information</h4>
              <div className="space-y-3 text-sm text-gray-600">
                <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                  <div className="font-semibold text-blue-900">Ohio Office</div>
                  <div>
                    <strong>Phone:</strong> {fixedOfficeInfo.ohPhone}
                  </div>
                  <div>
                    <strong>Email:</strong> {fixedOfficeInfo.ohEmail}
                  </div>
                </div>
                <div className="bg-purple-50 p-3 rounded-lg border border-purple-200">
                  <div className="font-semibold text-purple-900">Pennsylvania Office</div>
                  <div>
                    <strong>Phone:</strong> {fixedOfficeInfo.paPhone}
                  </div>
                  <div>
                    <strong>Email:</strong> {fixedOfficeInfo.paEmail}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Backup Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white rounded-xl shadow-lg"
      >
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-title font-semibold text-gray-900">Backup Actions</h3>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Full Backup */}
            <div className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center space-x-3 mb-3">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <SafeIcon icon={FiDatabase} className="text-blue-600" />
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900">Full System Backup</h4>
                  <p className="text-sm text-gray-600">Complete backup of all data</p>
                </div>
              </div>
              <button
                onClick={createFullBackup}
                disabled={isCreatingBackup}
                className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <SafeIcon icon={isCreatingBackup ? FiRefreshCw : FiDownload} className={isCreatingBackup ? 'animate-spin' : ''} />
                <span>{isCreatingBackup ? 'Creating Backup...' : 'Create Full Backup'}</span>
              </button>
            </div>

            {/* Restore */}
            <div className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center space-x-3 mb-3">
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                  <SafeIcon icon={FiUpload} className="text-green-600" />
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900">Restore System</h4>
                  <p className="text-sm text-gray-600">Restore from backup file</p>
                </div>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={handleFileRestore}
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isRestoring}
                className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <SafeIcon icon={isRestoring ? FiRefreshCw : FiUpload} className={isRestoring ? 'animate-spin' : ''} />
                <span>{isRestoring ? 'Processing...' : 'Restore from File'}</span>
              </button>

              {/* Restore Progress */}
              {restoreProgress.status && (
                <div className="mt-4">
                  <div className="flex justify-between mb-1">
                    <span className="text-xs font-medium text-gray-700">{restoreProgress.message}</span>
                    <span className="text-xs font-medium text-gray-700">{restoreProgress.progress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div
                      className={`h-2.5 rounded-full ${
                        restoreProgress.status === 'error'
                          ? 'bg-red-600'
                          : restoreProgress.status === 'completed'
                          ? 'bg-green-600'
                          : 'bg-blue-600'
                      }`}
                      style={{ width: `${restoreProgress.progress}%` }}
                    ></div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Auto Backup Toggle */}
          <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-gray-900">Automatic Backups</h4>
                <p className="text-sm text-gray-600">
                  Automatically create daily backups of your system data
                </p>
              </div>
              <button
                onClick={toggleAutoBackup}
                className={`px-4 py-2 rounded-lg text-sm font-medium ${
                  stats.autoBackupEnabled
                    ? 'bg-red-600 text-white hover:bg-red-700'
                    : 'bg-green-600 text-white hover:bg-green-700'
                }`}
              >
                {stats.autoBackupEnabled ? 'Disable' : 'Enable'}
              </button>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Data Export */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-white rounded-xl shadow-lg"
      >
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-title font-semibold text-gray-900">Data Export</h3>
          <p className="text-sm text-gray-600 mt-1">Export specific data types separately</p>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button
              onClick={() => exportDataType('invoices')}
              className="flex items-center space-x-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                <SafeIcon icon={FiFileText} className="text-red-600" />
              </div>
              <div className="text-left">
                <div className="font-medium text-gray-900">Export Invoices</div>
                <div className="text-sm text-gray-600">{stats.invoices} records</div>
              </div>
            </button>

            <button
              onClick={() => exportDataType('customers')}
              className="flex items-center space-x-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                <SafeIcon icon={FiUsers} className="text-green-600" />
              </div>
              <div className="text-left">
                <div className="font-medium text-gray-900">Export Customers</div>
                <div className="text-sm text-gray-600">{stats.customers} records</div>
              </div>
            </button>

            <button
              onClick={() => exportDataType('users')}
              className="flex items-center space-x-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                <SafeIcon icon={FiSettings} className="text-purple-600" />
              </div>
              <div className="text-left">
                <div className="font-medium text-gray-900">Export Users</div>
                <div className="text-sm text-gray-600">{stats.users} records</div>
              </div>
            </button>
          </div>
        </div>
      </motion.div>

      {/* Backup History */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-white rounded-xl shadow-lg"
      >
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-title font-semibold text-gray-900">Backup History</h3>
          <p className="text-sm text-gray-600 mt-1">Recent backup activities</p>
        </div>
        <div className="p-6">
          {backupHistory.length > 0 ? (
            <div className="space-y-3">
              {backupHistory.map((backup, index) => (
                <div
                  key={backup.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <SafeIcon icon={FiSave} className="text-blue-600 text-sm" />
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">{backup.type}</div>
                      <div className="text-sm text-gray-600">
                        {new Date(backup.timestamp).toLocaleString()}
                      </div>
                    </div>
                  </div>
                  <div className="text-right text-sm text-gray-600">
                    <div>{backup.records} records</div>
                    <div>{formatFileSize(backup.size)}</div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <SafeIcon icon={FiClock} className="text-4xl text-gray-300 mx-auto mb-2" />
              <p className="text-gray-500">No backup history available</p>
              <p className="text-sm text-gray-400 mt-1">Create your first backup to see history</p>
            </div>
          )}
        </div>
      </motion.div>

      {/* Security Notice */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="bg-amber-50 border border-amber-200 rounded-xl p-6"
      >
        <div className="flex items-start space-x-3">
          <SafeIcon icon={FiShield} className="text-amber-600 text-xl flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-medium text-amber-800 mb-2">Security Notice</h4>
            <div className="text-sm text-amber-700 space-y-1">
              <p>• Backup files contain sensitive business data. Store them securely.</p>
              <p>• User passwords are not included in backups for security reasons.</p>
              <p>• Office information is protected and preserved during restore operations.</p>
              <p>• Restore operations require IT administrator privileges.</p>
              <p>• Always verify backup integrity before relying on them for recovery.</p>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default BackupSystem;