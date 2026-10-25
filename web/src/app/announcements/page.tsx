import type { Metadata } from "next";
import Link from "next/link";
import { rowOutcome } from "@/components/OfficialChanges";
import { getAnnouncements, getPendingPlan } from "@/lib/data";
import { plural } from "@/lib/format";

export const metadata: Metadata = {
  title: "Gaijin's BR announcements",
  description:
    "Every official War Thunder Battle Rating change announcement since 2023, and how many planned changes went live as announced.",
};

const KIND: Record<string, string> = { planned: "Planned", implemented: "Implemented", other: "Announcement" };

export default function AnnouncementsPage() {
  const all = getAnnouncements();
  const pending = getPendingPlan();
  // Only announcements whose 45-day window has passed count towards the success rate.
  const settled = (a: (typeof all)[number]) =>
    a.kind === "planned" && (a.changes ?? []).length > 0 && !(a.changes ?? []).some((c) => rowOutcome(c) === "pending");
  const judged = all.filter(settled).flatMap((a) => (a.changes ?? []).map(rowOutcome));
  const applied = judged.filter((o) => o === "applied").length;

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-4xl font-bold">Gaijin&apos;s BR announcements</h1>
        <p className="mt-2 max-w-2xl text-fg-2">
          Official Battle Rating change tables posted on the War Thunder forum. Planned changes are checked against what
          the game files actually did in the 45 days after the post.
        </p>
        {judged.length > 0 && (
          <p className="mt-3 font-display text-lg">
            <span className="text-gold">{Math.round((applied / judged.length) * 100)}%</span> of{" "}
            {plural(judged.length, "planned change")} went live as announced.
          </p>
        )}
      </header>

      {pending && (
        <Link
          href={`/announcements/${pending.a.id}/`}
          className="block border border-card-premium-border bg-card-premium-bg p-4 no-underline hover:brightness-110"
        >
          <span className="font-display text-sm uppercase tracking-wide text-gold">Coming soon</span>
          <span className="mt-1 block text-lg text-fg">{pending.a.title}</span>
          <span className="text-sm text-fg-2">
            {plural(pending.pending.length, "vehicle")} with BR changes not live yet · posted {pending.a.date}
          </span>
        </Link>
      )}

      <ul className="divide-y divide-card-border panel">
        {all.map((a) => {
          const rows = a.changes ?? [];
          const outs = settled(a) ? rows.map(rowOutcome) : [];
          const ok = outs.filter((o) => o === "applied").length;
          const pendingRows = rows.filter((c) => rowOutcome(c) === "pending").length;
          return (
            <li key={a.id} className="flex flex-wrap items-baseline gap-x-4 gap-y-1 px-3 py-2">
              <span className="w-24 text-sm tabular text-fg-3">{a.date}</span>
              <span className="w-24 text-xs uppercase tracking-wide text-fg-3">{KIND[a.kind]}</span>
              <span className="min-w-0 flex-1">
                {a.unavailable || rows.length === 0 ? (
                  <a href={a.url} rel="noopener">
                    {a.title}
                  </a>
                ) : (
                  <Link href={`/announcements/${a.id}/`}>{a.title}</Link>
                )}
              </span>
              <span className="text-sm text-fg-2">
                {a.unavailable
                  ? "Table no longer published"
                  : rows.length === 0
                    ? "Naval only"
                    : `${plural(rows.length, "vehicle")}${
                        pendingRows
                          ? ` · ${pendingRows} not live yet`
                          : outs.length
                            ? ` · ${Math.round((ok / outs.length) * 100)}% as announced`
                            : ""
                      }`}
              </span>
            </li>
          );
        })}
      </ul>
      <p className="text-xs text-fg-3">
        Source: forum posts tagged{" "}
        <a href="https://forum.warthunder.com/tag/br-changes" rel="noopener">
          br-changes
        </a>
        . Naval tables are not included.
      </p>
    </div>
  );
}
