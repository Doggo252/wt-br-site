import type { Metadata } from "next";
import Link from "@/components/Link";
import { rowOutcome } from "@/components/OfficialChanges";
import { getAnnouncements, getPendingPlan } from "@/lib/data";
import { plural } from "@/lib/format";

export const metadata: Metadata = {
  title: "Gaijin's BR announcements",
  description:
    "Every official War Thunder Battle Rating change announcement since 2023, and how many planned changes went live as announced.",
};

const KIND: Record<string, { label: string; className: string }> = {
  planned: { label: "Planned", className: "border-gold/50 text-gold" },
  implemented: { label: "Implemented", className: "border-good/40 text-good" },
  other: { label: "Announcement", className: "border-[#3a4650] text-fg-2" },
};

export default function AnnouncementsPage() {
  const all = getAnnouncements();
  const pending = getPendingPlan();
  // Only announcements whose 45-day window has passed count towards the success rate.
  const settled = (a: (typeof all)[number]) =>
    a.kind === "planned" && (a.changes ?? []).length > 0 && !(a.changes ?? []).some((c) => rowOutcome(c) === "pending");
  const judged = all
    .filter(settled)
    .flatMap((a) => (a.changes ?? []).map(rowOutcome))
    .filter((o) => o !== null);
  const applied = judged.filter((o) => o === "applied").length;

  // Some same-day posts repeat another post's table word for word; say so. (A planned table
  // reappearing later as "implemented" is expected and already told apart by its kind.)
  const sameTableAs = new Map<number, string>();
  const firstWithTable = new Map<string, string>();
  for (const a of all) {
    if (!a.changes?.length) continue;
    const sig = JSON.stringify([a.date, a.changes.map((c) => [c.name, c.ab, c.rb, c.sb, c.grb])]);
    const first = firstWithTable.get(sig);
    if (first) sameTableAs.set(a.id, first);
    else firstWithTable.set(sig, a.title);
  }

  return (
    <div className="space-y-8">
      <header>
        <p className="eyebrow">From the official forum</p>
        <h1 className="mt-1 text-4xl font-bold">Gaijin&apos;s BR announcements</h1>
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
        <div className="callout-gold flex flex-wrap items-center justify-between gap-3 p-4">
          <Link href={`/announcements/${pending.a.id}/`} className="block no-underline hover:brightness-110">
            <span className="eyebrow">Coming soon</span>
            <span className="mt-1 block text-lg text-fg">{pending.a.title}</span>
            <span className="text-sm text-fg-2">
              {plural(pending.pending.length, "vehicle")} with BR changes not live yet · posted {pending.a.date}
            </span>
          </Link>
          <Link href="/lineup/?planned=1" className="btn">
            Plan lineups with these BRs →
          </Link>
        </div>
      )}

      <ul className="panel divide-y divide-[#262f35]">
        {all.map((a) => {
          const twin = sameTableAs.get(a.id);
          const rows = a.changes ?? [];
          const outs = settled(a) ? rows.map(rowOutcome).filter((o) => o !== null) : [];
          const ok = outs.filter((o) => o === "applied").length;
          const pendingRows = rows.filter((c) => rowOutcome(c) === "pending").length;
          return (
            <li key={a.id} className="flex flex-wrap items-center gap-x-4 gap-y-1 px-4 py-2.5 transition-colors hover:bg-white/[0.02]">
              <span className="w-24 text-sm tabular text-fg-3">{a.date}</span>
              <span
                className={`w-28 shrink-0 border px-1.5 py-px text-center font-display text-[11px] uppercase tracking-wider ${KIND[a.kind].className}`}
              >
                {KIND[a.kind].label}
              </span>
              <span className="min-w-0 flex-1">
                {a.unavailable || rows.length === 0 ? (
                  <a href={a.url} rel="noopener">
                    {a.title}
                  </a>
                ) : (
                  <Link href={`/announcements/${a.id}/`} className="text-fg hover:text-link">{a.title}</Link>
                )}
                {twin && <span className="block text-xs text-fg-3">Same table as “{twin}”</span>}
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
