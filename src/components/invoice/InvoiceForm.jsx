import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import InvoicePreview from './InvoicePreview';
import CustomerSearch from './CustomerSearch';
import SafeIcon from '../../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';

const { FiPlus, FiTrash2, FiSave, FiEye, FiArrowLeft } = FiIcons;

const InvoiceForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { invoices, customers, addInvoice, updateInvoice, settings } = useData();
  const { user } = useAuth();
  const [showPreview, setShowPreview] = useState(false);
  const [isTaxExempt, setIsTaxExempt] = useState(false);
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    poNumber: '',
    salesRep: user?.name || '',
    transactionType: 'Sales Order',
    customerName: '',
    company: '',
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

  useEffect(() => {
    const selectedCustomerJson = localStorage.getItem('selectedCustomer');
    if (selectedCustomerJson) {
      const selectedCustomer = JSON.parse(selectedCustomerJson);
      handleCustomerSelect(selectedCustomer);
      localStorage.removeItem('selectedCustomer');
    }
  }, []);

  useEffect(() => {
    if (id) {
      const invoice = invoices.find(inv => inv.id === id);
      if (invoice) {
        setFormData({ ...invoice, taxRate: invoice.taxRate || settings.taxRate });
        // Try to find if the customer is tax exempt to set internal state
        const customer = customers.find(c => c.name === invoice.customerName);
        if (customer && customer.taxExempt) {
          setIsTaxExempt(true);
        }
      }
    } else {
      setFormData(prev => ({
        ...prev,
        taxRate: settings.taxRate,
        salesRep: user?.name || ''
      }));
    }
  }, [id, invoices, settings.taxRate, user, customers]);

  const calculateTotals = () => {
    const subtotal = formData.items.reduce((sum, item) => sum + (item.qty * item.unitPrice), 0);
    const taxableSubtotal = formData.items.reduce((sum, item) => sum + (item.taxable ? item.qty * item.unitPrice : 0), 0);
    const tax = taxableSubtotal * (formData.taxRate / 100);
    const grandTotal = subtotal + tax + formData.shippingCost;
    return { subtotal, tax, grandTotal };
  };

  const { subtotal, tax, grandTotal } = calculateTotals();

  const handleSubmit = (e) => {
    e.preventDefault();
    const invoiceData = { ...formData, subtotal, tax, grandTotal };
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
        { 
          mfg: '', 
          partNumber: '', 
          description: '', 
          qty: 1, 
          unitPrice: 0, 
          taxable: !isTaxExempt // Default to not taxable if customer is tax exempt
        } 
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
    const taxExempt = customer.taxExempt === true;
    setIsTaxExempt(taxExempt);
    
    setFormData(prev => ({
      ...prev,
      customerName: customer.name,
      company: customer.company || '',
      customerEmail: customer.email || '',
      customerPhone: customer.phone || '',
      accountsPayableEmail: customer.accountsPayableEmail || '',
      billToAddress: customer.billToAddress || '',
      shipToAddress: customer.shipToAddress || '',
      // Update existing items to match customer tax status
      items: prev.items.map(item => ({
        ...item,
        taxable: !taxExempt
      }))
    }));
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
    <div className="max-w-5xl mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 rounded-full text-gray-500 transition-colors">
            <SafeIcon icon={FiArrowLeft} />
          </button>
          <h2 className="text-xl font-bold text-gray-900 tracking-tight">
            {id ? 'Edit Invoice' : 'New Invoice'}
          </h2>
        </div>
        <div className="flex space-x-2">
          <button 
            type="button" 
            onClick={() => setShowPreview(true)} 
            className="flex items-center space-x-2 px-3 py-1.5 bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 text-xs font-semibold shadow-sm transition-all"
          >
            <SafeIcon icon={FiEye} />
            <span>Preview</span>
          </button>
          <button 
            onClick={handleSubmit} 
            className="flex items-center space-x-2 px-4 py-1.5 bg-brand-gradient hover:bg-brand-gradient-hover text-white rounded-lg shadow-sm hover:shadow text-xs font-semibold transition-all"
          >
            <SafeIcon icon={FiSave} />
            <span>Save Invoice</span>
          </button>
        </div>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 10 }} 
        animate={{ opacity: 1, y: 0 }} 
        className="bg-white rounded-xl shadow-sm border border-gray-200"
      >
        <form className="p-5 md:p-8 space-y-8">
          {/* Header Info */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">Date</label>
              <input 
                type="date" 
                value={formData.date} 
                onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-gray-50 focus:bg-white focus:ring-1 focus:ring-red-500 focus:border-red-500 transition-colors"
                required 
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">P.O. Number</label>
              <input 
                type="text" 
                value={formData.poNumber} 
                onChange={(e) => setFormData(prev => ({ ...prev, poNumber: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-gray-50 focus:bg-white focus:ring-1 focus:ring-red-500 focus:border-red-500 transition-colors"
                placeholder="P.O. #" 
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">Sales Rep</label>
              <input 
                type="text" 
                value={user?.role === 'office' ? formData.salesRep : (user?.name || '')}
                onChange={(e) => user?.role === 'office' && setFormData(prev => ({ ...prev, salesRep: e.target.value }))}
                disabled={user?.role !== 'office'}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-gray-50 focus:bg-white focus:ring-1 focus:ring-red-500 focus:border-red-500 transition-colors disabled:opacity-60"
              />
            </div>
            <div className="md:col-span-1">
              <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">Type</label>
              <select 
                value={formData.transactionType} 
                onChange={(e) => setFormData(prev => ({ ...prev, transactionType: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-gray-50 focus:bg-white focus:ring-1 focus:ring-red-500 focus:border-red-500 transition-colors"
              >
                <option value="Sales Order">Sales Order</option>
                <option value="Service Order">Service Order</option>
                <option value="Quote">Quote</option>
              </select>
            </div>
            <div>
               <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">Tax Rate (%)</label>
               <input 
                 type="number" 
                 value={formData.taxRate} 
                 onChange={(e) => setFormData(prev => ({ ...prev, taxRate: parseFloat(e.target.value) || 0 }))}
                 className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-gray-50 focus:bg-white focus:ring-1 focus:ring-red-500 focus:border-red-500 transition-colors"
                 min="0" 
                 step="0.1" 
               />
            </div>
          </div>

          <hr className="border-gray-100" />

          {/* Customer Info */}
          <div>
             <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4 flex justify-between items-center">
               <span>Customer Details</span>
               {isTaxExempt && (
                 <span className="text-xs text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full border border-emerald-100 font-semibold">
                   Tax Exempt Customer
                 </span>
               )}
             </h3>
             <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
               <div>
                 <label className="block text-[10px] font-medium text-gray-500 mb-1">Customer Name</label>
                 <CustomerSearch 
                   value={formData.customerName} 
                   onChange={(value) => setFormData(prev => ({ ...prev, customerName: value }))}
                   onCustomerSelect={handleCustomerSelect}
                   customers={customers}
                   searchFields={['name']}
                   placeholder="Search Name"
                 />
               </div>
               <div>
                 <label className="block text-[10px] font-medium text-gray-500 mb-1">Company</label>
                 <CustomerSearch 
                   value={formData.company} 
                   onChange={(value) => setFormData(prev => ({ ...prev, company: value }))}
                   onCustomerSelect={handleCustomerSelect}
                   customers={customers}
                   searchFields={['company']}
                   placeholder="Search Company"
                 />
               </div>
               <div>
                 <label className="block text-[10px] font-medium text-gray-500 mb-1">Email</label>
                 <CustomerSearch 
                   value={formData.customerEmail} 
                   onChange={(value) => setFormData(prev => ({ ...prev, customerEmail: value }))}
                   onCustomerSelect={handleCustomerSelect}
                   customers={customers}
                   searchFields={['email']}
                   placeholder="Search Email"
                 />
               </div>
             </div>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               <div>
                 <label className="block text-[10px] font-medium text-gray-500 mb-1">Bill To</label>
                 <textarea 
                   rows={3}
                   value={formData.billToAddress}
                   onChange={(e) => setFormData(prev => ({ ...prev, billToAddress: e.target.value }))}
                   className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-gray-50 focus:bg-white focus:ring-1 focus:ring-red-500 focus:border-red-500 transition-colors resize-none"
                   placeholder="Billing Address..."
                 />
               </div>
               <div>
                 <label className="block text-[10px] font-medium text-gray-500 mb-1">Ship To</label>
                 <textarea 
                   rows={3}
                   value={formData.shipToAddress}
                   onChange={(e) => setFormData(prev => ({ ...prev, shipToAddress: e.target.value }))}
                   className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-gray-50 focus:bg-white focus:ring-1 focus:ring-red-500 focus:border-red-500 transition-colors resize-none"
                   placeholder="Shipping Address..."
                 />
               </div>
             </div>
          </div>

          <hr className="border-gray-100" />

          {/* Line Items */}
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Line Items</h3>
              <button 
                type="button" 
                onClick={addItem}
                className="text-xs font-semibold text-red-600 hover:text-red-700 flex items-center space-x-1"
              >
                <SafeIcon icon={FiPlus} />
                <span>Add Item</span>
              </button>
            </div>
            
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50 text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                  <tr>
                    <th className="px-3 py-2 text-left w-16">MFG</th>
                    <th className="px-3 py-2 text-left w-20">Part #</th>
                    <th className="px-3 py-2 text-left">Description</th>
                    <th className="px-3 py-2 text-center w-16">Qty</th>
                    <th className="px-3 py-2 text-right w-24">Price</th>
                    <th className="px-3 py-2 text-center w-12">Tax</th>
                    <th className="px-3 py-2 text-right w-24">Total</th>
                    <th className="px-2 py-2 w-10"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {formData.items.map((item, index) => (
                    <tr key={index} className="group hover:bg-gray-50">
                      <td className="p-2">
                        <input 
                          type="text" 
                          value={item.mfg}
                          onChange={(e) => updateItem(index, 'mfg', e.target.value)}
                          className="w-full px-2 py-1 border border-gray-200 rounded text-xs focus:ring-1 focus:ring-red-500 focus:border-red-500"
                        />
                      </td>
                      <td className="p-2">
                        <input 
                          type="text" 
                          value={item.partNumber}
                          onChange={(e) => updateItem(index, 'partNumber', e.target.value)}
                          className="w-full px-2 py-1 border border-gray-200 rounded text-xs focus:ring-1 focus:ring-red-500 focus:border-red-500"
                        />
                      </td>
                      <td className="p-2">
                        <input 
                          type="text" 
                          value={item.description}
                          onChange={(e) => updateItem(index, 'description', e.target.value)}
                          className="w-full px-2 py-1 border border-gray-200 rounded text-xs focus:ring-1 focus:ring-red-500 focus:border-red-500"
                        />
                      </td>
                      <td className="p-2">
                        <input 
                          type="number" 
                          value={item.qty}
                          onChange={(e) => updateItem(index, 'qty', parseInt(e.target.value) || 0)}
                          className="w-full px-2 py-1 border border-gray-200 rounded text-xs text-center focus:ring-1 focus:ring-red-500 focus:border-red-500"
                          min="0"
                        />
                      </td>
                      <td className="p-2">
                        <input 
                          type="number" 
                          value={item.unitPrice}
                          onChange={(e) => updateItem(index, 'unitPrice', parseFloat(e.target.value) || 0)}
                          className="w-full px-2 py-1 border border-gray-200 rounded text-xs text-right focus:ring-1 focus:ring-red-500 focus:border-red-500"
                          min="0"
                          step="0.01"
                        />
                      </td>
                      <td className="p-2 text-center">
                        <input 
                          type="checkbox" 
                          checked={item.taxable}
                          onChange={(e) => updateItem(index, 'taxable', e.target.checked)}
                          className="rounded text-red-600 focus:ring-red-500 h-3.5 w-3.5 border-gray-300"
                        />
                      </td>
                      <td className="p-2 text-right text-xs font-medium text-gray-900">
                        ${(item.qty * item.unitPrice).toFixed(2)}
                      </td>
                      <td className="p-2 text-center">
                        <button 
                          type="button" 
                          onClick={() => removeItem(index)}
                          className="text-gray-300 hover:text-red-600 transition-colors"
                          disabled={formData.items.length === 1}
                        >
                          <SafeIcon icon={FiTrash2} className="text-sm" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Footer Totals */}
          <div className="flex flex-col md:flex-row justify-between gap-8">
             <div className="flex-1">
               <label className="block text-[10px] font-medium text-gray-500 mb-1">Internal Notes</label>
               <textarea 
                 rows={3}
                 value={formData.additionalInfo}
                 onChange={(e) => setFormData(prev => ({ ...prev, additionalInfo: e.target.value }))}
                 className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-gray-50 focus:bg-white focus:ring-1 focus:ring-red-500 focus:border-red-500 transition-colors resize-none"
                 placeholder="Notes not visible to customer..."
               />
             </div>
             
             <div className="w-full md:w-64 space-y-3">
               <div className="flex justify-between items-center text-sm">
                 <span className="text-gray-500">Subtotal:</span>
                 <span className="font-semibold text-gray-900">${subtotal.toFixed(2)}</span>
               </div>
               <div className="flex justify-between items-center text-sm">
                 <span className="text-gray-500">Tax ({formData.taxRate}%):</span>
                 <span className="font-semibold text-gray-900">${tax.toFixed(2)}</span>
               </div>
               <div className="flex justify-between items-center text-sm">
                 <span className="text-gray-500">Shipping:</span>
                 <div className="w-20">
                   <input 
                     type="number" 
                     value={formData.shippingCost}
                     onChange={(e) => setFormData(prev => ({ ...prev, shippingCost: parseFloat(e.target.value) || 0 }))}
                     className="w-full px-2 py-1 border border-gray-200 rounded text-xs text-right focus:ring-1 focus:ring-red-500"
                     min="0"
                     step="0.01"
                   />
                 </div>
               </div>
               <div className="pt-3 border-t border-gray-200 flex justify-between items-center">
                 <span className="text-base font-bold text-gray-900">Total:</span>
                 <span className="text-lg font-bold text-brand-gradient bg-clip-text text-transparent">
                   ${grandTotal.toFixed(2)}
                 </span>
               </div>
             </div>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

export default InvoiceForm;