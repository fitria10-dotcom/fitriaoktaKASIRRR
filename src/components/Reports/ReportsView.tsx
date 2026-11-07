import React, { useState } from 'react';
import {
  TrendingUp,
  DollarSign,
  Receipt,
  Download,
  Filter,
  Printer,
  Calendar,
  Lock,
  Search,
  RotateCcw,
  AlertCircle
} from 'lucide-react';
import { Branch, Transaction, User } from '../../types';
import { soundManager } from '../../services/audioService';
import { ReceiptModal } from '../POS/ReceiptModal';

interface ReportsViewProps {
  transactions: Transaction[];
  branches: Branch[];
  activeBranch: Branch;
  activeUser: User;
  onVoidTransaction: (transactionId: string) => void;
}

export const ReportsView: React.FC<ReportsViewProps> = ({
  transactions,
  branches,
  activeBranch,
  activeUser,
  onVoidTransaction,
}) => {
  const [selectedBranchId, setSelectedBranchId] = useState<string>('all');
  const [paymentFilter, setPaymentFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [reprintTx, setReprintTx] = useState<Transaction | null>(null);

  const formatRupiah = (num: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(num);
  };

  // Permission check
  const hasReportsPermission = activeUser.permissions.view_reports;
  const hasExportPermission = activeUser.permissions.export_data;
  const hasVoidPermission = activeUser.permissions.delete_transactions;

  if (!hasReportsPermission) {
    return (
      <div className="text-center py-16 bg-white rounded-2xl border border-neutral-200 p-8 max-w-lg mx-auto">
        <div className="w-12 h-12 bg-amber-100 text-amber-700 rounded-full flex items-center justify-center mx-auto mb-3">
          <Lock className="w-6 h-6" />
        </div>
        <h2 className="text-base font-bold text-neutral-900">Akses Laporan Terkunci</h2>
        <p className="text-xs text-neutral-500 mt-2">
          Akun Anda saat ini (<span className="font-semibold">{activeUser.name} - {activeUser.roleLabel}</span>) tidak memiliki hak akses melihat laporan keuangan dan omzet penjualan.
        </p>
        <p className="text-xs text-neutral-400 mt-1">
          Hubungi Super Admin untuk menambahkan hak akses &quot;Akses Laporan &amp; Omzet&quot; di menu Kelola Pengguna.
        </p>
      </div>
    );
  }

  // Filter transactions
  const filtered = transactions.filter((tx) => {
    const matchesBranch = selectedBranchId === 'all' || tx.branchId === selectedBranchId;
    const matchesPayment = paymentFilter === 'all' || tx.paymentMethod === paymentFilter;
    const matchesSearch =
      tx.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tx.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tx.cashierName.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesBranch && matchesPayment && matchesSearch;
  });

  const validTransactions = filtered.filter((t) => t.status === 'selesai');
  const totalOmzet = validTransactions.reduce((acc, t) => acc + t.total, 0);
  const totalTransaksi = validTransactions.length;
  const aov = totalTransaksi > 0 ? Math.round(totalOmzet / totalTransaksi) : 0;

  // Calculate gross profit
  const totalCost = validTransactions.reduce((acc, t) => {
    const costForTx = t.items.reduce((s, item) => s + (item.costPrice || 0) * item.quantity, 0);
    return acc + costForTx;
  }, 0);
  const grossProfit = Math.max(0, totalOmzet - totalCost);

  // Export to CSV
  const handleExportCSV = () => {
    if (!hasExportPermission) {
      soundManager.playError();
      return;
    }
    soundManager.playCashSuccess();
    const headers = [
      'No Invoice',
      'Tanggal & Waktu',
      'Cabang',
      'Kasir',
      'Pelanggan',
      'Tipe Pesanan',
      'Metode Pembayaran',
      'Subtotal',
      'Diskon',
      'Pajak PB1',
      'Total',
      'Status',
    ];

    const rows = filtered.map((tx) => [
      tx.invoiceNumber,
      new Date(tx.createdAt).toLocaleString('id-ID'),
      `"${tx.branchName}"`,
      `"${tx.cashierName}"`,
      `"${tx.customerName}"`,
      tx.orderType,
      tx.paymentMethod,
      tx.subtotal,
      tx.discount,
      tx.tax,
      tx.total,
      tx.status,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Laporan_KasirPro_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-neutral-200">
        <div>
          <h1 className="text-xl md:text-2xl font-black text-neutral-900 tracking-tight">
            Laporan Penjualan &amp; Arus Kas
          </h1>
          <p className="text-xs text-neutral-500 mt-1">
            Pantau arus transaksi kasir, omzet real-time, metode QRIS/Tunai, dan cetak ulang struk.
          </p>
        </div>

        {hasExportPermission && (
          <button
            type="button"
            onClick={handleExportCSV}
            className="px-4 py-2.5 bg-neutral-900 hover:bg-neutral-800 text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer flex items-center justify-center gap-2 shrink-0"
          >
            <Download className="w-4 h-4 text-emerald-400" />
            <span>Export CSV / Excel</span>
          </button>
        )}
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="p-4 bg-white rounded-xl border border-neutral-200 shadow-2xs">
          <div className="text-xs text-neutral-500 font-medium">Total Omzet Penjualan</div>
          <div className="text-xl md:text-2xl font-bold font-mono text-neutral-900 mt-1">
            {formatRupiah(totalOmzet)}
          </div>
          <div className="text-[11px] text-emerald-600 font-semibold mt-1">
            Real-time per transaksi
          </div>
        </div>

        <div className="p-4 bg-white rounded-xl border border-neutral-200 shadow-2xs">
          <div className="text-xs text-neutral-500 font-medium">Estimasi Laba Kotor (Gross)</div>
          <div className="text-xl md:text-2xl font-bold font-mono text-emerald-700 mt-1">
            {formatRupiah(grossProfit)}
          </div>
          <div className="text-[11px] text-neutral-400 mt-1">Setelah HPP Bahan</div>
        </div>

        <div className="p-4 bg-white rounded-xl border border-neutral-200 shadow-2xs">
          <div className="text-xs text-neutral-500 font-medium">Total Pesanan Sukses</div>
          <div className="text-xl md:text-2xl font-bold font-mono text-neutral-900 mt-1">
            {totalTransaksi}
          </div>
          <div className="text-[11px] text-neutral-400 mt-1">Struk tercatat</div>
        </div>

        <div className="p-4 bg-white rounded-xl border border-neutral-200 shadow-2xs">
          <div className="text-xs text-neutral-500 font-medium">Rata-Rata Transaksi (AOV)</div>
          <div className="text-xl md:text-2xl font-bold font-mono text-neutral-900 mt-1">
            {formatRupiah(aov)}
          </div>
          <div className="text-[11px] text-neutral-400 mt-1">Per tiket pesanan</div>
        </div>
      </div>

      {/* Filters Toolbar */}
      <div className="bg-white p-3.5 rounded-xl border border-neutral-200 shadow-2xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Cari nomor invoice, nama kasir, atau pelanggan..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-neutral-50 border border-neutral-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-red-500 focus:bg-white"
            />
          </div>

          <div className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-neutral-500" />
            <select
              value={selectedBranchId}
              onChange={(e) => setSelectedBranchId(e.target.value)}
              className="px-2.5 py-1.5 text-xs bg-neutral-50 border border-neutral-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-red-500"
            >
              <option value="all">Semua Cabang Toko</option>
              {branches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>

            <select
              value={paymentFilter}
              onChange={(e) => setPaymentFilter(e.target.value)}
              className="px-2.5 py-1.5 text-xs bg-neutral-50 border border-neutral-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-red-500"
            >
              <option value="all">Semua Metode Pembayaran</option>
              <option value="tunai">Tunai (Cash)</option>
              <option value="qris">QRIS Dinamis</option>
              <option value="kartu_debit">Kartu Debit / EDC</option>
              <option value="transfer">E-Wallet</option>
            </select>
          </div>
        </div>
      </div>

      {/* Transaction Table */}
      <div className="bg-white rounded-xl border border-neutral-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-neutral-50 border-b border-neutral-200 text-neutral-500 font-semibold uppercase tracking-wider">
                <th className="py-3 px-4">No. Invoice &amp; Waktu</th>
                <th className="py-3 px-3">Cabang &amp; Kasir</th>
                <th className="py-3 px-3">Pelanggan / Tipe</th>
                <th className="py-3 px-3">Metode Bayar</th>
                <th className="py-3 px-3 text-right">Subtotal</th>
                <th className="py-3 px-3 text-right">Total Akhir</th>
                <th className="py-3 px-3 text-center">Status</th>
                <th className="py-3 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200">
              {filtered.map((tx) => {
                const isCancelled = tx.status === 'dibatalkan';

                return (
                  <tr
                    key={tx.id}
                    className={`hover:bg-neutral-50/60 transition-colors ${
                      isCancelled ? 'opacity-50 bg-neutral-50' : ''
                    }`}
                  >
                    <td className="py-3 px-4">
                      <div className="font-mono font-bold text-neutral-900">{tx.invoiceNumber}</div>
                      <div className="text-[11px] text-neutral-400">
                        {new Date(tx.createdAt).toLocaleString('id-ID')}
                      </div>
                    </td>

                    <td className="py-3 px-3">
                      <div className="font-semibold text-neutral-800">{tx.branchName}</div>
                      <div className="text-[11px] text-neutral-500">Kasir: {tx.cashierName}</div>
                    </td>

                    <td className="py-3 px-3">
                      <div className="font-medium text-neutral-800">{tx.customerName}</div>
                      <div className="text-[11px] text-neutral-400 capitalize">
                        {tx.orderType.replace('_', ' ')} {tx.tableNumber ? `· ${tx.tableNumber}` : ''}
                      </div>
                    </td>

                    <td className="py-3 px-3">
                      <span className="font-bold text-[11px] uppercase text-neutral-700 bg-neutral-100 px-2 py-0.5 rounded-sm">
                        {tx.paymentMethod.replace('_', ' ')}
                      </span>
                    </td>

                    <td className="py-3 px-3 text-right font-mono text-neutral-600">
                      {formatRupiah(tx.subtotal)}
                    </td>

                    <td className="py-3 px-3 text-right font-mono font-bold text-neutral-900">
                      {formatRupiah(tx.total)}
                    </td>

                    <td className="py-3 px-3 text-center">
                      <span
                        className={`inline-block px-2 py-0.5 text-[10px] font-bold rounded-full ${
                          tx.status === 'selesai'
                            ? 'bg-emerald-50 text-emerald-700'
                            : 'bg-red-50 text-red-700'
                        }`}
                      >
                        {tx.status}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            soundManager.playBeep();
                            setReprintTx(tx);
                          }}
                          className="p-1.5 text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 rounded-lg cursor-pointer"
                          title="Cetak Ulang Struk"
                        >
                          <Printer className="w-4 h-4" />
                        </button>

                        {hasVoidPermission && tx.status === 'selesai' && (
                          <button
                            type="button"
                            onClick={() => {
                              soundManager.playError();
                              onVoidTransaction(tx.id);
                            }}
                            className="p-1.5 text-neutral-400 hover:text-red-600 hover:bg-red-50 rounded-lg cursor-pointer"
                            title="Batalkan / Void Transaksi"
                          >
                            <RotateCcw className="w-4 h-4" />
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

      {/* Reprint Modal */}
      {reprintTx && (
        <ReceiptModal
          isOpen={!!reprintTx}
          onClose={() => setReprintTx(null)}
          transaction={reprintTx}
        />
      )}
    </div>
  );
};
