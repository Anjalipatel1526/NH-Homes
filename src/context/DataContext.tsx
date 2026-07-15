import React, { createContext, useContext, useState, useEffect } from 'react';
import type { Employee, Client, InventoryItem, RentalRequest, ActivityLog, SystemSettings, AdditionalCharges } from '../types';
import { defaultSystemSettings } from '../data/mockData';
import { supabase } from '../lib/supabase';
import { toast } from 'react-toastify';

interface DataContextType {
  employees: Employee[];
  clients: Client[];
  inventory: InventoryItem[];
  rentalRequests: RentalRequest[];
  activityLogs: ActivityLog[];
  settings: SystemSettings;
  
  // Employee Actions
  addEmployee: (employee: Omit<Employee, 'id' | 'employeeId'>) => void;
  updateEmployee: (id: string, employee: Partial<Employee>) => void;
  deleteEmployee: (id: string) => void;
  
  // Client Actions
  addClient: (client: Omit<Client, 'id' | 'rentalHistory' | 'paymentHistory'>) => void;
  updateClient: (id: string, client: Partial<Client>) => void;
  deleteClient: (id: string) => void;
  
  // Inventory Actions
  addInventoryItem: (item: Omit<InventoryItem, 'id' | 'equipmentId' | 'qrCode' | 'barcode' | 'maintenanceHistory' | 'rentalHistory'>) => void | Promise<void>;
  updateInventoryItem: (id: string, item: Partial<InventoryItem>) => void | Promise<void>;
  deleteInventoryItem: (id: string) => void | Promise<void>;
  
  // Rental Actions
  submitRentalRequest: (request: Omit<RentalRequest, 'id' | 'rentalNumber' | 'invoiceNumber' | 'status' | 'createdAt' | 'amountPaid'>) => void;
  approveRentalRequest: (id: string, additionalCharges: AdditionalCharges, discountTotal: number, gstTotal: number, grandTotal: number) => void;
  rejectRentalRequest: (id: string) => void;
  recordPayment: (id: string, amount: number, method: 'UPI' | 'Cash' | 'Cheque' | 'Bank Transfer') => void;
  
  // Settings Actions
  updateSettings: (settings: SystemSettings) => void;
  logActivity: (user: string, role: 'admin' | 'employee' | 'client', action: string, type: ActivityLog['type'], details: string) => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [rentalRequests, setRentalRequests] = useState<RentalRequest[]>([]);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [settings, setSettings] = useState<SystemSettings>(defaultSystemSettings);

  const fetchInventory = async () => {
    try {
      const { data: dbItems, error } = await supabase
        .from('inventory_items')
        .select('*');
        
      if (error) {
        console.error('Error fetching inventory from Supabase:', error);
        return;
      }
      
      if (dbItems) {
        const mappedItems = await Promise.all(dbItems.map(async (dbItem) => {
          const { data: specs } = await supabase
            .from('equipment_specifications')
            .select('*')
            .eq('inventory_item_id', dbItem.id);
            
          const { data: maintenance } = await supabase
            .from('maintenance_records')
            .select('*')
            .eq('inventory_item_id', dbItem.id);

          return {
            id: dbItem.id,
            equipmentId: dbItem.equipment_id,
            name: dbItem.name,
            category: dbItem.category,
            brand: dbItem.brand,
            model: dbItem.model,
            serialNumber: dbItem.serial_number,
            purchaseDate: dbItem.purchase_date,
            purchasePrice: Number(dbItem.purchase_price),
            rentalPriceDay: Number(dbItem.rental_price_day),
            rentalPriceWeek: Number(dbItem.rental_price_week),
            rentalPriceMonth: Number(dbItem.rental_price_month),
            securityDeposit: Number(dbItem.security_deposit),
            currentLocation: dbItem.current_location || '',
            images: dbItem.images || [],
            status: dbItem.status,
            qrCode: dbItem.qr_code || '',
            barcode: dbItem.barcode || '',
            specifications: specs ? specs.map(s => ({ label: s.label, value: s.value })) : [],
            description: dbItem.description || '',
            maintenanceHistory: maintenance ? maintenance.map(m => ({
              id: m.id,
              date: m.date,
              type: m.type,
              cost: Number(m.cost),
              description: m.description || '',
              technician: m.technician
            })) : [],
            rentalHistory: []
          };
        }));
        
        setInventory(mappedItems);
        localStorage.setItem('nh_homes_db_v2_inventory', JSON.stringify(mappedItems));
      }
    } catch (err) {
      console.error('Failed to sync Supabase inventory:', err);
    }
  };

