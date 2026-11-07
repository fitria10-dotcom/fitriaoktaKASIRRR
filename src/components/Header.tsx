import React, { useState, useEffect } from 'react';
import {
  Store,
  Volume2,
  VolumeX,
  Clock,
  LogOut,
  ChevronDown,
  UserCheck
} from 'lucide-react';
import { ActiveTab, Branch, User } from '../types';
import { soundManager } from '../services/audioService';

interface HeaderProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  activeUser: User;
  branches: Branch[];
  activeBranchId: string;
  onSelectBranch: (branchId: string) => void;
  onOpenUserSwitch: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  activeUser,
  branches,
  activeBranchId,
  onSelectBranch,
  onOpenUserSwitch,
}) => {
  const [timeStr, setTimeStr] = useState('');
  const [soundOn, setSoundOn] = useState(soundManager.isEnabled());
  const [branchDropdownOpen, setBranchDropdownOpen] = useState(false);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeStr(
        now.toLocaleTimeString('id-ID', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        }) + ' WIB'
      );
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  const toggleSound = () => {
    const newState = !soundOn;
    setSoundOn(newState);
    soundManager.setEnabled(newState);
    if (newState) soundManager.playBeep();
  };

  const currentBranch =
    branches?.find((b) => b.id === activeBranchId) ||
    branches?.[0] || {
      id: 'b1',
      name: 'Cabang Grand Indonesia (Pusat)',
      address: 'Jl. M.H. Thamrin No.1, Jakarta Pusat',
      city: 'Jakarta Pusat',
      phone: '021-23580001',
    };

  const navLinks = [
    { id: 'pos' as ActiveTab, label: 'Kasir POS' },
    { id: 'inventory' as ActiveTab, label: 'Inventaris' },
    { id: 'reports' as ActiveTab, label: 'Laporan' },
    { id: 'users' as ActiveTab, label: 'Kelola Pengguna', badge: 'Baru' },
    { id: 'branches' as ActiveTab, label: 'Cabang' },
  ];

  return (
    <header className="bg-white border-b border-neutral-200 sticky top-0 z-40 select-none shadow-2xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between gap-4 h-16">
          {/* Zone 1: Wordmark & Branch Switcher */}
          <div className="flex items-center gap-4 shrink-0">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-red-700 text-white flex items-center justify-center font-black text-sm tracking-tight shadow-xs">
                KP
              </div>
              <span className="text-lg font-black tracking-tight text-neutral-900 whitespace-nowrap">
                Kasir<span className="text-red-700">Pro</span>
              </span>
            </div>

            {/* Active Branch Selector */}
            <div className="relative hidden md:block">
              <button
                type="button"
                onClick={() => setBranchDropdownOpen(!branchDropdownOpen)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
              >
                <Store className="w-3.5 h-3.5 text-red-700" />
                <span className="truncate max-w-[150px]">{currentBranch?.name || 'Cabang Aktif'}</span>
                <ChevronDown className="w-3 h-3 text-neutral-500" />
              </button>

              {branchDropdownOpen && (
                <div className="absolute left-0 mt-1 w-64 bg-white border border-neutral-200 rounded-xl shadow-lg p-1 z-50">
                  <div className="text-[10px] font-bold text-neutral-400 px-3 py-1 uppercase">
                    Pilih Cabang Aktif
                  </div>
                  {branches?.map((b) => (
                    <button
                      key={b.id}
                      type="button"
                      onClick={() => {
                        soundManager.playBeep();
                        onSelectBranch(b.id);
                        setBranchDropdownOpen(false);
                      }}
                      className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer flex items-center justify-between ${
                        b.id === activeBranchId
                          ? 'bg-red-50 text-red-800 font-bold'
                          : 'text-neutral-700 hover:bg-neutral-50'
                      }`}
                    >
                      <div>
                        <div>{b.name}</div>
                        <div className="text-[10px] text-neutral-400">{b.city}</div>
                      </div>
                      {b.id === activeBranchId && (
                        <span className="w-1.5 h-1.5 rounded-full bg-red-600" />
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Zone 2: Navigation Links */}
          <nav className="flex items-center gap-1 sm:gap-2 overflow-x-auto py-1 scrollbar-none">
            {navLinks.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => {
                    soundManager.playBeep();
                    setActiveTab(tab.id);
                  }}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer flex items-center gap-1.5 ${
                    isActive
                      ? 'bg-red-700 text-white shadow-2xs'
                      : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100'
                  }`}
                >
                  <span>{tab.label}</span>
                  {tab.badge && (
                    <span
                      className={`text-[9px] px-1.5 py-0.2 rounded-sm font-bold uppercase tracking-wider ${
                        isActive ? 'bg-white text-red-700' : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {tab.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Zone 3: Active User / Fast Cashier Switch & Controls */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {/* Live Clock */}
            <div className="hidden lg:flex items-center gap-1.5 text-xs font-mono text-neutral-600 bg-neutral-50 px-2.5 py-1 rounded-lg border border-neutral-200">
              <Clock className="w-3.5 h-3.5 text-neutral-400" />
              <span>{timeStr}</span>
            </div>

            {/* Sound Toggle */}
            <button
              type="button"
              onClick={toggleSound}
              className="p-2 text-neutral-500 hover:text-neutral-800 hover:bg-neutral-100 rounded-lg transition-colors cursor-pointer"
              title={soundOn ? 'Suara Aktif (Klik untuk Mute)' : 'Suara Muted (Klik untuk Aktifkan)'}
            >
              {soundOn ? <Volume2 className="w-4 h-4 text-emerald-600" /> : <VolumeX className="w-4 h-4 text-neutral-400" />}
            </button>

            {/* Active User Button */}
            <button
              type="button"
              onClick={() => {
                soundManager.playBeep();
                onOpenUserSwitch();
              }}
              className="flex items-center gap-2 pl-2 pr-3 py-1.5 bg-neutral-100 hover:bg-neutral-200 rounded-xl text-xs font-semibold text-neutral-800 transition-all cursor-pointer border border-neutral-200"
              title="Klik untuk ganti kasir / verifikasi PIN"
            >
              <div className="relative">
                <img
                  src={activeUser?.avatar || 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=150&h=150&q=80'}
                  alt={activeUser?.name || 'Kasir'}
                  className="w-6 h-6 rounded-full object-cover border border-neutral-300"
                />
                <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-500 ring-1 ring-white" />
              </div>
              <div className="text-left hidden sm:block">
                <div className="text-xs font-bold leading-none text-neutral-900 truncate max-w-[110px]">
                  {activeUser?.name ? activeUser.name.split(' ')[0] : 'Kasir'}
                </div>
                <div className="text-[10px] text-neutral-500 leading-none mt-0.5">
                  {activeUser?.role === 'admin' ? 'Super Admin' : (activeUser?.roleLabel || 'Staff')}
                </div>
              </div>
              <LogOut className="w-3.5 h-3.5 text-neutral-400 ml-1" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
