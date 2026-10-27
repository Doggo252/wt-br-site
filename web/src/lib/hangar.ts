"use client";

import { useCallback, useEffect, useState } from "react";

const KEY = "uptier.hangar";
const EVENT = "uptier-hangar";

function read(): Set<string> {
  try {
    return new Set(JSON.parse(localStorage.getItem(KEY) ?? "[]") as string[]);
  } catch {
    return new Set();
  }
}

function write(ids: Set<string>) {
  try {
    localStorage.setItem(KEY, JSON.stringify([...ids].sort()));
  } catch {}
  // Same-tab listeners; other tabs get the native storage event.
  window.dispatchEvent(new Event(EVENT));
}

/** Vehicles you own (researched or bought), in localStorage, kept in sync across components and tabs. */
export function useHangar(): [Set<string>, (ids: string[], owned: boolean) => void, boolean] {
  const [owned, setOwned] = useState<Set<string>>(new Set());
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const sync = () => setOwned(read());
    sync();
    // eslint-disable-next-line react-hooks/set-state-in-effect -- storage only exists on the client
    setReady(true);
    window.addEventListener("storage", sync);
    window.addEventListener(EVENT, sync);
    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener(EVENT, sync);
    };
  }, []);

  const set = useCallback((ids: string[], own: boolean) => {
    const next = read();
    for (const id of ids) {
      if (own) next.add(id);
      else next.delete(id);
    }
    write(next);
  }, []);

  return [owned, set, ready];
}
