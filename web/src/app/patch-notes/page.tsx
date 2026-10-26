import type { Metadata } from "next";
import { ScrollText } from "lucide-react";
import Link from "@/components/Link";
import { PatchNoteList } from "@/components/PatchNoteList";
import { getPatchNotes } from "@/lib/data";

export const metadata: Metadata = {
  title: "Patch notes",
  description: "Every War Thunder changelog since 2013, linked to the BR changes and vehicles in each update.",
};

const LATEST = 40;

export default function PatchNotesPage() {
  const notes = getPatchNotes();
  const years = [...new Set(notes.map((n) => n.date.slice(0, 4)))];
  return (
    <div className="space-y-6">
      <header>
        <p className="eyebrow">From warthunder.com</p>
        <h1 className="mt-1 flex items-center gap-3 text-4xl font-bold">
          <ScrollText className="h-8 w-8 text-gold/80" aria-hidden />
          Patch notes
        </h1>
        <p className="mt-2 max-w-2xl text-fg-2">
          {notes.length.toLocaleString("en")} official changelogs since {notes.at(-1)?.date.slice(0, 4) ?? "2013"}. Vehicles
          named in the notes link to their pages, and updates that changed BRs link to those changes.
        </p>
        <nav aria-label="Years" className="mt-4 flex flex-wrap gap-1.5">
          {years.map((y) => (
            <Link key={y} href={`/patch-notes/year/${y}/`} className="btn px-2.5 py-1 text-sm tabular">
              {y}
            </Link>
          ))}
        </nav>
      </header>
      <PatchNoteList notes={notes.slice(0, LATEST)} />
    </div>
  );
}
