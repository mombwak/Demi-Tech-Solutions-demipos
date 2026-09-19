import React, { createContext, useContext, useState } from 'react';
import { User, Tenant, Branch, UserRole } from '../types';
import { SEED_TENANT, SEED_USERS } from '../data/seedData';

interface AuthContextType {
  currentTenant: Tenant;
  currentBranch: Branch;
  currentUser: User;
  switchUserRole: (role: UserRole) => void;
  switchBranch: (branchId: string) => void;
  verifyPinAndSwitch: (pin: string) => boolean;
  isPinModalOpen: boolean;
  openPinModal: () => void;
  closePinModal: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentTenant] = useState<Tenant>(SEED_TENANT);
  const [currentBranch, setCurrentBranch] = useState<Branch>(SEED_TENANT.branches[0]);
  const [currentUser, setCurrentUser] = useState<User>(SEED_USERS[0]); // Default to Waiter (Faith)
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);

  const switchUserRole = (role: UserRole) => {
    const matchedUser = SEED_USERS.find(u => u.role === role);
    if (matchedUser) {
      setCurrentUser(matchedUser);
    }
  };

  const switchBranch = (branchId: string) => {
    const branch = currentTenant.branches.find(b => b.id === branchId);
    if (branch) {
      setCurrentBranch(branch);
    }
  };

  const verifyPinAndSwitch = (pin: string): boolean => {
    const matched = SEED_USERS.find(u => u.pin === pin);
    if (matched) {
      setCurrentUser(matched);
      setIsPinModalOpen(false);
      return true;
    }
    return false;
  };

  return (
    <AuthContext.Provider
      value={{
        currentTenant,
        currentBranch,
        currentUser,
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
