import { useEffect, useState } from 'react';

/** useState that survives reloads via localStorage (silently in-memory when storage is blocked). */
export function usePersistentState(key, initial) {
  const [value, setValue] = useState(() => {
    try {
      const stored = localStorage.getItem(key);
      return stored === null ? initial : JSON.parse(stored);
    } catch {
      return initial;
    }
  });

  useEffect(() => {
    try {
      if (value === null || value === undefined) localStorage.removeItem(key);
      else localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // storage unavailable (private mode, blocked): keep in memory only
    }
  }, [key, value]);

  return [value, setValue];
}
