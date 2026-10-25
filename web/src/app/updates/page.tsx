import type { Metadata } from "next";
import Link from "next/link";
import { Arrow } from "@/components/Arrow";
import { BRANCHES, BRANCH_SHORT } from "@/lib/branches";
import { getUnitMap, getUpdate, getVersions, type Version } from "@/lib/data";

export const metadata: Metadata = {
  title: "Updates",
  description: "Every War Thunder update since March 2020 that changed Battle Ratings, for ground, air and helicopters.",
};

/** Up to five changed (or added) vehicles with images, biggest RB moves first. */
function preview(version: string): string[] {
  const u = getUpdate(version);
  const units = getUnitMap();
  const moved = [...u.changes]
    .sort((a, b) => Math.abs(b.after.rb - b.before.rb) - Math.abs(a.after.rb - a.before.rb))
    .map((c) => c.id);
  return [...moved, ...u.added].filter((id) => units.get(id)?.image).slice(0, 5);
}

export default function UpdatesPage() {
  const versions = getVersions()
    .slice(1) // the first snapshot is the baseline, not an update
    .filter((v) => v.changes > 0 || v.added > 0 || v.removed > 0)
    .reverse();
  const byMajor = new Map<string, Version[]>();
  for (const v of versions) {
    const list = byMajor.get(v.major) ?? [];
    list.push(v);
    byMajor.set(v.major, list);
  }

  return (
    <div>
      <p className="eyebrow">Since March 2020</p>
      <h1 className="mt-1 text-4xl font-bold">Updates</h1>
      <p className="mt-2 max-w-2xl text-fg-2">
        Every game version since March 2020 that changed a Battle Rating, or added or removed a vehicle. Counts are
        Realistic Battles uptiers and downtiers. Dates are when the version appeared in the datamine.
      </p>
      <div className="mt-8 space-y-8">
        {[...byMajor.entries()].map(([major, list]) => (
          <section key={major} aria-labelledby={`m-${major}`}>
            <h2 id={`m-${major}`} className="section-title mb-3">
              Update {major}
            </h2>
            <ul className="divide-y divide-card-border panel">
              {list.map((v) => (
                <li key={v.v}>
                  <Link
                    href={`/updates/${v.v}/`}
                    className="flex flex-wrap items-center gap-x-6 gap-y-1 px-3 py-2 transition-colors hover:bg-white/[0.03]"
                  >
                    <span className="w-28 font-display font-semibold tabular text-fg">{v.v}</span>
                    <span className="w-24 text-sm tabular text-fg-3">{v.d}</span>
                    <span className="flex flex-wrap gap-x-5 gap-y-1 text-sm">
                      {BRANCHES.filter((b) => {
                        const c = v.byBranch[b];
                        return c.changes || c.added || c.removed;
                      }).map((b) => {
                        const c = v.byBranch[b];
                        return (
                          <span key={b} className="inline-flex flex-wrap items-center gap-x-2">
                            <span className="text-fg-3">{BRANCH_SHORT[b]}</span>
                            {c.up > 0 && (
                              <span className="inline-flex items-center gap-0.5 text-bad">
                                <Arrow dir="up" />
                                {c.up}
                              </span>
                            )}
                            {c.down > 0 && (
                              <span className="inline-flex items-center gap-0.5 text-good">
                                <Arrow dir="down" />
                                {c.down}
                              </span>
                            )}
                            {c.changes - c.up - c.down > 0 && (
                              <span className="text-fg-2" title="Changed only in Arcade or Simulator">
                                {c.changes - c.up - c.down} AB/SB
                              </span>
                            )}
                            {c.added > 0 && <span className="text-fg-2">+{c.added} new</span>}
                            {c.removed > 0 && <span className="text-fg-3">−{c.removed} removed</span>}
                          </span>
                        );
                      })}
                    </span>
                    <span className="ml-auto hidden items-center -space-x-3 md:flex" aria-hidden>
                      {preview(v.v).map((id) => (
                        // eslint-disable-next-line @next/next/no-img-element -- static export
                        <img
                          key={id}
                          src={`/img/units/${id}.webp`}
                          alt=""
                          loading="lazy"
                          className="h-7 w-14 object-contain drop-shadow-[0_2px_3px_rgb(0_0_0/0.7)]"
                        />
                      ))}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}
