import { Link, useNavigate, useParams } from 'react-router-dom';
import { api, clean, fmtDate, fmtMoney, type Errors } from '../api';
import { useFetch, useForm, useList } from '../hooks';
import {
  Alert, Button, Card, CardHeader, DataTable, Field, FormActions, FormErrors, InfoGrid, Input, LinkButton,
  Loading, PageHeader, SimpleTable, StatusBadge,
} from '../ui';

type UserRow = {
  id: number; firstName: string; lastName: string; phone: string; email: string | null;
  createdAt: string | null; rentalsCount: number;
};

export function UsersList() {
  const nav = useNavigate();
  const l = useList<UserRow>('/users', { sort: 'lastName', dir: 'asc', search: '' });
  return (
    <>
      <PageHeader title="Клієнти" subtitle="Усі клієнти прокату" actions={<LinkButton to="/users/new">+ Додати клієнта</LinkButton>} />
      <DataTable
        l={l}
        onRowClick={(u) => nav(`/users/${u.id}`)}
        empty="Клієнтів не знайдено"
        filters={
          <Input className="sm:max-w-xs" placeholder="Пошук: імʼя, телефон, email…"
            value={l.params.search} onChange={(e) => l.set({ search: e.target.value })} />
        }
        cols={[
          { key: 'id', label: '#', sortable: true, render: (u) => <span className="text-slate-400">{u.id}</span> },
          { key: 'lastName', label: 'Прізвище', sortable: true, render: (u) => <span className="font-medium">{u.lastName}</span> },
          { key: 'firstName', label: 'Імʼя', sortable: true, render: (u) => u.firstName },
          { key: 'phone', label: 'Телефон', render: (u) => u.phone },
          { key: 'email', label: 'Email', render: (u) => u.email ?? '—' },
          { key: 'rentalsCount', label: 'Оренд', sortable: true, render: (u) => u.rentalsCount },
          { key: 'createdAt', label: 'Створено', sortable: true, render: (u) => fmtDate(u.createdAt) },
        ]}
      />
    </>
  );
}

export function UserDetail() {
  const { id } = useParams();
  const nav = useNavigate();
  const { data: u, error, setError } = useFetch<any>(`/users/${id}`);

  const remove = async () => {
    if (!confirm('Видалити цього клієнта?')) return;
    try {
      await api.del(`/users/${id}`);
      nav('/users');
    } catch (e: any) {
      setError(e.message);
    }
  };

  if (!u) return error ? <Alert>{error}</Alert> : <Loading />;
  return (
    <>
      <PageHeader
        title={`${u.lastName} ${u.firstName}`}
        subtitle={`Клієнт #${u.id}`}
        actions={
          <>
            <LinkButton variant="secondary" to="/users">← До списку</LinkButton>
            <LinkButton variant="secondary" to={`/users/${id}/edit`}>Редагувати</LinkButton>
            <Button variant="danger" onClick={remove}>Видалити</Button>
          </>
        }
      />
      {error && <Alert>{error}</Alert>}
      <div className="grid lg:grid-cols-3 gap-5">
        <Card>
          <CardHeader title="Контакти" />
          <InfoGrid items={[['Телефон', u.phone], ['Email', u.email], ['Зареєстрований', fmtDate(u.createdAt)], ['Всього оренд', u.rentals.length]]} />
        </Card>
        <Card className="lg:col-span-2">
          <CardHeader title="Історія оренд" actions={<LinkButton to={`/rentals/new?userId=${u.id}`}>+ Нова оренда</LinkButton>} />
          <SimpleTable
            head={['#', 'Початок', 'Кінець', 'Позицій', 'Сума', 'Статус']}
            rows={u.rentals.map((r: any) => [
              <Link className="text-emerald-700 font-medium hover:underline" to={`/rentals/${r.id}`}>#{r.id}</Link>,
              fmtDate(r.startTime), fmtDate(r.endTime), r.itemsCount, fmtMoney(r.totalPrice), <StatusBadge status={r.status} />,
            ])}
            empty="Оренд ще не було"
          />
        </Card>
      </div>
    </>
  );
}

type UserFormT = { firstName: string; lastName: string; phone: string; email: string };

const validateUser = (v: UserFormT): Errors => {
  const e: Errors = {};
  if (!v.firstName.trim()) e.firstName = 'Імʼя обовʼязкове';
  else if (v.firstName.trim().length > 50) e.firstName = 'Максимум 50 символів';
  if (!v.lastName.trim()) e.lastName = 'Прізвище обовʼязкове';
  else if (v.lastName.trim().length > 50) e.lastName = 'Максимум 50 символів';
  if (!/^\+380\d{9}$/.test(v.phone.trim())) e.phone = 'Формат телефону: +380XXXXXXXXX';
  if (v.email.trim()) {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.email.trim())) e.email = 'Некоректний email';
    else if (v.email.trim().length > 100) e.email = 'Максимум 100 символів';
  }
  return e;
};

export function UserFormPage() {
  const { id } = useParams();
  const nav = useNavigate();
  const f = useForm<UserFormT>({ firstName: '', lastName: '', phone: '+380', email: '' }, {
    load: id ? `/users/${id}` : undefined,
    fromServer: (d) => ({ firstName: d.firstName, lastName: d.lastName, phone: d.phone, email: d.email ?? '' }),
    validate: validateUser,
    submit: (v) => (id ? api.put(`/users/${id}`, clean(v)) : api.post('/users', clean(v))),
    onSuccess: (r) => nav(`/users/${id ?? r.id}`),
  });

  if (f.loading) return <Loading />;
  return (
    <>
      <PageHeader title={id ? 'Редагування клієнта' : 'Новий клієнт'} />
      <Card className="max-w-2xl">
        <form onSubmit={f.onSubmit} noValidate className="p-5 space-y-4">
          <FormErrors message={f.serverError} errors={f.errors} />
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Імʼя" required error={f.errors.firstName}><Input {...f.bind('firstName')} /></Field>
            <Field label="Прізвище" required error={f.errors.lastName}><Input {...f.bind('lastName')} /></Field>
            <Field label="Телефон" required error={f.errors.phone} hint="+380XXXXXXXXX"><Input {...f.bind('phone')} /></Field>
            <Field label="Email" error={f.errors.email}><Input type="email" {...f.bind('email')} /></Field>
          </div>
          <FormActions saving={f.saving} onCancel={() => nav(-1)} />
        </form>
      </Card>
    </>
  );
}
