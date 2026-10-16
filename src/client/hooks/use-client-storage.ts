"use client";

import { useSyncExternalStore, useCallback } from "react";

function subscribe(callback: () => void) {
  if (typeof window === "undefined") return () => {};
  window.addEventListener("storage", callback);
  return () => window.removeEventListener("storage", callback);
}

export function useClientStorage<T>(
  key: string,
  defaultValue: T,
  parser: (raw: string) => T
): [T, (action: T | ((prev: T) => T)) => void] {
  const getSnapshot = useCallback(() => {
    if (typeof window === "undefined") return defaultValue;
    try {
      const raw = localStorage.getItem(key);
      return raw !== null ? parser(raw) : defaultValue;
    } catch {
      return defaultValue;
    }
  }, [key, defaultValue, parser]);

  const getServerSnapshot = useCallback(() => defaultValue, [defaultValue]);

  const value = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const setValue = useCallback(
    (action: T | ((prev: T) => T)) => {
      if (typeof window === "undefined") return;
      try {
        const currentRaw = localStorage.getItem(key);
        const currentVal = currentRaw !== null ? parser(currentRaw) : defaultValue;
        const resolved = typeof action === "function" ? (action as (prev: T) => T)(currentVal) : action;
        localStorage.setItem(key, String(resolved));
        window.dispatchEvent(new Event("storage"));
      } catch {
        // Ignore quota/private mode errors safely
      }
    },
    [key, defaultValue, parser]
  );

  return [value, setValue];
}
