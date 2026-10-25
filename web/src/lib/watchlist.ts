"use client";

import { useCallback, useEffect, useState } from "react";
import type { Ranks } from "./data.gen";

const KEY = "uptier.watch";

/** Starred vehicles: id -> the ranks when starred and the date (YYYY-MM-DD). */
export type Watchlist = Record<string, { br: Ranks; at: string }>;

function read(): Watchlist {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? "{}") as Watchlist;
  } catch {
    return {};
  }
}

function write(list: Watchlist) {
  try {
    localStorage.setItem(KEY, JSON.stringify(list));
  } catch {}
  // Same-tab listeners; other tabs get the native storage event.
  window.dispatchEvent(new Event("uptier-watch"));
}

/** The watchlist in localStorage, kept in sync across components and tabs. */
export function useWatchlist(): [Watchlist, (id: string, br: Ranks | null) => void, boolean] {
  const [list, setList] = useState<Watchlist>({});
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const sync = () => setList(read());
    sync();
    // eslint-disable-next-line react-hooks/set-state-in-effect -- storage only exists on the client
    setReady(true);
    window.addEventListener("storage", sync);
    window.addEventListener("uptier-watch", sync);
    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener("uptier-watch", sync);
    };
  }, []);

  /** Star with the current ranks, or pass null to unstar. */
  const set = useCallback((id: string, br: Ranks | null) => {
    const next = read();
    if (br) next[id] = { br, at: new Date().toISOString().slice(0, 10) };
    else delete next[id];
    write(next);
  }, []);

  return [list, set, ready];
}
