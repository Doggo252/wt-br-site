"use client";

import { Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import Link from "@/components/Link";
import { Flag } from "./Flag";
import { ModeToggle } from "./ModeToggle";
import { Thumb } from "./Thumb";
import { formatBr } from "@/lib/br";
import { nationName } from "@/lib/nations";
import { useMode } from "@/lib/useMode";

/** app/data/shells.json/route.ts */
type Shell = [string, string, string, 0 | 1 | 2, number, number, number, number, number, number, string];
/** app/data/lineup.json/route.ts (the columns used here) */
type Unit = [string, string, string, string, string, number, number, number, number, number, number, ...unknown[]];

const MODE_COL = { ab: 7, rb: 8, sb: 9 } as const;
const KINDS = [
  { key: "all", label: "All" },
  { key: "kinetic", label: "Kinetic" },
  { key: "chemical", label: "HEAT and HESH" },
] as const;
const SORTS = [
  { key: 4, label: "10 m" },
  { key: 5, label: "500 m" },
  { key: 6, label: "1 km" },
  { key: 7, label: "2 km" },
  { key: 8, label: "Velocity" },
] as const;
const PAGE = 100;

const brToRank = (br: string) => Math.round((Number(br) - 1) * 3);

/** Every anti-armour shell in the game, filtered to a Battle Rating window and ranked. */
export function ShellBrowser() {
  const [mode, setMode] = useMode();
  const [shells, setShells] = useState<Shell[]>([]);
  const [units, setUnits] = useState<Map<string, Unit>>(new Map());
  const [rank, setRank] = useState<number | null>(null);
  const [spread, setSpread] = useState(3);
  // Kinetic by default: HEAT jets and ATGMs would otherwise fill the top of every list.
  const [kind, setKind] = useState<(typeof KINDS)[number]["key"]>("kinetic");
  const [nation, setNation] = useState("");
  const [sort, setSort] = useState<(typeof SORTS)[number]["key"]>(4);
  const [stockOnly, setStockOnly] = useState(false);
  const [q, setQ] = useState("");
  const [limit, setLimit] = useState(PAGE);

  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    /* eslint-disable-next-line react-hooks/set-state-in-effect -- the URL only exists on the client */
    if (p.get("br")) setRank(brToRank(p.get("br")!));
    Promise.all([
      fetch("/data/shells.json").then((r) => r.json()),
      fetch("/data/lineup.json").then((r) => r.json()),
    ]).then(([s, u]: [Shell[], Unit[]]) => {
      setShells(s);
      setUnits(new Map(u.map((r) => [r[0], r])));
    });
  }, []);

  useEffect(() => {
    const url = new URL(window.location.href);
    if (rank === null) url.searchParams.delete("br");
    else url.searchParams.set("br", formatBr(rank));
    window.history.replaceState(null, "", url);
  }, [rank]);

  const col = MODE_COL[mode];
  const nations = useMemo(
    () => [...new Set(shells.map((s) => units.get(s[0])?.[2]).filter((n): n is string => !!n))].sort(),
    [shells, units],
  );
  const shown = useMemo(() => {
    const nq = q.trim().toLowerCase();
    return shells
      .filter((s) => {
        const u = units.get(s[0]);
        if (!u || u[6]) return false;
        if (rank !== null && Math.abs(u[col] - rank) > spread) return false;
        if (nation && u[2] !== nation) return false;
        if (kind === "kinetic" && s[3] !== 0) return false;
        if (kind === "chemical" && s[3] === 0) return false;
        if (stockOnly && s[9] > 0) return false;
        return !nq || u[1].toLowerCase().includes(nq) || s[1].toLowerCase().includes(nq);
      })
      .sort((a, b) => b[sort] - a[sort] || b[4] - a[4]);
  }, [shells, units, rank, spread, col, nation, kind, stockOnly, q, sort]);

  if (!shells.length) return <p className="text-sm text-fg-3">Loading shells…</p>;

  return (
    <div className="space-y-4">
      <div className="panel flex flex-wrap items-end gap-4 p-3">
        <label className="flex flex-col gap-1 text-xs text-fg-3">
          Battle Rating
          <span className="flex items-center gap-2">
            <select
              value={rank ?? ""}
              onChange={(e) => {
                setRank(e.target.value === "" ? null : Number(e.target.value));
                setLimit(PAGE);
              }}
              className={INPUT}
            >
              <option value="">Any</option>
              {Array.from({ length: 40 }, (_, r) => (
                <option key={r} value={r}>
                  {formatBr(r)}
                </option>
              ))}
            </select>
            <select
              value={spread}
              onChange={(e) => setSpread(Number(e.target.value))}
              className={INPUT}
              aria-label="Range around that Battle Rating"
              disabled={rank === null}
            >
              <option value={0}>exactly</option>
              <option value={1}>± 0.3</option>
              <option value={3}>± 1.0 (matchmaking)</option>
            </select>
          </span>
        </label>
        <div className="flex flex-col gap-1 text-xs text-fg-3">
          Mode
          <ModeToggle value={mode} onChange={setMode} />
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
          Shells
          <select value={kind} onChange={(e) => setKind(e.target.value as typeof kind)} className={INPUT}>
            {KINDS.map((k) => (
              <option key={k.key} value={k.key}>
                {k.label}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-xs text-fg-3">
          Sort by
          <select value={sort} onChange={(e) => setSort(Number(e.target.value) as typeof sort)} className={INPUT}>
            {SORTS.map((s) => (
              <option key={s.key} value={s.key}>
                {s.key === 8 ? s.label : `Penetration at ${s.label}`}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-xs text-fg-3">
          Search
          <span className="relative">
            <Search className="pointer-events-none absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-fg-3" aria-hidden />
            <input type="search" value={q} onChange={(e) => setQ(e.target.value)} className={`${INPUT} w-40 pl-7`} />
          </span>
        </label>
        <label className="flex items-center gap-2 self-center text-sm text-fg-2">
          <input type="checkbox" checked={stockOnly} onChange={(e) => setStockOnly(e.target.checked)} />
          Stock shells only
        </label>
        <p className="ml-auto text-sm text-fg-3" aria-live="polite">
          {shown.length.toLocaleString("en")} shells
        </p>
      </div>

      <div className="panel overflow-x-auto">
        <table className="data-table w-full min-w-[720px] whitespace-nowrap text-sm">
          <thead>
            <tr>
              <th scope="col" className="text-right">
                #
              </th>
              <th scope="col">Vehicle</th>
              <th scope="col" className="text-right">
                BR
              </th>
              <th scope="col">Shell</th>
              {SORTS.map((s) => (
                <th key={s.key} scope="col" className={`text-right ${sort === s.key ? "text-fg" : ""}`}>
                  {s.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {shown.slice(0, limit).map((s, i) => {
              const u = units.get(s[0])!;
              const flat = s[3] !== 0;
              return (
                <tr key={`${s[0]}/${s[1]}`}>
                  <td className="text-right tabular text-fg-3">{i + 1}</td>
                  <td>
                    <Link href={`/vehicle/${s[0]}/`} className="flex items-center gap-2 font-display">
                      <Thumb id={s[0]} image={!!u[10]} />
                      <Flag nation={u[2]} labelled className="h-3" />
                      {u[1]}
                    </Link>
                  </td>
                  <td className="text-right tabular">{formatBr(u[col])}</td>
                  <td>
                    <span className="text-fg">{s[1]}</span> <span className="text-xs text-fg-3">{s[2]}</span>
                    {s[9] > 0 && <span className="ml-1 text-xs text-fg-3">· tier {s[9]}</span>}
                  </td>
                  {flat ? (
                    <td colSpan={4} className="text-center tabular text-fg">
                      {s[4]} mm {s[3] === 1 ? "jet, any range" : "HESH"}
                    </td>
                  ) : (
                    [4, 5, 6, 7].map((c) => (
                      <td key={c} className={`text-right tabular ${sort === c ? "font-semibold text-fg" : "text-fg-2"}`}>
                        {s[c]}
                      </td>
                    ))
                  )}
                  <td className={`text-right tabular ${sort === 8 ? "font-semibold text-fg" : "text-fg-2"}`}>
                    {s[8] ? s[8].toLocaleString("en") : "—"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {shown.length > limit && (
        <div className="text-center">
          <button type="button" className="btn" onClick={() => setLimit((l) => l + PAGE * 2)}>
            Show more ({(shown.length - limit).toLocaleString("en")} left)
          </button>
        </div>
      )}
      <p className="text-xs text-fg-3">
        Penetration in mm of flat armour at 0°, from the game files. Velocity in m/s. HEAT jets keep their penetration
        at any range. Vehicles you can no longer get are left out.
      </p>
    </div>
  );
}

const INPUT = "border border-card-border bg-bg px-2 py-1.5 text-sm text-fg focus:border-link focus:outline-none";
