import type { Metadata } from "next";
import Link from "@/components/Link";
import {
  Anchor,
  ArrowUpDown,
  CalendarDays,
  ChartLine,
  Eye,
  Flag as Flag3,
  GitCompareArrows,
  type LucideIcon,
  Shuffle,
} from "lucide-react";
import { Arrow } from "@/components/Arrow";
import { Tabs } from "@/components/Tabs";
import { ThermalFinder, type ThermalUnit } from "@/components/ThermalFinder";
import { BRANCHES, BRANCH_SHORT, type Branch } from "@/lib/branches";
import { TopBrChart, type TopBrPoint } from "@/components/TopBrChart";
import { UpDownChart, type UpDownRow } from "@/components/UpDownChart";
import { formatBr, formatBrDelta, rankToBr } from "@/lib/br";
import { getIndex, getUnit, getVersions, nationsOf, type Version } from "@/lib/data";
import type { UnitDetail } from "@/lib/data.gen";
import { Flag } from "@/components/Flag";
import { Thumb } from "@/components/Thumb";
import { plural } from "@/lib/format";
import { nationName } from "@/lib/nations";

export const metadata: Metadata = {
  title: "Explore",
  description:
    "War Thunder vehicles and aircraft with the biggest Battle Rating moves since 2020, the most-changed vehicles, a thermal sight finder and BR creep over time.",
};

const SECTIONS: [string, string, LucideIcon][] = [
  ["#movers", "Biggest moves", ArrowUpDown],
  ["#most-changed", "Most changed", Shuffle],
  ["#thermals", "Thermal finder", Eye],
  ["#stable", "Longest unchanged", Anchor],
  ["#nations", "By nation", Flag3],
  ["#by-year", "By year", CalendarDays],
  ["#top-br", "Top BR over time", ChartLine],
];

