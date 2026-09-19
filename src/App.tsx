import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { PosProvider, usePos } from './context/PosContext';
import { TopNav } from './components/layout/TopNav';
import { FloorPlan } from './components/restaurant/FloorPlan';
import { OrderBuilder } from './components/restaurant/OrderBuilder';
import { TableTransferModal } from './components/restaurant/TableTransferModal';
import { SplitBillModal } from './components/restaurant/SplitBillModal';
import { KdsDisplay } from './components/kitchen/KdsDisplay';
import { RetailPos } from './components/retail/RetailPos';
import { MultiTenderModal } from './components/payments/MultiTenderModal';
import { ReceiptModal } from './components/payments/ReceiptModal';
import { ZReportModal } from './components/reports/ZReportModal';
import { PinModal } from './components/common/PinModal';
import { DashboardView } from './components/reports/DashboardView';
import { DiningTable, Order, Sale, OrderItem } from './types';

const PosMainContent: React.FC = () => {
  const { operatingMode } = usePos();
  const { isPinModalOpen, closePinModal } = useAuth();

  // Active Interactive States
  const [selectedTable, setSelectedTable] = useState<DiningTable | null>(null);
  const [transferSourceTable, setTransferSourceTable] = useState<DiningTable | null>(null);
  const [splitOrder, setSplitOrder] = useState<Order | null>(null);
  const [checkoutOrder, setCheckoutOrder] = useState<Order | null>(null);
  const [splitPayShare, setSplitPayShare] = useState<{ amount: number; description: string } | null>(null);
  const [activeSaleReceipt, setActiveSaleReceipt] = useState<Sale | null>(null);
  const [isZReportOpen, setIsZReportOpen] = useState<boolean>(false);

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-gray-100 font-sans">
      {/* Top Application Bar */}
      <TopNav onOpenZReport={() => setIsZReportOpen(true)} />

      {/* Main View Area */}
      <main className="flex-1 flex overflow-hidden">
        {operatingMode === 'RESTAURANT' && (
          selectedTable ? (
            <OrderBuilder
              table={selectedTable}
              onBackToFloor={() => setSelectedTable(null)}
              onOpenSplitBill={(order) => setSplitOrder(order)}
              onOpenCheckout={(order) => {
                setCheckoutOrder(order);
                setSplitPayShare(null);
              }}
            />
          ) : (
            <FloorPlan
              onSelectTable={(table) => setSelectedTable(table)}
              onOpenTransferModal={(table) => setTransferSourceTable(table)}
            />
          )
        )}

        {operatingMode === 'RETAIL' && (
          <RetailPos
            onOpenCheckout={(order) => {
              setCheckoutOrder(order);
              setSplitPayShare(null);
            }}
          />
        )}

        {operatingMode === 'KITCHEN_KDS' && (
          <KdsDisplay />
        )}

        {operatingMode === 'DASHBOARD' && (
          <DashboardView
            onViewReceipt={(sale) => setActiveSaleReceipt(sale)}
          />
        )}
      </main>

      {/* MODALS */}

      {/* Staff Fast PIN Switch / Lock Modal */}
      {isPinModalOpen && (
        <PinModal onClose={closePinModal} />
      )}

      {/* Table Transfer / Merge Modal */}
      {transferSourceTable && (
        <TableTransferModal
          sourceTable={transferSourceTable}
          onClose={() => setTransferSourceTable(null)}
        />
      )}

      {/* Split Bill Modal */}
      {splitOrder && (
        <SplitBillModal
          order={splitOrder}
          onClose={() => setSplitOrder(null)}
          onPaySplitShare={(shareAmount, description) => {
            setSplitOrder(null);
            setSplitPayShare({ amount: shareAmount, description });
            setCheckoutOrder(splitOrder);
          }}
        />
      )}

      {/* Multi-Tender Checkout Modal */}
      {checkoutOrder && (
        <MultiTenderModal
          order={checkoutOrder}
          initialPayAmount={splitPayShare?.amount}
          splitDescription={splitPayShare?.description}
          onClose={() => {
            setCheckoutOrder(null);
            setSplitPayShare(null);
          }}
          onSaleComplete={(sale) => {
            setCheckoutOrder(null);
            setSplitPayShare(null);
            setSelectedTable(null); // Return to floor plan on settlement
            setActiveSaleReceipt(sale);
          }}
        />
      )}

      {/* Fiscal eTIMS Receipt Modal */}
      {activeSaleReceipt && (
        <ReceiptModal
          sale={activeSaleReceipt}
          onClose={() => setActiveSaleReceipt(null)}
        />
      )}

      {/* Z-Report / Cashier Blind Count Modal */}
      {isZReportOpen && (
        <ZReportModal onClose={() => setIsZReportOpen(false)} />
      )}
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <PosProvider>
        <PosMainContent />
      </PosProvider>
    </AuthProvider>
  );
}
