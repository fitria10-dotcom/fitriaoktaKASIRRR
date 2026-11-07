import React, { useState } from 'react';
import {
  Search,
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  Utensils,
  Coffee,
  Sparkles,
  AlertTriangle,
  Tag,
  CreditCard,
  UserCheck,
  Percent,
  Edit2
} from 'lucide-react';
import { Branch, CartItem, PaymentMethod, Product, Transaction, User } from '../../types';
import { soundManager } from '../../services/audioService';
import { PaymentModal } from './PaymentModal';
import { ReceiptModal } from './ReceiptModal';
import confetti from 'canvas-confetti';

interface POSViewProps {
  products: Product[];
  activeBranch: Branch;
  activeUser: User;
  onCompleteTransaction: (transaction: Transaction, updatedProducts: Product[]) => void;
}

export const POSView: React.FC<POSViewProps> = ({
  products,
  activeBranch,
  activeUser,
  onCompleteTransaction,
}) => {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('Semua');
  const [customerName, setCustomerName] = useState('');
  const [orderType, setOrderType] = useState<'dine_in' | 'take_away' | 'delivery'>('dine_in');
  const [tableNumber, setTableNumber] = useState('Meja 01');
  const [discountAmount, setDiscountAmount] = useState<number>(0);
  const [showDiscountInput, setShowDiscountInput] = useState(false);
  const [editingNotesIndex, setEditingNotesIndex] = useState<number | null>(null);
  const [notesInput, setNotesInput] = useState('');

  // Payment & Receipt Modals
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  const [lastTransaction, setLastTransaction] = useState<Transaction | null>(null);

  const formatRupiah = (num: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(num);
  };

  const categories = ['Semua', 'Minuman Kopi', 'Non-Kopi', 'Pastry & Roti', 'Makanan Berat', 'Camilan'];

  // Filter products
  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.barcode.includes(searchQuery);

    const matchesCategory = selectedCategory === 'Semua' || p.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const getProductStock = (product: Product) => {
    if (!product || !product.stockByBranch) return 0;
    const branchKey = activeBranch?.id || 'b1';
    return product.stockByBranch[branchKey] ?? 0;
  };

  const addToCart = (product: Product) => {
    const currentStock = getProductStock(product);
    if (currentStock <= 0) {
      soundManager.playError();
      return;
    }

    soundManager.playBeep();
    setCart((prevCart) => {
      const existing = prevCart.find((item) => item.product.id === product.id);
      if (existing) {
        if (existing.quantity >= currentStock) {
          soundManager.playError();
          return prevCart;
        }
        return prevCart.map((item) =>
          item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prevCart, { product, quantity: 1 }];
    });
  };

  const updateQuantity = (productId: string, delta: number) => {
    soundManager.playBeep();
    setCart((prevCart) => {
      return prevCart
        .map((item) => {
          if (item.product.id === productId) {
            const currentStock = getProductStock(item.product);
            const newQty = item.quantity + delta;
            if (newQty > currentStock) {
              soundManager.playError();
              return item;
            }
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter(Boolean) as CartItem[];
    });
  };

  const removeFromCart = (productId: string) => {
    soundManager.playBeep();
    setCart((prev) => prev.filter((item) => item.product.id !== productId));
  };

  const clearCart = () => {
    soundManager.playBeep();
    setCart([]);
    setDiscountAmount(0);
  };

  // Financial calculations
  const subtotal = cart.reduce((acc, item) => acc + item.product.price * item.quantity, 0);
  const safeDiscount = Math.min(discountAmount, subtotal);
  const taxableAmount = Math.max(0, subtotal - safeDiscount);
  const taxPB1 = Math.round(taxableAmount * 0.1); // 10% PB1 Restaurant Tax
  const grandTotal = taxableAmount + taxPB1;

  const handleCheckoutClick = () => {
    if (cart.length === 0) {
      soundManager.playError();
      return;
    }
    soundManager.playBeep();
    setIsPaymentModalOpen(true);
  };

  const handleConfirmPayment = (method: PaymentMethod, amountPaid: number, change: number) => {
    setIsPaymentModalOpen(false);

    // Build Transaction object
    const newTx: Transaction = {
      id: `tr-${Date.now()}`,
      invoiceNumber: `INV-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(
        100 + Math.random() * 900
      )}`,
      branchId: activeBranch.id,
      branchName: activeBranch.name,
      cashierId: activeUser.id,
      cashierName: activeUser.name,
      customerName: customerName.trim() || 'Pelanggan Umum',
      orderType,
      tableNumber: orderType === 'dine_in' ? tableNumber : undefined,
      items: cart.map((item) => ({
        productId: item.product.id,
        productName: item.product.name,
        price: item.product.price,
        costPrice: item.product.costPrice,
        quantity: item.quantity,
        subtotal: item.product.price * item.quantity,
        notes: item.notes,
      })),
      subtotal,
      discount: safeDiscount,
      tax: taxPB1,
      total: grandTotal,
      paymentMethod: method,
      amountPaid,
      change,
      createdAt: new Date().toISOString(),
      status: 'selesai',
    };

    // Decrement stock in products
    const updatedProducts = products.map((prod) => {
      const cartItem = cart.find((c) => c.product.id === prod.id);
      if (cartItem) {
        const currentStock = prod.stockByBranch[activeBranch.id] ?? 0;
        return {
          ...prod,
          stockByBranch: {
            ...prod.stockByBranch,
            [activeBranch.id]: Math.max(0, currentStock - cartItem.quantity),
          },
        };
      }
      return prod;
    });

    // Sound & Confetti
    soundManager.playCashSuccess();
    try {
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.6 },
      });
    } catch {
      // safe fallback
    }

    onCompleteTransaction(newTx, updatedProducts);
    setLastTransaction(newTx);
    setIsReceiptModalOpen(true);

    // Reset cart
    setCart([]);
    setCustomerName('');
    setDiscountAmount(0);
  };

  const handleSaveNotes = (index: number) => {
    setCart((prev) =>
      prev.map((item, idx) => (idx === index ? { ...item, notes: notesInput.trim() } : item))
    );
    setEditingNotesIndex(null);
    setNotesInput('');
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
      {/* Left 8 Cols: Product Catalog & Search */}
      <div className="lg:col-span-7 xl:col-span-8 space-y-4">
        {/* Search & Category Filter Toolbar */}
        <div className="bg-white p-3.5 rounded-xl border border-neutral-200 shadow-2xs space-y-3">
          <div className="relative">
            <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Cari nama menu kopi, makanan, snack, atau scan barcode..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-neutral-50 border border-neutral-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-red-500 focus:bg-white"
            />
          </div>

          {/* Category Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {categories.map((cat) => {
              const isSelected = selectedCategory === cat;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => {
                    soundManager.playBeep();
                    setSelectedCategory(cat);
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                    isSelected
                      ? 'bg-neutral-900 text-white shadow-2xs'
                      : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200 hover:text-neutral-900'
                  }`}
                >
                  {cat}
                </button>
              );
            })}
          </div>
        </div>

        {/* Product Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3.5">
          {filteredProducts.map((product) => {
            const stock = getProductStock(product);
            const isOutOfStock = stock <= 0;
            const isLowStock = stock > 0 && stock <= product.minStock;
            const cartItem = cart.find((item) => item.product.id === product.id);

            return (
              <div
                key={product.id}
                onClick={() => !isOutOfStock && addToCart(product)}
                className={`group bg-white rounded-xl border overflow-hidden flex flex-col justify-between transition-all select-none shadow-2xs ${
                  isOutOfStock
                    ? 'opacity-60 border-neutral-200 cursor-not-allowed'
                    : 'border-neutral-200 hover:border-red-400 hover:shadow-xs cursor-pointer active:scale-98'
                }`}
              >
                <div>
                  {/* Product Image */}
                  <div className="relative aspect-4/3 bg-neutral-100 overflow-hidden">
                    <img
                      src={product.image}
                      alt={product.name}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />

                    {/* Stock indicator badge */}
                    <div className="absolute top-2 left-2 flex items-center gap-1">
                      {isOutOfStock ? (
                        <span className="text-[10px] bg-red-600 text-white font-bold px-2 py-0.5 rounded-md shadow-xs">
                          Habis
                        </span>
                      ) : isLowStock ? (
                        <span className="text-[10px] bg-amber-500 text-white font-bold px-2 py-0.5 rounded-md shadow-xs">
                          Sisa {stock}
                        </span>
                      ) : (
                        <span className="text-[10px] bg-neutral-900/80 backdrop-blur-xs text-white font-mono px-1.5 py-0.5 rounded-md">
                          Stok: {stock}
                        </span>
                      )}
                    </div>

                    {/* Cart quantity badge if in cart */}
                    {cartItem && (
                      <div className="absolute top-2 right-2 bg-red-600 text-white text-xs font-black w-6 h-6 rounded-full flex items-center justify-center shadow-md animate-scale">
                        {cartItem.quantity}
                      </div>
                    )}
                  </div>

                  {/* Product Info */}
                  <div className="p-3">
                    <div className="text-[10px] text-neutral-400 uppercase font-semibold">
                      {product.category}
                    </div>
                    <h3 className="font-bold text-xs text-neutral-900 leading-snug line-clamp-2 mt-0.5">
                      {product.name}
                    </h3>
                  </div>
                </div>

                {/* Price and Add button */}
                <div className="p-3 pt-0 flex items-center justify-between">
                  <span className="font-mono text-xs font-black text-red-700">
                    {formatRupiah(product.price)}
                  </span>
                  <div className="w-6 h-6 rounded-lg bg-neutral-100 group-hover:bg-red-700 group-hover:text-white text-neutral-700 flex items-center justify-center transition-colors">
                    <Plus className="w-3.5 h-3.5" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Right 4-5 Cols: Order Cart Sidebar */}
      <div className="lg:col-span-5 xl:col-span-4 bg-white rounded-2xl border border-neutral-200 shadow-2xs overflow-hidden flex flex-col sticky top-20">
        {/* Cart Header */}
        <div className="p-4 bg-neutral-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShoppingCart className="w-4 h-4 text-red-400" />
            <h2 className="text-sm font-bold tracking-tight">Layar Pesanan Kasir</h2>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-neutral-400">
              {cart.reduce((s, i) => s + i.quantity, 0)} item
            </span>
            {cart.length > 0 && (
              <button
                type="button"
                onClick={clearCart}
                className="text-[11px] text-neutral-400 hover:text-red-400 transition-colors cursor-pointer"
              >
                Reset
              </button>
            )}
          </div>
        </div>

        {/* Order Details: Customer & Order Type */}
        <div className="p-3.5 bg-neutral-50/80 border-b border-neutral-200 space-y-2.5">
          <div className="grid grid-cols-3 gap-1.5">
            {[
              { id: 'dine_in' as const, label: 'Dine In' },
              { id: 'take_away' as const, label: 'Take Away' },
              { id: 'delivery' as const, label: 'Delivery' },
            ].map((ot) => (
              <button
                key={ot.id}
                type="button"
                onClick={() => setOrderType(ot.id)}
                className={`py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                  orderType === ot.id
                    ? 'bg-red-700 text-white shadow-2xs'
                    : 'bg-white text-neutral-700 border border-neutral-200 hover:bg-neutral-100'
                }`}
              >
                {ot.label}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-2">
            <input
              type="text"
              placeholder="Nama Pelanggan (opsional)"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              className="px-2.5 py-1.5 text-xs bg-white border border-neutral-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-red-500"
            />
            {orderType === 'dine_in' ? (
              <input
                type="text"
                placeholder="No. Meja"
                value={tableNumber}
                onChange={(e) => setTableNumber(e.target.value)}
                className="px-2.5 py-1.5 text-xs bg-white border border-neutral-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-red-500"
              />
            ) : (
              <div className="px-2.5 py-1.5 text-xs text-neutral-400 bg-neutral-100 rounded-lg truncate">
                Non-Meja
              </div>
            )}
          </div>
        </div>

        {/* Cart Items List */}
        <div className="p-3.5 divide-y divide-neutral-100 max-h-[38vh] overflow-y-auto min-h-[160px]">
          {cart.length === 0 ? (
            <div className="text-center py-8 text-neutral-400 flex flex-col items-center justify-center">
              <ShoppingCart className="w-8 h-8 stroke-1 text-neutral-300 mb-2" />
              <div className="text-xs font-semibold text-neutral-600">Keranjang Masih Kosong</div>
              <div className="text-[11px] text-neutral-400 mt-0.5">
                Pilih menu di samping untuk menambahkan pesanan
              </div>
            </div>
          ) : (
            cart.map((item, idx) => (
              <div key={item.product.id} className="py-2.5 first:pt-0 last:pb-0">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <h4 className="text-xs font-bold text-neutral-900 truncate">
                      {item.product.name}
                    </h4>
                    <div className="text-[11px] text-neutral-500 font-mono">
                      {formatRupiah(item.product.price)}
                    </div>
                    {item.notes && (
                      <div className="text-[10px] text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded-sm inline-block mt-0.5">
                        Catatan: {item.notes}
                      </div>
                    )}
                  </div>

                  {/* Quantity modifier */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => updateQuantity(item.product.id, -1)}
                      className="w-6 h-6 rounded-md bg-neutral-100 hover:bg-neutral-200 text-neutral-700 flex items-center justify-center cursor-pointer"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="w-6 text-center font-mono font-bold text-xs text-neutral-900">
                      {item.quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() => updateQuantity(item.product.id, 1)}
                      className="w-6 h-6 rounded-md bg-neutral-100 hover:bg-neutral-200 text-neutral-700 flex items-center justify-center cursor-pointer"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                    <button
                      type="button"
                      onClick={() => removeFromCart(item.product.id)}
                      className="p-1 text-neutral-400 hover:text-red-600 ml-1 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Edit notes trigger */}
                {editingNotesIndex === idx ? (
                  <div className="mt-2 flex gap-1">
                    <input
                      type="text"
                      placeholder="Contoh: Less sugar / Pisah sambal"
                      value={notesInput}
                      onChange={(e) => setNotesInput(e.target.value)}
                      className="flex-1 px-2 py-1 text-xs bg-neutral-50 border border-neutral-300 rounded-md focus:outline-hidden"
                    />
                    <button
                      type="button"
                      onClick={() => handleSaveNotes(idx)}
                      className="px-2 py-1 text-xs bg-red-700 text-white rounded-md font-bold cursor-pointer"
                    >
                      OK
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setEditingNotesIndex(idx);
                      setNotesInput(item.notes || '');
                    }}
                    className="text-[10px] text-neutral-400 hover:text-red-700 flex items-center gap-1 mt-1 cursor-pointer"
                  >
                    <Edit2 className="w-2.5 h-2.5" /> {item.notes ? 'Ubah Catatan' : '+ Catatan Item'}
                  </button>
                )}
              </div>
            ))
          )}
        </div>

        {/* Calculation Summary */}
        <div className="p-4 bg-neutral-50 border-t border-neutral-200 space-y-2 text-xs">
          <div className="flex justify-between text-neutral-600">
            <span>Subtotal</span>
            <span className="font-mono tabular-nums font-semibold">{formatRupiah(subtotal)}</span>
          </div>

          {/* Discount Section with Permission Enforcement */}
          <div className="flex justify-between items-center text-neutral-600">
            <div className="flex items-center gap-1">
              <span>Diskon Manual</span>
              {activeUser.permissions.change_prices ? (
                <button
                  type="button"
                  onClick={() => setShowDiscountInput(!showDiscountInput)}
                  className="text-[10px] text-red-700 hover:underline cursor-pointer"
                >
                  {showDiscountInput ? 'Tutup' : 'Ubah'}
                </button>
              ) : (
                <span className="text-[10px] text-neutral-400" title="Kasir tidak memiliki izin diskon manual">
                  (Terkunci)
                </span>
              )}
            </div>
            <span className="font-mono tabular-nums text-red-600 font-semibold">
              -{formatRupiah(safeDiscount)}
            </span>
          </div>

          {showDiscountInput && activeUser.permissions.change_prices && (
            <div className="p-2 bg-white rounded-lg border border-neutral-200 flex items-center gap-2">
              <span className="text-xs text-neutral-500">Rp</span>
              <input
                type="number"
                placeholder="0"
                value={discountAmount || ''}
                onChange={(e) => setDiscountAmount(Math.max(0, parseInt(e.target.value || '0', 10)))}
                className="w-full text-xs font-mono font-bold bg-neutral-50 px-2 py-1 rounded-md border border-neutral-200"
              />
            </div>
          )}

          <div className="flex justify-between text-neutral-600">
            <span>Pajak Restoran PB1 (10%)</span>
            <span className="font-mono tabular-nums">{formatRupiah(taxPB1)}</span>
          </div>

          <div className="flex justify-between text-base font-bold text-neutral-900 pt-2 border-t border-neutral-200">
            <span>Total Tagihan</span>
            <span className="font-mono tabular-nums text-red-700 text-lg">
              {formatRupiah(grandTotal)}
            </span>
          </div>

          {/* Checkout CTA */}
          <button
            type="button"
            disabled={cart.length === 0}
            onClick={handleCheckoutClick}
            className={`w-full py-3.5 rounded-xl font-bold text-xs uppercase tracking-wider text-white shadow-xs transition-all cursor-pointer flex items-center justify-center gap-2 mt-2 ${
              cart.length > 0
                ? 'bg-red-700 hover:bg-red-800 active:scale-98'
                : 'bg-neutral-300 cursor-not-allowed opacity-60'
            }`}
          >
            <CreditCard className="w-4 h-4" />
            <span>Bayar Pesanan ({formatRupiah(grandTotal)})</span>
          </button>
        </div>
      </div>

      {/* Payment Modal */}
      <PaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        grandTotal={grandTotal}
        onConfirmPayment={handleConfirmPayment}
      />

      {/* Receipt Modal */}
      <ReceiptModal
        isOpen={isReceiptModalOpen}
        onClose={() => setIsReceiptModalOpen(false)}
        transaction={lastTransaction}
      />
    </div>
  );
};
