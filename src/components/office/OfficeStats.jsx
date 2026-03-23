import React, { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import ReactECharts from 'echarts-for-react';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import InvoicePreview from '../invoice/InvoicePreview';
import SafeIcon from '../../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';

const { FiEye, FiArchive, FiTrendingUp, FiBarChart3 } = FiIcons;

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const OfficeStats = () => {
  const { invoices, customers, updateInvoice } = useData();
  const [previewInvoice, setPreviewInvoice] = useState(null);

  const totalInvoices = invoices.length;
  const totalRevenue = invoices.reduce((sum, inv) => sum + (inv.grandTotal || 0), 0);

  const activeInvoices = invoices
    .filter(invoice => !invoice.archived)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 5);

  const currentYear = new Date().getFullYear();
  const monthlyRevenue = useMemo(() => {
    const data = Array(12).fill(0);
    invoices
      .filter(inv => new Date(inv.date).getFullYear() === currentYear && !inv.archived)
      .forEach(inv => {
        data[new Date(inv.date).getMonth()] += inv.grandTotal || 0;
      });
    return data;
  }, [invoices, currentYear]);

  const chartOption = {
    tooltip: {
      trigger: 'axis',
      formatter: (params) => {
        const val = params[0].value;
        return `<b>${MONTHS[params[0].dataIndex]}</b><br/>$${val.toLocaleString(undefined, { minimumFractionDigits: 2 })}`;
      },
      backgroundColor: '#fff',
      borderColor: '#e5e7eb',
      textStyle: { color: '#374151', fontSize: 12 },
    },
    grid: { left: '2%', right: '2%', top: '8%', bottom: '8%', containLabel: true },
    xAxis: {
      type: 'category',
      data: MONTHS,
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: { color: '#9ca3af', fontSize: 10 },
    },
    yAxis: {
      type: 'value',
      axisLabel: {
        color: '#9ca3af', fontSize: 10,
        formatter: v => v >= 1000 ? `$${(v / 1000).toFixed(0)}k` : `$${v}`,
      },
      splitLine: { lineStyle: { color: '#f9fafb' } },
    },
    series: [{
      type: 'bar',
      data: monthlyRevenue.map((v, i) => ({
        value: parseFloat(v.toFixed(2)),
        itemStyle: {
          color: {
            type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: i === new Date().getMonth() ? '#DC2725' : '#fca5a5' },
              { offset: 1, color: i === new Date().getMonth() ? '#E74E11' : '#fed7aa' },
            ],
          },
          borderRadius: [3, 3, 0, 0],
        },
      })),
      barMaxWidth: 32,
    }],
  };

  const getTypeColor = (type) => {
    switch (type) {
      case 'Sales Order': return 'text-red-600 bg-red-50 border-red-100';
      case 'Service Order': return 'text-emerald-600 bg-emerald-50 border-emerald-100';
      case 'Quote': return 'text-amber-600 bg-amber-50 border-amber-100';
      default: return 'text-gray-600 bg-gray-50 border-gray-100';
    }
  };

  const handleStatusChange = async (invoiceId, newStatus) => {
    try { await updateInvoice(invoiceId, { status: newStatus }); }
    catch (error) { console.error('Error updating invoice status:', error); }
  };

  const handleArchiveInvoice = async (invoiceId) => {
    try { await updateInvoice(invoiceId, { archived: true }); }
    catch (error) { console.error('Error archiving invoice:', error); }
  };

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          className="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Total Revenue</p>
          <h3 className="text-2xl font-bold text-gray-900 mt-1">
            ${totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </h3>
          <div className="mt-2 text-xs text-emerald-600 flex items-center">
            <SafeIcon icon={FiTrendingUp} className="mr-1" />
            <span>All time volume</span>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Total Invoices</p>
          <h3 className="text-2xl font-bold text-gray-900 mt-1">{totalInvoices}</h3>
          <p className="mt-2 text-xs text-gray-500">Processed documents</p>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Total Customers</p>
          <h3 className="text-2xl font-bold text-gray-900 mt-1">{customers.length}</h3>
          <p className="mt-2 text-xs text-gray-500">Active accounts</p>
        </motion.div>
      </div>

      {/* Monthly Revenue Chart */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
        className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h3 className="text-sm font-bold text-gray-900">Monthly Revenue — {currentYear}</h3>
            <p className="text-xs text-gray-400 mt-0.5">Highlighted bar = current month</p>
          </div>
          <Link to="/office/reports" className="flex items-center space-x-1.5 text-xs font-semibold text-red-600 hover:text-red-700">
            <SafeIcon icon={FiBarChart3} className="text-sm" />
            <span>Full Reports</span>
          </Link>
        </div>
        <ReactECharts option={chartOption} style={{ height: '200px' }} />
      </motion.div>

      {/* Recent Activity */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
        className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-200 flex justify-between items-center">
          <h3 className="text-sm font-bold text-gray-900">Recent Activity</h3>
          <Link to="/office/invoices" className="text-xs font-medium text-red-600 hover:text-red-700">View All</Link>
        </div>
        <div className="divide-y divide-gray-100">
          {activeInvoices.length > 0 ? (
            activeInvoices.map((invoice) => (
              <div key={invoice.id} className="p-4 hover:bg-gray-50 transition-colors flex items-center justify-between group">
                <div className="flex items-start space-x-3">
                  <div className={`w-2 h-2 mt-1.5 rounded-full ${invoice.status === 'completed' ? 'bg-emerald-500' : 'bg-amber-500'}`}></div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{invoice.customerName || 'Unnamed Customer'}</p>
                    <div className="flex items-center space-x-2 mt-0.5">
                      <span className="text-xs text-gray-500">#{invoice.poNumber || 'N/A'}</span>
                      <span className="text-[10px] text-gray-400">•</span>
                      <span className="text-xs text-gray-500">{invoice.salesRep}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <span className={`inline-flex px-2 py-0.5 text-[10px] font-semibold rounded-full border ${getTypeColor(invoice.transactionType)}`}>
                    {invoice.transactionType}
                  </span>
                  <span className="text-sm font-bold text-gray-900 w-24 text-right">
                    ${(invoice.grandTotal || 0).toFixed(2)}
                  </span>
                  <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => setPreviewInvoice(invoice)}
                      className="p-1.5 text-gray-400 hover:text-blue-600 rounded hover:bg-blue-50">
                      <SafeIcon icon={FiEye} className="text-sm" />
                    </button>
                    {invoice.status === 'completed' && (
                      <button onClick={() => handleArchiveInvoice(invoice.id)}
                        className="p-1.5 text-gray-400 hover:text-amber-600 rounded hover:bg-amber-50">
                        <SafeIcon icon={FiArchive} className="text-sm" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="p-8 text-center text-gray-400 text-sm">No recent activity found</div>
          )}
        </div>
      </motion.div>

      {previewInvoice && (
        <InvoicePreview invoiceData={previewInvoice} onClose={() => setPreviewInvoice(null)} />
      )}
    </div>
  );
};

export default OfficeStats;