import Link from "@/components/Link";
import { Arrow } from "./Arrow";
import { MODES, MODE_LABEL, formatBr, formatBrDelta, type Mode } from "@/lib/br";
import type { OfficialChange, UnitSummary } from "@/lib/data.gen";
import { Flag } from "./Flag";
import { Thumb } from "./Thumb";

type Outcome = "pending" | "applied" | "different" | "not_applied";

const OUTCOME: Record<Outcome, { label: string; className: string; title: string }> = {
  pending: { label: "Not live yet", className: "border-gold/50 text-gold", title: "Announced, not in the game yet" },
  applied: { label: "Applied", className: "border-card-border text-fg-2", title: "Went live as announced" },
  different: {
    label: "Changed",
    className: "border-link/50 text-link",
    title: "The BR changed, but not to the announced value",
  },
  not_applied: {
    label: "Not applied",
    className: "border-bad/50 text-bad",
    title: "Announced but the BR didn't change within 45 days",
  },
};

/** Summarise a row's per-mode outcomes into one chip. */
export function rowOutcome(c: OfficialChange): Outcome | null {
  const v = Object.values(c.outcome ?? {}) as Outcome[];
  if (!v.length) return null;
  for (const o of ["pending", "not_applied", "different"] as Outcome[]) if (v.includes(o)) return o;
  return "applied";
}

export function OutcomeChip({ outcome }: { outcome: Outcome }) {
  const o = OUTCOME[outcome];
  return (
    <span title={o.title} className={`inline-block whitespace-nowrap rounded-sm border px-1.5 py-px text-xs ${o.className}`}>
      {o.label}
    </span>
  );
}

export function ChangeCell({ pair }: { pair?: [number, number] | null }) {
  if (!pair) return <span className="text-fg-3">–</span>;
  const [a, b] = pair;
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="text-fg-3">{formatBr(a)}</span>
      <span className="text-fg-3">→</span>
      <span className="text-fg">{formatBr(b)}</span>
      <span className={`inline-flex items-center gap-0.5 text-xs ${b > a ? "text-bad" : "text-good"}`}>
        <Arrow dir={b > a ? "up" : "down"} />
        {formatBrDelta(a, b)}
      </span>
    </span>
  );
}

/** A Gaijin BR-change table, linked to vehicle pages. */
export function OfficialChangeTable({
  changes,
  units,
  showOutcome,
  showGroundBattle = false,
}: {
  changes: OfficialChange[];
  units: Map<string, UnitSummary>;
  showOutcome: boolean;
  showGroundBattle?: boolean;
}) {
  const modes: (Mode | "grb")[] = [...MODES, ...(showGroundBattle ? (["grb"] as const) : [])];
  return (
    <div className="overflow-x-auto panel">
      <table className="data-table w-full min-w-[640px] text-sm">
        <thead>
          <tr>
            <th className="px-3 py-2 font-semibold">Vehicle</th>
            {modes.map((m) => (
              <th key={m} className="px-3 py-2 text-right font-semibold" title={m === "grb" ? "In ground battles" : undefined}>
                {m === "grb" ? "Ground RB" : MODE_LABEL[m]}
              </th>
            ))}
            {showOutcome && <th className="px-3 py-2 font-semibold">Outcome</th>}
          </tr>
        </thead>
        <tbody className="divide-y divide-card-border">
          {changes.map((c, i) => {
            const id = c.ids?.[0];
            const u = id ? units.get(id) : undefined;
            const o = rowOutcome(c);
            return (
              <tr key={i}>
                <td className="px-3 py-1.5">
                  <span className="flex items-center gap-2">
                    {id && <Thumb id={id} image={u?.image} />}
                    {u && <Flag nation={u.nation} labelled className="h-3" />}
                    {id ? (
                      <Link href={`/vehicle/${id}/`} className="font-display">
                        {u?.name ?? c.name}
                      </Link>
                    ) : (
                      <span className="font-display">{c.name}</span>
                    )}
                  </span>
                  {c.comment && <span className="block text-xs text-fg-3">{c.comment}</span>}
                </td>
                {modes.map((m) => (
                  <td key={m} className="whitespace-nowrap px-3 py-1.5 text-right font-display tabular">
                    <ChangeCell pair={c[m]} />
                  </td>
                ))}
                {showOutcome && <td className="px-3 py-1.5">{o && <OutcomeChip outcome={o} />}</td>}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
