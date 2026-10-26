import type { Metadata } from "next";
import Link from "@/components/Link";
import { Arrow } from "@/components/Arrow";
import { ArrowKeyNav } from "@/components/ArrowKeyNav";
import { BackToVehicle } from "@/components/BackToVehicle";
import { UnitCard } from "@/components/UnitCard";
import { MODES, MODE_LABEL, formatBr, formatBrDelta } from "@/lib/br";
import { BRANCHES, BRANCH_NAME, type Branch } from "@/lib/branches";
import { getUnitMap, getUpdate, getVersions, nationsOf } from "@/lib/data";
import type { BrChange, UnitSummary } from "@/lib/data.gen";
import { nationName } from "@/lib/nations";
import { BranchIcon } from "@/components/BranchIcon";
import { Flag } from "@/components/Flag";
import { UpdateFilter } from "@/components/UpdateFilter";
import { Thumb } from "@/components/Thumb";
import { plainName, plural } from "@/lib/format";

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
    description: `${u.changes.length} Battle Rating changes in War Thunder update ${version} (${u.d}).`,
  };
}

export default async function UpdatePage({ params }: Params) {
  const { version } = await params;
  const u = getUpdate(version);
  const units = getUnitMap();

  // Group changes by branch, then nation, in game order.
  const groups: { branch: Branch; nation: string; changes: BrChange[] }[] = [];
  for (const b of BRANCHES) {
    for (const n of nationsOf(b)) {
      const changes = u.changes.filter((c) => units.get(c.id)?.branch === b && units.get(c.id)?.nation === n);
      if (changes.length) groups.push({ branch: b, nation: n, changes });
    }
  }
  const up = u.changes.filter((c) => c.after.rb > c.before.rb).length;
  const down = u.changes.filter((c) => c.after.rb < c.before.rb).length;

  return (
    <div className="space-y-8">
      <header className="space-y-4">
        <ArrowKeyNav prev={u.prev ? `/updates/${u.prev}/` : null} next={u.next ? `/updates/${u.next}/` : null} />
        <BackToVehicle
          names={Object.fromEntries(
            [...u.changes.map((c) => c.id), ...u.added, ...u.removed].map((id) => [id, plainName(units.get(id)?.name ?? id)]),
          )}
        />
        <nav className="flex flex-wrap items-center justify-between gap-2 text-sm">
          {u.prev ? (
            <Link href={`/updates/${u.prev}/`} className="btn">
              ← {u.prev}
            </Link>
          ) : (
            <span />
          )}
          <Link href="/updates/" className="text-fg-3 hover:text-fg">
            All updates
          </Link>
          {u.next ? (
            <Link href={`/updates/${u.next}/`} className="btn">
              {u.next} →
            </Link>
          ) : (
            <span />
          )}
        </nav>
        <div>
          <p className="eyebrow">Game version · {u.d}</p>
          <h1 className="mt-1 text-4xl font-bold sm:text-5xl">Update {version}</h1>
        </div>
        <div className="flex flex-wrap gap-2 font-display text-sm font-semibold">
          <span className="border border-[#2f3a42] bg-black/25 px-2.5 py-1 tabular">{plural(u.changes.length, "BR change")}</span>
          {up > 0 && (
            <span className="inline-flex items-center gap-1 border border-[#2f3a42] bg-black/25 px-2.5 py-1 tabular text-bad">
              <Arrow dir="up" /> {up} RB up
            </span>
          )}
          {down > 0 && (
            <span className="inline-flex items-center gap-1 border border-[#2f3a42] bg-black/25 px-2.5 py-1 tabular text-good">
              <Arrow dir="down" /> {down} RB down
            </span>
          )}
          {u.added.length > 0 && (
            <span className="border border-[#2f3a42] bg-black/25 px-2.5 py-1 tabular text-fg-2">+{u.added.length} added</span>
          )}
          {u.removed.length > 0 && (
            <span className="border border-[#2f3a42] bg-black/25 px-2.5 py-1 tabular text-fg-3">{u.removed.length} removed</span>
          )}
        </div>
        {!u.prev && <p className="text-sm text-fg-3">This is the first version in the datamine, used as the baseline.</p>}
      </header>

      {groups.length > 1 && (
        <UpdateFilter
          nations={[...new Set(groups.map((g) => g.nation))]}
          ids={[...u.changes.map((c) => c.id), ...u.added, ...u.removed]}
        />
      )}

      {BRANCHES.filter((b) => groups.some((g) => g.branch === b)).map((b) => (
        <section key={b} data-branch={b} className="space-y-6">
          <h2 className="section-title">
            <BranchIcon branch={b} className="h-5 w-5 text-fg-3" />
            {BRANCH_NAME[b]}
          </h2>
          {groups
            .filter((g) => g.branch === b)
            .map((g) => (
              <div key={g.nation} data-nation={g.nation}>
                <h3 className="mb-2 flex items-center gap-2 font-display text-lg font-semibold">
                  <Flag nation={g.nation} className="h-4" />
                  {nationName(g.nation)}
                  <span className="text-sm font-normal text-fg-3">{g.changes.length}</span>
                </h3>
                <DiffTable changes={g.changes} units={units} />
              </div>
            ))}
        </section>
      ))}

      {u.added.length > 0 && <UnitGrid title="Added" ids={u.added} units={units} />}
      {u.removed.length > 0 && <UnitGrid title="Removed" ids={u.removed} units={units} removed />}

      {u.changes.length === 0 && u.added.length === 0 && u.removed.length === 0 && (
        <p className="text-fg-2">No BR changes in this version; only the tech tree layout changed.</p>
      )}
    </div>
  );
}

function DiffTable({ changes, units }: { changes: BrChange[]; units: Map<string, UnitSummary> }) {
  const sorted = [...changes].sort((a, b) => a.after.rb - b.after.rb);
  return (
    <div className="overflow-x-auto panel">
      <table className="data-table w-full min-w-[560px] text-sm">
        <thead>
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
              <tr key={c.id} data-unit={c.id}>
                <td className="px-3 py-1">
                  <Link href={`/vehicle/${c.id}/`} className="flex items-center gap-2 font-display">
                    <Thumb id={c.id} image={unit?.image} />
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
    <section data-branch={title.toLowerCase()}>
      <h2 className="section-title mb-3">{title}</h2>
      <ul className="grid grid-cols-[repeat(auto-fill,minmax(150px,1fr))] gap-3">
        {ids.map((id) => {
          const u = units.get(id);
          if (!u) return null;
          return (
            <li key={id} data-nation={units.get(id)?.nation} data-unit={id}>
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
