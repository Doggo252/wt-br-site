import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "@/components/Link";
import { GUIDE_CATEGORIES, getGuide, getGuidePage, guideHref } from "@/lib/guide";

export const dynamicParams = false;

type Params = { params: Promise<{ category: string; slug: string }> };

export function generateStaticParams() {
  return getGuide().map((p) => ({ category: p.category, slug: p.slug }));
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { category, slug } = await params;
  const p = getGuidePage(category, slug);
  return p ? { title: `${p.title}: War Thunder guide`, description: p.summary } : { title: "Guide" };
}

export default async function Page({ params }: Params) {
  const { category, slug } = await params;
  const p = getGuidePage(category, slug);
  if (!p) notFound();
  const cat = GUIDE_CATEGORIES.find((c) => c.id === p.category)!;
  const more = getGuide().filter((o) => o.category === p.category && o.slug !== p.slug);
  return (
    <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_260px]">
      <article className="min-w-0 max-w-3xl">
        <p className="eyebrow">
          <Link href="/guide/">Guide</Link> / <Link href={`/guide/${cat.id}/`}>{cat.label}</Link>
        </p>
        <h1 className="mt-1 text-4xl font-bold">{p.title}</h1>
        {p.summary && <p className="mt-2 text-lg text-fg-2">{p.summary}</p>}
        <div className="guide-prose mt-6" dangerouslySetInnerHTML={{ __html: p.html }} />
        {p.sources.length > 0 && (
          <p className="mt-10 border-t border-card-border pt-3 text-xs text-fg-3">
            Written for Uptier from the official War Thunder wiki
            {p.sources.length === 1 ? (
              <>
                {" "}
                (
                <a href={p.sources[0]} rel="noopener" target="_blank">
                  source page
                </a>
                )
              </>
            ) : (
              <> ({p.sources.length} source pages)</>
            )}
            . The game changes often; if something here no longer matches, the official page is the reference.
          </p>
        )}
      </article>
      {more.length > 0 && (
        <aside className="lg:sticky lg:top-20 lg:self-start">
          <h2 className="mb-2 font-display text-sm font-semibold uppercase tracking-wider text-fg-3">
            More in {cat.label}
          </h2>
          <ul className="space-y-1 text-sm">
            {more.map((o) => (
              <li key={o.slug}>
                <Link href={guideHref(o)}>{o.title}</Link>
              </li>
            ))}
          </ul>
        </aside>
      )}
    </div>
  );
}
