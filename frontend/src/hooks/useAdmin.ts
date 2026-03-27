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
    throw new Error('UNAUTHORIZED');
  }
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}
