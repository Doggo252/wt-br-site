import Link from "@/components/Link";
import type { PatchNoteSummary } from "@/lib/data.gen";

/** Changelog entries as rows: date, title, what it covers, and its update page when there is one. */
export function PatchNoteList({ notes }: { notes: PatchNoteSummary[] }) {
  return (
    <ul className="panel divide-y divide-[#262f35]">
      {notes.map((n) => (
        <li key={n.id} className="flex flex-wrap items-baseline gap-x-4 gap-y-1 px-4 py-2.5">
          <span className="w-24 shrink-0 text-sm tabular text-fg-3">{n.date}</span>
          <span className="min-w-0 flex-1">
            <Link href={`/patch-notes/${n.id}/`} className="font-display text-fg hover:text-link">
              {n.title}
            </Link>
            {n.summary && <span className="block text-sm text-fg-3 line-clamp-2">{n.summary}</span>}
          </span>
          <span className="flex shrink-0 items-center gap-3 text-xs text-fg-3">
            {(n.units ?? 0) > 0 && <span>{n.units} vehicles</span>}
            {n.forVersion && (
              <Link href={`/updates/${n.forVersion}/`} className="btn px-2 py-0.5 text-xs">
                BR changes
              </Link>
            )}
          </span>
        </li>
      ))}
    </ul>
  );
}