  const fetchClients = async () => {
    try {
      const { data: dbClients, error } = await supabase
        .from('clients')
        .select('*');
        
      if (error) {
        console.error('Error fetching clients from Supabase:', error);
        return;
      }
      
      if (dbClients) {
        const mappedClients = await Promise.all(dbClients.map(async (dbClt) => {
          const { data: rentals } = await supabase
            .from('client_rental_history')
            .select('*')
            .eq('client_id', dbClt.id);
            
          const { data: payments } = await supabase
            .from('client_payment_history')
            .select('*')
            .eq('client_id', dbClt.id);

          return {
            id: dbClt.id,
            name: dbClt.name,
            companyName: dbClt.company_name,
            gstNumber: dbClt.gstin || '',
            panNumber: dbClt.pan || '',
            phone: dbClt.phone,
            email: dbClt.email,
            address: dbClt.address || '',
            city: dbClt.city || '',
            state: dbClt.state || '',
            pincode: dbClt.pincode || '',
            idProof: dbClt.id_proof || '',
            status: dbClt.status,
            notes: dbClt.notes || '',
            profileImage: dbClt.profile_image || '',
            password: dbClt.password || '',
            documents: dbClt.id_proof ? [dbClt.id_proof] : [],
            rentalHistory: rentals ? rentals.map(r => ({
              rentalNumber: r.rental_number,
              startDate: r.start_date,
              endDate: r.end_date,
              totalAmount: Number(r.amount),
              status: r.status
            })) : [],
            paymentHistory: payments ? payments.map(p => ({
              invoiceNumber: p.invoice_number,
              date: p.date,
              amount: Number(p.amount),
              method: p.method,
              status: p.status
            })) : []
          };
        }));
        
        setClients(mappedClients);
        localStorage.setItem('nh_homes_db_v2_clients', JSON.stringify(mappedClients));
      }
    } catch (err) {
      console.error('Failed to sync Supabase clients:', err);
    }
  };

  const fetchEmployees = async () => {
    try {
      const { data, error } = await supabase.from('employees').select('*');
      if (error) { console.error('Error fetching employees:', error); return; }
      if (data && data.length > 0) {
        const mapped = data.map((e: any) => ({
          id: e.id, employeeId: e.employee_id || '', name: e.name, username: e.username || '',
          email: e.email, phone: e.phone, role: e.role, department: e.department || '',
          profilePicture: e.profile_picture || e.avatar || '', address: e.address || '',
          joiningDate: e.joining_date, status: e.status
        }));
        setEmployees(mapped);
        localStorage.setItem('nh_homes_db_v2_employees', JSON.stringify(mapped));
      }
    } catch (err) { console.error('Failed to fetch employees:', err); }
  };

  const fetchRentalRequests = async () => {
    try {
      const { data, error } = await supabase.from('rental_requests').select('*');
      if (error) { console.error('Error fetching rentals:', error); return; }
      if (data && data.length > 0) {
        const mapped = await Promise.all(data.map(async (r: any) => {
          const { data: items } = await supabase.from('rental_request_items').select('*').eq('rental_request_id', r.id);
          return {
            id: r.id, rentalNumber: r.rental_number || '', invoiceNumber: r.invoice_number || '',
            clientId: r.client_id || '', clientName: r.client_name, companyName: r.company_name,
            startDate: r.start_date, endDate: r.end_date, expectedReturnDate: r.expected_return_date || r.end_date,
            status: r.status, grandTotal: Number(r.grand_total || 0), amountPaid: Number(r.amount_paid || 0),
            securityDepositTotal: Number(r.security_deposit_total || 0), gstTotal: Number(r.gst_total || 0),
            discountTotal: Number(r.discount_total || 0), rentalChargesTotal: Number(r.rental_charges_total || 0),
            additionalCharges: r.additional_charges || { transportation: 0, loading: 0, unloading: 0, delivery: 0, damage: 0, lateFee: 0 },
            paymentStatus: r.payment_status || 'Pending', paymentMethod: r.payment_method,
            notes: r.notes || '', createdAt: r.created_at, approvedAt: r.approved_at, invoiceDate: r.invoice_date,
            items: items ? items.map((i: any) => ({
              equipmentId: i.equipment_id, equipmentName: i.equipment_name, quantity: i.quantity,
              durationDays: i.duration_days || 1, dailyCharges: Number(i.daily_charges),
              discount: Number(i.discount || 0), securityDeposit: Number(i.security_deposit || 0),
              taxes: Number(i.taxes || 0), subtotal: Number(i.subtotal || 0), total: Number(i.total || 0),
              expectedReturnDate: i.expected_return_date || '', notes: i.notes || ''
            })) : []
          };
        }));
        setRentalRequests(mapped);
        localStorage.setItem('nh_homes_db_v2_rentals', JSON.stringify(mapped));
      }
    } catch (err) { console.error('Failed to fetch rentals:', err); }
  };

