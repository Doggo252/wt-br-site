"use client";

import { useEffect, useState } from "react";
import { ModeToggle } from "@/components/ModeToggle";
import { BrBadge } from "@/components/BrBadge";
import { MODE_NAME, type Mode } from "@/lib/br";

const SAMPLE_RANKS: Record<Mode, number> = { ab: 16, rb: 17, sb: 18 };

export function ModeToggleDemo() {
  const [mode, setMode] = useState<Mode>("rb");
  return (
    <div className="flex flex-wrap items-center gap-4">
      <ModeToggle value={mode} onChange={setMode} />
      <span className="text-sm text-fg-2">
        {MODE_NAME[mode]}: <BrBadge rank={SAMPLE_RANKS[mode]} />
      </span>
    </div>
  );
}

type FontState = "checking" | "loaded" | "missing";

/** Reports whether the WTSymbols font file is actually present in public/fonts/. */
export function GlyphFontStatus() {
  const [state, setState] = useState<FontState>("checking");

  useEffect(() => {
    let cancelled = false;
    document.fonts
      .load('16px "WTSymbols"', "◍")
      .then(() => {
        // The zero-width fallback (wt-blank.woff2) also "loads"; the real font has width.
        const ctx = document.createElement("canvas").getContext("2d");
        if (ctx) ctx.font = '16px "WTSymbols"';
        const width = ctx?.measureText("◍").width ?? 0;
        if (!cancelled) setState(width > 0 ? "loaded" : "missing");
      })
      .catch(() => !cancelled && setState("missing"));
    return () => {
      cancelled = true;
    };
  }, []);

  const text = {
    checking: "Checking for the WTSymbols font…",
    loaded: "WTSymbols loaded: glyphs below use the game's own font.",
    missing:
      "WTSymbols not found in public/fonts/, so these glyphs are hidden in vehicle names (zero-width fallback). See web/public/fonts/README.md.",
  }[state];
  const color = { checking: "text-fg-3", loaded: "text-good", missing: "text-gold" }[state];

  return <p className={`text-sm ${color}`}>{text}</p>;
}
