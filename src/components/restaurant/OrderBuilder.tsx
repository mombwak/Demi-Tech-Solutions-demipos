import React, { useState, useMemo } from 'react';
import { 
  ArrowLeft, 
  Search, 
  Plus, 
  Minus, 
  Trash2, 
  Send, 
  Receipt, 
  Split, 
  Users, 
  FileText, 
  Flame, 
  Beer, 
  Utensils, 
  Tag,
  Check
} from 'lucide-react';
import { 
  DiningTable, 
  Order, 
  OrderItem, 
  Product, 
  Category,
  ProductDepartment 
} from '../../types';
import { SEED_CATEGORIES, SEED_PRODUCTS } from '../../data/seedData';
import { formatKES, calculateTaxBreakdown, posAudio } from '../../utils/formatters';
import { useAuth } from '../../context/AuthContext';
import { usePos } from '../../context/PosContext';

interface OrderBuilderProps {
  table: DiningTable;
  onBackToFloor: () => void;
  onOpenSplitBill: (order: Order) => void;
  onOpenCheckout: (order: Order) => void;
}

export const OrderBuilder: React.FC<OrderBuilderProps> = ({
  table,
  onBackToFloor,
  onOpenSplitBill,
  onOpenCheckout,
}) => {
  const { currentUser, currentTenant, currentBranch } = useAuth();
  const { orders, createOrUpdateOrder, dispatchKot } = usePos();

  // Load active order or initialize new draft
  const existingOrder = table.currentOrderId ? orders[table.currentOrderId] : null;

  const [activeItems, setActiveItems] = useState<OrderItem[]>(
    existingOrder ? [...existingOrder.items] : []
  );
  const [guestCount, setGuestCount] = useState<number>(
    existingOrder?.guestCount || table.guestCount || 2
  );
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeSeat, setActiveSeat] = useState<number>(1);
  const [editingNotesItemId, setEditingNotesItemId] = useState<string | null>(null);
  const [noteText, setNoteText] = useState<string>('');

  // Filter products by category and search
  const filteredProducts = useMemo(() => {
    return SEED_PRODUCTS.filter(p => {
      const matchCat = selectedCategoryId === 'all' || p.categoryId === selectedCategoryId;
      const matchQuery = !searchQuery || 
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.barcode && p.barcode.includes(searchQuery));
      return matchCat && matchQuery && p.department !== 'RETAIL';
    });
  }, [selectedCategoryId, searchQuery]);

  // Compute live subtotal & grand total
  const { subtotal, taxTotal, grandTotal } = useMemo(() => {
    const gross = activeItems.reduce((acc, item) => acc + item.unitPrice * item.quantity, 0);
    const tax = calculateTaxBreakdown(gross, 16);
    return {
      subtotal: tax.taxableAmount,
      taxTotal: tax.taxAmount,
      grandTotal: gross,
    };
  }, [activeItems]);

  const handleAddItem = (product: Product) => {
    posAudio.playBeep();
    setActiveItems(prev => {
      // Check if same product & same seat exists
      const existingIdx = prev.findIndex(
        i => i.productId === product.id && i.seatNumber === activeSeat && i.kotStatus === 'NEW'
      );
      if (existingIdx >= 0) {
        const updated = [...prev];
        updated[existingIdx] = {
          ...updated[existingIdx],
          quantity: updated[existingIdx].quantity + 1
        };
        return updated;
      }
      const newItem: OrderItem = {
        id: `item-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        productId: product.id,
        productName: product.name,
        department: product.department,
        unitPrice: product.sellingPriceKes,
        quantity: 1,
        seatNumber: activeSeat,
        kotStatus: 'NEW'
      };
      return [...prev, newItem];
    });
  };

  const handleQuantityChange = (itemId: string, delta: number) => {
    posAudio.playBeep();
    setActiveItems(prev =>
      prev
        .map(item => {
          if (item.id === itemId) {
            const nextQty = item.quantity + delta;
            return nextQty > 0 ? { ...item, quantity: nextQty } : null;
          }
          return item;
        })
        .filter(Boolean) as OrderItem[]
    );
  };

  const handleRemoveItem = (itemId: string) => {
    posAudio.playBeep();
    setActiveItems(prev => prev.filter(i => i.id !== itemId));
  };

  const handleSaveNote = (itemId: string) => {
    posAudio.playBeep();
    setActiveItems(prev =>
      prev.map(i => (i.id === itemId ? { ...i, notes: noteText } : i))
    );
    setEditingNotesItemId(null);
    setNoteText('');
  };

  // Build order object
  const getOrderPayload = (status: 'OPEN' | 'BILLED'): Order => {
    return {
      id: existingOrder?.id || `ord-${Date.now()}`,
      tenantId: currentTenant.id,
      branchId: currentBranch.id,
      tableId: table.id,
      tableNumber: table.tableNumber,
      waiterId: existingOrder?.waiterId || currentUser.id,
      waiterName: existingOrder?.waiterName || currentUser.name,
      orderType: 'DINE_IN',
      guestCount,
      items: activeItems,
      subtotal,
      taxTotal,
      discountTotal: 0,
      grandTotal,
      status,
      createdAt: existingOrder?.createdAt || new Date().toISOString()
    };
  };

  const handleFireKot = () => {
    const unsentItems = activeItems.filter(i => i.kotStatus === 'NEW');
    if (unsentItems.length === 0) {
      alert('All items have already been dispatched to kitchen/bar!');
      return;
    }

    const orderPayload = getOrderPayload('OPEN');
    // Mark items as SENT_TO_KITCHEN
    const updatedItems = activeItems.map(i => ({
      ...i,
      kotStatus: 'SENT_TO_KITCHEN' as const
    }));
    orderPayload.items = updatedItems;

    createOrUpdateOrder(orderPayload);
    setActiveItems(updatedItems);

    // Dispatch KOT routing to Kitchen and Bar
    dispatchKot(orderPayload.id, unsentItems, table.tableNumber, currentUser.name);
  };

  const handleCheckout = () => {
    const orderPayload = getOrderPayload('BILLED');
    createOrUpdateOrder(orderPayload);
    onOpenCheckout(orderPayload);
  };

  const handleSplitBill = () => {
    const orderPayload = getOrderPayload('OPEN');
    createOrUpdateOrder(orderPayload);
    onOpenSplitBill(orderPayload);
  };

  const handleSaveAndExit = () => {
    if (activeItems.length > 0) {
      const orderPayload = getOrderPayload('OPEN');
      createOrUpdateOrder(orderPayload);
    }
    onBackToFloor();
  };

  const unsentCount = activeItems.filter(i => i.kotStatus === 'NEW').length;

  return (
    <div className="flex-1 flex flex-col lg:flex-row h-full overflow-hidden bg-gray-100">
      {/* LEFT / CENTER: Category pills & Product selection grid */}
      <div className="flex-1 flex flex-col h-full overflow-hidden bg-white border-r border-gray-200">
        {/* Header Bar */}
        <div className="p-3.5 border-b border-gray-200 flex items-center justify-between gap-3 bg-gray-50/70">
          <button
            type="button"
            id="back-to-floor-btn"
            onClick={handleSaveAndExit}
            className="flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-gray-100 text-gray-700 border border-gray-300 rounded-xl text-xs font-bold transition-colors cursor-pointer shadow-2xs"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Floor Plan</span>
          </button>

          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-gray-800">
              Table {table.tableNumber}
            </span>
            <span className="text-gray-300">•</span>
            <div className="flex items-center gap-1 text-xs text-gray-500">
              <Users className="w-3.5 h-3.5" />
              <span>Guests:</span>
              <select
                value={guestCount}
                onChange={(e) => setGuestCount(Number(e.target.value))}
                className="bg-white border border-gray-300 rounded-md px-1.5 py-0.5 text-xs font-bold text-gray-800"
              >
                {[1, 2, 3, 4, 5, 6, 8, 10, 12].map(n => (
                  <option key={n} value={n}>{n} Pax</option>
                ))}
              </select>
            </div>
          </div>

          {/* Search box */}
          <div className="relative max-w-xs w-full">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              id="product-search-input"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search items (Nyama, Tusker, Ugali)..."
              className="w-full pl-9 pr-3 py-1.5 bg-white border border-gray-300 rounded-xl text-xs text-gray-800 focus:outline-none focus:border-emerald-500"
            />
          </div>
        </div>

        {/* Category Horizontal Scrolling Tabs */}
        <div className="px-4 py-2.5 bg-gray-50 border-b border-gray-200 flex items-center gap-2 overflow-x-auto select-none shrink-0">
          <button
            type="button"
            id="cat-pill-all"
            onClick={() => {
              posAudio.playBeep();
              setSelectedCategoryId('all');
            }}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
              selectedCategoryId === 'all'
                ? 'bg-emerald-700 text-white shadow-sm'
                : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
            }`}
          >
            All Menu Items
          </button>
          {SEED_CATEGORIES.filter(c => c.department !== 'RETAIL').map(cat => (
            <button
              key={cat.id}
              type="button"
              id={`cat-pill-${cat.id}`}
              onClick={() => {
                posAudio.playBeep();
                setSelectedCategoryId(cat.id);
              }}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                selectedCategoryId === cat.id
                  ? 'bg-emerald-700 text-white shadow-sm'
                  : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {/* Products Grid */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {filteredProducts.map(product => {
              const itemInCart = activeItems.find(i => i.productId === product.id);
              return (
                <button
                  key={product.id}
                  type="button"
                  id={`prod-card-${product.sku.toLowerCase().replace(/[^a-z0-9]/g, '-')}`}
                  onClick={() => handleAddItem(product)}
                  className="p-3 bg-white hover:bg-emerald-50/40 border border-gray-200 hover:border-emerald-400 rounded-2xl flex flex-col justify-between text-left transition-all cursor-pointer shadow-2xs hover:shadow-md min-h-[120px] relative group"
                >
                  <div>
                    <div className="flex items-start justify-between gap-1">
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider ${
                        product.department === 'GRILL' ? 'bg-red-100 text-red-800' :
                        product.department === 'BAR' ? 'bg-amber-100 text-amber-800' :
                        'bg-blue-100 text-blue-800'
                      }`}>
                        {product.department}
                      </span>
                      {itemInCart && (
                        <span className="w-5 h-5 rounded-full bg-emerald-600 text-white text-[11px] font-black flex items-center justify-center">
                          {itemInCart.quantity}
                        </span>
                      )}
                    </div>
                    <h4 className="text-xs font-bold text-gray-900 mt-2 leading-tight group-hover:text-emerald-700 transition-colors">
                      {product.name}
                    </h4>
                  </div>
                  <div className="mt-2 text-sm font-black text-emerald-800 font-mono">
                    {formatKES(product.sellingPriceKes)}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* RIGHT: Active Order Ticket & Checkout Actions */}
      <div className="w-full lg:w-[420px] bg-white border-l border-gray-200 flex flex-col h-full shadow-lg">
        {/* Ticket Header */}
        <div className="p-3.5 bg-gray-900 text-white flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-base font-black text-white">Order: Table {table.tableNumber}</span>
              <span className="px-2 py-0.5 bg-emerald-800 text-emerald-200 rounded text-[10px] font-bold">
                {table.status}
              </span>
            </div>
            <p className="text-xs text-gray-400">Server: {table.waiterName || currentUser.name}</p>
          </div>

          {/* Seat Filter selector for assigning courses / seats */}
          <div className="flex items-center gap-1 bg-gray-800 p-1 rounded-lg">
            <span className="text-[10px] text-gray-400 px-1">Seat:</span>
            {[1, 2, 3, 4].map(s => (
              <button
                key={s}
                type="button"
                id={`seat-selector-${s}`}
                onClick={() => {
                  posAudio.playBeep();
                  setActiveSeat(s);
                }}
                className={`w-6 h-6 rounded text-xs font-bold cursor-pointer ${
                  activeSeat === s ? 'bg-emerald-500 text-white' : 'text-gray-400 hover:text-white'
                }`}
              >
                S{s}
              </button>
            ))}
          </div>
        </div>

        {/* Order Items List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2 divide-y divide-gray-100">
          {activeItems.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-gray-400 p-6 text-center">
              <Utensils className="w-10 h-10 stroke-[1.5] text-gray-300 mb-2" />
              <p className="font-semibold text-sm text-gray-600">No items added yet</p>
              <p className="text-xs text-gray-400 mt-1">Tap items on the left menu grid to build the customer's order</p>
            </div>
          ) : (
            activeItems.map(item => (
              <div key={item.id} className="pt-2.5 first:pt-0">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-gray-900 leading-tight">
                        {item.productName}
                      </span>
                      {item.seatNumber && (
                        <span className="px-1 py-0.2 bg-gray-100 text-gray-600 text-[9px] font-bold rounded">
                          S{item.seatNumber}
                        </span>
                      )}
                      {item.kotStatus === 'SENT_TO_KITCHEN' ? (
                        <span className="px-1.5 py-0.2 bg-blue-100 text-blue-800 text-[9px] font-bold rounded flex items-center gap-0.5">
                          <Check className="w-2.5 h-2.5" /> Sent
                        </span>
                      ) : (
                        <span className="px-1.5 py-0.2 bg-amber-100 text-amber-800 text-[9px] font-bold rounded">
                          New
                        </span>
                      )}
                    </div>

                    <div className="text-xs text-gray-500 font-mono mt-0.5">
                      {formatKES(item.unitPrice)} each
                    </div>

                    {item.notes && (
                      <div className="mt-1 text-[11px] text-amber-900 bg-amber-50 p-1 rounded border border-amber-200 flex items-center gap-1">
                        <FileText className="w-3 h-3 text-amber-600 shrink-0" />
                        <span>{item.notes}</span>
                      </div>
                    )}
                  </div>

                  {/* Quantity & Delete Controls */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden bg-gray-50">
                      <button
                        type="button"
                        id={`qty-minus-${item.id}`}
                        onClick={() => handleQuantityChange(item.id, -1)}
                        className="w-7 h-7 flex items-center justify-center hover:bg-gray-200 text-gray-700 cursor-pointer"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="w-7 text-center font-bold text-xs text-gray-900">
                        {item.quantity}
                      </span>
                      <button
                        type="button"
                        id={`qty-plus-${item.id}`}
                        onClick={() => handleQuantityChange(item.id, 1)}
                        className="w-7 h-7 flex items-center justify-center hover:bg-gray-200 text-gray-700 cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="w-20 text-right font-bold text-xs text-gray-900 font-mono">
                      {formatKES(item.unitPrice * item.quantity)}
                    </div>

                    <button
                      type="button"
                      id={`remove-item-${item.id}`}
                      onClick={() => handleRemoveItem(item.id)}
                      className="p-1 text-gray-400 hover:text-red-600 cursor-pointer"
                      title="Remove item"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Note Editor trigger */}
                <div className="mt-1 flex items-center gap-2">
                  {editingNotesItemId === item.id ? (
                    <div className="flex items-center gap-1 w-full mt-1">
                      <input
                        type="text"
                        value={noteText}
                        onChange={(e) => setNoteText(e.target.value)}
                        placeholder="Add special instructions (e.g. no pepper, well done)..."
                        className="flex-1 px-2 py-1 text-xs border border-emerald-400 rounded-md focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => handleSaveNote(item.id)}
                        className="px-2 py-1 bg-emerald-600 text-white rounded-md text-xs font-bold cursor-pointer"
                      >
                        Save
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        setEditingNotesItemId(item.id);
                        setNoteText(item.notes || '');
                      }}
                      className="text-[10px] text-gray-500 hover:text-emerald-700 underline cursor-pointer"
                    >
                      {item.notes ? 'Edit Note' : '+ Special instructions / Note'}
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Bill Breakdown Summary */}
        <div className="p-3.5 bg-gray-50 border-t border-gray-200 space-y-1.5 text-xs">
          <div className="flex justify-between text-gray-600">
            <span>Net Taxable Subtotal:</span>
            <span className="font-mono">{formatKES(subtotal)}</span>
          </div>
          <div className="flex justify-between text-gray-600">
            <span>VAT (16% Included):</span>
            <span className="font-mono">{formatKES(taxTotal)}</span>
          </div>
          <div className="flex justify-between text-base font-black text-gray-900 pt-1 border-t border-gray-200">
            <span>Total Payable:</span>
            <span className="font-mono text-emerald-700">{formatKES(grandTotal)}</span>
          </div>
        </div>

        {/* Action Controls */}
        <div className="p-3 bg-white border-t border-gray-200 grid grid-cols-2 gap-2">
          {/* Fire KOT to Kitchen & Bar */}
          <button
            type="button"
            id="fire-kot-button"
            disabled={unsentCount === 0}
            onClick={handleFireKot}
            className={`py-3 px-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer shadow-xs transition-colors ${
              unsentCount > 0
                ? 'bg-amber-600 hover:bg-amber-700 text-white'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }`}
          >
            <Send className="w-4 h-4" />
            <span>Fire KOT ({unsentCount} New)</span>
          </button>

          {/* Split Bill */}
          <button
            type="button"
            id="split-bill-button"
            disabled={activeItems.length === 0}
            onClick={handleSplitBill}
            className="py-3 px-2 bg-gray-100 hover:bg-gray-200 text-gray-800 border border-gray-300 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer shadow-xs transition-colors disabled:opacity-50"
          >
            <Split className="w-4 h-4 text-emerald-700" />
            <span>Split Bill</span>
          </button>

          {/* Save & Hold */}
          <button
            type="button"
            id="save-hold-button"
            onClick={handleSaveAndExit}
            className="py-3 px-2 bg-gray-800 hover:bg-gray-900 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer shadow-xs transition-colors"
          >
            <span>Hold & Exit</span>
          </button>

          {/* Checkout / Pay Bill */}
          <button
            type="button"
            id="checkout-pay-button"
            disabled={activeItems.length === 0}
            onClick={handleCheckout}
            className="py-3 px-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer shadow-md transition-colors disabled:opacity-50"
          >
            <Receipt className="w-4 h-4" />
            <span>Checkout / Pay</span>
          </button>
        </div>
      </div>
    </div>
  );
};
