import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useData } from '../../context/DataContext';
import SafeIcon from '../../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';
import supabase from '../../lib/supabase';
import BackupReminder from './BackupReminder';

const {
  FiDownload, FiUpload, FiDatabase, FiRefreshCw, FiClock,
  FiCheck, FiAlertCircle, FiFileText, FiUsers, FiSettings, FiShield,
} = FiIcons;

const BackupSystem = () => {
  const { invoices, customers, users, settings, loadAllData } = useData();
  const [notification, setNotification] = useState(null);
  const [backupHistory, setBackupHistory] = useState([]);
  const [isCreatingBackup, setIsCreatingBackup] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [restoreProgress, setRestoreProgress] = useState({ status: '', progress: 0, message: '' });
  const fileInputRef = useRef(null);

  useEffect(() => {
    const history = JSON.parse(localStorage.getItem('backup_history') || '[]');
    setBackupHistory(history);
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  const getBackupStats = () => ({
    lastBackup: localStorage.getItem('last_backup_date'),
    autoBackupEnabled: localStorage.getItem('auto_backup_enabled') === 'true',
  });

  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 5000);
  };

  const createFullBackup = async () => {
    try {
      setIsCreatingBackup(true);
      const backupData = {
        version: '1.0',
        timestamp: new Date().toISOString(),
        system: 'Fire Force Invoice System',
        data: {
          invoices,
          customers,
          users: users.map(u => ({ ...u, password: '***ENCRYPTED***' })),
          settings,
        },
        metadata: {
          totalInvoices: invoices.length,
          totalCustomers: customers.length,
          totalUsers: users.length,
          createdBy: 'System Administrator',
          backupType: 'Full System Backup',
        },
      };

      const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `fireforce_backup_${new Date().toISOString().split('T')[0]}_${Date.now()}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      const newBackup = {
        id: Date.now(),
        timestamp: new Date().toISOString(),
        type: 'Full Backup',
        records: invoices.length + customers.length + users.length,
        size: blob.size,
      };
      const history = JSON.parse(localStorage.getItem('backup_history') || '[]');
      history.unshift(newBackup);
      history.splice(10);
      localStorage.setItem('backup_history', JSON.stringify(history));
      localStorage.setItem('last_backup_date', new Date().toISOString());
      setBackupHistory(history);
      showNotification('Full backup created successfully!', 'success');
    } catch (error) {
      showNotification('Failed to create backup: ' + error.message, 'error');
    } finally {
      setIsCreatingBackup(false);
    }
  };

  const exportDataType = (dataType) => {
    try {
      let data = [];
      let filename = '';
      if (dataType === 'invoices') { data = invoices; filename = `fireforce_invoices_${new Date().toISOString().split('T')[0]}.json`; }
      else if (dataType === 'customers') { data = customers; filename = `fireforce_customers_${new Date().toISOString().split('T')[0]}.json`; }
      else if (dataType === 'users') { data = users.map(u => ({ ...u, password: '***ENCRYPTED***' })); filename = `fireforce_users_${new Date().toISOString().split('T')[0]}.json`; }

      const blob = new Blob([JSON.stringify({ version: '1.0', timestamp: new Date().toISOString(), dataType, data }, null, 2)], { type: 'application/json' });
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

  const performDatabaseRestore = async (backupData) => {
    try {
      setRestoreProgress({ status: 'processing', progress: 10, message: 'Starting restore process...' });
      if (!backupData.data || !backupData.version) throw new Error('Invalid backup file structure');

      setRestoreProgress({ status: 'processing', progress: 20, message: 'Restoring customers...' });
      if (backupData.data.customers?.length) {
        await supabase.from('customers_ff2024').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        for (const c of backupData.data.customers) {
          await supabase.from('customers_ff2024').insert([{
            id: c.id, name: c.name || '', company: c.company || '',
            email: c.email || '', phone: c.phone || '',
            bill_to_address: c.billToAddress || '', ship_to_address: c.shipToAddress || '',
            accounts_payable_email: c.accountsPayableEmail || '',
          }]);
        }
      }

      setRestoreProgress({ status: 'processing', progress: 40, message: 'Restoring users...' });
      if (backupData.data.users?.length) {
        await supabase.from('users_ff2024').delete().eq('role', 'salesman');
        for (const u of backupData.data.users) {
          if (u.role === 'office') continue;
          await supabase.from('users_ff2024').insert([{
            id: u.id, username: u.username, name: u.name,
            email: u.email || '', phone: u.phone || '',
            role: u.role, password_hash: 'default123',
          }]);
        }
      }

      setRestoreProgress({ status: 'processing', progress: 60, message: 'Restoring invoices...' });
      if (backupData.data.invoices?.length) {
        await supabase.from('invoice_items_ff2024').delete().neq('invoice_id', '00000000-0000-0000-0000-000000000000');
        await supabase.from('invoices_ff2024').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        for (const inv of backupData.data.invoices) {
          await supabase.from('invoices_ff2024').insert([{
            id: inv.id, date: inv.date, po_number: inv.poNumber || '',
            sales_rep: inv.salesRep || '', transaction_type: inv.transactionType || 'Sales Order',
            customer_name: inv.customerName || '', company: inv.company || '',
            customer_email: inv.customerEmail || '', customer_phone: inv.customerPhone || '',
            accounts_payable_email: inv.accountsPayableEmail || '',
            bill_to_address: inv.billToAddress || '', ship_to_address: inv.shipToAddress || '',
            shipping_cost: inv.shippingCost || 0, additional_info: inv.additionalInfo || '',
            status: inv.status || 'pending', tax_rate: inv.taxRate || 8.0,
            subtotal: inv.subtotal || 0, tax: inv.tax || 0, grand_total: inv.grandTotal || 0,
            archived: inv.archived || false,
          }]);
          if (inv.items?.length) {
            for (const item of inv.items) {
              await supabase.from('invoice_items_ff2024').insert([{
                invoice_id: inv.id, mfg: item.mfg || '', part_number: item.partNumber || '',
                description: item.description || '', qty: item.qty || 0,
                unit_price: item.unitPrice || 0, taxable: item.taxable ?? true,
              }]);
            }
          }
        }
      }

      setRestoreProgress({ status: 'processing', progress: 80, message: 'Restoring settings...' });
      if (backupData.data.settings?.taxRate !== undefined) {
        await supabase.from('settings_ff2024').upsert(
          [{ key: 'tax_rate', value: backupData.data.settings.taxRate.toString() }],
          { onConflict: 'key' }
        );
      }

      setRestoreProgress({ status: 'processing', progress: 95, message: 'Finalizing...' });
      await loadAllData();
      setRestoreProgress({ status: 'completed', progress: 100, message: 'Restore completed successfully!' });
      return true;
    } catch (error) {
      setRestoreProgress({ status: 'error', progress: 0, message: 'Restore failed: ' + error.message });
      return false;
    }
  };

  const handleFileRestore = async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    try {
      setIsRestoring(true);
      setRestoreProgress({ status: 'starting', progress: 0, message: 'Reading backup file...' });
      const text = await file.text();
      const backupData = JSON.parse(text);
      if (!backupData.version || !backupData.data) throw new Error('Invalid backup file format');

      const confirmed = window.confirm(
        `Restore from backup?\n\nDate: ${new Date(backupData.timestamp).toLocaleString()}\n` +
        `Invoices: ${backupData.metadata?.totalInvoices || 'N/A'}\n` +
        `Customers: ${backupData.metadata?.totalCustomers || 'N/A'}\n\n` +
        `WARNING: This will replace all current data!`
      );
      if (!confirmed) { setIsRestoring(false); setRestoreProgress({ status: '', progress: 0, message: '' }); return; }

      const success = await performDatabaseRestore(backupData);
      if (success) {
        showNotification('Database restored successfully!', 'success');
        localStorage.setItem('last_backup_date', new Date().toISOString());
      } else {
        showNotification('Restore failed. Check console for details.', 'error');
      }
    } catch (error) {
      showNotification('Restore failed: ' + error.message, 'error');
      setRestoreProgress({ status: 'error', progress: 0, message: 'Error: ' + error.message });
    } finally {
      setIsRestoring(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const toggleAutoBackup = () => {
    const current = localStorage.getItem('auto_backup_enabled') === 'true';
    localStorage.setItem('auto_backup_enabled', (!current).toString());
    showNotification(`Auto backup ${!current ? 'enabled' : 'disabled'}.`, 'success');
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return '0 Bytes';
    const k = 1024, sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const stats = getBackupStats();

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <SafeIcon icon={FiShield} className="text-2xl text-blue-600" />
          <h2 className="text-2xl font-title font-bold text-gray-900">Backup & Restore</h2>
        </div>
        <div className="flex items-center space-x-4 bg-white px-4 py-2 rounded-lg shadow-sm border border-gray-200">
          <div className="text-right border-r border-gray-100 pr-4">
            <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Last Backup</div>
            <div className="text-sm font-semibold text-gray-900">
              {stats.lastBackup ? new Date(stats.lastBackup).toLocaleDateString() : 'Never'}
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <div className={`w-2 h-2 rounded-full ${stats.autoBackupEnabled ? 'bg-green-500 animate-pulse' : 'bg-gray-300'}`}></div>
            <span className={`text-sm font-medium ${stats.autoBackupEnabled ? 'text-green-700' : 'text-gray-500'}`}>
              {stats.autoBackupEnabled ? 'Auto-Backup On' : 'Auto-Backup Off'}
            </span>
          </div>
        </div>
      </div>

      <BackupReminder onCreateBackup={createFullBackup} />

      {notification && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
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

      {/* Main Actions */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-xl shadow-sm border border-gray-200"
      >
        <div className="p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center">
            <SafeIcon icon={FiDatabase} className="mr-2 text-gray-400" />
            System Management
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-5 border border-blue-100 bg-blue-50/30 rounded-xl">
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600">
                  <SafeIcon icon={FiDownload} />
                </div>
                <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded">RECOMMENDED</span>
              </div>
              <h4 className="font-bold text-gray-900 mb-1">Create Full Backup</h4>
              <p className="text-xs text-gray-500 mb-4">Download a complete copy of all invoices, customers, and user data.</p>
              <button onClick={createFullBackup} disabled={isCreatingBackup}
                className="w-full flex items-center justify-center space-x-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-all"
              >
                <SafeIcon icon={isCreatingBackup ? FiRefreshCw : FiDownload} className={isCreatingBackup ? 'animate-spin' : ''} />
                <span>{isCreatingBackup ? 'Creating...' : 'Download Backup'}</span>
              </button>
            </div>

            <div className="p-5 border border-gray-200 bg-gray-50/30 rounded-xl">
              <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center text-gray-600 mb-4">
                <SafeIcon icon={FiUpload} />
              </div>
              <h4 className="font-bold text-gray-900 mb-1">Restore System</h4>
              <p className="text-xs text-gray-500 mb-4">Restore data from a previously saved backup file.</p>
              <input ref={fileInputRef} type="file" accept=".json" onChange={handleFileRestore} className="hidden" />
              <button onClick={() => fileInputRef.current?.click()} disabled={isRestoring}
                className="w-full flex items-center justify-center space-x-2 px-4 py-2.5 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-all"
              >
                <SafeIcon icon={isRestoring ? FiRefreshCw : FiUpload} className={isRestoring ? 'animate-spin' : ''} />
                <span>{isRestoring ? 'Processing...' : 'Upload & Restore'}</span>
              </button>
            </div>
          </div>

          {restoreProgress.status && (
            <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <div className="flex justify-between mb-2">
                <span className="text-xs font-semibold text-gray-700">{restoreProgress.message}</span>
                <span className="text-xs font-bold text-gray-900">{restoreProgress.progress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all duration-300 ${
                    restoreProgress.status === 'error' ? 'bg-red-500' :
                    restoreProgress.status === 'completed' ? 'bg-green-500' : 'bg-blue-500'
                  }`}
                  style={{ width: `${restoreProgress.progress}%` }}
                />
              </div>
            </div>
          )}

          <div className="mt-6 pt-6 border-t border-gray-100 flex items-center justify-between">
            <div>
              <h4 className="text-sm font-bold text-gray-900">Automatic Daily Backups</h4>
              <p className="text-xs text-gray-500 mt-1">System will remind you to back up every 24 hours.</p>
            </div>
            <button onClick={toggleAutoBackup}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${stats.autoBackupEnabled ? 'bg-blue-600' : 'bg-gray-200'}`}
            >
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${stats.autoBackupEnabled ? 'translate-x-6' : 'translate-x-1'}`} />
            </button>
          </div>
        </div>
      </motion.div>

      {/* Quick Export */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        className="bg-white rounded-xl shadow-sm border border-gray-200"
      >
        <div className="p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
            <SafeIcon icon={FiFileText} className="mr-2 text-gray-400" />
            Quick Export
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {[
              { type: 'invoices', icon: FiFileText, label: 'Export Invoices' },
              { type: 'customers', icon: FiUsers, label: 'Export Customers' },
              { type: 'users', icon: FiSettings, label: 'Export Users' },
            ].map(({ type, icon, label }) => (
              <button key={type} onClick={() => exportDataType(type)}
                className="flex items-center justify-center space-x-2 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-gray-300 text-gray-700 transition-all text-sm font-medium"
              >
                <SafeIcon icon={icon} className="text-gray-400" />
                <span>{label}</span>
              </button>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Backup History */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
        className="bg-white rounded-xl shadow-sm border border-gray-200"
      >
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-bold text-gray-900">Recent History</h3>
        </div>
        {backupHistory.length > 0 ? (
          <div className="divide-y divide-gray-100">
            {backupHistory.map((backup) => (
              <div key={backup.id} className="flex items-center justify-between p-4 hover:bg-gray-50">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                    <SafeIcon icon={FiClock} className="text-gray-500 text-xs" />
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-900">{backup.type}</div>
                    <div className="text-xs text-gray-500">{new Date(backup.timestamp).toLocaleString()}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs font-bold text-gray-700">{backup.records} records</div>
                  <div className="text-[10px] text-gray-400">{formatFileSize(backup.size)}</div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-400 text-sm">No backup history available</div>
        )}
      </motion.div>

      <div className="text-center">
        <p className="text-xs text-gray-400 flex items-center justify-center">
          <SafeIcon icon={FiShield} className="mr-1.5" />
          Backups exclude user passwords for security.
        </p>
      </div>
    </div>
  );
};

export default BackupSystem;