import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useData } from '../../context/DataContext';
import SafeIcon from '../../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';

const { FiSave, FiLock, FiCheck, FiAlertCircle } = FiIcons;

const Settings = () => {
  const { settings, updateSettings } = useData();
  const [showTaxForm, setShowTaxForm] = useState(false);
  const [notification, setNotification] = useState(null);
  const [taxForm, setTaxForm] = useState({
    taxRate: 8.0
  });

  // Update form when data changes
  useEffect(() => {
    if (settings) {
      setTaxForm({
        taxRate: settings.taxRate || 8.0
      });
    }
  }, [settings]);

  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const handleTaxSubmit = async (e) => {
    e.preventDefault();
    try {
      const taxRateValue = parseFloat(taxForm.taxRate);
      console.log('Updating tax rate to:', taxRateValue);
      await updateSettings({ taxRate: taxRateValue });
      showNotification('Tax rate updated successfully', 'success');
      setShowTaxForm(false);
    } catch (error) {
      showNotification('Error updating tax rate: ' + error.message, 'error');
      console.error('Error:', error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-3">
        <SafeIcon icon={FiLock} className="text-2xl text-gradient-start" />
        <h2 className="text-2xl font-title font-bold text-gray-900">Settings</h2>
      </div>

      {/* Notification */}
      {notification && (
        <motion.div 
          initial={{ opacity: 0, y: -20 }} 
          animate={{ opacity: 1, y: 0 }} 
          exit={{ opacity: 0, y: -20 }}
          className={`p-4 rounded-lg flex items-center space-x-2 ${
            notification.type === 'success' 
              ? 'bg-green-50 text-green-800 border border-green-200' 
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}
        >
          <SafeIcon icon={notification.type === 'success' ? FiCheck : FiAlertCircle} />
          <span>{notification.message}</span>
        </motion.div>
      )}

      {/* Tax Settings */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }} 
        animate={{ opacity: 1, y: 0 }} 
        transition={{ delay: 0.1 }}
        className="bg-white rounded-xl shadow-lg"
      >
        <div className="p-6 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-title font-semibold text-gray-900">Tax Settings</h3>
            <button 
              onClick={() => setShowTaxForm(!showTaxForm)}
              className="flex items-center space-x-2 px-4 py-2 bg-brand-gradient hover:bg-brand-gradient-hover text-white rounded-lg transition-all duration-300"
            >
              <SafeIcon icon={FiSave} />
              <span>Edit Tax Rate</span>
            </button>
          </div>
        </div>

        {showTaxForm ? (
          <form onSubmit={handleTaxSubmit} className="p-6">
            <div className="max-w-md">
              <label className="block text-sm font-medium text-gray-700 mb-2">Default Tax Rate (%)</label>
              <input 
                type="number" 
                value={taxForm.taxRate}
                onChange={(e) => setTaxForm(prev => ({ ...prev, taxRate: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gradient-start focus:border-transparent"
                min="0"
                step="0.1"
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                This tax rate will be applied as the default for new invoices.
              </p>
            </div>
            <div className="flex justify-end space-x-4 mt-6">
              <button 
                type="button" 
                onClick={() => setShowTaxForm(false)}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button 
                type="submit" 
                className="px-6 py-2 bg-brand-gradient hover:bg-brand-gradient-hover text-white rounded-lg transition-all duration-300"
              >
                Update Tax Rate
              </button>
            </div>
          </form>
        ) : (
          <div className="p-6">
            <div className="flex items-center">
              <div className="w-16 h-16 bg-brand-gradient rounded-lg flex items-center justify-center mr-4">
                <span className="text-white font-title font-bold text-2xl">{settings?.taxRate || 8.0}%</span>
              </div>
              <div>
                <h4 className="font-medium text-gray-900">Current Default Tax Rate</h4>
                <p className="text-sm text-gray-600 mt-1">
                  This rate is applied by default to all new invoices. You can modify the tax rate for individual invoices during creation.
                </p>
              </div>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default Settings;