import React from 'react';
import { 
  Utensils, 
  ScanBarcode, 
  ChefHat, 
  BarChart3, 
  Wifi, 
  WifiOff, 
  User as UserIcon, 
  KeyRound, 
  Building2,
  FileSpreadsheet
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { usePos, PosOperatingMode } from '../../context/PosContext';
import { formatKES } from '../../utils/formatters';

interface TopNavProps {
  onOpenZReport: () => void;
}

export const TopNav: React.FC<TopNavProps> = ({ onOpenZReport }) => {
  const { currentTenant, currentBranch, currentUser, openPinModal, switchUserRole } = useAuth();
  const { 
    operatingMode, 
    setOperatingMode, 
    isOffline, 
    toggleOffline, 
    offlineQueueCount,
    tillSession,
    kotTickets
  } = usePos();

  // Active KOT count for badge
  const pendingKotCount = kotTickets.filter(k => k.status !== 'SERVED' && k.status !== 'CANCELLED').length;

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'SUPER_ADMIN': return 'bg-purple-100 text-purple-800 border-purple-300';
      case 'OWNER': return 'bg-indigo-100 text-indigo-800 border-indigo-300';
      case 'MANAGER': return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'CASHIER': return 'bg-emerald-100 text-emerald-800 border-emerald-300';
      case 'CHEF': return 'bg-amber-100 text-amber-800 border-amber-300';
      case 'BARTENDER': return 'bg-pink-100 text-pink-800 border-pink-300';
      case 'WAITER': default: return 'bg-teal-100 text-teal-800 border-teal-300';
    }
  };

  return (
    <header className="bg-gray-900 text-white border-b border-gray-800 shrink-0 select-none sticky top-0 z-40">
      {/* Top micro-bar: Tenant info, fast role switcher demo selector & connectivity */}
      <div className="bg-gray-950 px-4 py-1.5 flex flex-wrap items-center justify-between text-xs text-gray-400 border-b border-gray-900 gap-2">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 text-gray-300 font-medium">
            <Building2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>{currentTenant.name}</span>
            <span className="text-gray-600">/</span>
            <span className="text-emerald-400 font-semibold">{currentBranch.name}</span>
          </div>
          <span className="px-1.5 py-0.5 bg-gray-800 text-gray-300 rounded text-[10px] font-mono">
            PIN: {currentTenant.kraPin}
          </span>
        </div>

        {/* Quick Testing Bar: Rapid Role Switcher Banner */}
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-gray-400 uppercase tracking-wide">Test As:</span>
          {(['WAITER', 'CASHIER', 'BARTENDER', 'CHEF', 'MANAGER', 'OWNER'] as const).map(r => (
            <button
              key={r}
              type="button"
              id={`test-role-${r.toLowerCase()}`}
              onClick={() => switchUserRole(r)}
              className={`px-1.5 py-0.5 rounded text-[10px] font-bold cursor-pointer transition-all ${
                currentUser.role === r 
                  ? 'bg-emerald-500 text-white' 
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-gray-200'
              }`}
            >
              {r}
            </button>
          ))}

          <div className="h-3 w-px bg-gray-800 mx-1" />

          {/* Offline Mode Emulator Toggle */}
          <button
            type="button"
            id="toggle-offline-btn"
            onClick={toggleOffline}
            className={`flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium cursor-pointer transition-colors ${
              isOffline 
                ? 'bg-amber-950/80 text-amber-300 border border-amber-800' 
                : 'bg-gray-800 text-gray-400 hover:text-gray-200'
            }`}
            title="Toggle simulated offline connectivity"
          >
            {isOffline ? (
              <>
                <WifiOff className="w-3 h-3 text-amber-400 animate-pulse" />
                <span>OFFLINE ({offlineQueueCount} queued)</span>
              </>
            ) : (
              <>
                <Wifi className="w-3 h-3 text-emerald-400" />
                <span>Online (Cloud Sync Active)</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Main Bar: Brand, Navigation Tabs, Staff Session */}
      <div className="px-4 py-2.5 flex items-center justify-between gap-4">
        {/* Logo & Brand */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 bg-emerald-600 rounded-xl flex items-center justify-center font-black text-white text-xl shadow-lg shadow-emerald-900/30">
              D
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-black tracking-tight text-lg text-white">DEMI<span className="text-emerald-400">POS</span></span>
                <span className="px-1.5 py-0.2 bg-emerald-950 text-emerald-400 text-[10px] font-bold uppercase rounded border border-emerald-800">
                  KENYA
                </span>
              </div>
              <p className="text-[10px] text-gray-400 -mt-0.5">Commercial Hospitality & Retail Platform</p>
            </div>
          </div>
        </div>

        {/* Operating Mode Navigation Tabs */}
        <nav className="flex items-center gap-1.5 bg-gray-950/70 p-1 rounded-xl border border-gray-800">
          <button
            type="button"
            id="nav-tab-restaurant"
            onClick={() => setOperatingMode('RESTAURANT')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              operatingMode === 'RESTAURANT'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-gray-300 hover:text-white hover:bg-gray-800/60'
            }`}
          >
            <Utensils className="w-4 h-4" />
            <span>Restaurant & Bar</span>
          </button>

          <button
            type="button"
            id="nav-tab-retail"
            onClick={() => setOperatingMode('RETAIL')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              operatingMode === 'RETAIL'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-gray-300 hover:text-white hover:bg-gray-800/60'
            }`}
          >
            <ScanBarcode className="w-4 h-4" />
            <span>Retail & Barcode</span>
          </button>

          <button
            type="button"
            id="nav-tab-kitchen"
            onClick={() => setOperatingMode('KITCHEN_KDS')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer relative ${
              operatingMode === 'KITCHEN_KDS'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-gray-300 hover:text-white hover:bg-gray-800/60'
            }`}
          >
            <ChefHat className="w-4 h-4" />
            <span>Kitchen Display (KDS)</span>
            {pendingKotCount > 0 && (
              <span className="ml-1 px-1.5 py-0.2 bg-red-500 text-white text-[10px] font-bold rounded-full animate-pulse">
                {pendingKotCount}
              </span>
            )}
          </button>

          {(currentUser.role === 'MANAGER' || currentUser.role === 'OWNER' || currentUser.role === 'SUPER_ADMIN') && (
            <button
              type="button"
              id="nav-tab-dashboard"
              onClick={() => setOperatingMode('DASHBOARD')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                operatingMode === 'DASHBOARD'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-gray-300 hover:text-white hover:bg-gray-800/60'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              <span>Business Intel</span>
            </button>
          )}
        </nav>

        {/* Till & Staff Session Controls */}
        <div className="flex items-center gap-3">
          {/* Shift Till Button */}
          <button
            type="button"
            id="open-z-report-btn"
            onClick={onOpenZReport}
            className="flex items-center gap-2 px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-200 rounded-xl border border-gray-700 text-xs font-semibold cursor-pointer transition-colors"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
            <div className="text-left hidden sm:block">
              <p className="text-[10px] text-gray-400 leading-tight">Shift Sales</p>
              <p className="text-xs font-bold text-white leading-tight">{formatKES(tillSession.totalSales)}</p>
            </div>
          </button>

          {/* Current Staff & Quick PIN Switch */}
          <button
            type="button"
            id="staff-pin-switch-btn"
            onClick={openPinModal}
            className="flex items-center gap-2.5 px-3 py-1.5 bg-gray-800/80 hover:bg-gray-800 text-white rounded-xl border border-gray-700 transition-all cursor-pointer shadow-xs group"
          >
            <div className="w-7 h-7 rounded-lg bg-emerald-700 text-white font-bold text-xs flex items-center justify-center">
              {currentUser.avatar || currentUser.name.slice(0, 2)}
            </div>
            <div className="text-left hidden md:block">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-gray-100">{currentUser.name}</span>
                <KeyRound className="w-3 h-3 text-emerald-400 opacity-60 group-hover:opacity-100 transition-opacity" />
              </div>
              <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded border ${getRoleBadgeColor(currentUser.role)}`}>
                {currentUser.role}
              </span>
            </div>
          </button>
        </div>
      </div>
    </header>
  );
};
