import React, { createContext, useContext, useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import supabase from '../lib/supabase';

const DataContext = createContext();

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};

export const DataProvider = ({ children }) => {
  const [invoices, setInvoices] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [users, setUsers] = useState([]);
  const [officeInfo, setOfficeInfo] = useState({});
  const [settings, setSettings] = useState({ taxRate: 8.0 });
  const [loading, setLoading] = useState(true);

  // Load data from Supabase
  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    try {
      setLoading(true);
      // Load all data in parallel
      const [
        invoicesResult,
        customersResult,
        usersResult,
        officeResult,
        settingsResult
      ] = await Promise.all([
        loadInvoices(),
        loadCustomers(),
        loadUsers(),
        loadOfficeInfo(),
        loadSettings()
      ]);
      console.log('Supabase: All data loaded successfully');
    } catch (error) {
      console.error('Error loading data from Supabase:', error);
      // Fallback to localStorage if Supabase fails
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
      .select(`
        *,
        invoice_items_ff2024 (*)
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;

    const formattedInvoices = data.map(invoice => ({
      ...invoice,
      id: invoice.id,
      date: invoice.date,
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
      status: invoice.status,
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
        taxable: item.taxable
      }))
    }));

    setInvoices(formattedInvoices);
    return formattedInvoices;
  };

  const loadCustomers = async () => {
    const { data, error } = await supabase
      .from('customers_ff2024')
      .select('*')
      .order('name');

    if (error) throw error;

    const formattedCustomers = data.map(customer => ({
      ...customer,
      company: customer.company,
      billToAddress: customer.bill_to_address,
      shipToAddress: customer.ship_to_address,
      accountsPayableEmail: customer.accounts_payable_email
    }));

    setCustomers(formattedCustomers);
    return formattedCustomers;
  };

  const loadUsers = async () => {
    const { data, error } = await supabase
      .from('users_ff2024')
      .select('*')
      .order('name');

    if (error) throw error;

    const formattedUsers = data.map(user => ({
      ...user,
      password: user.password_hash // For compatibility
    }));

    setUsers(formattedUsers);
    return formattedUsers;
  };

  const loadOfficeInfo = async () => {
    const { data, error } = await supabase
      .from('office_info_ff2024')
      .select('*')
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') throw error;

    if (data) {
      const formattedOfficeInfo = {
        companyName: data.company_name,
        address: data.address,
        phone: data.phone,
        emergencyPhone: data.emergency_phone,
        email: data.email,
        serviceEmail: data.service_email,
        password: data.password_hash,
        username: data.username || 'office1'
      };
      setOfficeInfo(formattedOfficeInfo);
      return formattedOfficeInfo;
    }
    return {};
  };

  const loadSettings = async () => {
    const { data, error } = await supabase
      .from('settings_ff2024')
      .select('*');

    if (error) throw error;

    const settingsObj = {};
    data.forEach(setting => {
      if (setting.key === 'tax_rate') {
        settingsObj.taxRate = parseFloat(setting.value);
      }
    });

    const finalSettings = settingsObj.taxRate ? settingsObj : { taxRate: 8.0 };
    setSettings(finalSettings);
    return finalSettings;
  };

  // Invoice operations
  const addInvoice = async (invoiceData) => {
    try {
      const invoiceId = uuidv4();

      // Insert invoice
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
          archived: false
        }]);

      if (invoiceError) throw invoiceError;

      // Insert invoice items
      const items = invoiceData.items.map(item => ({
        invoice_id: invoiceId,
        mfg: item.mfg,
        part_number: item.partNumber,
        description: item.description,
        qty: item.qty,
        unit_price: item.unitPrice,
        taxable: item.taxable
      }));

      const { error: itemsError } = await supabase
        .from('invoice_items_ff2024')
        .insert(items);

      if (itemsError) throw itemsError;

      // Reload invoices
      await loadInvoices();

      return { id: invoiceId, ...invoiceData };
    } catch (error) {
      console.error('Error adding invoice:', error);
      throw error;
    }
  };

  const updateInvoice = async (id, updates) => {
    try {
      // Create update object with only the fields that are provided
      const updateData = {};

      // Map frontend field names to database field names
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

      // Update invoice
      const { error: invoiceError } = await supabase
        .from('invoices_ff2024')
        .update(updateData)
        .eq('id', id);

      if (invoiceError) throw invoiceError;

      // Update items if provided
      if (updates.items) {
        // Delete existing items
        await supabase
          .from('invoice_items_ff2024')
          .delete()
          .eq('invoice_id', id);

        // Insert new items
        const items = updates.items.map(item => ({
          invoice_id: id,
          mfg: item.mfg,
          part_number: item.partNumber,
          description: item.description,
          qty: item.qty,
          unit_price: item.unitPrice,
          taxable: item.taxable
        }));

        const { error: itemsError } = await supabase
          .from('invoice_items_ff2024')
          .insert(items);

        if (itemsError) throw itemsError;
      }

      // Reload invoices
      await loadInvoices();
    } catch (error) {
      console.error('Error updating invoice:', error);
      throw error;
    }
  };

  // Delete invoice operation
  const deleteInvoice = async (id) => {
    try {
      // Delete invoice items first (foreign key constraint)
      const { error: itemsError } = await supabase
        .from('invoice_items_ff2024')
        .delete()
        .eq('invoice_id', id);

      if (itemsError) throw itemsError;

      // Delete invoice
      const { error } = await supabase
        .from('invoices_ff2024')
        .delete()
        .eq('id', id);

      if (error) throw error;

      // Update local state
      setInvoices(invoices.filter(invoice => invoice.id !== id));
    } catch (error) {
      console.error('Error deleting invoice:', error);
      throw error;
    }
  };

  // Customer operations
  const addCustomer = async (customerData) => {
    try {
      const { data, error } = await supabase
        .from('customers_ff2024')
        .insert([{
          name: customerData.name,
          company: customerData.company,
          email: customerData.email,
          phone: customerData.phone,
          bill_to_address: customerData.billToAddress,
          ship_to_address: customerData.shipToAddress,
          accounts_payable_email: customerData.accountsPayableEmail
        }])
        .select()
        .single();

      if (error) throw error;

      await loadCustomers();
      return data;
    } catch (error) {
      console.error('Error adding customer:', error);
      throw error;
    }
  };

  const updateCustomer = async (id, updates) => {
    try {
      const { error } = await supabase
        .from('customers_ff2024')
        .update({
          name: updates.name,
          company: updates.company,
          email: updates.email,
          phone: updates.phone,
          bill_to_address: updates.billToAddress,
          ship_to_address: updates.shipToAddress,
          accounts_payable_email: updates.accountsPayableEmail
        })
        .eq('id', id);

      if (error) throw error;

      await loadCustomers();
    } catch (error) {
      console.error('Error updating customer:', error);
      throw error;
    }
  };

  // Delete customer operation
  const deleteCustomer = async (id) => {
    try {
      const { error } = await supabase
        .from('customers_ff2024')
        .delete()
        .eq('id', id);

      if (error) throw error;

      // Update local state
      setCustomers(customers.filter(customer => customer.id !== id));
    } catch (error) {
      console.error('Error deleting customer:', error);
      throw error;
    }
  };

  // User operations
  const addUser = async (userData) => {
    try {
      const { data, error } = await supabase
        .from('users_ff2024')
        .insert([{
          username: userData.username,
          name: userData.name,
          email: userData.email,
          phone: userData.phone,
          role: userData.role,
          password_hash: userData.password
        }])
        .select()
        .single();

      if (error) throw error;

      await loadUsers();
      return data;
    } catch (error) {
      console.error('Error adding user:', error);
      throw error;
    }
  };

  const updateUser = async (id, updates) => {
    try {
      const updateData = {
        name: updates.name,
        email: updates.email,
        phone: updates.phone
      };

      if (updates.password) {
        updateData.password_hash = updates.password;
      }

      const { error } = await supabase
        .from('users_ff2024')
        .update(updateData)
        .eq('id', id);

      if (error) throw error;

      await loadUsers();
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  };

  const deleteUser = async (id) => {
    try {
      const { error } = await supabase
        .from('users_ff2024')
        .delete()
        .eq('id', id);

      if (error) throw error;

      await loadUsers();
    } catch (error) {
      console.error('Error deleting user:', error);
      throw error;
    }
  };

  // Settings operations
  const updateSettings = async (newSettings) => {
    try {
      console.log('Updating settings in DataContext:', newSettings);
      if (newSettings.taxRate !== undefined) {
        // Make sure we're passing a string value to Supabase
        const taxRateValue = newSettings.taxRate.toString();
        console.log('Tax rate string value:', taxRateValue);

        const { data, error } = await supabase
          .from('settings_ff2024')
          .upsert([{ key: 'tax_rate', value: taxRateValue }], { onConflict: 'key' });

        if (error) {
          console.error('Supabase settings update error:', error);
          throw error;
        }

        console.log('Settings update response:', data);
        console.log('Settings updated successfully in database');

        // Update local state
        setSettings(prev => ({ ...prev, taxRate: parseFloat(newSettings.taxRate) }));
      }
      await loadSettings();
      console.log('Settings reloaded from database');
    } catch (error) {
      console.error('Error updating settings:', error);
      throw error;
    }
  };

  // Office info operations
  const updateOfficeInfo = async (updates) => {
    try {
      console.log('Updating office info in DataContext:', updates);
      const updateData = {
        company_name: updates.companyName,
        address: updates.address,
        phone: updates.phone,
        emergency_phone: updates.emergencyPhone,
        email: updates.email,
        service_email: updates.serviceEmail,
        username: updates.username
      };

      if (updates.password) {
        updateData.password_hash = updates.password;
      }

      // First check if any records exist
      const { data: checkData, error: checkError } = await supabase
        .from('office_info_ff2024')
        .select('id')
        .limit(1);

      if (checkError) {
        console.error('Error checking office info:', checkError);
        throw checkError;
      }

      let result;
      if (checkData && checkData.length > 0) {
        // Update existing record
        console.log('Updating existing record with ID:', checkData[0].id);
        result = await supabase
          .from('office_info_ff2024')
          .update(updateData)
          .eq('id', checkData[0].id);
      } else {
        // Insert new record
        console.log('No existing record found, inserting new one');
        result = await supabase
          .from('office_info_ff2024')
          .insert([updateData]);
      }

      if (result.error) {
        console.error('Supabase office info update error:', result.error);
        throw result.error;
      }

      console.log('Office info update result:', result);
      console.log('Office info updated successfully in database');

      // Update local state
      setOfficeInfo({
        companyName: updates.companyName,
        address: updates.address,
        phone: updates.phone,
        emergencyPhone: updates.emergencyPhone,
        email: updates.email,
        serviceEmail: updates.serviceEmail,
        username: updates.username,
        password: updates.password || officeInfo.password
      });

      await loadOfficeInfo();
      console.log('Office info reloaded from database');
    } catch (error) {
      console.error('Error updating office info:', error);
      throw error;
    }
  };

  const value = {
    invoices,
    customers,
    users,
    officeInfo,
    settings,
    loading,
    addInvoice,
    updateInvoice,
    deleteInvoice,
    addCustomer,
    updateCustomer,
    deleteCustomer,
    addUser,
    updateUser,
    deleteUser,
    updateOfficeInfo,
    updateSettings,
    loadAllData
  };

  return (
    <DataContext.Provider value={value}>
      {children}
    </DataContext.Provider>
  );
};