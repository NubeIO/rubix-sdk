import { useState, useEffect, useCallback } from 'react';

export interface CurrentUser {
  id: string;
  name: string;
}

const STORAGE_KEY = 'plm-current-user';

function loadPersistedUser(): CurrentUser | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return null;
}

function persistUser(user: CurrentUser) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
}

export function useCurrentUser(client: any) {
  const [user, setUser] = useState<CurrentUser | null>(loadPersistedUser);
  const [users, setUsers] = useState<CurrentUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    client
      .listUsers()
      .then((result: any[]) => {
        if (cancelled) return;
        const mapped = result.map((u: any) => ({
          id: u.id,
          name: u.name || u.settings?.email || u.id,
        }));
        setUsers(mapped);

        // Validate persisted user still exists
        const persisted = loadPersistedUser();
        if (persisted && mapped.some((u) => u.id === persisted.id)) {
          setUser(persisted);
        } else if (persisted) {
          // Persisted user no longer valid
          setUser(null);
        }
      })
      .catch((err: any) => {
        console.error('[useCurrentUser] Failed to fetch users:', err);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [client]);

  const pickUser = useCallback((u: CurrentUser) => {
    setUser(u);
    persistUser(u);
  }, []);

  return { user, users, loading, pickUser };
}
