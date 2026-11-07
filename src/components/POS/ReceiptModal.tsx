import React from 'react';
import { X, Printer, CheckCircle2 } from 'lucide-react';
import { Transaction } from '../../types';
import { soundManager } from '../../services/audioService';

interface ReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  transaction: Transaction | null;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({
  isOpen,
  onClose,
  transaction,
}) => {
  if (!isOpen || !transaction) return null;

  const formatRupiah = (num: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(num);
  };

  const handlePrint = () => {
    soundManager.playBeep();
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs">
      <div className="relative w-full max-w-sm bg-white rounded-2xl shadow-2xl border border-neutral-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-neutral-900 text-white">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <h3 className="text-xs font-bold tracking-tight">Transaksi Sukses · Struk Belanja</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-neutral-400 hover:text-white rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Thermal Receipt Content */}
        <div className="p-4 overflow-y-auto flex-1 bg-neutral-50/50">
          <div
            id="thermal-receipt-printable"
            className="bg-white p-5 rounded-lg border border-neutral-200 shadow-2xs font-mono text-xs text-neutral-800 space-y-3"
          >
            {/* Store Branding */}
            <div className="text-center pb-2 border-b border-dashed border-neutral-300">
              <div className="text-sm font-black tracking-tight uppercase">KasirPro Store</div>
              <div className="text-[11px] text-neutral-600 mt-0.5">{transaction.branchName}</div>
              <div className="text-[10px] text-neutral-400">NPWP: 01.234.567.8-012.000</div>
            </div>

            {/* Invoice Info */}
            <div className="text-[11px] space-y-0.5 pb-2 border-b border-dashed border-neutral-300">
              <div className="flex justify-between">
                <span>No. Invoice:</span>
                <span className="font-bold">{transaction.invoiceNumber}</span>
              </div>
              <div className="flex justify-between">
                <span>Waktu:</span>
                <span>{new Date(transaction.createdAt).toLocaleString('id-ID')}</span>
              </div>
              <div className="flex justify-between">
                <span>Kasir:</span>
                <span>{transaction.cashierName}</span>
              </div>
              <div className="flex justify-between">
                <span>Pelanggan:</span>
                <span>{transaction.customerName || 'Umum (Walk-in)'}</span>
              </div>
              {transaction.tableNumber && (
                <div className="flex justify-between">
                  <span>Meja:</span>
                  <span className="font-bold">{transaction.tableNumber}</span>
                </div>
              )}
            </div>

            {/* Items */}
            <div className="space-y-1.5 pb-2 border-b border-dashed border-neutral-300 text-[11px]">
              {transaction.items.map((item, idx) => (
                <div key={idx}>
                  <div className="font-bold truncate">{item.productName}</div>
                  <div className="flex justify-between text-neutral-600">
                    <span>
                      {item.quantity} x {formatRupiah(item.price)}
                    </span>
                    <span className="font-bold text-neutral-800">{formatRupiah(item.subtotal)}</span>
                  </div>
                  {item.notes && (
                    <div className="text-[10px] text-neutral-500 italic">catatan: {item.notes}</div>
                  )}
                </div>
              ))}
            </div>

            {/* Totals */}
            <div className="space-y-1 pb-2 border-b border-dashed border-neutral-300 text-[11px]">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span className="tabular-nums">{formatRupiah(transaction.subtotal)}</span>
              </div>
              {transaction.discount > 0 && (
                <div className="flex justify-between text-red-600">
                  <span>Diskon:</span>
                  <span className="tabular-nums">-{formatRupiah(transaction.discount)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>Pajak Resto PB1 (10%):</span>
                <span className="tabular-nums">{formatRupiah(transaction.tax)}</span>
              </div>
              <div className="flex justify-between text-sm font-bold pt-1 border-t border-neutral-200">
                <span>TOTAL:</span>
                <span className="tabular-nums">{formatRupiah(transaction.total)}</span>
              </div>
            </div>

            {/* Payment Details */}
            <div className="space-y-0.5 text-[11px] pb-2 border-b border-dashed border-neutral-300">
              <div className="flex justify-between uppercase">
                <span>Metode:</span>
                <span className="font-bold">{transaction.paymentMethod.replace('_', ' ')}</span>
              </div>
              <div className="flex justify-between">
                <span>Bayar:</span>
                <span className="tabular-nums">{formatRupiah(transaction.amountPaid)}</span>
              </div>
              <div className="flex justify-between">
                <span>Kembalian:</span>
                <span className="tabular-nums font-bold text-emerald-700">
                  {formatRupiah(transaction.change)}
                </span>
              </div>
            </div>

            {/* Thermal Barcode & Thank You */}
            <div className="text-center pt-2 text-[10px] text-neutral-500 space-y-1">
              <div className="font-mono tracking-widest text-xs font-bold text-neutral-800">
                ||||| | |||| || |||||| | |||||
              </div>
              <div>Terima kasih atas kunjungan Anda!</div>
              <div className="text-[9px] text-neutral-400">Powered by KasirPro Multi-Cabang</div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-3 bg-white border-t border-neutral-200 flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={handlePrint}
            className="flex-1 py-2 px-3 bg-neutral-900 hover:bg-neutral-800 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center justify-center gap-1.5"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Cetak Struk (Print)</span>
          </button>
          <button
            type="button"
            onClick={onClose}
            className="py-2 px-4 bg-red-700 hover:bg-red-800 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
          >
            Selesai
          </button>
        </div>
      </div>
    </div>
  );
};
