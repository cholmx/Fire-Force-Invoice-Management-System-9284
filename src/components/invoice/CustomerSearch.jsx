import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import SafeIcon from '../../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';

const { FiSearch, FiUser } = FiIcons;

const CustomerSearch = ({ 
  value, 
  onChange, 
  onCustomerSelect, 
  customers, 
  searchFields = ['name', 'email', 'phone'], 
  placeholder = "Search customers..." 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState(value || '');
  const inputRef = useRef(null);
  const dropdownRef = useRef(null);

  useEffect(() => {
    setSearchTerm(value || '');
  }, [value]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredCustomers = customers.filter(customer => {
    const searchLower = searchTerm.toLowerCase();
    return searchFields.some(field => 
      customer[field]?.toLowerCase().includes(searchLower)
    );
  });

  const handleInputChange = (e) => {
    const newValue = e.target.value;
    setSearchTerm(newValue);
    onChange(newValue);
    setIsOpen(newValue.trim() !== '');
  };

  const handleCustomerClick = (customer) => {
    // Update the search term to show the selected value in this field
    const fieldValue = customer[searchFields[0]] || customer.name || '';
    setSearchTerm(fieldValue);
    onChange(fieldValue);
    
    // Call the parent's onCustomerSelect to fill in all customer data
    // using a slight delay to prevent form submission
    setTimeout(() => {
      onCustomerSelect(customer);
    }, 10);
    
    // Close the dropdown
    setIsOpen(false);
  };

  const highlightMatch = (text, searchTerm) => {
    if (!text || !searchTerm) return text;
    
    const regex = new RegExp(`(${searchTerm})`, 'gi');
    const parts = text.split(regex);
    
    return parts.map((part, index) => 
      regex.test(part) ? (
        <mark key={index} className="bg-yellow-200 font-semibold">{part}</mark>
      ) : (
        part
      )
    );
  };

  return (
    <div className="relative w-full" ref={dropdownRef}>
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={searchTerm}
          onChange={handleInputChange}
          onFocus={() => setIsOpen(searchTerm.trim() !== '')}
          className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
          placeholder={placeholder}
        />
        <SafeIcon 
          icon={FiSearch} 
          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" 
        />
      </div>

      <AnimatePresence>
        {isOpen && searchTerm && filteredCustomers.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-full left-0 right-0 z-50 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto"
          >
            <div className="py-1">
              {filteredCustomers.slice(0, 8).map((customer) => (
                <div
                  key={customer.id}
                  onClick={() => handleCustomerClick(customer)}
                  className="w-full px-4 py-3 text-left hover:bg-red-50 border-b border-gray-100 last:border-b-0 focus:bg-red-50 focus:outline-none cursor-pointer"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <SafeIcon icon={FiUser} className="text-red-600 text-sm" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-gray-900 truncate">
                        {highlightMatch(customer.name, searchTerm)}
                      </div>
                      <div className="flex flex-col space-y-1 mt-1">
                        {customer.email && (
                          <div className="text-sm text-gray-600 truncate">
                            <span className="font-medium">Email:</span> {highlightMatch(customer.email, searchTerm)}
                          </div>
                        )}
                        {customer.phone && (
                          <div className="text-sm text-gray-600">
                            <span className="font-medium">Phone:</span> {highlightMatch(customer.phone, searchTerm)}
                          </div>
                        )}
                        {customer.accountsPayableEmail && (
                          <div className="text-sm text-gray-600 truncate">
                            <span className="font-medium">AP:</span> {highlightMatch(customer.accountsPayableEmail, searchTerm)}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              
              {filteredCustomers.length > 8 && (
                <div className="px-4 py-2 text-sm text-gray-500 border-t border-gray-200 bg-gray-50">
                  Showing first 8 of {filteredCustomers.length} matches. Keep typing to narrow results.
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CustomerSearch;