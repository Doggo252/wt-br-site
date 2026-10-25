"use client";

import { Children, useId, useRef, useState } from "react";

/**
 * Accessible tabs over server-rendered panels (one child per label). With `lazy`, a panel
 * mounts the first time it is shown: charts can't measure a hidden container.
 */
export function Tabs({
  labels,
  children,
  lazy = false,
}: {
  labels: string[];
  children: React.ReactNode;
  lazy?: boolean;
}) {
  const [active, setActiveState] = useState(0);
  const [seen, setSeen] = useState<Set<number>>(() => new Set([0]));
  const tabs = useRef<(HTMLButtonElement | null)[]>([]);
  const id = useId();
  const panels = Children.toArray(children);

  function setActive(i: number, focus = false) {
    setActiveState(i);
    setSeen((s) => (s.has(i) ? s : new Set(s).add(i)));
    if (focus) tabs.current[i]?.focus();
  }
  return (
    <div>
      <div
        role="tablist"
        className="mb-4 flex gap-1 border-b border-card-border"
        onKeyDown={(e) => {
          if (e.key === "ArrowRight") setActive((active + 1) % labels.length, true);
          if (e.key === "ArrowLeft") setActive((active + labels.length - 1) % labels.length, true);
        }}
      >
        {labels.map((label, i) => (
          <button
            key={label}
            ref={(el) => {
              tabs.current[i] = el;
            }}
            type="button"
            role="tab"
            id={`${id}-tab-${i}`}
            aria-selected={i === active}
            aria-controls={`${id}-panel-${i}`}
            tabIndex={i === active ? 0 : -1}
            onClick={() => setActive(i)}
            className={`-mb-px border-b-2 px-3 py-1.5 font-display text-sm ${i === active ? "border-link text-fg" : "border-transparent text-fg-2 hover:text-fg"}`}
          >
            {label}
          </button>
        ))}
      </div>
      {panels.map((panel, i) => (
        <div
          key={i}
          role="tabpanel"
          id={`${id}-panel-${i}`}
          aria-labelledby={`${id}-tab-${i}`}
          hidden={i !== active}
        >
          {!lazy || seen.has(i) ? panel : null}
        </div>
      ))}
    </div>
  );
}
