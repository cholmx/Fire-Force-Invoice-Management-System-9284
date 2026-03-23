import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import ReactECharts from 'echarts-for-react';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import SafeIcon from '../../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';

const { FiFileText, FiDollarSign, FiClock, FiCheckCircle, FiPlus, FiTrendingUp, FiActivity } = FiIcons;

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const SalesmanStats = () => {
  const { invoices } = useData();
  const { user } = useAuth();

  const myInvoices = invoices.filter(inv => inv.salesRep === user?.name);
  const totalInvoices = myInvoices.length;
  const pendingInvoices = myInvoices.filter(inv => inv.status === 'pending').length;
  const completedInvoices = myInvoices.filter(inv => inv.status === 'completed').length;
  const inProcessInvoices = myInvoices.filter(inv => inv.status === 'in-process').length;
  const totalRevenue = myInvoices.reduce((sum, inv) => sum + (inv.grandTotal || 0), 0);

  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth();

  const monthlyRevenue = useMemo(() => {
    const data = Array(12).fill(0);
    myInvoices
      .filter(inv => new Date(inv.date).getFullYear() === currentYear && !inv.archived)
      .forEach(inv => {
        data[new Date(inv.date).getMonth()] += inv.grandTotal || 0;
      });
    return data;
  }, [myInvoices, currentYear]);

  const thisMonthRevenue = monthlyRevenue[currentMonth];
  const lastMonthRevenue = monthlyRevenue[currentMonth > 0 ? currentMonth - 1 : 11];
  const monthGrowth = lastMonthRevenue > 0
    ? (((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100).toFixed(1)
    : null;

  const typeBreakdown = useMemo(() => ({
    salesOrders: myInvoices.filter(inv => inv.transactionType === 'Sales Order').length,
    serviceOrders: myInvoices.filter(inv => inv.transactionType === 'Service Order').length,
    quotes: myInvoices.filter(inv => inv.transactionType === 'Quote').length,
  }), [myInvoices]);

  const recentInvoices = [...myInvoices]
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 5);

  const lineOption = {
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
    grid: { left: '2%', right: '2%', top: '10%', bottom: '8%', containLabel: true },
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
      splitLine: { lineStyle: { color: '#f3f4f6' } },
    },
    series: [{
      type: 'line',
      smooth: true,
      data: monthlyRevenue.map((v, i) => ({
        value: parseFloat(v.toFixed(2)),
        itemStyle: { color: i === currentMonth ? '#DC2725' : '#fca5a5' },
        symbolSize: i === currentMonth ? 8 : 5,
      })),
      lineStyle: {
        color: { type: 'linear', x: 0, y: 0, x2: 1, y2: 0, colorStops: [{ offset: 0, color: '#fca5a5' }, { offset: 1, color: '#DC2725' }] },
        width: 2.5,
      },
      symbol: 'circle',
      areaStyle: {
        color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: 'rgba(220,39,37,0.15)' }, { offset: 1, color: 'rgba(220,39,37,0)' }] },
      },
    }],
  };

  const donutOption = {
    tooltip: {
      trigger: 'item',
      formatter: '{b}: {c} ({d}%)',
      backgroundColor: '#fff',
      borderColor: '#e5e7eb',
      textStyle: { color: '#374151', fontSize: 12 },
    },
    series: [{
      type: 'pie',
      radius: ['50%', '75%'],
      center: ['50%', '50%'],
      data: [
        { value: typeBreakdown.salesOrders, name: 'Sales', itemStyle: { color: '#DC2725' } },
        { value: typeBreakdown.serviceOrders, name: 'Service', itemStyle: { color: '#16a34a' } },
        { value: typeBreakdown.quotes, name: 'Quotes', itemStyle: { color: '#f59e0b' } },
      ].filter(d => d.value > 0),
      label: { show: false },
      emphasis: { itemStyle: { shadowBlur: 8, shadowColor: 'rgba(0,0,0,0.1)' } },
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

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'bg-emerald-100 text-emerald-700';
      case 'in-process': return 'bg-blue-50 text-blue-700';
      default: return 'bg-amber-50 text-amber-700';
    }
  };

  return (
    <div className="space-y-5">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { title: 'Total Revenue', value: `$${totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}`, icon: FiDollarSign, color: 'text-red-600', bg: 'bg-red-50', link: '/salesman/invoices' },
          { title: 'Total Invoices', value: totalInvoices, icon: FiFileText, color: 'text-blue-600', bg: 'bg-blue-50', link: '/salesman/invoices' },
          { title: 'Pending', value: pendingInvoices, icon: FiClock, color: 'text-amber-600', bg: 'bg-amber-50', link: '/salesman/invoices?status=pending' },
          { title: 'Completed', value: completedInvoices, icon: FiCheckCircle, color: 'text-emerald-600', bg: 'bg-emerald-50', link: '/salesman/invoices?status=completed' },
        ].map((card, i) => (
          <motion.div key={card.title} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}>
            <Link to={card.link} className="block bg-white p-4 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-2">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{card.title}</p>
                <div className={`w-7 h-7 ${card.bg} rounded-lg flex items-center justify-center`}>
                  <SafeIcon icon={card.icon} className={`${card.color} text-sm`} />
                </div>
              </div>
              <p className="text-xl font-bold text-gray-900">{card.value}</p>
            </Link>
          </motion.div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Revenue Trend */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-1">
            <div>
              <h3 className="text-sm font-bold text-gray-900">My Revenue — {currentYear}</h3>
              <p className="text-xs text-gray-400 mt-0.5">
                This month: <span className="font-semibold text-gray-700">${thisMonthRevenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                {monthGrowth !== null && (
                  <span className={`ml-2 font-bold ${parseFloat(monthGrowth) >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                    {parseFloat(monthGrowth) >= 0 ? '▲' : '▼'} {Math.abs(monthGrowth)}% vs last month
                  </span>
                )}
              </p>
            </div>
            <SafeIcon icon={FiTrendingUp} className="text-red-400 text-lg" />
          </div>
          <ReactECharts option={lineOption} style={{ height: '200px' }} />
        </motion.div>

        {/* Type Breakdown */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
          className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
          <h3 className="text-sm font-bold text-gray-900 mb-1">Invoice Types</h3>
          <p className="text-xs text-gray-400 mb-3">Distribution of all time</p>
          {totalInvoices > 0 ? (
            <>
              <ReactECharts option={donutOption} style={{ height: '130px' }} />
              <div className="space-y-2 mt-2">
                {[
                  { label: 'Sales Orders', count: typeBreakdown.salesOrders, color: 'bg-red-500' },
                  { label: 'Service Orders', count: typeBreakdown.serviceOrders, color: 'bg-emerald-500' },
                  { label: 'Quotes', count: typeBreakdown.quotes, color: 'bg-amber-500' },
                ].map(item => (
                  <div key={item.label} className="flex items-center justify-between text-xs">
                    <div className="flex items-center space-x-2">
                      <div className={`w-2 h-2 rounded-full ${item.color}`} />
                      <span className="text-gray-600">{item.label}</span>
                    </div>
                    <span className="font-bold text-gray-900">{item.count}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="h-48 flex items-center justify-center text-gray-400 text-xs">No invoices yet</div>
          )}
        </motion.div>
      </div>

      {/* Status Summary Bar */}
      {totalInvoices > 0 && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
          className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-gray-900">Status Overview</h3>
            <SafeIcon icon={FiActivity} className="text-gray-400 text-sm" />
          </div>
          <div className="flex rounded-full overflow-hidden h-3 mb-3">
            {completedInvoices > 0 && (
              <div className="bg-emerald-500 transition-all" style={{ width: `${(completedInvoices / totalInvoices) * 100}%` }} />
            )}
            {inProcessInvoices > 0 && (
              <div className="bg-blue-400 transition-all" style={{ width: `${(inProcessInvoices / totalInvoices) * 100}%` }} />
            )}
            {pendingInvoices > 0 && (
              <div className="bg-amber-400 transition-all" style={{ width: `${(pendingInvoices / totalInvoices) * 100}%` }} />
            )}
          </div>
          <div className="flex items-center space-x-5 text-xs">
            {[
              { label: 'Completed', count: completedInvoices, color: 'bg-emerald-500' },
              { label: 'In Process', count: inProcessInvoices, color: 'bg-blue-400' },
              { label: 'Pending', count: pendingInvoices, color: 'bg-amber-400' },
            ].map(s => (
              <div key={s.label} className="flex items-center space-x-1.5">
                <div className={`w-2 h-2 rounded-full ${s.color}`} />
                <span className="text-gray-500">{s.label}:</span>
                <span className="font-bold text-gray-900">{s.count}</span>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Recent Invoices */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }}
        className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-200 flex justify-between items-center">
          <h3 className="text-sm font-bold text-gray-900">Recent Invoices</h3>
          <Link to="/salesman/invoices" className="text-xs font-medium text-red-600 hover:text-red-700">View All</Link>
        </div>
        <div className="divide-y divide-gray-100">
          {recentInvoices.length > 0 ? (
            recentInvoices.map((invoice) => (
              <div key={invoice.id} className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-center space-x-3">
                  <div className={`w-1.5 h-8 rounded-full ${invoice.status === 'completed' ? 'bg-emerald-400' : invoice.status === 'in-process' ? 'bg-blue-400' : 'bg-amber-400'}`} />
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{invoice.customerName || 'Unnamed'}</p>
                    <p className="text-[10px] text-gray-400">#{invoice.poNumber || 'N/A'} · {new Date(invoice.date).toLocaleDateString()}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <span className={`hidden sm:inline-flex px-2 py-0.5 text-[10px] font-semibold rounded-full border ${getTypeColor(invoice.transactionType)}`}>
                    {invoice.transactionType}
                  </span>
                  <span className={`px-2 py-0.5 text-[10px] font-semibold rounded-full ${getStatusColor(invoice.status)}`}>
                    {invoice.status}
                  </span>
                  <span className="text-sm font-bold text-gray-900 w-20 text-right">
                    ${(invoice.grandTotal || 0).toFixed(2)}
                  </span>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-12 bg-gray-50/30">
              <SafeIcon icon={FiFileText} className="text-3xl text-gray-300 mx-auto mb-3" />
              <p className="text-sm text-gray-500 font-medium">No invoices yet</p>
              <Link to="/salesman/invoice/new"
                className="mt-4 inline-flex items-center space-x-2 px-4 py-2 bg-brand-gradient text-white rounded-lg text-xs font-semibold">
                <SafeIcon icon={FiPlus} />
                <span>Create First Invoice</span>
              </Link>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default SalesmanStats;