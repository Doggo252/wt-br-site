"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "@/components/Link";
import { BranchIcon } from "./BranchIcon";
import { Flag } from "./Flag";
import { ModeToggle } from "./ModeToggle";
import { Thumb } from "./Thumb";
import { formatBr } from "@/lib/br";
import { BRANCHES, BRANCH_SHORT, type Branch } from "@/lib/branches";
import { nationName } from "@/lib/nations";
import { METRICS } from "@/lib/rankings";
import { useMode } from "@/lib/useMode";

/** app/data/rankings.json/route.ts */
type Row = [string, string, string, Branch, number, number, number, 0 | 1, number, ...(number | null)[]];
const MODE_COL = { ab: 4, rb: 5, sb: 6 } as const;
const FIRST_METRIC = 9;
const TOP = 10;

const brToRank = (br: string) => Math.round((Number(br) - 1) * 3);

export function RankingsBoard() {
  const [mode, setMode] = useMode();
  const [rows, setRows] = useState<Row[]>([]);
  const [keys, setKeys] = useState<string[]>([]);
  const [branch, setBranch] = useState<Branch>("ground");
  const [rank, setRank] = useState<number | null>(null);
  const [range, setRange] = useState<"upto" | "mm" | "exact">("upto");
  const [nation, setNation] = useState("");

  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    /* eslint-disable react-hooks/set-state-in-effect -- the URL only exists on the client */
    const b = p.get("b") as Branch | null;
    if (b && BRANCHES.includes(b)) setBranch(b);
    if (p.get("br")) setRank(brToRank(p.get("br")!));
    if (p.get("n")) setNation(p.get("n")!);
    /* eslint-enable react-hooks/set-state-in-effect */
    fetch("/data/rankings.json")
      .then((r) => r.json())
      .then((d: { metrics: string[]; rows: Row[] }) => {
        setKeys(d.metrics);
        setRows(d.rows);
      });
  }, []);

  useEffect(() => {
    const url = new URL(window.location.href);
    url.searchParams.set("b", branch);
    if (rank === null) url.searchParams.delete("br");
    else url.searchParams.set("br", formatBr(rank));
    if (nation) url.searchParams.set("n", nation);
    else url.searchParams.delete("n");
    window.history.replaceState(null, "", url);
  }, [branch, rank, nation]);

  const col = MODE_COL[mode];
  const pool = useMemo(
    () =>
      rows.filter((r) => {
        if (r[3] !== branch || (nation && r[2] !== nation)) return false;
        if (rank === null) return true;
        const br = r[col] as number;
        return range === "upto" ? br <= rank : range === "mm" ? Math.abs(br - rank) <= 3 : br === rank;
      }),
    [rows, branch, nation, rank, range, col],
  );
  const nations = useMemo(
    () => [...new Set(rows.filter((r) => r[3] === branch).map((r) => r[2]))].sort(),
    [rows, branch],
  );
  const boards = METRICS.filter((m) => m.branches.includes(branch)).map((m) => {
    const i = FIRST_METRIC + keys.indexOf(m.key);
    const top = pool
      .filter((r) => r[i] != null)
      .sort((a, b) => (m.dir === "desc" ? (b[i] as number) - (a[i] as number) : (a[i] as number) - (b[i] as number)))
      .slice(0, TOP);
    return { m, i, top };
  });

  if (!rows.length) return <p className="text-sm text-fg-3">Loading rankings…</p>;

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
                onClick={() => {
                  setBranch(b);
                  setNation("");
                }}
                className={`inline-flex items-center gap-1 px-2.5 py-1 font-display text-sm ${branch === b ? "bg-white/10 text-fg" : "text-fg-2 hover:text-fg"}`}
              >
                <BranchIcon branch={b} className="h-3.5 w-3.5" />
                {BRANCH_SHORT[b]}
              </button>
            ))}
          </div>
        </div>
        <label className="flex flex-col gap-1 text-xs text-fg-3">
          Battle Rating
          <span className="flex items-center gap-2">
            <select
              value={range}
              onChange={(e) => setRange(e.target.value as typeof range)}
              className={INPUT}
              aria-label="Which vehicles around that Battle Rating"
              disabled={rank === null}
            >
              <option value="upto">up to</option>
              <option value="mm">within ± 1.0 of</option>
              <option value="exact">exactly</option>
            </select>
            <select
              value={rank ?? ""}
              onChange={(e) => setRank(e.target.value === "" ? null : Number(e.target.value))}
              className={INPUT}
            >
              <option value="">Any</option>
              {Array.from({ length: 40 }, (_, r) => (
                <option key={r} value={r}>
                  {formatBr(r)}
                </option>
              ))}
            </select>
          </span>
        </label>
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
        <div className="flex flex-col gap-1 text-xs text-fg-3">
          Mode
          <ModeToggle value={mode} onChange={setMode} />
        </div>
        <p className="ml-auto text-sm text-fg-3" aria-live="polite">
          {pool.length.toLocaleString("en")} vehicles
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {boards.map(({ m, i, top }) => (
          <section key={m.key} id={m.key} className="panel min-w-0 scroll-mt-20">
            <h2 className="border-b border-card-border px-3 py-2 font-display text-sm font-semibold uppercase tracking-wider text-fg">
              {m.title}
            </h2>
            {top.length ? (
              <ol className="divide-y divide-card-border text-sm">
                {top.map((r, n) => (
                  <li key={r[0]} className="flex items-center gap-2 px-3 py-1.5">
                    <span className="w-5 shrink-0 text-right tabular text-fg-3">{n + 1}</span>
                    <Thumb id={r[0]} image={!!r[7]} />
                    <Flag nation={r[2]} labelled className="h-3 shrink-0" />
                    <Link
                      href={`/vehicle/${r[0]}/`}
                      className={`min-w-0 truncate font-display ${r[8] === 0 ? "" : r[8] === 2 ? "text-squadron" : "text-premium"}`}
                    >
                      {r[1]}
                    </Link>
                    <span className="ml-auto shrink-0 tabular text-xs text-fg-3">{formatBr(r[col] as number)}</span>
                    <span className="w-20 shrink-0 text-right tabular text-fg">
                      {(r[i] as number).toLocaleString("en", { maximumFractionDigits: m.digits ?? 0 })}
                      <span className="ml-0.5 text-xs text-fg-3">{m.unit}</span>
                    </span>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="px-3 py-3 text-sm text-fg-3">No vehicles here.</p>
            )}
          </section>
        ))}
      </div>
    </div>
  );
}

const INPUT = "border border-card-border bg-bg px-2 py-1.5 text-sm text-fg focus:border-link focus:outline-none";
