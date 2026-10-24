import Link from "next/link";
import { Arrow } from "@/components/Arrow";
import { SearchBox } from "@/components/SearchBox";
import { UnitCard } from "@/components/UnitCard";
import { getIndex, getLatestBrUpdate, getMeta, getUnitMap, getUpdate, getVersions } from "@/lib/data";
import { nationName } from "@/lib/nations";

export default function Home() {
  const meta = getMeta();
  const index = getIndex();
  const versions = getVersions();
  const latest = getLatestBrUpdate();
  const update = latest ? getUpdate(latest.v) : null;
  const units = getUnitMap();

  const movers = update
    ? [...update.changes]
        .filter((c) => c.after.rb !== c.before.rb)
        .sort((a, b) => Math.abs(b.after.rb - b.before.rb) - Math.abs(a.after.rb - a.before.rb) || a.after.rb - b.after.rb)
        .slice(0, 12)
    : [];
  const latestIdx = latest ? versions.findIndex((v) => v.v === latest.v) : -1;
  const smaller = latestIdx >= 0 ? versions.slice(latestIdx + 1).reduce((n, v) => n + v.changes, 0) : 0;
  const totalChanges = versions.reduce((n, v) => n + v.changes, 0);
  const brUpdates = versions.filter((v) => v.changes > 0).length;
  const recent = [...versions]
    .slice(1)
    .reverse()
    .filter((v) => v.changes > 0 || v.added > 0)
    .slice(0, 6);

  return (
    <div className="space-y-12">
      <section className="max-w-3xl">
        <h1 className="text-4xl font-bold sm:text-5xl">Every BR change, patch by patch.</h1>
        <p className="mt-3 text-lg text-fg-2">
          The Battle Rating history of every War Thunder ground vehicle since March 2020, straight from the game files.
        </p>
        <SearchBox className="mt-5 max-w-md" />
        <dl className="mt-6 flex flex-wrap gap-x-10 gap-y-3">
          <Stat label="Vehicles tracked" value={index.filter((u) => !u.removedIn).length.toLocaleString("en")} />
          <Stat label="Updates with BR changes" value={brUpdates.toLocaleString("en")} />
          <Stat label="BR changes recorded" value={totalChanges.toLocaleString("en")} />
        </dl>
      </section>

      {latest && update && (
        <section className="border border-card-border bg-panel p-4 sm:p-6">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="text-2xl font-semibold">
              Latest BR update: <Link href={`/updates/${latest.v}/`}>{latest.v}</Link>
            </h2>
            <span className="text-sm tabular text-fg-3">{latest.d}</span>
          </div>
          <p className="mt-1 text-fg-2">
            {latest.changes} ground vehicle{latest.changes === 1 ? "" : "s"} changed.{" "}
            <span className="inline-flex items-center gap-1 text-bad">
              <Arrow dir="up" /> {latest.up} up
            </span>
            ,{" "}
            <span className="inline-flex items-center gap-1 text-good">
              <Arrow dir="down" /> {latest.down} down
            </span>{" "}
            in Realistic Battles.
          </p>
          {movers.length > 0 && (
            <>
              <h3 className="mb-3 mt-5 text-sm font-semibold uppercase tracking-wide text-fg-3">Biggest RB moves</h3>
              <ul className="grid grid-cols-[repeat(auto-fill,minmax(150px,1fr))] gap-3">
                {movers.map((c) => {
                  const u = units.get(c.id);
                  if (!u) return null;
                  return (
                    <li key={c.id}>
                      <UnitCard
                        name={u.name}
                        rank={c.after.rb}
                        previousRank={c.before.rb}
                        status={u.status}
                        image={u.image ? `/img/units/${c.id}.webp` : undefined}
                        href={`/vehicle/${c.id}/`}
                      />
                    </li>
                  );
                })}
              </ul>
            </>
          )}
          <p className="mt-4">
            <Link href={`/updates/${latest.v}/`}>See all {latest.changes} changes →</Link>
            {smaller > 0 && (
              <span className="ml-3 text-sm text-fg-3">
                {smaller} smaller BR change{smaller === 1 ? "" : "s"} since, in{" "}
                <Link href="/updates/">later patches</Link>.
              </span>
            )}
          </p>
        </section>
      )}

      <div className="grid gap-10 md:grid-cols-2">
        <section>
          <h2 className="mb-3 text-xl font-semibold">Recent updates</h2>
          <ul className="divide-y divide-card-border border border-card-border bg-panel">
            {recent.map((v) => (
              <li key={v.v}>
                <Link
                  href={`/updates/${v.v}/`}
                  className="flex items-baseline justify-between gap-4 px-3 py-2 no-underline hover:bg-header"
                >
                  <span className="font-display tabular text-link">{v.v}</span>
                  <span className="text-sm text-fg-2">
                    {v.changes > 0 ? `${v.changes} BR changes` : `${v.added} added`}
                  </span>
                  <span className="text-sm tabular text-fg-3">{v.d}</span>
                </Link>
              </li>
            ))}
          </ul>
          <p className="mt-2 text-sm">
            <Link href="/updates/">All updates →</Link>
          </p>
        </section>
        <section>
          <h2 className="mb-3 text-xl font-semibold">Tech trees</h2>
          <ul className="grid grid-cols-2 gap-2">
            {meta.nations.map((n) => (
              <li key={n}>
                <Link
                  href={`/ground/${n}/`}
                  className="block border border-card-border bg-card-bg px-3 py-2 font-display text-fg no-underline hover:brightness-125"
                >
                  {nationName(n)}
                </Link>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-sm text-fg-3">
            Each tree has a time machine: rewind it to any update since 2020.
          </p>
        </section>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wide text-fg-3">{label}</dt>
      <dd className="font-display text-2xl font-semibold tabular">{value}</dd>
    </div>
  );
}
