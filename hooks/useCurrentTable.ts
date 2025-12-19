"use client";

import { useEffect, useState } from "react";

type StoredTable = {
  id?: string;
  tableId?: string;
  staticId?: string;
  tableNumber?: string;
  name?: string;
  sessionId?: string;
  sessionExpiresAt?: string | number | Date;
  establishedAt?: string | number | Date;
};

const CURRENT_TABLE_KEY = "currentTable";
export const CURRENT_TABLE_EVENT = "currentTableUpdated";
export const TABLE_SESSION_HEADER = "x-table-session";

function parseExpiry(value: string | number | Date | undefined): number | null {
  if (!value) return null;
  if (value instanceof Date) return value.getTime();
  if (typeof value === "number") {
    if (Number.isFinite(value)) {
      // assume unix ms when value is large, seconds otherwise
      return value > 10_000_000_000 ? value : value * 1000;
    }
    return null;
  }
  if (typeof value === "string") {
    const asNumber = Number(value);
    if (!Number.isNaN(asNumber)) {
      return parseExpiry(asNumber);
    }
    const parsed = Date.parse(value);
    return Number.isNaN(parsed) ? null : parsed;
  }
  return null;
}

const persianDigitsMap: Record<string, string> = {
  '۰': '0',
  '۱': '1',
  '۲': '2',
  '۳': '3',
  '۴': '4',
  '۵': '5',
  '۶': '6',
  '۷': '7',
  '۸': '8',
  '۹': '9',
};

function convertToEnglishDigits(input: string): string {
  return input.replace(/[۰-۹]/g, (digit) => persianDigitsMap[digit] ?? digit);
}

function parseStoredTable(raw: string | null): StoredTable | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === "object") {
      return parsed as StoredTable;
    }
  } catch {
    // ignore malformed values
  }
  return null;
}

export function normalizeTableNumber(value: unknown): string | null {
  if (value == null) return null;
  if (typeof value === "number") {
    return Number.isFinite(value) ? String(value) : null;
  }
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed.length) return null;
    const normalized = convertToEnglishDigits(trimmed);
    const digitsMatch = normalized.match(/\d+/);
    if (digitsMatch && digitsMatch[0]) {
      return digitsMatch[0];
    }
    const stripped = normalized
      .replace(/^table\s*/i, '')
      .replace(/^میز\s*/i, '')
      .trim();
    if (!stripped.length) {
      return null;
    }
    return stripped.toLowerCase();
  }
  return null;
}

function extractTableNumber(table: StoredTable | null): string | null {
  if (!table) return null;
  const candidate = table.tableNumber ?? table.name ?? "";
  return normalizeTableNumber(candidate);
}

/**
 * Reads and parses the raw table session from storage.
 */
export function readCurrentTable(): CurrentTableState {
  const rawString = typeof window !== "undefined" ? localStorage.getItem(CURRENT_TABLE_KEY) : null;
  const raw = parseStoredTable(rawString);
  const tableNumber = extractTableNumber(raw);
  const tableId = raw?.tableId?.trim() || raw?.id?.trim() || null;
  const sessionId = raw?.sessionId?.trim() || null;
  const sessionExpiresAt = parseExpiry(raw?.sessionExpiresAt);
  const isSessionActive = Boolean(sessionId && sessionExpiresAt && sessionExpiresAt > Date.now());

  return { raw, tableNumber, tableId, sessionId, sessionExpiresAt, isSessionActive };
}

export interface CurrentTableState {
  raw: StoredTable | null;
  tableNumber: string | null;
  tableId: string | null;
  sessionId: string | null;
  sessionExpiresAt: number | null;
  isSessionActive: boolean;
}

/**
 * Reads the current table session information from localStorage and keeps it in sync
 * across tabs via the storage event and a custom "currentTableUpdated" event.
 */
export function useCurrentTable(): CurrentTableState {
  const [state, setState] = useState<CurrentTableState>(() => readCurrentTable());
  const [expiryTimerId, setExpiryTimerId] = useState<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const readAndSet = () => {
      setState(readCurrentTable());
    };

    const handleStorage = (event: StorageEvent) => {
      if (event.key === CURRENT_TABLE_KEY) {
        readAndSet();
      }
    };

    const handleCustomUpdate = () => {
      readAndSet();
    };

    window.addEventListener("storage", handleStorage);
    window.addEventListener(CURRENT_TABLE_EVENT, handleCustomUpdate);

    // Ensure we're in sync on mount
    readAndSet();

    return () => {
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener(CURRENT_TABLE_EVENT, handleCustomUpdate);
    };
  }, []);

  useEffect(() => {
    if (expiryTimerId) {
      clearTimeout(expiryTimerId);
      setExpiryTimerId(null);
    }

    if (state.sessionExpiresAt) {
      const remaining = state.sessionExpiresAt - Date.now();
      if (remaining > 0) {
        const timer = setTimeout(() => {
          if (typeof window !== "undefined") {
            localStorage.removeItem(CURRENT_TABLE_KEY);
            window.dispatchEvent(new CustomEvent(CURRENT_TABLE_EVENT));
          }
        }, remaining);
        setExpiryTimerId(timer);
      } else {
        if (typeof window !== "undefined") {
          localStorage.removeItem(CURRENT_TABLE_KEY);
          window.dispatchEvent(new CustomEvent(CURRENT_TABLE_EVENT));
        }
      }
    }

    return () => {
      if (expiryTimerId) {
        clearTimeout(expiryTimerId);
      }
    };
  }, [state.sessionExpiresAt]);

  return state;
}

export function dispatchCurrentTableUpdate() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(CURRENT_TABLE_EVENT));
}

export function clearCurrentTable() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(CURRENT_TABLE_KEY);
  dispatchCurrentTableUpdate();
}
