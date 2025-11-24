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
      initial={{ opacity: 0, y: -10 }} 
      animate={{ opacity: 1, y: 0 }} 
      className="bg-white/80 backdrop-blur-md sticky top-0 z-40 border-b border-gray-200"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-14">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-brand-gradient rounded-md flex items-center justify-center shadow-sm">
              <span className="text-white font-title font-bold text-sm">FF</span>
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-sm font-bold text-gray-900 leading-none">{title}</h1>
                <span className="h-3 w-px bg-gray-300"></span>
                <span className="text-xs text-gray-500 font-medium">Sales System</span>
              </div>
              <div className="flex items-center space-x-1 mt-0.5">
                <SafeIcon 
                  icon={loading ? FiDatabase : FiWifi} 
                  className={`text-[10px] ${loading ? 'text-amber-500 animate-pulse' : 'text-emerald-500'}`} 
                />
                <span className="text-[10px] text-gray-400 font-medium tracking-wide uppercase">
                  {loading ? 'Syncing...' : 'Online'}
                </span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2 text-gray-600 bg-gray-50 px-3 py-1.5 rounded-full border border-gray-100">
              <SafeIcon icon={FiUser} className="text-sm" />
              <span className="text-xs font-semibold">{user?.name}</span>
              <span className="text-[10px] text-gray-400 bg-white px-1.5 py-0.5 rounded border border-gray-100 capitalize font-medium">{user?.role}</span>
            </div>
            <button 
              onClick={logout} 
              className="flex items-center space-x-1.5 px-3 py-1.5 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200 text-xs font-medium"
            >
              <SafeIcon icon={FiLogOut} />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </div>
    </motion.header>
  );
};

export default Header;