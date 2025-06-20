import type { Timestamp } from 'firebase/firestore';

export interface UserProfile {
  uid: string;
  email: string | null;
  displayName?: string | null;
  role: 'admin' | 'staff';
  storeId: string;
  storeName?: string; // For admin, the name of the store they manage
}

export interface Product {
  id?: string;
  name: string;
  price: number;
  category?: string;
  imageUrl?: string;
  storeId: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface SaleItem {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface Sale {
  id?: string;
  storeId: string;
  staffId: string;
  staffName?: string;
  items: SaleItem[];
  totalAmount: number;
  timestamp: Timestamp;
}

export interface Store {
  id?: string;
  name: string;
  adminUid: string;
  createdAt: Timestamp;
}
