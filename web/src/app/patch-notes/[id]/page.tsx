import type { Metadata } from "next";
import { ExternalLink } from "lucide-react";
import Link from "@/components/Link";
import { PatchNoteBody } from "@/components/PatchNoteBody";
import { getPatchNote, getPatchNotes, getUnitMap } from "@/lib/data";

type Params = { params: Promise<{ id: string }> };

export function generateStaticParams() {
  const notes = getPatchNotes();
  return notes.length ? notes.map((n) => ({ id: String(n.id) })) : [{ id: "0" }];
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { id } = await params;
  const n = getPatchNotes().find((x) => String(x.id) === id);
  return n ? { title: n.title, description: n.summary || `War Thunder changelog, ${n.date}.` } : { title: "Patch notes" };
}

export default async function PatchNotePage({ params }: Params) {
  const { id } = await params;
  const all = getPatchNotes();
  const i = all.findIndex((x) => String(x.id) === id);
  if (i < 0) return <p className="text-fg-2">No patch notes here yet.</p>;
  const n = getPatchNote(id);
  const newer = all[i - 1];
  const older = all[i + 1];
  return (
    <article className="space-y-6">
      <header className="space-y-3">
        <nav className="flex flex-wrap items-center justify-between gap-2 text-sm">
          {older ? (
            <Link href={`/patch-notes/${older.id}/`} className="btn">
              ← {older.date}
            </Link>
          ) : (
            <span />
          )}
          <Link href={`/patch-notes/year/${n.date.slice(0, 4)}/`} className="text-fg-3 hover:text-fg">
            {n.date.slice(0, 4)} patch notes
          </Link>
          {newer ? (
            <Link href={`/patch-notes/${newer.id}/`} className="btn">
              {newer.date} →
            </Link>
          ) : (
            <span />
          )}
        </nav>
        <p className="eyebrow">Patch notes · {n.date}</p>
        <h1 className="text-3xl font-bold sm:text-4xl">{n.title}</h1>
        <div className="flex flex-wrap gap-2 text-sm">
          {n.forVersion && (
            <Link href={`/updates/${n.forVersion}/`} className="btn">
              BR changes and new vehicles in {n.forVersion}
            </Link>
          )}
          <a href={n.url} rel="noopener" className="btn gap-1.5">
            <ExternalLink className="h-3.5 w-3.5" aria-hidden />
            Original on warthunder.com
          </a>
        </div>
      </header>
      <div className="panel p-4 sm:p-6">
        {n.sections.length ? (
          <PatchNoteBody sections={n.sections} units={getUnitMap()} />
        ) : (
          <p className="text-sm text-fg-2">This changelog has no text on warthunder.com; see the original.</p>
        )}
      </div>
      <p className="text-xs text-fg-3">
        Text from the official War Thunder changelog. Report links go to the Gaijin community bug reporting site.
      </p>
    </article>
  );
}
