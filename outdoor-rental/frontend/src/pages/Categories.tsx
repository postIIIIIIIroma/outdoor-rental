import { useState } from 'react';
import { Link } from 'react-router-dom';
import { api, clean, type Errors } from '../api';
import { useFetch, useForm } from '../hooks';
import { Alert, Button, Card, CardHeader, Field, FormErrors, Input, PageHeader, SimpleTable, Textarea } from '../ui';

type Cat = { id: number; name: string; description: string | null; itemsCount: number };
type CatForm = { name: string; description: string };
const empty: CatForm = { name: '', description: '' };

export default function Categories() {
  const { data, error, setError, reload } = useFetch<Cat[]>('/categories');
  const [editId, setEditId] = useState<number | null>(null);

  const f = useForm<CatForm>(empty, {
    validate: (v) => {
      const e: Errors = {};
      if (!v.name.trim()) e.name = 'Назва обовʼязкова';
      else if (v.name.trim().length > 100) e.name = 'Максимум 100 символів';
      if (v.description.length > 1000) e.description = 'Максимум 1000 символів';
      return e;
    },
    submit: (v) => (editId ? api.put(`/categories/${editId}`, clean(v)) : api.post('/categories', clean(v))),
    onSuccess: () => {
      f.reset(empty);
      setEditId(null);
      reload();
    },
  });

  const edit = (c: Cat) => {
    setEditId(c.id);
    f.reset({ name: c.name, description: c.description ?? '' });
  };

  const remove = async (c: Cat) => {
    if (!confirm(`Видалити категорію «${c.name}»?`)) return;
    try {
      await api.del(`/categories/${c.id}`);
      setError('');
      reload();
    } catch (e: any) {
      setError(e.message);
    }
  };

  return (
    <>
      <PageHeader title="Категорії" subtitle="Довідник категорій спорядження" />
      {error && <Alert>{error}</Alert>}
      <div className="grid lg:grid-cols-3 gap-5 items-start">
        <Card className="lg:col-span-2">
          <SimpleTable
            head={['Назва', 'Опис', 'Одиниць', '']}
            rows={(data ?? []).map((c) => [
              <span className="font-medium">{c.name}</span>,
              <span className="text-slate-500">{c.description ?? '—'}</span>,
              <Link className="text-emerald-700 hover:underline" to={`/equipment?categoryId=${c.id}`}>{c.itemsCount}</Link>,
              <div className="flex gap-1 justify-end">
                <Button variant="ghost" onClick={() => edit(c)}>Редагувати</Button>
                <Button variant="ghost" className="text-red-600" onClick={() => remove(c)}>Видалити</Button>
              </div>,
            ])}
            empty="Категорій немає"
          />
        </Card>
        <Card>
          <CardHeader title={editId ? 'Редагування категорії' : 'Нова категорія'} />
          <form onSubmit={f.onSubmit} noValidate className="p-5 space-y-4">
            <FormErrors message={f.serverError} errors={f.errors} />
            <Field label="Назва" required error={f.errors.name}><Input {...f.bind('name')} /></Field>
            <Field label="Опис" error={f.errors.description}><Textarea {...f.bind('description')} /></Field>
            <div className="flex gap-2">
              <Button type="submit" disabled={f.saving}>{editId ? 'Зберегти' : 'Додати'}</Button>
              {editId && <Button variant="secondary" onClick={() => { setEditId(null); f.reset(empty); }}>Скасувати</Button>}
            </div>
          </form>
        </Card>
      </div>
    </>
  );
}
