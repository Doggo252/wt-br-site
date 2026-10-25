"use client";

import { useRef } from "react";
import { MODES, MODE_LABEL, MODE_NAME, type Mode } from "@/lib/br";

type Props = {
  value: Mode;
  onChange: (mode: Mode) => void;
};

/** AB / RB / SB segmented control. Arrow keys move between modes. */
export function ModeToggle({ value, onChange }: Props) {
  const buttons = useRef<(HTMLButtonElement | null)[]>([]);

  function select(i: number) {
    onChange(MODES[i]);
    buttons.current[i]?.focus();
  }

  function onKeyDown(e: React.KeyboardEvent) {
    const i = MODES.indexOf(value);
    if (e.key === "ArrowRight" || e.key === "ArrowDown") {
      e.preventDefault();
      select((i + 1) % MODES.length);
    } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
      e.preventDefault();
      select((i + MODES.length - 1) % MODES.length);
    }
  }

  return (
    <div
      role="radiogroup"
      aria-label="Game mode"
      onKeyDown={onKeyDown}
      className="inline-flex panel p-0.5"
    >
      {MODES.map((mode, i) => {
        const active = mode === value;
        return (
          <button
            key={mode}
            ref={(el) => {
              buttons.current[i] = el;
            }}
            type="button"
            role="radio"
            aria-checked={active}
            tabIndex={active ? 0 : -1}
            title={MODE_NAME[mode]}
            onClick={() => onChange(mode)}
            className={`min-w-11 px-3 py-1 font-display text-sm font-semibold tracking-wide transition-colors ${
              active ? "bg-header text-fg shadow-[inset_0_2px_0_var(--color-link)]" : "text-fg-3 hover:text-fg-2"
            }`}
          >
            {MODE_LABEL[mode]}
          </button>
        );
      })}
    </div>
  );
}
