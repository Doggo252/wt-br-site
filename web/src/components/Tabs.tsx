"use client";

import { Children, useId, useState } from "react";

/** Accessible tabs over server-rendered panels (one child per label). */
export function Tabs({ labels, children }: { labels: string[]; children: React.ReactNode }) {
  const [active, setActive] = useState(0);
  const id = useId();
  const panels = Children.toArray(children);
  return (
    <div>
      <div
        role="tablist"
        className="mb-4 flex gap-1 border-b border-card-border"
        onKeyDown={(e) => {
          if (e.key === "ArrowRight") setActive((a) => (a + 1) % labels.length);
          if (e.key === "ArrowLeft") setActive((a) => (a + labels.length - 1) % labels.length);
        }}
      >
        {labels.map((label, i) => (
          <button
            key={label}
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
          {panel}
        </div>
      ))}
    </div>
  );
}
