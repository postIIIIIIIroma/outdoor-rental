import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { api, clean, EQUIPMENT_STATUSES, fmtDate, fmtMoney, type Errors, type Lookups } from '../api';
import { useFetch, useForm, useList } from '../hooks';
import {
  Alert, Button, Card, CardHeader, DataTable, Field, FormActions, FormErrors, InfoGrid, Input, LinkButton,
  Loading, PageHeader, Select, SimpleTable, StatusBadge,
} from '../ui';

type EqRow = {
  id: number; modelName: string; serialNumber: string | null; size: string | null;
  status: string | null; hourlyRate: number | null; categoryName: string | null;
};

export function EquipmentList() {
  const nav = useNavigate();
  const [sp] = useSearchParams();
  const { data: lk } = useFetch<Lookups>('/lookups');
  const l = useList<EqRow>('/equipment', {
    sort: 'modelName', dir: 'asc', search: '', categoryId: sp.get('categoryId') ?? '', status: '',
  });
  return (
    <>
      <PageHeader title="Спорядження" subtitle="Облік одиниць спорядження" actions={<LinkButton to="/equipment/new">+ Додати</LinkButton>} />
      <DataTable
        l={l}
        onRowClick={(e) => nav(`/equipment/${e.id}`)}
        filters={
          <>
            <Input className="sm:max-w-xs" placeholder="Пошук: модель або серійний №"
              value={l.params.search} onChange={(e) => l.set({ search: e.target.value })} />
            <Select className="sm:max-w-56" value={l.params.categoryId} onChange={(e) => l.set({ categoryId: e.target.value })}>
              <option value="">Усі категорії</option>
              {lk?.categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </Select>
            <Select className="sm:max-w-44" value={l.params.status} onChange={(e) => l.set({ status: e.target.value })}>
              <option value="">Усі статуси</option>
              {EQUIPMENT_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
            </Select>
          </>
        }
        cols={[
          { key: 'id', label: '#', sortable: true, render: (e) => <span className="text-slate-400">{e.id}</span> },
          { key: 'modelName', label: 'Модель', sortable: true, render: (e) => <span className="font-medium">{e.modelName}</span> },
          { key: 'serialNumber', label: 'Серійний №', sortable: true, render: (e) => <span className="font-mono text-xs">{e.serialNumber ?? '—'}</span> },
          { key: 'category', label: 'Категорія', sortable: true, render: (e) => e.categoryName ?? '—' },
          { key: 'size', label: 'Розмір', sortable: true, render: (e) => e.size ?? '—' },
          { key: 'hourlyRate', label: 'Тариф/год', sortable: true, render: (e) => fmtMoney(e.hourlyRate) },
          { key: 'status', label: 'Статус', sortable: true, render: (e) => <StatusBadge status={e.status} /> },
        ]}
      />
    </>
  );
}

type InspForm = { inspectorName: string; isSafe: string; notes: string };
const emptyInsp: InspForm = { inspectorName: '', isSafe: 'true', notes: '' };

export function EquipmentDetail() {
  const { id } = useParams();
  const nav = useNavigate();
  const { data: e, error, setError, reload } = useFetch<any>(`/equipment/${id}`);

  const insp = useForm<InspForm>(emptyInsp, {
    validate: (v) => {
      const er: Errors = {};
      if (!v.inspectorName.trim()) er.inspectorName = 'Вкажіть інспектора';
      else if (v.inspectorName.trim().length > 100) er.inspectorName = 'Максимум 100 символів';
      if (v.notes.length > 2000) er.notes = 'Максимум 2000 символів';
      return er;
    },
    submit: (v) => api.post('/inspections', {
      equipmentId: Number(id), inspectorName: v.inspectorName.trim(), isSafe: v.isSafe === 'true', notes: v.notes.trim() || null,
    }),
    onSuccess: () => {
      insp.reset(emptyInsp);
      reload();
    },
  });

  const remove = async () => {
    if (!confirm('Видалити це спорядження?')) return;
    try {
      await api.del(`/equipment/${id}`);
      nav('/equipment');
    } catch (er: any) {
      setError(er.message);
    }
  };

  const removeInsp = async (iid: number) => {
    if (!confirm('Видалити запис огляду?')) return;
    try {
      await api.del(`/inspections/${iid}`);
      reload();
    } catch (er: any) {
      setError(er.message);
    }
  };

  if (!e) return error ? <Alert>{error}</Alert> : <Loading />;
  return (
    <>
      <PageHeader
        title={e.modelName}
        subtitle={`Серійний № ${e.serialNumber ?? '—'}`}
        actions={
          <>
            <LinkButton variant="secondary" to="/equipment">← До списку</LinkButton>
            <LinkButton variant="secondary" to={`/equipment/${id}/edit`}>Редагувати</LinkButton>
            <Button variant="danger" onClick={remove}>Видалити</Button>
          </>
        }
      />
      {error && <Alert>{error}</Alert>}
      <div className="grid lg:grid-cols-3 gap-5">
        <Card>
          <CardHeader title="Характеристики" actions={<StatusBadge status={e.status} />} />
          <InfoGrid items={[
            ['Категорія', e.categoryName], ['Розмір', e.size],
            ['Тариф', `${fmtMoney(e.hourlyRate)} / год`], ['Серійний №', e.serialNumber],
          ]} />
        </Card>
        <Card className="lg:col-span-2">
          <CardHeader title={`Історія оренд (${e.rentals.length})`} />
          <SimpleTable
            head={['Оренда', 'Клієнт', 'Початок', 'Кінець', 'Стан після', 'Статус']}
            rows={e.rentals.map((r: any) => [
              <Link className="text-emerald-700 font-medium hover:underline" to={`/rentals/${r.rentalId}`}>#{r.rentalId}</Link>,
              r.userName ?? '—', fmtDate(r.startTime), fmtDate(r.endTime), r.wearConditionReturned ?? '—',
              <StatusBadge status={r.status} />,
            ])}
            empty="Ще не орендувалось"
          />
        </Card>
        <Card className="lg:col-span-3">
          <CardHeader title="Огляди безпеки" />
          <form onSubmit={insp.onSubmit} noValidate
            className="grid sm:grid-cols-[1fr_170px_2fr_auto] gap-3 items-start p-5 border-b border-slate-100">
            <Field label="Інспектор" required error={insp.errors.inspectorName}><Input {...insp.bind('inspectorName')} /></Field>
            <Field label="Результат">
              <Select {...insp.bind('isSafe')}>
                <option value="true">Безпечне</option>
                <option value="false">Небезпечне</option>
              </Select>
            </Field>
            <Field label="Нотатки" error={insp.errors.notes}><Input {...insp.bind('notes')} /></Field>
            <div className="sm:pt-6"><Button type="submit" disabled={insp.saving}>Додати огляд</Button></div>
          </form>
          {insp.serverError && <div className="px-5 pt-4"><Alert>{insp.serverError}</Alert></div>}
          <SimpleTable
            head={['Дата', 'Інспектор', 'Результат', 'Нотатки', '']}
            rows={e.inspections.map((i: any) => [
              fmtDate(i.inspectedAt), i.inspectorName ?? '—',
              i.isSafe ? <span className="text-emerald-700 font-medium">✔ безпечне</span> : <span className="text-red-600 font-medium">✖ небезпечне</span>,
              <span className="text-slate-600">{i.notes ?? '—'}</span>,
              <Button variant="ghost" className="text-red-600" onClick={() => removeInsp(i.id)}>Видалити</Button>,
            ])}
            empty="Оглядів ще не було"
          />
        </Card>
      </div>
    </>
  );
}

type EqForm = { categoryId: string; modelName: string; serialNumber: string; size: string; status: string; hourlyRate: string };

const validateEq = (v: EqForm): Errors => {
  const e: Errors = {};
  if (!v.categoryId) e.categoryId = 'Оберіть категорію';
  if (!v.modelName.trim()) e.modelName = 'Назва моделі обовʼязкова';
  else if (v.modelName.trim().length > 150) e.modelName = 'Максимум 150 символів';
  const sn = v.serialNumber.trim();
  if (!sn) e.serialNumber = 'Серійний номер обовʼязковий';
  else if (sn.length > 50) e.serialNumber = 'Максимум 50 символів';
  else if (!/^[A-Za-z0-9-]+$/.test(sn)) e.serialNumber = 'Лише латиниця, цифри та дефіс';
  if (v.size.trim().length > 20) e.size = 'Максимум 20 символів';
  if (!v.status) e.status = 'Оберіть статус';
  const rate = Number(v.hourlyRate);
  if (String(v.hourlyRate).trim() === '' || isNaN(rate)) e.hourlyRate = 'Вкажіть ціну';
  else if (rate < 0.01 || rate > 100000) e.hourlyRate = 'Ціна від 0.01 до 100000';
  return e;
};

export function EquipmentFormPage() {
  const { id } = useParams();
  const nav = useNavigate();
  const { data: lk } = useFetch<Lookups>('/lookups');
  const f = useForm<EqForm>(
    { categoryId: '', modelName: '', serialNumber: '', size: '', status: 'доступний', hourlyRate: '' },
    {
      load: id ? `/equipment/${id}` : undefined,
      fromServer: (d) => ({
        categoryId: String(d.categoryId ?? ''), modelName: d.modelName ?? '', serialNumber: d.serialNumber ?? '',
        size: d.size ?? '', status: d.status ?? 'доступний', hourlyRate: d.hourlyRate == null ? '' : String(d.hourlyRate),
      }),
      validate: validateEq,
      submit: (v) => {
        const body = { ...clean(v), categoryId: Number(v.categoryId), hourlyRate: Number(v.hourlyRate) };
        return id ? api.put(`/equipment/${id}`, body) : api.post('/equipment', body);
      },
      onSuccess: (r) => nav(`/equipment/${id ?? r.id}`),
    }
  );

  if (f.loading) return <Loading />;
  return (
    <>
      <PageHeader title={id ? 'Редагування спорядження' : 'Нове спорядження'} />
      <Card className="max-w-2xl">
        <form onSubmit={f.onSubmit} noValidate className="p-5 space-y-4">
          <FormErrors message={f.serverError} errors={f.errors} />
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Категорія" required error={f.errors.categoryId}>
              <Select {...f.bind('categoryId')}>
                <option value="">— оберіть —</option>
                {lk?.categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </Select>
            </Field>
            <Field label="Модель" required error={f.errors.modelName}><Input {...f.bind('modelName')} /></Field>
            <Field label="Серійний №" required error={f.errors.serialNumber} hint="Напр. SHO-TAR-006"><Input {...f.bind('serialNumber')} /></Field>
            <Field label="Розмір" error={f.errors.size}><Input {...f.bind('size')} /></Field>
            <Field label="Статус" required error={f.errors.status}>
              <Select {...f.bind('status')}>
                {EQUIPMENT_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
              </Select>
            </Field>
            <Field label="Тариф, ₴/год" required error={f.errors.hourlyRate}>
              <Input type="number" step="0.01" min="0" {...f.bind('hourlyRate')} />
            </Field>
          </div>
          <FormActions saving={f.saving} onCancel={() => nav(-1)} />
        </form>
      </Card>
    </>
  );
}
