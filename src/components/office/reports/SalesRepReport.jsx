import React, { useMemo, useState } from 'react';
import ReactECharts from 'echarts-for-react';
import { useData } from '../../../context/DataContext';
import SafeIcon from '../../../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';

const { FiUser, FiTrendingUp, FiCalendar, FiChevronDown, FiChevronUp } = FiIcons;

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const REP_COLORS = ['#DC2725', '#2563eb', '#16a34a', '#f59e0b', '#7c3aed', '#0891b2', '#db2777'];

const SalesRepReport = () => {
  const { invoices } = useData();
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [expandedRep, setExpandedRep] = useState(null);

  const years = useMemo(() => {
    const ys = new Set(invoices.map(inv => new Date(inv.date).getFullYear()));
    ys.add(currentYear);
    return Array.from(ys).sort((a, b) => b - a);
  }, [invoices, currentYear]);

  const repData = useMemo(() => {
    const filtered = invoices.filter(inv => new Date(inv.date).getFullYear() === selectedYear && !inv.archived);
    const map = {};
    filtered.forEach(inv => {
      const rep = inv.salesRep || 'Unassigned';
      if (!map[rep]) {
        map[rep] = { name: rep, revenue: 0, count: 0, completed: 0, pending: 0, inProcess: 0, monthly: Array(12).fill(0) };
      }
      map[rep].revenue += inv.grandTotal || 0;
      map[rep].count += 1;
      if (inv.status === 'completed') map[rep].completed += 1;
      else if (inv.status === 'pending') map[rep].pending += 1;
      else if (inv.status === 'in-process') map[rep].inProcess += 1;
      map[rep].monthly[new Date(inv.date).getMonth()] += inv.grandTotal || 0;
    });
    return Object.values(map).sort((a, b) => b.revenue - a.revenue);
  }, [invoices, selectedYear]);

  const totalRevenue = repData.reduce((s, r) => s + r.revenue, 0);

  const barOption = {
    tooltip: {
      trigger: 'axis',
      formatter: (params) => params.map(p => `${p.seriesName}: $${p.value.toLocaleString(undefined, { minimumFractionDigits: 2 })}`).join('<br/>'),
      backgroundColor: '#fff',
      borderColor: '#e5e7eb',
      textStyle: { color: '#374151', fontSize: 12 },
    },
    legend: { bottom: 0, textStyle: { color: '#6b7280', fontSize: 11 } },
    grid: { left: '3%', right: '3%', bottom: '15%', containLabel: true },
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
        formatter: v => v >= 1000 ? `$${(v / 1000).toFixed(0)}k` : `$${v}`,
      },
      splitLine: { lineStyle: { color: '#f3f4f6' } },
    },
    series: repData.slice(0, 5).map((rep, i) => ({
      name: rep.name,
      type: 'line',
      smooth: true,
      data: rep.monthly.map(v => parseFloat(v.toFixed(2))),
      itemStyle: { color: REP_COLORS[i % REP_COLORS.length] },
      lineStyle: { width: 2 },
      symbol: 'circle',
      symbolSize: 5,
    })),
  };

  const shareOption = {
    tooltip: {
      trigger: 'item',
      formatter: (p) => `${p.name}<br/>$${p.value.toLocaleString(undefined, { minimumFractionDigits: 2 })} (${p.percent}%)`,
      backgroundColor: '#fff',
      borderColor: '#e5e7eb',
      textStyle: { color: '#374151', fontSize: 12 },
    },
    legend: { bottom: 0, textStyle: { color: '#6b7280', fontSize: 11 } },
    series: [{
      type: 'pie',
      radius: ['40%', '65%'],
      center: ['50%', '45%'],
      data: repData.map((rep, i) => ({
        value: parseFloat(rep.revenue.toFixed(2)),
        name: rep.name,
        itemStyle: { color: REP_COLORS[i % REP_COLORS.length] },
      })),
      label: { show: false },
      emphasis: { itemStyle: { shadowBlur: 10, shadowColor: 'rgba(0,0,0,0.1)' } },
    }],
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider">Sales Rep Performance</h3>
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

      {repData.length === 0 ? (
        <div className="text-center py-16 text-gray-400 text-sm">No invoice data for {selectedYear}</div>
      ) : (
        <>
          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-gray-50 rounded-xl p-4 border border-gray-100">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Monthly Revenue by Rep ({selectedYear})</p>
              <ReactECharts option={barOption} style={{ height: '260px' }} />
            </div>
            <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Revenue Share</p>
              <ReactECharts option={shareOption} style={{ height: '260px' }} />
            </div>
          </div>

          {/* Rep Cards */}
          <div className="space-y-3">
            {repData.map((rep, i) => {
              const share = totalRevenue > 0 ? ((rep.revenue / totalRevenue) * 100).toFixed(1) : 0;
              const isExpanded = expandedRep === rep.name;
              const color = REP_COLORS[i % REP_COLORS.length];
              return (
                <div key={rep.name} className="border border-gray-200 rounded-xl overflow-hidden">
                  <button
                    onClick={() => setExpandedRep(isExpanded ? null : rep.name)}
                    className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors text-left"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0" style={{ backgroundColor: color }}>
                        {rep.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-gray-900">{rep.name}</p>
                        <p className="text-xs text-gray-500">{rep.count} invoices · {share}% of revenue</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-6">
                      <div className="text-right hidden md:block">
                        <p className="text-xs text-gray-400">Completed</p>
                        <p className="text-sm font-bold text-emerald-600">{rep.completed}</p>
                      </div>
                      <div className="text-right hidden md:block">
                        <p className="text-xs text-gray-400">Pending</p>
                        <p className="text-sm font-bold text-amber-600">{rep.pending}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-gray-400">Revenue</p>
                        <p className="text-sm font-bold text-gray-900">${rep.revenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                      </div>
                      <SafeIcon icon={isExpanded ? FiChevronUp : FiChevronDown} className="text-gray-400" />
                    </div>
                  </button>

                  {/* Progress bar */}
                  <div className="px-4 pb-3">
                    <div className="w-full bg-gray-100 rounded-full h-1.5">
                      <div className="h-1.5 rounded-full transition-all duration-500" style={{ width: `${share}%`, backgroundColor: color }} />
                    </div>
                  </div>

                  {/* Expanded monthly breakdown */}
                  {isExpanded && (
                    <div className="border-t border-gray-100 p-4 bg-gray-50">
                      <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Monthly Breakdown</p>
                      <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
                        {MONTHS.map((month, mi) => (
                          <div key={month} className="text-center p-2 bg-white rounded-lg border border-gray-100">
                            <p className="text-[10px] font-bold text-gray-400">{month}</p>
                            <p className="text-xs font-bold text-gray-900 mt-0.5">
                              {rep.monthly[mi] > 0 ? `$${(rep.monthly[mi] / 1000).toFixed(1)}k` : '—'}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
};

export default SalesRepReport;