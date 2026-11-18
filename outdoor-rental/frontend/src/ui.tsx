import type {
  ButtonHTMLAttributes, InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes,
} from 'react';
import { Link } from 'react-router-dom';
import type { ListState } from './hooks';
import type { Errors } from './api';

export const cls = (...c: (string | false | undefined | null)[]) => c.filter(Boolean).join(' ');

export function PageHeader({ title, subtitle, actions }: { title: ReactNode; subtitle?: ReactNode; actions?: ReactNode }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3 mb-5">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">{title}</h1>
        {subtitle && <p className="text-sm text-slate-500 mt-1">{subtitle}</p>}
      </div>
      <div className="flex flex-wrap gap-2">{actions}</div>
    </div>
  );
}

export function Card({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cls('bg-white rounded-xl border border-slate-200 shadow-sm', className)}>{children}</div>;
}

export function CardHeader({ title, actions }: { title: ReactNode; actions?: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 px-5 py-3 border-b border-slate-200">
      <h2 className="font-semibold text-slate-800">{title}</h2>
      {actions}
    </div>
  );
}

const btnVariants = {
  primary: 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm',
  secondary: 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-50',
  danger: 'bg-red-600 text-white hover:bg-red-700 shadow-sm',
  ghost: 'text-slate-600 hover:bg-slate-100',
};
type Variant = keyof typeof btnVariants;
const btnBase =
  'inline-flex items-center justify-center gap-1 rounded-lg px-3.5 py-2 text-sm font-medium transition whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed';

export function Button({ variant = 'primary', className, type = 'button', ...p }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  return <button type={type} className={cls(btnBase, btnVariants[variant], className)}{...p} />;
}

export function LinkButton({ to, variant = 'primary', children }: { to: string; variant?: Variant; children: ReactNode }) {
  return <Link to={to} className={cls(btnBase, btnVariants[variant])}>{children}</Link>;
}

const inputCls = (err?: string) =>
  cls(
    'w-full rounded-lg border bg-white px-3 py-2 text-sm outline-none transition focus:ring-2',
    err ? 'border-red-400 focus:ring-red-100' : 'border-slate-300 focus:border-emerald-500 focus:ring-emerald-100'
  );

export function Input({ error, className, ...p }: InputHTMLAttributes<HTMLInputElement> & { error?: string }) {
  return <input className={cls(inputCls(error), className)}{...p} />;
}
export function Select({ error, className, ...p }: SelectHTMLAttributes<HTMLSelectElement> & { error?: string }) {
  return <select className={cls(inputCls(error), className)}{...p} />;
}
export function Textarea({ error, className, ...p }: TextareaHTMLAttributes<HTMLTextAreaElement> & { error?: string }) {
  return <textarea className={cls(inputCls(error), className)} rows={3}{...p} />;
}

export function Field({ label, error, required, hint, children }: { label: string; error?: string; required?: boolean; hint?: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="block text-sm font-medium text-slate-700 mb-1">
        {label}
        {required && <span className="text-red-500"> *</span>}
      </span>
      {children}
      {error ? (
        <span className="block text-xs text-red-600 mt-1">{error}</span>
      ) : hint ? (
        <span className="block text-xs text-slate-400 mt-1">{hint}</span>
      ) : null}
    </label>
  );
}

export function Alert({ children, kind = 'error' }: { children: ReactNode; kind?: 'error' | 'info' }) {
  return (
    <div className={cls('rounded-lg border px-4 py-3 text-sm mb-4',
      kind === 'error' ? 'border-red-200 bg-red-50 text-red-700' : 'border-sky-200 bg-sky-50 text-sky-700')}>
      {children}
    </div>
  );
}

export function FormErrors({ message, errors }: { message?: string; errors: Errors }) {
  if (!message) return null;
  const list = Object.values(errors).filter(Boolean);
  return (
    <Alert>
      <div className="font-medium">{message}</div>
      {list.length > 0 && (
        <ul className="list-disc ml-5 mt-1">
          {list.map((m, i) => <li key={i}>{m}</li>)}
        </ul>
      )}
    </Alert>
  );
}

export function FormActions({ saving, onCancel }: { saving: boolean; onCancel: () => void }) {
  return (
    <div className="flex gap-2 pt-4 border-t border-slate-100">
      <Button type="submit" disabled={saving}>{saving ? 'Збереження…' : 'Зберегти'}</Button>
      <Button variant="secondary" onClick={onCancel}>Скасувати</Button>
    </div>
  );
}

export function Loading() {
  return <div className="py-16 text-center text-slate-400">Завантаження…</div>;
}

