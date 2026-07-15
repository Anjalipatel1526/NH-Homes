export type UserRole = 'admin' | 'employee' | 'client';

export interface User {
  id: string;
  username: string;
  email: string;
  role: UserRole;
  name: string;
  profileImage?: string;
  entityId?: string; // Links to Employee ID or Client ID
}

export interface Employee {
  id: string;
  employeeId: string; // Auto-generated
  name: string;
  username: string;
  email: string;
  phone: string;
  role: 'admin' | 'employee';
  department: string;
  profilePicture?: string;
  address: string;
  joiningDate: string;
  status: 'Active' | 'Inactive';
  salary?: number;
  rating?: number;
  tasksCompleted?: number;
  efficiency?: number;
}

export interface Client {
  id: string;
  name: string;
  companyName: string;
  gstNumber: string;
  panNumber: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  idProof: string;
  status: 'Active' | 'Inactive';
  notes: string;
  profileImage?: string;
  documents: string[]; // Document URLs/names
  password?: string;
  rentalHistory: {
    rentalNumber: string;
    startDate: string;
    endDate: string;
    totalAmount: number;
    status: 'Active' | 'Completed' | 'Pending' | 'Overdue';
  }[];
  paymentHistory: {
    invoiceNumber: string;
    date: string;
    amount: number;
    method: 'UPI' | 'Cash' | 'Cheque' | 'Bank Transfer';
    status: 'Completed' | 'Partial' | 'Pending';
  }[];
}

export type InventoryStatus = 'Available' | 'Rented' | 'Maintenance' | 'Reserved' | 'Lost' | 'Damaged';

export interface MaintenanceRecord {
  id: string;
  date: string;
  type: string;
  cost: number;
  description: string;
  technician: string;
}

export interface RentalHistoryRecord {
  id: string;
  rentalNumber: string;
  clientName: string;
  startDate: string;
  endDate: string;
  status: 'Active' | 'Completed' | 'Overdue';
}

export interface InventoryItem {
  id: string;
  equipmentId: string; // Auto-generated
  name: string;
  category: string;
  brand: string;
  model: string;
  serialNumber: string;
  purchaseDate: string;
  purchasePrice: number;
  rentalPriceDay: number;
  rentalPriceWeek: number;
  rentalPriceMonth: number;
  securityDeposit: number;
  currentLocation: string;
  images: string[];
  status: InventoryStatus;
  qrCode: string;
  barcode: string;
  specifications: { label: string; value: string }[];
  description: string;
  maintenanceHistory: MaintenanceRecord[];
  rentalHistory: RentalHistoryRecord[];
}

export interface RentalCartItem {
  equipment: InventoryItem;
  quantity: number;
  durationDays: number;
  dailyCharges: number;
  discount: number;
  securityDeposit: number;
  taxes: number;
  subtotal: number;
  total: number;
  expectedReturnDate: string;
  notes: string;
}

export interface AdditionalCharges {
  transportation: number;
  loading: number;
  unloading: number;
  delivery: number;
  damage: number;
  lateFee: number;
}

export interface RentalRequest {
  id: string;
  rentalNumber: string; // Auto-generated after approval
  invoiceNumber: string; // Auto-generated after approval
  clientId: string;
  clientName: string;
  companyName: string;
  items: {
    equipmentId: string;
    equipmentName: string;
    quantity: number;
    durationDays: number;
    dailyCharges: number;
    discount: number;
    securityDeposit: number;
    taxes: number;
    subtotal: number;
    total: number;
    expectedReturnDate: string;
    notes: string;
  }[];
  startDate: string;
  endDate: string;
  securityDepositTotal: number;
  gstTotal: number;
  discountTotal: number;
  rentalChargesTotal: number;
  additionalCharges: AdditionalCharges;
  grandTotal: number;
  paymentStatus: 'Pending' | 'Completed' | 'Partial' | 'Overdue';
  paymentMethod?: 'UPI' | 'Cash' | 'Cheque' | 'Bank Transfer';
  status: 'Pending' | 'Approved' | 'Rejected';
  expectedReturnDate: string;
  notes?: string;
  createdAt: string;
  approvedAt?: string;
  invoiceDate?: string;
  amountPaid: number;
}

export interface ActivityLog {
  id: string;
  timestamp: string;
  user: string;
  role: UserRole;
  action: string;
  type: 'create' | 'update' | 'delete' | 'auth' | 'system' | 'payment' | 'rental';
  details: string;
}

export interface SystemSettings {
  companyName: string;
  gstNumber: string;
  invoicePrefix: string;
  currency: string;
  taxRate: number;
  rentalRules: string;
  notificationSettings: {
    emailAlerts: boolean;
    smsAlerts: boolean;
    returnReminders: boolean;
    paymentReminders: boolean;
  };
  backupInterval: 'daily' | 'weekly' | 'monthly';
  lastBackupDate: string;
}