export default function ExplorePage() {
  const versions = getVersions();
  const live = getIndex().filter((u) => !u.removedIn);
  const details = live.map((u) => getUnit(u.id));

  const byBranch = BRANCHES.map((b) => {
    const ds = details.filter((d) => d.branch === b);
    // Net RB change since each vehicle's first recorded BR.
    const net = ds
      .filter((d) => d.history && d.history.length > 1)
      .map((d) => ({
        d,
        first: d.history![0].rb,
        delta: d.br.rb - d.history![0].rb,
      }))
      .filter((x) => x.delta !== 0);
    return {
      branch: b,
      ups: [...net].sort((a, b) => b.delta - a.delta || a.d.name.localeCompare(b.d.name)).slice(0, 15),
      downs: [...net].sort((a, b) => a.delta - b.delta || a.d.name.localeCompare(b.d.name)).slice(0, 15),
      most: [...ds].sort((a, b) => (b.changes ?? 0) - (a.changes ?? 0)).slice(0, 15),
      top: topBr(
        ds,
        versions.map((v) => v.v),
        versions.map((v) => v.d),
      ),
      byYear: upDownByYear(versions, b),
      nations: nationBalance(ds),
      stable: longestUnchanged(ds),
    };
  });
  const labels = byBranch.map((x) => BRANCH_SHORT[x.branch]);

  const thermal: ThermalUnit[] = live
    .filter((u) => u.branch === "ground" && u.thermal && Object.keys(u.thermal).length > 0)
    .map((u) => ({
      id: u.id,
      name: u.name,
      nation: u.nation,
      status: u.status,
      hidden: u.hidden,
      image: u.image,
      br: u.br,
      thermal: u.thermal as ThermalUnit["thermal"],
    }));

  return (
    <div className="space-y-14">
      <header>
        <h1 className="text-4xl font-bold">Explore</h1>
        <p className="mt-2 max-w-2xl text-fg-2">
          Realistic Battles BR moves since March 2020 (or since a vehicle was added), and tools for finding vehicles.
        </p>
        <nav className="mt-4 flex flex-wrap gap-2 text-sm">
          {SECTIONS.map(([href, label, Icon]) => (
            <a key={href} className="btn gap-1.5" href={href}>
              <Icon className="h-4 w-4 text-gold/80" aria-hidden />
              {label}
            </a>
          ))}
          <Link className="btn gap-1.5" href="/compare/">
            <GitCompareArrows className="h-4 w-4 text-gold/80" aria-hidden />
            Compare vehicles
          </Link>
        </nav>
      </header>

      <section id="movers" className="scroll-mt-16">
        <h2 className="section-title mb-1">Biggest moves</h2>
        <p className="mb-4 text-sm text-fg-3">Net RB change from the first recorded BR to today.</p>
        <Tabs labels={labels}>
          {byBranch.map((x) => (
            <div key={x.branch} className="grid gap-6 md:grid-cols-2">
              <MoverTable title="Most uptiered" rows={x.ups} />
              <MoverTable title="Most downtiered" rows={x.downs} />
            </div>
          ))}
        </Tabs>
      </section>

      <section id="most-changed" className="scroll-mt-16">
        <h2 className="section-title mb-1">Most changed</h2>
        <p className="mb-4 text-sm text-fg-3">Updates that changed a vehicle&apos;s BR in any mode.</p>
        <Tabs labels={labels}>
          {byBranch.map((x) => (
            <ol key={x.branch} className="divide-y divide-card-border panel">
              {x.most.map((d, i) => (
                <li key={d.id} className="flex items-center gap-3 px-3 py-1 text-sm">
                  <span className="w-6 text-right font-display tabular text-fg-3">{i + 1}</span>
                  <Link href={`/vehicle/${d.id}/`} className="flex min-w-0 flex-1 items-center gap-2 font-display">
                    <Thumb id={d.id} image={d.image} />
                    <Flag nation={d.nation} labelled className="h-3" />
                    <span className="truncate">{d.name}</span>
                  </Link>
                  <span className="w-24 text-right tabular text-fg">{d.changes} changes</span>
                </li>
              ))}
            </ol>
          ))}
        </Tabs>
      </section>

      <section id="stable" className="scroll-mt-16">
        <h2 className="section-title mb-1">Longest unchanged</h2>
        <p className="mb-4 text-sm text-fg-3">
          Tech tree vehicles whose BR hasn&apos;t moved in any mode for the longest time.
        </p>
        <Tabs labels={labels}>
          {byBranch.map((x) => (
            <div key={x.branch} className="space-y-2">
              {x.stable.never > 0 && (
                <p className="text-sm text-fg-2">
                  {plural(x.stable.never, "tech tree vehicle")} still sit at the BR they had in March 2020.
                </p>
              )}
              <ol className="divide-y divide-card-border panel">
                {x.stable.rows.map(({ d, since, first }, i) => (
                  <li key={d.id} className="flex items-center gap-3 px-3 py-1 text-sm">
                    <span className="w-6 text-right font-display tabular text-fg-3">{i + 1}</span>
                    <Link href={`/vehicle/${d.id}/`} className="flex min-w-0 flex-1 items-center gap-2 font-display">
                      <Thumb id={d.id} image={d.image} />
                      <Flag nation={d.nation} labelled className="h-3" />
                      <span className="truncate">{d.name}</span>
                    </Link>
                    <span className="w-12 text-right font-display tabular">{formatBr(d.br.rb)}</span>
                    <span className="w-44 text-right tabular text-fg-2">
                      {first ? "since tracking began" : `since ${since.v}`}
                      <span className="block text-xs text-fg-3">{since.d}</span>
                    </span>
                  </li>
                ))}
              </ol>
            </div>
          ))}
        </Tabs>
      </section>

      <section id="thermals" className="scroll-mt-16">
        <h2 className="section-title mb-1">Thermal finder</h2>
        <p className="mb-4 text-sm text-fg-3">
          Best thermal sight per crew position, including ones that need a modification. Sorted from the lowest BR.
        </p>
        <ThermalFinder units={thermal} nations={nationsOf("ground")} />
      </section>

      <section id="nations" className="scroll-mt-16">
        <h2 className="section-title mb-1">Uptiers and downtiers by nation</h2>
        <p className="mb-4 text-sm text-fg-3">
          Every RB change to vehicles in the game today, since March 2020. Net is the sum of all moves (one 1.0 uptier
          and three 0.3 downtiers come to +0.1); per vehicle divides it by the nation&apos;s vehicle count.
        </p>
        <Tabs labels={labels}>
          {byBranch.map((x) => (
            <NationTable key={x.branch} rows={x.nations} />
          ))}
        </Tabs>
      </section>

      <section id="by-year" className="scroll-mt-16">
        <h2 className="section-title mb-1">Uptiers and downtiers by year</h2>
        <p className="mb-4 text-sm text-fg-3">
          Realistic Battles BR changes per calendar year. 2020 starts in March, when tracking began.
        </p>
        <Tabs labels={labels} lazy>
          {byBranch.map((x) => (
            <UpDownChart key={x.branch} data={x.byYear} />
          ))}
        </Tabs>
      </section>

      <section id="top-br" className="scroll-mt-16">
        <h2 className="section-title mb-1">Top BR over time</h2>
        <p className="mb-4 text-sm text-fg-3">The highest Realistic Battles BR in each branch at each update.</p>
        <Tabs labels={labels} lazy>
          {byBranch.map((x) => (
            <TopBrChart key={x.branch} data={x.top} />
          ))}
        </Tabs>
      </section>
    </div>
  );
}

