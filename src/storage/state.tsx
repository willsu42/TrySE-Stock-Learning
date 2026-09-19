import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { getLocales } from 'expo-localization';
import { AppState } from '../domain/types';
import { newPortfolio } from '../domain/engine';
import { dataset } from '../data/market';
import { openRepository } from './database';
import { Repository } from './repository';

export const uniqueId = () =>
  `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;
export function initialState(locale: AppState['locale'] = 'en'): AppState {
  return {
    version: 1,
    locale,
    market: 'TW',
    portfolios: {
      TW: newPortfolio('TW', dataset.id, uniqueId()),
      US: newPortfolio('US', dataset.id, uniqueId()),
    },
    completedLessons: [],
    answers: {},
    bookmarks: [],
    readResources: [],
    forecasts: [],
    quizAttempts: [],
  };
}
interface Store {
  state: AppState | null;
  busy: boolean;
  error: string | null;
  clearError: () => void;
  update: (change: (state: AppState) => AppState) => Promise<boolean>;
}
const Context = createContext<Store | null>(null);
export function StoreProvider({ children }: React.PropsWithChildren) {
  const [state, setState] = useState<AppState | null>(null);
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const current = useRef<AppState | null>(null);
  const revision = useRef(0);
  const repository = useRef<Repository | null>(null);
  const locked = useRef(false);
  useEffect(() => {
    let active = true;
    (async () => {
      const repo = await openRepository();
      const saved = await repo.load();
      const value =
        saved?.state ?? initialState(getLocales()[0]?.languageCode === 'zh' ? 'zh-TW' : 'en');
      if (
        value.portfolios.TW.datasetId !== dataset.id ||
        value.portfolios.US.datasetId !== dataset.id
      )
        throw new Error('This saved replay requires a different dataset. Your data was preserved.');
      const rev = saved?.revision ?? (await repo.save(value, 0));
      if (active) {
        repository.current = repo;
        revision.current = rev;
        current.current = value;
        setState(value);
      }
    })()
      .catch((error) => {
        if (active) setError(String(error));
      })
      .finally(() => {
        if (active) setBusy(false);
      });
    return () => {
      active = false;
    };
  }, []);
  const update: Store['update'] = async (change) => {
    if (locked.current || !current.current || !repository.current) return false;
    locked.current = true;
    setBusy(true);
    setError(null);
    try {
      const next = change(current.current);
      const rev = await repository.current.save(next, revision.current);
      revision.current = rev;
      current.current = next;
      setState(next);
      return true;
    } catch (error) {
      setError(error instanceof Error ? error.message : String(error));
      return false;
    } finally {
      locked.current = false;
      setBusy(false);
    }
  };
  return (
    <Context.Provider value={{ state, busy, error, clearError: () => setError(null), update }}>
      {children}
    </Context.Provider>
  );
}
export function useStore(): Store {
  const value = useContext(Context);
  if (!value) throw new Error('StoreProvider missing');
  return value;
}
export const toggleItem = (values: string[], id: string) =>
  values.includes(id) ? values.filter((item) => item !== id) : [...values, id];
