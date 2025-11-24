import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useData } from '../../context/DataContext';
import SafeIcon from '../../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';

const { FiPlus, FiSearch } = FiIcons;

const ProductCatalog = () => {
  const { products, addProduct } = useData();
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ mfg: '', partNumber: '', description: '', unitPrice: 0 });

  const filteredProducts = products.filter(product => 
    product.mfg?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    product.partNumber?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    product.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSubmit = (e) => {
    e.preventDefault();
    addProduct({ ...formData, unitPrice: parseFloat(formData.unitPrice) });
    setFormData({ mfg: '', partNumber: '', description: '', unitPrice: 0 });
    setShowForm(false);
  };

  return (
    <div className="space-y-5">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-gray-900 tracking-tight">Products</h2>
        <button 
          onClick={() => setShowForm(true)}
          className="flex items-center space-x-2 px-4 py-2 bg-brand-gradient hover:bg-brand-gradient-hover text-white rounded-lg shadow-sm hover:shadow text-xs font-semibold transition-all duration-200"
        >
          <SafeIcon icon={FiPlus} />
          <span>Add Product</span>
        </button>
      </div>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <div className="relative max-w-sm">
          <SafeIcon icon={FiSearch} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-xs" />
          <input 
            type="text" 
            placeholder="Search products..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-xs focus:ring-1 focus:ring-red-500 focus:border-red-500 bg-gray-50 focus:bg-white transition-colors"
          />
        </div>
      </motion.div>

      {showForm && (
        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-sm font-bold text-gray-900 mb-4">Add New Product</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input type="text" placeholder="MFG" value={formData.mfg} onChange={e => setFormData({...formData, mfg: e.target.value})} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs" required />
              <input type="text" placeholder="Part Number" value={formData.partNumber} onChange={e => setFormData({...formData, partNumber: e.target.value})} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs" required />
            </div>
            <input type="text" placeholder="Description" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs" required />
            <div className="w-32">
              <input type="number" placeholder="Price" value={formData.unitPrice} onChange={e => setFormData({...formData, unitPrice: e.target.value})} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs" step="0.01" required />
            </div>
            <div className="flex justify-end space-x-3 pt-2">
              <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 border border-gray-200 text-gray-600 rounded-lg text-xs font-semibold hover:bg-gray-50">Cancel</button>
              <button type="submit" className="px-4 py-2 bg-brand-gradient text-white rounded-lg text-xs font-semibold hover:opacity-90">Add</button>
            </div>
          </form>
        </motion.div>
      )}

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-4 py-3 text-left text-[10px] font-bold text-gray-500 uppercase tracking-wider">MFG</th>
              <th className="px-4 py-3 text-left text-[10px] font-bold text-gray-500 uppercase tracking-wider">Part #</th>
              <th className="px-4 py-3 text-left text-[10px] font-bold text-gray-500 uppercase tracking-wider">Description</th>
              <th className="px-4 py-3 text-right text-[10px] font-bold text-gray-500 uppercase tracking-wider">Price</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filteredProducts.map((product, index) => (
              <tr key={index} className="hover:bg-gray-50">
                <td className="px-4 py-2 text-xs font-medium text-gray-900">{product.mfg}</td>
                <td className="px-4 py-2 text-xs text-gray-600">{product.partNumber}</td>
                <td className="px-4 py-2 text-xs text-gray-600">{product.description}</td>
                <td className="px-4 py-2 text-xs font-bold text-gray-900 text-right">${product.unitPrice.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </motion.div>
    </div>
  );
};

export default ProductCatalog;