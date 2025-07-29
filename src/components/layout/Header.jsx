import React from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import SafeIcon from '../../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';

const { FiUser, FiLogOut, FiDatabase, FiWifi } = FiIcons;

const Header = ({ title }) => {
  const { user, logout } = useAuth();
  const { loading } = useData();

  return (
    <motion.header
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white shadow-lg border-b-4 border-gradient-end"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-4">
            <div className="w-10 h-10 bg-brand-gradient rounded-lg flex items-center justify-center">
              <span className="text-white font-title font-bold text-lg">FF</span>
            </div>
            <div>
              <h1 className="text-xl font-title font-bold text-gray-900">{title}</h1>
              <div className="flex items-center space-x-2">
                <p className="text-sm text-gray-600">Fire Force Sales System</p>
                <div className="flex items-center space-x-1">
                  <SafeIcon
                    icon={loading ? FiDatabase : FiWifi}
                    className={`text-xs ${loading ? 'text-yellow-500 animate-pulse' : 'text-green-500'}`}
                  />
                  <span className="text-xs text-gray-500">
                    {loading ? 'Syncing...' : 'Connected'}
                  </span>
                </div>
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2 text-gray-700">
              <SafeIcon icon={FiUser} className="text-lg" />
              <span className="font-medium">{user?.name}</span>
              <span className="text-sm text-gray-500 capitalize">({user?.role})</span>
            </div>
            <button
              onClick={logout}
              className="flex items-center space-x-2 px-4 py-2 text-white bg-brand-gradient hover:bg-brand-gradient-hover rounded-lg transition-all duration-300"
            >
              <SafeIcon icon={FiLogOut} />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </div>
    </motion.header>
  );
};

export default Header;