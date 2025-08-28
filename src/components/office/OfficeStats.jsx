import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import InvoicePreview from '../invoice/InvoicePreview';
import SafeIcon from '../../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';

const { FiFileText, FiDollarSign, FiUsers, FiTrendingUp, FiRefreshCw, FiEye, FiArchive, FiCheck } = FiIcons;

const OfficeStats = () => {
  const { invoices, customers, updateInvoice } = useData();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [previewInvoice, setPreviewInvoice] = useState(null);

  const totalInvoices = invoices.length;
  const totalCustomers = customers.length;
  const totalRevenue = invoices.reduce((sum, inv) => sum + (inv.grandTotal || 0), 0);
  const avgInvoiceValue = totalInvoices > 0 ? totalRevenue / totalInvoices : 0;

  // Filter out archived invoices for recent activity
  const activeInvoices = invoices
    .filter(invoice => !invoice.archived)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 5);

  const getTypeColor = (type) => {
    switch (type) {
      case 'Sales Order': return 'bg-red-600 text-white';
      case 'Service Order': return 'bg-green-600 text-white';
      case 'Quote': return 'bg-amber-500 text-white';
      default: return 'bg-gray-600 text-white';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'in-process': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-red-100 text-red-800';
    }
  };

  const handleInvoiceClick = (invoice) => {
    setPreviewInvoice(invoice);
  };

  const handleStatusChange = async (invoiceId, newStatus) => {
    try {
      await updateInvoice(invoiceId, { status: newStatus });
    } catch (error) {
      console.error('Error updating invoice status:', error);
    }
  };

  const handleArchiveInvoice = async (invoiceId) => {
    try {
      await updateInvoice(invoiceId, { archived: true });
    } catch (error) {
      console.error('Error archiving invoice:', error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Recent Activity */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white rounded-xl shadow-lg"
      >
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-title font-semibold text-gray-900">Recent Activity</h3>
          <p className="text-sm text-gray-600 mt-1">
            Showing recent invoices that aren't archived
          </p>
        </div>
        <div className="p-6">
          {activeInvoices.length > 0 ? (
            <div className="space-y-4">
              {activeInvoices.map((invoice) => (
                <div
                  key={invoice.id}
                  className="flex items-center justify-between p-3 bg-gradient-to-r from-gray-50 to-white rounded-lg border border-gray-100 hover:shadow-md transition-all duration-200 cursor-pointer group"
                >
                  <div className="flex-1" onClick={() => handleInvoiceClick(invoice)}>
                    <p className="font-medium text-gray-900 group-hover:text-blue-700 transition-colors">
                      {invoice.customerName || 'Unnamed Customer'}
                    </p>
                    {invoice.company && (
                      <p className="text-sm text-gray-600">
                        {invoice.company}
                      </p>
                    )}
                    <p className="text-sm text-gray-600">
                      P.O.# {invoice.poNumber || 'N/A'} • by {invoice.salesRep || 'Unknown'}
                    </p>
                  </div>
                  <div className="text-right flex items-center space-x-3">
                    <div>
                      <p className="font-semibold text-gray-900">
                        ${(invoice.grandTotal || 0).toFixed(2)}
                      </p>
                      <div className="flex items-center space-x-2">
                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getTypeColor(invoice.transactionType)}`}>
                          {invoice.transactionType || 'Sales Order'}
                        </span>
                        {/* Status Dropdown for Status Change */}
                        <select
                          value={invoice.status || 'pending'}
                          onChange={(e) => handleStatusChange(invoice.id, e.target.value)}
                          className={`text-xs font-medium px-2 py-1 rounded-full border-0 ${getStatusColor(invoice.status)}`}
                        >
                          <option value="pending">Pending</option>
                          <option value="in-process">In Process</option>
                          <option value="completed">Completed</option>
                        </select>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleInvoiceClick(invoice)}
                        className="text-blue-600 hover:text-blue-800"
                        title="View Invoice"
                      >
                        <SafeIcon icon={FiEye} />
                      </button>
                      {/* Only show archive button for completed invoices */}
                      {invoice.status === 'completed' && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleArchiveInvoice(invoice.id);
                          }}
                          className="text-amber-600 hover:text-amber-800"
                          title="Archive Invoice"
                        >
                          <SafeIcon icon={FiArchive} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">No active invoices found</p>
          )}
        </div>
      </motion.div>

      {/* Invoice Preview Modal */}
      {previewInvoice && (
        <InvoicePreview
          invoiceData={previewInvoice}
          onClose={() => setPreviewInvoice(null)}
        />
      )}
    </div>
  );
};

export default OfficeStats;