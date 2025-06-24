
"use client";

import { useState, useEffect, Dispatch, SetStateAction, useCallback } from 'react';

// A custom hook to manage state in localStorage.
// Note: This is no longer used for primary app data after Firebase integration,
// but it's kept as a utility hook for other potential uses (e.g., UI preferences).
function useLocalStorageState<T>(
  key: string,
  defaultValue: T | (() => T)
): [T, Dispatch<SetStateAction<T>>] {
  const [state, setState] = useState<T>(() => {
    // This part runs only on the client, on initial render.
    if (typeof window === 'undefined') {
      return typeof defaultValue === 'function' ? (defaultValue as () => T)() : defaultValue;
    }
    try {
      const storedValue = window.localStorage.getItem(key);
      if (storedValue) {
        return JSON.parse(storedValue);
      }
    } catch (error) {
      console.error(`Error reading localStorage key "${key}":`, error);
    }
    return typeof defaultValue === 'function' ? (defaultValue as () => T)() : defaultValue;
  });

  // This effect syncs state changes to localStorage.
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        window.localStorage.setItem(key, JSON.stringify(state));
      } catch (error) {
        console.error(`Error setting localStorage key "${key}":`, error);
      }
    }
  }, [key, state]);

  return [state, setState];
}

export default useLocalStorageState;