function MoverTable({ title, rows }: { title: string; rows: { d: UnitDetail; first: number; delta: number }[] }) {
  return (
    <div>
      <h3 className="mb-2 font-display text-sm font-semibold uppercase tracking-wide text-fg-3">{title}</h3>
      <table className="data-table w-full panel text-sm">
        <tbody className="divide-y divide-card-border">
          {rows.map(({ d, first, delta }) => (
            <tr key={d.id}>
              <td className="w-full px-3 py-1">
                <Link href={`/vehicle/${d.id}/`} className="flex items-center gap-2 font-display">
                  <Thumb id={d.id} image={d.image} />
                  <Flag nation={d.nation} labelled className="h-3" />
                  <span className="min-w-0 truncate">{d.name}</span>
                </Link>
              </td>
              <td className="whitespace-nowrap px-3 py-1.5 text-right font-display tabular">
                <span className="text-fg-3">{formatBr(first)}</span>
                <span className="text-fg-3"> → </span>
                <span className="text-fg">{formatBr(d.br.rb)}</span>
              </td>
              <td
                className={`whitespace-nowrap px-3 py-1.5 text-right font-display tabular ${delta > 0 ? "text-bad" : "text-good"}`}
              >
                <span className="inline-flex items-center gap-1">
                  <Arrow dir={delta > 0 ? "up" : "down"} />
                  {formatBrDelta(first, d.br.rb)}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** Tree vehicles ordered by how long ago their BR last changed (or since they were added). */
function longestUnchanged(details: UnitDetail[]) {
  const all = details
    .filter((d) => d.status === "tree" && !d.hidden && d.history?.length)
    .map((d) => {
      const h = d.history!;
      return { d, since: h[h.length - 1], first: h.length === 1 && !d.added };
    })
    // Oldest first; among equally old, the highest BR is the more surprising.
    .sort((a, b) => a.since.d.localeCompare(b.since.d) || b.d.br.rb - a.d.br.rb);
  return { rows: all.slice(0, 15), never: all.filter((x) => x.first).length };
}

type NationRow = {
  nation: string;
  vehicles: number;
  ups: number;
  downs: number;
  net: number;
};

/** Per nation: RB change events up and down, and their summed size in ranks. */
function nationBalance(details: UnitDetail[]): NationRow[] {
  const rows = new Map<string, NationRow>();
  for (const d of details) {
    const row = rows.get(d.nation) ?? {
      nation: d.nation,
      vehicles: 0,
      ups: 0,
      downs: 0,
      net: 0,
    };
    row.vehicles++;
    const h = d.history ?? [];
    for (let i = 1; i < h.length; i++) {
      const delta = h[i].rb - h[i - 1].rb;
      if (delta > 0) row.ups++;
      if (delta < 0) row.downs++;
      row.net += delta;
    }
    rows.set(d.nation, row);
  }
  return [...rows.values()].sort((a, b) => b.net / b.vehicles - a.net / a.vehicles);
}

function NationTable({ rows }: { rows: NationRow[] }) {
  const avg = (r: NationRow) => r.net / r.vehicles / 3;
  const max = Math.max(0.01, ...rows.map((r) => Math.abs(avg(r))));
  // Centre the bars only when there are moves both ways.
  const diverging = rows.some((r) => r.net < 0) && rows.some((r) => r.net > 0);
  const half = diverging ? 50 : 100;
  // Without both directions the baseline sits on the side the bars grow from.
  const base = diverging ? "left-1/2" : rows.every((r) => r.net <= 0) ? "right-0" : "left-0";
  return (
    <div className="overflow-x-auto panel">
      <table className="data-table w-full min-w-[560px] text-sm">
        <thead>
          <tr>
            <th className="px-3 py-2 font-semibold">Nation</th>
            <th className="px-3 py-2 text-right font-semibold">Vehicles</th>
            <th className="px-3 py-2 text-right font-semibold">Uptiers</th>
            <th className="px-3 py-2 text-right font-semibold">Downtiers</th>
            <th className="px-3 py-2 text-right font-semibold">Net BR</th>
            <th className="px-3 py-2 text-right font-semibold">Per vehicle</th>
            <th className="relative w-1/4 px-3 py-2 font-semibold">
              <span className="sr-only">Per vehicle, as a bar</span>
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-card-border">
          {rows.map((r) => (
            <tr key={r.nation}>
              <td className="px-3 py-1.5">
                <span className="inline-flex items-center gap-2 font-display">
                  <Flag nation={r.nation} className="h-3.5" />
                  {nationName(r.nation)}
                </span>
              </td>
              <td className="px-3 py-1.5 text-right tabular text-fg-2">{r.vehicles}</td>
              <td className="px-3 py-1.5 text-right tabular text-fg-2">{r.ups}</td>
              <td className="px-3 py-1.5 text-right tabular text-fg-2">{r.downs}</td>
              <td
                className={`whitespace-nowrap px-3 py-1.5 text-right font-display tabular ${r.net > 0 ? "text-bad" : r.net < 0 ? "text-good" : "text-fg-2"}`}
              >
                <span className="inline-flex items-center gap-1">
                  {r.net !== 0 && <Arrow dir={r.net > 0 ? "up" : "down"} />}
                  {r.net > 0 ? "+" : r.net < 0 ? "−" : ""}
                  {(Math.abs(r.net) / 3).toFixed(1)}
                </span>
              </td>
              <td className="px-3 py-1.5 text-right font-display tabular text-fg">
                {avg(r) > 0 ? "+" : avg(r) < 0 ? "−" : ""}
                {Math.abs(avg(r)).toFixed(2)}
              </td>
              <td className="px-3 py-1.5" aria-hidden>
                {/* Up to the right, down to the left of the baseline (centred when both occur). */}
                <span className="relative block h-2.5">
                  <span className={`absolute inset-y-[-3px] w-px bg-fg-3/50 ${base}`} />
                  <span
                    className={`absolute inset-y-0 ${
                      r.net >= 0
                        ? `${diverging ? "left-1/2" : "left-0"} rounded-r-[4px] bg-bad/80`
                        : `${diverging ? "right-1/2" : "right-0"} rounded-l-[4px] bg-good/80`
                    }`}
                    style={{ width: `${(Math.abs(avg(r)) / max) * half}%` }}
                  />
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** Highest RB BR among vehicles in the game at each version where it changed. */
function topBr(details: UnitDetail[], versions: string[], dates: string[]): TopBrPoint[] {
  const pos = new Map(versions.map((v, i) => [v, i]));
  const best = new Array<number>(versions.length).fill(0);
  for (const d of details) {
    const h = d.history ?? [];
    h.forEach((p, i) => {
      const from = pos.get(p.v) ?? 0;
      const to = i + 1 < h.length ? (pos.get(h[i + 1].v) ?? versions.length) : versions.length;
      for (let k = from; k < to; k++) best[k] = Math.max(best[k], p.rb);
    });
  }
  const out: TopBrPoint[] = [];
  best.forEach((rank, i) => {
    if (i === 0 || rank !== best[i - 1]) out.push({ t: Date.parse(dates[i]), v: versions[i], br: rankToBr(rank) });
  });
  const last = out[out.length - 1];
  const end = Date.parse(dates[dates.length - 1]);
  if (last && end > last.t) out.push({ ...last, t: end });
  return out;
}

function upDownByYear(versions: Version[], branch: Branch): UpDownRow[] {
  const years = new Map<string, UpDownRow>();
  for (const v of versions) {
    const year = v.d.slice(0, 4);
    const row = years.get(year) ?? { year, up: 0, down: 0 };
    row.up += v.byBranch[branch].up;
    row.down += v.byBranch[branch].down;
    years.set(year, row);
  }
  return [...years.values()];
}
