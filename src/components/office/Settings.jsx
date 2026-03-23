import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useData } from '../../context/DataContext';
import SafeIcon from '../../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';

const { FiSave, FiSettings, FiCheck, FiAlertCircle } = FiIcons;

const Settings = () => {
  const { settings, updateSettings } = useData();
  const [showTaxForm, setShowTaxForm] = useState(false);
  const [notification, setNotification] = useState(null);
  const [taxRate, setTaxRate] = useState(8.0);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (settings?.taxRate !== undefined) {
      setTaxRate(settings.taxRate);
    }
  }, [settings]);

  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const handleTaxSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await updateSettings({ taxRate: parseFloat(taxRate) });
      showNotification('Tax rate updated successfully', 'success');
      setShowTaxForm(false);
    } catch (error) {
      showNotification('Error updating tax rate: ' + error.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-3">
        <SafeIcon icon={FiSettings} className="text-2xl text-red-600" />
        <h2 className="text-2xl font-title font-bold text-gray-900">Settings</h2>
      </div>

      {notification && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
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

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white rounded-xl shadow-sm border border-gray-200"
      >
        <div className="p-6 border-b border-gray-200 flex justify-between items-center">
          <h3 className="text-lg font-title font-semibold text-gray-900">Tax Settings</h3>
          <button
            onClick={() => setShowTaxForm(!showTaxForm)}
            className="flex items-center space-x-2 px-4 py-2 bg-brand-gradient text-white rounded-lg text-sm font-semibold hover:opacity-90 transition-all"
          >
            <SafeIcon icon={FiSave} />
            <span>{showTaxForm ? 'Cancel' : 'Edit Tax Rate'}</span>
          </button>
        </div>

        {showTaxForm ? (
          <form onSubmit={handleTaxSubmit} className="p-6">
            <div className="max-w-md">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Default Tax Rate (%)
              </label>
              <input
                type="number"
                value={taxRate}
                onChange={(e) => setTaxRate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                min="0"
                max="100"
                step="0.1"
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                Applied as the default rate for all new invoices.
              </p>
            </div>
            <div className="flex justify-end space-x-4 mt-6">
              <button
                type="button"
                onClick={() => { setShowTaxForm(false); setTaxRate(settings?.taxRate || 8.0); }}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-6 py-2 bg-brand-gradient text-white rounded-lg text-sm font-semibold hover:opacity-90 disabled:opacity-60"
              >
                {saving ? 'Saving...' : 'Update Tax Rate'}
              </button>
            </div>
          </form>
        ) : (
          <div className="p-6 flex items-center space-x-4">
            <div className="w-16 h-16 bg-brand-gradient rounded-lg flex items-center justify-center flex-shrink-0">
              <span className="text-white font-title font-bold text-xl">{settings?.taxRate ?? 8.0}%</span>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900">Current Default Tax Rate</h4>
              <p className="text-sm text-gray-500 mt-1">
                Applied by default to all new invoices. Can be overridden per invoice.
              </p>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default Settings;