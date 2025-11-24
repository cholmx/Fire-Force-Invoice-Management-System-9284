import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import SafeIcon from '../../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';

const { FiPlus, FiEdit, FiSearch, FiUser, FiFileText, FiTrash2, FiAlertCircle, FiPhone, FiMail, FiMapPin } = FiIcons;

const CustomerManagement = () => {
  const { customers, addCustomer, updateCustomer, deleteCustomer } = useData();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [formData, setFormData] = useState({
    name: '', company: '', email: '', phone: '', billToAddress: '', shipToAddress: '', accountsPayableEmail: ''
  });

  const filteredCustomers = customers.filter(
    customer => 
      customer.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.company?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editingCustomer) {
      updateCustomer(editingCustomer.id, formData);
    } else {
      addCustomer(formData);
    }
    resetForm();
  };

  const resetForm = () => {
    setFormData({ name: '', company: '', email: '', phone: '', billToAddress: '', shipToAddress: '', accountsPayableEmail: '' });
    setShowForm(false);
    setEditingCustomer(null);
  };

  const handleEdit = (customer) => {
    setFormData(customer);
    setEditingCustomer(customer);
    setShowForm(true);
  };

  const handleCreateInvoice = (customer) => {
    localStorage.setItem('selectedCustomer', JSON.stringify(customer));
    navigate(user?.role === 'salesman' ? '/salesman/invoice/new' : '/office/invoice/new');
  };

  return (
    <div className="space-y-5">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-gray-900 tracking-tight">Customers</h2>
        <button 
          onClick={() => setShowForm(true)}
          className="flex items-center space-x-2 px-4 py-2 bg-brand-gradient hover:bg-brand-gradient-hover text-white rounded-lg shadow-sm hover:shadow text-xs font-semibold transition-all duration-200"
        >
          <SafeIcon icon={FiPlus} />
          <span>Add Customer</span>
        </button>
      </div>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <div className="relative max-w-sm">
          <SafeIcon icon={FiSearch} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-xs" />
          <input 
            type="text" 
            placeholder="Search customers..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-xs focus:ring-1 focus:ring-red-500 focus:border-red-500 bg-gray-50 focus:bg-white transition-colors"
          />
        </div>
      </motion.div>

      {/* Form Modal/Inline */}
      {showForm && (
        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-sm font-bold text-gray-900 mb-4">{editingCustomer ? 'Edit Customer' : 'Add New Customer'}</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input type="text" placeholder="Name *" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs" required />
              <input type="text" placeholder="Company" value={formData.company} onChange={e => setFormData({...formData, company: e.target.value})} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs" />
              <input type="email" placeholder="Email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs" />
              <input type="tel" placeholder="Phone" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs" />
            </div>
            <div className="flex justify-end space-x-3 pt-2">
              <button type="button" onClick={resetForm} className="px-4 py-2 border border-gray-200 text-gray-600 rounded-lg text-xs font-semibold hover:bg-gray-50">Cancel</button>
              <button type="submit" className="px-4 py-2 bg-brand-gradient text-white rounded-lg text-xs font-semibold hover:opacity-90">{editingCustomer ? 'Update' : 'Add'}</button>
            </div>
          </form>
        </motion.div>
      )}

      {/* Customer Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredCustomers.map((customer, index) => (
          <motion.div 
            key={customer.id} 
            initial={{ opacity: 0, scale: 0.98 }} 
            animate={{ opacity: 1, scale: 1 }} 
            transition={{ delay: index * 0.05 }}
            className="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-md transition-shadow group"
          >
            <div className="flex justify-between items-start mb-3">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gradient-to-br from-red-50 to-orange-50 rounded-full flex items-center justify-center text-red-500 border border-red-100">
                  <SafeIcon icon={FiUser} className="text-xs" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-gray-900 leading-tight">{customer.name}</h3>
                  {customer.company && <p className="text-xs text-gray-500">{customer.company}</p>}
                </div>
              </div>
              <div className="flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => handleEdit(customer)} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded"><SafeIcon icon={FiEdit} className="text-xs" /></button>
                <button onClick={() => setConfirmDelete(customer)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"><SafeIcon icon={FiTrash2} className="text-xs" /></button>
              </div>
            </div>
            
            <div className="space-y-2 mt-3 pt-3 border-t border-gray-50">
              {customer.email && (
                <div className="flex items-center text-xs text-gray-600">
                  <SafeIcon icon={FiMail} className="w-3.5 h-3.5 mr-2 text-gray-400" />
                  <span className="truncate">{customer.email}</span>
                </div>
              )}
              {customer.phone && (
                <div className="flex items-center text-xs text-gray-600">
                  <SafeIcon icon={FiPhone} className="w-3.5 h-3.5 mr-2 text-gray-400" />
                  <span>{customer.phone}</span>
                </div>
              )}
            </div>

            <button 
              onClick={() => handleCreateInvoice(customer)}
              className="w-full mt-4 flex items-center justify-center space-x-2 px-3 py-1.5 border border-gray-200 hover:border-red-200 hover:bg-red-50 text-gray-600 hover:text-red-600 rounded-lg transition-all duration-200 text-xs font-semibold"
            >
              <SafeIcon icon={FiFileText} />
              <span>Create Invoice</span>
            </button>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default CustomerManagement;