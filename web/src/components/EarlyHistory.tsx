import { Archive } from "lucide-react";
import Link from "@/components/Link";
import type { EarlyBr } from "@/lib/data.gen";

const MODE_SHORT: Record<string, string> = { ab: "AB", rb: "RB", sb: "SB", br: "BR" };
const fmt = (v: number) => v.toFixed(1);
/** One entry per mode, or a single "BR" one when all three modes agree. */
const perMode = <T,>(byMode: Record<string, T>, text: (v: T) => string) => {
  const entries = Object.entries(byMode);
  const texts = entries.map(([, v]) => text(v));
  return entries.length === 3 && new Set(texts).size === 1
    ? `BR ${texts[0]}`
    : entries.map(([m], i) => `${MODE_SHORT[m]} ${texts[i]}`).join(" · ");
};
const brText = (br: Record<string, number>) => perMode(br, fmt);
const changeText = (change: Record<string, [number, number]>) =>
  perMode(change, ([was, now]) => `${fmt(was)} → ${fmt(now)}`);
const dateFmt = (d: string) =>
  new Date(d + "T00:00:00Z").toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });

/**
 * BR data from before the datamine starts (March 2020): what the official changelogs said
 * changed, and what the wiki showed when the Internet Archive saved it (a change is dated to
 * the first capture showing it). Shown as a list, not on the chart, because the record has gaps.
 */
export function EarlyHistory({ early }: { early: EarlyBr[] }) {
  return (
    <div className="panel">
      <h3 className="flex items-center gap-2 border-b border-card-border px-3 py-2 font-display text-sm font-semibold uppercase tracking-wider text-fg">
        <Archive className="h-4 w-4 text-fg-3" aria-hidden />
        Before March 2020
      </h3>
      <ul className="divide-y divide-card-border text-sm">
        {early.map((e, i) => (
          <li key={i} className="flex flex-wrap items-baseline gap-x-4 gap-y-1 px-3 py-2">
            <span className="w-24 shrink-0 tabular text-fg-3">{dateFmt(e.date)}</span>
            {e.source === "wiki" ? (
              <>
                <span className="tabular text-fg">
                  {e.change && Object.keys(e.change).length ? changeText(e.change) : brText(e.br ?? {})}
                </span>
                {e.after && <span className="text-xs text-fg-3">changed after {dateFmt(e.after)}</span>}
                <a href={e.url ?? undefined} rel="noopener" target="_blank" className="text-xs text-fg-3">
                  Wiki, archived
                </a>
              </>
            ) : (
              <>
                <span className="tabular text-fg">{changeText(e.change ?? {})}</span>
                {e.noteId != null && (
                  <Link href={`/patch-notes/${e.noteId}/`} className="text-xs text-fg-3">
                    Changelog
                  </Link>
                )}
              </>
            )}
          </li>
        ))}
      </ul>
      <p className="border-t border-card-border px-3 py-2 text-xs text-fg-3">
        The game files we read start in March 2020. Earlier, this is what the official changelogs recorded and what the
        War Thunder wiki showed when the Internet Archive saved it, mostly during 2019. The wiki was edited by hand and
        sometimes lagged the game, and Gaijin announced many BR changes elsewhere, so there are gaps.
      </p>
    </div>
  );
}
