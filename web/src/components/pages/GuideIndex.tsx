import Link from "@/components/Link";
import { GUIDE_CATEGORIES, type GuideCategory, getGuide, guideHref } from "@/lib/guide";

/** /guide/ (every section) and /guide/<category>/ (one section). */
export function GuideIndex({ only }: { only?: GuideCategory }) {
  const pages = getGuide();
  const cats = GUIDE_CATEGORIES.filter((c) => (!only || c.id === only) && pages.some((p) => p.category === c.id));
  const current = only ? GUIDE_CATEGORIES.find((c) => c.id === only) : undefined;
  return (
    <div className="space-y-8">
      <header>
        <p className="eyebrow">{current ? <Link href="/guide/">Guide</Link> : "Guide"}</p>
        <h1 className="mt-1 text-4xl font-bold">{current ? current.label : "How War Thunder works"}</h1>
        <p className="mt-2 max-w-2xl text-fg-2">
          {current
            ? current.blurb
            : "Game modes, matchmaking, armour, crews, the economy and the rest of the game's rules, explained in plain English. Each page lists the official source its facts come from."}
        </p>
      </header>
      {!only && (
        <nav aria-label="Guide sections" className="flex flex-wrap gap-2 text-sm">
          {cats.map((c) => (
            <Link key={c.id} href={`/guide/${c.id}/`} className="btn px-2.5 py-1 text-xs">
              {c.label}
            </Link>
          ))}
        </nav>
      )}
      {cats.map((c) => (
        <section key={c.id} id={c.id} className="space-y-3">
          {!only && (
            <>
              <h2 className="section-title">
                <Link href={`/guide/${c.id}/`} className="text-inherit">
                  {c.label}
                </Link>
              </h2>
              <p className="text-sm text-fg-2">{c.blurb}</p>
            </>
          )}
          <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {pages
              .filter((p) => p.category === c.id)
              .map((p) => (
                <li key={p.slug}>
                  <Link href={guideHref(p)} className="panel block h-full p-3 no-underline transition hover:brightness-125">
                    <span className="font-display text-base text-fg">{p.title}</span>
                    <span className="mt-1 block text-sm text-fg-3">{p.summary}</span>
                  </Link>
                </li>
              ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
