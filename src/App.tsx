/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { POSView } from './components/POS/POSView';
import { InventoryView } from './components/Inventory/InventoryView';
import { ReportsView } from './components/Reports/ReportsView';
import { UserManagementView } from './components/UserManagement/UserManagementView';
import { AddUserModal } from './components/UserManagement/AddUserModal';
import { UserSwitchModal } from './components/UserManagement/UserSwitchModal';
import { BranchManagementView } from './components/Branches/BranchManagementView';
import { storageService } from './services/storageService';
import { ActiveTab, Branch, Product, Transaction, User } from './types';
import { CheckCircle2, ShieldCheck, X } from 'lucide-react';
import { soundManager } from './services/audioService';

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('pos');
  const [users, setUsers] = useState<User[]>(() => storageService.getUsers());
  const [activeUserId, setActiveUserId] = useState<string>(() => storageService.getActiveUserId());
  const [branches, setBranches] = useState<Branch[]>(() => storageService.getBranches());
  const [activeBranchId, setActiveBranchId] = useState<string>(() => storageService.getActiveBranchId());
  const [products, setProducts] = useState<Product[]>(() => storageService.getProducts());
  const [transactions, setTransactions] = useState<Transaction[]>(() => storageService.getTransactions());

  // Modals
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [isUserSwitchModalOpen, setIsUserSwitchModalOpen] = useState(false);

  // Toast notification
  const [toastMessage, setToastMessage] = useState<{ title: string; desc: string } | null>(null);

  const showToast = (title: string, desc: string) => {
    setToastMessage({ title, desc });
    setTimeout(() => {
      setToastMessage(null);
    }, 4500);
  };

  const activeUser: User =
    users.find((u) => u.id === activeUserId) || users[0] || {
      id: 'default',
      name: 'Admin KasirPro',
      username: 'admin',
      phone: '081234567890',
      role: 'admin',
      roleLabel: 'Super Admin',
      pin: '9999',
      branchId: 'all',
      avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=150&h=150&q=80',
      status: 'active',
      permissions: {
        pos_access: true,
        change_prices: true,
        delete_transactions: true,
        inventory_manage: true,
        view_reports: true,
        export_data: true,
        manage_users: true,
        manage_branches: true,
      },
      createdAt: new Date().toISOString(),
    };

  const activeBranch: Branch =
    branches.find((b) => b.id === activeBranchId) || branches[0] || {
      id: 'b1',
      name: 'Cabang Pusat',
      address: 'Jl. Utama No. 1',
      city: 'Jakarta',
      phone: '021-00000',
    };

  // User Management Handlers
  const handleOpenAddUser = () => {
    setEditingUser(null);
    setIsAddUserModalOpen(true);
  };

  const handleOpenEditUser = (user: User) => {
    setEditingUser(user);
    setIsAddUserModalOpen(true);
  };

  const handleSaveUser = (user: User) => {
    let updatedUsers: User[];
    if (editingUser) {
      updatedUsers = storageService.updateUser(user);
      showToast(
        'Akun Pengguna Diperbarui',
        `Perubahan hak akses dan data ${user.name} berhasil disimpan.`
      );
    } else {
      updatedUsers = storageService.addUser(user);
      showToast(
        'Akun Pengguna Baru Ditambahkan!',
        `${user.name} (${user.roleLabel}) telah berhasil didaftarkan dengan PIN: ${user.pin}.`
      );
    }
    setUsers(updatedUsers);
    setIsAddUserModalOpen(false);
    setEditingUser(null);
  };

  const handleDeleteUser = (userId: string) => {
    const userToDelete = users.find((u) => u.id === userId);
    const updated = storageService.deleteUser(userId);
    setUsers(updated);
    showToast(
      'Akun Dihapus',
      `Akun ${userToDelete?.name || 'Pengguna'} telah dihapus dari sistem.`
    );
  };

  const handleToggleUserStatus = (userId: string) => {
    const targetUser = users.find((u) => u.id === userId);
    if (!targetUser) return;
    const newStatus = targetUser.status === 'active' ? 'inactive' : 'active';
    const updatedUser: User = { ...targetUser, status: newStatus };
    const updated = storageService.updateUser(updatedUser);
    setUsers(updated);
    showToast(
      `Status Akun ${newStatus === 'active' ? 'Diaktifkan' : 'Dinonaktifkan'}`,
      `Pengguna ${targetUser.name} kini berstatus ${newStatus === 'active' ? 'Aktif' : 'Nonaktif'}.`
    );
  };

  const handleSwitchUser = (user: User) => {
    setActiveUserId(user.id);
    storageService.setActiveUserId(user.id);
    showToast(
      `Login Berhasil: ${user.name}`,
      `Beralih ke akun ${user.roleLabel}. Hak akses sistem disesuaikan otomatis.`
    );
  };

  const handleSelectBranch = (branchId: string) => {
    setActiveBranchId(branchId);
    storageService.setActiveBranchId(branchId);
    const branchObj = branches.find((b) => b.id === branchId);
    if (branchObj) {
      showToast('Cabang Toko Berpindah', `Sekarang mengelola data untuk: ${branchObj.name}.`);
    }
  };

  const handleCompleteTransaction = (tx: Transaction, updatedProducts: Product[]) => {
    const updatedTxs = storageService.addTransaction(tx);
    storageService.saveProducts(updatedProducts);
    setTransactions(updatedTxs);
    setProducts(updatedProducts);
    showToast(
      'Transaksi Berhasil!',
      `Invoice ${tx.invoiceNumber} tercatat. Total: Rp ${tx.total.toLocaleString('id-ID')}`
    );
  };

  const handleUpdateProducts = (updatedProducts: Product[]) => {
    storageService.saveProducts(updatedProducts);
    setProducts(updatedProducts);
    showToast('Data Inventaris Diperbarui', 'Stok dan katalog berhasil disinkronkan.');
  };

  const handleVoidTransaction = (txId: string) => {
    const updated = transactions.map((t) =>
      t.id === txId ? ({ ...t, status: 'dibatalkan' } as Transaction) : t
    );
    storageService.saveTransactions(updated);
    setTransactions(updated);
    showToast('Transaksi Dibatalkan (Void)', `Transaksi ${txId} telah di-void.`);
  };

  const handleAddBranch = (branch: Branch) => {
    const updated = [branch, ...branches];
    storageService.saveBranches(updated);
    setBranches(updated);
    showToast('Cabang Baru Ditambahkan', `Cabang ${branch.name} telah didaftarkan.`);
  };

  const handleResetAllData = () => {
    storageService.resetAllData();
    const loadedUsers = storageService.getUsers();
    const loadedBranches = storageService.getBranches();
    const loadedProducts = storageService.getProducts();
    const loadedTransactions = storageService.getTransactions();
    setUsers(loadedUsers);
    setBranches(loadedBranches);
    setProducts(loadedProducts);
    setTransactions(loadedTransactions);
    setActiveUserId(loadedUsers[0].id);
    setActiveBranchId(loadedBranches[0].id);
    showToast('Data Direset', 'Kondisi sistem telah dikembalikan ke data awal.');
  };

  return (
    <div className="min-h-screen bg-neutral-100 flex flex-col font-sans text-neutral-900 selection:bg-red-500 selection:text-white">
      {/* Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        activeUser={activeUser}
        branches={branches}
        activeBranchId={activeBranchId}
        onSelectBranch={handleSelectBranch}
        onOpenUserSwitch={() => setIsUserSwitchModalOpen(true)}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 pb-16">
        {activeTab === 'pos' && (
          <POSView
            products={products}
            activeBranch={activeBranch}
            activeUser={activeUser}
            onCompleteTransaction={handleCompleteTransaction}
          />
        )}

        {activeTab === 'inventory' && (
          <InventoryView
            products={products}
            branches={branches}
            activeBranch={activeBranch}
            activeUser={activeUser}
            onUpdateProducts={handleUpdateProducts}
          />
        )}

        {activeTab === 'reports' && (
          <ReportsView
            transactions={transactions}
            branches={branches}
            activeBranch={activeBranch}
            activeUser={activeUser}
            onVoidTransaction={handleVoidTransaction}
          />
        )}

        {activeTab === 'users' && (
          <UserManagementView
            users={users}
            branches={branches}
            activeUser={activeUser}
            onAddUserClick={handleOpenAddUser}
            onEditUserClick={handleOpenEditUser}
            onDeleteUser={handleDeleteUser}
            onToggleStatus={handleToggleUserStatus}
            onQuickSwitchToUser={handleSwitchUser}
          />
        )}

        {activeTab === 'branches' && (
          <BranchManagementView
            branches={branches}
            activeBranchId={activeBranchId}
            activeUser={activeUser}
            onSelectBranch={handleSelectBranch}
            onAddBranch={handleAddBranch}
            onResetAllData={handleResetAllData}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-neutral-200 bg-white py-4 px-6 text-center text-xs text-neutral-500 select-none">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="font-bold text-neutral-800">KasirPro Multi-Cabang</span>
            <span>·</span>
            <span>Sistem Kasir &amp; Manajemen Pengguna Fleksibel</span>
          </div>
          <div className="text-[11px] text-neutral-400">
            Fitria Oktafiani POS Enterprise Edition · {new Date().getFullYear()}
          </div>
        </div>
      </footer>

      {/* Add / Edit User Modal */}
      <AddUserModal
        isOpen={isAddUserModalOpen}
        onClose={() => {
          setIsAddUserModalOpen(false);
          setEditingUser(null);
        }}
        onSave={handleSaveUser}
        editingUser={editingUser}
        branches={branches}
      />

      {/* Cashier PIN Switch Modal */}
      <UserSwitchModal
        isOpen={isUserSwitchModalOpen}
        onClose={() => setIsUserSwitchModalOpen(false)}
        users={users}
        activeUser={activeUser}
        onSwitchUser={handleSwitchUser}
      />

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 flex items-start gap-3 p-4 bg-neutral-900 text-white rounded-2xl shadow-xl border border-neutral-700 max-w-sm animate-bounce-subtle">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
          <div className="flex-1">
            <div className="text-xs font-bold text-white">{toastMessage.title}</div>
            <div className="text-[11px] text-neutral-300 mt-0.5 leading-snug">
              {toastMessage.desc}
            </div>
          </div>
          <button
            type="button"
            onClick={() => setToastMessage(null)}
            className="p-1 text-neutral-400 hover:text-white cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}
