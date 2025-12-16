"use client";

import { useState, useEffect } from "react";
import { DiningTable } from '@/types';

export function useDiningTables() {
  const [data, setData] = useState<DiningTable[] | null>(null);
  const [isLoading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        // Try fetching from a conventional API endpoint; if not available return empty list.
        const res = await fetch('/api/dining-tables');
        if (!mounted) return;
        if (res.ok) {
          const json = await res.json();
          setData(json || []);
        } else {
          setData([]);
        }
      } catch (e) {
        setData([]);
      } finally {
        setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const mutate = async () => {
    try {
      const res = await fetch('/api/dining-tables');
      if (res.ok) setData(await res.json());
    } catch (e) {
      // ignore
    }
  };

  return { data, isLoading, mutate } as const;
}

export async function createDiningTable(payload: Partial<DiningTable>) {
  const res = await fetch('/api/dining-tables', { method: 'POST', body: JSON.stringify(payload), headers: { 'Content-Type': 'application/json' } });
  if (!res.ok) throw new Error('Failed to create');
  return res.json();
}

export async function updateDiningTable(id: string, payload: Partial<DiningTable>) {
  const res = await fetch(`/api/dining-tables/${id}`, { method: 'PUT', body: JSON.stringify(payload), headers: { 'Content-Type': 'application/json' } });
  if (!res.ok) throw new Error('Failed to update');
  return res.json();
}

export async function deleteDiningTable(id: string) {
  const res = await fetch(`/api/dining-tables/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to delete');
  return true;
}

export type { DiningTable };
