import React, { createContext, useContext, useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import supabase from '../lib/supabase';

const DataContext = createContext();

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) throw new Error('useData must be used within a DataProvider');
  return context;
};

export const DataProvider = ({ children }) => {
  const [invoices, setInvoices] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [users, setUsers] = useState([]);
  const [officeInfo, setOfficeInfo] = useState({});
  const [settings, setSettings] = useState({ taxRate: 8.0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        loadInvoices(),
        loadCustomers(),
        loadUsers(),
        loadOfficeInfo(),
        loadSettings(),
      ]);
    } catch (error) {
      console.error('Error loading data from Supabase:', error);
      loadFromLocalStorage();
    } finally {
      setLoading(false);
    }
  };

  const loadFromLocalStorage = () => {
    const savedInvoices = localStorage.getItem('fireforce_invoices');
    const savedCustomers = localStorage.getItem('fireforce_customers');
    const savedUsers = localStorage.getItem('fireforce_users');
    const savedOfficeInfo = localStorage.getItem('fireforce_office');
    const savedSettings = localStorage.getItem('fireforce_settings');
    if (savedInvoices) setInvoices(JSON.parse(savedInvoices));
    if (savedCustomers) setCustomers(JSON.parse(savedCustomers));
    if (savedUsers) setUsers(JSON.parse(savedUsers));
    if (savedOfficeInfo) setOfficeInfo(JSON.parse(savedOfficeInfo));
    if (savedSettings) setSettings(JSON.parse(savedSettings));
  };

  const loadInvoices = async () => {
    const { data, error } = await supabase
      .from('invoices_ff2024')
      .select(`*, invoice_items_ff2024 (*)`)
      .order('created_at', { ascending: false });
    if (error) throw error;
    const formatted = data.map(invoice => ({
      ...invoice,
      poNumber: invoice.po_number,
      salesRep: invoice.sales_rep,
      transactionType: invoice.transaction_type,
      customerName: invoice.customer_name,
      company: invoice.company,
      customerEmail: invoice.customer_email,
      customerPhone: invoice.customer_phone,
      accountsPayableEmail: invoice.accounts_payable_email,
      billToAddress: invoice.bill_to_address,
      shipToAddress: invoice.ship_to_address,
      shippingCost: parseFloat(invoice.shipping_cost) || 0,
      additionalInfo: invoice.additional_info,
      taxRate: parseFloat(invoice.tax_rate) || 8.0,
      subtotal: parseFloat(invoice.subtotal) || 0,
      tax: parseFloat(invoice.tax) || 0,
      grandTotal: parseFloat(invoice.grand_total) || 0,
      createdAt: invoice.created_at,
      updatedAt: invoice.updated_at,
      archived: invoice.archived || false,
      items: invoice.invoice_items_ff2024.map(item => ({
        mfg: item.mfg,
        partNumber: item.part_number,
        description: item.description,
        qty: item.qty,
        unitPrice: parseFloat(item.unit_price),
        taxable: item.taxable,
      })),
    }));
    setInvoices(formatted);
    return formatted;
  };

  const loadCustomers = async () => {
    const { data, error } = await supabase
      .from('customers_ff2024')
      .select('*')
      .order('name');
    if (error) throw error;
    const formatted = data.map(customer => ({
      ...customer,
      company: customer.company || '',
      billToAddress: customer.bill_to_address,
      shipToAddress: customer.ship_to_address,
      accountsPayableEmail: customer.accounts_payable_email,
    }));
    setCustomers(formatted);
    return formatted;
  };

  const loadUsers = async () => {
    const { data, error } = await supabase
      .from('users_ff2024')
      .select('*')
      .order('name');
    if (error) throw error;
    const formatted = data.map(user => ({
      ...user,
      password: user.password_hash,
    }));
    setUsers(formatted);
    return formatted;
  };

  const loadOfficeInfo = async () => {
    const { data, error } = await supabase
      .from('office_info_ff2024')
      .select('*')
      .limit(1)
      .single();
    if (error && error.code !== 'PGRST116') throw error;
    if (data) {
      const formatted = {
        companyName: data.company_name,
        address: data.address,
        phone: data.phone,
        emergencyPhone: data.emergency_phone,
        email: data.email,
        serviceEmail: data.service_email,
        password: data.password_hash,
        username: data.username || 'office1',
      };
      setOfficeInfo(formatted);
      return formatted;
    }
    return {};
  };

  const loadSettings = async () => {
    const { data, error } = await supabase
      .from('settings_ff2024')
      .select('*');
    // If error or empty, fall back to default
    if (error || !data || data.length === 0) {
      console.warn('Settings not found, using defaults');
      setSettings({ taxRate: 8.0 });
      return { taxRate: 8.0 };
    }
    const settingsObj = {};
    data.forEach(setting => {
      if (setting.key === 'tax_rate') {
        settingsObj.taxRate = parseFloat(setting.value);
      }
    });
    const final = settingsObj.taxRate !== undefined ? settingsObj : { taxRate: 8.0 };
    setSettings(final);
    return final;
  };

  // ─── Invoice Operations ───────────────────────────────────────────────────

  const addInvoice = async (invoiceData) => {
    const invoiceId = uuidv4();
    const { error: invoiceError } = await supabase
      .from('invoices_ff2024')
      .insert([{
        id: invoiceId,
        date: invoiceData.date,
        po_number: invoiceData.poNumber,
        sales_rep: invoiceData.salesRep,
        transaction_type: invoiceData.transactionType,
        customer_name: invoiceData.customerName,
        company: invoiceData.company,
        customer_email: invoiceData.customerEmail,
        customer_phone: invoiceData.customerPhone,
        accounts_payable_email: invoiceData.accountsPayableEmail,
        bill_to_address: invoiceData.billToAddress,
        ship_to_address: invoiceData.shipToAddress,
        shipping_cost: invoiceData.shippingCost,
        additional_info: invoiceData.additionalInfo,
        status: invoiceData.status || 'pending',
        tax_rate: invoiceData.taxRate,
        subtotal: invoiceData.subtotal,
        tax: invoiceData.tax,
        grand_total: invoiceData.grandTotal,
        archived: false,
      }]);
    if (invoiceError) throw invoiceError;

    const items = invoiceData.items.map(item => ({
      invoice_id: invoiceId,
      mfg: item.mfg,
      part_number: item.partNumber,
      description: item.description,
      qty: item.qty,
      unit_price: item.unitPrice,
      taxable: item.taxable,
    }));
    const { error: itemsError } = await supabase
      .from('invoice_items_ff2024')
      .insert(items);
    if (itemsError) throw itemsError;

    await loadInvoices();
    return { id: invoiceId, ...invoiceData };
  };

  const updateInvoice = async (id, updates) => {
    const updateData = {};
    if (updates.date !== undefined) updateData.date = updates.date;
    if (updates.poNumber !== undefined) updateData.po_number = updates.poNumber;
    if (updates.salesRep !== undefined) updateData.sales_rep = updates.salesRep;
    if (updates.transactionType !== undefined) updateData.transaction_type = updates.transactionType;
    if (updates.customerName !== undefined) updateData.customer_name = updates.customerName;
    if (updates.company !== undefined) updateData.company = updates.company;
    if (updates.customerEmail !== undefined) updateData.customer_email = updates.customerEmail;
    if (updates.customerPhone !== undefined) updateData.customer_phone = updates.customerPhone;
    if (updates.accountsPayableEmail !== undefined) updateData.accounts_payable_email = updates.accountsPayableEmail;
    if (updates.billToAddress !== undefined) updateData.bill_to_address = updates.billToAddress;
    if (updates.shipToAddress !== undefined) updateData.ship_to_address = updates.shipToAddress;
    if (updates.shippingCost !== undefined) updateData.shipping_cost = updates.shippingCost;
    if (updates.additionalInfo !== undefined) updateData.additional_info = updates.additionalInfo;
    if (updates.status !== undefined) updateData.status = updates.status;
    if (updates.taxRate !== undefined) updateData.tax_rate = updates.taxRate;
    if (updates.subtotal !== undefined) updateData.subtotal = updates.subtotal;
    if (updates.tax !== undefined) updateData.tax = updates.tax;
    if (updates.grandTotal !== undefined) updateData.grand_total = updates.grandTotal;
    if (updates.archived !== undefined) updateData.archived = updates.archived;

    const { error: invoiceError } = await supabase
      .from('invoices_ff2024')
      .update(updateData)
      .eq('id', id);
    if (invoiceError) throw invoiceError;

    if (updates.items) {
      await supabase.from('invoice_items_ff2024').delete().eq('invoice_id', id);
      const items = updates.items.map(item => ({
        invoice_id: id,
        mfg: item.mfg,
        part_number: item.partNumber,
        description: item.description,
        qty: item.qty,
        unit_price: item.unitPrice,
        taxable: item.taxable,
      }));
      const { error: itemsError } = await supabase
        .from('invoice_items_ff2024')
        .insert(items);
      if (itemsError) throw itemsError;
    }
    await loadInvoices();
  };

  const deleteInvoice = async (id) => {
    const { error: itemsError } = await supabase
      .from('invoice_items_ff2024')
      .delete()
      .eq('invoice_id', id);
    if (itemsError) throw itemsError;

    const { error } = await supabase
      .from('invoices_ff2024')
      .delete()
      .eq('id', id);
    if (error) throw error;
    setInvoices(prev => prev.filter(inv => inv.id !== id));
  };

  // ─── Customer Operations ──────────────────────────────────────────────────

  const addCustomer = async (customerData) => {
    const { data, error } = await supabase
      .from('customers_ff2024')
      .insert([{
        name: customerData.name,
        company: customerData.company || '',
        email: customerData.email,
        phone: customerData.phone,
        bill_to_address: customerData.billToAddress,
        ship_to_address: customerData.shipToAddress,
        accounts_payable_email: customerData.accountsPayableEmail,
      }])
      .select()
      .single();
    if (error) throw error;
    await loadCustomers();
    return data;
  };

  const updateCustomer = async (id, updates) => {
    const { error } = await supabase
      .from('customers_ff2024')
      .update({
        name: updates.name,
        company: updates.company || '',
        email: updates.email,
        phone: updates.phone,
        bill_to_address: updates.billToAddress,
        ship_to_address: updates.shipToAddress,
        accounts_payable_email: updates.accountsPayableEmail,
      })
      .eq('id', id);
    if (error) throw error;
    await loadCustomers();
  };

  const deleteCustomer = async (id) => {
    const { error } = await supabase
      .from('customers_ff2024')
      .delete()
      .eq('id', id);
    if (error) throw error;
    setCustomers(prev => prev.filter(c => c.id !== id));
  };

  // ─── User Operations ──────────────────────────────────────────────────────

  const addUser = async (userData) => {
    const { data, error } = await supabase
      .from('users_ff2024')
      .insert([{
        username: userData.username,
        name: userData.name,
        email: userData.email,
        phone: userData.phone,
        role: userData.role,
        password_hash: userData.password,
      }])
      .select()
      .single();
    if (error) throw error;
    await loadUsers();
    return data;
  };

  const updateUser = async (id, updates) => {
    const updateData = {
      name: updates.name,
      email: updates.email,
      phone: updates.phone,
    };
    if (updates.password) updateData.password_hash = updates.password;
    const { error } = await supabase
      .from('users_ff2024')
      .update(updateData)
      .eq('id', id);
    if (error) throw error;
    await loadUsers();
  };

  const deleteUser = async (id) => {
    const { error } = await supabase
      .from('users_ff2024')
      .delete()
      .eq('id', id);
    if (error) throw error;
    await loadUsers();
  };

  // ─── Settings Operations ──────────────────────────────────────────────────

  const updateSettings = async (newSettings) => {
    try {
      if (newSettings.taxRate !== undefined) {
        const taxRateValue = parseFloat(newSettings.taxRate).toString();
        const { error } = await supabase
          .from('settings_ff2024')
          .upsert([{ key: 'tax_rate', value: taxRateValue }], { onConflict: 'key' });
        if (error) throw error;
        setSettings(prev => ({ ...prev, taxRate: parseFloat(newSettings.taxRate) }));
      }
      await loadSettings();
    } catch (error) {
      console.error('Error updating settings:', error);
      throw error;
    }
  };

  // ─── Office Info Operations ───────────────────────────────────────────────

  const updateOfficeInfo = async (updates) => {
    const updateData = {
      company_name: updates.companyName,
      address: updates.address,
      phone: updates.phone,
      emergency_phone: updates.emergencyPhone,
      email: updates.email,
      service_email: updates.serviceEmail,
      username: updates.username,
    };
    if (updates.password) updateData.password_hash = updates.password;

    const { data: checkData, error: checkError } = await supabase
      .from('office_info_ff2024')
      .select('id')
      .limit(1);
    if (checkError) throw checkError;

    let result;
    if (checkData && checkData.length > 0) {
      result = await supabase
        .from('office_info_ff2024')
        .update(updateData)
        .eq('id', checkData[0].id);
    } else {
      result = await supabase
        .from('office_info_ff2024')
        .insert([updateData]);
    }
    if (result.error) throw result.error;

    setOfficeInfo({
      companyName: updates.companyName,
      address: updates.address,
      phone: updates.phone,
      emergencyPhone: updates.emergencyPhone,
      email: updates.email,
      serviceEmail: updates.serviceEmail,
      username: updates.username,
      password: updates.password || officeInfo.password,
    });
    await loadOfficeInfo();
  };

  const value = {
    invoices, customers, users, officeInfo, settings, loading,
    addInvoice, updateInvoice, deleteInvoice,
    addCustomer, updateCustomer, deleteCustomer,
    addUser, updateUser, deleteUser,
    updateOfficeInfo, updateSettings, loadAllData,
  };

  return (
    <DataContext.Provider value={value}>
      {children}
    </DataContext.Provider>
  );
};