import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import InvoicePreview from '../invoice/InvoicePreview';
import SafeIcon from '../../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';

const { FiFileText, FiDollarSign, FiUsers, FiTrendingUp, FiRefreshCw, FiEye } = FiIcons;

const OfficeStats = () => {
  const { invoices, customers } = useData();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [previewInvoice, setPreviewInvoice] = useState(null);

  const totalInvoices = invoices.length;
  const totalCustomers = customers.length;
  const totalRevenue = invoices.reduce((sum, inv) => sum + (inv.grandTotal || 0), 0);
  const avgInvoiceValue = totalInvoices > 0 ? totalRevenue / totalInvoices : 0;

  const stats = [
    { title: 'Total Invoices', value: totalInvoices, icon: FiFileText, bgColor: 'bg-gradient-to-br from-blue-500 to-blue-600' },
    { title: 'Total Revenue', value: `$${totalRevenue.toFixed(2)}`, icon: FiDollarSign, bgColor: 'bg-gradient-to-br from-green-500 to-green-600' },
    { title: 'Total Customers', value: totalCustomers, icon: FiUsers, bgColor: 'bg-gradient-to-br from-purple-500 to-purple-600' },
    { title: 'Avg Invoice Value', value: `$${avgInvoiceValue.toFixed(2)}`, icon: FiTrendingUp, bgColor: 'bg-brand-gradient' }
  ];

  // Get quotes that were converted to sales orders
  const convertedQuotes = invoices
    .filter(invoice => {
      // Check if this invoice was originally a quote and later converted
      // We can track this by looking for invoices that have been updated and changed transaction type
      return invoice.transactionType === 'Sales Order' && invoice.updatedAt && invoice.updatedAt !== invoice.createdAt;
    })
    .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
    .slice(0, 5);

  const getTypeColor = (type) => {
    switch (type) {
      case 'Sales Order': return 'bg-red-600 text-white';
      case 'Service Order': return 'bg-green-600 text-white';
      case 'Quote': return 'bg-amber-500 text-white';
      default: return 'bg-gray-600 text-white';
    }
  };

  const handleInvoiceClick = (invoice) => {
    setPreviewInvoice(invoice);
  };

  const handleInvoiceEdit = (invoice) => {
    navigate(`/office/invoice/edit/${invoice.id}`);
  };

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
      >
        {stats.map((stat, index) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-white rounded-xl shadow-lg overflow-hidden"
          >
            <div className={`h-2 ${stat.title === 'Avg Invoice Value' ? 'bg-brand-gradient' : stat.bgColor}`}></div>
            <div className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                  <p className="text-2xl font-title font-bold text-gray-900">{stat.value}</p>
                </div>
                <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                  <SafeIcon icon={stat.icon} className="text-white text-xl" />
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white rounded-xl shadow-lg"
        >
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center space-x-2">
              <SafeIcon icon={FiRefreshCw} className="text-gradient-start" />
              <h3 className="text-lg font-title font-semibold text-gray-900">Quote Conversions</h3>
            </div>
          </div>
          <div className="p-6">
            {convertedQuotes.length > 0 ? (
              <div className="space-y-4">
                {convertedQuotes.map((invoice) => (
                  <div
                    key={invoice.id}
                    className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-green-50 rounded-lg border border-blue-100 hover:shadow-md transition-all duration-200 cursor-pointer group"
                  >
                    <div className="flex-1" onClick={() => handleInvoiceClick(invoice)}>
                      <p className="font-medium text-gray-900 group-hover:text-blue-700 transition-colors">
                        {invoice.customerName || 'Unnamed Customer'}
                      </p>
                      <p className="text-sm text-gray-600">
                        P.O.# {invoice.poNumber || 'N/A'} • by {invoice.salesRep || 'Unknown'}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        Converted on {new Date(invoice.updatedAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right flex items-center space-x-3">
                      <div>
                        <p className="font-semibold text-gray-900">
                          ${(invoice.grandTotal || 0).toFixed(2)}
                        </p>
                        <div className="flex items-center space-x-2 mt-1">
                          <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-amber-500 text-white">
                            Quote
                          </span>
                          <SafeIcon icon={FiRefreshCw} className="text-xs text-gray-400" />
                          <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-red-600 text-white">
                            Sales Order
                          </span>
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
                        <button
                          onClick={() => handleInvoiceEdit(invoice)}
                          className="text-green-600 hover:text-green-800"
                          title="Edit Invoice"
                        >
                          <SafeIcon icon={FiFileText} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 bg-gradient-to-br from-blue-50 to-green-50 rounded-lg">
                <SafeIcon icon={FiRefreshCw} className="text-4xl text-gray-300 mx-auto mb-2" />
                <p className="text-gray-600">No quotes converted to sales orders yet</p>
                <p className="text-sm text-gray-500 mt-1">
                  When salesmen convert quotes to sales orders, they'll appear here
                </p>
              </div>
            )}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-white rounded-xl shadow-lg"
        >
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-title font-semibold text-gray-900">Recent Activity</h3>
          </div>
          <div className="p-6">
            {invoices.length > 0 ? (
              <div className="space-y-4">
                {invoices
                  .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
                  .slice(0, 5)
                  .map((invoice) => (
                    <div
                      key={invoice.id}
                      className="flex items-center justify-between p-3 bg-gradient-to-r from-gray-50 to-white rounded-lg border border-gray-100 hover:shadow-md transition-all duration-200 cursor-pointer group"
                    >
                      <div className="flex-1" onClick={() => handleInvoiceClick(invoice)}>
                        <p className="font-medium text-gray-900 group-hover:text-blue-700 transition-colors">
                          {invoice.customerName || 'Unnamed Customer'}
                        </p>
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
                            <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${invoice.status === 'completed' ? 'bg-green-100 text-green-800' : invoice.status === 'in-process' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}`}>
                              {invoice.status || 'pending'}
                            </span>
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
                          <button
                            onClick={() => handleInvoiceEdit(invoice)}
                            className="text-green-600 hover:text-green-800"
                            title="Edit Invoice"
                          >
                            <SafeIcon icon={FiFileText} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">No invoices found</p>
            )}
          </div>
        </motion.div>
      </div>

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