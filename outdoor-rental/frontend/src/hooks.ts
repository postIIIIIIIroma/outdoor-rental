import { useEffect, useState, type ChangeEvent, type FormEvent } from 'react';
import { api, ApiError, qs, type Errors, type Paged } from './api';

export type Params = Record<string, any>;

// Список з пагінацією / сортуванням / фільтрами
export function useList<T>(endpoint: string, initial: Params) {
  const [params, setParams] = useState<Params>({ page: 1, pageSize: 10, ...initial });
  const [data, setData] = useState<Paged<T> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tick, setTick] = useState(0);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setError('');
    api
      .get<Paged<T>>(`${endpoint}?${qs(params)}`)
      .then((d) => alive && setData(d))
      .catch((e) => alive && setError(e.message))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [endpoint, params, tick]);

  return {
    data,
    loading,
    error,
    params,
    reload: () => setTick((t) => t + 1),
    set: (patch: Params) => setParams((p) => ({ ...p, ...patch, page: 1 })),
    setPage: (page: number) => setParams((p) => ({ ...p, page })),
    toggleSort: (key: string) =>
      setParams((p) => ({ ...p, sort: key, dir: p.sort === key && p.dir === 'asc' ? 'desc' : 'asc' })),
  };
}
export type ListState<T> = ReturnType<typeof useList<T>>;

export function useFetch<T = any>(url: string) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState('');
  const [tick, setTick] = useState(0);
  useEffect(() => {
    let alive = true;
    api
      .get<T>(url)
      .then((d) => alive && setData(d))
      .catch((e) => alive && setError(e.message));
    return () => {
      alive = false;
    };
  }, [url, tick]);
  return { data, error, setError, reload: () => setTick((t) => t + 1) };
}

type FormOpts<T> = {
  load?: string;
  fromServer?: (d: any) => T;
  validate: (v: T) => Errors;
  submit: (v: T) => Promise<any>;
  onSuccess: (res: any) => void;
};

// Форма: клієнтська валідація + показ помилок сервера
export function useForm<T extends Record<string, any>>(initial: T, opts: FormOpts<T>) {
  const [values, setValues] = useState<T>(initial);
  const [errors, setErrors] = useState<Errors>({});
  const [serverError, setServerError] = useState('');
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(!!opts.load);

  useEffect(() => {
    if (!opts.load) return;
    setLoading(true);
    api
      .get(opts.load)
      .then((d) => setValues(opts.fromServer ? opts.fromServer(d) : d))
      .catch((e) => setServerError(e.message))
      .finally(() => setLoading(false));
  }, [opts.load]);

  const set = (name: keyof T, value: any) => {
    setValues((v) => ({ ...v, [name]: value }));
    setErrors((e) => ({ ...e, [name as string]: '' }));
  };

  const bind = (name: keyof T & string) => ({
    name,
    value: (values[name] ?? '') as string,
    error: errors[name],
    onChange: (e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => set(name, e.target.value),
  });

  const reset = (v: T) => {
    setValues(v);
    setErrors({});
    setServerError('');
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setServerError('');
    const clientErrors = opts.validate(values);
    setErrors(clientErrors);
    if (Object.values(clientErrors).some(Boolean)) return;
    setSaving(true);
    try {
      const res = await opts.submit(values);
      opts.onSuccess(res);
    } catch (err) {
      if (err instanceof ApiError) {
        setErrors(err.errors);
        setServerError(err.message);
      } else setServerError(String(err));
    } finally {
      setSaving(false);
    }
  };

  return { values, setValues, set, bind, reset, errors, serverError, saving, loading, onSubmit };
}
