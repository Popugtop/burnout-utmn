import { useState, useEffect, useCallback } from 'react';
import { AdminUser } from '../types';

const STORAGE_KEY = 'burnout_admin_token';

export function getAdminToken(): string | null {
  return sessionStorage.getItem(STORAGE_KEY);
}

export function setAdminToken(token: string) {
  sessionStorage.setItem(STORAGE_KEY, token);
}

export function clearAdminToken() {
  sessionStorage.removeItem(STORAGE_KEY);
}

export async function adminFetch<T>(url: string, options?: RequestInit): Promise<T> {
  const token = getAdminToken();
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...(options?.headers || {}),
    },
  });
  if (res.status === 401) {
    clearAdminToken();
    window.location.href = '/admin';
    throw new Error('UNAUTHORIZED');
  }
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export function useAuth() {
  const [admin, setAdmin] = useState<AdminUser | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [showPasswordWarning, setShowPasswordWarning] = useState(false);

  useEffect(() => {
    const token = getAdminToken();
    if (!token) {
      setLoading(false);
      return;
    }
    fetch('/api/auth/me', {
      headers: { Authorization: `Bearer ${token}` },
    }).then(async res => {
      if (res.ok) {
        const data = await res.json() as AdminUser;
        setAdmin(data);
        setIsAuthenticated(true);
      } else {
        clearAdminToken();
      }
    }).catch(() => {
      clearAdminToken();
    }).finally(() => setLoading(false));
  }, []);

  const login = useCallback(async (username: string, password: string) => {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });
    if (!res.ok) {
      const err = await res.json() as { error: string };
      throw new Error(err.error || 'Login failed');
    }
    const data = await res.json() as { token: string; admin: AdminUser; showPasswordWarning: boolean };
    setAdminToken(data.token);
    setAdmin(data.admin);
    setIsAuthenticated(true);
    setShowPasswordWarning(data.showPasswordWarning);
  }, []);

  const logout = useCallback(async () => {
    try {
      await adminFetch('/api/auth/logout', { method: 'POST' });
    } catch { /* ignore */ }
    clearAdminToken();
    setAdmin(null);
    setIsAuthenticated(false);
  }, []);

  return { admin, isAuthenticated, loading, login, logout, showPasswordWarning, setShowPasswordWarning };
}
