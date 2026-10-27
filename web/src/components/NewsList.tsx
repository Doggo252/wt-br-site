import { ExternalLink, Newspaper } from "lucide-react";
import Link from "@/components/Link";
import type { NewsPost, UnitSummary } from "@/lib/data.gen";
import { KIND_LABEL } from "@/lib/news";
import { Thumb } from "./Thumb";

const dateFmt = (d: string) =>
  new Date(d + "T00:00:00Z").toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });

/** News cards: the post opens on warthunder.com; vehicles it names link here. */
export function NewsList({ posts, units }: { posts: NewsPost[]; units: Map<string, UnitSummary> }) {
  return (
    <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {posts.map((p) => {
        const named = (p.units ?? []).map((id) => units.get(id)).filter((u): u is UnitSummary => !!u);
        return (
          <li key={p.id} className="panel flex flex-col overflow-hidden">
            <a href={p.url} rel="noopener" target="_blank" className="group block no-underline">
              {p.image ? (
                // eslint-disable-next-line @next/next/no-img-element -- remote warthunder.com thumbnail
                <img
                  src={p.image}
                  alt=""
                  loading="lazy"
                  className="aspect-[16/9] w-full bg-black/30 object-cover transition group-hover:brightness-110"
                />
              ) : (
                <span className="flex aspect-[16/9] items-center justify-center bg-black/30 text-fg-3">
                  <Newspaper className="h-6 w-6" aria-hidden />
                </span>
              )}
              <span className="flex items-center gap-2 px-3 pt-2 text-xs text-fg-3">
                <span className="font-display uppercase tracking-wider text-gold/90">{KIND_LABEL[p.kind] ?? p.kind}</span>
                <time dateTime={p.date}>{dateFmt(p.date)}</time>
              </span>
              <span className="flex items-start gap-1 px-3 pt-1 font-display text-base leading-snug text-fg group-hover:text-link">
                {p.title}
                <ExternalLink className="mt-1 h-3 w-3 shrink-0 text-fg-3" aria-label="(opens warthunder.com)" />
              </span>
            </a>
            {p.summary && <p className="line-clamp-3 px-3 pt-1 text-sm text-fg-2">{p.summary}</p>}
            {named.length > 0 && (
              <p className="mt-auto flex flex-wrap gap-1.5 px-3 pb-3 pt-2">
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
              </p>
            )}
            {named.length === 0 && <span className="pb-3" />}
          </li>
        );
      })}
    </ul>
  );
}
