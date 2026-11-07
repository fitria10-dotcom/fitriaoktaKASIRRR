import React, { useState } from 'react';
import {
  UserPlus,
  Search,
  Filter,
  Shield,
  Trash2,
  Edit3,
  KeyRound,
  Eye,
  EyeOff,
  CheckCircle2,
  XCircle,
  Building2,
  Phone,
  Calendar,
  Sparkles,
  ArrowRightLeft,
  Check,
  X,
  Info
} from 'lucide-react';
import { Branch, User } from '../../types';
import { soundManager } from '../../services/audioService';

interface UserManagementViewProps {
  users: User[];
  branches: Branch[];
  activeUser: User;
  onAddUserClick: () => void;
  onEditUserClick: (user: User) => void;
  onDeleteUser: (userId: string) => void;
  onToggleStatus: (userId: string) => void;
  onQuickSwitchToUser: (user: User) => void;
}

export const UserManagementView: React.FC<UserManagementViewProps> = ({
  users,
  branches,
  activeUser,
  onAddUserClick,
  onEditUserClick,
  onDeleteUser,
  onToggleStatus,
  onQuickSwitchToUser,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [branchFilter, setBranchFilter] = useState<string>('all');
  const [visiblePins, setVisiblePins] = useState<Record<string, boolean>>({});
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('table');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const togglePinVisibility = (userId: string) => {
    soundManager.playBeep();
    setVisiblePins((prev) => ({
      ...prev,
      [userId]: !prev[userId],
    }));
  };

  // Filtered users
  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.phone.includes(searchQuery) ||
      u.roleLabel.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesRole = roleFilter === 'all' || u.role === roleFilter;
    const matchesBranch =
      branchFilter === 'all' || u.branchId === 'all' || u.branchId === branchFilter;

    return matchesSearch && matchesRole && matchesBranch;
  });

  const getBranchName = (branchId: string) => {
    if (branchId === 'all') return 'Semua Cabang (Global)';
    const b = branches?.find((branch) => branch.id === branchId);
    return b ? b.name : branchId;
  };

  const activeCount = users?.filter((u) => u.status === 'active')?.length || 0;
  const cashierCount = users?.filter((u) => u.role === 'cashier')?.length || 0;
  const adminCount = users?.filter((u) => u.role === 'admin' || u.role === 'branch_manager')?.length || 0;

  return (
    <div className="space-y-6">
      {/* Page Header & Stats */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-neutral-200">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl md:text-2xl font-black text-neutral-900 tracking-tight">
              Manajemen Akun & Hak Akses
            </h1>
            <span className="text-[11px] bg-red-100 text-red-800 font-bold px-2 py-0.5 rounded-md">
              {users.length} Akun
            </span>
          </div>
          <p className="text-xs text-neutral-500 mt-1">
            Kelola akun kasir, manajer, dan atur matriks izin operasional sistem kasir secara fleksibel.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            soundManager.playBeep();
            onAddUserClick();
          }}
          className="px-4 py-2.5 bg-red-700 hover:bg-red-800 text-white rounded-xl text-xs font-bold shadow-xs hover:shadow-md transition-all cursor-pointer flex items-center justify-center gap-2 shrink-0"
        >
          <UserPlus className="w-4 h-4" />
          <span>Tambah Pengguna Baru</span>
        </button>
      </div>

      {/* KPI Cards / Summary Strips */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="p-4 bg-white rounded-xl border border-neutral-200 shadow-2xs">
          <div className="text-xs text-neutral-500 font-medium">Total Akun Terdaftar</div>
          <div className="text-2xl font-bold font-mono text-neutral-900 mt-1">{users.length}</div>
          <div className="text-[11px] text-neutral-400 mt-1">Pengguna multi-cabang</div>
        </div>

        <div className="p-4 bg-white rounded-xl border border-neutral-200 shadow-2xs">
          <div className="text-xs text-neutral-500 font-medium">Pengguna Aktif</div>
          <div className="text-2xl font-bold font-mono text-emerald-600 mt-1">{activeCount}</div>
          <div className="text-[11px] text-emerald-600 mt-1">Siap bertugas login</div>
        </div>

        <div className="p-4 bg-white rounded-xl border border-neutral-200 shadow-2xs">
          <div className="text-xs text-neutral-500 font-medium">Front-Office / Kasir</div>
          <div className="text-2xl font-bold font-mono text-blue-600 mt-1">{cashierCount}</div>
          <div className="text-[11px] text-neutral-400 mt-1">Layar POS Kasir</div>
        </div>

        <div className="p-4 bg-white rounded-xl border border-neutral-200 shadow-2xs">
          <div className="text-xs text-neutral-500 font-medium">Admin & Manajer</div>
          <div className="text-2xl font-bold font-mono text-purple-600 mt-1">{adminCount}</div>
          <div className="text-[11px] text-neutral-400 mt-1">Hak akses manajemen</div>
        </div>
      </div>

      {/* Admin Notice on Flexibility */}
      <div className="p-4 bg-amber-50/80 border border-amber-200 rounded-xl flex items-start gap-3">
        <Info className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
        <div className="text-xs text-amber-900">
          <span className="font-bold">Fleksibilitas Hak Akses KasirPro:</span> Anda dapat memberikan peran default (Kasir, Manajer, Spv) atau mengaktifkan mode <span className="font-semibold underline">Custom Permission</span> untuk mengatur izin individual seperti diskon manual, void transaksi, atau akses laporan per karyawan.
        </div>
      </div>

      {/* Filters & Search Toolbar */}
      <div className="bg-white p-3.5 rounded-xl border border-neutral-200 shadow-2xs space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Search Bar */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Cari nama, username, nomor HP, atau jabatan..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-neutral-50 border border-neutral-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-red-500 focus:bg-white"
            />
          </div>

          {/* Role Filter */}
          <div className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-neutral-500" />
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="px-2.5 py-1.5 text-xs bg-neutral-50 border border-neutral-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-red-500"
            >
              <option value="all">Semua Peran (Role)</option>
              <option value="admin">Super Admin / Owner</option>
              <option value="branch_manager">Manajer Cabang</option>
              <option value="cashier">Kasir</option>
              <option value="supervisor">Supervisor & Gudang</option>
              <option value="custom">Kustom</option>
            </select>

            {/* Branch Filter */}
            <select
              value={branchFilter}
              onChange={(e) => setBranchFilter(e.target.value)}
              className="px-2.5 py-1.5 text-xs bg-neutral-50 border border-neutral-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-red-500"
            >
              <option value="all">Semua Cabang Penugasan</option>
              {branches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>

            {/* View Mode Toggle */}
            <div className="hidden sm:flex items-center gap-1 border-l border-neutral-200 pl-2">
              <button
                type="button"
                onClick={() => setViewMode('table')}
                className={`px-2.5 py-1 text-xs rounded-md transition-colors cursor-pointer ${
                  viewMode === 'table'
                    ? 'bg-neutral-800 text-white font-bold'
                    : 'text-neutral-600 hover:bg-neutral-100'
                }`}
              >
                Tabel
              </button>
              <button
                type="button"
                onClick={() => setViewMode('cards')}
                className={`px-2.5 py-1 text-xs rounded-md transition-colors cursor-pointer ${
                  viewMode === 'cards'
                    ? 'bg-neutral-800 text-white font-bold'
                    : 'text-neutral-600 hover:bg-neutral-100'
                }`}
              >
                Kartu
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Users Content */}
      {filteredUsers.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-2xl border border-neutral-200 p-6">
          <div className="w-12 h-12 bg-neutral-100 text-neutral-400 rounded-full flex items-center justify-center mx-auto mb-3">
            <Search className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-neutral-800">Tidak ada akun pengguna ditemukan</h3>
          <p className="text-xs text-neutral-500 mt-1 max-w-sm mx-auto">
            Coba ubah kata kunci pencarian atau reset filter role dan cabang.
          </p>
          <button
            type="button"
            onClick={() => {
              setSearchQuery('');
              setRoleFilter('all');
              setBranchFilter('all');
            }}
            className="mt-3 px-3 py-1.5 text-xs font-semibold text-red-700 bg-red-50 hover:bg-red-100 rounded-lg transition-colors cursor-pointer"
          >
            Reset Filter
          </button>
        </div>
      ) : viewMode === 'table' ? (
        /* Table View */
        <div className="bg-white rounded-xl border border-neutral-200 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-neutral-50/80 border-b border-neutral-200 text-neutral-500 font-semibold uppercase tracking-wider">
                  <th className="py-3 px-4">Pengguna</th>
                  <th className="py-3 px-3">Peran & Cabang</th>
                  <th className="py-3 px-3">PIN Akses</th>
                  <th className="py-3 px-3">Matriks Izin Sistem</th>
                  <th className="py-3 px-3 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200">
                {filteredUsers.map((u) => {
                  const isCurrentUser = u.id === activeUser.id;
                  const isPinVisible = !!visiblePins[u.id];

                  return (
                    <tr
                      key={u.id}
                      className={`hover:bg-neutral-50/60 transition-colors ${
                        isCurrentUser ? 'bg-red-50/30' : ''
                      }`}
                    >
                      {/* Pengguna Column */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="relative">
                            <img
                              src={u.avatar}
                              alt={u.name}
                              className="w-10 h-10 rounded-full object-cover border border-neutral-200"
                            />
                            {isCurrentUser && (
                              <span
                                className="absolute -bottom-1 -right-1 w-3 h-3 bg-red-600 border-2 border-white rounded-full"
                                title="Akun aktif saat ini"
                              />
                            )}
                          </div>
                          <div>
                            <div className="font-bold text-neutral-900 flex items-center gap-1.5">
                              {u.name}
                              {isCurrentUser && (
                                <span className="text-[10px] bg-red-100 text-red-800 font-semibold px-1.5 py-0.2 rounded-sm">
                                  Anda
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-neutral-500 font-mono">@{u.username}</div>
                            <div className="text-[11px] text-neutral-400 flex items-center gap-1 mt-0.5">
                              <Phone className="w-2.5 h-2.5" /> {u.phone}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Peran & Cabang */}
                      <td className="py-3 px-3">
                        <div className="font-semibold text-neutral-800">{u.roleLabel}</div>
                        <div className="text-[11px] text-neutral-500 flex items-center gap-1 mt-0.5">
                          <Building2 className="w-3 h-3 text-neutral-400" />
                          <span className="truncate max-w-[150px]">{getBranchName(u.branchId)}</span>
                        </div>
                        <div className="text-[10px] text-neutral-400 uppercase mt-0.5 font-mono">
                          {u.role}
                        </div>
                      </td>

                      {/* PIN Akses */}
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold tracking-widest text-neutral-800 bg-neutral-100 px-2 py-1 rounded-md border border-neutral-200">
                            {isPinVisible ? u.pin : '••••'}
                          </span>
                          <button
                            type="button"
                            onClick={() => togglePinVisibility(u.id)}
                            className="p-1 text-neutral-400 hover:text-neutral-700 transition-colors cursor-pointer"
                            title={isPinVisible ? 'Sembunyikan PIN' : 'Lihat PIN'}
                          >
                            {isPinVisible ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </td>

                      {/* Matriks Izin Sistem */}
                      <td className="py-3 px-3">
                        <div className="flex flex-wrap gap-1 max-w-xs">
                          {u.permissions.pos_access && (
                            <span className="text-[10px] bg-neutral-100 text-neutral-700 px-1.5 py-0.5 rounded-sm">
                              POS
                            </span>
                          )}
                          {u.permissions.change_prices && (
                            <span className="text-[10px] bg-amber-50 text-amber-800 px-1.5 py-0.5 rounded-sm">
                              Diskon
                            </span>
                          )}
                          {u.permissions.delete_transactions && (
                            <span className="text-[10px] bg-red-50 text-red-800 px-1.5 py-0.5 rounded-sm">
                              Void
                            </span>
                          )}
                          {u.permissions.inventory_manage && (
                            <span className="text-[10px] bg-blue-50 text-blue-800 px-1.5 py-0.5 rounded-sm">
                              Stok
                            </span>
                          )}
                          {u.permissions.view_reports && (
                            <span className="text-[10px] bg-purple-50 text-purple-800 px-1.5 py-0.5 rounded-sm">
                              Laporan
                            </span>
                          )}
                          {u.permissions.manage_users && (
                            <span className="text-[10px] bg-rose-50 text-rose-800 px-1.5 py-0.5 rounded-sm">
                              Kelola User
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-3 px-3 text-center">
                        <button
                          type="button"
                          onClick={() => {
                            soundManager.playBeep();
                            onToggleStatus(u.id);
                          }}
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold transition-colors cursor-pointer ${
                            u.status === 'active'
                              ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                              : 'bg-neutral-100 text-neutral-500 hover:bg-neutral-200'
                          }`}
                          title="Klik untuk ubah status aktif/nonaktif"
                        >
                          {u.status === 'active' ? (
                            <>
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              <span>Aktif</span>
                            </>
                          ) : (
                            <>
                              <XCircle className="w-3 h-3 text-neutral-400" />
                              <span>Nonaktif</span>
                            </>
                          )}
                        </button>
                      </td>

                      {/* Aksi */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {/* Quick Switch to user */}
                          <button
                            type="button"
                            onClick={() => {
                              soundManager.playCashSuccess();
                              onQuickSwitchToUser(u);
                            }}
                            className="p-1.5 text-neutral-600 hover:text-red-700 hover:bg-neutral-100 rounded-lg transition-colors cursor-pointer"
                            title={`Masuk & Bertugas Sebagai ${u.name}`}
                          >
                            <ArrowRightLeft className="w-4 h-4" />
                          </button>

                          {/* Edit User */}
                          <button
                            type="button"
                            onClick={() => {
                              soundManager.playBeep();
                              onEditUserClick(u);
                            }}
                            className="p-1.5 text-neutral-600 hover:text-blue-700 hover:bg-neutral-100 rounded-lg transition-colors cursor-pointer"
                            title="Edit Data & Hak Akses"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>

                          {/* Delete User */}
                          {deleteConfirmId === u.id ? (
                            <div className="flex items-center gap-1 bg-red-50 p-1 rounded-lg">
                              <button
                                type="button"
                                onClick={() => {
                                  soundManager.playError();
                                  onDeleteUser(u.id);
                                  setDeleteConfirmId(null);
                                }}
                                className="p-1 bg-red-600 text-white rounded-md hover:bg-red-700 cursor-pointer"
                                title="Yakin Hapus"
                              >
                                <Check className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => setDeleteConfirmId(null)}
                                className="p-1 bg-neutral-200 text-neutral-700 rounded-md hover:bg-neutral-300 cursor-pointer"
                                title="Batal"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              disabled={users.length <= 1 || isCurrentUser}
                              onClick={() => setDeleteConfirmId(u.id)}
                              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                                isCurrentUser || users.length <= 1
                                  ? 'text-neutral-300 cursor-not-allowed'
                                  : 'text-neutral-400 hover:text-red-600 hover:bg-red-50'
                              }`}
                              title={
                                isCurrentUser
                                  ? 'Tidak dapat menghapus akun yang sedang aktif'
                                  : 'Hapus Akun Pengguna'
                              }
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Cards View */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredUsers.map((u) => {
            const isCurrentUser = u.id === activeUser.id;
            const isPinVisible = !!visiblePins[u.id];

            return (
              <div
                key={u.id}
                className={`bg-white rounded-2xl border transition-all p-5 shadow-2xs relative flex flex-col justify-between ${
                  isCurrentUser
                    ? 'border-red-400 ring-1 ring-red-300'
                    : 'border-neutral-200 hover:border-neutral-300'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <img
                          src={u.avatar}
                          alt={u.name}
                          className="w-12 h-12 rounded-full object-cover border border-neutral-200"
                        />
                        {isCurrentUser && (
                          <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-red-600 border-2 border-white rounded-full" />
                        )}
                      </div>
                      <div>
                        <h3 className="font-bold text-sm text-neutral-900 leading-tight">
                          {u.name}
                        </h3>
                        <p className="text-[11px] text-neutral-500 font-mono">@{u.username}</p>
                        <span className="inline-block mt-1 text-[10px] font-semibold text-red-800 bg-red-50 px-2 py-0.5 rounded-sm">
                          {u.roleLabel}
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => onToggleStatus(u.id)}
                      className={`text-[10px] px-2 py-0.5 rounded-full font-bold transition-colors cursor-pointer ${
                        u.status === 'active'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-neutral-100 text-neutral-500'
                      }`}
                    >
                      {u.status === 'active' ? 'Aktif' : 'Nonaktif'}
                    </button>
                  </div>

                  {/* Branch & Contact */}
                  <div className="mt-4 pt-3 border-t border-neutral-100 space-y-1.5 text-xs text-neutral-600">
                    <div className="flex items-center gap-2">
                      <Building2 className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                      <span className="truncate">{getBranchName(u.branchId)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                      <span>{u.phone}</span>
                    </div>
                    <div className="flex items-center justify-between pt-1">
                      <span className="text-[11px] text-neutral-400 flex items-center gap-1">
                        <KeyRound className="w-3 h-3" /> PIN Cepat:
                      </span>
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono text-xs font-bold bg-neutral-100 px-2 py-0.5 rounded-sm">
                          {isPinVisible ? u.pin : '••••'}
                        </span>
                        <button
                          type="button"
                          onClick={() => togglePinVisibility(u.id)}
                          className="text-neutral-400 hover:text-neutral-700 cursor-pointer"
                        >
                          {isPinVisible ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Permissions Summary Badges */}
                  <div className="mt-3 pt-3 border-t border-neutral-100">
                    <div className="text-[10px] text-neutral-400 font-semibold uppercase mb-1.5">
                      Izin Akses Sistem:
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {u.permissions.pos_access && (
                        <span className="text-[10px] bg-neutral-100 text-neutral-700 px-1.5 py-0.5 rounded-sm">
                          POS Kasir
                        </span>
                      )}
                      {u.permissions.change_prices && (
                        <span className="text-[10px] bg-amber-50 text-amber-800 px-1.5 py-0.5 rounded-sm">
                          Diskon
                        </span>
                      )}
                      {u.permissions.inventory_manage && (
                        <span className="text-[10px] bg-blue-50 text-blue-800 px-1.5 py-0.5 rounded-sm">
                          Stok
                        </span>
                      )}
                      {u.permissions.view_reports && (
                        <span className="text-[10px] bg-purple-50 text-purple-800 px-1.5 py-0.5 rounded-sm">
                          Laporan
                        </span>
                      )}
                      {u.permissions.manage_users && (
                        <span className="text-[10px] bg-rose-50 text-rose-800 px-1.5 py-0.5 rounded-sm">
                          Admin Pengguna
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Card Actions */}
                <div className="mt-4 pt-3 border-t border-neutral-100 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => onQuickSwitchToUser(u)}
                    className="text-xs font-bold text-red-700 hover:text-red-900 flex items-center gap-1 cursor-pointer"
                  >
                    <ArrowRightLeft className="w-3.5 h-3.5" /> Ganti Akun Ini
                  </button>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => onEditUserClick(u)}
                      className="p-1.5 text-neutral-600 hover:text-blue-700 hover:bg-neutral-100 rounded-lg cursor-pointer"
                      title="Edit Akun"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    {!isCurrentUser && users.length > 1 && (
                      <button
                        type="button"
                        onClick={() => onDeleteUser(u.id)}
                        className="p-1.5 text-neutral-400 hover:text-red-600 hover:bg-red-50 rounded-lg cursor-pointer"
                        title="Hapus Akun"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
