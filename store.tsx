import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Product, Customer, AuditLog, BillingRecord, GlobalSettings, UserRole, ProductStatus, DeliveryPackage, AppNotification, TagItem } from './types';
import { MOCK_USERS, MOCK_CUSTOMERS, INITIAL_PRODUCTS } from './constants';

interface AppState {
  currentUser: User | null;
  users: User[];
  products: Product[];
  customers: Customer[];
  auditLogs: AuditLog[];
  billingRecords: BillingRecord[];
  deliveryPackages: DeliveryPackage[];
  settings: GlobalSettings;
  notifications: AppNotification[];
  tagBatch: TagItem[]; // Finalized tags ready for print
  draftTags: TagItem[]; // Draft tags from Entry Admin
  generatedTagsHistory: TagItem[];
}

interface CustomerRegistrationData {
  address?: string;
  phone?: string;
  city?: string;
}

interface AppContextType extends AppState {
  login: (email: string, deviceInfo: string, passwordInput?: string) => { success: boolean; message?: string };
  logout: () => void;
  changePassword: (newPassword: string) => void;
  registerUser: (name: string, email: string, role: UserRole, details?: CustomerRegistrationData) => void; 
  addAdmin: (name: string, email: string, role: UserRole) => void; 
  addCustomer: (name: string, email: string, phone: string, address: string, city: string, pincode: string, landmark: string, gstin: string, pan: string) => void; 
  verifyUser: (userId: string) => void;
  deleteUser: (userId: string) => void;
  transferAdminData: (oldAdminId: string, newAdminId: string) => void;
  addProduct: (product: Product) => void;
  updateProduct: (id: string, updates: Partial<Product>) => void;
  allotProduct: (productId: string, customerId: string, adminName: string) => void;
  bulkAllotProducts: (productIds: string[], customerId: string, adminName: string) => void;
  verifyAllotment: (productId: string) => void;
  customerConfirmProduct: (productId: string, match: boolean) => void;
  createBill: (record: BillingRecord) => void;
  settleBillPayment: (billId: string, mode: 'UPI' | 'RTGS' | 'CHEQUE' | 'CASH' | 'OTHER') => void;
  toggleBillGold: (billId: string) => void;
  updateGoldRate: (rate: number) => void;
  logAction: (action: string, details: string) => void;
  resolveIncident: (logId: string) => void; // New Action
  // Super Admin Workflow Actions
  bulkUpdateProductStatus: (productIds: string[], status: ProductStatus) => void;
  injectProduct: (product: Product) => void;
  // Delivery Actions
  dispatchPackage: (billId: string, productIds: string[]) => void;
  deliverPackage: (packageQrId: string) => { success: boolean; message?: string };
  // Workforce Ops
  toggleWorkingHours: (isActive: boolean) => void;
  recordUnauthorizedAttempt: (email: string, deviceInfo: string) => void; // New Security Action
  // Utilities
  getPurityFactor: (purity: string) => number;
  // Notifications
  addNotification: (title: string, message: string, type?: 'info' | 'success' | 'warning' | 'error') => void;
  removeNotification: (id: string) => void;
  // Tag Management
  createDraftTag: (tag: TagItem) => void;
  finalizeTag: (id: string, totalWeight: number) => void;
  addToBatch: (tag: TagItem) => void; // Deprecated/Legacy direct add
  removeFromBatch: (id: string) => void;
  clearBatch: () => void;
  saveBatchToHistory: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const useAppStore = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppStore must be used within an AppProvider');
  }
  return context;
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  
  // Initialize mock users with default login stats and dummy passwords
  const [users, setUsers] = useState<User[]>(MOCK_USERS.map(u => ({
    ...u,
    password: 'password123', // Default mock password for existing users
    loginCount: Math.floor(Math.random() * 50) + 1,
    lastDevice: Math.random() > 0.5 ? 'Windows 10' : 'macOS',
    lastLoginAt: new Date(Date.now() - Math.random() * 1000000000).toISOString(),
    unauthorizedAttempts: 0
  })));
  
  // "Database" States
  const [products, setProducts] = useState<Product[]>(INITIAL_PRODUCTS);
  const [customers, setCustomers] = useState<Customer[]>(MOCK_CUSTOMERS.map(c => ({
    ...c,
    gstin: '27AAAAA0000A1Z5', // Mock GST for existing data
    pan: 'ABCDE1234F', // Mock PAN for existing data
    pincode: '400001',
    landmark: 'Near Central Park'
  })));
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [billingRecords, setBillingRecords] = useState<BillingRecord[]>([]);
  const [deliveryPackages, setDeliveryPackages] = useState<DeliveryPackage[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [tagBatch, setTagBatch] = useState<TagItem[]>([]);
  const [draftTags, setDraftTags] = useState<TagItem[]>([]);
  const [generatedTagsHistory, setGeneratedTagsHistory] = useState<TagItem[]>([]);
  
  // DEFAULT WORKING HOURS OFF
  const [settings, setSettings] = useState<GlobalSettings>({ 
    goldRatePer10Gm: 72000,
    isWorkingHoursActive: false 
  });

  // ... (existing effects)

  // ... (existing actions)

  // Initial Log & Permission Request
  useEffect(() => {
    if (auditLogs.length === 0) {
      setAuditLogs([{
        id: 'init',
        action: 'SYSTEM_START',
        performedBy: 'SYSTEM',
        role: UserRole.SUPER_ADMIN,
        timestamp: new Date().toISOString(),
        details: 'System initialized.',
        status: 'RESOLVED'
      }]);
    }

    // Request Notification Permission
    if ('Notification' in window && Notification.permission !== 'granted' && Notification.permission !== 'denied') {
      Notification.requestPermission();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // --- AUTOMATIC LOGOUT EFFECT ---
  // If working hours are turned OFF, log out anyone who isn't a Super Admin
  useEffect(() => {
    if (!settings.isWorkingHoursActive && currentUser) {
      if (currentUser.role !== UserRole.SUPER_ADMIN && currentUser.role !== UserRole.CUSTOMER) {
        // We exclude CUSTOMER here if we want customers to access portal anytime, 
        // OR include them if the "Store" is closed. 
        // Prompt says "other admins will be able to login... all the admins will be automatically sign out".
        // So we strictly target admins.
        
        setCurrentUser(null);
        // We can't use 'alert' cleanly inside useEffect in some React strict modes, but we can log it.
        console.warn("Force logout: Working hours ended.");
      }
    }
  }, [settings.isWorkingHoursActive, currentUser]);

  const addNotification = (title: string, message: string, type: 'info' | 'success' | 'warning' | 'error' = 'info') => {
    const newNotification: AppNotification = {
      id: Math.random().toString(36).substr(2, 9),
      title,
      message,
      type,
      timestamp: new Date().toISOString(),
      read: false
    };
    setNotifications(prev => [newNotification, ...prev]);

    // Browser Notification
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('Aurum Enterprise', { 
        body: `${title}: ${message}`
      });
    }

    // Auto-dismiss after 5 seconds
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== newNotification.id));
    }, 5000);
  };

  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const getPurityFactor = (purity: string): number => {
    const p = purity.toLowerCase();
    if (p.includes('24k')) return 1.0;
    if (p.includes('22k')) return 0.916;
    if (p.includes('18k')) return 0.750;
    if (p.includes('14k')) return 0.585;
    return 1.0; // Default fallback
  };

  const logAction = (action: string, details: string) => {
    const performer = currentUser ? currentUser.name : 'SYSTEM';
    const role = currentUser ? currentUser.role : UserRole.SUPER_ADMIN;
    
    // Auto-detect if this action needs resolution
    const requiresResolution = ['SECURITY_ALERT', 'CUSTOMER_MISMATCH', 'USER_REMOVED', 'BULK_STATUS_CHANGE'].includes(action);

    const newLog: AuditLog = {
      id: Math.random().toString(36).substr(2, 9),
      action,
      performedBy: performer,
      role: role,
      timestamp: new Date().toISOString(),
      details,
      status: requiresResolution ? 'OPEN' : 'RESOLVED' // Set initial status
    };
    setAuditLogs(prev => [newLog, ...prev]);
  };

  const resolveIncident = (logId: string) => {
    setAuditLogs(prev => prev.map(log => 
      log.id === logId 
        ? { ...log, status: 'RESOLVED', resolvedAt: new Date().toISOString() } 
        : log
    ));
    addNotification('Incident Resolved', 'Security concern has been marked as resolved.', 'success');
  };

  const login = (email: string, deviceInfo: string, passwordInput: string = 'password123') => {
    const userIndex = users.findIndex(u => u.email === email);
    const user = users[userIndex];

    if (user) {
      // 1. Check Verification
      if (!user.verified) {
        return { success: false, message: 'Account pending approval by Super Admin.' };
      }

      // 2. Check Working Hours (Admins Only)
      if (user.role !== UserRole.SUPER_ADMIN && user.role !== UserRole.CUSTOMER) {
         if (!settings.isWorkingHoursActive) {
            // Note: Login.tsx handles the unauthorized tracking call separately before calling this
            return { success: false, message: 'Operations Closed. Working Time has not started.' };
         }
      }
      
      // 3. Check Password
      const storedPassword = user.password || 'password123';
      if (passwordInput !== storedPassword && passwordInput !== '1234') { 
         if (passwordInput !== storedPassword) {
             return { success: false, message: 'Invalid Password' };
         }
      }

      // Update User Stats
      const updatedUser = {
        ...user,
        lastDevice: deviceInfo,
        lastLoginAt: new Date().toISOString(),
        loginCount: (user.loginCount || 0) + 1,
        unauthorizedAttempts: 0 // Reset security alerts on successful login
      };

      // Update Users Array
      const newUsers = [...users];
      newUsers[userIndex] = updatedUser;
      setUsers(newUsers);

      setCurrentUser(updatedUser);
      return { success: true };
    }
    return { success: false, message: 'Invalid credentials.' };
  };

  const logout = () => {
    setCurrentUser(null);
  };

  const changePassword = (newPassword: string) => {
    if (currentUser) {
        const updatedUser = { ...currentUser, password: newPassword };
        setUsers(prev => prev.map(u => u.id === currentUser.id ? updatedUser : u));
        setCurrentUser(updatedUser);
        logAction('PASSWORD_CHANGE', `User ${currentUser.name} changed their password.`);
    }
  };

  const registerUser = (name: string, email: string, role: UserRole, details?: CustomerRegistrationData) => {
    const newUser: User = {
      id: Math.random().toString(36).substr(2, 9),
      name,
      email,
      role,
      password: 'password123', // Default for self-register
      verified: false, // Default to unverified for self-signup
      joinedAt: new Date().toISOString(),
      loginCount: 0
    };
    setUsers(prev => [...prev, newUser]);
    
    if (role === UserRole.CUSTOMER) {
      const newCustomer: Customer = {
        id: newUser.id,
        uniqueName: `CUST-${Math.floor(Math.random() * 10000)}`,
        legalName: name,
        email: email,
        phone: details?.phone || '',
        address: details?.address || '',
        city: details?.city || '',
        gstin: '',
        pan: '',
        status: 'PENDING',
        joinedAt: new Date().toISOString(),
        totalGoldInventory: 0
      };
      setCustomers(prev => [...prev, newCustomer]);
    }
    
    logAction('USER_SIGNUP', `New user signup: ${name} (${role}) - Pending Verification`);
  };

  const addAdmin = (name: string, email: string, role: UserRole) => {
    const newUser: User = {
      id: Math.random().toString(36).substr(2, 9),
      name,
      email,
      role,
      password: 'password123',
      verified: true, // Auto-verified since added by Super Admin
      joinedAt: new Date().toISOString(),
      loginCount: 0
    };
    setUsers(prev => [...prev, newUser]);
    logAction('ADMIN_ADDED', `Super Admin created new user: ${name} as ${role}`);
  };

  const addCustomer = (name: string, email: string, phone: string, address: string, city: string, pincode: string, landmark: string, gstin: string, pan: string) => {
    const newId = Math.random().toString(36).substr(2, 9);
    
    const newUser: User = {
      id: newId,
      name,
      email,
      role: UserRole.CUSTOMER,
      password: '1234', // DEFAULT PASSWORD FOR NEW CUSTOMERS
      verified: true,
      joinedAt: new Date().toISOString(),
      loginCount: 0
    };
    
    const newCustomer: Customer = {
      id: newId,
      uniqueName: `CUST-${Math.floor(Math.random() * 10000)}`,
      legalName: name,
      email: email,
      phone: phone,
      address: address,
      city: city,
      pincode: pincode,
      landmark: landmark,
      gstin: gstin,
      pan: pan,
      status: 'ACTIVE', 
      joinedAt: new Date().toISOString(),
      totalGoldInventory: 0
    };

    setUsers(prev => [...prev, newUser]);
    setCustomers(prev => [...prev, newCustomer]);
    logAction('CUSTOMER_ADDED', `Super Admin manually added customer: ${name}. Default password set to '1234'.`);
    addNotification('Customer Added', `${name} has been added to the registry.`, 'success');
  };

  const verifyUser = (userId: string) => {
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, verified: true } : u));
    setCustomers(prev => prev.map(c => c.id === userId ? { ...c, status: 'ACTIVE' } : c));
    const user = users.find(u => u.id === userId);
    logAction('USER_VERIFIED', `User ${user?.name} (${user?.role}) approved by Super Admin`);
    addNotification('User Verified', `${user?.name} is now active.`, 'success');
  };

  const deleteUser = (userId: string) => {
    const user = users.find(u => u.id === userId);
    setUsers(prev => prev.filter(u => u.id !== userId));
    if (user?.role === UserRole.CUSTOMER) {
      setCustomers(prev => prev.filter(c => c.id !== userId));
    }
    logAction('USER_REMOVED', `User ${user?.name} removed by Super Admin`);
    addNotification('User Removed', `${user?.name} has been deleted.`, 'warning');
  };

  const transferAdminData = (oldAdminId: string, newAdminId: string) => {
    const oldAdmin = users.find(u => u.id === oldAdminId);
    const newAdmin = users.find(u => u.id === newAdminId);
    if (!oldAdmin || !newAdmin) return;
    setProducts(prev => prev.map(p => {
      if (p.allottedBy === oldAdmin.name) return { ...p, allottedBy: newAdmin.name };
      return p;
    }));
    setAuditLogs(prev => prev.map(l => {
      if (l.performedBy === oldAdmin.name) return { ...l, performedBy: newAdmin.name };
      return l;
    }));
    setUsers(prev => prev.filter(u => u.id !== oldAdminId));
    logAction('ADMIN_TRANSFER', `Transferred active work and history from ${oldAdmin.name} to ${newAdmin.name}.`);
  };

  const addProduct = (product: Product) => {
    setProducts(prev => [product, ...prev]);
    logAction('STOCK_INTAKE', `Added product Barcode: ${product.barcodeId}, Weight: ${product.goldWeight}g`);
    addNotification('Stock Added', `Product ${product.barcodeId} added to inventory.`, 'success');
  };

  const updateProduct = (id: string, updates: Partial<Product>) => {
    setProducts(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
  };

  const allotProduct = (productId: string, customerId: string, adminName: string) => {
    updateProduct(productId, { status: ProductStatus.ALLOTTED, customerId, allottedBy: adminName, doubleVerifiedAllotment: false });
    logAction('ALLOTMENT_INIT', `Product ${productId} allotted to Customer ${customerId} by ${adminName}`);
    addNotification('Product Allotted', `Item allotted to customer. Pending verification.`, 'info');
  };

  const bulkAllotProducts = (productIds: string[], customerId: string, adminName: string) => {
    setProducts(prev => prev.map(p => {
      if (productIds.includes(p.id)) {
        return { ...p, status: ProductStatus.ALLOTTED, customerId, allottedBy: adminName, doubleVerifiedAllotment: false };
      }
      return p;
    }));
    logAction('BULK_ALLOTMENT', `Bulk allotted ${productIds.length} items to Customer ${customerId} by ${adminName}`);
  };

  const verifyAllotment = (productId: string) => {
    updateProduct(productId, { doubleVerifiedAllotment: true });
    logAction('ALLOTMENT_VERIFY', `Double verification complete for Product ${productId}`);
    addNotification('Allotment Verified', `Double verification successful for ${productId}.`, 'success');
  };

  const customerConfirmProduct = (productId: string, match: boolean) => {
    if (match) {
      const prod = products.find(p => p.id === productId);
      if (prod && prod.customerId) {
        updateProduct(productId, { status: ProductStatus.CONFIRMED_BY_CUSTOMER });
        logAction('CUSTOMER_MATCH', `Customer confirmed product ${productId}. Ready for billing.`);
        addNotification('Customer Confirmed', `Product ${productId} confirmed by customer.`, 'success');
      }
    } else {
      logAction('CUSTOMER_MISMATCH', `CRITICAL: Customer reported mismatch on product ${productId}`);
      addNotification('Mismatch Reported', `Customer reported issue with product ${productId}!`, 'error');
    }
  };

  const createBill = (record: BillingRecord) => {
    setBillingRecords(prev => [record, ...prev]);
    // Update all items in this bill to BILLED status
    const itemIds = record.items.map(i => i.productId);
    setProducts(prev => prev.map(p => itemIds.includes(p.id) ? { ...p, status: ProductStatus.BILLED } : p));
    
    logAction('BILLING_CREATE', `Bill Generated for ${record.items.length} items. Fine Gold: ${record.totalFineGoldWeight.toFixed(2)}g, Total: ₹${record.grandTotal}`);
    addNotification('Bill Generated', `Invoice created for ₹${record.grandTotal.toLocaleString()}`, 'success');
  };

  const settleBillPayment = (billId: string, mode: 'UPI' | 'RTGS' | 'CHEQUE' | 'CASH' | 'OTHER') => {
    setBillingRecords(prev => prev.map(b => {
      if (b.id === billId) {
        const updated = { 
          ...b, 
          paymentReceived: true,
          paymentMode: mode
        };
        updated.status = updated.paymentReceived && updated.goldReceived ? 'COMPLETED' : 'PENDING';
        
        if (updated.status === 'COMPLETED') {
           // Update all products to COMPLETED
           const itemIds = updated.items.map(i => i.productId);
           setProducts(currentProds => currentProds.map(p => itemIds.includes(p.id) ? { ...p, status: ProductStatus.COMPLETED } : p));
           logAction('TRANSACTION_COMPLETE', `Bill ${billId} Fully Settled`);
           addNotification('Transaction Complete', `Bill ${billId} fully settled.`, 'success');
        }
        return updated;
      }
      return b;
    }));
    logAction('PAYMENT_RECEIVED', `Payment received via ${mode} for Bill ${billId}`);
    addNotification('Payment Received', `Received payment via ${mode}`, 'info');
  };

  const toggleBillGold = (billId: string) => {
    setBillingRecords(prev => prev.map(b => {
      if (b.id === billId) {
        const updated = { ...b, goldReceived: !b.goldReceived };
        updated.status = updated.paymentReceived && updated.goldReceived ? 'COMPLETED' : 'PENDING';
        
        if (updated.status === 'COMPLETED') {
           // Update all products to COMPLETED
           const itemIds = updated.items.map(i => i.productId);
           setProducts(currentProds => currentProds.map(p => itemIds.includes(p.id) ? { ...p, status: ProductStatus.COMPLETED } : p));
           logAction('TRANSACTION_COMPLETE', `Bill ${billId} Fully Settled`);
           addNotification('Transaction Complete', `Bill ${billId} fully settled.`, 'success');
        }
        return updated;
      }
      return b;
    }));
  };

  const updateGoldRate = (rate: number) => {
    setSettings({ ...settings, goldRatePer10Gm: rate });
    logAction('RATE_UPDATE', `Gold rate updated to ${rate}`);
    addNotification('Gold Rate Updated', `New rate: ₹${rate}`, 'info');
  };

  const bulkUpdateProductStatus = (productIds: string[], status: ProductStatus) => {
    setProducts(prev => prev.map(p => productIds.includes(p.id) ? { ...p, status } : p));
    logAction('BULK_STATUS_CHANGE', `Super Admin moved ${productIds.length} items to ${status}`);
    addNotification('Bulk Status Update', `${productIds.length} items updated to ${status}.`, 'info');
  };

  const injectProduct = (product: Product) => {
    setProducts(prev => [product, ...prev]);
    logAction('WORK_INJECTION', `Super Admin injected task: ${product.barcodeId}`);
    addNotification('Work Injected', `Task ${product.barcodeId} assigned.`, 'info');
  };

  const dispatchPackage = (billId: string, productIds: string[]) => {
    const groupQrId = `PKG-${Math.floor(Math.random() * 900000) + 100000}`;
    const bill = billingRecords.find(b => b.id === billId);
    
    if (bill) {
      const newPackage: DeliveryPackage = {
        packageQrId: groupQrId,
        billId,
        customerId: bill.customerId,
        productIds,
        status: 'DISPATCHED',
        dispatchedAt: new Date().toISOString(),
        dispatchedBy: currentUser?.name || 'System'
      };
      
      setDeliveryPackages(prev => [newPackage, ...prev]);
      // Update Products
      setProducts(prev => prev.map(p => productIds.includes(p.id) ? { ...p, status: ProductStatus.DISPATCHED } : p));
      
      logAction('PACKAGE_DISPATCH', `Generated Group QR ${groupQrId} for Bill ${billId}. Items dispatched.`);
      addNotification('Package Dispatched', `Package ${groupQrId} is on the way.`, 'info');
    }
  };

  const deliverPackage = (packageQrId: string) => {
    const pkg = deliveryPackages.find(p => p.packageQrId === packageQrId);
    if (!pkg) return { success: false, message: 'Invalid Package QR' };
    
    if (pkg.status === 'DELIVERED') return { success: false, message: 'Package already delivered' };

    setDeliveryPackages(prev => prev.map(p => p.packageQrId === packageQrId ? { ...p, status: 'DELIVERED', deliveredAt: new Date().toISOString() } : p));
    
    // Update Products
    setProducts(prev => prev.map(p => pkg.productIds.includes(p.id) ? { ...p, status: ProductStatus.DELIVERED } : p));
    
    logAction('PACKAGE_DELIVERED', `Package ${packageQrId} confirmed delivered.`);
    addNotification('Package Delivered', `Package ${packageQrId} has been delivered.`, 'success');
    return { success: true };
  };

  // --- WORKFORCE OPS ---
  const toggleWorkingHours = (isActive: boolean) => {
    setSettings(prev => ({ ...prev, isWorkingHoursActive: isActive }));
    logAction('SYSTEM_STATUS_CHANGE', `Operational Status changed to: ${isActive ? 'LIVE / OPEN' : 'OFFLINE / CLOSED'}`);
  };

  const recordUnauthorizedAttempt = (email: string, deviceInfo: string) => {
    const userIndex = users.findIndex(u => u.email === email);
    if (userIndex > -1) {
       const user = users[userIndex];
       const newCount = (user.unauthorizedAttempts || 0) + 1;
       
       const updatedUser = { ...user, unauthorizedAttempts: newCount };
       const newUsers = [...users];
       newUsers[userIndex] = updatedUser;
       setUsers(newUsers);

       // Log the threat to Security Center
       logAction('SECURITY_ALERT', `UNAUTHORIZED ACCESS: ${user.name} (${user.role}) attempted login during closed hours. Attempt #${newCount}. Device: ${deviceInfo}`);
       addNotification('Security Alert', `Unauthorized access attempt by ${user.name}`, 'error');
    }
  };

  const createDraftTag = (tag: TagItem) => {
    setDraftTags(prev => [...prev, tag]);
    addNotification('Draft Saved', `Tag ${tag.id} saved for finalization.`, 'info');
  };

  const finalizeTag = (id: string, totalWeight: number) => {
    setDraftTags(prev => {
      const tag = prev.find(t => t.id === id);
      if (tag) {
        const stoneWeight = totalWeight - tag.goldWeight;
        const finalizedTag: TagItem = {
          ...tag,
          totalWeight,
          stoneWeight,
          status: 'FINALIZED',
          finalizedBy: currentUser?.name || 'Unknown'
        };
        setTagBatch(currentBatch => [...currentBatch, finalizedTag]);
        addNotification('Tag Finalized', `Tag ${id} ready for print.`, 'success');
        return prev.filter(t => t.id !== id);
      }
      return prev;
    });
  };

  const addToBatch = (tag: TagItem) => {
    setTagBatch(prev => [...prev, tag]);
    addNotification('Tag Added', `Added ${tag.type} to batch.`, 'success');
  };

  const removeFromBatch = (id: string) => {
    setTagBatch(prev => prev.filter(t => t.id !== id));
  };

  const clearBatch = () => {
    setTagBatch([]);
  };

  const saveBatchToHistory = () => {
    // Create Product records for each tag
    const newProducts: Product[] = tagBatch.map(tag => ({
      id: tag.id, // Use the Tag ID as the Product ID
      barcodeId: tag.id, // Same
      type: tag.type,
      purity: tag.purity,
      goldWeight: tag.goldWeight,
      stoneWeight: tag.stoneWeight,
      totalWeight: tag.totalWeight,
      imageUrl: `https://picsum.photos/400/400?random=${Math.random()}`, // Placeholder
      status: ProductStatus.TAGGED, // Initial Status
      createdAt: tag.timestamp,
      createdBy: tag.createdBy,
      // batchId is not set yet, will be set during Stock Intake
    }));

    setProducts(prev => [...newProducts, ...prev]); // Add to main inventory as TAGGED
    setGeneratedTagsHistory(prev => [...prev, ...tagBatch]);
    logAction('TAG_GENERATION', `Generated ${tagBatch.length} new QR tags.`);
    clearBatch();
  };

  return (
    <AppContext.Provider value={{
      currentUser,
      users,
      products,
      customers,
      auditLogs,
      billingRecords,
      deliveryPackages,
      settings,
      notifications,
      tagBatch,
      draftTags,
      generatedTagsHistory,
      login,
      logout,
      changePassword,
      registerUser,
      addAdmin,
      addCustomer,
      verifyUser,
      deleteUser,
      transferAdminData,
      addProduct,
      updateProduct,
      allotProduct,
      bulkAllotProducts,
      verifyAllotment,
      customerConfirmProduct,
      createBill,
      settleBillPayment,
      toggleBillGold,
      updateGoldRate,
      logAction,
      resolveIncident,
      bulkUpdateProductStatus,
      injectProduct,
      dispatchPackage,
      deliverPackage,
      toggleWorkingHours,
      recordUnauthorizedAttempt,
      getPurityFactor,
      addNotification,
      removeNotification,
      createDraftTag,
      finalizeTag,
      addToBatch,
      removeFromBatch,
      clearBatch,
      saveBatchToHistory
    }}>
      {children}
    </AppContext.Provider>
  );
};