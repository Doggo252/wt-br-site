"use client";

import Link from "@/components/Link";
import type { Ranks } from "@/lib/data.gen";
import { useWatchlist } from "@/lib/watchlist";

export function StarButton({ id, name, br }: { id: string; name: string; br: Ranks }) {
  const [list, set, ready] = useWatchlist();
  const on = Boolean(list[id]);
  return (
    <span className="inline-flex items-center gap-2">
      {/* A toggle keeps one label; aria-pressed and the filled star carry the state. */}
      <button
        type="button"
        aria-pressed={on}
        disabled={!ready}
        onClick={() => set(id, on ? null : br)}
        className={`btn gap-1.5 px-2 py-0.5 text-xs uppercase tracking-wider ${on ? "border-gold/60 text-gold" : ""}`}
        title={on ? `${name} is on your watchlist` : `Add ${name} to your watchlist`}
      >
        <StarIcon filled={on} />
        Watch
      </button>
      {on && (
        <Link href="/watchlist/" className="text-xs">
          Watchlist
        </Link>
      )}
    </span>
  );
}

export function StarIcon({ filled, className = "h-3.5 w-3.5" }: { filled: boolean; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path
        d="m12 3 2.7 5.9 6.3.6-4.8 4.3 1.4 6.3L12 16.9 6.4 20.1l1.4-6.3L3 9.5l6.3-.6z"
        fill={filled ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
    </svg>
  );
}
