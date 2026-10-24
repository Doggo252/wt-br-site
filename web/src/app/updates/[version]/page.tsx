import type { Metadata } from "next";
import Link from "next/link";
import { Arrow } from "@/components/Arrow";
import { UnitCard } from "@/components/UnitCard";
import { MODES, MODE_LABEL, formatBr, formatBrDelta } from "@/lib/br";
import { getMeta, getUnitMap, getUpdate, getVersions } from "@/lib/data";
import type { BrChange, UnitSummary } from "@/lib/data.gen";
import { nationName } from "@/lib/nations";

export const dynamicParams = false;

export function generateStaticParams() {
  return getVersions().map((v) => ({ version: v.v }));
}

type Params = { params: Promise<{ version: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { version } = await params;
  const u = getUpdate(version);
  return {
    title: `Update ${version} BR changes`,
    description: `${u.changes.length} ground Battle Rating changes in War Thunder update ${version} (${u.d}).`,
  };
}

export default async function UpdatePage({ params }: Params) {
  const { version } = await params;
  const u = getUpdate(version);
  const units = getUnitMap();
  const nations = getMeta().nations;

  const byNation = new Map<string, BrChange[]>();
  for (const c of u.changes) {
    const n = units.get(c.id)?.nation ?? "other";
    byNation.set(n, [...(byNation.get(n) ?? []), c]);
  }
  const order = [...byNation.keys()].sort((a, b) => nations.indexOf(a) - nations.indexOf(b));
  const up = u.changes.filter((c) => c.after.rb > c.before.rb).length;
  const down = u.changes.filter((c) => c.after.rb < c.before.rb).length;

  return (
    <div className="space-y-8">
      <header>
        <nav className="mb-2 flex justify-between text-sm">
          {u.prev ? <Link href={`/updates/${u.prev}/`}>← {u.prev}</Link> : <span />}
          <Link href="/updates/">All updates</Link>
          {u.next ? <Link href={`/updates/${u.next}/`}>{u.next} →</Link> : <span />}
        </nav>
        <h1 className="text-3xl font-bold">Update {version}</h1>
        <p className="mt-1 text-fg-2">
          {u.d} · {u.changes.length} BR change{u.changes.length === 1 ? "" : "s"}
          {u.changes.length > 0 && (
            <>
              {" "}
              (RB: <span className="text-bad">{up} up</span>, <span className="text-good">{down} down</span>)
            </>
          )}
          {u.added.length > 0 && <> · {u.added.length} added</>}
          {u.removed.length > 0 && <> · {u.removed.length} removed</>}
        </p>
        {!u.prev && (
          <p className="mt-2 text-sm text-fg-3">This is the first version in the datamine, used as the baseline.</p>
        )}
      </header>

      {order.map((nation) => (
        <section key={nation}>
          <h2 className="mb-2 text-xl font-semibold">{nationName(nation)}</h2>
          <DiffTable changes={byNation.get(nation)!} units={units} />
        </section>
      ))}

      {u.added.length > 0 && <UnitGrid title="Added" ids={u.added} units={units} />}
      {u.removed.length > 0 && <UnitGrid title="Removed" ids={u.removed} units={units} removed />}

      {u.changes.length === 0 && u.added.length === 0 && u.removed.length === 0 && (
        <p className="text-fg-2">No ground BR changes in this version; only the tech tree layout changed.</p>
      )}
    </div>
  );
}

function DiffTable({ changes, units }: { changes: BrChange[]; units: Map<string, UnitSummary> }) {
  const sorted = [...changes].sort((a, b) => a.after.rb - b.after.rb);
  return (
    <div className="overflow-x-auto border border-card-border bg-panel">
      <table className="w-full min-w-[560px] text-sm">
        <thead className="bg-header text-left font-display text-xs uppercase tracking-wide text-fg-3">
          <tr>
            <th className="px-3 py-2 font-semibold">Vehicle</th>
            {MODES.map((m) => (
              <th key={m} className="px-3 py-2 text-right font-semibold">
                {MODE_LABEL[m]}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-card-border">
          {sorted.map((c) => {
            const unit = units.get(c.id);
            return (
              <tr key={c.id}>
                <td className="px-3 py-1.5">
                  <Link href={`/vehicle/${c.id}/`} className="font-display">
                    {unit?.name ?? c.id}
                  </Link>
                </td>
                {MODES.map((m) => {
                  const a = c.before[m];
                  const b = c.after[m];
                  return (
                    <td key={m} className="px-3 py-1.5 text-right font-display tabular">
                      {a === b ? (
                        <span className="text-fg-3">{formatBr(b)}</span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5">
                          <span className="text-fg-3">{formatBr(a)}</span>
                          <span className="text-fg-3">→</span>
                          <span className="text-fg">{formatBr(b)}</span>
                          <span className={`inline-flex items-center gap-0.5 text-xs ${b > a ? "text-bad" : "text-good"}`}>
                            <Arrow dir={b > a ? "up" : "down"} />
                            {formatBrDelta(a, b)}
                          </span>
                        </span>
                      )}
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function UnitGrid({
  title,
  ids,
  units,
  removed = false,
}: {
  title: string;
  ids: string[];
  units: Map<string, UnitSummary>;
  removed?: boolean;
}) {
  return (
    <section>
      <h2 className="mb-3 text-xl font-semibold">{title}</h2>
      <ul className="grid grid-cols-[repeat(auto-fill,minmax(150px,1fr))] gap-3">
        {ids.map((id) => {
          const u = units.get(id);
          if (!u) return null;
          return (
            <li key={id}>
              <UnitCard
                name={u.name}
                rank={u.br.rb}
                status={u.status}
                availability={removed ? "removed" : "current"}
                image={u.image ? `/img/units/${id}.webp` : undefined}
                href={`/vehicle/${id}/`}
              />
            </li>
          );
        })}
      </ul>
    </section>
  );
}
