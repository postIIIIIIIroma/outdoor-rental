import { NavLink, Route, Routes } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import Categories from './pages/Categories';
import { UserDetail, UserFormPage, UsersList } from './pages/Users';
import { EquipmentDetail, EquipmentFormPage, EquipmentList } from './pages/Equipment';
import { RentalDetail, RentalFormPage, RentalsList } from './pages/Rentals';

const nav: [string, string][] = [
  ['/', 'Головна'],
  ['/rentals', 'Оренди'],
  ['/equipment', 'Спорядження'],
  ['/categories', 'Категорії'],
  ['/users', 'Клієнти'],
];

export default function App() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      <header className="bg-white/90 backdrop-blur border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center gap-6">
          <span className="font-bold text-emerald-700 whitespace-nowrap">⛰ Outdoor Rental</span>
          <nav className="flex gap-1 overflow-x-auto">
            {nav.map(([to, label]) => (
              <NavLink key={to} to={to} end={to === '/'}
                className={({ isActive }) =>
                  `px-3 py-1.5 rounded-md text-sm font-medium whitespace-nowrap transition ${
                    isActive ? 'bg-emerald-50 text-emerald-700' : 'text-slate-600 hover:bg-slate-100'}`}>
                {label}
              </NavLink>
            ))}
          </nav>
        </div>
      </header>
      <main className="max-w-6xl mx-auto px-4 py-6">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/users" element={<UsersList />} />
          <Route path="/users/new" element={<UserFormPage />} />
          <Route path="/users/:id" element={<UserDetail />} />
          <Route path="/users/:id/edit" element={<UserFormPage />} />
          <Route path="/equipment" element={<EquipmentList />} />
          <Route path="/equipment/new" element={<EquipmentFormPage />} />
          <Route path="/equipment/:id" element={<EquipmentDetail />} />
          <Route path="/equipment/:id/edit" element={<EquipmentFormPage />} />
          <Route path="/categories" element={<Categories />} />
          <Route path="/rentals" element={<RentalsList />} />
          <Route path="/rentals/new" element={<RentalFormPage />} />
          <Route path="/rentals/:id" element={<RentalDetail />} />
          <Route path="/rentals/:id/edit" element={<RentalFormPage />} />
          <Route path="*" element={<div className="py-20 text-center text-slate-400">Сторінку не знайдено</div>} />
        </Routes>
      </main>
      <footer className="text-center text-xs text-slate-400 py-6">Outdoor Rental · ASP.NET Core + EF Core + React</footer>
    </div>
  );
}
