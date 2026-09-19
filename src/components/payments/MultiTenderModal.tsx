import React, { useState, useMemo } from 'react';
import { 
  X, 
  Banknote, 
  Smartphone, 
  CreditCard, 
  Receipt, 
  CheckCircle2, 
  AlertCircle,
  Plus,
  Trash2,
  Clock,
  Sparkles
} from 'lucide-react';
import { Order, PaymentTender, PaymentMethod, Sale } from '../../types';
import { formatKES, calculateTaxBreakdown, posAudio } from '../../utils/formatters';
import { useAuth } from '../../context/AuthContext';
import { usePos } from '../../context/PosContext';
import { TouchKeypad } from '../common/TouchKeypad';

interface MultiTenderModalProps {
  order: Order;
  onClose: () => void;
  onSaleComplete: (sale: Sale) => void;
  initialPayAmount?: number;
  splitDescription?: string;
}

export const MultiTenderModal: React.FC<MultiTenderModalProps> = ({
  order,
  onClose,
  onSaleComplete,
  initialPayAmount,
  splitDescription,
}) => {
  const { currentTenant, currentBranch, currentUser } = useAuth();
  const { completeSale } = usePos();

  const totalDue = initialPayAmount || order.grandTotal;
  const [payments, setPayments] = useState<PaymentTender[]>([]);
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>('CASH');
  const [tenderInput, setTenderInput] = useState<string>('');

  // M-Pesa STK Push Simulation State
  const [mpesaPhone, setMpesaPhone] = useState<string>('0712345678');
  const [mpesaState, setMpesaState] = useState<'IDLE' | 'STK_SENT' | 'CONFIRMED' | 'FAILED'>('IDLE');
  const [mpesaCode, setMpesaCode] = useState<string>('');
  const [stkTimer, setStkTimer] = useState<number>(30);

  // Compute remaining balance
  const totalApplied = payments.reduce((sum, p) => sum + p.amountApplied, 0);
  const remainingDue = Math.max(0, totalDue - totalApplied);

  // Pre-fill tender input with remaining due when switching method
  const handleSelectMethod = (method: PaymentMethod) => {
    posAudio.playBeep();
    setSelectedMethod(method);
    setTenderInput(remainingDue > 0 ? remainingDue.toString() : '');
  };

  const handleAddCashPayment = (tenderedValue: number) => {
    if (tenderedValue <= 0) return;
    const applied = Math.min(tenderedValue, remainingDue);
    const change = Math.max(0, tenderedValue - remainingDue);

    const newPayment: PaymentTender = {
      id: `pay-${Date.now()}`,
      method: 'CASH',
      amountTendered: tenderedValue,
      amountApplied: applied,
      changeGiven: change,
      timestamp: new Date().toLocaleTimeString()
    };

    setPayments(prev => [...prev, newPayment]);
    setTenderInput('');
    posAudio.playBeep();
  };

  const handleInitiateMpesaStk = () => {
    if (!mpesaPhone || mpesaPhone.length < 10) {
      alert('Please enter a valid 10-digit Kenyan phone number (e.g. 0712345678)');
      return;
    }

    setMpesaState('STK_SENT');
    posAudio.playBeep();

    // Simulate Daraja background prompt and customer PIN entry
    setTimeout(() => {
      // Generated Safaricom receipt code (e.g. SBG71K990J)
      const generatedCode = 'SBG' + Math.floor(1000000 + Math.random() * 9000000).toString().slice(0, 7);
      setMpesaCode(generatedCode);
      setMpesaState('CONFIRMED');
      posAudio.playMpesaChime();

      const newPayment: PaymentTender = {
        id: `pay-mpesa-${Date.now()}`,
        method: 'MPESA',
        amountTendered: remainingDue,
        amountApplied: remainingDue,
        changeGiven: 0,
        transactionRef: generatedCode,
        timestamp: new Date().toLocaleTimeString()
      };
      setPayments(prev => [...prev, newPayment]);
    }, 2500);
  };

  const handleAddCardPayment = () => {
    const newPayment: PaymentTender = {
      id: `pay-card-${Date.now()}`,
      method: 'CARD',
      amountTendered: remainingDue,
      amountApplied: remainingDue,
      changeGiven: 0,
      transactionRef: 'AUTH-' + Math.floor(100000 + Math.random() * 900000),
      timestamp: new Date().toLocaleTimeString()
    };
    setPayments(prev => [...prev, newPayment]);
    posAudio.playBeep();
  };

  const handleRemovePayment = (id: string) => {
    posAudio.playBeep();
    setPayments(prev => prev.filter(p => p.id !== id));
  };

  const isFullyPaid = remainingDue <= 0;

  const handleFinalizeSale = () => {
    if (!isFullyPaid) return;

    // Generate eTIMS Electronic Tax Invoice details
    const invoiceNum = `INV-${Date.now().toString().slice(-6)}`;
    const etimsInvoice = `ETIMS-DEMI-${Date.now().toString().slice(-8)}`;
    const qrUrl = `https://etims.kra.go.ke/verify?inv=${etimsInvoice}&pin=${currentTenant.kraPin}`;

    const saleRecord: Sale = {
      id: `sale-${Date.now()}`,
      orderId: order.id,
      invoiceNumber: invoiceNum,
      tableNumber: order.tableNumber,
      waiterName: order.waiterName,
      cashierName: currentUser.name,
      items: order.items,
      subtotal: order.subtotal,
      taxTotal: order.taxTotal,
      discountTotal: 0,
      grandTotal: totalDue,
      payments,
      paymentStatus: 'PAID',
      etimsInvoiceNumber: etimsInvoice,
      etimsQrUrl: qrUrl,
      mpesaReceiptCode: payments.find(p => p.method === 'MPESA')?.transactionRef,
      createdAt: new Date().toISOString()
    };

    completeSale(saleRecord);
    posAudio.playMpesaChime();
    onSaleComplete(saleRecord);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
      <div 
        id="multi-tender-checkout-dialog"
        className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full border border-gray-200 overflow-hidden flex flex-col max-h-[95vh]"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-gray-900 text-white">
          <div>
            <h2 className="font-bold text-lg flex items-center gap-2">
              <Receipt className="w-5 h-5 text-emerald-400" />
              <span>Checkout & Settle Payment</span>
            </h2>
            <p className="text-xs text-gray-400">
              {splitDescription || `Order for Table ${order.tableNumber || 'Retail Lane'}`} • Cashier: {currentUser.name}
            </p>
          </div>
          <button
            type="button"
            id="close-checkout-modal-btn"
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-gray-800 text-gray-400 hover:text-white cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          {/* Left Column: Tenders Added & Balance Matrix */}
          <div className="w-full md:w-80 bg-gray-50 p-5 border-r border-gray-200 flex flex-col justify-between">
            <div>
              {/* Grand Total Callout */}
              <div className="p-4 bg-white border border-gray-200 rounded-xl mb-4 text-center">
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1">
                  Total Payable
                </span>
                <span className="text-2xl font-black text-gray-900 font-mono">
                  {formatKES(totalDue)}
                </span>
              </div>

              {/* Payments Allocated List */}
              <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                Applied Tenders ({payments.length})
              </h4>

              {payments.length === 0 ? (
                <p className="text-xs text-gray-400 italic p-3 bg-white rounded-lg border border-dashed border-gray-200 text-center">
                  No payment applied yet. Select tender method on the right.
                </p>
              ) : (
                <div className="space-y-2 max-h-52 overflow-y-auto">
                  {payments.map(p => (
                    <div key={p.id} className="p-3 bg-white border border-gray-200 rounded-xl flex items-center justify-between shadow-2xs">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-bold text-gray-900">{p.method}</span>
                          {p.transactionRef && (
                            <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1 rounded font-mono">
                              {p.transactionRef}
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] text-gray-500 font-mono block">
                          Tendered: {formatKES(p.amountTendered)}
                        </span>
                        {p.changeGiven > 0 && (
                          <span className="text-[10px] text-amber-700 font-bold block">
                            Change: {formatKES(p.changeGiven)}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-black text-sm text-emerald-800 font-mono">
                          {formatKES(p.amountApplied)}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleRemovePayment(p.id)}
                          className="text-gray-400 hover:text-red-600 p-1 cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Remaining Balance / Change Box */}
            <div className="mt-4 pt-3 border-t border-gray-200">
              <div className="flex justify-between items-center text-xs mb-1">
                <span className="text-gray-500">Total Applied:</span>
                <span className="font-bold text-gray-800 font-mono">{formatKES(totalApplied)}</span>
              </div>

              <div className={`p-3 rounded-xl border flex items-center justify-between ${
                isFullyPaid 
                  ? 'bg-emerald-100 border-emerald-300 text-emerald-950' 
                  : 'bg-amber-50 border-amber-300 text-amber-900'
              }`}>
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider block">
                    {isFullyPaid ? 'Settled In Full' : 'Remaining Balance'}
                  </span>
                  <span className="text-xl font-black font-mono">
                    {formatKES(remainingDue)}
                  </span>
                </div>
                {isFullyPaid && (
                  <CheckCircle2 className="w-7 h-7 text-emerald-600" />
                )}
              </div>

              {/* Complete Sale Button */}
              <button
                type="button"
                id="finalize-sale-btn"
                disabled={!isFullyPaid}
                onClick={handleFinalizeSale}
                className="w-full mt-3 py-3.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-black text-sm uppercase tracking-wider rounded-xl shadow-md cursor-pointer transition-all flex items-center justify-center gap-2"
              >
                <CheckCircle2 className="w-5 h-5" />
                <span>Issue eTIMS Receipt</span>
              </button>
            </div>
          </div>

          {/* Right Column: Tender Method Selector & Interactive Keypad / M-Pesa STK */}
          <div className="flex-1 p-6 flex flex-col justify-between overflow-y-auto">
            {/* Tender Method Selector Tabs */}
            <div>
              <div className="grid grid-cols-3 gap-2 mb-4">
                <button
                  type="button"
                  id="tender-method-cash"
                  onClick={() => handleSelectMethod('CASH')}
                  className={`p-3 rounded-xl border-2 flex flex-col items-center gap-1.5 cursor-pointer transition-all ${
                    selectedMethod === 'CASH'
                      ? 'border-emerald-600 bg-emerald-50 text-emerald-900 font-bold shadow-xs'
                      : 'border-gray-200 hover:border-gray-300 text-gray-700'
                  }`}
                >
                  <Banknote className="w-6 h-6 text-emerald-600" />
                  <span className="text-xs">Cash (KES)</span>
                </button>

                <button
                  type="button"
                  id="tender-method-mpesa"
                  onClick={() => handleSelectMethod('MPESA')}
                  className={`p-3 rounded-xl border-2 flex flex-col items-center gap-1.5 cursor-pointer transition-all ${
                    selectedMethod === 'MPESA'
                      ? 'border-emerald-600 bg-emerald-50 text-emerald-900 font-bold shadow-xs'
                      : 'border-gray-200 hover:border-gray-300 text-gray-700'
                  }`}
                >
                  <Smartphone className="w-6 h-6 text-green-600" />
                  <span className="text-xs">M-Pesa STK</span>
                </button>

                <button
                  type="button"
                  id="tender-method-card"
                  onClick={() => handleSelectMethod('CARD')}
                  className={`p-3 rounded-xl border-2 flex flex-col items-center gap-1.5 cursor-pointer transition-all ${
                    selectedMethod === 'CARD'
                      ? 'border-emerald-600 bg-emerald-50 text-emerald-900 font-bold shadow-xs'
                      : 'border-gray-200 hover:border-gray-300 text-gray-700'
                  }`}
                >
                  <CreditCard className="w-6 h-6 text-blue-600" />
                  <span className="text-xs">Card / Visa</span>
                </button>
              </div>

              {/* CASH TENDER MODE */}
              {selectedMethod === 'CASH' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-gray-700">Cash Amount Tendered:</span>
                    <span className="text-xl font-black text-gray-900 font-mono">
                      {formatKES(Number(tenderInput) || 0)}
                    </span>
                  </div>

                  <TouchKeypad
                    value={tenderInput}
                    onChange={setTenderInput}
                    onSubmit={() => handleAddCashPayment(Number(tenderInput))}
                    submitLabel={`Apply Cash ${tenderInput ? formatKES(Number(tenderInput)) : ''}`}
                    quickDenominations={[500, 1000, 2000, 5000]}
                    onQuickAdd={(denom) => {
                      const current = Number(tenderInput) || 0;
                      setTenderInput((current + denom).toString());
                    }}
                  />
                </div>
              )}

              {/* M-PESA STK PUSH MODE */}
              {selectedMethod === 'MPESA' && (
                <div className="space-y-4 p-4 bg-emerald-50/50 border border-emerald-200 rounded-2xl">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center font-black text-xs">
                      M
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-emerald-950">Safaricom Daraja STK Push</h4>
                      <p className="text-[11px] text-emerald-800">Direct prompt to customer phone</p>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-gray-700 block mb-1">
                      Customer Phone Number (Safaricom)
                    </label>
                    <input
                      type="tel"
                      id="mpesa-phone-input"
                      value={mpesaPhone}
                      onChange={(e) => setMpesaPhone(e.target.value)}
                      placeholder="0712345678 or 2547..."
                      className="w-full px-3.5 py-2.5 bg-white border border-gray-300 rounded-xl text-sm font-mono font-bold text-gray-900 focus:outline-none focus:border-emerald-600"
                    />
                  </div>

                  <div className="p-3 bg-white rounded-xl border border-emerald-100 flex justify-between items-center">
                    <span className="text-xs text-gray-600">Push Amount:</span>
                    <span className="text-lg font-black text-emerald-900 font-mono">
                      {formatKES(remainingDue)}
                    </span>
                  </div>

                  {mpesaState === 'STK_SENT' && (
                    <div className="p-4 bg-amber-50 border border-amber-300 rounded-xl text-amber-900 text-xs space-y-2 text-center animate-pulse">
                      <Clock className="w-6 h-6 text-amber-600 mx-auto" />
                      <p className="font-bold">STK prompt dispatched to {mpesaPhone}</p>
                      <p className="text-[11px] text-amber-700">Waiting for customer to enter M-Pesa PIN on handset...</p>
                    </div>
                  )}

                  {mpesaState === 'CONFIRMED' && (
                    <div className="p-4 bg-emerald-100 border border-emerald-300 rounded-xl text-emerald-950 text-xs space-y-1 text-center">
                      <CheckCircle2 className="w-6 h-6 text-emerald-600 mx-auto" />
                      <p className="font-bold text-sm">M-Pesa Payment Received!</p>
                      <p className="font-mono text-emerald-800">Ref: {mpesaCode}</p>
                    </div>
                  )}

                  {mpesaState === 'IDLE' && (
                    <button
                      type="button"
                      id="send-stk-push-btn"
                      disabled={remainingDue <= 0}
                      onClick={handleInitiateMpesaStk}
                      className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-xl shadow-md cursor-pointer transition-colors"
                    >
                      Send M-Pesa STK Prompt ({formatKES(remainingDue)})
                    </button>
                  )}
                </div>
              )}

              {/* CARD TENDER MODE */}
              {selectedMethod === 'CARD' && (
                <div className="space-y-4 p-5 bg-blue-50/50 border border-blue-200 rounded-2xl text-center">
                  <CreditCard className="w-12 h-12 text-blue-600 mx-auto" />
                  <div>
                    <h4 className="font-bold text-base text-gray-900">Credit / Debit Card Terminal</h4>
                    <p className="text-xs text-gray-500 mt-1">Tap or insert card on the standalone PDQ terminal for {formatKES(remainingDue)}</p>
                  </div>

                  <button
                    type="button"
                    id="record-card-tender-btn"
                    disabled={remainingDue <= 0}
                    onClick={handleAddCardPayment}
                    className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-xl shadow-md cursor-pointer transition-colors"
                  >
                    Confirm Card Tender ({formatKES(remainingDue)})
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
