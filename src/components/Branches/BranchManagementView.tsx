import React, { useState } from 'react';
import {
  Building2,
  Plus,
  MapPin,
  Phone,
  CheckCircle2,
  RefreshCw,
  Sliders,
  ShieldAlert,
  X
} from 'lucide-react';
import { Branch, User } from '../../types';
import { soundManager } from '../../services/audioService';

interface BranchManagementViewProps {
  branches: Branch[];
  activeBranchId: string;
  activeUser: User;
  onSelectBranch: (branchId: string) => void;
  onAddBranch: (branch: Branch) => void;
  onResetAllData: () => void;
}

export const BranchManagementView: React.FC<BranchManagementViewProps> = ({
  branches,
  activeBranchId,
  activeUser,
  onSelectBranch,
  onAddBranch,
  onResetAllData,
}) => {
  const [isAddBranchOpen, setIsAddBranchOpen] = useState(false);
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [phone, setPhone] = useState('');
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const hasBranchPermission = activeUser.permissions.manage_branches;

  const handleCreateBranch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    soundManager.playCashSuccess();
    const newBranch: Branch = {
      id: `b-${Date.now()}`,
      name: name.trim(),
      address: address.trim() || 'Jl. Raya Utama No. 10',
      city: city.trim() || 'Jakarta',
      phone: phone.trim() || '021-5551234',
      isMainBranch: false,
    };

    onAddBranch(newBranch);
    setIsAddBranchOpen(false);
    setName('');
    setAddress('');
    setCity('');
    setPhone('');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-neutral-200">
        <div>
          <h1 className="text-xl md:text-2xl font-black text-neutral-900 tracking-tight">
            Multi-Cabang &amp; Pengaturan Toko
          </h1>
          <p className="text-xs text-neutral-500 mt-1">
            Kelola cabang toko aktif, alamat operasional, dan konfigurasi sistem KasirPro.
          </p>
        </div>

        {hasBranchPermission && (
          <button
            type="button"
            onClick={() => {
              soundManager.playBeep();
              setIsAddBranchOpen(true);
            }}
            className="px-4 py-2.5 bg-red-700 hover:bg-red-800 text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer flex items-center justify-center gap-2 shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Cabang Baru</span>
          </button>
        )}
      </div>

      {/* Branch Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {branches.map((b) => {
          const isActive = b.id === activeBranchId;
          return (
            <div
              key={b.id}
              className={`bg-white rounded-2xl border p-5 shadow-2xs relative flex flex-col justify-between transition-all ${
                isActive ? 'border-red-500 ring-2 ring-red-100' : 'border-neutral-200'
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div className="p-2.5 bg-red-50 text-red-700 rounded-xl">
                    <Building2 className="w-5 h-5" />
                  </div>
                  {isActive && (
                    <span className="text-[10px] bg-red-100 text-red-800 font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Cabang Aktif
                    </span>
                  )}
                </div>

                <h3 className="font-bold text-sm text-neutral-900 mt-3">{b.name}</h3>
                <div className="text-xs text-neutral-500 flex items-start gap-1.5 mt-2">
                  <MapPin className="w-3.5 h-3.5 text-neutral-400 shrink-0 mt-0.5" />
                  <span>{b.address}</span>
                </div>
                <div className="text-xs text-neutral-500 flex items-center gap-1.5 mt-1.5">
                  <Phone className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                  <span>{b.phone}</span>
                </div>
              </div>

              <div className="mt-5 pt-3 border-t border-neutral-100">
                <button
                  type="button"
                  onClick={() => {
                    soundManager.playBeep();
                    onSelectBranch(b.id);
                  }}
                  className={`w-full py-2 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
                    isActive
                      ? 'bg-neutral-100 text-neutral-400 cursor-default'
                      : 'bg-neutral-900 hover:bg-neutral-800 text-white'
                  }`}
                >
                  {isActive ? 'Sedang Dipilih' : 'Ganti ke Cabang Ini'}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* System Settings & Reset Data Card */}
      <div className="bg-white rounded-2xl border border-neutral-200 p-6 shadow-2xs space-y-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-neutral-100 text-neutral-700 rounded-lg">
            <Sliders className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-neutral-900">Pemeliharaan &amp; Data Demo KasirPro</h3>
            <p className="text-xs text-neutral-500">
              Data transaksi, pengguna baru, dan stok tersimpan di browser secara lokal.
            </p>
          </div>
        </div>

        <div className="pt-2 border-t border-neutral-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="text-xs text-neutral-600">
            Perlu mengembalikan ke kondisi awal contoh dengan data bawaan Fitria Oktafiani?
          </div>

          {showResetConfirm ? (
            <div className="flex items-center gap-2">
              <span className="text-xs text-red-600 font-semibold">Yakin reset semua?</span>
              <button
                type="button"
                onClick={() => {
                  soundManager.playError();
                  onResetAllData();
                  setShowResetConfirm(false);
                }}
                className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-lg cursor-pointer"
              >
                Ya, Reset
              </button>
              <button
                type="button"
                onClick={() => setShowResetConfirm(false)}
                className="px-3 py-1.5 bg-neutral-200 text-neutral-700 text-xs font-semibold rounded-lg cursor-pointer"
              >
                Batal
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setShowResetConfirm(true)}
              className="px-3.5 py-1.5 bg-neutral-100 hover:bg-red-50 text-neutral-700 hover:text-red-700 text-xs font-semibold rounded-lg border border-neutral-200 transition-colors cursor-pointer flex items-center gap-1.5 self-start sm:self-auto"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Reset Data Demo Bawaan</span>
            </button>
          )}
        </div>
      </div>

      {/* Add Branch Modal */}
      {isAddBranchOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs">
          <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-neutral-200 overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 bg-neutral-900 text-white">
              <h3 className="text-sm font-bold">Tambah Cabang Toko Baru</h3>
              <button
                type="button"
                onClick={() => setIsAddBranchOpen(false)}
                className="p-1 text-neutral-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateBranch} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">
                  Nama Cabang Toko
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Cabang Senopati Jakarta Selatan"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-neutral-50 border border-neutral-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">Kota</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Jakarta Selatan"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-neutral-50 border border-neutral-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">
                  Alamat Lengkap
                </label>
                <textarea
                  rows={2}
                  placeholder="Jl. Senopati No. 45..."
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-neutral-50 border border-neutral-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">
                  Nomor Telepon
                </label>
                <input
                  type="text"
                  placeholder="021-..."
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-neutral-50 border border-neutral-300 rounded-lg"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddBranchOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-neutral-600 hover:bg-neutral-100 rounded-lg"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold text-white bg-red-700 hover:bg-red-800 rounded-lg"
                >
                  Simpan Cabang
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
