import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  Lock, 
  Clock, 
  Building2, 
  Monitor, 
  AlertCircle, 
  CheckCircle2, 
  Sparkles,
  UserCheck,
  ChevronRight
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { usePos } from '../../context/PosContext';
import { SEED_USERS } from '../../data/seedData';
import { posAudio, formatKES } from '../../utils/formatters';

interface TerminalLockScreenProps {
  onUnlock: () => void;
}

export const TerminalLockScreen: React.FC<TerminalLockScreenProps> = ({ onUnlock }) => {
  const { currentTenant, currentBranch, verifyPinAndSwitch, currentTerminal, setTerminal } = useAuth();
  const { tillSession } = usePos();

  const [pin, setPin] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState<string>('');
  const [isAuthenticating, setIsAuthenticating] = useState<boolean>(false);

  // Live digital clock
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleKeyPress = (num: string) => {
    posAudio.playBeep();
    if (pin.length < 4) {
      const nextPin = pin + num;
      setPin(nextPin);
      setError(null);
      if (nextPin.length === 4) {
        attemptLogin(nextPin);
      }
    }
  };

  const handleClear = () => {
    posAudio.playBeep();
    setPin('');
    setError(null);
  };

  const attemptLogin = async (pinToVerify: string) => {
    setIsAuthenticating(true);
    try {
      const success = await verifyPinAndSwitch(pinToVerify);
      if (success) {
        posAudio.playBeep();
        setPin('');
        onUnlock();
      } else {
        setError('Invalid staff PIN. Please check your 4-digit code.');
        setPin('');
      }
    } catch {
      setError('Connection error or invalid PIN.');
      setPin('');
    } finally {
      setIsAuthenticating(false);
    }
  };

  const handleQuickStaffSelect = (quickPin: string) => {
    setPin(quickPin);
    attemptLogin(quickPin);
  };

  const isShiftOpen = tillSession && tillSession.status === 'OPEN';

  return (
    <div className="fixed inset-0 z-50 flex flex-col lg:flex-row bg-gray-950 text-white select-none">
      {/* LEFT / HERO: Venue Branding & Shift / Terminal Status */}
      <div className="w-full lg:w-5/12 bg-gradient-to-br from-gray-900 via-gray-950 to-emerald-950/40 p-8 flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-gray-800">
        <div>
          {/* Brand header */}
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-900/50">
              <ShieldCheck className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tight text-white uppercase">
                {currentTenant.name || 'DEMI LOUNGE & GRILL'}
              </h1>
              <p className="text-xs text-emerald-400 font-semibold tracking-wider flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5" />
                <span>{currentBranch.name} • KRA PIN: {currentTenant.kraPin}</span>
              </p>
            </div>
          </div>

          {/* Terminal & Shift Status Card */}
          <div className="mt-8 space-y-4">
            <div className="p-4 bg-gray-900/80 rounded-2xl border border-gray-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Monitor className="w-4 h-4 text-emerald-400" />
                  <span>Terminal Identity</span>
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-950 text-emerald-300 border border-emerald-800">
                  {currentTerminal}
                </span>
              </div>

              <div className="flex items-center justify-between text-xs text-gray-300 pt-2 border-t border-gray-800">
                <span>Terminal Mode:</span>
                <select
                  value={currentTerminal}
                  onChange={(e) => setTerminal(e.target.value)}
                  className="bg-gray-800 border border-gray-700 text-white rounded-lg px-2 py-1 text-xs font-bold focus:outline-none focus:border-emerald-500 cursor-pointer"
                >
                  <option value="WAITER-TAB-01">WAITER-TAB-01 (Terrace)</option>
                  <option value="WAITER-TAB-02">WAITER-TAB-02 (Dining)</option>
                  <option value="MAIN-CASHIER-01">MAIN-CASHIER-01 (Till 1)</option>
                  <option value="BAR-POS-01">BAR-POS-01 (Sports Bar)</option>
                  <option value="KITCHEN-KDS-01">KITCHEN-KDS-01 (Main Kitchen)</option>
                </select>
              </div>
            </div>

            {/* Shift Status Indicator */}
            <div className={`p-4 rounded-2xl border ${
              isShiftOpen
                ? 'bg-emerald-950/40 border-emerald-800 text-emerald-200'
                : 'bg-amber-950/40 border-amber-800 text-amber-200'
            }`}>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
                  <span className={`w-2.5 h-2.5 rounded-full ${isShiftOpen ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
                  <span>Shift Status: {isShiftOpen ? 'ACTIVE / OPEN' : 'START REQUIRED'}</span>
                </span>
                {isShiftOpen && (
                  <span className="text-xs font-mono font-bold">
                    Float: {formatKES(tillSession.openingFloat)}
                  </span>
                )}
              </div>
              <p className="text-[11px] mt-1 text-gray-400">
                {isShiftOpen 
                  ? `Operator: ${tillSession.cashierName} • Expected Cash: ${formatKES(tillSession.expectedCash)}` 
                  : 'Cashier must Start Shift and record opening cash float before ringing sales.'}
              </p>
            </div>
          </div>
        </div>

        {/* Security & Clock Footer */}
        <div className="mt-8 pt-4 border-t border-gray-800/80 flex items-center justify-between text-xs text-gray-400">
          <div className="flex items-center gap-2 font-mono text-emerald-400">
            <Clock className="w-4 h-4 text-emerald-500" />
            <span className="font-bold text-sm">{currentTime}</span>
          </div>
          <span className="text-[10px] text-gray-500">Auto-lock active (45s idle)</span>
        </div>
      </div>

      {/* RIGHT: Oversized Touch Numeric Keypad & Staff Fast Select */}
      <div className="flex-1 flex flex-col justify-center items-center p-6 md:p-12 overflow-y-auto">
        <div className="max-w-md w-full space-y-6">
          {/* Header */}
          <div className="text-center space-y-1">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gray-900 border border-gray-800 text-emerald-400 mb-2">
              <Lock className="w-6 h-6" />
            </div>
            <h2 className="text-2xl font-black text-white">Terminal Login & Unlock</h2>
            <p className="text-xs text-gray-400">Enter your 4-digit staff PIN to unlock this terminal</p>
          </div>

          {/* Masked PIN Display */}
          <div className="flex justify-center items-center gap-4 py-2">
            {[0, 1, 2, 3].map((idx) => {
              const hasDigit = pin.length > idx;
              return (
                <div
                  key={idx}
                  className={`w-14 h-14 rounded-2xl border-2 flex items-center justify-center transition-all ${
                    hasDigit
                      ? 'border-emerald-500 bg-emerald-500/20 text-emerald-400 scale-105 shadow-lg shadow-emerald-500/20'
                      : 'border-gray-800 bg-gray-900/60 text-gray-600'
                  }`}
                >
                  {hasDigit ? (
                    <div className="w-4 h-4 rounded-full bg-emerald-400" />
                  ) : (
                    <div className="w-2 h-2 rounded-full bg-gray-700" />
                  )}
                </div>
              );
            })}
          </div>

          {/* Error Banner */}
          {error && (
            <div className="p-3 bg-red-950/80 border border-red-800 rounded-xl text-red-200 text-xs flex items-center gap-2 justify-center animate-shake">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Touch Keypad */}
          <div className="grid grid-cols-3 gap-3">
            {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
              <button
                key={digit}
                type="button"
                id={`pin-keypad-${digit}`}
                onClick={() => handleKeyPress(digit)}
                disabled={isAuthenticating}
                className="h-16 rounded-2xl bg-gray-900 hover:bg-gray-800 active:bg-emerald-600 border border-gray-800 hover:border-gray-700 text-2xl font-black text-white cursor-pointer transition-all active:scale-95 flex items-center justify-center shadow-md disabled:opacity-50"
              >
                {digit}
              </button>
            ))}

            <button
              type="button"
              id="pin-keypad-clear"
              onClick={handleClear}
              disabled={isAuthenticating}
              className="h-16 rounded-2xl bg-gray-900 hover:bg-red-950/60 border border-gray-800 hover:border-red-800 text-sm font-bold text-red-400 cursor-pointer transition-all active:scale-95 flex items-center justify-center shadow-md disabled:opacity-50"
            >
              CLEAR
            </button>

            <button
              type="button"
              id="pin-keypad-0"
              onClick={() => handleKeyPress('0')}
              disabled={isAuthenticating}
              className="h-16 rounded-2xl bg-gray-900 hover:bg-gray-800 active:bg-emerald-600 border border-gray-800 hover:border-gray-700 text-2xl font-black text-white cursor-pointer transition-all active:scale-95 flex items-center justify-center shadow-md disabled:opacity-50"
            >
              0
            </button>

            <button
              type="button"
              id="pin-keypad-enter"
              onClick={() => pin.length === 4 && attemptLogin(pin)}
              disabled={pin.length < 4 || isAuthenticating}
              className="h-16 rounded-2xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-30 disabled:cursor-not-allowed border border-emerald-500 text-sm font-black uppercase text-white cursor-pointer transition-all active:scale-95 flex items-center justify-center shadow-lg shadow-emerald-900/50"
            >
              {isAuthenticating ? 'VERIFYING...' : 'ENTER'}
            </button>
          </div>

          {/* Staff Quick Test Cards (1-Tap Selection for Testing) */}
          <div className="pt-4 border-t border-gray-800 space-y-2">
            <div className="flex items-center justify-between text-xs text-gray-400">
              <span className="font-bold uppercase tracking-wider flex items-center gap-1.5">
                <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>Quick Test Staff Logins</span>
              </span>
              <span className="text-[10px] text-gray-500">Tap to auto-enter PIN</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {SEED_USERS.map((user) => (
                <button
                  key={user.id}
                  type="button"
                  id={`quick-login-${user.role.toLowerCase()}`}
                  onClick={() => handleQuickStaffSelect(user.pin)}
                  className="p-2.5 rounded-xl bg-gray-900/90 hover:bg-gray-800 border border-gray-800 hover:border-emerald-500/60 text-left transition-all cursor-pointer group flex flex-col justify-between"
                >
                  <div className="flex items-center justify-between">
                    <span className={`text-[9px] font-black px-1.5 py-0.2 rounded uppercase ${
                      user.role === 'WAITER' ? 'bg-blue-950 text-blue-300' :
                      user.role === 'CASHIER' ? 'bg-emerald-950 text-emerald-300' :
                      user.role === 'BARTENDER' ? 'bg-amber-950 text-amber-300' :
                      user.role === 'CHEF' ? 'bg-red-950 text-red-300' :
                      user.role === 'MANAGER' ? 'bg-purple-950 text-purple-300' :
                      'bg-gray-800 text-gray-300'
                    }`}>
                      {user.role}
                    </span>
                    <span className="text-[10px] font-mono text-gray-400 group-hover:text-emerald-400 font-bold">
                      {user.pin}
                    </span>
                  </div>
                  <p className="text-xs font-bold text-gray-200 mt-1 truncate">
                    {user.name.split(' ')[0]}
                  </p>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
