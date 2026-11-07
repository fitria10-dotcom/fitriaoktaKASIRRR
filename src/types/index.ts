export type UserRole = 'admin' | 'branch_manager' | 'cashier' | 'supervisor' | 'custom';

export interface UserPermissions {
  pos_access: boolean;           // Buka Kasir POS & Transaksi
  change_prices: boolean;        // Ubah Harga / Beri Diskon
  delete_transactions: boolean;  // Batalkan / Void Transaksi
  inventory_manage: boolean;     // Kelola Stok & Tambah Produk
  view_reports: boolean;         // Akses Laporan Omzet & Laba
  export_data: boolean;          // Unduh / Export Laporan Excel
  manage_users: boolean;         // Kelola Akun & Hak Akses Pengguna
  manage_branches: boolean;      // Kelola Cabang & Pengaturan Toko
}

export interface User {
  id: string;
  name: string;
  username: string;
  phone: string;
  role: UserRole;
  roleLabel: string;
  pin: string;
  branchId: string; // 'all' or specific branchId
  avatar: string;
  status: 'active' | 'inactive';
  permissions: UserPermissions;
  createdAt: string;
  lastLogin?: string;
}

export interface Branch {
  id: string;
  name: string;
  address: string;
  city: string;
  phone: string;
  isMainBranch?: boolean;
}

export interface Product {
  id: string;
  sku: string;
  name: string;
  category: string;
  price: number;
  costPrice: number; // HPP
  stockByBranch: Record<string, number>; // branchId -> stock
  minStock: number;
  image: string;
  barcode: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
  notes?: string;
  discountPercent?: number;
}

export type PaymentMethod = 'tunai' | 'qris' | 'kartu_debit' | 'kartu_kredit' | 'transfer';

export interface Transaction {
  id: string;
  invoiceNumber: string;
  branchId: string;
  branchName: string;
  cashierId: string;
  cashierName: string;
  customerName: string;
  orderType: 'dine_in' | 'take_away' | 'delivery';
  tableNumber?: string;
  items: {
    productId: string;
    productName: string;
    price: number;
    costPrice: number;
    quantity: number;
    subtotal: number;
    notes?: string;
  }[];
  subtotal: number;
  discount: number;
  tax: number; // PB1 10%
  total: number;
  paymentMethod: PaymentMethod;
  amountPaid: number;
  change: number;
  createdAt: string;
  status: 'selesai' | 'dibatalkan';
}

export type ActiveTab = 'pos' | 'inventory' | 'reports' | 'users' | 'branches';
