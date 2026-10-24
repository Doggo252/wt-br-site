"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { nationName } from "@/lib/nations";

export type RecordItem = {
  id?: string | null;
  name: string;
  nation: string;
  kills?: number | null;
  player?: string | null;
  br?: string | null;
  patch?: string | null;
};

type Sort = "kills" | "br" | "name";

export function RecordsTable({ rows, nations }: { rows: RecordItem[]; nations: string[] }) {
  const [nation, setNation] = useState("all");
  const [sort, setSort] = useState<Sort>("kills");
  const [q, setQ] = useState("");
  const [showOpen, setShowOpen] = useState(false);

  const shown = useMemo(() => {
    const nq = q.trim().toLowerCase();
    return rows
      .filter(
        (r) =>
          (nation === "all" || r.nation === nation) &&
          (showOpen || r.kills) &&
          (!nq || r.name.toLowerCase().includes(nq) || (r.player ?? "").toLowerCase().includes(nq)),
      )
      .sort((a, b) => {
        if (sort === "kills") return (b.kills ?? -1) - (a.kills ?? -1) || a.name.localeCompare(b.name);
        if (sort === "br") return Number(b.br ?? 0) - Number(a.br ?? 0) || (b.kills ?? 0) - (a.kills ?? 0);
        return a.name.localeCompare(b.name);
      });
  }, [rows, nation, sort, q, showOpen]);

  const open = rows.filter((r) => (nation === "all" || r.nation === nation) && !r.kills).length;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-end gap-4 border border-card-border bg-panel p-3">
        <label className="flex flex-col gap-1 text-xs text-fg-3">
          Nation
          <select value={nation} onChange={(e) => setNation(e.target.value)} className={INPUT}>
            <option value="all">All nations</option>
            {nations.map((n) => (
              <option key={n} value={n}>
                {nationName(n)}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-xs text-fg-3">
          Sort by
          <select value={sort} onChange={(e) => setSort(e.target.value as Sort)} className={INPUT}>
            <option value="kills">Most kills</option>
            <option value="br">Highest BR</option>
            <option value="name">Vehicle name</option>
          </select>
        </label>
        <label className="flex flex-col gap-1 text-xs text-fg-3">
          Vehicle or player
          <input type="search" value={q} onChange={(e) => setQ(e.target.value)} className={INPUT} />
        </label>
        <label className="flex cursor-pointer items-center gap-2 pb-1.5 text-sm text-fg-2">
          <input type="checkbox" checked={showOpen} onChange={(e) => setShowOpen(e.target.checked)} className="accent-link" />
          Show {open} vehicles with no record yet
        </label>
      </div>
      <p className="text-sm text-fg-3" aria-live="polite">
        {shown.length} rows
      </p>
      <div className="overflow-x-auto border border-card-border bg-panel">
        <table className="w-full min-w-[600px] text-sm">
          <thead className="bg-header text-left font-display text-xs uppercase tracking-wide text-fg-3">
            <tr>
              <th className="px-3 py-2 text-right font-semibold">Kills</th>
              <th className="px-3 py-2 font-semibold">Vehicle</th>
              <th className="px-3 py-2 font-semibold">Nation</th>
              <th className="px-3 py-2 text-right font-semibold">BR</th>
              <th className="px-3 py-2 font-semibold">Player</th>
              <th className="px-3 py-2 font-semibold">Patch</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-card-border">
            {shown.map((r, i) => (
              <tr key={`${r.nation}-${r.name}-${i}`}>
                <td className="px-3 py-1.5 text-right font-display text-base font-semibold tabular text-gold">
                  {r.kills ?? <span className="text-sm font-normal text-fg-3">open</span>}
                </td>
                <td className="px-3 py-1.5 font-display">
                  {r.id ? <Link href={`/vehicle/${r.id}/`}>{r.name}</Link> : r.name}
                </td>
                <td className="px-3 py-1.5 text-fg-2">{nationName(r.nation)}</td>
                <td className="px-3 py-1.5 text-right font-display tabular">{r.br}</td>
                <td className="px-3 py-1.5 text-fg-2">{r.player}</td>
                <td className="px-3 py-1.5 tabular text-fg-3">{r.patch}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const INPUT = "border border-card-border bg-bg px-2 py-1.5 text-sm text-fg focus:border-link focus:outline-none";
