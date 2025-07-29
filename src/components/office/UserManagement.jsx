import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useData } from '../../context/DataContext';
import SafeIcon from '../../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';

const { FiPlus, FiEdit, FiTrash2, FiUser, FiLock, FiEye, FiEyeOff, FiCheck, FiAlertCircle } = FiIcons;

const UserManagement = () => {
  const { users, addUser, updateUser, deleteUser } = useData();
  const [showSalesmanForm, setShowSalesmanForm] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [showPassword, setShowPassword] = useState({});
  const [notification, setNotification] = useState(null);
  const [salesmanForm, setSalesmanForm] = useState({
    username: '',
    name: '',
    password: '',
    confirmPassword: '',
    email: '',
    phone: ''
  });

  const salesmen = users.filter(user => user.role === 'salesman');

  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const handleSalesmanSubmit = (e) => {
    e.preventDefault();

    if (salesmanForm.password !== salesmanForm.confirmPassword) {
      showNotification('Passwords do not match', 'error');
      return;
    }

    if (salesmanForm.password.length < 6) {
      showNotification('Password must be at least 6 characters', 'error');
      return;
    }

    // Check if username already exists
    if (!editingUser && users.some(user => user.username === salesmanForm.username)) {
      showNotification('Username already exists', 'error');
      return;
    }

    const userData = {
      username: salesmanForm.username,
      name: salesmanForm.name,
      email: salesmanForm.email,
      phone: salesmanForm.phone,
      role: 'salesman',
      password: salesmanForm.password
    };

    if (editingUser) {
      updateUser(editingUser.id, userData);
      showNotification('Sales user updated successfully', 'success');
    } else {
      addUser(userData);
      showNotification('Sales user added successfully', 'success');
    }

    resetSalesmanForm();
  };

  const resetSalesmanForm = () => {
    setSalesmanForm({
      username: '',
      name: '',
      password: '',
      confirmPassword: '',
      email: '',
      phone: ''
    });
    setShowSalesmanForm(false);
    setEditingUser(null);
  };

  const handleEditSalesman = (user) => {
    setSalesmanForm({
      username: user.username,
      name: user.name,
      email: user.email || '',
      phone: user.phone || '',
      password: '',
      confirmPassword: ''
    });
    setEditingUser(user);
    setShowSalesmanForm(true);
  };

  const handleDeleteSalesman = (user) => {
    if (window.confirm(`Are you sure you want to delete ${user.name}? This action cannot be undone.`)) {
      deleteUser(user.id);
      showNotification('Sales user deleted successfully', 'success');
    }
  };

  const togglePasswordVisibility = (field) => {
    setShowPassword(prev => ({ ...prev, [field]: !prev[field] }));
  };

  // Fixed office information
  const fixedOfficeInfo = {
    companyName: 'Fire Force',
    address: 'P.O. Box 552, Columbiana Ohio 44408',
    phone: '330-482-9300',
    emergencyPhone: '724-586-6577',
    email: 'Lizfireforce@yahoo.com',
    serviceEmail: 'fireforcebutler@gmail.com',
    username: 'ffoffice1',
    password: 'ffpassword' // This would normally be hashed in a real system
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-3">
        <SafeIcon icon={FiUser} className="text-2xl text-gray-700" />
        <h2 className="text-2xl font-title font-bold text-gray-900">User Management</h2>
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

      {/* Office Information */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-xl shadow-lg"
      >
        <div className="p-6 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-title font-semibold text-gray-900">Office Information</h3>
            <div className="bg-blue-100 text-blue-800 px-4 py-1 rounded-full text-sm">
              Fixed Information
            </div>
          </div>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Company Information</h4>
              <div className="space-y-2 text-sm text-gray-600">
                <div><strong>Name:</strong> {fixedOfficeInfo.companyName}</div>
                <div><strong>Phone:</strong> {fixedOfficeInfo.phone}</div>
                <div><strong>Emergency:</strong> {fixedOfficeInfo.emergencyPhone}</div>
                <div><strong>Username:</strong> {fixedOfficeInfo.username}</div>
              </div>
            </div>
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Contact Information</h4>
              <div className="space-y-2 text-sm text-gray-600">
                <div><strong>Email:</strong> {fixedOfficeInfo.email}</div>
                <div><strong>Service:</strong> {fixedOfficeInfo.serviceEmail}</div>
              </div>
            </div>
          </div>
          <div className="mt-6">
            <h4 className="font-medium text-gray-900 mb-2">Address</h4>
            <p className="text-sm text-gray-600 whitespace-pre-line">
              {fixedOfficeInfo.address}
            </p>
          </div>
          <div className="mt-6 p-4 bg-yellow-50 border border-yellow-100 rounded-lg">
            <p className="text-sm text-amber-800">
              <strong>Note:</strong> Office information is fixed and cannot be modified. 
              Contact IT support if any office details need to be updated.
            </p>
          </div>
        </div>
      </motion.div>

      {/* Salesmen Management */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white rounded-xl shadow-lg"
      >
        <div className="p-6 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-title font-semibold text-gray-900">Sales Users Management</h3>
            <button
              onClick={() => setShowSalesmanForm(true)}
              className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              <SafeIcon icon={FiPlus} />
              <span>Add Sales User</span>
            </button>
          </div>
        </div>

        {/* Salesman Form */}
        {showSalesmanForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="border-b border-gray-200"
          >
            <form onSubmit={handleSalesmanSubmit} className="p-6 space-y-6">
              <h4 className="text-md font-semibold text-gray-900">
                {editingUser ? 'Edit Sales User' : 'Add New Sales User'}
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Username *</label>
                  <input
                    type="text"
                    value={salesmanForm.username}
                    onChange={(e) => setSalesmanForm(prev => ({ ...prev, username: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    required
                    disabled={editingUser}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Full Name *</label>
                  <input
                    type="text"
                    value={salesmanForm.name}
                    onChange={(e) => setSalesmanForm(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                  <input
                    type="email"
                    value={salesmanForm.email}
                    onChange={(e) => setSalesmanForm(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
                  <input
                    type="tel"
                    value={salesmanForm.phone}
                    onChange={(e) => setSalesmanForm(prev => ({ ...prev, phone: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  />
                </div>

                <div className="relative">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Password {editingUser && '(Leave blank to keep current)'}
                  </label>
                  <input
                    type={showPassword.password ? 'text' : 'password'}
                    value={salesmanForm.password}
                    onChange={(e) => setSalesmanForm(prev => ({ ...prev, password: e.target.value }))}
                    className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    required={!editingUser}
                    minLength={6}
                  />
                  <button
                    type="button"
                    onClick={() => togglePasswordVisibility('password')}
                    className="absolute right-3 top-9 text-gray-400 hover:text-gray-600"
                  >
                    <SafeIcon icon={showPassword.password ? FiEyeOff : FiEye} />
                  </button>
                </div>

                <div className="relative">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Confirm Password</label>
                  <input
                    type={showPassword.confirmPassword ? 'text' : 'password'}
                    value={salesmanForm.confirmPassword}
                    onChange={(e) => setSalesmanForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                    className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    required={!editingUser || salesmanForm.password}
                  />
                  <button
                    type="button"
                    onClick={() => togglePasswordVisibility('confirmPassword')}
                    className="absolute right-3 top-9 text-gray-400 hover:text-gray-600"
                  >
                    <SafeIcon icon={showPassword.confirmPassword ? FiEyeOff : FiEye} />
                  </button>
                </div>
              </div>

              <div className="flex justify-end space-x-4">
                <button
                  type="button"
                  onClick={resetSalesmanForm}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                >
                  {editingUser ? 'Update Sales User' : 'Add Sales User'}
                </button>
              </div>
            </form>
          </motion.div>
        )}

        {/* Salesmen List */}
        <div className="p-6">
          {salesmen.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {salesmen.map((salesman, index) => (
                <motion.div
                  key={salesman.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.1 }}
                  className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                        <SafeIcon icon={FiUser} className="text-red-600" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900">{salesman.name}</h4>
                        <p className="text-sm text-gray-500">@{salesman.username}</p>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleEditSalesman(salesman)}
                        className="text-blue-600 hover:text-blue-800"
                        title="Edit"
                      >
                        <SafeIcon icon={FiEdit} />
                      </button>
                      <button
                        onClick={() => handleDeleteSalesman(salesman)}
                        className="text-red-600 hover:text-red-800"
                        title="Delete"
                      >
                        <SafeIcon icon={FiTrash2} />
                      </button>
                    </div>
                  </div>
                  <div className="space-y-1 text-sm text-gray-600">
                    {salesman.email && (
                      <div><strong>Email:</strong> {salesman.email}</div>
                    )}
                    {salesman.phone && (
                      <div><strong>Phone:</strong> {salesman.phone}</div>
                    )}
                    <div className="text-xs text-gray-400 mt-2">
                      Last updated: {new Date(salesman.updatedAt || salesman.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <SafeIcon icon={FiUser} className="text-4xl text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No sales users added yet</p>
              <button
                onClick={() => setShowSalesmanForm(true)}
                className="mt-4 text-red-600 hover:text-red-700 font-medium"
              >
                Add your first sales user
              </button>
            </div>
          )}
        </div>
      </motion.div>

      {/* IT Override Account */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white rounded-xl shadow-lg"
      >
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <SafeIcon icon={FiLock} className="text-lg text-gray-700" />
            <h3 className="text-lg font-title font-semibold text-gray-900">IT Override Access</h3>
          </div>
        </div>
        <div className="p-6">
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <div className="flex items-start space-x-4">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-lg flex items-center justify-center flex-shrink-0">
                <SafeIcon icon={FiLock} className="text-white text-xl" />
              </div>
              <div>
                <h4 className="font-medium text-gray-900 mb-1">IT Support Override Account</h4>
                <p className="text-sm text-gray-600 mb-3">
                  This account has administrator access to all areas of the system for technical support purposes.
                </p>
                <div className="bg-blue-50 border border-blue-200 rounded p-3 text-sm">
                  <div><strong>Username:</strong> cholmx</div>
                  <div><strong>Password:</strong> ●●●●●●●●●●●●●</div>
                  <div className="text-xs text-gray-500 mt-2">
                    This account bypasses normal authentication and should only be used by authorized IT personnel.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default UserManagement;