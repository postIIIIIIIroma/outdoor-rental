import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import {
  api, fmtDate, fmtMoney, nowLocal, RENTAL_STATUSES, toIso, toLocalInput, type Errors, type Lookups,
} from '../api';
import { useFetch, useForm, useList } from '../hooks';
import {
  Alert, Button, Card, CardHeader, DataTable, Field, FormActions, FormErrors, InfoGrid, Input, LinkButton,
  Loading, PageHeader, Select, SimpleTable, StatusBadge,
} from '../ui';

type RentalRow = {
  id: number; userId: number | null; userName: string | null; startTime: string; endTime: string | null;
  totalPrice: number | null; status: string | null; itemsCount: number;
};

export function RentalsList() {
  const nav = useNavigate();
  const l = useList<RentalRow>('/rentals', { sort: 'startTime', dir: 'desc', search: '', status: '' });
  return (
    <>
      <PageHeader title="Оренди" subtitle="Видача та повернення спорядження" actions={<LinkButton to="/rentals/new">+ Нова оренда</LinkButton>} />
      <DataTable
        l={l}
        onRowClick={(r) => nav(`/rentals/${r.id}`)}
        empty="Оренд не знайдено"
        filters={
          <>
            <Input className="sm:max-w-xs" placeholder="Пошук: клієнт або телефон"
              value={l.params.search} onChange={(e) => l.set({ search: e.target.value })} />
            <Select className="sm:max-w-44" value={l.params.status} onChange={(e) => l.set({ status: e.target.value })}>
              <option value="">Усі статуси</option>
              {RENTAL_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
            </Select>
          </>
        }
        cols={[
          { key: 'id', label: '#', sortable: true, render: (r) => <span className="text-slate-400">{r.id}</span> },
          { key: 'user', label: 'Клієнт', sortable: true, render: (r) => <span className="font-medium">{r.userName ?? '—'}</span> },
          { key: 'startTime', label: 'Початок', sortable: true, render: (r) => fmtDate(r.startTime) },
          { key: 'endTime', label: 'Кінець', sortable: true, render: (r) => fmtDate(r.endTime) },
          { key: 'itemsCount', label: 'Позицій', sortable: true, render: (r) => r.itemsCount },
          { key: 'totalPrice', label: 'Сума', sortable: true, render: (r) => fmtMoney(r.totalPrice) },
          { key: 'status', label: 'Статус', sortable: true, render: (r) => <StatusBadge status={r.status} /> },
        ]}
      />
    </>
  );
}

export function RentalDetail() {
  const { id } = useParams();
  const nav = useNavigate();
  const { data: r, error, setError, reload } = useFetch<any>(`/rentals/${id}`);

  const remove = async () => {
    if (!confirm('Видалити цю оренду?')) return;
    try {
      await api.del(`/rentals/${id}`);
      nav('/rentals');
    } catch (e: any) {
      setError(e.message);
    }
  };

  const finish = async () => {
    try {
      await api.put(`/rentals/${id}`, {
        userId: r.userId, startTime: r.startTime, endTime: toIso(nowLocal()), totalPrice: r.totalPrice,
        status: 'завершена',
        items: r.items.map((i: any) => ({ equipmentId: i.equipmentId, wearConditionReturned: i.wearConditionReturned })),
      });
      setError('');
      reload();
    } catch (e: any) {
      setError(e.message + (e.errors ? ': ' + Object.values(e.errors).join('; ') : ''));
    }
  };

  if (!r) return error ? <Alert>{error}</Alert> : <Loading />;
  const start = new Date(r.startTime).getTime();
  const end = r.endTime ? new Date(r.endTime).getTime() : Date.now();
  const hours = Math.max(0, (end - start) / 36e5);
  const rate = r.items.reduce((s: number, i: any) => s + (i.hourlyRate ?? 0), 0);

  return (
    <>
      <PageHeader
        title={<span className="flex items-center gap-3">Оренда #{r.id} <StatusBadge status={r.status} /></span>}
        subtitle={`${fmtDate(r.startTime)} → ${fmtDate(r.endTime)}`}
        actions={
          <>
            <LinkButton variant="secondary" to="/rentals">← До списку</LinkButton>
            {r.status === 'активна' && <Button onClick={finish}>Завершити зараз</Button>}
            <LinkButton variant="secondary" to={`/rentals/${id}/edit`}>Редагувати</LinkButton>
            <Button variant="danger" onClick={remove}>Видалити</Button>
          </>
        }
      />
      {error && <Alert>{error}</Alert>}
      <div className="grid lg:grid-cols-3 gap-5">
        <Card>
          <CardHeader title="Клієнт" />
          {r.user ? (
            <InfoGrid items={[
              ['Імʼя', <Link className="text-emerald-700 font-medium hover:underline" to={`/users/${r.user.id}`}>{r.user.lastName}{r.user.firstName}</Link>],
              ['Телефон', r.user.phone], ['Email', r.user.email],
            ]} />
          ) : <div className="p-5 text-slate-400">Клієнта не вказано</div>}
        </Card>
        <Card className="lg:col-span-2">
          <CardHeader title="Деталі оренди" />
          <InfoGrid items={[
            ['Початок', fmtDate(r.startTime)],
            ['Кінець', fmtDate(r.endTime)],
            ['Тривалість', `${hours.toFixed(1)} год${r.endTime ? '' : ' (триває)'}`],
            ['Сума', fmtMoney(r.totalPrice)],
            ['Тариф позицій', `${rate.toFixed(2)} ₴/год`],
            ['Орієнтовно за тарифом', fmtMoney(rate * hours)],
          ]} />
        </Card>
        <Card className="lg:col-span-3">
          <CardHeader title={`Спорядження (${r.items.length})`} />
          <SimpleTable
            head={['Модель', 'Категорія', 'Розмір', 'Серійний №', 'Тариф', 'Стан після повернення']}
            rows={r.items.map((i: any) => [
              <Link className="text-emerald-700 font-medium hover:underline" to={`/equipment/${i.equipmentId}`}>{i.modelName ?? '—'}</Link>,
              i.categoryName ?? '—', i.size ?? '—', <span className="font-mono text-xs">{i.serialNumber ?? '—'}</span>,
              `${fmtMoney(i.hourlyRate)}/год`, i.wearConditionReturned ?? <span className="text-slate-400">—</span>,
            ])}
            empty="Позицій немає"
          />
        </Card>
      </div>
    </>
  );
}

type ItemRow = { equipmentId: string; wearConditionReturned: string };
type RentalFormT = { userId: string; startTime: string; endTime: string; totalPrice: string; status: string; items: ItemRow[] };
const emptyItem: ItemRow = { equipmentId: '', wearConditionReturned: '' };

const validateRental = (v: RentalFormT): Errors => {
  const e: Errors = {};
  if (!v.userId) e.userId = 'Оберіть клієнта';
  if (!v.startTime) e.startTime = 'Вкажіть час початку';
  if (v.endTime && v.startTime && v.endTime < v.startTime) e.endTime = 'Кінець не може бути раніше початку';
  if (v.status === 'завершена' && !v.endTime) e.endTime = 'Для завершеної оренди вкажіть час закінчення';
  if (String(v.totalPrice).trim() !== '') {
    const p = Number(v.totalPrice);
    if (isNaN(p) || p < 0 || p > 1000000) e.totalPrice = 'Сума від 0 до 1 000 000';
  }
  if (v.items.length === 0) e.items = 'Додайте хоча б одну позицію';
  else if (v.items.some((i) => !i.equipmentId)) e.items = 'Оберіть спорядження в кожному рядку';
  else if (new Set(v.items.map((i) => i.equipmentId)).size !== v.items.length) e.items = 'Спорядження в списку повторюється';
  else if (v.items.some((i) => i.wearConditionReturned.length > 100)) e.items = 'Опис стану - максимум 100 символів';
  return e;
};

export function RentalFormPage() {
  const { id } = useParams();
  const nav = useNavigate();
  const [sp] = useSearchParams();
  const { data: lk } = useFetch<Lookups>('/lookups');

  const f = useForm<RentalFormT>(
    { userId: sp.get('userId') ?? '', startTime: nowLocal(), endTime: '', totalPrice: '', status: 'активна', items: [{ ...emptyItem }] },
    {
      load: id ? `/rentals/${id}` : undefined,
      fromServer: (d) => ({
        userId: String(d.userId ?? ''),
        startTime: toLocalInput(d.startTime),
        endTime: toLocalInput(d.endTime),
        totalPrice: d.totalPrice == null ? '' : String(d.totalPrice),
        status: d.status ?? 'активна',
        items: d.items.map((i: any) => ({ equipmentId: String(i.equipmentId ?? ''), wearConditionReturned: i.wearConditionReturned ?? '' })),
      }),
      validate: validateRental,
      submit: (v) => {
        const body = {
          userId: Number(v.userId),
          startTime: toIso(v.startTime),
          endTime: toIso(v.endTime),
          totalPrice: String(v.totalPrice).trim() === '' ? null : Number(v.totalPrice),
          status: v.status,
          items: v.items.map((i) => ({ equipmentId: Number(i.equipmentId), wearConditionReturned: i.wearConditionReturned.trim() || null })),
        };
        return id ? api.put(`/rentals/${id}`, body) : api.post('/rentals', body);
      },
      onSuccess: (r) => nav(`/rentals/${id ?? r.id}`),
    }
  );

  const items = f.values.items;
  const setItem = (idx: number, patch: Partial<ItemRow>) =>
    f.set('items', items.map((it, i) => (i === idx ? { ...it, ...patch } : it)));
  const rateOf = (eqId: string) => lk?.equipment.find((e) => String(e.id) === eqId)?.hourlyRate ?? 0;
  const ratePerHour = items.reduce((s, i) => s + (rateOf(i.equipmentId) || 0), 0);
  const hours = f.values.endTime && f.values.startTime
    ? Math.max(0, (new Date(f.values.endTime).getTime() - new Date(f.values.startTime).getTime()) / 36e5)
    : 0;

  if (f.loading) return <Loading />;
  return (
    <>
      <PageHeader title={id ? `Редагування оренди #${id}` : 'Нова оренда'} />
      <Card className="max-w-3xl">
        <form onSubmit={f.onSubmit} noValidate className="p-5 space-y-5">
          <FormErrors message={f.serverError} errors={f.errors} />
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Клієнт" required error={f.errors.userId}>
              <Select {...f.bind('userId')}>
                <option value="">— оберіть клієнта —</option>
                {lk?.users.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
              </Select>
            </Field>
            <Field label="Статус" required error={f.errors.status}>
              <Select {...f.bind('status')}>
                {RENTAL_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
              </Select>
            </Field>
            <Field label="Початок" required error={f.errors.startTime}><Input type="datetime-local" {...f.bind('startTime')} /></Field>
            <Field label="Кінець" error={f.errors.endTime}><Input type="datetime-local" {...f.bind('endTime')} /></Field>
            <Field label="Сума, ₴" error={f.errors.totalPrice}
              hint={hours > 0
                ? `За тарифом: ${(ratePerHour * hours).toFixed(2)} ₴ (${hours.toFixed(1)} год × ${ratePerHour} ₴/год)`
                : `Тариф обраних позицій: ${ratePerHour} ₴/год`}>
              <Input type="number" step="0.01" min="0" {...f.bind('totalPrice')} />
            </Field>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-slate-700">Спорядження <span className="text-red-500">*</span></span>
              <Button variant="secondary" onClick={() => f.set('items', [...items, { ...emptyItem }])}>+ Додати позицію</Button>
            </div>
            <div className="space-y-2">
              {items.map((it, idx) => (
                <div key={idx} className="flex flex-col sm:flex-row gap-2 rounded-lg bg-slate-50 p-2">
                  <Select className="sm:flex-[2]" value={it.equipmentId} onChange={(e) => setItem(idx, { equipmentId: e.target.value })}>
                    <option value="">— оберіть спорядження —</option>
                    {lk?.equipment.map((e) => <option key={e.id} value={e.id}>{`${e.label} — ${e.status ?? ''}`}</option>)}
                  </Select>
                  <Input className="sm:flex-1" placeholder="Стан після повернення" value={it.wearConditionReturned}
                    onChange={(e) => setItem(idx, { wearConditionReturned: e.target.value })} />
                  <Button variant="ghost" title="Прибрати" onClick={() => f.set('items', items.filter((_, i) => i !== idx))}>✕</Button>
                </div>
              ))}
            </div>
            {f.errors.items && <p className="text-xs text-red-600 mt-1">{f.errors.items}</p>}
          </div>

          <FormActions saving={f.saving} onCancel={() => nav(-1)} />
        </form>
      </Card>
    </>
  );
}
