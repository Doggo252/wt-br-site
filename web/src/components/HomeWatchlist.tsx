"use client";

import Link from "@/components/Link";
import { useEffect, useState } from "react";
import { UnitCard } from "./UnitCard";
import type { UnitStatus } from "@/lib/units";
import { useMode } from "@/lib/useMode";
import { useWatchlist } from "@/lib/watchlist";

type Row = [string, string, string, string, string, number, number, number, number, number, number];
const STATUS: UnitStatus[] = ["tree", "premium", "squadron", "event"];
const MAX = 8;

/** The starred vehicles, moved ones first. Renders nothing for an empty watchlist. */
export function HomeWatchlist() {
  const [mode] = useMode();
  const [list, , ready] = useWatchlist();
  const [rows, setRows] = useState<Map<string, Row> | null>(null);
  const ids = Object.keys(list);
  const any = ready && ids.length > 0;

  useEffect(() => {
    if (!any || rows) return;
    fetch("/data/lineup.json")
      .then((r) => r.json())
      .then((data: Row[]) => setRows(new Map(data.map((r) => [r[0], r]))));
  }, [any, rows]);

  if (!any || !rows) return null;
  const col = mode === "ab" ? 7 : mode === "rb" ? 8 : 9;
  const items = ids
    .map((id) => ({ id, w: list[id], r: rows.get(id) }))
    .filter((x): x is { id: string; w: (typeof list)[string]; r: Row } => Boolean(x.r))
    .sort((a, b) => Number(b.r[col] !== b.w.br[mode]) - Number(a.r[col] !== a.w.br[mode]))
    .slice(0, MAX);

  // Everything starred may have left the game; then there is nothing to show.
  if (!items.length) return null;
  return (
    <section className="panel p-4 sm:p-5">
      <div className="mb-3 flex items-baseline justify-between gap-3">
        <h2 className="section-title">Your watchlist</h2>
        <Link href="/watchlist/" className="text-sm">
          All {ids.length} →
        </Link>
      </div>
      <ul className="grid grid-cols-[repeat(auto-fill,minmax(140px,1fr))] gap-2">
        {items.map(({ id, w, r }) => (
          <li key={id}>
            <UnitCard
              name={r[1]}
              rank={r[col]}
              previousRank={w.br[mode]}
              status={STATUS[r[5]]}
              image={r[10] ? `/img/units/${id}.webp` : undefined}
              href={`/vehicle/${id}/`}
              type={r[4]}
            />
          </li>
        ))}
      </ul>
    </section>
  );
}
