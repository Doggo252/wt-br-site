import type { Metadata } from "next";
import Link from "@/components/Link";
import { PatchNoteList } from "@/components/PatchNoteList";
import { getPatchNotes } from "@/lib/data";

type Params = { params: Promise<{ year: string }> };

export function generateStaticParams() {
  const years = [...new Set(getPatchNotes().map((n) => n.date.slice(0, 4)))];
  return years.length ? years.map((year) => ({ year })) : [{ year: "2026" }];
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { year } = await params;
  return { title: `Patch notes ${year}`, description: `Every War Thunder changelog from ${year}.` };
}

export default async function PatchNotesYearPage({ params }: Params) {
  const { year } = await params;
  const notes = getPatchNotes().filter((n) => n.date.startsWith(year));
  return (
    <div className="space-y-6">
      <header>
        <Link href="/patch-notes/" className="text-sm text-fg-3 hover:text-fg">
          ← All patch notes
        </Link>
        <h1 className="mt-2 text-4xl font-bold">Patch notes {year}</h1>
        <p className="mt-2 text-fg-2">{notes.length} changelogs.</p>
      </header>
      <PatchNoteList notes={notes} />
    </div>
  );
}
