import { INITIAL_BRANCHES, INITIAL_PRODUCTS, INITIAL_TRANSACTIONS, INITIAL_USERS } from '../data/mockData';
import { Branch, Product, Transaction, User } from '../types';

const STORAGE_KEYS = {
  USERS: 'kasirpro_users_v2',
  BRANCHES: 'kasirpro_branches_v2',
  PRODUCTS: 'kasirpro_products_v2',
  TRANSACTIONS: 'kasirpro_transactions_v2',
  ACTIVE_USER_ID: 'kasirpro_active_user_id_v2',
  ACTIVE_BRANCH_ID: 'kasirpro_active_branch_id_v2',
};

export const storageService = {
  getUsers(): User[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.USERS);
      if (data) return JSON.parse(data);
    } catch (e) {
      console.error('Error loading users:', e);
    }
    this.saveUsers(INITIAL_USERS);
    return INITIAL_USERS;
  },

  saveUsers(users: User[]) {
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
  },

  addUser(user: User): User[] {
    const users = this.getUsers();
    const updated = [user, ...users];
    this.saveUsers(updated);
    return updated;
  },

  updateUser(updatedUser: User): User[] {
    const users = this.getUsers();
    const updated = users.map((u) => (u.id === updatedUser.id ? updatedUser : u));
    this.saveUsers(updated);
    return updated;
  },

  deleteUser(userId: string): User[] {
    const users = this.getUsers();
    const updated = users.filter((u) => u.id !== userId);
    this.saveUsers(updated);
    return updated;
  },

  getBranches(): Branch[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.BRANCHES);
      if (data) return JSON.parse(data);
    } catch (e) {
      console.error('Error loading branches:', e);
    }
    this.saveBranches(INITIAL_BRANCHES);
    return INITIAL_BRANCHES;
  },

  saveBranches(branches: Branch[]) {
    localStorage.setItem(STORAGE_KEYS.BRANCHES, JSON.stringify(branches));
  },

  getProducts(): Product[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.PRODUCTS);
      if (data) return JSON.parse(data);
    } catch (e) {
      console.error('Error loading products:', e);
    }
    this.saveProducts(INITIAL_PRODUCTS);
    return INITIAL_PRODUCTS;
  },

  saveProducts(products: Product[]) {
    localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(products));
  },

  getTransactions(): Transaction[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.TRANSACTIONS);
      if (data) return JSON.parse(data);
    } catch (e) {
      console.error('Error loading transactions:', e);
    }
    this.saveTransactions(INITIAL_TRANSACTIONS);
    return INITIAL_TRANSACTIONS;
  },

  saveTransactions(transactions: Transaction[]) {
    localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(transactions));
  },

  addTransaction(tx: Transaction): Transaction[] {
    const txs = this.getTransactions();
    const updated = [tx, ...txs];
    this.saveTransactions(updated);
    return updated;
  },

  getActiveUserId(): string {
    const id = localStorage.getItem(STORAGE_KEYS.ACTIVE_USER_ID);
    return id || INITIAL_USERS[0].id;
  },

  setActiveUserId(id: string) {
    localStorage.setItem(STORAGE_KEYS.ACTIVE_USER_ID, id);
  },

  getActiveBranchId(): string {
    const id = localStorage.getItem(STORAGE_KEYS.ACTIVE_BRANCH_ID);
    return id || INITIAL_BRANCHES[0].id;
  },

  setActiveBranchId(id: string) {
    localStorage.setItem(STORAGE_KEYS.ACTIVE_BRANCH_ID, id);
  },

  resetAllData() {
    localStorage.removeItem(STORAGE_KEYS.USERS);
    localStorage.removeItem(STORAGE_KEYS.BRANCHES);
    localStorage.removeItem(STORAGE_KEYS.PRODUCTS);
    localStorage.removeItem(STORAGE_KEYS.TRANSACTIONS);
    localStorage.removeItem(STORAGE_KEYS.ACTIVE_USER_ID);
    localStorage.removeItem(STORAGE_KEYS.ACTIVE_BRANCH_ID);
  },
};
