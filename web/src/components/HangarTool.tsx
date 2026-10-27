"use client";

import { Check, FlaskConical, Swords } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import Link from "@/components/Link";
import { BranchIcon } from "./BranchIcon";
import { ModeToggle } from "./ModeToggle";
import { UnitCard } from "./UnitCard";
import { formatBr } from "@/lib/br";
import { BRANCHES, BRANCH_SHORT, type Branch } from "@/lib/branches";
import { useHangar } from "@/lib/hangar";
import { nationName, roman } from "@/lib/nations";
import type { PlanRow } from "@/lib/research";
import { useMode } from "@/lib/useMode";

type Data = { unlocks: Record<string, Record<string, Record<string, number>>>; rows: PlanRow[] };
const MODE_COL = { ab: 5, rb: 6, sb: 7 } as const;
const STATUS = ["tree", "premium", "squadron", "event"] as const;
const fmt = (n: number) => n.toLocaleString("en");

/** Mark what you own; see rank progress, what to research next and your strongest lineups. */
export function HangarTool() {
  const [mode, setMode] = useMode();
  const [owned, setOwned, ready] = useHangar();
  const [data, setData] = useState<Data | null>(null);
  const [branch, setBranch] = useState<Branch>("ground");
  const [nation, setNation] = useState("usa");

  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    const b = p.get("b") as Branch | null;
    /* eslint-disable react-hooks/set-state-in-effect -- the URL only exists on the client */
    if (b && BRANCHES.includes(b)) setBranch(b);
    if (p.get("n")) setNation(p.get("n")!);
    /* eslint-enable react-hooks/set-state-in-effect */
    fetch("/data/planner.json")
      .then((r) => r.json())
      .then(setData);
  }, []);

  useEffect(() => {
    const url = new URL(window.location.href);
    url.searchParams.set("b", branch);
    url.searchParams.set("n", nation);
    window.history.replaceState(null, "", url);
  }, [branch, nation]);

  const col = MODE_COL[mode];
  const nations = useMemo(
    () => [...new Set((data?.rows ?? []).filter((r) => r[3] === branch).map((r) => r[2]))].sort(),
    [data, branch],
  );
  const rows = useMemo(
    () =>
      (data?.rows ?? [])
        .filter((r) => r[3] === branch && r[2] === nation)
        .sort((a, b) => a[4] - b[4] || a[col] - b[col] || a[1].localeCompare(b[1])),
    [data, branch, nation, col],
  );
  if (!data) return <p className="text-sm text-fg-3">Loading your hangar…</p>;

  const unlocks = data.unlocks[branch]?.[nation] ?? {};
  const ranks = [...new Set(rows.map((r) => r[4]))];
  const mine = rows.filter((r) => owned.has(r[0]));
  const ownedOfRank = (rank: number) => mine.filter((r) => r[4] === rank).length;
  // A rank is open when every rank before it has enough vehicles owned.
  const open = (rank: number) => ranks.filter((r) => r < rank).every((r) => ownedOfRank(r) >= (unlocks[r] ?? 0));
  const byId = new Map(rows.map((r) => [r[0], r]));
  const next = rows
    .filter((r) => r[9] === 0 && !owned.has(r[0]) && (!r[10] || owned.has(r[10]) || !byId.has(r[10])) && open(r[4]))
    .sort((a, b) => a[11] - b[11])
    .slice(0, 8);
  const spentRp = mine.reduce((n, r) => n + (r[9] === 0 ? r[11] : 0), 0);
  const brackets = [...new Set(mine.map((r) => r[col]))].sort((a, b) => b - a).slice(0, 4);

  return (
    <div className="space-y-6">
      <div className="panel flex flex-wrap items-end gap-4 p-3">
        <div className="flex flex-col gap-1 text-xs text-fg-3">
          Branch
          <div className="inline-flex panel p-0.5" role="radiogroup" aria-label="Branch">
            {BRANCHES.map((b) => (
              <button
                key={b}
                type="button"
                role="radio"
                aria-checked={branch === b}
                onClick={() => setBranch(b)}
                className={`inline-flex items-center gap-1 px-2.5 py-1 font-display text-sm ${branch === b ? "bg-white/10 text-fg" : "text-fg-2 hover:text-fg"}`}
              >
                <BranchIcon branch={b} className="h-3.5 w-3.5" />
                {BRANCH_SHORT[b]}
              </button>
            ))}
          </div>
        </div>
        <label className="flex flex-col gap-1 text-xs text-fg-3">
          Nation
          <select value={nations.includes(nation) ? nation : ""} onChange={(e) => setNation(e.target.value)} className={INPUT}>
            {!nations.includes(nation) && <option value="">Pick a nation</option>}
            {nations.map((n) => (
              <option key={n} value={n}>
                {nationName(n)}
              </option>
            ))}
          </select>
        </label>
        <div className="flex flex-col gap-1 text-xs text-fg-3">
          Mode
          <ModeToggle value={mode} onChange={setMode} />
        </div>
        <p className="ml-auto text-sm text-fg-3" aria-live="polite">
          {ready ? `${mine.length} of ${rows.length} owned · ${fmt(spentRp)} RP researched` : ""}
        </p>
      </div>

      {rows.length > 0 && (
        <div className="grid gap-4 lg:grid-cols-2">
          <section className="panel">
            <h2 className="flex items-center gap-2 border-b border-card-border px-3 py-2 font-display text-sm font-semibold uppercase tracking-wider text-fg">
              <FlaskConical className="h-4 w-4 text-fg-3" aria-hidden />
              Research next
            </h2>
            {next.length ? (
              <ul className="divide-y divide-card-border text-sm">
                {next.map((r) => (
                  <li key={r[0]} className="flex items-baseline justify-between gap-3 px-3 py-1.5">
                    <Link href={`/vehicle/${r[0]}/`} className="min-w-0 truncate font-display">
                      {r[1]} <span className="text-xs text-fg-3">{formatBr(r[col])}</span>
                    </Link>
                    <span className="flex shrink-0 items-baseline gap-3">
                      <span className="tabular text-xs text-fg-2">{fmt(r[11])} RP</span>
                      <Link href={`/research/?id=${r[0]}`} className="text-xs">
                        Plan
                      </Link>
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="px-3 py-3 text-sm text-fg-3">Nothing open to research: you own the whole open tree.</p>
            )}
          </section>
          <section className="panel">
            <h2 className="flex items-center gap-2 border-b border-card-border px-3 py-2 font-display text-sm font-semibold uppercase tracking-wider text-fg">
              <Swords className="h-4 w-4 text-fg-3" aria-hidden />
              Your top lineups
            </h2>
            {brackets.length ? (
              <ul className="divide-y divide-card-border text-sm">
                {brackets.map((br) => {
                  const lineup = mine.filter((r) => r[col] <= br && r[col] >= br - 3);
                  return (
                    <li key={br} className="flex items-baseline justify-between gap-3 px-3 py-1.5">
                      <span className="font-display text-fg">
                        {formatBr(br)} <span className="text-xs text-fg-3">{lineup.length} vehicles within 1.0</span>
                      </span>
                      <Link href={`/lineup/?b=${branch}&n=${nation}&br=${formatBr(br)}`} className="text-xs">
                        Matchmaking →
                      </Link>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="px-3 py-3 text-sm text-fg-3">Mark the vehicles you own below.</p>
            )}
          </section>
        </div>
      )}

      {ranks.map((rank) => {
        const ofRank = rows.filter((r) => r[4] === rank);
        const need = unlocks[rank] ?? 0;
        const have = ownedOfRank(rank);
        return (
          <section key={rank} className="space-y-2">
            <h2 className="flex flex-wrap items-baseline gap-x-3 font-display text-base font-semibold text-fg">
              Rank {roman(rank)}
              {need > 0 && rank < Math.max(...ranks) && (
                <span className={`text-sm font-normal ${have >= need ? "text-good" : "text-fg-3"}`}>
                  {have >= need ? "rank " + roman(rank + 1) + " open" : `${have} of ${need} to open rank ${roman(rank + 1)}`}
                </span>
              )}
              <button
                type="button"
                className="ml-auto text-xs font-normal text-link hover:underline"
                onClick={() =>
                  setOwned(
                    ofRank.filter((r) => r[9] === 0).map((r) => r[0]),
                    !ofRank.filter((r) => r[9] === 0).every((r) => owned.has(r[0])),
                  )
                }
              >
                {ofRank.filter((r) => r[9] === 0).every((r) => owned.has(r[0])) ? "Unmark tree vehicles" : "Mark all tree vehicles"}
              </button>
            </h2>
            <ul className="grid grid-cols-[repeat(auto-fill,minmax(140px,1fr))] gap-2">
              {ofRank.map((r) => {
                const have = owned.has(r[0]);
                return (
                  <li key={r[0]} className="relative">
                    <button
                      type="button"
                      aria-pressed={have}
                      onClick={() => setOwned([r[0]], !have)}
                      className={`block w-full text-left ${have ? "" : "opacity-55 hover:opacity-90"}`}
                      title={have ? "Owned: click to unmark" : "Click to mark as owned"}
                    >
                      <UnitCard
                        name={r[1]}
                        rank={r[col]}
                        status={STATUS[r[9]]}
                        image={r[8] ? `/img/units/${r[0]}.webp` : undefined}
                        selected={have}
                      />
                      {have && (
                        <span className="absolute right-1 top-1 z-20 rounded-sm bg-good px-1 text-black">
                          <Check className="h-3.5 w-3.5" aria-hidden />
                        </span>
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          </section>
        );
      })}
      <p className="text-xs text-fg-3">
        Kept in this browser only. The research planner uses the same list, so vehicles you mark here drop out of your
        plans. Premiums and squadron vehicles count towards opening ranks too.
      </p>
    </div>
  );
}

const INPUT = "border border-card-border bg-bg px-2 py-1.5 text-sm text-fg focus:border-link focus:outline-none";
