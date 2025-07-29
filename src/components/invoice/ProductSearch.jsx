import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import SafeIcon from '../../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';

const { FiSearch, FiPlus } = FiIcons;

const ProductSearch = ({ 
  value, 
  onChange, 
  onProductSelect, 
  onProductCreate, 
  products, 
  allowCreate = false 
}) => {
  const [searchTerm, setSearchTerm] = useState(value || '');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [newProduct, setNewProduct] = useState({
    mfg: '',
    partNumber: '',
    description: '',
    unitPrice: 0
  });
  
  const inputRef = useRef(null);
  const resultsRef = useRef(null);
  
  // Update search term when external value changes
  useEffect(() => {
    setSearchTerm(value || '');
  }, [value]);

  // Filter products when search term changes
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredProducts([]);
      return;
    }
    
    const filtered = products.filter(product =>
      product.mfg?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.partNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.description?.toLowerCase().includes(searchTerm.toLowerCase())
    ).slice(0, 5); // Limit to 5 results for performance
    
    setFilteredProducts(filtered);
  }, [searchTerm, products]);

  // Handle clicks outside the component
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (resultsRef.current && !resultsRef.current.contains(event.target) && 
          inputRef.current && !inputRef.current.contains(event.target)) {
        setShowCreateForm(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleInputChange = (e) => {
    const newValue = e.target.value;
    setSearchTerm(newValue);
    onChange(newValue);
    setShowCreateForm(false);
  };

  const handleProductSelect = (product, e) => {
    // Prevent form submission
    e?.preventDefault();
    e?.stopPropagation();
    
    setSearchTerm(product.description);
    onChange(product.description);
    onProductSelect(product);
    setFilteredProducts([]);
  };

  const handleCreateProduct = (e) => {
    e?.preventDefault();
    e?.stopPropagation();
    
    if (newProduct.mfg && newProduct.partNumber && newProduct.description && newProduct.unitPrice > 0) {
      onProductCreate({
        ...newProduct,
        unitPrice: parseFloat(newProduct.unitPrice)
      });
      setNewProduct({
        mfg: '',
        partNumber: '',
        description: '',
        unitPrice: 0
      });
      setShowCreateForm(false);
    }
  };

  const handleShowCreateForm = (e) => {
    e?.preventDefault();
    e?.stopPropagation();
    
    setNewProduct({
      mfg: '',
      partNumber: '',
      description: searchTerm,
      unitPrice: 0
    });
    setShowCreateForm(true);
  };

  return (
    <div className="relative w-full">
      {/* Input field */}
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={searchTerm}
          onChange={handleInputChange}
          className="w-full px-2 py-1 pr-8 border border-gray-300 rounded text-sm"
          placeholder="Search or enter description"
          autoComplete="off"
        />
        <SafeIcon 
          icon={FiSearch} 
          className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm" 
        />
      </div>

      {/* Instant results */}
      {(filteredProducts.length > 0 || (allowCreate && searchTerm)) && (
        <div 
          ref={resultsRef}
          className="absolute top-full left-0 right-0 z-50 bg-white border border-gray-300 rounded-md shadow-lg mt-1 max-h-60 overflow-y-auto"
        >
          {showCreateForm ? (
            <div className="p-3 border-b border-gray-200">
              <h4 className="text-sm font-medium text-gray-900 mb-2">Create New Product</h4>
              <div className="space-y-2">
                <input
                  type="text"
                  placeholder="Manufacturer"
                  value={newProduct.mfg}
                  onChange={(e) => setNewProduct(prev => ({ ...prev, mfg: e.target.value }))}
                  className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                />
                <input
                  type="text"
                  placeholder="Part Number"
                  value={newProduct.partNumber}
                  onChange={(e) => setNewProduct(prev => ({ ...prev, partNumber: e.target.value }))}
                  className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                />
                <input
                  type="text"
                  placeholder="Description"
                  value={newProduct.description}
                  onChange={(e) => setNewProduct(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                />
                <input
                  type="number"
                  placeholder="Unit Price"
                  value={newProduct.unitPrice}
                  onChange={(e) => setNewProduct(prev => ({ ...prev, unitPrice: e.target.value }))}
                  className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                  min="0"
                  step="0.01"
                />
                <div className="flex space-x-2">
                  <button
                    type="button"
                    onClick={handleCreateProduct}
                    className="flex-1 px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700"
                  >
                    Create
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowCreateForm(false)}
                    className="flex-1 px-3 py-1 bg-gray-300 text-gray-700 rounded text-sm hover:bg-gray-400"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <>
              {filteredProducts.map((product) => (
                <button
                  key={product.id}
                  type="button"
                  onClick={(e) => handleProductSelect(product, e)}
                  className="w-full px-3 py-2 text-left hover:bg-gray-100 border-b border-gray-100 last:border-b-0 focus:bg-gray-100 focus:outline-none"
                >
                  <div className="text-sm">
                    <div className="font-medium text-gray-900">
                      {product.mfg} - {product.partNumber}
                    </div>
                    <div className="text-gray-600">{product.description}</div>
                    <div className="text-green-600 font-medium">${product.unitPrice.toFixed(2)}</div>
                  </div>
                </button>
              ))}

              {allowCreate && searchTerm && (
                <button
                  type="button"
                  onClick={handleShowCreateForm}
                  className="w-full px-3 py-2 text-left hover:bg-blue-50 border-t border-gray-200 text-blue-600"
                >
                  <div className="flex items-center space-x-2">
                    <SafeIcon icon={FiPlus} className="text-sm" />
                    <span className="text-sm">Create new product: "{searchTerm}"</span>
                  </div>
                </button>
              )}
              
              {filteredProducts.length === 0 && searchTerm && !allowCreate && (
                <div className="px-3 py-2 text-sm text-gray-500">
                  No products found matching "{searchTerm}"
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default ProductSearch;