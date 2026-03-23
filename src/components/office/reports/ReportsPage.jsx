import React, { useState } from 'react';
import { motion } from 'framer-motion';
import SalesRepReport from './SalesRepReport';
import RevenueReport from './RevenueReport';
import SafeIcon from '../../../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';

const { FiBarChart3, FiUsers, FiTrendingUp } = FiIcons;

const TABS = [
  { id: 'revenue', label: 'Revenue Overview', icon: FiTrendingUp },
  { id: 'salesrep', label: 'Sales Rep Performance', icon: FiUsers },
];

const ReportsPage = () => {
  const [activeTab, setActiveTab] = useState('revenue');

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-3">
        <SafeIcon icon={FiBarChart3} className="text-2xl text-red-600" />
        <h2 className="text-2xl font-title font-bold text-gray-900">Reports</h2>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="flex border-b border-gray-200">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center space-x-2 px-6 py-3.5 text-sm font-semibold transition-all border-b-2 -mb-px ${
                activeTab === tab.id
                  ? 'border-red-500 text-red-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <SafeIcon icon={tab.icon} className="text-base" />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
        <div className="p-6">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
          >
            {activeTab === 'revenue' && <RevenueReport />}
            {activeTab === 'salesrep' && <SalesRepReport />}
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default ReportsPage;