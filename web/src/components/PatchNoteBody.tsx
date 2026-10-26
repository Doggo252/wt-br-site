import Link from "@/components/Link";
import type { PatchNoteSection, UnitSummary } from "@/lib/data.gen";
import { Thumb } from "./Thumb";

/**
 * A changelog entry's sections. Item HTML comes from the ETL already reduced to <strong>, <em> and
 * <a href="http(s)://...">, so it is safe to render as markup. Vehicles an item names get chips.
 */
export function PatchNoteBody({
  sections,
  units,
  highlight,
}: {
  sections: PatchNoteSection[];
  units: Map<string, UnitSummary>;
  /** Vehicle to emphasise (e.g. the one whose page linked here). */
  highlight?: string;
}) {
  return (
    <div className="space-y-6">
      {sections.map((s, si) => (
        <section key={si}>
          {s.title && <h3 className="mb-2 font-display text-lg font-semibold text-fg">{s.title}</h3>}
          <ul className="patch-notes space-y-1.5 text-sm leading-relaxed text-fg-2">
            {s.items.map((it, ii) => {
              const named = (it.units ?? []).map((id) => units.get(id)).filter((u): u is UnitSummary => !!u);
              return (
                <li
                  key={ii}
                  className={`${it.depth ? "ml-5 list-[circle]" : "list-disc"} ml-5 ${highlight && it.units?.includes(highlight) ? "rounded-sm bg-gold/10 px-1" : ""}`}
                >
                  <span dangerouslySetInnerHTML={{ __html: it.html }} />
                  {named.length > 0 && (
                    <span className="mt-1 flex flex-wrap gap-1.5">
                      {named.map((u) => (
                        <Link
                          key={u.id}
                          href={`/vehicle/${u.id}/`}
                          className="inline-flex items-center gap-1.5 border border-card-border bg-panel px-1.5 py-0.5 text-xs text-fg-2 no-underline hover:text-fg"
                        >
                          <Thumb id={u.id} image={u.image} />
                          {u.name}
                        </Link>
                      ))}
                    </span>
                  )}
                </li>
              );
            })}
          </ul>
        </section>
      ))}
    </div>
  );
}
