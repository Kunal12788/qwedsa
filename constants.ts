
import { User, UserRole, Customer, Product, ProductStatus } from './types';

export const MOCK_USERS: User[] = [
  { id: 'u1', name: 'Alice Stock', email: 'stock@aurum.com', role: UserRole.STOCK_INTAKE_ADMIN, verified: true, joinedAt: new Date().toISOString() },
  { id: 'u2', name: 'Bob Allot', email: 'allot@aurum.com', role: UserRole.ALLOTMENT_ADMIN, verified: true, joinedAt: new Date().toISOString() },
  { id: 'u3', name: 'Charlie Bill', email: 'bill@aurum.com', role: UserRole.BILLING_ADMIN, verified: true, joinedAt: new Date().toISOString() },
  { id: 'u4', name: 'Grace Delivery', email: 'delivery@aurum.com', role: UserRole.DELIVERY_ADMIN, verified: true, joinedAt: new Date().toISOString() }, 
  { id: 'u5', name: 'Eve Super', email: 'super@aurum.com', role: UserRole.SUPER_ADMIN, verified: true, joinedAt: new Date().toISOString() },
  { id: 'u6', name: 'Frank Customer', email: 'cust@gmail.com', role: UserRole.CUSTOMER, verified: true, joinedAt: new Date().toISOString() },
  { id: 'u7', name: 'Quinn QR', email: 'qr@aurum.com', role: UserRole.QR_MANAGER, verified: true, joinedAt: new Date().toISOString() },
  { id: 'u8', name: 'Tanya Entry', email: 'entry@aurum.com', role: UserRole.TAG_ENTRY_ADMIN, verified: true, joinedAt: new Date().toISOString() },
  { id: 'u9', name: 'Frank Finalizer', email: 'final@aurum.com', role: UserRole.TAG_FINALIZER_ADMIN, verified: true, joinedAt: new Date().toISOString() },
];

export const MOCK_CUSTOMERS: Customer[] = [
  { 
    id: 'u6', // Matches Frank's User ID
    uniqueName: 'CUST-001', 
    legalName: 'Frank Sinatra', 
    email: 'cust@gmail.com', 
    phone: '+1 212-555-0199', 
    address: '123 Beverly Hills',
    city: 'Los Angeles',
    status: 'ACTIVE',
    joinedAt: new Date().toISOString(),
    totalGoldInventory: 0 
  },
  { 
    id: 'c2', 
    uniqueName: 'CUST-002', 
    legalName: 'Lady Gaga', 
    email: 'gaga@gmail.com', 
    phone: '+1 212-555-0123', 
    address: 'Park Avenue Penthouse',
    city: 'New York',
    status: 'ACTIVE',
    joinedAt: new Date().toISOString(),
    totalGoldInventory: 50 
  },
];

export const INITIAL_PRODUCTS: Product[] = [
  {
    id: 'p1',
    barcodeId: '123456789',
    type: 'Necklace',
    purity: '22k',
    goldWeight: 25.5,
    stoneWeight: 1.2,
    totalWeight: 26.7,
    imageUrl: 'https://picsum.photos/400/400?random=1',
    status: ProductStatus.IN_ADMIN_STOCK,
    createdAt: new Date().toISOString()
  }
];

export const JEWELLERY_TYPES = ['Necklace', 'Ring', 'Earrings', 'Bangle', 'Bracelet', 'Pendant', 'Chain'];
export const PURITY_TYPES = ['24k', '22k', '18k', '14k'];
