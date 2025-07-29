import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import SafeIcon from '../../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';

const { FiFileText, FiDollarSign, FiClock, FiCheckCircle, FiPlus } = FiIcons;

const SalesmanStats = () => {
  const { invoices } = useData();
  const { user } = useAuth();

  const myInvoices = invoices.filter(invoice => invoice.salesRep === user?.name);
  const totalInvoices = myInvoices.length;
  const pendingInvoices = myInvoices.filter(inv => inv.status === 'pending').length;
  const completedInvoices = myInvoices.filter(inv => inv.status === 'completed').length;
  const totalRevenue = myInvoices.reduce((sum, inv) => {
    return sum + (inv.grandTotal || 0);
  }, 0);

  const stats = [
    { title: 'Total Invoices', value: totalInvoices, icon: FiFileText, color: 'blue', bgColor: 'bg-gradient-to-br from-blue-500 to-blue-600' },
    { title: 'Total Revenue', value: `$${totalRevenue.toFixed(2)}`, icon: FiDollarSign, color: 'green', bgColor: 'bg-gradient-to-br from-green-500 to-green-600' },
    { title: 'Pending', value: pendingInvoices, icon: FiClock, color: 'yellow', bgColor: 'bg-gradient-to-br from-yellow-500 to-yellow-600' },
    { title: 'Completed', value: completedInvoices, icon: FiCheckCircle, color: 'red', bgColor: 'bg-brand-gradient' }
  ];

  const getTypeColor = (type) => {
    switch (type) {
      case 'Sales Order': return 'bg-red-600 text-white';
      case 'Service Order': return 'bg-green-600 text-white';
      case 'Quote': return 'bg-amber-500 text-white';
      default: return 'bg-gray-600 text-white';
    }
  };

  const recentInvoices = myInvoices
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 5);

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
            <div className={`h-2 ${stat.title === 'Completed' ? 'bg-brand-gradient' : stat.bgColor}`}></div>
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

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-white rounded-xl shadow-lg"
      >
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-title font-semibold text-gray-900">Recent Invoices</h3>
        </div>
        <div className="p-6">
          {recentInvoices.length > 0 ? (
            <div className="space-y-4">
              {recentInvoices.map((invoice) => (
                <div
                  key={invoice.id}
                  className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-white rounded-lg border border-gray-100"
                >
                  <div>
                    <p className="font-medium text-gray-900">
                      {invoice.customerName || 'Unnamed Customer'}
                    </p>
                    <p className="text-sm text-gray-600">
                      P.O.# {invoice.poNumber || 'N/A'}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-900">
                      ${(invoice.grandTotal || 0).toFixed(2)}
                    </p>
                    <div className="flex items-center space-x-2 mt-1">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getTypeColor(invoice.transactionType)}`}>
                        {invoice.transactionType || 'Sales Order'}
                      </span>
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                        invoice.status === 'completed' ? 'bg-green-100 text-green-800' :
                        invoice.status === 'in-process' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {invoice.status || 'pending'}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 bg-gradient-to-br from-red-50 to-orange-50 rounded-lg">
              <SafeIcon icon={FiFileText} className="text-4xl text-gradient-end mx-auto mb-2" />
              <p className="text-gray-700">No invoices created yet</p>
              <Link
                to="/salesman/invoice/new"
                className="mt-4 inline-flex items-center px-4 py-2 bg-brand-gradient hover:bg-brand-gradient-hover text-white rounded-lg transition-all duration-300"
              >
                <SafeIcon icon={FiPlus} className="mr-2" />
                <span>Create Your First Invoice</span>
              </Link>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default SalesmanStats;