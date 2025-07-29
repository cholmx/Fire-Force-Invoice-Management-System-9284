import React from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Login from './components/auth/Login';
import SalesmanDashboard from './components/salesman/SalesmanDashboard';
import OfficeDashboard from './components/office/OfficeDashboard';
import InvoiceForm from './components/invoice/InvoiceForm';
import InvoiceList from './components/invoice/InvoiceList';
import CustomerManagement from './components/customer/CustomerManagement';
import { AuthProvider, useAuth } from './context/AuthContext';
import { DataProvider, useData } from './context/DataContext';
import './App.css';

// Import backup scheduler
import './utils/backupScheduler';

function AppRoutes() {
  const { user, loading: authLoading } = useAuth();
  const { loading: dataLoading } = useData();
  
  const loading = authLoading || dataLoading;

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gradient-start to-gradient-end flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <div className="w-16 h-16 border-4 border-white border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white font-medium">Loading Fire Force System...</p>
          <p className="text-white text-sm mt-2 opacity-80">Connecting to database...</p>
        </motion.div>
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  return (
    <AnimatePresence mode="wait">
      <Routes>
        <Route 
          path="/" 
          element={<Navigate to={user.role === 'salesman' ? '/salesman' : '/office'} replace />} 
        />
        <Route 
          path="/salesman/*" 
          element={user.role === 'salesman' ? <SalesmanDashboard /> : <Navigate to="/office" replace />} 
        />
        <Route 
          path="/office/*" 
          element={user.role === 'office' ? <OfficeDashboard /> : <Navigate to="/salesman" replace />} 
        />
        
        {/* Legacy routes for compatibility */}
        <Route path="/invoice/new" element={<InvoiceForm />} />
        <Route path="/invoice/edit/:id" element={<InvoiceForm />} />
        <Route path="/invoices" element={<InvoiceList />} />
        <Route path="/customers" element={<CustomerManagement />} />
      </Routes>
    </AnimatePresence>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <DataProvider>
          <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50">
            <AppRoutes />
          </div>
        </DataProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;