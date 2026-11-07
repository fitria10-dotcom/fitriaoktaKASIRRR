import React, { useState } from 'react';
import {
  Package,
  Plus,
  AlertTriangle,
  Search,
  Filter,
  ArrowUpDown,
  Lock,
  Boxes,
  CheckCircle2,
  X,
  Edit2
} from 'lucide-react';
import { Branch, Product, User } from '../../types';
import { soundManager } from '../../services/audioService';

interface InventoryViewProps {
  products: Product[];
  branches: Branch[];
  activeBranch: Branch;
  activeUser: User;
  onUpdateProducts: (products: Product[]) => void;
}

export const InventoryView: React.FC<InventoryViewProps> = ({
  products,
  branches,
  activeBranch,
  activeUser,
  onUpdateProducts,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('Semua');
  const [stockOpnameProduct, setStockOpnameProduct] = useState<Product | null>(null);
  const [adjustmentAmount, setAdjustmentAmount] = useState<number>(0);
  const [opnameReason, setOpnameReason] = useState('Barang Masuk / Restock');
  const [isAddProductOpen, setIsAddProductOpen] = useState(false);

  // New Product State
  const [newProdName, setNewProdName] = useState('');
  const [newProdCategory, setNewProdCategory] = useState('Minuman Kopi');
  const [newProdPrice, setNewProdPrice] = useState(25000);
  const [newProdCost, setNewProdCost] = useState(10000);
  const [newProdStock, setNewProdStock] = useState(50);
  const [newProdBarcode, setNewProdBarcode] = useState('');

  const formatRupiah = (num: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(num);
  };

  const categories = ['Semua', 'Minuman Kopi', 'Non-Kopi', 'Pastry & Roti', 'Makanan Berat', 'Camilan'];

  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.barcode.includes(searchQuery);
    const matchesCat = categoryFilter === 'Semua' || p.category === categoryFilter;
    return matchesSearch && matchesCat;
  });

  const branchKey = activeBranch?.id || 'b1';

  const lowStockItems = products.filter((p) => {
    const currentStock = p.stockByBranch?.[branchKey] ?? 0;
    return currentStock <= p.minStock;
  });

  const handleApplyOpname = (e: React.FormEvent) => {
    e.preventDefault();
    if (!stockOpnameProduct) return;

    soundManager.playCashSuccess();
    const currentStock = stockOpnameProduct.stockByBranch?.[branchKey] ?? 0;
    const newStock = Math.max(0, currentStock + adjustmentAmount);

    const updated = products.map((p) => {
      if (p.id === stockOpnameProduct.id) {
        return {
          ...p,
          stockByBranch: {
            ...p.stockByBranch,
            [activeBranch.id]: newStock,
          },
        };
      }
      return p;
    });

    onUpdateProducts(updated);
    setStockOpnameProduct(null);
    setAdjustmentAmount(0);
  };

  const handleCreateProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProdName.trim()) return;

    soundManager.playCashSuccess();
    const newProduct: Product = {
      id: `p-${Date.now()}`,
      sku: `PROD-${Math.floor(100 + Math.random() * 900)}`,
      name: newProdName.trim(),
      category: newProdCategory,
      price: newProdPrice,
      costPrice: newProdCost,
      stockByBranch: {
        [activeBranch.id]: newProdStock,
      },
      minStock: 10,
      image: 'https://images.unsplash.com/photo-1544787219-7f47ccb76574?auto=format&fit=crop&w=400&q=80',
      barcode: newProdBarcode || `899${Math.floor(1000000 + Math.random() * 9000000)}`,
    };

    onUpdateProducts([newProduct, ...products]);
    setIsAddProductOpen(false);
    setNewProdName('');
  };

  // Permission check
  const hasInventoryPermission = activeUser.permissions.inventory_manage;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-neutral-200">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl md:text-2xl font-black text-neutral-900 tracking-tight">
              Inventaris & Manajemen Stok
            </h1>
            <span className="text-xs bg-neutral-100 text-neutral-700 font-bold px-2 py-0.5 rounded-md">
              {activeBranch.name}
            </span>
          </div>
          <p className="text-xs text-neutral-500 mt-1">
            Pantau ketersediaan bahan, HPP, margin laba, dan lakukan penyesuaian stok opname per cabang.
          </p>
        </div>

        {hasInventoryPermission && (
          <button
            type="button"
            onClick={() => {
              soundManager.playBeep();
              setIsAddProductOpen(true);
            }}
            className="px-4 py-2.5 bg-red-700 hover:bg-red-800 text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer flex items-center justify-center gap-2 shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Produk Baru</span>
          </button>
        )}
      </div>

      {/* Permission Restriction Notice if Cashier lacks permission */}
      {!hasInventoryPermission && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-center gap-3 text-xs text-amber-900">
          <Lock className="w-5 h-5 text-amber-600 shrink-0" />
          <div>
            <span className="font-bold">Mode Tinjau Terbatas:</span> Akun Anda ({activeUser.roleLabel}) hanya memiliki izin melihat katalog. Untuk mengubah stok atau menambah produk, hubungi Admin untuk mengaktifkan izin &quot;Kelola Stok &amp; Inventaris&quot;.
          </div>
        </div>
      )}

      {/* Low Stock Alert */}
      {lowStockItems.length > 0 && (
        <div className="p-4 bg-red-50/80 border border-red-200 rounded-xl flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
          <div className="flex-1 text-xs">
            <div className="font-bold text-red-900">
              Peringatan Stok Menipis ({lowStockItems.length} Produk)
            </div>
            <div className="text-red-700 mt-0.5">
              Produk berikut memiliki stok di bawah batas minimum ({activeBranch.name}):{' '}
              <span className="font-semibold">
                {lowStockItems.map((p) => `${p.name} (${p.stockByBranch[activeBranch.id] ?? 0})`).join(', ')}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-white p-3.5 rounded-xl border border-neutral-200 shadow-2xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Cari produk, SKU, barcode..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-neutral-50 border border-neutral-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-red-500 focus:bg-white"
            />
          </div>

          <div className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-neutral-500" />
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-2.5 py-1.5 text-xs bg-neutral-50 border border-neutral-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-red-500"
            >
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Inventory Table */}
      <div className="bg-white rounded-xl border border-neutral-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-neutral-50 border-b border-neutral-200 text-neutral-500 font-semibold uppercase tracking-wider">
                <th className="py-3 px-4">Produk</th>
                <th className="py-3 px-3">Kategori & SKU</th>
                <th className="py-3 px-3 text-right">Harga Jual</th>
                <th className="py-3 px-3 text-right">HPP (Modal)</th>
                <th className="py-3 px-3 text-right">Margin Laba</th>
                <th className="py-3 px-3 text-center">Stok Cabang Ini</th>
                <th className="py-3 px-3 text-center">Multi-Cabang</th>
                <th className="py-3 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200">
              {filteredProducts.map((p) => {
                const stock = p.stockByBranch?.[branchKey] ?? 0;
                const isLow = stock <= p.minStock;
                const margin = p.price - p.costPrice;
                const marginPercent = Math.round((margin / p.price) * 100);

                return (
                  <tr key={p.id} className="hover:bg-neutral-50/60 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={p.image}
                          alt={p.name}
                          referrerPolicy="no-referrer"
                          className="w-10 h-10 rounded-lg object-cover border border-neutral-200 shrink-0"
                        />
                        <div>
                          <div className="font-bold text-neutral-900">{p.name}</div>
                          <div className="text-[11px] text-neutral-400 font-mono">
                            Barcode: {p.barcode}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="py-3 px-3">
                      <div className="font-semibold text-neutral-800">{p.category}</div>
                      <div className="text-[11px] text-neutral-500 font-mono">{p.sku}</div>
                    </td>

                    <td className="py-3 px-3 text-right font-mono font-bold text-neutral-900">
                      {formatRupiah(p.price)}
                    </td>

                    <td className="py-3 px-3 text-right font-mono text-neutral-600">
                      {formatRupiah(p.costPrice)}
                    </td>

                    <td className="py-3 px-3 text-right">
                      <span className="font-mono text-emerald-700 font-bold">
                        +{marginPercent}%
                      </span>
                      <div className="text-[10px] text-neutral-400 font-mono">
                        {formatRupiah(margin)}
                      </div>
                    </td>

                    <td className="py-3 px-3 text-center">
                      <span
                        className={`inline-block font-mono font-bold px-2 py-0.5 rounded-md ${
                          isLow
                            ? 'bg-red-100 text-red-800'
                            : 'bg-neutral-100 text-neutral-800'
                        }`}
                      >
                        {stock} pcs
                      </span>
                    </td>

                    <td className="py-3 px-3 text-center">
                      <div className="text-[10px] font-mono text-neutral-500 space-x-1">
                        {branches.map((b) => (
                          <span key={b.id} title={b.name}>
                            {b.city.slice(0, 3).toUpperCase()}:{' '}
                            <strong className="text-neutral-800">{p.stockByBranch[b.id] ?? 0}</strong>
                          </span>
                        ))}
                      </div>
                    </td>

                    <td className="py-3 px-4 text-right">
                      {hasInventoryPermission ? (
                        <button
                          type="button"
                          onClick={() => {
                            soundManager.playBeep();
                            setStockOpnameProduct(p);
                            setAdjustmentAmount(10);
                          }}
                          className="px-2.5 py-1 text-xs font-semibold text-red-700 hover:text-white hover:bg-red-700 border border-red-300 hover:border-red-700 rounded-lg transition-colors cursor-pointer"
                        >
                          Penyesuaian Stok
                        </button>
                      ) : (
                        <span className="text-neutral-400 text-xs">-</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Stock Opname Modal */}
      {stockOpnameProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs">
          <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-neutral-200 overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 bg-neutral-900 text-white">
              <div className="flex items-center gap-2">
                <Boxes className="w-5 h-5 text-red-400" />
                <h3 className="text-sm font-bold tracking-tight">Penyesuaian Stok (Opname)</h3>
              </div>
              <button
                type="button"
                onClick={() => setStockOpnameProduct(null)}
                className="p-1 text-neutral-400 hover:text-white rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleApplyOpname} className="p-6 space-y-4">
              <div>
                <div className="text-xs text-neutral-500">Produk yang disesuaikan:</div>
                <div className="text-sm font-bold text-neutral-900">{stockOpnameProduct.name}</div>
                <div className="text-xs text-neutral-500 font-mono mt-0.5">
                  Cabang: {activeBranch.name} · Stok Saat Ini:{' '}
                  <span className="font-bold text-red-700">
                    {stockOpnameProduct.stockByBranch[activeBranch.id] ?? 0}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">
                  Alasan Penyesuaian
                </label>
                <select
                  value={opnameReason}
                  onChange={(e) => setOpnameReason(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-neutral-50 border border-neutral-300 rounded-lg"
                >
                  <option value="Barang Masuk / Restock">Barang Masuk / Restock Supplier (+)</option>
                  <option value="Barang Rusak / Basi / Expired">Barang Rusak / Kadaluwarsa (-)</option>
                  <option value="Koreksi Salah Input Kasir">Koreksi Salah Input Kasir (±)</option>
                  <option value="Retur Pelanggan">Retur Pengembalian Pelanggan (+)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">
                  Jumlah Perubahan Stok (+ untuk menambah, - untuk mengurangi)
                </label>
                <input
                  type="number"
                  required
                  value={adjustmentAmount}
                  onChange={(e) => setAdjustmentAmount(parseInt(e.target.value || '0', 10))}
                  className="w-full px-3 py-2 text-sm font-mono font-bold bg-neutral-50 border border-neutral-300 rounded-lg"
                />
              </div>

              <div className="p-3 bg-neutral-100 rounded-xl text-xs flex justify-between items-center">
                <span>Stok Akhir Nanti:</span>
                <span className="font-mono font-black text-sm text-neutral-900">
                  {Math.max(
                    0,
                    (stockOpnameProduct.stockByBranch[activeBranch.id] ?? 0) + adjustmentAmount
                  )}{' '}
                  pcs
                </span>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setStockOpnameProduct(null)}
                  className="px-4 py-2 text-xs font-semibold text-neutral-600 hover:bg-neutral-100 rounded-lg"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold text-white bg-red-700 hover:bg-red-800 rounded-lg"
                >
                  Simpan Perubahan Stok
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Tambah Produk Modal */}
      {isAddProductOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs">
          <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-neutral-200 overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 bg-red-700 text-white">
              <h3 className="text-sm font-bold">Tambah Produk Menu Baru</h3>
              <button
                type="button"
                onClick={() => setIsAddProductOpen(false)}
                className="p-1 text-white/80 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateProduct} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">
                  Nama Produk / Menu
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Kopi Susu Pandan"
                  value={newProdName}
                  onChange={(e) => setNewProdName(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-neutral-50 border border-neutral-300 rounded-lg"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1">
                    Kategori
                  </label>
                  <select
                    value={newProdCategory}
                    onChange={(e) => setNewProdCategory(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-neutral-50 border border-neutral-300 rounded-lg"
                  >
                    {categories.filter((c) => c !== 'Semua').map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1">
                    Stok Awal
                  </label>
                  <input
                    type="number"
                    value={newProdStock}
                    onChange={(e) => setNewProdStock(parseInt(e.target.value || '0', 10))}
                    className="w-full px-3 py-2 text-xs font-mono bg-neutral-50 border border-neutral-300 rounded-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1">
                    Harga Jual (Rp)
                  </label>
                  <input
                    type="number"
                    value={newProdPrice}
                    onChange={(e) => setNewProdPrice(parseInt(e.target.value || '0', 10))}
                    className="w-full px-3 py-2 text-xs font-mono font-bold bg-neutral-50 border border-neutral-300 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1">
                    HPP / Biaya Modal (Rp)
                  </label>
                  <input
                    type="number"
                    value={newProdCost}
                    onChange={(e) => setNewProdCost(parseInt(e.target.value || '0', 10))}
                    className="w-full px-3 py-2 text-xs font-mono bg-neutral-50 border border-neutral-300 rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">
                  Barcode / Kode EAN (Opsional)
                </label>
                <input
                  type="text"
                  placeholder="899..."
                  value={newProdBarcode}
                  onChange={(e) => setNewProdBarcode(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-mono bg-neutral-50 border border-neutral-300 rounded-lg"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddProductOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-neutral-600 hover:bg-neutral-100 rounded-lg"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold text-white bg-red-700 hover:bg-red-800 rounded-lg"
                >
                  Simpan Produk
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
