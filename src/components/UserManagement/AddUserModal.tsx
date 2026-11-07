import React, { useState, useEffect } from 'react';
import { X, Shield, User as UserIcon, Lock, Store, Phone, Check, RefreshCw, KeyRound, Sparkles } from 'lucide-react';
import { AVATAR_PRESETS, ROLE_DEFAULT_PERMISSIONS } from '../../data/mockData';
import { Branch, User, UserPermissions, UserRole } from '../../types';
import { soundManager } from '../../services/audioService';

interface AddUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (user: User) => void;
  editingUser?: User | null;
  branches: Branch[];
}

export const AddUserModal: React.FC<AddUserModalProps> = ({
  isOpen,
  onClose,
  onSave,
  editingUser,
  branches,
}) => {
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<UserRole>('cashier');
  const [roleLabel, setRoleLabel] = useState('Kasir');
  const [pin, setPin] = useState('');
  const [branchId, setBranchId] = useState('all');
  const [avatar, setAvatar] = useState(AVATAR_PRESETS[0].url);
  const [status, setStatus] = useState<'active' | 'inactive'>('active');
  const [permissions, setPermissions] = useState<UserPermissions>(ROLE_DEFAULT_PERMISSIONS.cashier);
  const [showPin, setShowPin] = useState(false);
  const [customAvatarUrl, setCustomAvatarUrl] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (editingUser) {
      setName(editingUser.name);
      setUsername(editingUser.username);
      setPhone(editingUser.phone);
      setRole(editingUser.role);
      setRoleLabel(editingUser.roleLabel);
      setPin(editingUser.pin);
      setBranchId(editingUser.branchId);
      setAvatar(editingUser.avatar);
      setStatus(editingUser.status);
      setPermissions({ ...editingUser.permissions });
    } else {
      // Default new user form
      setName('');
      setUsername('');
      setPhone('');
      setRole('cashier');
      setRoleLabel('Kasir Utama');
      setPin(Math.floor(1000 + Math.random() * 9000).toString());
      setBranchId('all');
      setAvatar(AVATAR_PRESETS[Math.floor(Math.random() * AVATAR_PRESETS.length)].url);
      setStatus('active');
      setPermissions({ ...ROLE_DEFAULT_PERMISSIONS.cashier });
      setCustomAvatarUrl('');
    }
    setErrorMsg('');
  }, [editingUser, isOpen]);

  if (!isOpen) return null;

  const handleRoleChange = (newRole: UserRole) => {
    setRole(newRole);
    const defaults = ROLE_DEFAULT_PERMISSIONS[newRole] || ROLE_DEFAULT_PERMISSIONS.cashier;
    setPermissions({ ...defaults });
    
    // Auto set default role label
    switch (newRole) {
      case 'admin':
        setRoleLabel('Super Admin / Owner');
        break;
      case 'branch_manager':
        setRoleLabel('Manajer Cabang');
        break;
      case 'cashier':
        setRoleLabel('Kasir Utama');
        break;
      case 'supervisor':
        setRoleLabel('Supervisor & Gudang');
        break;
      case 'custom':
        setRoleLabel('Staff Custom Access');
        break;
    }
  };

  const togglePermission = (key: keyof UserPermissions) => {
    setPermissions((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const generateRandomPin = () => {
    soundManager.playBeep();
    const newPin = Math.floor(1000 + Math.random() * 9000).toString();
    setPin(newPin);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMsg('Nama lengkap pengguna wajib diisi');
      soundManager.playError();
      return;
    }
    if (!username.trim()) {
      setErrorMsg('Username wajib diisi');
      soundManager.playError();
      return;
    }
    if (!pin || pin.length < 4) {
      setErrorMsg('PIN keamanan minimal 4 digit angka');
      soundManager.playError();
      return;
    }

    const finalUser: User = {
      id: editingUser ? editingUser.id : `user-${Date.now()}`,
      name: name.trim(),
      username: username.trim().toLowerCase().replace(/\s+/g, '.'),
      phone: phone.trim() || '0812' + Math.floor(10000000 + Math.random() * 90000000),
      role,
      roleLabel: roleLabel.trim() || 'Staff',
      pin,
      branchId,
      avatar: customAvatarUrl.trim() || avatar,
      status,
      permissions,
      createdAt: editingUser ? editingUser.createdAt : new Date().toISOString(),
      lastLogin: editingUser?.lastLogin,
    };

    soundManager.playCashSuccess();
    onSave(finalUser);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-neutral-200 overflow-hidden my-6">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-red-700 to-red-800 text-white">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/10 rounded-xl">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-tight">
                {editingUser ? 'Edit Akun Pengguna' : 'Tambah Akun Pengguna Baru'}
              </h2>
              <p className="text-xs text-red-100">
                Atur identitas, peran operasional, dan izin sistem kasir secara fleksibel
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
            aria-label="Tutup modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-6 max-h-[80vh] overflow-y-auto space-y-5">
          {errorMsg && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center gap-2">
              <span className="font-bold">Perhatian:</span> {errorMsg}
            </div>
          )}

          {/* Bagian 1: Informasi Dasar */}
          <div>
            <h3 className="text-xs font-bold text-neutral-800 uppercase tracking-wider mb-3 flex items-center gap-2">
              <UserIcon className="w-4 h-4 text-red-600" /> 1. Data Diri & Identitas Pengguna
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">
                  Nama Lengkap <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Rina Melati"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (!editingUser && !username) {
                      setUsername(e.target.value.toLowerCase().replace(/\s+/g, '.'));
                    }
                  }}
                  className="w-full px-3 py-2 text-sm bg-neutral-50 border border-neutral-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-red-500 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">
                  Username / ID Login <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="rina.kasir"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-neutral-50 border border-neutral-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-red-500 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1 flex items-center gap-1">
                  <Phone className="w-3 h-3 text-neutral-500" /> Nomor Telepon / WhatsApp
                </label>
                <input
                  type="tel"
                  placeholder="0812-xxxx-xxxx"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-neutral-50 border border-neutral-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-red-500 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1 flex items-center gap-1">
                  <Store className="w-3 h-3 text-neutral-500" /> Penugasan Cabang Toko
                </label>
                <select
                  value={branchId}
                  onChange={(e) => setBranchId(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-neutral-50 border border-neutral-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-red-500 focus:bg-white"
                >
                  <option value="all">Semua Cabang (Akses Global Multi-Cabang)</option>
                  {branches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name} ({b.city})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Bagian 2: Avatar & Foto Profil */}
          <div className="pt-2 border-t border-neutral-200">
            <label className="block text-xs font-semibold text-neutral-700 mb-2">
              Pilih Foto Profil / Avatar Pengguna
            </label>
            <div className="flex items-center gap-3 overflow-x-auto pb-2">
              {AVATAR_PRESETS.map((p) => {
                const isSelected = avatar === p.url && !customAvatarUrl;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => {
                      setAvatar(p.url);
                      setCustomAvatarUrl('');
                    }}
                    className={`relative shrink-0 rounded-full p-0.5 transition-all cursor-pointer ${
                      isSelected ? 'ring-3 ring-red-600 scale-105' : 'opacity-70 hover:opacity-100'
                    }`}
                    title={p.label}
                  >
                    <img
                      src={p.url}
                      alt={p.label}
                      className="w-11 h-11 rounded-full object-cover border border-neutral-200"
                    />
                    {isSelected && (
                      <div className="absolute -bottom-1 -right-1 bg-red-600 text-white rounded-full p-0.5">
                        <Check className="w-3 h-3" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Bagian 3: Role & Keamanan PIN */}
          <div className="pt-2 border-t border-neutral-200">
            <h3 className="text-xs font-bold text-neutral-800 uppercase tracking-wider mb-3 flex items-center gap-2">
              <Lock className="w-4 h-4 text-red-600" /> 2. Peran (Role) & PIN Akses Cepat
            </h3>

            {/* Role Options */}
            <label className="block text-xs font-semibold text-neutral-700 mb-2">
              Pilih Template Peran Pengguna
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
              {[
                { id: 'cashier', name: 'Kasir', desc: 'Layar Jual POS' },
                { id: 'branch_manager', name: 'Manajer Cabang', desc: 'Operasional & Laporan' },
                { id: 'supervisor', name: 'Supervisor / Gudang', desc: 'Stok & Inventaris' },
                { id: 'admin', name: 'Super Admin', desc: 'Akses Penuh Sistem' },
              ].map((r) => {
                const isActive = role === r.id;
                return (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => handleRoleChange(r.id as UserRole)}
                    className={`p-3 text-left rounded-xl border transition-all cursor-pointer ${
                      isActive
                        ? 'border-red-600 bg-red-50 text-red-900 shadow-xs'
                        : 'border-neutral-200 hover:border-neutral-300 bg-white text-neutral-700'
                    }`}
                  >
                    <div className="font-bold text-xs">{r.name}</div>
                    <div className="text-[10px] text-neutral-500 mt-0.5">{r.desc}</div>
                  </button>
                );
              })}
            </div>

            {/* Label custom role jika ingin diubah */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">
                  Label Jabatan (Tampil di Layar & Struk)
                </label>
                <input
                  type="text"
                  value={roleLabel}
                  onChange={(e) => setRoleLabel(e.target.value)}
                  placeholder="Contoh: Kasir Shift Pagi / Barista"
                  className="w-full px-3 py-2 text-sm bg-neutral-50 border border-neutral-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-red-500 focus:bg-white"
                />
              </div>

              {/* 4-digit PIN */}
              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1 flex items-center justify-between">
                  <span className="flex items-center gap-1">
                    <KeyRound className="w-3 h-3 text-neutral-500" /> PIN Akses (4-6 Digit) <span className="text-red-500">*</span>
                  </span>
                  <button
                    type="button"
                    onClick={generateRandomPin}
                    className="text-[11px] text-red-700 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <RefreshCw className="w-3 h-3" /> Acak PIN
                  </button>
                </label>
                <div className="relative">
                  <input
                    type={showPin ? 'text' : 'password'}
                    maxLength={6}
                    required
                    value={pin}
                    onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                    placeholder="Contoh: 1234"
                    className="w-full px-3 py-2 text-sm font-mono tracking-widest bg-neutral-50 border border-neutral-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-red-500 focus:bg-white"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPin(!showPin)}
                    className="absolute right-3 top-2.5 text-xs text-neutral-500 hover:text-neutral-700 cursor-pointer"
                  >
                    {showPin ? 'Sembunyikan' : 'Lihat'}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Bagian 4: Matriks Hak Akses Fleksibel (Fitur Utama Permintaan User) */}
          <div className="pt-2 border-t border-neutral-200">
            <div className="flex items-center justify-between mb-2">
              <div>
                <h3 className="text-xs font-bold text-neutral-800 uppercase tracking-wider flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-red-600" /> 3. Matriks Hak Akses Fleksibel
                </h3>
                <p className="text-[11px] text-neutral-500">
                  Admin dapat mencentang atau mencabut izin tertentu untuk pengguna ini secara spesifik
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setRole('custom');
                  setRoleLabel('Staff Custom Access');
                }}
                className="text-xs text-red-700 font-semibold hover:underline cursor-pointer"
              >
                Atur Kustom
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 bg-neutral-50 p-3 rounded-xl border border-neutral-200">
              {[
                {
                  key: 'pos_access' as keyof UserPermissions,
                  title: 'Akses Layar Kasir POS',
                  desc: 'Buka menu kasir, pilih produk, buat pesanan & cetak struk',
                },
                {
                  key: 'change_prices' as keyof UserPermissions,
                  title: 'Beri Diskon / Ubah Harga',
                  desc: 'Wewenang memberikan potongan harga langsung di kasir',
                },
                {
                  key: 'inventory_manage' as keyof UserPermissions,
                  title: 'Kelola Stok & Inventaris',
                  desc: 'Stok opname, tambah produk baru & penyesuaian barang',
                },
                {
                  key: 'view_reports' as keyof UserPermissions,
                  title: 'Akses Laporan & Omzet',
                  desc: 'Melihat ringkasan penjualan, laba kotor & arus kas harian',
                },
                {
                  key: 'delete_transactions' as keyof UserPermissions,
                  title: 'Void / Hapus Transaksi',
                  desc: 'Membatalkan invoice transaksi yang keliru/retur',
                },
                {
                  key: 'export_data' as keyof UserPermissions,
                  title: 'Export Data Excel/CSV',
                  desc: 'Unduh rekapitulasi data keuangan dan transaksi cabang',
                },
                {
                  key: 'manage_users' as keyof UserPermissions,
                  title: 'Kelola Akun Pengguna',
                  desc: 'Wewenang menambah, edit & mengubah PIN akun lain',
                },
                {
                  key: 'manage_branches' as keyof UserPermissions,
                  title: 'Pengaturan Multi-Cabang',
                  desc: 'Kelola cabang baru, nama toko & konfigurasi sistem POS',
                },
              ].map((perm) => {
                const isChecked = permissions[perm.key];
                return (
                  <label
                    key={perm.key}
                    className={`flex items-start gap-2.5 p-2 rounded-lg cursor-pointer border transition-colors ${
                      isChecked
                        ? 'bg-white border-red-200 text-neutral-900 shadow-2xs'
                        : 'bg-transparent border-transparent text-neutral-500 hover:bg-neutral-100'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => togglePermission(perm.key)}
                      className="mt-0.5 h-4 w-4 rounded-sm border-neutral-300 text-red-600 focus:ring-red-500 accent-red-600 cursor-pointer"
                    />
                    <div className="flex-1">
                      <div className="text-xs font-semibold leading-tight">{perm.title}</div>
                      <div className="text-[10px] text-neutral-500 leading-tight mt-0.5">
                        {perm.desc}
                      </div>
                    </div>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Status Akun */}
          <div className="pt-2 border-t border-neutral-200 flex items-center justify-between">
            <div>
              <div className="text-xs font-bold text-neutral-800">Status Akun Pengguna</div>
              <div className="text-[11px] text-neutral-500">
                Akun yang dinonaktifkan tidak dapat login ke sistem kasir
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setStatus('active')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                  status === 'active'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                }`}
              >
                Aktif
              </button>
              <button
                type="button"
                onClick={() => setStatus('inactive')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                  status === 'inactive'
                    ? 'bg-red-600 text-white'
                    : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                }`}
              >
                Nonaktif
              </button>
            </div>
          </div>

          {/* Modal Footer */}
          <div className="pt-4 border-t border-neutral-200 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-neutral-700 bg-neutral-100 hover:bg-neutral-200 rounded-lg transition-colors cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-bold text-white bg-red-700 hover:bg-red-800 rounded-lg shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              {editingUser ? 'Simpan Perubahan' : 'Tambahkan Pengguna'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
