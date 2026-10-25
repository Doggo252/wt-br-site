"use client";

import Link from "@/components/Link";
import { useEffect, useState } from "react";
import { ModeToggle } from "./ModeToggle";
import { StarIcon } from "./StarButton";
import { loadIndex } from "./SearchBox";
import { UnitCard } from "./UnitCard";
import { MODE_NAME } from "@/lib/br";
import { plural } from "@/lib/format";
import type { UnitStatus } from "@/lib/units";
import { useMode } from "@/lib/useMode";
import { useWatchlist } from "@/lib/watchlist";

/** Same rows as LineupTool: [id, name, nation, branch, type, status, hidden, ab, rb, sb, image] */
type Row = [string, string, string, string, string, number, number, number, number, number, number];
const STATUS: UnitStatus[] = ["tree", "premium", "squadron", "event"];

export function WatchlistView() {
  const [mode, setMode] = useMode();
  const [list, set, ready] = useWatchlist();
  const [rows, setRows] = useState<Map<string, Row> | null>(null);
  // Names for vehicles that have left the game (they aren't in lineup.json).
  const [names, setNames] = useState<Map<string, string>>(new Map());

  useEffect(() => {
    fetch("/data/lineup.json")
      .then((r) => r.json())
      .then((data: Row[]) => setRows(new Map(data.map((r) => [r[0], r]))));
    loadIndex().then((index) => setNames(new Map(index.map((r) => [r[0], r[1]]))));
  }, []);

  if (!ready || !rows) return <p className="text-sm text-fg-3">Loading…</p>;

  const ids = Object.keys(list);
  if (!ids.length) {
    return (
      <div className="panel space-y-2 p-6 text-sm text-fg-2">
        <p>Nothing here yet.</p>
        <p>
          Open any vehicle and press <span className="font-display text-fg">Watch</span>. Your list stays in this
          browser; nothing is sent anywhere.
        </p>
      </div>
    );
  }

  const col = mode === "ab" ? 7 : mode === "rb" ? 8 : 9;
  const items = ids.map((id) => ({ id, w: list[id], r: rows.get(id) }));
  const moved = items.filter((x) => x.r && x.r[col] !== x.w.br[mode]);
  items.sort(
    (a, b) =>
      Number(b.r ? b.r[col] !== b.w.br[mode] : 0) - Number(a.r ? a.r[col] !== a.w.br[mode] : 0) ||
      (b.r?.[col] ?? 0) - (a.r?.[col] ?? 0),
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-fg-2">
          {plural(ids.length, "vehicle")} · {moved.length} moved in {MODE_NAME[mode]} since you starred them
        </p>
        <ModeToggle value={mode} onChange={setMode} />
      </div>
      <ul className="grid grid-cols-[repeat(auto-fill,minmax(150px,1fr))] gap-3">
        {items.map(({ id, w, r }) => (
          <li key={id} className="space-y-1">
            {r ? (
              <UnitCard
                name={r[1]}
                rank={r[col]}
                previousRank={w.br[mode]}
                status={STATUS[r[5]]}
                availability={r[6] ? "unobtainable" : "current"}
                image={r[10] ? `/img/units/${id}.webp` : undefined}
                href={`/vehicle/${id}/`}
                type={r[4]}
              />
            ) : (
              <Link href={`/vehicle/${id}/`} className="panel block p-3 text-sm text-fg-3">
                <span className="block font-display text-fg-2">{names.get(id) ?? id}</span>
                No longer in the game
              </Link>
            )}
            <div className="flex items-center justify-between text-xs text-fg-3">
              <span className="tabular">since {w.at}</span>
              <button
                type="button"
                onClick={() => set(id, null)}
                className="inline-flex min-h-6 items-center gap-1 text-gold hover:text-fg"
                aria-label={`Remove ${r?.[1] ?? names.get(id) ?? id} from your watchlist`}
              >
                <StarIcon filled className="h-3 w-3" />
                Remove
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
