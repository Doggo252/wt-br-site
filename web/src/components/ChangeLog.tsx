import Link from "next/link";
import { Arrow } from "./Arrow";
import { MODES, MODE_LABEL, formatBr, formatBrDelta } from "@/lib/br";
import type { Absence, HistoryPoint } from "@/lib/data.gen";

type Entry =
  | { kind: "change"; v: string; d: string; before: HistoryPoint; after: HistoryPoint }
  | { kind: "added"; v: string; d: string; after: HistoryPoint }
  | { kind: "removed"; v: string; d?: string }
  | { kind: "returned"; v: string; d: string; after: HistoryPoint };

/** Newest-first table of every BR change, plus additions and removals. Doubles as the chart's table view. */
export function ChangeLog({
  history,
  absences = [],
  added,
}: {
  history: HistoryPoint[];
  absences?: Absence[];
  /** Version the vehicle was added in; unset if it was already in the first snapshot (2020-03). */
  added?: string | null;
}) {
  const returned = new Set(absences.map((a) => a.returned).filter(Boolean));
  const entries: Entry[] = [];
  history.forEach((h, i) => {
    if (i === 0) {
      if (added) entries.push({ kind: "added", v: h.v, d: h.d, after: h });
    } else if (returned.has(h.v)) {
      entries.push({ kind: "returned", v: h.v, d: h.d, after: h });
    } else {
      entries.push({ kind: "change", v: h.v, d: h.d, before: history[i - 1], after: h });
    }
  });
  for (const a of absences) entries.push({ kind: "removed", v: a.removed });
  entries.sort((a, b) => cmpVersion(b.v, a.v));

  const first = history[0];
  return (
    <div className="overflow-x-auto border border-card-border bg-panel">
      <table className="w-full min-w-[520px] text-sm">
        <thead className="bg-header text-left font-display text-xs uppercase tracking-wide text-fg-3">
          <tr>
            <th className="px-3 py-2 font-semibold">Update</th>
            <th className="px-3 py-2 font-semibold">Date</th>
            {MODES.map((m) => (
              <th key={m} className="px-3 py-2 text-right font-semibold">
                {MODE_LABEL[m]}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-card-border">
          {entries.map((e, i) => (
            <tr key={i}>
              <td className="px-3 py-1.5 font-display tabular">
                <Link href={`/updates/${e.v}/`}>{e.v}</Link>
              </td>
              <td className="px-3 py-1.5 tabular text-fg-3">{e.d ?? ""}</td>
              {e.kind === "removed" ? (
                <td colSpan={3} className="px-3 py-1.5 text-right text-bad">
                  Removed from the tech tree
                </td>
              ) : (
                MODES.map((m) => (
                  <td key={m} className="px-3 py-1.5 text-right font-display tabular">
                    <Cell entry={e} mode={m} />
                  </td>
                ))
              )}
            </tr>
          ))}
          {first && !added && (
            <tr>
              <td className="px-3 py-1.5 text-fg-3" colSpan={2}>
                In game before tracking began
              </td>
              {MODES.map((m) => (
                <td key={m} className="px-3 py-1.5 text-right font-display tabular text-fg-2">
                  {formatBr(first[m])}
                </td>
              ))}
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

function Cell({ entry, mode }: { entry: Exclude<Entry, { kind: "removed" }>; mode: "ab" | "rb" | "sb" }) {
  const after = entry.after[mode];
  if (entry.kind !== "change") {
    return (
      <span className="text-fg-2">
        {formatBr(after)} <span className="text-xs text-fg-3">{entry.kind === "added" ? "new" : "back"}</span>
      </span>
    );
  }
  const before = entry.before[mode];
  if (before === after) return <span className="text-fg-3">{formatBr(after)}</span>;
  const up = after > before;
  return (
    <span className="inline-flex items-center justify-end gap-1.5">
      <span className="text-fg">{formatBr(after)}</span>
      <span className={`inline-flex items-center gap-0.5 text-xs ${up ? "text-bad" : "text-good"}`}>
        <Arrow dir={up ? "up" : "down"} />
        {formatBrDelta(before, after)}
      </span>
    </span>
  );
}

export function cmpVersion(a: string, b: string): number {
  const pa = a.split(".").map(Number);
  const pb = b.split(".").map(Number);
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const d = (pa[i] ?? 0) - (pb[i] ?? 0);
    if (d) return d;
  }
  return 0;
}
