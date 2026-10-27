import type { Metadata } from "next";
import { CalendarClock } from "lucide-react";
import Link from "@/components/Link";
import { getMeta, getPatchNotes } from "@/lib/data";

export const metadata: Metadata = {
  title: "Update calendar",
  description:
    "Every named War Thunder major update since 2016 with its release date, the gaps between them, and when the next one is likely.",
};

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const DAY = 86_400_000;
const RECENT = 8;

const fmtDate = (t: number) =>
  new Date(t).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });

/** Named major updates from changelog titles: War Thunder "Sky Odyssey" - Changelog. */
function majors() {
  const out: { id: number; date: string; t: number; name: string }[] = [];
  for (const n of getPatchNotes()) {
    const m = n.title.match(/[“"«]([^”"»]+)[”"»]/);
    if (!m || !/changelog|major update/i.test(n.title) || /dev server|test server|preview/i.test(n.title)) continue;
    out.push({ id: n.id, date: n.date, t: Date.parse(n.date + "T00:00:00Z"), name: m[1] });
  }
  return out.sort((a, b) => a.t - b.t);
}

export default function UpdateCalendarPage() {
  const list = majors();
  const gaps = list.slice(1).map((u, i) => (u.t - list[i].t) / DAY);
  const recent = gaps.slice(-RECENT);
  const mean = recent.reduce((a, b) => a + b, 0) / Math.max(1, recent.length);
  const sd = Math.sqrt(recent.reduce((a, g) => a + (g - mean) ** 2, 0) / Math.max(1, recent.length));
  const last = list[list.length - 1];
  const today = Date.parse(getMeta().generatedAt);
  const next = last ? last.t + mean * DAY : null;
  const byMonth = MONTHS.map((_, m) => list.filter((u) => new Date(u.t).getUTCMonth() === m).length);
  const peak = Math.max(1, ...byMonth);
  const years = [...new Set(list.map((u) => u.date.slice(0, 4)))].reverse();

  return (
    <div className="space-y-8">
      <header>
        <Link href="/updates/" className="text-sm text-fg-3 hover:text-fg">
          ← Updates
        </Link>
        <h1 className="mt-2 text-4xl font-bold">Update calendar</h1>
        <p className="mt-2 max-w-2xl text-fg-2">
          Every named major update since {list[0]?.date.slice(0, 4)}, from the official changelogs, and a rough idea of when
          the next one lands.
        </p>
      </header>

      {last && next && (
        <section className="callout-gold flex items-start gap-4 px-4 py-3">
          <CalendarClock className="mt-0.5 h-6 w-6 shrink-0 text-gold" aria-hidden />
          <div>
            <p className="font-display text-lg text-fg">
              Next major update: around {fmtDate(next)}
              {next < today ? " (it's due)" : ""}
            </p>
            <p className="text-sm text-fg-2">
              The last {recent.length} came {Math.round(mean)} days apart on average (give or take {Math.round(sd)}).
              The latest, &ldquo;{last.name}&rdquo;, was {Math.round((today - last.t) / DAY)} days ago. Gaijin usually
              opens a dev server and posts devblogs two to three weeks before release.
            </p>
          </div>
        </section>
      )}

      <section className="space-y-3">
        <h2 className="section-title">When majors land</h2>
        <div className="panel grid grid-cols-12 items-end gap-1 p-3" role="img" aria-label="Major updates by month of release">
          {byMonth.map((n, m) => (
            <div key={m} className="flex flex-col items-center gap-1">
              <span className="text-xs tabular text-fg-3">{n || ""}</span>
              <div className="w-full bg-gold/70" style={{ height: `${(n / peak) * 96}px` }} title={`${MONTHS[m]}: ${n}`} />
              <span className="text-[11px] text-fg-3">{MONTHS[m]}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="section-title">Every major update</h2>
        {years.map((y) => (
          <div key={y}>
            <h3 className="mb-2 font-display text-sm font-semibold uppercase tracking-wider text-fg-3">{y}</h3>
            <ul className="divide-y divide-card-border panel text-sm">
              {list
                .filter((u) => u.date.startsWith(y))
                .reverse()
                .map((u) => {
                  const i = list.indexOf(u);
                  return (
                    <li key={u.id} className="flex flex-wrap items-baseline gap-x-4 gap-y-1 px-3 py-2">
                      <span className="w-28 tabular text-fg-3">{u.date}</span>
                      <Link href={`/patch-notes/${u.id}/`} className="font-display text-base">
                        {u.name}
                      </Link>
                      {i > 0 && (
                        <span className="ml-auto text-xs tabular text-fg-3">
                          {Math.round((u.t - list[i - 1].t) / DAY)} days after {list[i - 1].name}
                        </span>
                      )}
                    </li>
                  );
                })}
            </ul>
          </div>
        ))}
      </section>
    </div>
  );
}
