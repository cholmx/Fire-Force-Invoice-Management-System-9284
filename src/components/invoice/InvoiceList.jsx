import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
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
  const [searchParams] = useSearchParams();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [archiveFilter, setArchiveFilter] = useState('active');
  const [salesmanFilter, setSalesmanFilter] = useState('all');
  const [previewInvoice, setPreviewInvoice] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);

  // Initialize filters from URL search params
  useEffect(() => {
    const statusParam = searchParams.get('status');
    if (statusParam) {
      setStatusFilter(statusParam);
    }
  }, [searchParams]);

  const salesReps = [
    { id: 'office_admin', name: 'Office Administrator' },
    ...users
      .filter(u => u.role === 'salesman')
      .map(u => ({ id: u.id, name: u.name }))
  ];

  const filteredInvoices = invoices.filter(invoice => {
    const matchesSearch = invoice.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          invoice.company?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          invoice.poNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          invoice.salesRep?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || invoice.status === statusFilter;
    const matchesType = typeFilter === 'all' || invoice.transactionType === typeFilter;
    const matchesUser = userRole === 'office' || invoice.salesRep === user?.name;
    const matchesArchive = archiveFilter === 'all' || 
                          (archiveFilter === 'active' && !invoice.archived) || 
                          (archiveFilter === 'archived' && invoice.archived);
    const matchesSalesman = salesmanFilter === 'all' || invoice.salesRep === salesmanFilter;

    return matchesSearch && matchesStatus && matchesType && matchesUser && matchesArchive && matchesSalesman;
  });

  const handleStatusChange = (invoiceId, newStatus) => {
    updateInvoice(invoiceId, { status: newStatus });
  };

  const handleArchiveToggle = (invoiceId, currentArchiveState, status) => {
    if (!currentArchiveState && status !== 'completed') {
      alert('Only completed invoices can be archived.');
      return;
    }
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
      case 'completed': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'in-process': return 'bg-blue-50 text-blue-700 border-blue-200';
      default: return 'bg-amber-50 text-amber-700 border-amber-200';
    }
  };

  const getTypeColor = (type) => {
    switch (type) {
      case 'Sales Order': return 'text-red-600 bg-red-50 border-red-100';
      case 'Service Order': return 'text-emerald-600 bg-emerald-50 border-emerald-100';
      case 'Quote': return 'text-amber-600 bg-amber-50 border-amber-100';
      default: return 'text-gray-600 bg-gray-50 border-gray-100';
    }
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-gray-900 tracking-tight">
          {userRole === 'office' ? 'All Invoices' : 'My Invoices'}
        </h2>
        {userRole === 'salesman' && (
          <Link
            to="/salesman/invoice/new"
            className="flex items-center space-x-2 px-4 py-2 bg-brand-gradient hover:bg-brand-gradient-hover text-white rounded-lg shadow-sm hover:shadow text-xs font-semibold transition-all duration-200"
          >
            <SafeIcon icon={FiPlus} />
            <span>New Invoice</span>
          </Link>
        )}
      </div>

      {/* Filters */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }} 
        animate={{ opacity: 1, y: 0 }} 
        className="bg-white rounded-xl shadow-sm border border-gray-200 p-4"
      >
        <div className={`grid grid-cols-1 ${userRole === 'office' ? 'md:grid-cols-5' : 'md:grid-cols-4'} gap-3`}>
          <div className="relative">
            <SafeIcon icon={FiSearch} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-xs" />
            <input
              type="text"
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-xs focus:ring-1 focus:ring-red-500 focus:border-red-500 bg-gray-50 focus:bg-white transition-colors"
            />
          </div>
          <div className="relative">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs focus:ring-1 focus:ring-red-500 focus:border-red-500 bg-gray-50 focus:bg-white transition-colors appearance-none"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="in-process">In Process</option>
              <option value="completed">Completed</option>
            </select>
            <SafeIcon icon={FiFilter} className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-xs pointer-events-none" />
          </div>
          <div className="relative">
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs focus:ring-1 focus:ring-red-500 focus:border-red-500 bg-gray-50 focus:bg-white transition-colors appearance-none"
            >
              <option value="all">All Types</option>
              <option value="Sales Order">Sales Order</option>
              <option value="Service Order">Service Order</option>
              <option value="Quote">Quote</option>
            </select>
            <SafeIcon icon={FiFilter} className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-xs pointer-events-none" />
          </div>
          
          {userRole === 'office' && (
            <div className="relative">
              <select
                value={salesmanFilter}
                onChange={(e) => setSalesmanFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs focus:ring-1 focus:ring-red-500 focus:border-red-500 bg-gray-50 focus:bg-white transition-colors appearance-none"
              >
                <option value="all">All Reps</option>
                {salesReps.map(salesRep => (
                  <option key={salesRep.id} value={salesRep.name}>{salesRep.name}</option>
                ))}
              </select>
              <SafeIcon icon={FiUser} className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-xs pointer-events-none" />
            </div>
          )}

          <div className="relative">
            <select
              value={archiveFilter}
              onChange={(e) => setArchiveFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs focus:ring-1 focus:ring-red-500 focus:border-red-500 bg-gray-50 focus:bg-white transition-colors appearance-none"
            >
              <option value="active">Active</option>
              <option value="archived">Archived</option>
              <option value="all">All</option>
            </select>
            <SafeIcon icon={FiArchive} className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-xs pointer-events-none" />
          </div>
        </div>
        <div className="text-right mt-2">
          <span className="text-[10px] text-gray-400 font-medium">
            {filteredInvoices.length} result{filteredInvoices.length !== 1 ? 's' : ''}
          </span>
        </div>
      </motion.div>

      {/* Invoice List */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }} 
        animate={{ opacity: 1, y: 0 }} 
        transition={{ delay: 0.1 }}
        className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden"
      >
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-5 py-3 text-left text-[10px] font-bold text-gray-500 uppercase tracking-wider">Details</th>
                <th className="px-5 py-3 text-left text-[10px] font-bold text-gray-500 uppercase tracking-wider">Customer</th>
                {userRole === 'office' && (
                  <th className="px-5 py-3 text-left text-[10px] font-bold text-gray-500 uppercase tracking-wider">Rep</th>
                )}
                <th className="px-5 py-3 text-left text-[10px] font-bold text-gray-500 uppercase tracking-wider">Type</th>
                <th className="px-5 py-3 text-left text-[10px] font-bold text-gray-500 uppercase tracking-wider">Amount</th>
                <th className="px-5 py-3 text-left text-[10px] font-bold text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-5 py-3 text-right text-[10px] font-bold text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredInvoices.map((invoice, index) => (
                <motion.tr 
                  key={invoice.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: index * 0.03 }}
                  className={`hover:bg-gray-50 transition-colors ${invoice.archived ? 'bg-gray-50/50' : ''}`}
                >
                  <td className="px-5 py-3 whitespace-nowrap">
                    <div className="flex flex-col">
                      <span className="text-xs font-semibold text-gray-900">#{invoice.poNumber || 'N/A'}</span>
                      <span className="text-[10px] text-gray-400">{new Date(invoice.date).toLocaleDateString()}</span>
                      {invoice.archived && (
                        <span className="inline-flex mt-1 px-1.5 py-0.5 text-[9px] font-medium rounded bg-gray-100 text-gray-500 w-min">Archived</span>
                      )}
                    </div>
                  </td>
                  <td className="px-5 py-3 whitespace-nowrap">
                    <div className="flex flex-col max-w-[200px]">
                      <span className="text-xs font-medium text-gray-900 truncate">{invoice.customerName || 'Unnamed'}</span>
                      {invoice.company && (
                        <span className="text-[10px] text-gray-500 truncate">{invoice.company}</span>
                      )}
                    </div>
                  </td>
                  {userRole === 'office' && (
                    <td className="px-5 py-3 whitespace-nowrap text-xs text-gray-600">
                      {invoice.salesRep || '-'}
                    </td>
                  )}
                  <td className="px-5 py-3 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-0.5 text-[10px] font-semibold rounded-full border ${getTypeColor(invoice.transactionType)}`}>
                      {invoice.transactionType || 'Sales Order'}
                    </span>
                  </td>
                  <td className="px-5 py-3 whitespace-nowrap">
                    <span className="text-xs font-bold text-gray-900 font-mono">
                      ${(invoice.grandTotal || 0).toFixed(2)}
                    </span>
                  </td>
                  <td className="px-5 py-3 whitespace-nowrap">
                    {userRole === 'office' ? (
                      <div className="relative">
                        <select 
                          value={invoice.status || 'pending'} 
                          onChange={(e) => handleStatusChange(invoice.id, e.target.value)}
                          disabled={invoice.archived}
                          className={`text-[10px] font-bold px-2 py-1 pr-6 rounded-full border appearance-none cursor-pointer focus:outline-none focus:ring-1 focus:ring-offset-1 focus:ring-gray-300 ${getStatusColor(invoice.status)}`}
                        >
                          <option value="pending">Pending</option>
                          <option value="in-process">In Process</option>
                          <option value="completed">Completed</option>
                        </select>
                        <div className="absolute inset-y-0 right-2 flex items-center pointer-events-none">
                          <svg className="h-2 w-2 text-current opacity-60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" />
                          </svg>
                        </div>
                      </div>
                    ) : (
                      <span className={`inline-flex px-2 py-1 text-[10px] font-bold rounded-full border ${getStatusColor(invoice.status)}`}>
                        {invoice.status || 'pending'}
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-3 whitespace-nowrap text-right">
                    <div className="flex items-center justify-end space-x-2">
                      <button 
                        onClick={() => setPreviewInvoice(invoice)} 
                        className="text-gray-400 hover:text-blue-600 transition-colors p-1 rounded hover:bg-blue-50" 
                        title="Preview"
                      >
                        <SafeIcon icon={FiEye} className="text-sm" />
                      </button>
                      
                      {!invoice.archived && (userRole === 'office' || (userRole === 'salesman' && invoice.salesRep === user?.name)) && (
                        <Link 
                          to={userRole === 'office' ? `/office/invoice/edit/${invoice.id}` : `/salesman/invoice/edit/${invoice.id}`} 
                          className="text-gray-400 hover:text-emerald-600 transition-colors p-1 rounded hover:bg-emerald-50" 
                          title="Edit"
                        >
                          <SafeIcon icon={FiEdit} className="text-sm" />
                        </Link>
                      )}
                      
                      {(invoice.archived || invoice.status === 'completed') && (
                        <button 
                          onClick={() => handleArchiveToggle(invoice.id, invoice.archived, invoice.status)} 
                          className={`${invoice.archived ? 'text-blue-400 hover:text-blue-600 hover:bg-blue-50' : 'text-gray-400 hover:text-amber-600 hover:bg-amber-50'} transition-colors p-1 rounded`} 
                          title={invoice.archived ? 'Restore' : 'Archive'}
                        >
                          <SafeIcon icon={invoice.archived ? FiRefreshCw : FiArchive} className="text-sm" />
                        </button>
                      )}
                      
                      <button 
                        onClick={() => handleDeleteConfirm(invoice.id)} 
                        className="text-gray-400 hover:text-red-600 transition-colors p-1 rounded hover:bg-red-50" 
                        title="Delete"
                      >
                        <SafeIcon icon={FiTrash2} className="text-sm" />
                      </button>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
          
          {filteredInvoices.length === 0 && (
            <div className="text-center py-16 bg-gray-50/30">
              <SafeIcon icon={FiSearch} className="mx-auto h-8 w-8 text-gray-300 mb-3" />
              <p className="text-sm text-gray-500 font-medium">No invoices found</p>
              <p className="text-xs text-gray-400 mt-1">Try adjusting your search or filters</p>
            </div>
          )}
        </div>
      </motion.div>

      {/* Preview Modal */}
      {previewInvoice && (
        <InvoicePreview invoiceData={previewInvoice} onClose={() => setPreviewInvoice(null)} />
      )}

      {/* Delete Confirmation Modal */}
      {confirmDelete && (
        <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-xl shadow-xl p-6 max-w-sm w-full"
          >
            <h3 className="text-base font-bold text-gray-900 mb-2">Delete Invoice?</h3>
            <p className="text-xs text-gray-600 mb-6 leading-relaxed">
              Are you sure you want to delete this invoice? This action cannot be undone and the data will be permanently removed.
            </p>
            <div className="flex justify-end space-x-3">
              <button 
                onClick={() => setConfirmDelete(null)}
                className="px-4 py-2 border border-gray-200 rounded-lg text-xs font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={confirmDeleteInvoice}
                className="px-4 py-2 bg-red-600 text-white rounded-lg text-xs font-semibold hover:bg-red-700 shadow-sm transition-colors"
              >
                Delete Invoice
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default InvoiceList;