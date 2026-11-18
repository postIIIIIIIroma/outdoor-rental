export type Errors = Record<string, string>;
export type Paged<T> = { items: T[]; total: number; page: number; pageSize: number };
export type Lookups = {
  users: { id: number; name: string }[];
  categories: { id: number; name: string }[];
  equipment: { id: number; label: string; status: string | null; hourlyRate: number | null }[];
};

export class ApiError extends Error {
  status: number;
  errors: Errors;
  constructor(status: number, message: string, errors: Errors = {}) {
    super(message);
    this.status = status;
    this.errors = errors;
  }
}

async function request<T>(method: string, url: string, body?: unknown): Promise<T> {
  const res = await fetch('/api' + url, {
    method,
    headers: body !== undefined ? { 'Content-Type': 'application/json' } : undefined,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  if (res.status === 204) return undefined as T;
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    const errors: Errors = {};
    if (data && data.errors) {
      for (const [k, v] of Object.entries(data.errors as Record<string, string[]>)) {
        const key = k.replace(/^\$\./, '');
        errors[key.charAt(0).toLowerCase() + key.slice(1)] = v[0];
      }
    }
    const msg = Object.keys(errors).length
      ? 'Сервер відхилив дані — перевірте поля'
      : data?.message ?? (res.status === 404 ? 'Запис не знайдено' : `Помилка ${res.status}`);
    throw new ApiError(res.status, msg, errors);
  }
  return data as T;
}

export const api = {
  get: <T = any>(url: string) => request<T>('GET', url),
  post: <T = any>(url: string, body: unknown) => request<T>('POST', url, body),
  put: <T = any>(url: string, body: unknown) => request<T>('PUT', url, body),
  del: (url: string) => request<void>('DELETE', url),
};

export const qs = (p: Record<string, unknown>) => {
  const s = new URLSearchParams();
  Object.entries(p).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') s.set(k, String(v));
  });
  return s.toString();
};

// trim + порожні рядки -> null
export const clean = (v: Record<string, any>) =>
  Object.fromEntries(
    Object.entries(v).map(([k, x]) => [k, typeof x === 'string' ? (x.trim() === '' ? null : x.trim()) : x])
  );

export const EQUIPMENT_STATUSES = ['доступний', 'в оренді', 'на ТО', 'списано'];
export const RENTAL_STATUSES = ['активна', 'завершена', 'скасована'];

export const toIso = (s: string) => (s ? (s.length === 16 ? s + ':00' : s) : null);
export const toLocalInput = (s?: string | null) => (s ? s.slice(0, 16) : '');
export const nowLocal = () => {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 16);
};
export const fmtDate = (s?: string | null) =>
  s ? new Date(s).toLocaleString('uk-UA', { dateStyle: 'short', timeStyle: 'short' }) : '—';
export const fmtMoney = (n?: number | null) => (n == null ? '—' : `${Number(n).toFixed(2)} ₴`);
