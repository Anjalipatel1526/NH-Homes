import React, { createContext, useContext, useState, useEffect } from 'react';
import type { Employee, Client, InventoryItem, RentalRequest, ActivityLog, SystemSettings, AdditionalCharges } from '../types';
import { mockEmployees, mockClients, mockInventory, mockRentalRequests, mockActivityLogs, defaultSystemSettings } from '../data/mockData';
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

  // Initialize data from localStorage or mockData
  useEffect(() => {
    const localEmployees = localStorage.getItem('nh_homes_db_v2_employees');
    const localClients = localStorage.getItem('nh_homes_db_v2_clients');
    const localInventory = localStorage.getItem('nh_homes_db_v2_inventory');
    const localRentals = localStorage.getItem('nh_homes_db_v2_rentals');
    const localLogs = localStorage.getItem('nh_homes_db_v2_logs');
    const localSettings = localStorage.getItem('nh_homes_db_v2_settings');

    if (localEmployees) setEmployees(JSON.parse(localEmployees));
    else { setEmployees(mockEmployees); localStorage.setItem('nh_homes_db_v2_employees', JSON.stringify(mockEmployees)); }

    if (localClients) setClients(JSON.parse(localClients));
    else { setClients(mockClients); localStorage.setItem('nh_homes_db_v2_clients', JSON.stringify(mockClients)); }

    if (localInventory) setInventory(JSON.parse(localInventory));
    else { setInventory(mockInventory); localStorage.setItem('nh_homes_db_v2_inventory', JSON.stringify(mockInventory)); }

    if (localRentals) setRentalRequests(JSON.parse(localRentals));
    else { setRentalRequests(mockRentalRequests); localStorage.setItem('nh_homes_db_v2_rentals', JSON.stringify(mockRentalRequests)); }

    if (localLogs) setActivityLogs(JSON.parse(localLogs));
    else { setActivityLogs(mockActivityLogs); localStorage.setItem('nh_homes_db_v2_logs', JSON.stringify(mockActivityLogs)); }

    if (localSettings) setSettings(JSON.parse(localSettings));
    else { setSettings(defaultSystemSettings); localStorage.setItem('nh_homes_db_v2_settings', JSON.stringify(defaultSystemSettings)); }

    fetchInventory();
  }, []);

  // Sync state helpers
  const saveEmployees = (data: Employee[]) => { setEmployees(data); localStorage.setItem('nh_homes_db_v2_employees', JSON.stringify(data)); };
  const saveClients = (data: Client[]) => { setClients(data); localStorage.setItem('nh_homes_db_v2_clients', JSON.stringify(data)); };
  const saveInventory = (data: InventoryItem[]) => { setInventory(data); localStorage.setItem('nh_homes_db_v2_inventory', JSON.stringify(data)); };
  const saveRentals = (data: RentalRequest[]) => { setRentalRequests(data); localStorage.setItem('nh_homes_db_v2_rentals', JSON.stringify(data)); };
  const saveLogs = (data: ActivityLog[]) => { setActivityLogs(data); localStorage.setItem('nh_homes_db_v2_logs', JSON.stringify(data)); };
  const saveSettings = (data: SystemSettings) => { setSettings(data); localStorage.setItem('nh_homes_db_v2_settings', JSON.stringify(data)); };

  const logActivity = (user: string, role: 'admin' | 'employee' | 'client', action: string, type: ActivityLog['type'], details: string) => {
    const newLog: ActivityLog = {
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString(),
      user,
      role,
      action,
      type,
      details
    };
    saveLogs([newLog, ...activityLogs]);
  };

  // Employee Actions
  const addEmployee = (empData: Omit<Employee, 'id' | 'employeeId'>) => {
    const nextIdNum = employees.length + 1;
    const employeeId = `EMP-${nextIdNum.toString().padStart(3, '0')}`;
    const newEmp: Employee = {
      ...empData,
      id: `emp-${Date.now()}`,
      employeeId,
      status: 'Active'
    };
    saveEmployees([...employees, newEmp]);
  };

  const updateEmployee = (id: string, updatedFields: Partial<Employee>) => {
    const updated = employees.map(emp => emp.id === id ? { ...emp, ...updatedFields } : emp);
    saveEmployees(updated);
  };

  const deleteEmployee = (id: string) => {
    const filtered = employees.filter(emp => emp.id !== id);
    saveEmployees(filtered);
  };

  // Client Actions
  const addClient = (cltData: Omit<Client, 'id' | 'rentalHistory' | 'paymentHistory'>) => {
    const newClt: Client = {
      ...cltData,
      id: `clt-${Date.now()}`,
      rentalHistory: [],
      paymentHistory: []
    };
    saveClients([...clients, newClt]);
  };

  const updateClient = (id: string, updatedFields: Partial<Client>) => {
    const updated = clients.map(clt => clt.id === id ? { ...clt, ...updatedFields } : clt);
    saveClients(updated);
  };

  const deleteClient = (id: string) => {
    const filtered = clients.filter(clt => clt.id !== id);
    saveClients(filtered);
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
  const submitRentalRequest = (reqData: Omit<RentalRequest, 'id' | 'rentalNumber' | 'invoiceNumber' | 'status' | 'createdAt' | 'amountPaid'>) => {
    const newRequest: RentalRequest = {
      ...reqData,
      id: `req-${Date.now()}`,
      rentalNumber: '',
      invoiceNumber: '',
      status: 'Pending',
      createdAt: new Date().toISOString(),
      amountPaid: 0
    };
    saveRentals([...rentalRequests, newRequest]);

    // Update equipment statuses to Reserved
    const equipmentIdsToReserve = reqData.items.map(i => i.equipmentId);
    const updatedInv = inventory.map(item => {
      if (equipmentIdsToReserve.includes(item.equipmentId)) {
        return { ...item, status: 'Reserved' as const };
      }
      return item;
    });
    saveInventory(updatedInv);
  };

  const approveRentalRequest = (
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

    let clientToUpdate: { id: string; amount: number } | null = null;
    let equipmentToRent: string[] = [];

    const updatedRentals = rentalRequests.map(req => {
      if (req.id === id) {
        clientToUpdate = { id: req.clientId, amount: grandTotal };
        equipmentToRent = req.items.map(i => i.equipmentId);

        return {
          ...req,
          rentalNumber,
          invoiceNumber,
          additionalCharges,
          discountTotal,
          gstTotal,
          grandTotal,
          status: 'Approved' as const,
          approvedAt: new Date().toISOString(),
          invoiceDate: new Date().toISOString().split('T')[0]
        };
      }
      return req;
    });

    saveRentals(updatedRentals);

    // Update Equipment Status to Rented and update rental history
    if (equipmentToRent.length > 0) {
      const updatedInv = inventory.map(item => {
        if (equipmentToRent.includes(item.equipmentId)) {
          const clientName = updatedRentals.find(r => r.id === id)?.clientName || 'Client';
          const newHistory = {
            id: `rh-${Date.now()}`,
            rentalNumber,
            clientName,
            startDate: updatedRentals.find(r => r.id === id)?.startDate || '',
            endDate: updatedRentals.find(r => r.id === id)?.endDate || '',
            status: 'Active' as const
          };
          return {
            ...item,
            status: 'Rented' as const,
            rentalHistory: [newHistory, ...item.rentalHistory]
          };
        }
        return item;
      });
      saveInventory(updatedInv);
    }

    // Update Client Rental & Payment History
    if (clientToUpdate) {
      const targetRequest = updatedRentals.find(r => r.id === id)!;
      const updatedClients = clients.map(client => {
        if (client.id === clientToUpdate!.id) {
          const newRental = {
            rentalNumber,
            startDate: targetRequest.startDate,
            endDate: targetRequest.endDate,
            totalAmount: grandTotal,
            status: 'Active' as const
          };
          const newPayment = {
            invoiceNumber,
            date: new Date().toISOString().split('T')[0],
            amount: 0,
            method: 'Bank Transfer' as const,
            status: 'Pending' as const
          };
          return {
            ...client,
            rentalHistory: [newRental, ...client.rentalHistory],
            paymentHistory: [newPayment, ...client.paymentHistory]
          };
        }
        return client;
      });
      saveClients(updatedClients);
    }
  };

  const rejectRentalRequest = (id: string) => {
    let equipmentToRelease: string[] = [];

    const updatedRentals = rentalRequests.map(req => {
      if (req.id === id) {
        equipmentToRelease = req.items.map(i => i.equipmentId);
        return {
          ...req,
          status: 'Rejected' as const
        };
      }
      return req;
    });
    saveRentals(updatedRentals);

    // Release equipment back to Available
    if (equipmentToRelease.length > 0) {
      const updatedInv = inventory.map(item => {
        if (equipmentToRelease.includes(item.equipmentId)) {
          return { ...item, status: 'Available' as const };
        }
        return item;
      });
      saveInventory(updatedInv);
    }
  };

  const recordPayment = (
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
          ...req,
          amountPaid: newPaid,
          paymentMethod: method,
          paymentStatus: (isFullyPaid ? 'Completed' : (newPaid > 0 ? 'Partial' : 'Pending')) as any
        };
      }
      return req;
    });

    saveRentals(updatedRentals);

    // Update client payment history
    if (clientId && invoiceNo) {
      const updatedClients = clients.map(client => {
        if (client.id === clientId) {
          const updatedPayments = client.paymentHistory.map(pmt => {
            if (pmt.invoiceNumber === invoiceNo) {
              const newAmount = pmt.amount + amount;
              return {
                ...pmt,
                amount: newAmount,
                method,
                status: (isFullyPaid ? 'Completed' : 'Partial') as any
              };
            }
            return pmt;
          });
          return {
            ...client,
            paymentHistory: updatedPayments
          };
        }
        return client;
      });
      saveClients(updatedClients);
    }
  };

  const updateSettings = (updatedSettings: SystemSettings) => {
    saveSettings(updatedSettings);
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
