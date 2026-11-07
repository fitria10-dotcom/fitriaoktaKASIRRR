import React, { useState } from 'react';
import {
  X,
  Banknote,
  QrCode,
  CreditCard,
  Wallet,
  CheckCircle2,
  AlertCircle,
  Clock,
  Sparkles
} from 'lucide-react';
import { PaymentMethod } from '../../types';
import { soundManager } from '../../services/audioService';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  grandTotal: number;
  onConfirmPayment: (method: PaymentMethod, amountPaid: number, change: number) => void;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({
  isOpen,
  onClose,
  grandTotal,
  onConfirmPayment,
}) => {
  const [method, setMethod] = useState<PaymentMethod>('tunai');
  const [cashGiven, setCashGiven] = useState<number>(grandTotal);
  const [customCashStr, setCustomCashStr] = useState<string>(grandTotal.toString());
  const [qrisStatus, setQrisStatus] = useState<'waiting' | 'scanned' | 'success'>('waiting');

  if (!isOpen) return null;

  const formatRupiah = (num: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(num);
  };

  const change = Math.max(0, cashGiven - grandTotal);
  const isCashInsufficient = method === 'tunai' && cashGiven < grandTotal;

  const handleCashButton = (amount: number) => {
    soundManager.playBeep();
    setCashGiven(amount);
    setCustomCashStr(amount.toString());
  };

  const handleCustomCashChange = (val: string) => {
    const numeric = parseInt(val.replace(/\D/g, '') || '0', 10);
    setCashGiven(numeric);
    setCustomCashStr(val.replace(/\D/g, ''));
  };

  const handleProcessCheckout = () => {
    if (isCashInsufficient) {
      soundManager.playError();
      return;
    }

    let finalAmount = grandTotal;
    let finalChange = 0;

    if (method === 'tunai') {
      finalAmount = cashGiven;
      finalChange = change;
    }

    onConfirmPayment(method, finalAmount, finalChange);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs">
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-neutral-200 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-neutral-900 text-white">
          <div>
            <div className="text-xs text-neutral-400">Total Tagihan Pesanan</div>
            <div className="text-xl font-bold font-mono text-white tracking-tight">
              {formatRupiah(grandTotal)}
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

        {/* Payment Method Tabs */}
        <div className="grid grid-cols-4 p-2 bg-neutral-100 gap-1 border-b border-neutral-200">
          {[
            { id: 'tunai' as PaymentMethod, label: 'Tunai', icon: Banknote },
            { id: 'qris' as PaymentMethod, label: 'QRIS', icon: QrCode },
            { id: 'kartu_debit' as PaymentMethod, label: 'Kartu / EDC', icon: CreditCard },
            { id: 'transfer' as PaymentMethod, label: 'E-Wallet', icon: Wallet },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = method === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  soundManager.playBeep();
                  setMethod(tab.id);
                }}
                className={`flex flex-col items-center py-2.5 px-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  isActive
                    ? 'bg-white text-red-700 shadow-2xs'
                    : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-200/60'
                }`}
              >
                <Icon className={`w-4 h-4 mb-1 ${isActive ? 'text-red-600' : 'text-neutral-500'}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab Body */}
        <div className="p-6">
          {/* Method: Tunai */}
          {method === 'tunai' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">
                  Uang Diterima dari Pelanggan
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-xs font-bold text-neutral-500">Rp</span>
                  <input
                    type="text"
                    value={customCashStr}
                    onChange={(e) => handleCustomCashChange(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-base font-mono font-bold bg-neutral-50 border border-neutral-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-red-500 focus:bg-white text-neutral-900"
                  />
                </div>
              </div>

              {/* Quick Nominal Buttons */}
              <div className="grid grid-cols-4 gap-2">
                <button
                  type="button"
                  onClick={() => handleCashButton(grandTotal)}
                  className="py-2 px-1 text-[11px] font-bold bg-neutral-100 hover:bg-red-50 hover:text-red-700 hover:border-red-300 border border-neutral-200 rounded-lg transition-colors cursor-pointer"
                >
                  Uang Pas
                </button>
                {[50000, 100000, 200000].map((nominal) => (
                  <button
                    key={nominal}
                    type="button"
                    onClick={() => handleCashButton(nominal)}
                    className="py-2 px-1 text-[11px] font-mono font-bold bg-neutral-100 hover:bg-red-50 hover:text-red-700 hover:border-red-300 border border-neutral-200 rounded-lg transition-colors cursor-pointer"
                  >
                    {formatRupiah(nominal).replace(',00', '')}
                  </button>
                ))}
              </div>

              {/* Kembalian Display */}
              <div
                className={`p-4 rounded-xl border flex items-center justify-between ${
                  isCashInsufficient
                    ? 'bg-red-50 border-red-200 text-red-700'
                    : 'bg-emerald-50 border-emerald-200 text-emerald-800'
                }`}
              >
                <div>
                  <div className="text-xs font-semibold">
                    {isCashInsufficient ? 'Uang Belum Cukup' : 'Uang Kembalian'}
                  </div>
                  <div className="text-lg font-mono font-black mt-0.5">
                    {isCashInsufficient
                      ? `Kurang ${formatRupiah(grandTotal - cashGiven)}`
                      : formatRupiah(change)}
                  </div>
                </div>
                {isCashInsufficient ? (
                  <AlertCircle className="w-6 h-6 text-red-500" />
                ) : (
                  <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                )}
              </div>
            </div>
          )}

          {/* Method: QRIS */}
          {method === 'qris' && (
            <div className="text-center space-y-3">
              <div className="inline-block p-3 bg-white border border-neutral-200 rounded-2xl shadow-sm">
                {/* Simulated dynamic QRIS svg */}
                <div className="w-44 h-44 bg-neutral-900 rounded-lg p-2 flex flex-col items-center justify-between mx-auto">
                  <div className="w-full flex justify-between items-center text-[9px] text-white font-mono px-1">
                    <span>QRIS STANDARD</span>
                    <span>NMID: ID10202611</span>
                  </div>
                  <div className="w-36 h-36 bg-white rounded p-1 flex items-center justify-center">
                    <QrCode className="w-32 h-32 text-neutral-900" />
                  </div>
                  <div className="text-[8px] text-neutral-300 font-bold uppercase">
                    KasirPro Dynamic QR
                  </div>
                </div>
              </div>

              <div className="text-xs text-neutral-600">
                Pindai menggunakan GoPay, OVO, ShopeePay, Dana, BCA Mobile, atau Livin Mandiri
              </div>

              <div className="flex items-center justify-center gap-1.5 text-xs text-amber-700 bg-amber-50 py-1.5 px-3 rounded-lg border border-amber-200 max-w-xs mx-auto">
                <Clock className="w-3.5 h-3.5" />
                <span>Menunggu pembayaran pelanggan...</span>
              </div>

              <button
                type="button"
                onClick={() => {
                  soundManager.playCashSuccess();
                  setQrisStatus('success');
                }}
                className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 py-1 px-3 rounded-lg transition-colors cursor-pointer inline-flex items-center gap-1"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Simulasi Notifikasi QRIS Masuk</span>
              </button>
            </div>
          )}

          {/* Method: Kartu Debit / EDC */}
          {method === 'kartu_debit' && (
            <div className="space-y-3">
              <div className="text-xs text-neutral-600">
                Pilih mesin EDC dan lakukan gesek/dip kartu nasabah:
              </div>
              <div className="grid grid-cols-2 gap-2">
                {['EDC BCA Flazz / Debit', 'EDC Mandiri', 'EDC BRI', 'EDC BNI'].map((bank) => (
                  <div
                    key={bank}
                    className="p-3 bg-neutral-50 hover:bg-neutral-100 border border-neutral-200 rounded-xl cursor-pointer text-xs font-semibold text-neutral-800 flex items-center gap-2"
                  >
                    <CreditCard className="w-4 h-4 text-blue-600" />
                    <span>{bank}</span>
                  </div>
                ))}
              </div>
              <div className="p-3 bg-blue-50 text-blue-800 text-xs rounded-xl border border-blue-200">
                Pastikan struk EDC nasabah telah keluar dengan status <span className="font-bold">APPROVED</span>.
              </div>
            </div>
          )}

          {/* Method: E-Wallet */}
          {method === 'transfer' && (
            <div className="space-y-3">
              <div className="text-xs text-neutral-600">Pilih e-wallet atau akun transfer:</div>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { name: 'GoPay Direct', color: 'text-blue-600' },
                  { name: 'OVO Merchant', color: 'text-purple-600' },
                  { name: 'ShopeePay', color: 'text-orange-600' },
                  { name: 'Dana Bisnis', color: 'text-sky-600' },
                ].map((ew) => (
                  <div
                    key={ew.name}
                    className="p-3 bg-neutral-50 hover:bg-neutral-100 border border-neutral-200 rounded-xl cursor-pointer text-xs font-semibold text-neutral-800 flex items-center gap-2"
                  >
                    <Wallet className={`w-4 h-4 ${ew.color}`} />
                    <span>{ew.name}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-neutral-50 border-t border-neutral-200 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-neutral-700 hover:bg-neutral-200 rounded-lg transition-colors cursor-pointer"
          >
            Batal
          </button>
          <button
            type="button"
            disabled={isCashInsufficient}
            onClick={handleProcessCheckout}
            className={`px-5 py-2.5 text-xs font-bold text-white rounded-xl shadow-xs transition-all cursor-pointer flex items-center gap-2 ${
              isCashInsufficient
                ? 'bg-neutral-300 cursor-not-allowed opacity-60'
                : 'bg-red-700 hover:bg-red-800'
            }`}
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Konfirmasi Pembayaran ({formatRupiah(grandTotal)})</span>
          </button>
        </div>
      </div>
    </div>
  );
};
