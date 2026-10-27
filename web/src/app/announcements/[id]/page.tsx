import type { Metadata } from "next";
import Link from "@/components/Link";
import { OfficialChangeTable, rowOutcome } from "@/components/OfficialChanges";
import { BRANCHES, BRANCH_NAME } from "@/lib/branches";
import { getAnnouncements, getPendingPlan, getUnitMap } from "@/lib/data";
import { plural } from "@/lib/format";

export const dynamicParams = false;

export function generateStaticParams() {
  return getAnnouncements()
    .filter((a) => !a.unavailable && (a.changes ?? []).length > 0)
    .map((a) => ({ id: String(a.id) }));
}

type Params = { params: Promise<{ id: string }> };

function find(id: string) {
  return getAnnouncements().find((a) => String(a.id) === id)!;
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const a = find((await params).id);
  return { title: a.title, description: `${a.title} (${a.date}): every BR change in Gaijin's table.` };
}

export default async function AnnouncementPage({ params }: Params) {
  const a = find((await params).id);
  const units = getUnitMap();
  const changes = a.changes ?? [];
  const planned = a.kind === "planned";
  const pending = changes.filter((c) => rowOutcome(c) === "pending").length;

  return (
    <div className="space-y-8">
      <header>
        <p className="mb-2 text-sm">
          <Link href="/announcements/">All announcements</Link>
        </p>
        <h1 className="text-4xl font-bold">{a.title}</h1>
        <p className="mt-1 text-fg-2">
          Posted {a.date} · {plural(changes.length, "vehicle")} ·{" "}
          <a href={a.url} rel="noopener">
            original post
          </a>
        </p>
        {planned && pending > 0 && (
          <p className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-gold">
            {plural(pending, "change")} not live yet.
            {getPendingPlan()?.a.id === a.id && (
              <Link href="/lineup/?planned=1" className="btn text-xs">
                Plan lineups with these BRs →
              </Link>
            )}
          </p>
        )}
      </header>
      {BRANCHES.map((b) => {
        const rows = changes.filter((c) => c.branch === b);
        if (!rows.length) return null;
        return (
          <section key={b}>
            <h2 className="section-title mb-2">
              {BRANCH_NAME[b]} <span className="text-fg-3">· {rows.length}</span>
            </h2>
            <OfficialChangeTable
              changes={rows}
              units={units}
              showOutcome={planned}
              showGroundBattle={b !== "ground" && rows.some((c) => c.grb)}
            />
          </section>
        );
      })}
    </div>
  );
}
