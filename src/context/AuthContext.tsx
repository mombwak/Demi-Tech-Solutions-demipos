import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { User, Tenant, Branch, UserRole } from '../types';
import { SEED_TENANT, SEED_USERS } from '../data/seedData';
import { api, setTerminalId } from '../services/apiClient';

const IDLE_TIMEOUT_SECONDS = 45; // 45 seconds auto-lock to prevent waiter/cashier fraud

interface AuthContextType {
  currentTenant: Tenant;
  currentBranch: Branch;
  currentUser: User;
  currentTerminal: string;
  setTerminal: (termId: string) => void;
  isLocked: boolean;
  lockTerminal: () => void;
  unlockTerminal: () => void;
  autoLockCountdown: number | null;
  autoLockAfterAction: boolean;
  setAutoLockAfterAction: (val: boolean) => void;
  switchUserRole: (role: UserRole) => void;
  switchBranch: (branchId: string) => void;
  verifyPinAndSwitch: (pin: string) => Promise<boolean>;
  isPinModalOpen: boolean;
  openPinModal: () => void;
  closePinModal: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentTenant] = useState<Tenant>(SEED_TENANT);
  const [currentBranch, setCurrentBranch] = useState<Branch>(SEED_TENANT.branches[0]);
  const [currentUser, setCurrentUser] = useState<User>(SEED_USERS[0]); // Default seed
  const [currentTerminal, setCurrentTerminalState] = useState<string>(
    localStorage.getItem('demipos_terminal_id') || 'WAITER-TAB-01'
  );

  // Terminal Lock State: Starts LOCKED on first launch to ensure genuine staff login
  const [isLocked, setIsLocked] = useState<boolean>(true);
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);
  const [autoLockCountdown, setAutoLockCountdown] = useState<number | null>(null);
  const [autoLockAfterAction, setAutoLockAfterAction] = useState<boolean>(true);

  const lastActivityTime = useRef<number>(Date.now());

  const setTerminal = (termId: string) => {
    setCurrentTerminalState(termId);
    setTerminalId(termId);
  };

  const lockTerminal = useCallback(() => {
    setIsLocked(true);
    setAutoLockCountdown(null);
  }, []);

  const unlockTerminal = useCallback(() => {
    setIsLocked(false);
    lastActivityTime.current = Date.now();
    setAutoLockCountdown(null);
  }, []);

  // Activity event listener to reset inactivity timer
  useEffect(() => {
    const handleUserActivity = () => {
      lastActivityTime.current = Date.now();
      if (autoLockCountdown !== null) {
        setAutoLockCountdown(null);
      }
    };

    window.addEventListener('mousemove', handleUserActivity);
    window.addEventListener('mousedown', handleUserActivity);
    window.addEventListener('keydown', handleUserActivity);
    window.addEventListener('touchstart', handleUserActivity);
    window.addEventListener('scroll', handleUserActivity);

    return () => {
      window.removeEventListener('mousemove', handleUserActivity);
      window.removeEventListener('mousedown', handleUserActivity);
      window.removeEventListener('keydown', handleUserActivity);
      window.removeEventListener('touchstart', handleUserActivity);
      window.removeEventListener('scroll', handleUserActivity);
    };
  }, [autoLockCountdown]);

  // Inactivity auto-lock timer ticker (runs every 1s when unlocked)
  useEffect(() => {
    if (isLocked) return;

    const timer = setInterval(() => {
      const elapsedSeconds = Math.floor((Date.now() - lastActivityTime.current) / 1000);
      const remaining = IDLE_TIMEOUT_SECONDS - elapsedSeconds;

      if (remaining <= 0) {
        lockTerminal();
      } else if (remaining <= 15) {
        setAutoLockCountdown(remaining);
      } else {
        setAutoLockCountdown(null);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [isLocked, lockTerminal]);

  const switchUserRole = (role: UserRole) => {
    const matchedUser = SEED_USERS.find(u => u.role === role);
    if (matchedUser) {
      setCurrentUser(matchedUser);
      api.pinLogin(matchedUser.pin, currentTerminal).catch(() => {});
    }
  };

  const switchBranch = (branchId: string) => {
    const branch = currentTenant.branches.find(b => b.id === branchId);
    if (branch) {
      setCurrentBranch(branch);
    }
  };

  const verifyPinAndSwitch = async (pin: string): Promise<boolean> => {
    try {
      const { user } = await api.pinLogin(pin, currentTerminal);
      setCurrentUser(user);
      setIsLocked(false);
      setIsPinModalOpen(false);
      lastActivityTime.current = Date.now();
      return true;
    } catch {
      // Offline fallback
      const matched = SEED_USERS.find(u => u.pin === pin);
      if (matched) {
        setCurrentUser(matched);
        setIsLocked(false);
        setIsPinModalOpen(false);
        lastActivityTime.current = Date.now();
        return true;
      }
      return false;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        currentTenant,
        currentBranch,
        currentUser,
        currentTerminal,
        setTerminal,
        isLocked,
        lockTerminal,
        unlockTerminal,
        autoLockCountdown,
        autoLockAfterAction,
        setAutoLockAfterAction,
        switchUserRole,
        switchBranch,
        verifyPinAndSwitch,
        isPinModalOpen,
        openPinModal: () => setIsPinModalOpen(true),
        closePinModal: () => setIsPinModalOpen(false),
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
};
