import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import InvoicePreview from './InvoicePreview';
import CustomerSearch from './CustomerSearch';
import SafeIcon from '../../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';

const { FiPlus, FiTrash2, FiSave, FiEye } = FiIcons;

const InvoiceForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { invoices, customers, addInvoice, updateInvoice, settings } = useData();
  const { user } = useAuth();
  const [showPreview, setShowPreview] = useState(false);
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    poNumber: '',
    salesRep: user?.name || '',
    transactionType: 'Sales Order',
    customerName: '',
    customerEmail: '',
    customerPhone: '',
    accountsPayableEmail: '',
    billToAddress: '',
    shipToAddress: '',
    items: [
      { mfg: '', partNumber: '', description: '', qty: 1, unitPrice: 0, taxable: true }
    ],
    shippingCost: 0,
    additionalInfo: '',
    status: 'pending',
    taxRate: settings.taxRate
  });

  // Check for selected customer in localStorage
  useEffect(() => {
    const selectedCustomerJson = localStorage.getItem('selectedCustomer');
    if (selectedCustomerJson) {
      const selectedCustomer = JSON.parse(selectedCustomerJson);
      // Update form with customer data
      setFormData(prev => ({
        ...prev,
        customerName: selectedCustomer.name || '',
        customerEmail: selectedCustomer.email || '',
        customerPhone: selectedCustomer.phone || '',
        accountsPayableEmail: selectedCustomer.accountsPayableEmail || '',
        billToAddress: selectedCustomer.billToAddress || '',
        shipToAddress: selectedCustomer.shipToAddress || ''
      }));

      // Clear the stored customer to prevent it from being used again
      localStorage.removeItem('selectedCustomer');
    }
  }, []);

  useEffect(() => {
    if (id) {
      const invoice = invoices.find(inv => inv.id === id);
      if (invoice) {
        setFormData({
          ...invoice,
          taxRate: invoice.taxRate || settings.taxRate
        });
      }
    } else {
      // For new invoices, use the current tax rate from settings
      setFormData(prev => ({
        ...prev,
        taxRate: settings.taxRate,
        salesRep: user?.name || ''  // Always set salesRep to current user
      }));
    }
  }, [id, invoices, settings.taxRate, user]);

  const calculateTotals = () => {
    const subtotal = formData.items.reduce((sum, item) => {
      return sum + (item.qty * item.unitPrice);
    }, 0);

    const taxableSubtotal = formData.items.reduce((sum, item) => {
      return sum + (item.taxable ? item.qty * item.unitPrice : 0);
    }, 0);

    const tax = taxableSubtotal * (formData.taxRate / 100);
    const grandTotal = subtotal + tax + formData.shippingCost;

    return { subtotal, tax, grandTotal };
  };

  const { subtotal, tax, grandTotal } = calculateTotals();

  const handleSubmit = (e) => {
    e.preventDefault();

    const invoiceData = {
      ...formData,
      subtotal,
      tax,
      grandTotal
    };

    if (id) {
      updateInvoice(id, invoiceData);
    } else {
      addInvoice(invoiceData);
    }

    navigate(user?.role === 'salesman' ? '/salesman/invoices' : '/office/invoices');
  };

  const addItem = () => {
    setFormData(prev => ({
      ...prev,
      items: [
        ...prev.items,
        { mfg: '', partNumber: '', description: '', qty: 1, unitPrice: 0, taxable: true }
      ]
    }));
  };

  const removeItem = (index) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }));
  };

  const updateItem = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.map((item, i) => i === index ? { ...item, [field]: value } : item)
    }));
  };

  const handleCustomerSelect = (customer) => {
    setFormData(prev => ({
      ...prev,
      customerName: customer.name,
      customerEmail: customer.email || '',
      customerPhone: customer.phone || '',
      accountsPayableEmail: customer.accountsPayableEmail || '',
      billToAddress: customer.billToAddress || '',
      shipToAddress: customer.shipToAddress || ''
    }));
  };
  
  const getTypeColor = (type) => {
    switch (type) {
      case 'Sales Order': return 'bg-red-600 text-white';
      case 'Service Order': return 'bg-green-600 text-white';
      case 'Quote': return 'bg-amber-500 text-white';
      default: return 'bg-gray-600 text-white';
    }
  };

  if (showPreview) {
    return (
      <InvoicePreview
        invoiceData={{ ...formData, subtotal, tax, grandTotal }}
        onClose={() => setShowPreview(false)}
      />
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-xl shadow-lg"
      >
        <div className="p-6 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-title font-bold text-gray-900">
              {id ? 'Edit Invoice' : 'Create New Invoice'}
            </h2>
            <div className="flex space-x-3">
              <button
                type="button"
                onClick={() => setShowPreview(true)}
                className="flex items-center space-x-2 px-4 py-2 bg-brand-gradient hover:bg-brand-gradient-hover text-white rounded-lg transition-all duration-300"
              >
                <SafeIcon icon={FiEye} />
                <span>Preview</span>
              </button>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-8">
          {/* Header Information */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
            <div className="md:col-span-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">Date</label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gradient-start focus:border-transparent"
                required
              />
            </div>
            <div className="md:col-span-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">P.O.#</label>
              <input
                type="text"
                value={formData.poNumber}
                onChange={(e) => setFormData(prev => ({ ...prev, poNumber: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gradient-start focus:border-transparent"
                placeholder="Enter P.O. Number"
              />
            </div>

            <div className="md:col-span-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">Sales Rep</label>
              {user?.role === 'office' ? (
                <input
                  type="text"
                  value={formData.salesRep}
                  onChange={(e) => setFormData(prev => ({ ...prev, salesRep: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gradient-start focus:border-transparent"
                  required
                />
              ) : (
                <input
                  type="text"
                  value={user?.name || ''}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-700"
                  disabled
                />
              )}
            </div>

            <div className="md:col-span-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">Transaction Type</label>
              <select
                value={formData.transactionType}
                onChange={(e) => setFormData(prev => ({ ...prev, transactionType: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gradient-start focus:border-transparent"
              >
                <option value="Sales Order">Sales Order</option>
                <option value="Service Order">Service Order</option>
                <option value="Quote">Quote</option>
              </select>
              <div className="mt-2">
                <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-md ${getTypeColor(formData.transactionType)}`}>
                  {formData.transactionType}
                </span>
              </div>
            </div>

            <div className="md:col-span-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">Tax Rate (%)</label>
              <input
                type="number"
                value={formData.taxRate}
                onChange={(e) => setFormData(prev => ({ ...prev, taxRate: parseFloat(e.target.value) || 0 }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gradient-start focus:border-transparent"
                min="0"
                step="0.1"
                required
              />
            </div>
          </div>

          {/* Customer Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Customer Name</label>
              <CustomerSearch
                value={formData.customerName}
                onChange={(value) => setFormData(prev => ({ ...prev, customerName: value }))}
                onCustomerSelect={handleCustomerSelect}
                customers={customers}
                searchFields={['name']}
                placeholder="Enter or search customer name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Customer Email</label>
              <CustomerSearch
                value={formData.customerEmail}
                onChange={(value) => setFormData(prev => ({ ...prev, customerEmail: value }))}
                onCustomerSelect={handleCustomerSelect}
                customers={customers}
                searchFields={['email']}
                placeholder="Enter or search customer email"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Customer Phone</label>
              <CustomerSearch
                value={formData.customerPhone}
                onChange={(value) => setFormData(prev => ({ ...prev, customerPhone: value }))}
                onCustomerSelect={handleCustomerSelect}
                customers={customers}
                searchFields={['phone']}
                placeholder="Enter or search customer phone"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Accounts Payable Email</label>
              <CustomerSearch
                value={formData.accountsPayableEmail}
                onChange={(value) => setFormData(prev => ({ ...prev, accountsPayableEmail: value }))}
                onCustomerSelect={handleCustomerSelect}
                customers={customers}
                searchFields={['accountsPayableEmail']}
                placeholder="Enter or search AP email"
              />
            </div>
          </div>

          {/* Addresses */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Bill To Address</label>
              <textarea
                value={formData.billToAddress}
                onChange={(e) => setFormData(prev => ({ ...prev, billToAddress: e.target.value }))}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gradient-start focus:border-transparent"
                placeholder="Enter billing address"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Ship To Address</label>
              <textarea
                value={formData.shipToAddress}
                onChange={(e) => setFormData(prev => ({ ...prev, shipToAddress: e.target.value }))}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gradient-start focus:border-transparent"
                placeholder="Enter shipping address"
              />
            </div>
          </div>

          {/* Items */}
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-title font-semibold text-gray-900">Items</h3>
              <button
                type="button"
                onClick={addItem}
                className="flex items-center space-x-2 px-4 py-2 bg-brand-gradient hover:bg-brand-gradient-hover text-white rounded-lg transition-all duration-300"
              >
                <SafeIcon icon={FiPlus} />
                <span>Add Item</span>
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full border border-gray-300">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-2 py-3 text-left text-sm font-medium text-gray-700 w-16">MFG</th>
                    <th className="px-2 py-3 text-left text-sm font-medium text-gray-700 w-20">Part #</th>
                    <th className="px-2 py-3 text-left text-sm font-medium text-gray-700">Description</th>
                    <th className="px-2 py-3 text-left text-sm font-medium text-gray-700 w-16">QTY</th>
                    <th className="px-2 py-3 text-left text-sm font-medium text-gray-700 w-20">Unit Price</th>
                    <th className="px-2 py-3 text-left text-sm font-medium text-gray-700 w-16">Taxable</th>
                    <th className="px-2 py-3 text-left text-sm font-medium text-gray-700 w-20">Total</th>
                    <th className="px-2 py-3 text-left text-sm font-medium text-gray-700 w-16">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {formData.items.map((item, index) => (
                    <tr key={index} className="border-t border-gray-300">
                      <td className="px-2 py-3">
                        <input
                          type="text"
                          value={item.mfg}
                          onChange={(e) => updateItem(index, 'mfg', e.target.value)}
                          className="w-full px-1 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-gradient-start focus:border-transparent"
                          placeholder="MFG"
                        />
                      </td>
                      <td className="px-2 py-3">
                        <input
                          type="text"
                          value={item.partNumber}
                          onChange={(e) => updateItem(index, 'partNumber', e.target.value)}
                          className="w-full px-1 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-gradient-start focus:border-transparent"
                          placeholder="Part #"
                        />
                      </td>
                      <td className="px-2 py-3">
                        <input
                          type="text"
                          value={item.description}
                          onChange={(e) => updateItem(index, 'description', e.target.value)}
                          className="w-full px-1 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-gradient-start focus:border-transparent"
                          placeholder="Description"
                        />
                      </td>
                      <td className="px-2 py-3">
                        <input
                          type="number"
                          value={item.qty}
                          onChange={(e) => updateItem(index, 'qty', parseInt(e.target.value) || 0)}
                          className="w-full px-1 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-gradient-start focus:border-transparent"
                          min="0"
                        />
                      </td>
                      <td className="px-2 py-3">
                        <input
                          type="number"
                          value={item.unitPrice}
                          onChange={(e) => updateItem(index, 'unitPrice', parseFloat(e.target.value) || 0)}
                          className="w-full px-1 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-gradient-start focus:border-transparent"
                          min="0"
                          step="0.01"
                        />
                      </td>
                      <td className="px-2 py-3 text-center">
                        <input
                          type="checkbox"
                          checked={item.taxable}
                          onChange={(e) => updateItem(index, 'taxable', e.target.checked)}
                          className="w-4 h-4 text-gradient-start focus:ring-gradient-start"
                        />
                      </td>
                      <td className="px-2 py-3 text-right font-medium text-sm">
                        ${(item.qty * item.unitPrice).toFixed(2)}
                      </td>
                      <td className="px-2 py-3 text-center">
                        <button
                          type="button"
                          onClick={() => removeItem(index)}
                          className="text-red-600 hover:text-red-800"
                          disabled={formData.items.length === 1}
                        >
                          <SafeIcon icon={FiTrash2} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Totals */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Shipping Cost</label>
              <input
                type="number"
                value={formData.shippingCost}
                onChange={(e) => setFormData(prev => ({ ...prev, shippingCost: parseFloat(e.target.value) || 0 }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gradient-start focus:border-transparent"
                min="0"
                step="0.01"
              />
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span className="font-medium">${subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Tax ({formData.taxRate}%):</span>
                  <span className="font-medium">${tax.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Shipping:</span>
                  <span className="font-medium">${formData.shippingCost.toFixed(2)}</span>
                </div>
                <div className="flex justify-between border-t pt-2 text-lg font-bold">
                  <span>Grand Total:</span>
                  <span>${grandTotal.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Additional Information */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Additional Information/Comments</label>
            <textarea
              value={formData.additionalInfo}
              onChange={(e) => setFormData(prev => ({ ...prev, additionalInfo: e.target.value }))}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gradient-start focus:border-transparent"
              placeholder="Enter any additional information or comments"
            />
          </div>

          {/* Submit Button */}
          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex items-center space-x-2 px-6 py-3 bg-brand-gradient hover:bg-brand-gradient-hover text-white rounded-lg transition-all duration-300"
            >
              <SafeIcon icon={FiSave} />
              <span>{id ? 'Update Invoice' : 'Create Invoice'}</span>
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

export default InvoiceForm;