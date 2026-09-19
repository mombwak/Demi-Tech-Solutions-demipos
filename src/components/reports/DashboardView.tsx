import React from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  DollarSign, 
  ShoppingBag, 
  Users, 
  ArrowUpRight, 
  Receipt,
  Smartphone,
  Banknote,
  CreditCard,
  Building2,
  CheckCircle2
} from 'lucide-react';
import { usePos } from '../../context/PosContext';
import { useAuth } from '../../context/AuthContext';
import { formatKES } from '../../utils/formatters';
import { Sale } from '../../types';

interface DashboardViewProps {
  onViewReceipt: (sale: Sale) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ onViewReceipt }) => {
  const { tillSession, salesHistory, tables } = usePos();
  const { currentTenant, currentBranch } = useAuth();

  const totalSales = tillSession.totalSales;
  const totalMpesa = tillSession.totalMpesa;
  const totalCash = tillSession.expectedCash - tillSession.openingFloat;
  const totalCard = tillSession.totalCard;

  const mpesaPct = totalSales > 0 ? Math.round((totalMpesa / totalSales) * 100) : 0;
  const cashPct = totalSales > 0 ? Math.round((totalCash / totalSales) * 100) : 0;
  const cardPct = totalSales > 0 ? Math.round((totalCard / totalSales) * 100) : 0;

  return (
    <div className="flex-1 flex flex-col h-full bg-gray-50 overflow-y-auto p-6 space-y-6 select-none">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-black tracking-tight text-gray-900 flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-emerald-600" />
            <span>Executive Business Intelligence</span>
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Consolidated performance for {currentTenant.name} • {currentBranch.name}
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-semibold text-gray-700 bg-white px-3 py-1.5 rounded-xl border border-gray-200 shadow-2xs">
          <Building2 className="w-4 h-4 text-emerald-600" />
          <span>Outlet: {currentBranch.code} (KRA PIN: {currentTenant.kraPin})</span>
        </div>
      </div>

      {/* Top 4 KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 bg-white border border-gray-200 rounded-2xl shadow-xs">
          <div className="flex items-center justify-between text-gray-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Today's Revenue</span>
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-gray-900 font-mono">{formatKES(totalSales)}</p>
          <p className="text-[11px] text-emerald-600 font-semibold mt-1 flex items-center gap-1">
            <ArrowUpRight className="w-3.5 h-3.5" /> +14.8% vs last Saturday
          </p>
        </div>

        <div className="p-5 bg-white border border-gray-200 rounded-2xl shadow-xs">
          <div className="flex items-center justify-between text-gray-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">M-Pesa Collections</span>
            <div className="p-2 bg-green-50 text-green-600 rounded-xl">
              <Smartphone className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-emerald-800 font-mono">{formatKES(totalMpesa)}</p>
          <p className="text-[11px] text-gray-500 mt-1 font-medium">
            {mpesaPct}% of total turnover via Daraja
          </p>
        </div>

        <div className="p-5 bg-white border border-gray-200 rounded-2xl shadow-xs">
          <div className="flex items-center justify-between text-gray-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Cash in Drawer</span>
            <div className="p-2 bg-amber-50 text-amber-600 rounded-xl">
              <Banknote className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-gray-900 font-mono">{formatKES(tillSession.expectedCash)}</p>
          <p className="text-[11px] text-gray-500 mt-1 font-medium">
            Includes KES 5,000 opening float
          </p>
        </div>

        <div className="p-5 bg-white border border-gray-200 rounded-2xl shadow-xs">
          <div className="flex items-center justify-between text-gray-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">eTIMS Compliance</span>
            <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-blue-900">100% Tax Compliant</p>
          <p className="text-[11px] text-blue-700 mt-1 font-medium">
            All sales cryptographically registered
          </p>
        </div>
      </div>

      {/* Tender Method Distribution Bar */}
      <div className="p-5 bg-white border border-gray-200 rounded-2xl shadow-xs space-y-3">
        <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wider">
          Payment Mix Distribution (Kenya Commerce Rails)
        </h3>
        
        {/* Multi-color progress bar */}
        <div className="h-4 bg-gray-100 rounded-full overflow-hidden flex">
          <div style={{ width: `${mpesaPct}%` }} className="bg-emerald-600 h-full" title={`M-Pesa: ${mpesaPct}%`} />
          <div style={{ width: `${cashPct}%` }} className="bg-amber-500 h-full" title={`Cash: ${cashPct}%`} />
          <div style={{ width: `${cardPct}%` }} className="bg-blue-600 h-full" title={`Card: ${cardPct}%`} />
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 text-xs pt-1">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-emerald-600" />
            <span className="font-semibold text-gray-700">M-Pesa STK ({mpesaPct}% • {formatKES(totalMpesa)})</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-amber-500" />
            <span className="font-semibold text-gray-700">Cash ({cashPct}% • {formatKES(totalCash)})</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-blue-600" />
            <span className="font-semibold text-gray-700">Card & Bank ({cardPct}% • {formatKES(totalCard)})</span>
          </div>
        </div>
      </div>

      {/* Two Column Grid: Top Selling Items + Completed Invoices */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Selling Products */}
        <div className="p-5 bg-white border border-gray-200 rounded-2xl shadow-xs">
          <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-4">
            Top Velocity Menu Items
          </h3>
          <div className="space-y-3">
            {[
              { name: 'Mbuzi Choma (1 Kg)', category: 'Nyama Choma', sold: 28, revenue: 44800 },
              { name: 'Tusker Lager 500ml', category: 'Beers & Ciders', sold: 64, revenue: 22400 },
              { name: 'Original Kenyan Dawa Cocktail', category: 'Cocktails', sold: 19, revenue: 12350 },
              { name: 'Whole Tilapia (Wet Fry)', category: 'Mains & Fish', sold: 12, revenue: 11400 },
              { name: 'Ugali Afya (White/Brown)', category: 'Traditional Sides', sold: 55, revenue: 6600 },
            ].map((item, idx) => (
              <div key={idx} className="flex items-center justify-between p-2.5 rounded-xl hover:bg-gray-50 border border-gray-100">
                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-lg bg-gray-100 font-bold text-xs flex items-center justify-center text-gray-700">
                    {idx + 1}
                  </span>
                  <div>
                    <h5 className="font-bold text-xs text-gray-900">{item.name}</h5>
                    <p className="text-[10px] text-gray-500">{item.category} • {item.sold} sold</p>
                  </div>
                </div>
                <span className="font-black text-xs text-emerald-800 font-mono">
                  {formatKES(item.revenue)}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Completed Invoices */}
        <div className="p-5 bg-white border border-gray-200 rounded-2xl shadow-xs">
          <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-4">
            Recent Completed Transactions
          </h3>
          {salesHistory.length === 0 ? (
            <p className="text-xs text-gray-400 italic text-center py-8">
              No sales completed yet during this test session. Settle a table bill to view receipts.
            </p>
          ) : (
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {salesHistory.map(sale => (
                <div 
                  key={sale.id}
                  onClick={() => onViewReceipt(sale)}
                  className="p-3 rounded-xl border border-gray-200 hover:border-emerald-400 bg-gray-50 hover:bg-white flex items-center justify-between cursor-pointer transition-all shadow-2xs"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-gray-900">{sale.invoiceNumber}</span>
                      <span className="text-[10px] font-mono text-gray-500">{sale.tableNumber || 'Retail'}</span>
                    </div>
                    <p className="text-[10px] text-gray-500 mt-0.5">
                      {sale.items.length} items • Cashier: {sale.cashierName}
                    </p>
                    <span className="text-[9px] font-mono text-emerald-700 font-semibold block">
                      eTIMS: {sale.etimsInvoiceNumber}
                    </span>
                  </div>

                  <div className="text-right">
                    <p className="text-xs font-black text-gray-900 font-mono">
                      {formatKES(sale.grandTotal)}
                    </p>
                    <span className="text-[10px] text-emerald-600 font-bold hover:underline">
                      View Receipt →
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
