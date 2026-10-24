"use client";

import { useCallback, useEffect, useState } from "react";
import { MODES, type Mode } from "./br";

const STORAGE_KEY = "uptier.mode";

/**
 * Game mode shared across pages. The URL (?mode=ab) wins so links are shareable;
 * otherwise the last choice is remembered. Defaults to RB.
 */
export function useMode(): [Mode, (m: Mode) => void] {
  const [mode, setModeState] = useState<Mode>("rb");

  useEffect(() => {
    const fromUrl = new URLSearchParams(window.location.search).get("mode");
    let stored: string | null = null;
    try {
      stored = localStorage.getItem(STORAGE_KEY);
    } catch {}
    const initial = [fromUrl, stored].find((m): m is Mode => MODES.includes(m as Mode));
    // eslint-disable-next-line react-hooks/set-state-in-effect -- URL/storage only exist on the client
    if (initial) setModeState(initial);
  }, []);

  const setMode = useCallback((m: Mode) => {
    setModeState(m);
    try {
      localStorage.setItem(STORAGE_KEY, m);
    } catch {}
    const url = new URL(window.location.href);
    if (m === "rb") url.searchParams.delete("mode");
    else url.searchParams.set("mode", m);
    window.history.replaceState(null, "", url);
  }, []);

  return [mode, setMode];
}
