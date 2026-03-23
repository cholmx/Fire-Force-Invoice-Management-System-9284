import React, { useMemo, useState } from 'react';
import ReactECharts from 'echarts-for-react';
import { useData } from '../../../context/DataContext';
import SafeIcon from '../../../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';

const { FiTrendingUp, FiDollarSign, FiFileText, FiCalendar } = FiIcons;

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const RevenueReport = () => {
  const { invoices } = useData();
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(currentYear);

  const years = useMemo(() => {
    const ys = new Set(invoices.map(inv => new Date(inv.date).getFullYear()));
    ys.add(currentYear);
    return Array.from(ys).sort((a, b) => b - a);
  }, [invoices, currentYear]);

  const monthlyData = useMemo(() => {
    const data = Array(12).fill(0).map(() => ({
      revenue: 0, count: 0, salesOrders: 0, serviceOrders: 0, quotes: 0,
    }));
    invoices
      .filter(inv => new Date(inv.date).getFullYear() === selectedYear && !inv.archived)
      .forEach(inv => {
        const m = new Date(inv.date).getMonth();
        data[m].revenue += inv.grandTotal || 0;
        data[m].count += 1;
        if (inv.transactionType === 'Sales Order') data[m].salesOrders += 1;
        else if (inv.transactionType === 'Service Order') data[m].serviceOrders += 1;
        else if (inv.transactionType === 'Quote') data[m].quotes += 1;
      });
    return data;
  }, [invoices, selectedYear]);

  const totalRevenue = monthlyData.reduce((s, m) => s + m.revenue, 0);
  const totalCount = monthlyData.reduce((s, m) => s + m.count, 0);
  const bestMonth = monthlyData.reduce((best, m, i) => m.revenue > best.revenue ? { ...m, index: i } : best, { revenue: 0, index: -1 });

  const barOption = {
    tooltip: {
      trigger: 'axis',
      formatter: (params) => {
        const month = MONTHS[params[0].dataIndex];
        return `<b>${month} ${selectedYear}</b><br/>Revenue: $${params[0].value.toLocaleString(undefined, { minimumFractionDigits: 2 })}<br/>Invoices: ${monthlyData[params[0].dataIndex].count}`;
      },
      backgroundColor: '#fff',
      borderColor: '#e5e7eb',
      textStyle: { color: '#374151', fontSize: 12 },
    },
    grid: { left: '3%', right: '3%', bottom: '3%', containLabel: true },
    xAxis: {
      type: 'category',
      data: MONTHS,
      axisLine: { lineStyle: { color: '#e5e7eb' } },
      axisLabel: { color: '#9ca3af', fontSize: 11 },
    },
    yAxis: {
      type: 'value',
      axisLabel: {
        color: '#9ca3af', fontSize: 11,
        formatter: (v) => v >= 1000 ? `$${(v / 1000).toFixed(0)}k` : `$${v}`,
      },
      splitLine: { lineStyle: { color: '#f3f4f6' } },
    },
    series: [{
      type: 'bar',
      data: monthlyData.map((m, i) => ({
        value: parseFloat(m.revenue.toFixed(2)),
        itemStyle: {
          color: i === bestMonth.index
            ? { type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: '#DC2725' }, { offset: 1, color: '#E74E11' }] }
            : { type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: '#fca5a5' }, { offset: 1, color: '#fed7aa' }] },
          borderRadius: [4, 4, 0, 0],
        },
      })),
      barMaxWidth: 40,
    }],
  };

  const typeOption = {
    tooltip: {
      trigger: 'item',
      formatter: '{b}: {c} ({d}%)',
      backgroundColor: '#fff',
      borderColor: '#e5e7eb',
      textStyle: { color: '#374151', fontSize: 12 },
    },
    legend: {
      bottom: 0,
      textStyle: { color: '#6b7280', fontSize: 11 },
    },
    series: [{
      type: 'pie',
      radius: ['45%', '70%'],
      center: ['50%', '45%'],
      data: [
        { value: monthlyData.reduce((s, m) => s + m.salesOrders, 0), name: 'Sales Orders', itemStyle: { color: '#DC2725' } },
        { value: monthlyData.reduce((s, m) => s + m.serviceOrders, 0), name: 'Service Orders', itemStyle: { color: '#16a34a' } },
        { value: monthlyData.reduce((s, m) => s + m.quotes, 0), name: 'Quotes', itemStyle: { color: '#f59e0b' } },
      ].filter(d => d.value > 0),
      label: { show: false },
      emphasis: { itemStyle: { shadowBlur: 10, shadowOffsetX: 0, shadowColor: 'rgba(0,0,0,0.1)' } },
    }],
  };

  return (
    <div className="space-y-6">
      {/* Year Selector */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider">Monthly Revenue Breakdown</h3>
        <div className="flex items-center space-x-2">
          <SafeIcon icon={FiCalendar} className="text-gray-400 text-sm" />
          <select
            value={selectedYear}
            onChange={e => setSelectedYear(parseInt(e.target.value))}
            className="px-3 py-1.5 border border-gray-200 rounded-lg text-xs font-semibold text-gray-700 bg-gray-50 focus:ring-1 focus:ring-red-500"
          >
            {years.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { label: 'Total Revenue', value: `$${totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}`, icon: FiDollarSign, color: 'text-red-600', bg: 'bg-red-50' },
          { label: 'Total Invoices', value: totalCount, icon: FiFileText, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Best Month', value: bestMonth.index >= 0 ? MONTHS[bestMonth.index] : '—', icon: FiTrendingUp, color: 'text-emerald-600', bg: 'bg-emerald-50' },
        ].map(card => (
          <div key={card.label} className="flex items-center space-x-4 p-4 bg-gray-50 rounded-xl border border-gray-100">
            <div className={`w-10 h-10 ${card.bg} rounded-lg flex items-center justify-center flex-shrink-0`}>
              <SafeIcon icon={card.icon} className={`${card.color} text-lg`} />
            </div>
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">{card.label}</p>
              <p className="text-xl font-bold text-gray-900">{card.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-gray-50 rounded-xl p-4 border border-gray-100">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Monthly Revenue ({selectedYear})</p>
          <ReactECharts option={barOption} style={{ height: '260px' }} />
        </div>
        <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">By Type</p>
          {totalCount > 0
            ? <ReactECharts option={typeOption} style={{ height: '260px' }} />
            : <div className="h-64 flex items-center justify-center text-gray-400 text-sm">No data for {selectedYear}</div>
          }
        </div>
      </div>

      {/* Monthly Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-gray-200">
              {['Month', 'Revenue', 'Invoices', 'Sales Orders', 'Service Orders', 'Quotes', 'Avg. Value'].map(h => (
                <th key={h} className="px-3 py-2 text-left font-bold text-gray-400 uppercase tracking-wider whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {monthlyData.map((m, i) => (
              <tr key={i} className={`hover:bg-gray-50 transition-colors ${i === bestMonth.index ? 'bg-red-50/50' : ''}`}>
                <td className="px-3 py-2 font-semibold text-gray-900">
                  {MONTHS[i]} {i === bestMonth.index && <span className="ml-1 text-[9px] text-red-600 bg-red-100 px-1 py-0.5 rounded font-bold">BEST</span>}
                </td>
                <td className="px-3 py-2 font-bold text-gray-900">${m.revenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                <td className="px-3 py-2 text-gray-600">{m.count}</td>
                <td className="px-3 py-2 text-red-600">{m.salesOrders}</td>
                <td className="px-3 py-2 text-emerald-600">{m.serviceOrders}</td>
                <td className="px-3 py-2 text-amber-600">{m.quotes}</td>
                <td className="px-3 py-2 text-gray-600">{m.count > 0 ? `$${(m.revenue / m.count).toFixed(2)}` : '—'}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-gray-200 bg-gray-50 font-bold">
              <td className="px-3 py-2 text-gray-900">Total</td>
              <td className="px-3 py-2 text-gray-900">${totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
              <td className="px-3 py-2 text-gray-900">{totalCount}</td>
              <td className="px-3 py-2 text-red-600">{monthlyData.reduce((s, m) => s + m.salesOrders, 0)}</td>
              <td className="px-3 py-2 text-emerald-600">{monthlyData.reduce((s, m) => s + m.serviceOrders, 0)}</td>
              <td className="px-3 py-2 text-amber-600">{monthlyData.reduce((s, m) => s + m.quotes, 0)}</td>
              <td className="px-3 py-2 text-gray-900">{totalCount > 0 ? `$${(totalRevenue / totalCount).toFixed(2)}` : '—'}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
};

export default RevenueReport;