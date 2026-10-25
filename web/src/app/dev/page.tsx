import type { Metadata } from "next";
import Link from "next/link";
import { Arrow } from "@/components/Arrow";
import { MODES, MODE_LABEL, formatBr, formatBrDelta } from "@/lib/br";
import { BRANCH_NAME, BRANCHES } from "@/lib/branches";
import { getDev, getUnitMap } from "@/lib/data";
import { plural } from "@/lib/format";
import { nationName } from "@/lib/nations";

export const metadata: Metadata = {
  title: "Dev server preview",
  description: "Battle Rating changes on the War Thunder dev server that aren't live yet.",
};

export default function DevPage() {
  const dev = getDev();
  const units = getUnitMap();
  if (!dev) {
    return (
      <div className="max-w-2xl">
        <h1 className="text-4xl font-bold">Dev server preview</h1>
        <p className="mt-3 text-fg-2">
          There is no dev-server build in the datamine right now. Before a major update, Gaijin opens a dev server with
          the new version; while it is up, this page lists the BR changes and new vehicles it contains compared with the
          live game.
        </p>
        <p className="mt-3">
          <Link href="/updates/">See past updates →</Link>
        </p>
      </div>
    );
  }
  const changes = dev.changes ?? [];
  const added = Object.entries(dev.added ?? {});
  return (
    <div className="space-y-8">
      <header>
        <p className="font-display text-sm uppercase tracking-wide text-gold">Not live yet</p>
        <h1 className="text-4xl font-bold">Dev server {dev.v}</h1>
        <p className="mt-2 max-w-2xl text-fg-2">
          Compared with live update <span className="tabular">{dev.base}</span>, seen in the datamine on {dev.d}.
          Dev-server values often change again before release.
        </p>
      </header>
      {BRANCHES.map((b) => {
        const rows = changes.filter((c) => units.get(c.id)?.branch === b);
        if (!rows.length) return null;
        return (
          <section key={b}>
            <h2 className="section-title mb-2">
              {BRANCH_NAME[b]} <span className="text-fg-3">· {plural(rows.length, "BR change")}</span>
            </h2>
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
                  {rows.map((c) => (
                    <tr key={c.id}>
                      <td className="px-3 py-1.5">
                        <Link href={`/vehicle/${c.id}/`} className="font-display">
                          {units.get(c.id)?.name ?? c.id}
                        </Link>
                        <span className="ml-2 text-xs text-fg-3">{nationName(units.get(c.id)?.nation ?? "")}</span>
                      </td>
                      {MODES.map((m) => {
                        const a = c.before[m];
                        const z = c.after[m];
                        return (
                          <td key={m} className="px-3 py-1.5 text-right font-display tabular">
                            {a === z ? (
                              <span className="text-fg-3">{formatBr(z)}</span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5">
                                <span className="text-fg">{formatBr(z)}</span>
                                <span className={`inline-flex items-center gap-0.5 text-xs ${z > a ? "text-bad" : "text-good"}`}>
                                  <Arrow dir={z > a ? "up" : "down"} />
                                  {formatBrDelta(a, z)}
                                </span>
                              </span>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        );
      })}
      {added.length > 0 && (
        <section>
          <h2 className="section-title mb-2">New vehicles ({added.length})</h2>
          <ul className="grid gap-1 sm:grid-cols-2 lg:grid-cols-3">
            {added.map(([id, u]) => (
              <li key={id} className="flex justify-between gap-3 panel px-3 py-1.5 text-sm">
                <span className="font-display">{u.name}</span>
                <span className="text-fg-3">
                  {nationName(u.nation)} · <span className="tabular text-fg-2">{formatBr(u.br.rb)}</span>
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