  const fetchActivityLogs = async () => {
    try {
      const { data, error } = await supabase.from('activity_logs').select('*').order('timestamp', { ascending: false }).limit(200);
      if (error) { console.error('Error fetching logs:', error); return; }
      if (data && data.length > 0) {
        const mapped = data.map((l: any) => ({
          id: l.id, timestamp: l.timestamp, user: l.user, role: l.role,
          action: l.action, type: l.type, details: l.details
        }));
        setActivityLogs(mapped);
        localStorage.setItem('nh_homes_db_v2_logs', JSON.stringify(mapped));
      }
    } catch (err) { console.error('Failed to fetch logs:', err); }
  };

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase.from('system_settings').select('*').eq('id', 1).single();
      if (error) { console.error('Error fetching settings:', error); return; }
      if (data) {
        const mapped: SystemSettings = {
          companyName: data.company_name || '', gstNumber: data.gstin || '',
          invoicePrefix: data.invoice_prefix || 'INV', currency: data.currency || 'INR',
          taxRate: Number(data.tax_rate || 18), rentalRules: data.rental_rules || data.terms_conditions || '',
          notificationSettings: {
            emailAlerts: data.notification_email_alerts ?? true, smsAlerts: data.notification_sms_alerts ?? false,
            returnReminders: data.notification_return_reminders ?? true, paymentReminders: data.notification_payment_reminders ?? true
          },
          backupInterval: data.backup_interval || 'daily', lastBackupDate: data.last_backup_date || ''
        };
        setSettings(mapped);
        localStorage.setItem('nh_homes_db_v2_settings', JSON.stringify(mapped));
      }
    } catch (err) { console.error('Failed to fetch settings:', err); }
  };

  // Initialize: load from localStorage as cache, then fetch from Supabase
  useEffect(() => {
    // Load cached data first for instant UI
    const localEmployees = localStorage.getItem('nh_homes_db_v2_employees');
    const localClients = localStorage.getItem('nh_homes_db_v2_clients');
    const localInventory = localStorage.getItem('nh_homes_db_v2_inventory');
    const localRentals = localStorage.getItem('nh_homes_db_v2_rentals');
    const localLogs = localStorage.getItem('nh_homes_db_v2_logs');
    const localSettings = localStorage.getItem('nh_homes_db_v2_settings');

    if (localEmployees) setEmployees(JSON.parse(localEmployees));
    if (localClients) setClients(JSON.parse(localClients));
    if (localInventory) setInventory(JSON.parse(localInventory));
    if (localRentals) setRentalRequests(JSON.parse(localRentals));
    if (localLogs) setActivityLogs(JSON.parse(localLogs));
    if (localSettings) setSettings(JSON.parse(localSettings));

    // Then sync from Supabase (overrides local cache)
    fetchEmployees();
    fetchClients();
    fetchInventory();
    fetchRentalRequests();
    fetchActivityLogs();
    fetchSettings();
  }, []);

  // Sync state helpers
  const saveEmployees = (data: Employee[]) => { setEmployees(data); localStorage.setItem('nh_homes_db_v2_employees', JSON.stringify(data)); };
  const saveClients = (data: Client[]) => { setClients(data); localStorage.setItem('nh_homes_db_v2_clients', JSON.stringify(data)); };
  const saveInventory = (data: InventoryItem[]) => { setInventory(data); localStorage.setItem('nh_homes_db_v2_inventory', JSON.stringify(data)); };
  const saveRentals = (data: RentalRequest[]) => { setRentalRequests(data); localStorage.setItem('nh_homes_db_v2_rentals', JSON.stringify(data)); };
  const saveLogs = (data: ActivityLog[]) => { setActivityLogs(data); localStorage.setItem('nh_homes_db_v2_logs', JSON.stringify(data)); };
  const saveSettings = (data: SystemSettings) => { setSettings(data); localStorage.setItem('nh_homes_db_v2_settings', JSON.stringify(data)); };

  const logActivity = async (user: string, role: 'admin' | 'employee' | 'client', action: string, type: ActivityLog['type'], details: string) => {
    const newLog: ActivityLog = {
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString(),
      user, role, action, type, details
    };
    saveLogs([newLog, ...activityLogs]);
    try {
      await supabase.from('activity_logs').insert({
        id: newLog.id, user: newLog.user, role: newLog.role,
        action: newLog.action, type: newLog.type, details: newLog.details
      });
    } catch (err) { console.error('Failed to log activity to Supabase:', err); }
  };

  // Employee Actions
  const addEmployee = async (empData: Omit<Employee, 'id' | 'employeeId'>) => {
    try {
      const nextIdNum = employees.length + 1;
      const employeeId = `EMP-${nextIdNum.toString().padStart(3, '0')}`;
      const empId = `emp-${Date.now()}`;
      const newEmp: Employee = { ...empData, id: empId, employeeId, status: 'Active' };

      const { error } = await supabase.from('employees').insert({
        id: empId, employee_id: employeeId, name: empData.name, username: empData.username || '',
        role: empData.role, department: empData.department || '', email: empData.email,
        phone: empData.phone, status: 'Active', joining_date: empData.joiningDate,
        profile_picture: empData.profilePicture || '', address: empData.address || ''
      });
      if (error) { console.error('Error inserting employee:', error); throw error; }

      saveEmployees([...employees, newEmp]);
    } catch (err: any) {
      console.error('Failed to add employee:', err);
      toast.error(err?.message || 'Database error: Failed to add employee.');
    }
  };

  const updateEmployee = async (id: string, updatedFields: Partial<Employee>) => {
    try {
      const dbFields: any = {};
      if (updatedFields.name !== undefined) dbFields.name = updatedFields.name;
      if (updatedFields.email !== undefined) dbFields.email = updatedFields.email;
      if (updatedFields.phone !== undefined) dbFields.phone = updatedFields.phone;
      if (updatedFields.role !== undefined) dbFields.role = updatedFields.role;
      if (updatedFields.department !== undefined) dbFields.department = updatedFields.department;
      if (updatedFields.status !== undefined) dbFields.status = updatedFields.status;
      if (updatedFields.joiningDate !== undefined) dbFields.joining_date = updatedFields.joiningDate;
      if (updatedFields.profilePicture !== undefined) dbFields.profile_picture = updatedFields.profilePicture;
      if (updatedFields.address !== undefined) dbFields.address = updatedFields.address;
      if (updatedFields.username !== undefined) dbFields.username = updatedFields.username;

      const { error } = await supabase.from('employees').update(dbFields).eq('id', id);
      if (error) { console.error('Error updating employee:', error); throw error; }

      const updated = employees.map(emp => emp.id === id ? { ...emp, ...updatedFields } : emp);
      saveEmployees(updated);
    } catch (err: any) {
      console.error('Failed to update employee:', err);
      toast.error(err?.message || 'Database error: Failed to update employee.');
    }
  };

  const deleteEmployee = async (id: string) => {
    try {
      const { error } = await supabase.from('employees').delete().eq('id', id);
      if (error) { console.error('Error deleting employee:', error); throw error; }
      const filtered = employees.filter(emp => emp.id !== id);
      saveEmployees(filtered);
    } catch (err: any) {
      console.error('Failed to delete employee:', err);
      toast.error(err?.message || 'Database error: Failed to delete employee.');
    }
  };

  // Client Actions
  const addClient = async (cltData: Omit<Client, 'id' | 'rentalHistory' | 'paymentHistory'>) => {
    try {
      const clientId = `clt-${Date.now()}`;
      const dbData = {
        id: clientId,
        client_id: `${cltData.email.split('@')[0]}_${Date.now()}`,
        name: cltData.name,
        company_name: cltData.companyName,
        email: cltData.email,
        phone: cltData.phone,
        status: cltData.status,
        address: cltData.address || '',
        city: cltData.city || '',
        state: cltData.state || '',
        pincode: cltData.pincode || '',
        id_proof: cltData.idProof || '',
        notes: cltData.notes || '',
        profile_image: cltData.profileImage || '',
        password: cltData.password || '',
        gstin: cltData.gstNumber || '',
        pan: cltData.panNumber || ''
      };

      const { error } = await supabase
        .from('clients')
        .insert(dbData);

      if (error) {
        console.error('Error inserting client to Supabase:', error);
        throw error;
      }

      const newClt: Client = {
        ...cltData,
        id: clientId,
        rentalHistory: [],
        paymentHistory: []
      };
      
      const updatedClients = [...clients, newClt];
      setClients(updatedClients);
      localStorage.setItem('nh_homes_db_v2_clients', JSON.stringify(updatedClients));
    } catch (err: any) {
      console.error('Failed to add client:', err);
      const msg = err?.message || '';
      if (msg.includes('clients_email_key') || msg.includes('duplicate') && msg.includes('email')) {
        toast.error('A client with this email address already exists.');
      } else if (msg.includes('clients_client_id_key')) {
        toast.error('A client with this identifier already exists. Please try again.');
      } else {
        toast.error(msg || 'Database error: Failed to create client profile.');
      }
      throw err;
    }
  };

  const updateClient = async (id: string, updatedFields: Partial<Client>) => {
    try {
      const dbFields: any = {};
      if (updatedFields.name !== undefined) dbFields.name = updatedFields.name;
      if (updatedFields.companyName !== undefined) dbFields.company_name = updatedFields.companyName;
      if (updatedFields.email !== undefined) {
        dbFields.email = updatedFields.email;
      }
      if (updatedFields.phone !== undefined) dbFields.phone = updatedFields.phone;
      if (updatedFields.status !== undefined) dbFields.status = updatedFields.status;
      if (updatedFields.address !== undefined) dbFields.address = updatedFields.address;
      if (updatedFields.city !== undefined) dbFields.city = updatedFields.city;
      if (updatedFields.state !== undefined) dbFields.state = updatedFields.state;
      if (updatedFields.pincode !== undefined) dbFields.pincode = updatedFields.pincode;
      if (updatedFields.idProof !== undefined) dbFields.id_proof = updatedFields.idProof;
      if (updatedFields.notes !== undefined) dbFields.notes = updatedFields.notes;
      if (updatedFields.profileImage !== undefined) dbFields.profile_image = updatedFields.profileImage;
      if (updatedFields.password !== undefined) dbFields.password = updatedFields.password;
      if (updatedFields.gstNumber !== undefined) dbFields.gstin = updatedFields.gstNumber;
      if (updatedFields.panNumber !== undefined) dbFields.pan = updatedFields.panNumber;

      const { error } = await supabase
        .from('clients')
        .update(dbFields)
        .eq('id', id);

      if (error) {
        console.error('Error updating client in Supabase:', error);
        throw error;
      }

      const updated = clients.map(clt => clt.id === id ? { ...clt, ...updatedFields } : clt);
      setClients(updated);
      localStorage.setItem('nh_homes_db_v2_clients', JSON.stringify(updated));
    } catch (err: any) {
      console.error('Failed to update client:', err);
      toast.error(err?.message || 'Database error: Failed to update client profile.');
    }
  };

  const deleteClient = async (id: string) => {
    try {
      const { error } = await supabase
        .from('clients')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting client from Supabase:', error);
        throw error;
      }

      const filtered = clients.filter(clt => clt.id !== id);
      setClients(filtered);
      localStorage.setItem('nh_homes_db_v2_clients', JSON.stringify(filtered));
    } catch (err: any) {
      console.error('Failed to delete client:', err);
      toast.error(err?.message || 'Database error: Failed to delete client profile.');
    }
  };

  // Inventory Actions
  const addInventoryItem = async (itemData: Omit<InventoryItem, 'id' | 'equipmentId' | 'qrCode' | 'barcode' | 'maintenanceHistory' | 'rentalHistory'>) => {
    try {
      const dbData = {
        name: itemData.name,
        category: itemData.category,
        brand: itemData.brand,
        model: itemData.model,
        serial_number: itemData.serialNumber,
        purchase_date: itemData.purchaseDate,
        purchase_price: itemData.purchasePrice,
        rental_price_day: itemData.rentalPriceDay,
        rental_price_week: itemData.rentalPriceWeek,
        rental_price_month: itemData.rentalPriceMonth,
        security_deposit: itemData.securityDeposit,
        current_location: itemData.currentLocation,
        images: itemData.images,
        status: 'Available' as const,
        description: itemData.description
      };
      
      const { data, error } = await supabase
        .from('inventory_items')
        .insert(dbData)
        .select('*')
        .single();

      if (error) {
        console.error('Error inserting item to Supabase:', error);
        throw error;
      }
      
      if (data) {
        const newItem: InventoryItem = {
          id: data.id,
          equipmentId: data.equipment_id,
          name: data.name,
          category: data.category,
          brand: data.brand,
          model: data.model,
          serialNumber: data.serial_number,
          purchaseDate: data.purchase_date,
          purchasePrice: Number(data.purchase_price),
          rentalPriceDay: Number(data.rental_price_day),
          rentalPriceWeek: Number(data.rental_price_week),
          rentalPriceMonth: Number(data.rental_price_month),
          securityDeposit: Number(data.security_deposit),
          currentLocation: data.current_location || '',
          images: data.images || [],
          status: data.status,
          qrCode: data.qr_code || '',
          barcode: data.barcode || '',
          specifications: itemData.specifications || [],
          description: data.description || '',
          maintenanceHistory: [],
          rentalHistory: []
        };

        if (itemData.specifications && itemData.specifications.length > 0) {
          const dbSpecs = itemData.specifications.map((s: any) => ({
            inventory_item_id: data.id,
            label: s.label,
            value: s.value
          }));
          await supabase.from('equipment_specifications').insert(dbSpecs);
        }

        const updatedInventory = [...inventory, newItem];
        setInventory(updatedInventory);
        localStorage.setItem('nh_homes_db_v2_inventory', JSON.stringify(updatedInventory));
        toast.success('Equipment asset successfully added!');
      }
    } catch (err: any) {
      console.error('Failed to add item:', err);
      toast.error(err?.message || 'Database error: Failed to add equipment asset.');
    }
  };

  const updateInventoryItem = async (id: string, updatedFields: Partial<InventoryItem>) => {
    try {
      const dbFields: any = {};
      if (updatedFields.name !== undefined) dbFields.name = updatedFields.name;
      if (updatedFields.category !== undefined) dbFields.category = updatedFields.category;
      if (updatedFields.brand !== undefined) dbFields.brand = updatedFields.brand;
      if (updatedFields.model !== undefined) dbFields.model = updatedFields.model;
      if (updatedFields.serialNumber !== undefined) dbFields.serial_number = updatedFields.serialNumber;
      if (updatedFields.purchaseDate !== undefined) dbFields.purchase_date = updatedFields.purchaseDate;
      if (updatedFields.purchasePrice !== undefined) dbFields.purchase_price = updatedFields.purchasePrice;
      if (updatedFields.rentalPriceDay !== undefined) dbFields.rental_price_day = updatedFields.rentalPriceDay;
      if (updatedFields.rentalPriceWeek !== undefined) dbFields.rental_price_week = updatedFields.rentalPriceWeek;
      if (updatedFields.rentalPriceMonth !== undefined) dbFields.rental_price_month = updatedFields.rentalPriceMonth;
      if (updatedFields.securityDeposit !== undefined) dbFields.security_deposit = updatedFields.securityDeposit;
      if (updatedFields.currentLocation !== undefined) dbFields.current_location = updatedFields.currentLocation;
      if (updatedFields.images !== undefined) dbFields.images = updatedFields.images;
      if (updatedFields.status !== undefined) dbFields.status = updatedFields.status;
      if (updatedFields.description !== undefined) dbFields.description = updatedFields.description;

      const { error } = await supabase
        .from('inventory_items')
        .update(dbFields)
        .eq('id', id);

      if (error) {
        console.error('Error updating item in Supabase:', error);
        throw error;
      }

      const updated = inventory.map(item => item.id === id ? { ...item, ...updatedFields } : item);
      setInventory(updated);
      localStorage.setItem('nh_homes_db_v2_inventory', JSON.stringify(updated));
      toast.success('Equipment asset successfully updated!');
    } catch (err: any) {
      console.error('Failed to update item:', err);
      toast.error(err?.message || 'Database error: Failed to update equipment asset.');
    }
  };

  const deleteInventoryItem = async (id: string) => {
    try {
      const { error } = await supabase
        .from('inventory_items')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting item from Supabase:', error);
        throw error;
      }

      const filtered = inventory.filter(item => item.id !== id);
      setInventory(filtered);
      localStorage.setItem('nh_homes_db_v2_inventory', JSON.stringify(filtered));
    } catch (err: any) {
      console.error('Failed to delete item:', err);
      toast.error(err?.message || 'Database error: Failed to delete equipment asset.');
    }
  };

  // Rental Actions
  const submitRentalRequest = async (reqData: Omit<RentalRequest, 'id' | 'rentalNumber' | 'invoiceNumber' | 'status' | 'createdAt' | 'amountPaid'>) => {
    try {
      const reqId = `req-${Date.now()}`;
      const newRequest: RentalRequest = {
        ...reqData, id: reqId, rentalNumber: '', invoiceNumber: '',
        status: 'Pending', createdAt: new Date().toISOString(), amountPaid: 0
      };

      const { error } = await supabase.from('rental_requests').insert({
        id: reqId, client_id: reqData.clientId, client_name: reqData.clientName,
        company_name: reqData.companyName, start_date: reqData.startDate, end_date: reqData.endDate,
        expected_return_date: reqData.expectedReturnDate || reqData.endDate, status: 'Pending',
        total_amount: reqData.rentalChargesTotal || 0, grand_total: reqData.grandTotal || 0,
        security_deposit_total: reqData.securityDepositTotal || 0, gst_total: reqData.gstTotal || 0,
        discount_total: reqData.discountTotal || 0, rental_charges_total: reqData.rentalChargesTotal || 0,
        additional_charges: reqData.additionalCharges || {}, notes: reqData.notes || ''
      });
      if (error) { console.error('Error inserting rental:', error); throw error; }

      // Insert rental items
      if (reqData.items && reqData.items.length > 0) {
        const dbItems = reqData.items.map(i => ({
          rental_request_id: reqId, equipment_id: i.equipmentId, equipment_name: i.equipmentName,
          daily_charges: i.dailyCharges, quantity: i.quantity, duration_days: i.durationDays,
          discount: i.discount, security_deposit: i.securityDeposit, taxes: i.taxes,
          subtotal: i.subtotal, total: i.total, expected_return_date: i.expectedReturnDate, notes: i.notes
        }));
        await supabase.from('rental_request_items').insert(dbItems);
      }

      saveRentals([...rentalRequests, newRequest]);

      // Update equipment statuses to Reserved
      const equipmentIdsToReserve = reqData.items.map(i => i.equipmentId);
      for (const eqId of equipmentIdsToReserve) {
        await supabase.from('inventory_items').update({ status: 'Reserved' }).eq('equipment_id', eqId);
      }
      const updatedInv = inventory.map(item => {
        if (equipmentIdsToReserve.includes(item.equipmentId)) {
          return { ...item, status: 'Reserved' as const };
        }
        return item;
      });
      saveInventory(updatedInv);
    } catch (err: any) {
      console.error('Failed to submit rental:', err);
      toast.error(err?.message || 'Database error: Failed to submit rental request.');
    }
  };

  const approveRentalRequest = async (
    id: string,
    additionalCharges: AdditionalCharges,
    discountTotal: number,
    gstTotal: number,
    grandTotal: number
  ) => {
    const year = new Date().getFullYear();
    const serial = rentalRequests.filter(r => r.rentalNumber).length + 1;
    const rentalNumber = `REN-${year}-${serial.toString().padStart(3, '0')}`;
    const invoiceNumber = `INV-${year}-${serial.toString().padStart(3, '0')}`;
    const approvedAt = new Date().toISOString();
    const invoiceDate = new Date().toISOString().split('T')[0];

    let clientToUpdate: { id: string; amount: number } | null = null;
    let equipmentToRent: string[] = [];

    const updatedRentals = rentalRequests.map(req => {
      if (req.id === id) {
        clientToUpdate = { id: req.clientId, amount: grandTotal };
        equipmentToRent = req.items.map(i => i.equipmentId);
        return { ...req, rentalNumber, invoiceNumber, additionalCharges, discountTotal, gstTotal, grandTotal, status: 'Approved' as const, approvedAt, invoiceDate };
      }
      return req;
    });

    // Sync rental approval to Supabase
    try {
      await supabase.from('rental_requests').update({
        rental_number: rentalNumber, invoice_number: invoiceNumber,
        additional_charges: additionalCharges, discount_total: discountTotal,
        gst_total: gstTotal, grand_total: grandTotal, status: 'Approved',
        approved_at: approvedAt, invoice_date: invoiceDate
      }).eq('id', id);
    } catch (err) { console.error('Failed to approve rental in Supabase:', err); }

    saveRentals(updatedRentals);

    // Update Equipment Status to Rented
    if (equipmentToRent.length > 0) {
      const updatedInv = inventory.map(item => {
        if (equipmentToRent.includes(item.equipmentId)) {
          const clientName = updatedRentals.find(r => r.id === id)?.clientName || 'Client';
          const newHistory = {
            id: `rh-${Date.now()}`, rentalNumber, clientName,
            startDate: updatedRentals.find(r => r.id === id)?.startDate || '',
            endDate: updatedRentals.find(r => r.id === id)?.endDate || '',
            status: 'Active' as const
          };
          return { ...item, status: 'Rented' as const, rentalHistory: [newHistory, ...item.rentalHistory] };
        }
        return item;
      });
      saveInventory(updatedInv);
      for (const eqId of equipmentToRent) {
        try { await supabase.from('inventory_items').update({ status: 'Rented' }).eq('equipment_id', eqId); } catch (err) { /* logged */ }
      }
    }

    // Update Client Rental & Payment History
    if (clientToUpdate) {
      const targetRequest = updatedRentals.find(r => r.id === id)!;
      const updatedClients = clients.map(client => {
        if (client.id === clientToUpdate!.id) {
          const newRental = { rentalNumber, startDate: targetRequest.startDate, endDate: targetRequest.endDate, totalAmount: grandTotal, status: 'Active' as const };
          const newPayment = { invoiceNumber, date: new Date().toISOString().split('T')[0], amount: 0, method: 'Bank Transfer' as const, status: 'Pending' as const };
          return { ...client, rentalHistory: [newRental, ...client.rentalHistory], paymentHistory: [newPayment, ...client.paymentHistory] };
        }
        return client;
      });
      saveClients(updatedClients);

      // Sync client history to Supabase
      try {
        await supabase.from('client_rental_history').insert({
          client_id: clientToUpdate.id, rental_number: rentalNumber,
          start_date: targetRequest.startDate, end_date: targetRequest.endDate,
          amount: grandTotal, status: 'Active'
        });
        await supabase.from('client_payment_history').insert({
          client_id: clientToUpdate.id, invoice_number: invoiceNumber,
          date: invoiceDate, amount: 0, method: 'Bank Transfer', status: 'Pending'
        });
      } catch (err) { console.error('Failed to sync client history:', err); }
    }
  };

  const rejectRentalRequest = async (id: string) => {
    let equipmentToRelease: string[] = [];

    const updatedRentals = rentalRequests.map(req => {
      if (req.id === id) {
        equipmentToRelease = req.items.map(i => i.equipmentId);
        return { ...req, status: 'Rejected' as const };
      }
      return req;
    });
    saveRentals(updatedRentals);

    try {
      await supabase.from('rental_requests').update({ status: 'Rejected' }).eq('id', id);
    } catch (err) { console.error('Failed to reject rental in Supabase:', err); }

    if (equipmentToRelease.length > 0) {
      const updatedInv = inventory.map(item => {
        if (equipmentToRelease.includes(item.equipmentId)) {
          return { ...item, status: 'Available' as const };
        }
        return item;
      });
      saveInventory(updatedInv);
      for (const eqId of equipmentToRelease) {
        try { await supabase.from('inventory_items').update({ status: 'Available' }).eq('equipment_id', eqId); } catch (err) { /* logged */ }
      }
    }
  };

  const recordPayment = async (
    id: string,
    amount: number,
    method: 'UPI' | 'Cash' | 'Cheque' | 'Bank Transfer'
  ) => {
    let clientId = '';
    let invoiceNo = '';
    let isFullyPaid = false;

    const updatedRentals = rentalRequests.map(req => {
      if (req.id === id) {
        clientId = req.clientId;
        invoiceNo = req.invoiceNumber;
        const newPaid = req.amountPaid + amount;
        isFullyPaid = newPaid >= req.grandTotal;
        return {
          ...req, amountPaid: newPaid, paymentMethod: method,
          paymentStatus: (isFullyPaid ? 'Completed' : (newPaid > 0 ? 'Partial' : 'Pending')) as any
        };
      }
      return req;
    });
    saveRentals(updatedRentals);

    // Sync payment to Supabase
    const targetReq = updatedRentals.find(r => r.id === id);
    if (targetReq) {
      try {
        await supabase.from('rental_requests').update({
          amount_paid: targetReq.amountPaid, payment_method: method,
          payment_status: targetReq.paymentStatus
        }).eq('id', id);
      } catch (err) { console.error('Failed to sync payment to Supabase:', err); }
    }

    if (clientId && invoiceNo) {
      const updatedClients = clients.map(client => {
        if (client.id === clientId) {
          const updatedPayments = client.paymentHistory.map(pmt => {
            if (pmt.invoiceNumber === invoiceNo) {
              const newAmount = pmt.amount + amount;
              return { ...pmt, amount: newAmount, method, status: (isFullyPaid ? 'Completed' : 'Partial') as any };
            }
            return pmt;
          });
          return { ...client, paymentHistory: updatedPayments };
        }
        return client;
      });
      saveClients(updatedClients);

      // Update client payment history in Supabase
      try {
        const { data: existing } = await supabase.from('client_payment_history')
          .select('id, amount').eq('client_id', clientId).eq('invoice_number', invoiceNo).single();
        if (existing) {
          const newAmt = Number(existing.amount) + amount;
          await supabase.from('client_payment_history').update({
            amount: newAmt, method, status: isFullyPaid ? 'Completed' : 'Partial'
          }).eq('id', existing.id);
        }
      } catch (err) { console.error('Failed to sync client payment:', err); }
    }
  };

  const updateSettings = async (updatedSettings: SystemSettings) => {
    try {
      const { error } = await supabase.from('system_settings').upsert({
        id: 1, company_name: updatedSettings.companyName, gstin: updatedSettings.gstNumber,
        invoice_prefix: updatedSettings.invoicePrefix, currency: updatedSettings.currency,
        tax_rate: updatedSettings.taxRate, rental_rules: updatedSettings.rentalRules,
        notification_email_alerts: updatedSettings.notificationSettings.emailAlerts,
        notification_sms_alerts: updatedSettings.notificationSettings.smsAlerts,
        notification_return_reminders: updatedSettings.notificationSettings.returnReminders,
        notification_payment_reminders: updatedSettings.notificationSettings.paymentReminders,
        backup_interval: updatedSettings.backupInterval, last_backup_date: updatedSettings.lastBackupDate
      });
      if (error) { console.error('Error updating settings:', error); throw error; }
      saveSettings(updatedSettings);
    } catch (err: any) {
      console.error('Failed to update settings:', err);
      toast.error(err?.message || 'Database error: Failed to update settings.');
    }
  };

  return (
    <DataContext.Provider
      value={{
        employees,
        clients,
        inventory,
        rentalRequests,
        activityLogs,
        settings,
        addEmployee,
        updateEmployee,
        deleteEmployee,
        addClient,
        updateClient,
        deleteClient,
        addInventoryItem,
        updateInventoryItem,
        deleteInventoryItem,
        submitRentalRequest,
        approveRentalRequest,
        rejectRentalRequest,
        recordPayment,
        updateSettings,
        logActivity
      }}
    >
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};
