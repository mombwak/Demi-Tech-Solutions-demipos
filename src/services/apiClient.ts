/**
 * DEMIPOS Client API Service
 * Manages communication with central backend API with authentication tokens,
 * terminal headers, optimistic concurrency retry handling, and offline queueing.
 */

import { Order, DiningTable, KotTicket, Sale, TillSession, User } from '../types';

let authToken: string | null = localStorage.getItem('demipos_token');
let currentTerminalId: string = localStorage.getItem('demipos_terminal_id') || 'term-waiter-01';

export const setAuthToken = (token: string | null) => {
  authToken = token;
  if (token) {
    localStorage.setItem('demipos_token', token);
  } else {
    localStorage.removeItem('demipos_token');
  }
};

export const getAuthToken = () => authToken;

export const setTerminalId = (id: string) => {
  currentTerminalId = id;
  localStorage.setItem('demipos_terminal_id', id);
};

export const getTerminalId = () => currentTerminalId;

const getHeaders = () => {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'X-Terminal-ID': currentTerminalId
  };
  if (authToken) {
    headers['Authorization'] = `Bearer ${authToken}`;
  }
  return headers;
};

export const api = {
  // --- Auth ---
  async pinLogin(pin: string, terminalId = currentTerminalId): Promise<{ user: User; token: string }> {
    const res = await fetch('/api/v1/auth/pin-login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pin, terminal_id: terminalId })
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error || 'PIN authentication failed.');
    }
    setAuthToken(data.data.token);
    return {
      user: data.data.user,
      token: data.data.token
    };
  },

  async getCurrentUser(): Promise<User | null> {
    if (!authToken) return null;
    try {
      const res = await fetch('/api/v1/auth/me', { headers: getHeaders() });
      if (!res.ok) return null;
      const data = await res.json();
      return data.data?.user || null;
    } catch {
      return null;
    }
  },

  // --- Real-time Convergence Sync ---
  async syncState(sequence = 0) {
    try {
      const res = await fetch(`/api/v1/sync?sequence=${sequence}`, { headers: getHeaders() });
      if (!res.ok) return null;
      return await res.json();
    } catch (err) {
      return null; // Network offline
    }
  },

  // --- Hospitality ---
  async getTables(): Promise<DiningTable[]> {
    const res = await fetch('/api/v1/hospitality/tables', { headers: getHeaders() });
    const data = await res.json();
    return data.data || [];
  },

  async transferTable(sourceTableId: string, targetTableId: string): Promise<boolean> {
    const res = await fetch('/api/v1/hospitality/tables/transfer', {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({
        source_table_id: sourceTableId,
        target_table_id: targetTableId
      })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to transfer table.');
    return data.success;
  },

  // --- Orders with Optimistic Concurrency ---
  async saveOrder(order: Order, expectedVersion?: number): Promise<{ order: Order; version: number }> {
    const res = await fetch('/api/v1/orders', {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ order, expected_version: expectedVersion })
    });
    const data = await res.json();
    if (res.status === 409) {
      throw new Error(`CONCURRENCY_CONFLICT: ${data.error}`);
    }
    if (!res.ok || !data.success) {
      throw new Error(data.error || 'Failed to save order.');
    }
    return { order: data.data, version: data.version };
  },

  // --- KOT Dispatches ---
  async fireKot(orderId: string, items: any[], tableNumber?: string) {
    const res = await fetch('/api/v1/kot/fire', {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({
        order_id: orderId,
        items,
        table_number: tableNumber
      })
    });
    const data = await res.json();
    if (!res.ok || !data.success) throw new Error(data.error || 'Failed to fire KOT.');
    return data.tickets;
  },

  async bumpKotStatus(ticketId: string, nextStatus: string) {
    const res = await fetch('/api/v1/kot/bump', {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ ticket_id: ticketId, next_status: nextStatus })
    });
    const data = await res.json();
    if (!res.ok || !data.success) throw new Error(data.error || 'Failed to bump KOT.');
    return data.ticket;
  },

  // --- Payments & Sales ---
  async settleSale(sale: Sale): Promise<Sale> {
    const res = await fetch('/api/v1/payments/settle', {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ sale })
    });
    const data = await res.json();
    if (!res.ok || !data.success) throw new Error(data.error || 'Failed to settle sale.');
    return data.sale;
  },

  // --- Shift / Till Sessions ---
  async openShift(openingFloat: number, terminalId?: string): Promise<TillSession> {
    const res = await fetch('/api/v1/shifts/open', {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ opening_float: openingFloat, terminal_id: terminalId })
    });
    const data = await res.json();
    if (!res.ok || !data.success) throw new Error(data.error || 'Failed to open shift.');
    return data.data;
  },

  async recordCashMovement(sessionId: string, type: 'PAID_IN' | 'PAID_OUT', amount: number, reason: string): Promise<TillSession> {
    const res = await fetch('/api/v1/shifts/cash-movement', {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ session_id: sessionId, type, amount, reason })
    });
    const data = await res.json();
    if (!res.ok || !data.success) throw new Error(data.error || 'Failed to record cash movement.');
    return data.data;
  },

  async closeShift(sessionId: string, actualCashCount: number): Promise<TillSession> {
    const res = await fetch('/api/v1/shifts/close', {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ session_id: sessionId, actual_cash_count: actualCashCount })
    });
    const data = await res.json();
    if (!res.ok || !data.success) throw new Error(data.error || 'Failed to close shift.');
    return data.data;
  }
};
