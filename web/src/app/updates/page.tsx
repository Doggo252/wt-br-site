import type { Metadata } from "next";
import Link from "next/link";
import { Arrow } from "@/components/Arrow";
import { getVersions, type Version } from "@/lib/data";

export const metadata: Metadata = {
  title: "Updates",
  description: "Every War Thunder update since March 2020 that changed ground vehicle Battle Ratings.",
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
        Every game version since March 2020 that changed a ground vehicle&apos;s Battle Rating, or added or removed
        one. Counts are Realistic Battles uptiers and downtiers. Dates are when the version appeared in the datamine.
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
                    <span className="flex flex-wrap gap-x-4 text-sm">
                      {v.up > 0 && (
                        <span className="inline-flex items-center gap-1 text-bad">
                          <Arrow dir="up" /> {v.up} up
                        </span>
                      )}
                      {v.down > 0 && (
                        <span className="inline-flex items-center gap-1 text-good">
                          <Arrow dir="down" /> {v.down} down
                        </span>
                      )}
                      {v.changes - v.up - v.down > 0 && (
                        <span className="text-fg-2">{v.changes - v.up - v.down} AB/SB only</span>
                      )}
                      {v.added > 0 && <span className="text-fg-2">+{v.added} added</span>}
                      {v.removed > 0 && <span className="text-fg-3">{v.removed} removed</span>}
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
