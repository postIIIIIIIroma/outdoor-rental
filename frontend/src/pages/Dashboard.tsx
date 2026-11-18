import { Link } from 'react-router-dom';
import { fmtDate } from '../api';
import { useFetch } from '../hooks';
import { Alert, Card, CardHeader, PageHeader, SimpleTable } from '../ui';

type Stats = {
  users: number; equipment: number; available: number; activeRentals: number;
  activeView: { lastName: string; firstName: string; modelName: string; startTime: string }[];
};

export default function Dashboard() {
  const { data, error } = useFetch<Stats>('/stats');
  const cards: [string, number, string][] = data
    ? [
        ['Клієнти', data.users, '/users'],
        ['Одиниць спорядження', data.equipment, '/equipment'],
        ['Доступно зараз', data.available, '/equipment'],
        ['Активні оренди', data.activeRentals, '/rentals'],
      ]
    : [];
  return (
    <>
      <PageHeader title="Панель керування" subtitle="Прокат туристичного та скелелазного спорядження" />
      {error && <Alert>{error}</Alert>}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {cards.map(([label, value, to]) => (
          <Link key={label} to={to}
            className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 hover:border-emerald-300 hover:shadow transition">
            <div className="text-sm text-slate-500">{label}</div>
            <div className="text-3xl font-semibold mt-1 text-slate-900">{value}</div>
          </Link>
        ))}
      </div>
      <Card>
        <CardHeader title="Зараз в оренді" actions={<span className="text-xs text-slate-400">VIEW active_rentals_view</span>} />
        <SimpleTable
          head={['Клієнт', 'Спорядження', 'Початок']}
          rows={(data?.activeView ?? []).map((r) => [`${r.lastName} ${r.firstName}`, r.modelName, fmtDate(r.startTime)])}
          empty="Активних оренд немає"
        />
      </Card>
    </>
  );
}
