import React, { useState, useRef, useEffect } from 'react';
import { 
  ScanBarcode, 
  Search, 
  Plus, 
  Minus, 
  Trash2, 
  Scale, 
  Receipt, 
  CreditCard, 
  Smartphone, 
  Banknote,
  Sparkles
} from 'lucide-react';
import { Product, OrderItem, Order } from '../../types';
import { SEED_PRODUCTS } from '../../data/seedData';
import { formatKES, calculateTaxBreakdown, posAudio } from '../../utils/formatters';
import { useAuth } from '../../context/AuthContext';

interface RetailPosProps {
  onOpenCheckout: (order: Order) => void;
}

export const RetailPos: React.FC<RetailPosProps> = ({ onOpenCheckout }) => {
  const { currentTenant, currentBranch, currentUser } = useAuth();
  const [barcodeInput, setBarcodeInput] = useState<string>('');
  const [cartItems, setCartItems] = useState<OrderItem[]>([]);
  const [activeSearch, setActiveSearch] = useState<string>('');
  const barcodeInputRef = useRef<HTMLInputElement>(null);

  // Auto-focus barcode scanner input
  useEffect(() => {
    barcodeInputRef.current?.focus();
  }, []);

  const addProductToCart = (product: Product, quantity = 1) => {
    posAudio.playBeep();
    setCartItems(prev => {
      const idx = prev.findIndex(i => i.productId === product.id);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = { ...copy[idx], quantity: copy[idx].quantity + quantity };
        return copy;
      }
      return [
        ...prev,
        {
          id: `item-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
          productId: product.id,
          productName: product.name,
          department: product.department,
          unitPrice: product.sellingPriceKes,
          quantity,
          kotStatus: 'NEW'
        }
      ];
    });
  };

  const handleBarcodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!barcodeInput.trim()) return;

    const matchedProduct = SEED_PRODUCTS.find(
      p => p.barcode === barcodeInput.trim() || p.sku.toLowerCase() === barcodeInput.trim().toLowerCase()
    );

    if (matchedProduct) {
      addProductToCart(matchedProduct);
      setBarcodeInput('');
    } else {
      alert(`Barcode "${barcodeInput}" not found in catalog.`);
      setBarcodeInput('');
    }
  };

  const handleQuantity = (id: string, delta: number) => {
    posAudio.playBeep();
    setCartItems(prev =>
      prev
        .map(i => (i.id === id ? { ...i, quantity: Math.max(1, i.quantity + delta) } : i))
        .filter(Boolean) as OrderItem[]
    );
  };

  const handleRemove = (id: string) => {
    posAudio.playBeep();
    setCartItems(prev => prev.filter(i => i.id !== id));
  };

  const { subtotal, taxTotal, grandTotal } = React.useMemo(() => {
    const gross = cartItems.reduce((acc, i) => acc + i.unitPrice * i.quantity, 0);
    const tax = calculateTaxBreakdown(gross, 16);
    return {
      subtotal: tax.taxableAmount,
      taxTotal: tax.taxAmount,
      grandTotal: gross
    };
  }, [cartItems]);

  const handleFastTenderCheckout = () => {
    if (cartItems.length === 0) return;
    const orderPayload: Order = {
      id: `ord-rtl-${Date.now()}`,
      tenantId: currentTenant.id,
      branchId: currentBranch.id,
      waiterId: currentUser.id,
      waiterName: currentUser.name,
      orderType: 'RETAIL',
      guestCount: 1,
      items: cartItems,
      subtotal,
      taxTotal,
      discountTotal: 0,
      grandTotal,
      status: 'BILLED',
      createdAt: new Date().toISOString()
    };
    onOpenCheckout(orderPayload);
  };

  // Filter catalog items
  const displayProducts = SEED_PRODUCTS.filter(p => {
    if (!activeSearch) return true;
    return (
      p.name.toLowerCase().includes(activeSearch.toLowerCase()) ||
      p.sku.toLowerCase().includes(activeSearch.toLowerCase()) ||
      (p.barcode && p.barcode.includes(activeSearch))
    );
  });

  return (
    <div className="flex-1 flex flex-col lg:flex-row h-full overflow-hidden bg-gray-100">
      {/* Left: Barcode scan input + Quick Product Grid */}
      <div className="flex-1 flex flex-col h-full bg-white border-r border-gray-200 overflow-hidden">
        {/* Barcode Search Header */}
        <div className="p-4 bg-gray-900 text-white flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <form onSubmit={handleBarcodeSubmit} className="flex-1 relative">
            <ScanBarcode className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-emerald-400" />
            <input
              ref={barcodeInputRef}
              type="text"
              id="barcode-scanner-field"
              value={barcodeInput}
              onChange={(e) => setBarcodeInput(e.target.value)}
              placeholder="Scan Barcode (or type SKU / Barcode and press Enter)..."
              className="w-full pl-11 pr-4 py-2.5 bg-gray-800 text-white placeholder-gray-400 border border-gray-700 rounded-xl text-sm font-mono focus:outline-none focus:border-emerald-500"
            />
          </form>

          {/* Quick Search */}
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={activeSearch}
              onChange={(e) => setActiveSearch(e.target.value)}
              placeholder="Search catalog..."
              className="w-full pl-9 pr-3 py-2 bg-gray-800 text-white placeholder-gray-400 border border-gray-700 rounded-xl text-xs focus:outline-none focus:border-emerald-500"
            />
          </div>
        </div>

        {/* Demo Barcode Shortcut Chips */}
        <div className="px-4 py-2.5 bg-emerald-50/70 border-b border-emerald-100 flex items-center gap-2 overflow-x-auto select-none">
          <div className="flex items-center gap-1 text-[11px] font-bold text-emerald-900 shrink-0">
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
            <span>Barcode Emulators:</span>
          </div>
          {SEED_PRODUCTS.filter(p => p.barcode).slice(0, 7).map(p => (
            <button
              key={p.id}
              type="button"
              id={`barcode-sim-${p.sku.toLowerCase()}`}
              onClick={() => addProductToCart(p)}
              className="px-2.5 py-1 bg-white hover:bg-emerald-100 text-emerald-950 border border-emerald-300 rounded-lg text-xs font-semibold cursor-pointer whitespace-nowrap shadow-2xs transition-colors"
            >
              + {p.name.split(' ')[0]} ({p.barcode})
            </button>
          ))}
        </div>

        {/* Product Catalog Grid */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {displayProducts.map(p => (
              <button
                key={p.id}
                type="button"
                id={`retail-card-${p.sku.toLowerCase()}`}
                onClick={() => addProductToCart(p)}
                className="p-3 bg-white hover:bg-gray-50 border border-gray-200 hover:border-emerald-500 rounded-xl text-left flex flex-col justify-between cursor-pointer transition-all shadow-2xs hover:shadow-xs min-h-[105px]"
              >
                <div>
                  <span className="text-[9px] font-bold text-gray-500 uppercase tracking-wider font-mono">
                    {p.sku}
                  </span>
                  <h4 className="text-xs font-bold text-gray-900 leading-snug mt-1 line-clamp-2">
                    {p.name}
                  </h4>
                </div>
                <div className="mt-2 text-sm font-black text-emerald-800 font-mono">
                  {formatKES(p.sellingPriceKes)}
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Right: Retail Cart & Checkout */}
      <div className="w-full lg:w-[420px] bg-white border-l border-gray-200 flex flex-col h-full shadow-lg">
        <div className="p-3.5 bg-gray-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ScanBarcode className="w-5 h-5 text-emerald-400" />
            <h3 className="font-bold text-base">Retail Lane Till</h3>
          </div>
          <span className="text-xs text-gray-400 font-mono">
            {cartItems.length} {cartItems.length === 1 ? 'item' : 'items'}
          </span>
        </div>

        {/* Cart items */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2 divide-y divide-gray-100">
          {cartItems.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-gray-400 p-6 text-center">
              <ScanBarcode className="w-10 h-10 stroke-[1.5] text-gray-300 mb-2" />
              <p className="font-semibold text-sm text-gray-600">Scan Barcode or Tap Item</p>
              <p className="text-xs text-gray-400 mt-1">Barcode input remains armed for rapid continuous USB scanning</p>
            </div>
          ) : (
            cartItems.map(item => (
              <div key={item.id} className="pt-2.5 first:pt-0 flex items-center justify-between gap-2">
                <div className="flex-1">
                  <p className="text-xs font-bold text-gray-900 leading-tight">{item.productName}</p>
                  <p className="text-[11px] text-gray-500 font-mono mt-0.5">
                    {formatKES(item.unitPrice)} each
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden bg-gray-50">
                    <button
                      type="button"
                      onClick={() => handleQuantity(item.id, -1)}
                      className="w-7 h-7 flex items-center justify-center hover:bg-gray-200 text-gray-700 cursor-pointer"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="w-7 text-center font-bold text-xs text-gray-900">
                      {item.quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleQuantity(item.id, 1)}
                      className="w-7 h-7 flex items-center justify-center hover:bg-gray-200 text-gray-700 cursor-pointer"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>

                  <span className="w-20 text-right font-mono font-bold text-xs text-gray-900">
                    {formatKES(item.unitPrice * item.quantity)}
                  </span>

                  <button
                    type="button"
                    onClick={() => handleRemove(item.id)}
                    className="p-1 text-gray-400 hover:text-red-600 cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Totals & Fast Tender */}
        <div className="p-4 bg-gray-50 border-t border-gray-200 space-y-2">
          <div className="flex justify-between text-xs text-gray-600">
            <span>Net Taxable Subtotal:</span>
            <span className="font-mono">{formatKES(subtotal)}</span>
          </div>
          <div className="flex justify-between text-xs text-gray-600">
            <span>VAT (16% Included):</span>
            <span className="font-mono">{formatKES(taxTotal)}</span>
          </div>
          <div className="flex justify-between text-xl font-black text-gray-900 pt-1 border-t border-gray-200">
            <span>Grand Total:</span>
            <span className="font-mono text-emerald-700">{formatKES(grandTotal)}</span>
          </div>

          {/* Checkout Button */}
          <button
            type="button"
            id="retail-checkout-btn"
            disabled={cartItems.length === 0}
            onClick={handleFastTenderCheckout}
            className="w-full mt-2 py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-base rounded-xl shadow-md cursor-pointer transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <Receipt className="w-5 h-5" />
            <span>Checkout / Multi-Tender Pay</span>
          </button>
        </div>
      </div>
    </div>
  );
};
