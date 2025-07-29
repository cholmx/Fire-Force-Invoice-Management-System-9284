import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import InvoicePreview from './InvoicePreview';
import SafeIcon from '../../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';

const { FiPlus, FiEdit, FiEye, FiTrash2, FiSearch, FiFilter, FiArchive, FiRefreshCw, FiUser } = FiIcons;

const InvoiceList = ({ userRole }) => {
  const { invoices, updateInvoice, deleteInvoice, users } = useData();
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [archiveFilter, setArchiveFilter] = useState('active'); // 'active', 'archived', 'all'
  const [salesmanFilter, setSalesmanFilter] = useState('all'); // New filter for salesmen
  const [previewInvoice, setPreviewInvoice] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);

  // Get list of salesmen for the filter
  const salesmen = users
    .filter(u => u.role === 'salesman')
    .map(u => ({ id: u.id, name: u.name }));

  const filteredInvoices = invoices.filter(invoice => {
    const matchesSearch = 
      invoice.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) || 
      invoice.poNumber?.toLowerCase().includes(searchTerm.toLowerCase()) || 
      invoice.salesRep?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || invoice.status === statusFilter;
    const matchesType = typeFilter === 'all' || invoice.transactionType === typeFilter;
    const matchesUser = userRole === 'office' || invoice.salesRep === user?.name;
    const matchesArchive = 
      archiveFilter === 'all' || 
      (archiveFilter === 'active' && !invoice.archived) || 
      (archiveFilter === 'archived' && invoice.archived);
    const matchesSalesman = 
      salesmanFilter === 'all' || 
      invoice.salesRep === salesmanFilter;

    return matchesSearch && matchesStatus && matchesType && matchesUser && matchesArchive && matchesSalesman;
  });

  const handleStatusChange = (invoiceId, newStatus) => {
    updateInvoice(invoiceId, { status: newStatus });
  };

  const handleArchiveToggle = (invoiceId, currentArchiveState) => {
    updateInvoice(invoiceId, { archived: !currentArchiveState });
  };

  const handleDeleteConfirm = (invoiceId) => {
    setConfirmDelete(invoiceId);
  };

  const confirmDeleteInvoice = () => {
    if (confirmDelete) {
      deleteInvoice(confirmDelete);
      setConfirmDelete(null);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'in-process': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-red-100 text-red-800';
    }
  };

  const getTypeColor = (type) => {
    switch (type) {
      case 'Sales Order': return 'bg-red-600 text-white';
      case 'Service Order': return 'bg-green-600 text-white';
      case 'Quote': return 'bg-amber-500 text-white';
      default: return 'bg-gray-600 text-white';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">
          {userRole === 'office' ? 'All Invoices' : 'My Invoices'}
        </h2>
        {/* Show New Invoice button for both roles */}
        <Link 
          to={userRole === 'office' ? '/office/invoice/new' : '/salesman/invoice/new'}
          className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
        >
          <SafeIcon icon={FiPlus} />
          <span>New Invoice</span>
        </Link>
      </div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-xl shadow-lg p-6"
      >
        <div className={`grid grid-cols-1 ${userRole === 'office' ? 'md:grid-cols-5' : 'md:grid-cols-4'} gap-4`}>
          <div className="relative">
            <SafeIcon icon={FiSearch} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search invoices..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
            />
          </div>

          <div className="relative">
            <SafeIcon icon={FiFilter} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="in-process">In Process</option>
              <option value="completed">Completed</option>
            </select>
          </div>

          <div className="relative">
            <SafeIcon icon={FiFilter} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
            >
              <option value="all">All Types</option>
              <option value="Sales Order">Sales Order</option>
              <option value="Service Order">Service Order</option>
              <option value="Quote">Quote</option>
            </select>
          </div>

          {/* Salesman Filter - Only for office users */}
          {userRole === 'office' && (
            <div className="relative">
              <SafeIcon icon={FiUser} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <select
                value={salesmanFilter}
                onChange={(e) => setSalesmanFilter(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
              >
                <option value="all">All Salesmen</option>
                {salesmen.map(salesman => (
                  <option key={salesman.id} value={salesman.name}>{salesman.name}</option>
                ))}
              </select>
            </div>
          )}

          <div className="relative">
            <SafeIcon icon={FiArchive} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <select
              value={archiveFilter}
              onChange={(e) => setArchiveFilter(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
            >
              <option value="active">Active</option>
              <option value="archived">Archived</option>
              <option value="all">All</option>
            </select>
          </div>

          <div className="text-right">
            <span className="text-sm text-gray-600">
              {filteredInvoices.length} invoice{filteredInvoices.length !== 1 ? 's' : ''} found
            </span>
          </div>
        </div>
      </motion.div>

      {/* Invoice List */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-xl shadow-lg overflow-hidden"
      >
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Invoice Details
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Customer
                </th>
                {userRole === 'office' && (
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Sales Rep
                  </th>
                )}
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredInvoices.map((invoice, index) => (
                <motion.tr
                  key={invoice.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className={`hover:bg-gray-50 ${invoice.archived ? 'bg-gray-50' : ''}`}
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        P.O.# {invoice.poNumber || 'N/A'}
                      </div>
                      <div className="text-sm text-gray-500">
                        {new Date(invoice.date).toLocaleDateString()}
                      </div>
                      {invoice.archived && (
                        <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800">
                          Archived
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {invoice.customerName || 'Unnamed Customer'}
                    </div>
                    <div className="text-sm text-gray-500">
                      {invoice.customerEmail}
                    </div>
                  </td>
                  {userRole === 'office' && (
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {invoice.salesRep || 'Unknown'}
                    </td>
                  )}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getTypeColor(invoice.transactionType)}`}>
                      {invoice.transactionType || 'Sales Order'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    ${(invoice.grandTotal || 0).toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {userRole === 'office' ? (
                      <select
                        value={invoice.status || 'pending'}
                        onChange={(e) => handleStatusChange(invoice.id, e.target.value)}
                        className={`text-xs font-medium px-2 py-1 rounded-full border-0 ${getStatusColor(invoice.status)}`}
                        disabled={invoice.archived}
                      >
                        <option value="pending">Pending</option>
                        <option value="in-process">In Process</option>
                        <option value="completed">Completed</option>
                      </select>
                    ) : (
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(invoice.status)}`}>
                        {invoice.status || 'pending'}
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => setPreviewInvoice(invoice)}
                        className="text-blue-600 hover:text-blue-900"
                        title="Preview"
                      >
                        <SafeIcon icon={FiEye} />
                      </button>
                      
                      {/* Allow editing for office users or salesmen for their own invoices if not archived */}
                      {!invoice.archived && (userRole === 'office' || (userRole === 'salesman' && invoice.salesRep === user?.name)) && (
                        <Link
                          to={userRole === 'office' ? `/office/invoice/edit/${invoice.id}` : `/salesman/invoice/edit/${invoice.id}`}
                          className="text-green-600 hover:text-green-900"
                          title="Edit"
                        >
                          <SafeIcon icon={FiEdit} />
                        </Link>
                      )}
                      
                      {/* Archive/Unarchive button */}
                      <button
                        onClick={() => handleArchiveToggle(invoice.id, invoice.archived)}
                        className={`${invoice.archived ? 'text-blue-600 hover:text-blue-900' : 'text-amber-600 hover:text-amber-900'}`}
                        title={invoice.archived ? 'Restore' : 'Archive'}
                      >
                        <SafeIcon icon={invoice.archived ? FiRefreshCw : FiArchive} />
                      </button>
                      
                      {/* Delete button */}
                      <button
                        onClick={() => handleDeleteConfirm(invoice.id)}
                        className="text-red-600 hover:text-red-900"
                        title="Delete"
                      >
                        <SafeIcon icon={FiTrash2} />
                      </button>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
          {filteredInvoices.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500">No invoices found matching your criteria</p>
            </div>
          )}
        </div>
      </motion.div>

      {/* Preview Modal */}
      {previewInvoice && (
        <InvoicePreview
          invoiceData={previewInvoice}
          onClose={() => setPreviewInvoice(null)}
        />
      )}

      {/* Delete Confirmation Modal */}
      {confirmDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Confirm Delete</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete this invoice? This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setConfirmDelete(null)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={confirmDeleteInvoice}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InvoiceList;