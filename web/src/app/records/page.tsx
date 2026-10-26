import type { Metadata } from "next";
import { RANKING_TABS, SectionTabs } from "@/components/SectionTabs";
import { RecordsTable } from "@/components/RecordsTable";
import Link from "@/components/Link";
import { Flag } from "@/components/Flag";
import { getRecords, getUnitMap, nationsOf } from "@/lib/data";
import { nationName } from "@/lib/nations";

export const metadata: Metadata = {
  title: "RB kill records",
  description: "Most kills in one life for every War Thunder ground vehicle in Realistic Battles.",
};

const SHEET_URL = "https://docs.google.com/spreadsheets/d/1MJEjscVDZ1hgU7fHp6dB0levgh6rnpXwOlI7fTBXly0";

export default function RecordsPage() {
  const units = getUnitMap();
  const rows = getRecords().map((r) => ({ ...r, image: r.id ? units.get(r.id)?.image : false }));
  const withKills = rows.filter((r) => r.kills);
  const podium = [...withKills].sort((a, b) => (b.kills ?? 0) - (a.kills ?? 0)).slice(0, 3);
  const players = topPlayers(withKills);
  const byNation = nationsOf("ground")
    .map((n) => {
      const list = withKills.filter((r) => r.nation === n);
      const avg = list.reduce((sum, r) => sum + (r.kills ?? 0), 0) / Math.max(1, list.length);
      return { n, count: list.length, avg, best: Math.max(0, ...list.map((r) => r.kills ?? 0)) };
    })
    .sort((a, b) => b.avg - a.avg);
  return (
    <div className="space-y-6">
      <header>
        <p className="eyebrow">Ground Realistic Battles</p>
        <h1 className="mt-1 text-4xl font-bold">Kill records</h1>
        <p className="mt-2 max-w-2xl text-fg-2">
          The most ground kills in a single life, per vehicle, in Realistic Battles. {withKills.length} records across{" "}
          {rows.length} vehicles.
        </p>
        <p className="mt-2 max-w-2xl text-sm text-fg-3">
          Records are collected and verified by the community{" "}
          <a href={SHEET_URL} rel="noopener">
            Ground RB Records sheet
          </a>
          . Submit new records there, not here. Uptier only links each record to its vehicle.
        </p>
      </header>
      <SectionTabs label="Rankings" tabs={RANKING_TABS} current="/records/" />
      <ol className="grid gap-3 sm:grid-cols-3">
        {podium.map((r, i) => (
          <li key={r.id ?? r.name}>
            <Link
              href={r.id ? `/vehicle/${r.id}/` : "#"}
              className="panel group relative block overflow-hidden p-4 transition hover:-translate-y-px"
            >
              {r.id && r.image && (
                // eslint-disable-next-line @next/next/no-img-element -- static export
                <img
                  src={`/img/units/${r.id}.webp`}
                  alt=""
                  className="pointer-events-none absolute -right-4 bottom-0 h-[85%] w-auto opacity-60 drop-shadow-[0_8px_10px_rgb(0_0_0/0.6)] transition [mask-image:linear-gradient(90deg,transparent,black_40%)] group-hover:opacity-80"
                />
              )}
              <div className="relative">
                <span className="eyebrow">#{i + 1}</span>
                <p className="font-display text-5xl font-bold leading-none tabular text-gold">{r.kills}</p>
                <p className="mt-1 text-xs uppercase tracking-wider text-fg-3">kills in one life</p>
                <p className="mt-3 flex items-center gap-1.5 font-display text-lg text-fg">
                  <Flag nation={r.nation} labelled className="h-3.5" />
                  {r.name}
                </p>
                <p className="text-sm text-fg-2">
                  {r.player} · BR {r.br} · {r.patch}
                </p>
              </div>
            </Link>
          </li>
        ))}
      </ol>
      <div className="grid gap-6 md:grid-cols-2">
        <section className="panel p-4">
          <h2 className="section-title mb-3">Most records held</h2>
          <table className="data-table w-full text-sm">
            <thead>
              <tr>
                <th className="px-3 py-2 font-semibold">Player</th>
                <th className="px-3 py-2 text-right font-semibold">Records</th>
                <th className="px-3 py-2 text-right font-semibold">Best</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-card-border">
              {players.map((p) => (
                <tr key={p.player}>
                  <td className="px-3 py-1.5 text-fg">{p.player}</td>
                  <td className="px-3 py-1.5 text-right font-display tabular">{p.count}</td>
                  <td className="px-3 py-1.5 text-right font-display tabular text-gold">{p.best}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
        <section className="panel p-4">
          <h2 className="section-title mb-3">By nation</h2>
          <table className="data-table w-full text-sm">
            <thead>
              <tr>
                <th className="px-3 py-2 font-semibold">Nation</th>
                <th className="px-3 py-2 text-right font-semibold">Records</th>
                <th className="px-3 py-2 text-right font-semibold">Average</th>
                <th className="px-3 py-2 text-right font-semibold">Best</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-card-border">
              {byNation.map((x) => (
                <tr key={x.n}>
                  <td className="px-3 py-1.5">
                    <span className="inline-flex items-center gap-2 text-fg">
                      <Flag nation={x.n} className="h-3" />
                      {nationName(x.n)}
                    </span>
                  </td>
                  <td className="px-3 py-1.5 text-right font-display tabular">{x.count}</td>
                  <td className="px-3 py-1.5 text-right font-display tabular">{x.avg.toFixed(1)}</td>
                  <td className="px-3 py-1.5 text-right font-display tabular text-gold">{x.best}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      </div>
      <RecordsTable rows={rows} nations={nationsOf("ground")} />
    </div>
  );
}

/** Players holding the most vehicle records (names compared case-insensitively). */
function topPlayers(rows: { player?: string | null; kills?: number | null }[], limit = 10) {
  const by = new Map<string, { player: string; count: number; best: number }>();
  for (const r of rows) {
    const name = r.player?.trim();
    if (!name) continue;
    const key = name.toLowerCase();
    const p = by.get(key) ?? { player: name, count: 0, best: 0 };
    p.count++;
    p.best = Math.max(p.best, r.kills ?? 0);
    by.set(key, p);
  }
  return [...by.values()].sort((a, b) => b.count - a.count || b.best - a.best).slice(0, limit);
}
