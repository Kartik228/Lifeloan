/**
 * LifeLoan Centralized API Client
 * Single Source of Truth for backend communication, JWT management, and Indian currency formatting.
 */

export const API_BASE_URL =
  (import.meta as any).env?.VITE_API_URL || 'http://127.0.0.1:8000';

export function getAuthToken(): string | null {
  return localStorage.getItem('lifeloan_token');
}

export function setAuthSession(token: string, user: any) {
  localStorage.setItem('lifeloan_token', token);
  localStorage.setItem('lifeloan_user', JSON.stringify(user));
  localStorage.setItem('lifeloan_logged_in', 'true');
  if (user && user.id) {
    localStorage.setItem('user_id', String(user.id));
  }
}

export function clearAuthSession() {
  localStorage.removeItem('lifeloan_token');
  localStorage.removeItem('lifeloan_user');
  localStorage.removeItem('lifeloan_logged_in');
  localStorage.removeItem('user_id');
}

export function getStoredUser(): { id: number; full_name: string; email: string; phone?: string } | null {
  const userStr = localStorage.getItem('lifeloan_user');
  if (!userStr) return null;
  try {
    return JSON.parse(userStr);
  } catch {
    return null;
  }
}

interface RequestOptions extends RequestInit {
  auth?: boolean;
}

export async function apiRequest<T = any>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<T> {
  const { auth = true, headers = {}, ...rest } = options;

  const requestHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(headers as Record<string, string>),
  };

  if (auth) {
    const token = getAuthToken();
    if (token) {
      requestHeaders['Authorization'] = `Bearer ${token}`;
    }
  }

  const url = endpoint.startsWith('http')
    ? endpoint
    : `${API_BASE_URL}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;

  let response: Response;
  try {
    response = await fetch(url, {
      headers: requestHeaders,
      ...rest,
    });
  } catch (networkError: any) {
    throw new Error(
      'Unable to connect to LifeLoan backend service. Please check your network or server status.'
    );
  }

  // Auto-handle 401 Unauthorized
  if (response.status === 401 && auth) {
    clearAuthSession();
    // Dispatch custom event so UI can redirect if necessary
    window.dispatchEvent(new CustomEvent('lifeloan-unauthorized'));
  }

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const message =
      data.detail ||
      data.error ||
      data.message ||
      `Request failed with status ${response.status}`;
    throw new Error(message);
  }

  return data as T;
}

export const api = {
  get: <T = any>(endpoint: string, options?: RequestOptions) =>
    apiRequest<T>(endpoint, { method: 'GET', ...options }),

  post: <T = any>(endpoint: string, body?: any, options?: RequestOptions) =>
    apiRequest<T>(endpoint, {
      method: 'POST',
      body: body !== undefined ? JSON.stringify(body) : undefined,
      ...options,
    }),

  put: <T = any>(endpoint: string, body?: any, options?: RequestOptions) =>
    apiRequest<T>(endpoint, {
      method: 'PUT',
      body: body !== undefined ? JSON.stringify(body) : undefined,
      ...options,
    }),

  delete: <T = any>(endpoint: string, options?: RequestOptions) =>
    apiRequest<T>(endpoint, { method: 'DELETE', ...options }),
};

// ============================================================
// FORMATTING HELPERS (₹ Indian Rupee & Indian Numbering)
// ============================================================

export function formatINR(amount: number, options: { decimals?: number; prefix?: boolean } = {}): string {
  const { decimals = 0, prefix = true } = options;
  const num = Number(amount) || 0;
  const formatted = Math.abs(num).toLocaleString('en-IN', {
    maximumFractionDigits: decimals,
    minimumFractionDigits: decimals,
  });
  const sign = num < 0 ? '-' : '';
  const currencyPrefix = prefix ? '₹' : '';
  return `${sign}${currencyPrefix}${formatted}`;
}

export function formatDateIN(dateStr?: string | null): string {
  if (!dateStr) return 'Date unavailable';
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return dateStr;
  return date.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}
