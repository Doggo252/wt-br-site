import type { Metadata } from "next";
import Link from "next/link";
import { Arrow } from "@/components/Arrow";
import { Tabs } from "@/components/Tabs";
import { ThermalFinder, type ThermalUnit } from "@/components/ThermalFinder";
import { BRANCHES, BRANCH_SHORT, type Branch } from "@/lib/branches";
import { TopBrChart, type TopBrPoint } from "@/components/TopBrChart";
import { UpDownChart, type UpDownRow } from "@/components/UpDownChart";
import { formatBr, formatBrDelta, rankToBr } from "@/lib/br";
import { getIndex, getUnit, getVersions, nationsOf, type Version } from "@/lib/data";
import type { UnitDetail } from "@/lib/data.gen";
import { nationName } from "@/lib/nations";

export const metadata: Metadata = {
  title: "Explore",
  description:
    "War Thunder vehicles and aircraft with the biggest Battle Rating moves since 2020, the most-changed vehicles, a thermal sight finder and BR creep over time.",
};

export default function ExplorePage() {
  const versions = getVersions();
  const live = getIndex().filter((u) => !u.removedIn);
  const details = live.map((u) => getUnit(u.id));

  const byBranch = BRANCHES.map((b) => {
    const ds = details.filter((d) => d.branch === b);
    // Net RB change since each vehicle's first recorded BR.
    const net = ds
      .filter((d) => d.history && d.history.length > 1)
      .map((d) => ({ d, first: d.history![0].rb, delta: d.br.rb - d.history![0].rb }))
      .filter((x) => x.delta !== 0);
    return {
      branch: b,
      ups: [...net].sort((a, b) => b.delta - a.delta || a.d.name.localeCompare(b.d.name)).slice(0, 15),
      downs: [...net].sort((a, b) => a.delta - b.delta || a.d.name.localeCompare(b.d.name)).slice(0, 15),
      most: [...ds].sort((a, b) => (b.changes ?? 0) - (a.changes ?? 0)).slice(0, 15),
      top: topBr(ds, versions.map((v) => v.v), versions.map((v) => v.d)),
      byYear: upDownByYear(versions, b),
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
        <h1 className="text-3xl font-bold">Explore</h1>
        <p className="mt-2 max-w-2xl text-fg-2">
          Realistic Battles BR moves since March 2020 (or since a vehicle was added), and tools for finding vehicles.
        </p>
        <nav className="mt-3 flex flex-wrap gap-x-4 text-sm">
          <a href="#movers">Biggest moves</a>
          <a href="#most-changed">Most changed</a>
          <a href="#thermals">Thermal finder</a>
          <a href="#by-year">By year</a>
          <a href="#top-br">Top BR over time</a>
          <Link href="/compare/">Compare vehicles</Link>
        </nav>
      </header>

      <section id="movers" className="scroll-mt-16">
        <h2 className="mb-1 text-xl font-semibold">Biggest moves</h2>
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
        <h2 className="mb-1 text-xl font-semibold">Most changed</h2>
        <p className="mb-4 text-sm text-fg-3">Updates that changed a vehicle&apos;s BR in any mode.</p>
        <Tabs labels={labels}>
          {byBranch.map((x) => (
            <ol key={x.branch} className="divide-y divide-card-border border border-card-border bg-panel">
              {x.most.map((d, i) => (
                <li key={d.id} className="flex items-baseline gap-3 px-3 py-1.5 text-sm">
                  <span className="w-6 text-right tabular text-fg-3">{i + 1}</span>
                  <Link href={`/vehicle/${d.id}/`} className="min-w-0 flex-1 truncate font-display">
                    {d.name}
                  </Link>
                  <span className="text-fg-3">{nationName(d.nation)}</span>
                  <span className="w-24 text-right tabular text-fg">{d.changes} changes</span>
                </li>
              ))}
            </ol>
          ))}
        </Tabs>
      </section>

      <section id="thermals" className="scroll-mt-16">
        <h2 className="mb-1 text-xl font-semibold">Thermal finder</h2>
        <p className="mb-4 text-sm text-fg-3">
          Best thermal sight per crew position, including ones that need a modification. Sorted from the lowest BR.
        </p>
        <ThermalFinder units={thermal} nations={nationsOf("ground")} />
      </section>

      <section id="by-year" className="scroll-mt-16">
        <h2 className="mb-1 text-xl font-semibold">Uptiers and downtiers by year</h2>
        <p className="mb-4 text-sm text-fg-3">
          Realistic Battles BR changes per calendar year. 2020 starts in March, when tracking began.
        </p>
        <Tabs labels={labels}>
          {byBranch.map((x) => (
            <UpDownChart key={x.branch} data={x.byYear} />
          ))}
        </Tabs>
      </section>

      <section id="top-br" className="scroll-mt-16">
        <h2 className="mb-1 text-xl font-semibold">Top BR over time</h2>
        <p className="mb-4 text-sm text-fg-3">The highest Realistic Battles BR in each branch at each update.</p>
        <Tabs labels={labels}>
          {byBranch.map((x) => (
            <TopBrChart key={x.branch} data={x.top} />
          ))}
        </Tabs>
      </section>
    </div>
  );
}

function MoverTable({
  title,
  rows,
}: {
  title: string;
  rows: { d: UnitDetail; first: number; delta: number }[];
}) {
  return (
    <div>
      <h3 className="mb-2 font-display text-sm font-semibold uppercase tracking-wide text-fg-3">{title}</h3>
      <table className="w-full border border-card-border bg-panel text-sm">
        <tbody className="divide-y divide-card-border">
          {rows.map(({ d, first, delta }) => (
            <tr key={d.id}>
              <td className="w-full px-3 py-1.5">
                <Link href={`/vehicle/${d.id}/`} className="font-display">
                  {d.name}
                </Link>
                <span className="block text-xs text-fg-3">{nationName(d.nation)}</span>
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
