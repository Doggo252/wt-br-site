import type { Metadata } from "next";
import { RecordsTable } from "@/components/RecordsTable";
import Link from "next/link";
import { Flag } from "@/components/Flag";
import { getRecords, getUnitMap, nationsOf } from "@/lib/data";

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
                  <Flag nation={r.nation} className="h-3.5" />
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
      <RecordsTable rows={rows} nations={nationsOf("ground")} />
    </div>
  );
}
