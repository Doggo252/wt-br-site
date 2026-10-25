import Link from "@/components/Link";
import { Arrow } from "@/components/Arrow";
import { BranchIcon } from "@/components/BranchIcon";
import { Flag } from "@/components/Flag";
import { HomeWatchlist } from "@/components/HomeWatchlist";
import { SearchBox } from "@/components/SearchBox";
import { SinceLastVisit } from "@/components/SinceLastVisit";
import { UnitCard } from "@/components/UnitCard";
import { BRANCHES, BRANCH_NAME, branchHref, treeHref } from "@/lib/branches";
import {
  getDev,
  getIndex,
  getLatestBrUpdate,
  getPendingPlan,
  getUnitMap,
  getUpdate,
  getVersions,
  nationsOf,
} from "@/lib/data";
import { plural } from "@/lib/format";
import { nationName } from "@/lib/nations";

export default function Home() {
  const index = getIndex();
  const versions = getVersions();
  const latest = getLatestBrUpdate();
  const dev = getDev();
  const plan = getPendingPlan();
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

  // Hero art: the top tech tree vehicle of each branch.
  const showcase = BRANCHES.map(
    (b) =>
      index
        .filter((u) => u.branch === b && u.image && u.status === "tree" && !u.removedIn)
        .filter((u) => ({ ground: ["medium_tank", "heavy_tank"], air: ["fighter"], heli: [u.type] })[b].includes(u.type))
        .sort((a, z) => z.br.rb - a.br.rb || a.id.localeCompare(z.id))[0],
  ).filter(Boolean);

  return (
    <div className="space-y-12">
      <section className="relative left-1/2 -mt-8 w-screen -translate-x-1/2 overflow-hidden border-b border-[#232b31] sm:-mt-10">
        <div aria-hidden className="pointer-events-none absolute inset-0">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_80%_at_75%_40%,rgb(59_143_217/0.16),transparent_70%)]" />
          <div className="absolute inset-0 opacity-[0.07] [background-image:linear-gradient(rgb(255_255_255/0.5)_1px,transparent_1px),linear-gradient(90deg,rgb(255_255_255/0.5)_1px,transparent_1px)] [background-size:48px_48px] [mask-image:radial-gradient(ellipse_70%_70%_at_70%_50%,black,transparent)]" />
          {showcase.map((u, i) => (
            // eslint-disable-next-line @next/next/no-img-element -- static export
            <img
              key={u!.id}
              src={`/img/units/${u!.id}.webp`}
              alt=""
              className={`absolute hidden w-[38%] max-w-[560px] drop-shadow-[0_18px_24px_rgb(0_0_0/0.7)] md:block ${
                ["-right-[2%] top-[36%]", "right-[4%] top-[2%] w-[28%] opacity-85", "right-[27%] top-[58%] w-[20%] opacity-60"][i]
              }`}
            />
          ))}
          <div className="absolute inset-0 bg-[linear-gradient(90deg,var(--color-bg)_38%,rgb(17_20_26/0.6)_58%,transparent_85%)]" />
          <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-[var(--color-bg)] to-transparent" />
        </div>
        <div className="relative mx-auto max-w-6xl px-4 py-14 sm:py-20">
          <p className="eyebrow">War Thunder Battle Rating history</p>
          <h1 className="mt-2 max-w-2xl text-4xl font-bold leading-[1.05] sm:text-6xl">
            Every BR change,
            <br />
            <span className="text-gold">patch by patch.</span>
          </h1>
          <p className="mt-4 max-w-xl text-lg text-fg-2">
            Every tank, aircraft and helicopter since March 2020, read straight from the game files and rebuilt daily.
          </p>
          {/* Phones already have the header search. */}
          <SearchBox className="mt-6 hidden max-w-md sm:block" />
          <p className="mt-2 hidden text-xs text-fg-3 sm:block">
            Try <span className="font-display text-fg-2">germany 6.7</span> or{" "}
            <span className="font-display text-fg-2">uk 10.0</span> to list every vehicle at a Realistic BR. Press{" "}
            <kbd className="border border-card-border px-1 font-display">/</kbd> to search from any page.
          </p>
          <dl className="mt-8 grid max-w-xl grid-cols-3 gap-3">
            <Stat label="Vehicles" value={index.filter((u) => !u.removedIn).length.toLocaleString("en")} />
            <Stat label="BR updates" value={brUpdates.toLocaleString("en")} />
            <Stat label="BR changes" value={totalChanges.toLocaleString("en")} />
          </dl>
        </div>
      </section>

      {(dev || plan) && (
        <div className={`grid gap-3 ${dev && plan ? "md:grid-cols-2" : ""}`}>
          {plan && (
            <Callout
              href={`/announcements/${plan.a.id}/`}
              label="Planned by Gaijin"
              text={`${plural(plan.pending.length, "vehicle")} have BR changes announced on ${plan.a.date} that aren't live yet.`}
            />
          )}
          {dev && (
            <Callout
              href="/dev/"
              label="Dev server"
              text={`Update ${dev.v} is on the dev server with ${plural((dev.changes ?? []).length, "BR change")} and ${plural(Object.keys(dev.added ?? {}).length, "new vehicle")}.`}
            />
          )}
        </div>
      )}

      <SinceLastVisit recent={versions.slice(-40).map((v) => [v.v, v.changes, v.added])} />

      <HomeWatchlist />

      {latest && update && (
        <section className="panel p-4 sm:p-6">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="eyebrow">Latest BR update · {latest.d}</p>
              <h2 className="mt-1 font-display text-3xl font-bold">
                <Link href={`/updates/${latest.v}/`} className="text-fg hover:text-link">
                  Update {latest.v}
                </Link>
              </h2>
            </div>
            <div className="flex gap-2 font-display">
              <Pill className="text-fg">{plural(latest.changes, "change")}</Pill>
              <Pill className="text-bad">
                <Arrow dir="up" /> {latest.up} up
              </Pill>
              <Pill className="text-good">
                <Arrow dir="down" /> {latest.down} down
              </Pill>
            </div>
          </div>
          {movers.length > 0 && (
            <>
              <h3 className="mb-3 mt-6 font-display text-xs font-semibold uppercase tracking-[0.12em] text-fg-3">
                Biggest Realistic Battles moves
              </h3>
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
                        type={u.type}
                      />
                    </li>
                  );
                })}
              </ul>
            </>
          )}
          <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2">
            <Link href={`/updates/${latest.v}/`} className="btn text-fg">
              See all {latest.changes} changes →
            </Link>
            {smaller > 0 && (
              <span className="text-sm text-fg-3">
                Plus {plural(smaller, "smaller change")} in <Link href="/updates/">later patches</Link>.
              </span>
            )}
          </div>
        </section>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        <section className="panel p-4 sm:p-5">
          <h2 className="section-title mb-3">Recent updates</h2>
          <ul className="divide-y divide-[#262f35]">
            {recent.map((v) => (
              <li key={v.v}>
                <Link
                  href={`/updates/${v.v}/`}
                  className="-mx-2 flex items-baseline justify-between gap-4 px-2 py-2 transition-colors hover:bg-white/[0.03]"
                >
                  <span className="font-display font-semibold tabular text-fg">{v.v}</span>
                  <span className="flex-1 text-sm text-fg-2">
                    {v.changes > 0 ? plural(v.changes, "BR change") : `${plural(v.added, "vehicle")} added`}
                  </span>
                  <span className="text-sm tabular text-fg-3">{v.d}</span>
                </Link>
              </li>
            ))}
          </ul>
          <Link href="/updates/" className="mt-3 inline-block text-sm">
            All updates →
          </Link>
        </section>
        <section className="panel p-4 sm:p-5">
          <h2 className="section-title mb-3">Tech trees</h2>
          <div className="space-y-4">
            {BRANCHES.map((b) => (
              <div key={b}>
                <Link
                  href={branchHref(b)}
                  className="mb-2 inline-flex items-center gap-2 font-display text-xs font-semibold uppercase tracking-[0.12em] text-fg-3 hover:text-fg"
                >
                  <BranchIcon branch={b} />
                  {BRANCH_NAME[b]}
                </Link>
                <ul className="flex flex-wrap gap-1.5">
                  {nationsOf(b).map((n) => (
                    <li key={n}>
                      <Link
                        href={treeHref(b, n)}
                        title={`${nationName(n)} ${BRANCH_NAME[b].toLowerCase()}`}
                        className="flex items-center gap-1.5 border border-[#2a333b] bg-[#181e23] px-2 py-1 font-display text-sm text-fg-2 transition-colors hover:border-[#3d4a54] hover:text-fg"
                      >
                        <Flag nation={n} className="h-3" />
                        {nationName(n)}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <p className="mt-4 text-sm text-fg-3">Every tree has a time machine back to March 2020.</p>
        </section>
      </div>
    </div>
  );
}

function Pill({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1 border border-[#2f3a42] bg-black/25 px-2.5 py-1 text-sm font-semibold tabular ${className}`}
    >
      {children}
    </span>
  );
}

function Callout({ href, label, text }: { href: string; label: string; text: string }) {
  return (
    <Link href={href} className="callout-gold group flex items-center gap-4 px-4 py-3 transition hover:brightness-110">
      <span className="grid h-9 w-9 shrink-0 place-items-center border border-gold/40 text-gold" aria-hidden>
        <svg viewBox="0 0 16 16" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.6">
          <circle cx="8" cy="8" r="6.2" />
          <path d="M8 4.5V8l2.4 1.6" />
        </svg>
      </span>
      <span>
        <span className="eyebrow block">{label}</span>
        <span className="text-fg">{text}</span>
      </span>
      <span className="ml-auto text-gold transition group-hover:translate-x-0.5" aria-hidden>
        →
      </span>
    </Link>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-[#2a333b] bg-black/25 px-3 py-2 backdrop-blur-sm">
      <dt className="font-display text-[11px] font-semibold uppercase tracking-[0.12em] text-fg-3">{label}</dt>
      <dd className="font-display text-2xl font-bold tabular text-fg sm:text-3xl">{value}</dd>
    </div>
  );
}
