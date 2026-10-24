import type { Metadata } from "next";
import Link from "next/link";
import { Arrow } from "@/components/Arrow";
import { BRANCHES, BRANCH_SHORT } from "@/lib/branches";
import { getVersions, type Version } from "@/lib/data";

export const metadata: Metadata = {
  title: "Updates",
  description: "Every War Thunder update since March 2020 that changed Battle Ratings, for ground, air and helicopters.",
};

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
      <h1 className="text-3xl font-bold">Updates</h1>
      <p className="mt-2 max-w-2xl text-fg-2">
        Every game version since March 2020 that changed a Battle Rating, or added or removed a vehicle. Counts are
        Realistic Battles uptiers and downtiers. Dates are when the version appeared in the datamine.
      </p>
      <div className="mt-8 space-y-8">
        {[...byMajor.entries()].map(([major, list]) => (
          <section key={major} aria-labelledby={`m-${major}`}>
            <h2 id={`m-${major}`} className="mb-2 font-display text-lg font-semibold text-fg-2">
              Update {major}
            </h2>
            <ul className="divide-y divide-card-border border border-card-border bg-panel">
              {list.map((v) => (
                <li key={v.v}>
                  <Link
                    href={`/updates/${v.v}/`}
                    className="flex flex-wrap items-baseline gap-x-6 gap-y-1 px-3 py-2 no-underline hover:bg-header"
                  >
                    <span className="w-28 font-display tabular text-link">{v.v}</span>
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
