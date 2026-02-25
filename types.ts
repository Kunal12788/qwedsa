
export enum UserRole {
  STOCK_INTAKE_ADMIN = 'STOCK_INTAKE_ADMIN', // 1st Admin
  ALLOTMENT_ADMIN = 'ALLOTMENT_ADMIN', // 2nd Admin
  BILLING_ADMIN = 'BILLING_ADMIN', // 3rd Admin (Now handles Gold Collection too)
  DELIVERY_ADMIN = 'DELIVERY_ADMIN', // 4th Admin (Logistics)
  SUPER_ADMIN = 'SUPER_ADMIN', // Main Admin
  CUSTOMER = 'CUSTOMER',
  QR_MANAGER = 'QR_MANAGER', // Deprecated, keeping for backward compatibility if needed, but we will use specific roles
  TAG_ENTRY_ADMIN = 'TAG_ENTRY_ADMIN', // 1st Tag Admin: Enters Gold Weight & Details
  TAG_FINALIZER_ADMIN = 'TAG_FINALIZER_ADMIN' // 2nd Tag Admin: Enters Total Weight & Finalizes
}

export interface TagItem {
  id: string;
  type: string;
  purity: string;
  goldWeight: number; // Net Weight (Entered by 1st Admin)
  totalWeight: number; // Gross Weight (Entered by 2nd Admin)
  stoneWeight: number; // Calculated (Total - Gold)
  fineWeight: number; // 24k Equivalent
  status: 'DRAFT' | 'FINALIZED';
  createdBy: string;
  finalizedBy?: string;
  timestamp: string;
}

export enum ProductStatus {
  IN_ADMIN_STOCK = 'IN_ADMIN_STOCK',
  ALLOTTED = 'ALLOTTED', // Pending customer confirmation
  CONFIRMED_BY_CUSTOMER = 'CONFIRMED_BY_CUSTOMER', // Matched and accepted
  BILLED = 'BILLED',
  COMPLETED = 'COMPLETED', // Payment & Gold Received
  DISPATCHED = 'DISPATCHED', // Left warehouse
  DELIVERED = 'DELIVERED', // Reached customer
  SUSPENDED = 'SUSPENDED' // Soft delete / Hold state
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  password?: string; // New field for auth logic
  verified: boolean; // New field for approval workflow
  avatarUrl?: string;
  joinedAt?: string;
  // Login Tracking
  lastDevice?: string;
  lastLoginAt?: string;
  loginCount?: number;
  unauthorizedAttempts?: number; // Security tracking for closed-hours access
}

export interface Product {
  id: string;
  barcodeId: string;
  type: string;
  purity: '24k' | '22k' | '18k' | '14k' | string;
  goldWeight: number; // in grams
  stoneWeight: number; // in carats/grams
  totalWeight: number;
  imageUrl: string;
  status: ProductStatus;
  createdAt: string;
  createdBy?: string; // Admin who performed intake
  // Allotment details
  customerId?: string;
  allottedBy?: string;
  allottedAt?: string;
  doubleVerifiedAllotment?: boolean;
  // Intake details
  batchId?: string; // Unique code for the intake batch
}

export interface Customer {
  id: string;
  uniqueName: string;
  legalName: string;
  email: string;
  phone: string;
  address?: string; 
  city?: string;
  pincode?: string; // New
  landmark?: string; // New
  gstin?: string; // New
  pan?: string;   // New
  status: 'PENDING' | 'ACTIVE' | 'BANNED'; 
  joinedAt: string; 
  totalGoldInventory: number;
}

export interface AuditLog {
  id: string;
  action: string;
  performedBy: string; // User Name
  role: UserRole;
  timestamp: string;
  details: string;
  // New fields for Incident Management
  status?: 'OPEN' | 'RESOLVED'; 
  resolvedAt?: string;
}

export interface BillItem {
  productId: string;
  productType: string;
  purity: string;
  barcodeId: string;
  
  grossWeight: number;
  purityFactor: number;
  fineGoldWeight: number;
  
  appliedRate: number; // 24k rate per 10g
  goldValue: number;
  
  makingChargePercent: number;
  makingChargeAmount: number;
  
  goldGstPercent: number;
  makingGstPercent: number;
  taxAmount: number;
  
  totalAmount: number;
}

export interface BillingRecord {
  id: string;
  customerId: string;
  
  items: BillItem[];
  
  // Aggregates for easy display
  totalFineGoldWeight: number; 
  totalGoldValue: number;
  totalMakingCharges: number;
  totalTaxAmount: number;
  grandTotal: number;

  status: 'PENDING' | 'COMPLETED'; // status of the whole transaction
  paymentReceived: boolean;
  paymentMode?: 'UPI' | 'RTGS' | 'CHEQUE' | 'CASH' | 'OTHER'; 
  goldReceived: boolean; // New field to link with gold collection
  createdAt: string;
}

export interface DeliveryPackage {
  packageQrId: string; // The "Group" QR Code
  billId: string;
  customerId: string;
  productIds: string[];
  status: 'DISPATCHED' | 'DELIVERED';
  dispatchedAt: string;
  deliveredAt?: string;
  dispatchedBy: string;
}

export interface GlobalSettings {
  goldRatePer10Gm: number;
  isWorkingHoursActive: boolean; // New Field
}

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  timestamp: string;
  read: boolean;
}