const badgeColors: Record<string, string> = {
  'доступний': 'bg-emerald-100 text-emerald-700',
  'в оренді': 'bg-amber-100 text-amber-700',
  'на ТО': 'bg-orange-100 text-orange-700',
  'списано': 'bg-slate-200 text-slate-600',
  'активна': 'bg-sky-100 text-sky-700',
  'завершена': 'bg-emerald-100 text-emerald-700',
  'скасована': 'bg-slate-200 text-slate-600',
};
export function StatusBadge({ status }: { status?: string | null }) {
  return (
    <span className={cls('inline-block rounded-full px-2.5 py-0.5 text-xs font-medium whitespace-nowrap',
      badgeColors[status ?? ''] ?? 'bg-slate-100 text-slate-600')}>
      {status ?? '—'}
    </span>
  );
}

export function InfoGrid({ items }: { items: [string, ReactNode][] }) {
  return (
    <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4 p-5">
      {items.map(([k, v]) => (
        <div key={k}>
          <dt className="text-xs uppercase tracking-wide text-slate-400">{k}</dt>
          <dd className="mt-0.5 text-sm text-slate-800">{v ?? '—'}</dd>
        </div>
      ))}
    </dl>
  );
}

export function SimpleTable({ head, rows, empty = 'Немає даних' }: { head: string[]; rows: ReactNode[][]; empty?: string }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="bg-slate-50 text-slate-500">
          <tr>{head.map((h, i) => <th key={i} className="px-4 py-2.5 text-left font-medium whitespace-nowrap">{h}</th>)}</tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr><td colSpan={head.length} className="px-4 py-8 text-center text-slate-400">{empty}</td></tr>
          ) : (
            rows.map((r, i) => (
              <tr key={i} className="border-t border-slate-100">
                {r.map((c, j) => <td key={j} className="px-4 py-2.5">{c}</td>)}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

export function Pagination({ page, pageSize, total, onPage, onPageSize }: {
  page: number; pageSize: number; total: number; onPage: (p: number) => void; onPageSize: (n: number) => void;
}) {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 border-t border-slate-200 text-sm text-slate-600">
      <span>Всього записів: <b>{total}</b></span>
      <div className="flex items-center gap-2">
        <select value={pageSize} onChange={(e) => onPageSize(Number(e.target.value))}
          className="border border-slate-300 rounded-md px-2 py-1.5 bg-white">
          {[5, 10, 20, 50].map((n) => <option key={n} value={n}>{n} / стор.</option>)}
        </select>
        <Button variant="secondary" disabled={page <= 1} onClick={() => onPage(page - 1)}>←</Button>
        <span className="min-w-16 text-center">{page} / {pages}</span>
        <Button variant="secondary" disabled={page >= pages} onClick={() => onPage(page + 1)}>→</Button>
      </div>
    </div>
  );
}

export type Col<T> = { key: string; label: string; sortable?: boolean; className?: string; render: (row: T) => ReactNode };

export function DataTable<T extends { id: number }>({ l, cols, filters, onRowClick, empty = 'Нічого не знайдено' }: {
  l: ListState<T>; cols: Col<T>[]; filters?: ReactNode; onRowClick?: (row: T) => void; empty?: string;
}) {
  const items = l.data?.items ?? [];
  return (
    <Card>
      {filters && <div className="flex flex-wrap gap-3 p-4 border-b border-slate-200">{filters}</div>}
      {l.error && <div className="px-4 pt-4"><Alert>{l.error}</Alert></div>}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-500 border-b border-slate-200">
            <tr>
              {cols.map((c) => (
                <th key={c.key} className={cls('px-4 py-3 text-left font-medium whitespace-nowrap', c.className)}>
                  {c.sortable ? (
                    <button type="button" onClick={() => l.toggleSort(c.key)}
                      className={cls('inline-flex items-center gap-1 hover:text-slate-900', l.params.sort === c.key && 'text-emerald-700')}>
                      {c.label}
                      <span className="text-[10px]">{l.params.sort === c.key ? (l.params.dir === 'desc' ? '▼' : '▲') : '↕'}</span>
                    </button>
                  ) : c.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className={cls('transition-opacity', l.loading && 'opacity-50')}>
            {items.map((row) => (
              <tr key={row.id} onClick={onRowClick ? () => onRowClick(row) : undefined}
                className={cls('border-b border-slate-100 last:border-0', onRowClick && 'cursor-pointer hover:bg-emerald-50/50')}>
                {cols.map((c) => <td key={c.key} className={cls('px-4 py-3', c.className)}>{c.render(row)}</td>)}
              </tr>
            ))}
            {!l.loading && items.length === 0 && (
              <tr><td colSpan={cols.length} className="px-4 py-10 text-center text-slate-400">{empty}</td></tr>
            )}
            {l.loading && !l.data && (
              <tr><td colSpan={cols.length} className="px-4 py-10 text-center text-slate-400">Завантаження…</td></tr>
            )}
          </tbody>
        </table>
      </div>
      {l.data && (
        <Pagination page={l.data.page} pageSize={l.data.pageSize} total={l.data.total}
          onPage={l.setPage} onPageSize={(n) => l.set({ pageSize: n })} />
      )}
    </Card>
  );
}
