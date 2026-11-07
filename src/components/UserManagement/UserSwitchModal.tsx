import React, { useState } from 'react';
import { X, Lock, KeyRound, AlertCircle, Sparkles } from 'lucide-react';
import { User } from '../../types';
import { soundManager } from '../../services/audioService';

interface UserSwitchModalProps {
  isOpen: boolean;
  onClose: () => void;
  users: User[];
  activeUser: User;
  onSwitchUser: (user: User) => void;
}

export const UserSwitchModal: React.FC<UserSwitchModalProps> = ({
  isOpen,
  onClose,
  users,
  activeUser,
  onSwitchUser,
}) => {
  const [selectedUser, setSelectedUser] = useState<User>(activeUser);
  const [pinInput, setPinInput] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  React.useEffect(() => {
    if (isOpen && activeUser) {
      setSelectedUser(activeUser);
      setPinInput('');
      setErrorMsg('');
    }
  }, [isOpen, activeUser]);

  if (!isOpen || !selectedUser) return null;

  const handleDigit = (digit: string) => {
    soundManager.playBeep();
    if (pinInput.length < 6) {
      setPinInput((prev) => prev + digit);
      setErrorMsg('');
    }
  };

  const handleDelete = () => {
    soundManager.playBeep();
    setPinInput((prev) => prev.slice(0, -1));
    setErrorMsg('');
  };

  const handleClear = () => {
    soundManager.playBeep();
    setPinInput('');
    setErrorMsg('');
  };

  const handleVerifyPin = () => {
    if (selectedUser.status === 'inactive') {
      soundManager.playError();
      setErrorMsg('Akun pengguna ini berstatus non-aktif. Hubungi Admin.');
      return;
    }

    if (pinInput === selectedUser.pin) {
      soundManager.playCashSuccess();
      onSwitchUser(selectedUser);
      onClose();
      setPinInput('');
      setErrorMsg('');
    } else {
      soundManager.playError();
      setErrorMsg('PIN salah. Silakan coba lagi.');
      setPinInput('');
    }
  };

  const quickAdminLogin = () => {
    const adminUser = users.find((u) => u.role === 'admin') || users[0];
    soundManager.playCashSuccess();
    onSwitchUser(adminUser);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs">
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-neutral-200 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 bg-neutral-900 text-white">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 bg-white/10 rounded-lg">
              <Lock className="w-4 h-4 text-red-400" />
            </div>
            <div>
              <h3 className="text-sm font-bold tracking-tight">Ganti Kasir / Login PIN</h3>
              <p className="text-[11px] text-neutral-400">Verifikasi PIN akses untuk beralih akun kasir</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-neutral-400 hover:text-white rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* User Selection Carousel / List */}
        <div className="p-4 bg-neutral-50 border-b border-neutral-200">
          <div className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider mb-2">
            Pilih Karyawan / Kasir:
          </div>
          <div className="grid grid-cols-4 gap-2">
            {users.slice(0, 8).map((u) => {
              const isSelected = selectedUser.id === u.id;
              return (
                <button
                  key={u.id}
                  type="button"
                  onClick={() => {
                    soundManager.playBeep();
                    setSelectedUser(u);
                    setPinInput('');
                    setErrorMsg('');
                  }}
                  className={`flex flex-col items-center p-2 rounded-xl transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-red-50 border border-red-500 shadow-2xs'
                      : 'hover:bg-white bg-transparent border border-transparent'
                  }`}
                >
                  <div className="relative">
                    <img
                      src={u.avatar}
                      alt={u.name}
                      className="w-10 h-10 rounded-full object-cover border border-neutral-200"
                    />
                    {u.id === activeUser.id && (
                      <span className="absolute -bottom-1 -right-1 w-3 h-3 bg-emerald-500 border-2 border-white rounded-full" />
                    )}
                  </div>
                  <span className="text-[11px] font-bold text-neutral-800 truncate w-full text-center mt-1">
                    {u.name.split(' ')[0]}
                  </span>
                  <span className="text-[9px] text-neutral-500 truncate">{u.role}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Selected User Details */}
        <div className="p-4 flex items-center justify-between bg-white">
          <div className="flex items-center gap-3">
            <img
              src={selectedUser.avatar}
              alt={selectedUser.name}
              className="w-10 h-10 rounded-full object-cover border border-neutral-200"
            />
            <div>
              <div className="text-sm font-bold text-neutral-900">{selectedUser.name}</div>
              <div className="text-xs text-neutral-500">
                {selectedUser.roleLabel} · PIN: <span className="font-mono text-red-600 font-bold">{selectedUser.pin}</span>
              </div>
            </div>
          </div>
          <span className="text-[10px] bg-neutral-100 text-neutral-700 px-2 py-0.5 rounded-full font-semibold">
            {selectedUser.status === 'active' ? 'Aktif' : 'Non-Aktif'}
          </span>
        </div>

        {/* PIN Dots Display */}
        <div className="px-6 py-2 flex flex-col items-center">
          <div className="flex items-center gap-3 my-2">
            {[0, 1, 2, 3].map((idx) => {
              const hasDigit = pinInput.length > idx;
              return (
                <div
                  key={idx}
                  className={`w-4 h-4 rounded-full border transition-all ${
                    hasDigit
                      ? 'bg-red-600 border-red-600 scale-110'
                      : 'bg-neutral-100 border-neutral-300'
                  }`}
                />
              );
            })}
          </div>

          {errorMsg && (
            <div className="text-xs text-red-600 font-medium flex items-center gap-1 mt-1">
              <AlertCircle className="w-3.5 h-3.5" /> {errorMsg}
            </div>
          )}
        </div>

        {/* Touch PIN Pad */}
        <div className="p-4 pt-1">
          <div className="grid grid-cols-3 gap-2 max-w-xs mx-auto">
            {['1', '2', '3', '4', '5', '6', '7', '8', '9', 'C', '0', '⌫'].map((item) => {
              if (item === 'C') {
                return (
                  <button
                    key={item}
                    type="button"
                    onClick={handleClear}
                    className="py-3 text-sm font-bold text-neutral-600 bg-neutral-100 hover:bg-neutral-200 rounded-xl transition-colors cursor-pointer"
                  >
                    Clear
                  </button>
                );
              }
              if (item === '⌫') {
                return (
                  <button
                    key={item}
                    type="button"
                    onClick={handleDelete}
                    className="py-3 text-sm font-bold text-neutral-600 bg-neutral-100 hover:bg-neutral-200 rounded-xl transition-colors cursor-pointer"
                  >
                    Hapus
                  </button>
                );
              }
              return (
                <button
                  key={item}
                  type="button"
                  onClick={() => handleDigit(item)}
                  className="py-3 text-base font-bold font-mono text-neutral-800 bg-neutral-50 hover:bg-neutral-100 border border-neutral-200 rounded-xl transition-colors cursor-pointer active:scale-95"
                >
                  {item}
                </button>
              );
            })}
          </div>

          {/* Confirm Button */}
          <div className="mt-3 flex flex-col gap-2 max-w-xs mx-auto">
            <button
              type="button"
              disabled={pinInput.length < 4}
              onClick={handleVerifyPin}
              className={`w-full py-2.5 text-xs font-bold text-white rounded-xl shadow-xs transition-all cursor-pointer flex items-center justify-center gap-2 ${
                pinInput.length >= 4
                  ? 'bg-red-700 hover:bg-red-800'
                  : 'bg-neutral-300 cursor-not-allowed opacity-60'
              }`}
            >
              <KeyRound className="w-4 h-4" /> Masuk Sebagai {selectedUser.name.split(' ')[0]}
            </button>

            <button
              type="button"
              onClick={quickAdminLogin}
              className="text-[11px] text-neutral-500 hover:text-red-700 py-1 flex items-center justify-center gap-1 cursor-pointer"
            >
              <Sparkles className="w-3 h-3 text-amber-500" /> Masuk Cepat sebagai Super Admin
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
