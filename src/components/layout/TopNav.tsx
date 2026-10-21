import React, { useState } from 'react';
import { 
  Utensils, 
  ScanBarcode, 
  ChefHat, 
  BarChart3, 
  Wifi, 
  WifiOff, 
  Lock, 
  KeyRound, 
  Building2,
  FileSpreadsheet,
  PlayCircle,
  PlusCircle,
  Clock,
  Banknote,
  AlertTriangle
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { usePos } from '../../context/PosContext';
import { formatKES, posAudio } from '../../utils/formatters';

interface TopNavProps {
  onOpenStartShift: () => void;
  onOpenCashMovement: () => void;
  onOpenZReport: () => void;
}

export const TopNav: React.FC<TopNavProps> = ({ 
  onOpenStartShift, 
  onOpenCashMovement, 
  onOpenZReport 
}) => {
  const { 
    currentTenant, 
    currentBranch, 
    currentUser, 
    currentTerminal,
    openPinModal, 
    switchUserRole,
    lockTerminal,
    autoLockCountdown
  } = useAuth();

  const { 
    operatingMode, 
    setOperatingMode, 
    isOffline, 
    toggleOffline, 
    offlineQueueCount,
    tillSession,
    kotTickets
  } = usePos();

  const [isShiftDropdownOpen, setIsShiftDropdownOpen] = useState(false);

  // Active KOT count for badge
  const pendingKotCount = kotTickets.filter(k => k.status !== 'SERVED' && k.status !== 'CANCELLED').length;
  const isShiftOpen = tillSession && tillSession.status === 'OPEN';

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
      {/* Top micro-bar: Tenant info, auto-lock countdown alert & rapid role selector */}
      <div className="bg-gray-950 px-4 py-1.5 flex flex-wrap items-center justify-between text-xs text-gray-400 border-b border-gray-900 gap-2">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-gray-300 font-medium">
            <Building2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>{currentTenant.name}</span>
            <span className="text-gray-600">/</span>
            <span className="text-emerald-400 font-semibold">{currentBranch.name}</span>
          </div>

          <span className="px-1.5 py-0.5 bg-gray-800 text-emerald-300 rounded text-[10px] font-mono border border-gray-700">
            {currentTerminal}
          </span>
        </div>

        {/* Inactivity Auto-Lock Countdown Notice */}
        {autoLockCountdown !== null && (
          <div className="flex items-center gap-1.5 px-2.5 py-0.5 bg-amber-500/20 text-amber-300 border border-amber-500/40 rounded-full text-[11px] font-bold animate-pulse">
            <Clock className="w-3 h-3" />
            <span>Auto-locking in {autoLockCountdown}s (Tap screen to stay active)</span>
          </div>
        )}

        {/* Quick Testing Bar: Role Switcher & Connectivity */}
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
                  ? 'bg-emerald-500 text-white shadow-xs' 
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
            title="Toggle offline connectivity mode"
          >
            {isOffline ? (
              <>
                <WifiOff className="w-3 h-3 text-amber-400 animate-pulse" />
                <span>OFFLINE ({offlineQueueCount} queued)</span>
              </>
            ) : (
              <>
                <Wifi className="w-3 h-3 text-emerald-400" />
                <span>Online (Sync Active)</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Main Bar: Brand, Operating Mode Tabs, Shift Controls & Lock Screen Button */}
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

        {/* Right Controls: Shift Lifecycle + Lock Terminal + Staff Switch */}
        <div className="flex items-center gap-2.5">
          {/* Shift Management Dropdown / Button */}
          <div className="relative">
            {isShiftOpen ? (
              <div className="flex items-center bg-gray-800 rounded-xl border border-gray-700 overflow-hidden shadow-xs">
                <button
                  type="button"
                  id="open-shift-menu-btn"
                  onClick={() => setIsShiftDropdownOpen(prev => !prev)}
                  className="flex items-center gap-2 px-3 py-1.5 hover:bg-gray-700/80 cursor-pointer transition-colors"
                >
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <div className="text-left hidden sm:block">
                    <p className="text-[10px] text-gray-400 leading-tight">Shift Active</p>
                    <p className="text-xs font-bold text-emerald-400 leading-tight font-mono">{formatKES(tillSession.expectedCash)}</p>
                  </div>
                </button>

                <button
                  type="button"
                  id="quick-cash-movement-btn"
                  onClick={() => {
                    setIsShiftDropdownOpen(false);
                    onOpenCashMovement();
                  }}
                  className="px-2 py-2 hover:bg-gray-700 border-l border-gray-700 text-gray-300 hover:text-white cursor-pointer"
                  title="Petty Cash In/Out"
                >
                  <Banknote className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                id="start-shift-top-btn"
                onClick={onOpenStartShift}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black uppercase tracking-wider cursor-pointer shadow-md shadow-emerald-900/40 transition-colors animate-pulse"
              >
                <PlayCircle className="w-4 h-4" />
                <span>Start Shift</span>
              </button>
            )}

            {/* Shift Menu Dropdown */}
            {isShiftDropdownOpen && (
              <div className="absolute right-0 mt-2 w-64 bg-gray-900 border border-gray-700 rounded-2xl shadow-2xl p-2 z-50 space-y-1">
                <div className="p-2 border-b border-gray-800 text-xs">
                  <span className="text-[10px] text-gray-400 uppercase font-bold block">Current Till Shift</span>
                  <p className="font-bold text-gray-200 mt-0.5">{tillSession.cashierName}</p>
                  <p className="text-[11px] text-emerald-400 font-mono">Drawer Expected: {formatKES(tillSession.expectedCash)}</p>
                </div>

                <button
                  type="button"
                  id="menu-cash-movement-btn"
                  onClick={() => {
                    setIsShiftDropdownOpen(false);
                    onOpenCashMovement();
                  }}
                  className="w-full flex items-center gap-2 p-2 rounded-xl text-xs font-semibold text-gray-200 hover:bg-gray-800 text-left cursor-pointer"
                >
                  <Banknote className="w-4 h-4 text-amber-400" />
                  <span>Petty Cash (Paid In / Paid Out)</span>
                </button>

                <button
                  type="button"
                  id="menu-end-shift-btn"
                  onClick={() => {
                    setIsShiftDropdownOpen(false);
                    onOpenZReport();
                  }}
                  className="w-full flex items-center gap-2 p-2 rounded-xl text-xs font-bold text-red-300 hover:bg-red-950/60 text-left cursor-pointer"
                >
                  <FileSpreadsheet className="w-4 h-4 text-red-400" />
                  <span>End Shift (Count & Z-Report)</span>
                </button>
              </div>
            )}
          </div>

          {/* Current Staff & Quick Switch */}
          <button
            type="button"
            id="staff-pin-switch-btn"
            onClick={openPinModal}
            className="flex items-center gap-2 px-3 py-1.5 bg-gray-800/80 hover:bg-gray-800 text-white rounded-xl border border-gray-700 transition-all cursor-pointer shadow-xs group"
            title="Fast Staff Switch"
          >
            <div className="w-7 h-7 rounded-lg bg-emerald-700 text-white font-bold text-xs flex items-center justify-center">
              {currentUser.avatar || currentUser.name.slice(0, 2)}
            </div>
            <div className="text-left hidden md:block">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-gray-100">{currentUser.name.split(' ')[0]}</span>
                <KeyRound className="w-3 h-3 text-emerald-400 opacity-60 group-hover:opacity-100 transition-opacity" />
              </div>
              <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded border ${getRoleBadgeColor(currentUser.role)}`}>
                {currentUser.role}
              </span>
            </div>
          </button>

          {/* Dedicated Fast Lock Terminal Button (Anti-Fraud) */}
          <button
            type="button"
            id="lock-terminal-btn"
            onClick={() => {
              posAudio.playBeep();
              lockTerminal();
            }}
            className="p-2.5 bg-red-950/60 hover:bg-red-900 border border-red-800 text-red-300 hover:text-white rounded-xl cursor-pointer transition-colors shadow-xs"
            title="Lock Terminal Immediately (Anti-Fraud)"
          >
            <Lock className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
