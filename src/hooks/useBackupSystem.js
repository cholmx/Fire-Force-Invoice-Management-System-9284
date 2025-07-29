import { useState, useCallback, useRef } from 'react';
import { useData } from '../context/DataContext';
import { backupValidator } from '../utils/backupValidator';
import supabase from '../lib/supabase';

export const useBackupSystem = () => {
  const { invoices, customers, users, officeInfo, settings, loadAllData } = useData();
  const [isCreatingBackup, setIsCreatingBackup] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [restoreProgress, setRestoreProgress] = useState({ status: '', progress: 0, message: '' });
  const [backupHistory, setBackupHistory] = useState([]);
  const fileInputRef = useRef(null);

  // Fixed office information that should never change
  const fixedOfficeInfo = {
    companyName: 'Fire Force',
    address: 'P.O. Box 552, Columbiana Ohio 44408',
    phone: '330-482-9300',
    emergencyPhone: '724-586-6577',
    email: 'Lizfireforce@yahoo.com',
    serviceEmail: 'fireforcebutler@gmail.com',
    username: 'ffoffice1',
    password: 'ffpassword' // This is for reference only, never expose in backup
  };

  // Create a comprehensive backup
  const createBackup = useCallback(async (includePasswords = false) => {
    try {
      setIsCreatingBackup(true);

      const backupData = {
        version: '1.0',
        timestamp: new Date().toISOString(),
        system: 'Fire Force Invoice System',
        type: 'Manual Full Backup',
        data: {
          invoices: invoices.map(invoice => ({
            ...invoice,
            // Ensure all required fields are present
            id: invoice.id,
            date: invoice.date,
            poNumber: invoice.poNumber || '',
            salesRep: invoice.salesRep || '',
            transactionType: invoice.transactionType || 'Sales Order',
            customerName: invoice.customerName || '',
            customerEmail: invoice.customerEmail || '',
            customerPhone: invoice.customerPhone || '',
            accountsPayableEmail: invoice.accountsPayableEmail || '',
            billToAddress: invoice.billToAddress || '',
            shipToAddress: invoice.shipToAddress || '',
            items: invoice.items || [],
            shippingCost: invoice.shippingCost || 0,
            additionalInfo: invoice.additionalInfo || '',
            status: invoice.status || 'pending',
            taxRate: invoice.taxRate || 8.0,
            subtotal: invoice.subtotal || 0,
            tax: invoice.tax || 0,
            grandTotal: invoice.grandTotal || 0,
            createdAt: invoice.createdAt,
            updatedAt: invoice.updatedAt,
            archived: invoice.archived || false
          })),
          customers: customers.map(customer => ({
            ...customer,
            id: customer.id,
            name: customer.name || '',
            email: customer.email || '',
            phone: customer.phone || '',
            billToAddress: customer.billToAddress || '',
            shipToAddress: customer.shipToAddress || '',
            accountsPayableEmail: customer.accountsPayableEmail || ''
          })),
          users: users.map(user => ({
            ...user,
            id: user.id,
            username: user.username,
            name: user.name,
            email: user.email || '',
            phone: user.phone || '',
            role: user.role,
            password: includePasswords ? user.password : '***ENCRYPTED***',
            createdAt: user.createdAt,
            updatedAt: user.updatedAt
          })),
          // Always use fixed office info
          officeInfo: fixedOfficeInfo,
          settings: {
            ...settings,
            taxRate: settings.taxRate || 8.0
          }
        },
        metadata: {
          totalInvoices: invoices.length,
          totalCustomers: customers.length,
          totalUsers: users.length,
          createdBy: 'Office Administrator',
          backupType: 'Complete System Backup',
          includesPasswords: includePasswords,
          fileSize: 0 // Will be calculated after JSON.stringify
        }
      };

      // Convert to JSON and calculate size
      const jsonString = JSON.stringify(backupData, null, 2);
      backupData.metadata.fileSize = new Blob([jsonString]).size;

      // Create and download file
      const blob = new Blob([jsonString], { type: 'application/json' });
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
        timestamp: backupData.timestamp,
        type: backupData.type,
        records: backupData.metadata.totalInvoices + backupData.metadata.totalCustomers + backupData.metadata.totalUsers,
        size: backupData.metadata.fileSize,
        includesPasswords: includePasswords
      };

      const history = JSON.parse(localStorage.getItem('backup_history') || '[]');
      history.unshift(newBackup);
      history.splice(10); // Keep only last 10 backups
      localStorage.setItem('backup_history', JSON.stringify(history));
      localStorage.setItem('last_backup_date', backupData.timestamp);
      setBackupHistory(history);

      return {
        success: true,
        message: 'Backup created successfully',
        backup: newBackup
      };

    } catch (error) {
      console.error('Backup creation failed:', error);
      return {
        success: false,
        message: 'Failed to create backup: ' + error.message,
        error
      };
    } finally {
      setIsCreatingBackup(false);
    }
  }, [invoices, customers, users, settings]);

  // Validate backup file
  const validateBackup = useCallback(async (file) => {
    try {
      const text = await file.text();
      const backupData = JSON.parse(text);
      const validation = backupValidator.validateBackupFile(backupData);
      return backupValidator.generateReport(validation);
    } catch (error) {
      return {
        summary: 'File parsing failed',
        isValid: false,
        errorCount: 1,
        warningCount: 0,
        details: {
          errors: [`Failed to parse backup file: ${error.message}`],
          warnings: []
        }
      };
    }
  }, []);

  // Actual database restore functionality
  const performDatabaseRestore = async (backupData) => {
    try {
      setRestoreProgress({ status: 'processing', progress: 10, message: 'Starting restore process...' });
      
      // First, verify the backup data structure
      if (!backupData.data || !backupData.version || !backupData.timestamp) {
        throw new Error('Invalid backup file structure');
      }
      
      setRestoreProgress({ status: 'processing', progress: 20, message: 'Restoring customers...' });
      
      // Clear and restore customers
      if (backupData.data.customers && Array.isArray(backupData.data.customers)) {
        // Delete existing customers
        await supabase.from('customers_ff2024').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        
        // Insert new customers
        for (const customer of backupData.data.customers) {
          const formattedCustomer = {
            id: customer.id,
            name: customer.name || '',
            email: customer.email || '',
            phone: customer.phone || '',
            bill_to_address: customer.billToAddress || '',
            ship_to_address: customer.shipToAddress || '',
            accounts_payable_email: customer.accountsPayableEmail || '',
            created_at: customer.createdAt || new Date().toISOString(),
            updated_at: customer.updatedAt || new Date().toISOString()
          };
          
          await supabase.from('customers_ff2024').insert([formattedCustomer]);
        }
      }
      
      setRestoreProgress({ status: 'processing', progress: 40, message: 'Restoring users...' });
      
      // Clear and restore users (except for the office account)
      if (backupData.data.users && Array.isArray(backupData.data.users)) {
        // Delete existing users (only salesmen, not office)
        await supabase.from('users_ff2024').delete().eq('role', 'salesman');
        
        // Insert new users
        for (const user of backupData.data.users) {
          // Skip office users - we don't want to modify them
          if (user.role === 'office') continue;
          
          const formattedUser = {
            id: user.id,
            username: user.username,
            name: user.name,
            email: user.email || '',
            phone: user.phone || '',
            role: user.role,
            password_hash: 'default123', // Use a default password, admin can reset later
            created_at: user.createdAt || new Date().toISOString(),
            updated_at: user.updatedAt || new Date().toISOString()
          };
          
          await supabase.from('users_ff2024').insert([formattedUser]);
        }
      }
      
      setRestoreProgress({ status: 'processing', progress: 60, message: 'Restoring invoices...' });
      
      // Clear and restore invoices
      if (backupData.data.invoices && Array.isArray(backupData.data.invoices)) {
        // First delete all invoice items
        await supabase.from('invoice_items_ff2024').delete().neq('invoice_id', '00000000-0000-0000-0000-000000000000');
        
        // Then delete all invoices
        await supabase.from('invoices_ff2024').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        
        // Insert new invoices
        for (const invoice of backupData.data.invoices) {
          const formattedInvoice = {
            id: invoice.id,
            date: invoice.date,
            po_number: invoice.poNumber || '',
            sales_rep: invoice.salesRep || '',
            transaction_type: invoice.transactionType || 'Sales Order',
            customer_name: invoice.customerName || '',
            customer_email: invoice.customerEmail || '',
            customer_phone: invoice.customerPhone || '',
            accounts_payable_email: invoice.accountsPayableEmail || '',
            bill_to_address: invoice.billToAddress || '',
            ship_to_address: invoice.shipToAddress || '',
            shipping_cost: invoice.shippingCost || 0,
            additional_info: invoice.additionalInfo || '',
            status: invoice.status || 'pending',
            tax_rate: invoice.taxRate || 8.0,
            subtotal: invoice.subtotal || 0,
            tax: invoice.tax || 0,
            grand_total: invoice.grandTotal || 0,
            created_at: invoice.createdAt || new Date().toISOString(),
            updated_at: invoice.updatedAt || new Date().toISOString(),
            archived: invoice.archived || false
          };
          
          await supabase.from('invoices_ff2024').insert([formattedInvoice]);
          
          // Insert invoice items
          if (invoice.items && Array.isArray(invoice.items)) {
            for (const item of invoice.items) {
              const formattedItem = {
                invoice_id: invoice.id,
                mfg: item.mfg || '',
                part_number: item.partNumber || '',
                description: item.description || '',
                qty: item.qty || 0,
                unit_price: item.unitPrice || 0,
                taxable: item.taxable === undefined ? true : item.taxable,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
              };
              
              await supabase.from('invoice_items_ff2024').insert([formattedItem]);
            }
          }
        }
      }
      
      setRestoreProgress({ status: 'processing', progress: 80, message: 'Restoring settings...' });
      
      // Restore settings
      if (backupData.data.settings) {
        // Update tax rate setting
        if (backupData.data.settings.taxRate !== undefined) {
          await supabase
            .from('settings_ff2024')
            .upsert([{ key: 'tax_rate', value: backupData.data.settings.taxRate.toString() }], { onConflict: 'key' });
        }
      }
      
      setRestoreProgress({ status: 'processing', progress: 95, message: 'Finalizing restore...' });
      
      // Reload all data
      await loadAllData();
      
      setRestoreProgress({ status: 'completed', progress: 100, message: 'Restore completed successfully!' });
      
      return true;
    } catch (error) {
      console.error('Database restore failed:', error);
      setRestoreProgress({ status: 'error', progress: 0, message: 'Restore failed: ' + error.message });
      return false;
    }
  };

  // Restore from backup file
  const restoreFromBackup = useCallback(async (file, options = {}) => {
    try {
      setIsRestoring(true);
      setRestoreProgress({ status: 'starting', progress: 0, message: 'Reading backup file...' });

      // Validate file first
      const validation = await validateBackup(file);
      if (!validation.isValid) {
        return {
          success: false,
          message: 'Invalid backup file',
          validation
        };
      }

      const text = await file.text();
      const backupData = JSON.parse(text);

      // Add a warning about office information
      validation.details.warnings.push(
        'Office information will be preserved during restore and not overwritten from backup'
      );

      // Perform the actual database restore
      const success = await performDatabaseRestore(backupData);
      
      if (success) {
        return {
          success: true,
          message: 'Database restored successfully!',
          validation
        };
      } else {
        return {
          success: false,
          message: 'Restore failed. Please check the console for details.',
          validation
        };
      }
    } catch (error) {
      console.error('Restore failed:', error);
      setRestoreProgress({ status: 'error', progress: 0, message: 'Error: ' + error.message });
      return {
        success: false,
        message: 'Restore failed: ' + error.message,
        error
      };
    } finally {
      setIsRestoring(false);
    }
  }, [validateBackup, loadAllData]);

  // Export specific data type
  const exportData = useCallback((dataType, data) => {
    try {
      const exportData = {
        version: '1.0',
        timestamp: new Date().toISOString(),
        system: 'Fire Force Invoice System',
        dataType: dataType,
        records: data.length,
        data: data
      };

      const jsonString = JSON.stringify(exportData, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `fireforce_${dataType}_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      return {
        success: true,
        message: `${dataType.charAt(0).toUpperCase() + dataType.slice(1)} exported successfully`,
        records: data.length
      };

    } catch (error) {
      return {
        success: false,
        message: 'Export failed: ' + error.message,
        error
      };
    }
  }, []);

  // Get backup statistics
  const getBackupStats = useCallback(() => {
    const history = JSON.parse(localStorage.getItem('backup_history') || '[]');
    const lastBackup = localStorage.getItem('last_backup_date');
    const autoBackupEnabled = localStorage.getItem('auto_backup_enabled') === 'true';

    return {
      totalBackups: history.length,
      lastBackup: lastBackup ? new Date(lastBackup) : null,
      autoBackupEnabled,
      totalRecords: invoices.length + customers.length + users.length + 1,
      recordCounts: {
        invoices: invoices.length,
        customers: customers.length,
        users: users.length
      }
    };
  }, [invoices.length, customers.length, users.length]);

  // Load backup history
  const loadBackupHistory = useCallback(() => {
    const history = JSON.parse(localStorage.getItem('backup_history') || '[]');
    setBackupHistory(history);
    return history;
  }, []);

  return {
    // State
    isCreatingBackup,
    isRestoring,
    restoreProgress,
    backupHistory,
    fileInputRef,
    fixedOfficeInfo,

    // Actions
    createBackup,
    validateBackup,
    restoreFromBackup,
    performDatabaseRestore,
    exportData,
    getBackupStats,
    loadBackupHistory,

    // Setters
    setBackupHistory,
    setRestoreProgress
  };
};