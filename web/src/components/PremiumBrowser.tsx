"use client";

import { useMemo, useState } from "react";
import { BranchIcon } from "./BranchIcon";
import { ModeToggle } from "./ModeToggle";
import { UnitCard } from "./UnitCard";
import { BRANCHES, BRANCH_SHORT, type Branch } from "@/lib/branches";
import { nationName } from "@/lib/nations";
import { useMode } from "@/lib/useMode";

export type PremiumRow = {
  id: string;
  name: string;
  nation: string;
  branch: Branch;
  type: string;
  br: { ab: number; rb: number; sb: number };
  image: boolean;
  ge: number | null; // Golden Eagles, when sold in game
  store: number | null; // cheapest Gaijin Store pack on sale now, US dollars
  storeOld: number | null; // its price before a discount
  market: number | null; // lowest Gaijin Market offer, GJN
};

const SOURCES = [
  { key: "all", label: "All" },
  { key: "ge", label: "Golden Eagles" },
  { key: "store", label: "Gaijin Store" },
  { key: "market", label: "Gaijin Market" },
  { key: "gone", label: "Not on sale" },
] as const;
type Source = (typeof SOURCES)[number]["key"];

const has = (r: PremiumRow, s: Source) =>
  s === "all" ||
  (s === "ge" && r.ge != null) ||
  (s === "store" && r.store != null) ||
  (s === "market" && r.market != null) ||
  (s === "gone" && r.ge == null && r.store == null && r.market == null);

/** What to show on the card: the price from the chosen source, else the first one it has. */
function tag(r: PremiumRow, s: Source): { cost?: string; title?: string; price?: number } {
  const store = () => ({
    cost: `$${r.store}${r.storeOld ? ` (−${Math.round((1 - r.store! / r.storeOld) * 100)}%)` : ""}`,
    title: "Cheapest Gaijin Store pack with this vehicle",
  });
  const ge = () => ({ cost: `${r.ge!.toLocaleString("en")} GE`, title: "Golden Eagles in the in-game shop" });
  if (s === "store" && r.store != null) return store();
  if (s === "ge" && r.ge != null) return ge();
  if (s === "market" && r.market != null) return { price: r.market };
  if (r.store != null) return store();
  if (r.ge != null) return ge();
  if (r.market != null) return { price: r.market };
  return { cost: "Not on sale", title: "Not sold in game, on the store or on the market right now" };
}

export function PremiumBrowser({ rows }: { rows: PremiumRow[] }) {
  const [mode, setMode] = useMode();
  const [branch, setBranch] = useState<Branch | "">("");
  const [nation, setNation] = useState("");
  const [source, setSource] = useState<Source>("all");
  const [sort, setSort] = useState<"br" | "price">("br");

  const nations = useMemo(() => [...new Set(rows.map((r) => r.nation))].sort(), [rows]);
  const counts = useMemo(
    () =>
      Object.fromEntries(
        SOURCES.map((s) => [
          s.key,
          rows.filter((r) => (!branch || r.branch === branch) && (!nation || r.nation === nation) && has(r, s.key))
            .length,
        ]),
      ) as Record<Source, number>,
    [rows, branch, nation],
  );
  const shown = useMemo(() => {
    const price = (r: PremiumRow) =>
      source === "store" ? r.store : source === "market" ? r.market : source === "ge" ? r.ge : (r.ge ?? Infinity);
    return rows
      .filter((r) => (!branch || r.branch === branch) && (!nation || r.nation === nation) && has(r, source))
      .sort((a, b) =>
        sort === "price"
          ? (price(a) ?? Infinity) - (price(b) ?? Infinity) || b.br[mode] - a.br[mode]
          : b.br[mode] - a.br[mode] || a.name.localeCompare(b.name),
      );
  }, [rows, branch, nation, source, sort, mode]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-1 border-b border-card-border" role="tablist" aria-label="How to get it">
        {SOURCES.filter((s) => s.key === "all" || counts[s.key] > 0).map((s) => (
          <button
            key={s.key}
            type="button"
            role="tab"
            aria-selected={source === s.key}
            onClick={() => setSource(s.key)}
            className={`-mb-px border-b-2 px-3 py-1.5 font-display text-sm ${source === s.key ? "border-gold text-fg" : "border-transparent text-fg-2 hover:text-fg"}`}
          >
            {s.label} <span className="tabular text-fg-3">{counts[s.key]}</span>
          </button>
        ))}
      </div>

      <div className="panel flex flex-wrap items-end gap-4 p-3">
        <div className="flex flex-col gap-1 text-xs text-fg-3">
          Branch
          <div className="inline-flex panel p-0.5" role="radiogroup" aria-label="Branch">
            {(["", ...BRANCHES] as const).map((b) => (
              <button
                key={b || "all"}
                type="button"
                role="radio"
                aria-checked={branch === b}
                onClick={() => setBranch(b)}
                className={`inline-flex items-center gap-1 px-2.5 py-1 font-display text-sm ${branch === b ? "bg-white/10 text-fg" : "text-fg-2 hover:text-fg"}`}
              >
                {b ? <BranchIcon branch={b} className="h-3.5 w-3.5" /> : null}
                {b ? BRANCH_SHORT[b] : "All"}
              </button>
            ))}
          </div>
        </div>
        <label className="flex flex-col gap-1 text-xs text-fg-3">
          Nation
          <select value={nation} onChange={(e) => setNation(e.target.value)} className={INPUT}>
            <option value="">All</option>
            {nations.map((n) => (
              <option key={n} value={n}>
                {nationName(n)}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-xs text-fg-3">
          Sort
          <select value={sort} onChange={(e) => setSort(e.target.value as typeof sort)} className={INPUT}>
            <option value="br">Highest BR first</option>
            <option value="price">Cheapest first</option>
          </select>
        </label>
        <div className="flex flex-col gap-1 text-xs text-fg-3">
          Mode
          <ModeToggle value={mode} onChange={setMode} />
        </div>
        <p className="ml-auto text-sm text-fg-3" aria-live="polite">
          {shown.length} vehicles
        </p>
      </div>

      <ul className="grid grid-cols-[repeat(auto-fill,minmax(150px,1fr))] gap-2">
        {shown.map((r) => (
          <li key={r.id} className="flex justify-center">
            <UnitCard
              name={r.name}
              rank={r.br[mode]}
              status="premium"
              image={r.image ? `/img/units/${r.id}.webp` : undefined}
              href={`/vehicle/${r.id}/`}
              type={r.type}
              {...(() => {
                const t = tag(r, source);
                return { price: t.price, cost: t.cost, costTitle: t.title };
              })()}
            />
          </li>
        ))}
      </ul>
    </div>
  );
}

const INPUT = "border border-card-border bg-bg px-2 py-1.5 text-sm text-fg focus:border-link focus:outline-none";
