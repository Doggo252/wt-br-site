import Link from "@/components/Link";
import { NewsList } from "@/components/NewsList";
import { getNews, getUnitMap } from "@/lib/data";
import { NEWS_KINDS } from "@/lib/news";

const SHOWN = 120;

/** /news/ (kind undefined: everything but videos and esports) and /news/<kind>/. */
export function NewsPage({ kind }: { kind?: (typeof NEWS_KINDS)[number] }) {
  const all = getNews();
  const posts = (kind ? all.filter((p) => p.kind === kind.kind) : all.filter((p) => p.kind !== "video" && p.kind !== "esports")).slice(0, SHOWN);
  return (
    <div className="space-y-6">
      <header>
        <p className="eyebrow">From warthunder.com</p>
        <h1 className="mt-1 text-4xl font-bold">{kind ? kind.label : "News and devblogs"}</h1>
        <p className="mt-2 max-w-2xl text-fg-2">
          The official War Thunder news, refreshed daily. Posts open on warthunder.com; vehicles they name link to their
          pages here, with BR history and stats. Patch notes have <Link href="/patch-notes/">their own page</Link>.
        </p>
      </header>
      <nav aria-label="News categories" className="flex flex-wrap gap-2 text-sm">
        <Link href="/news/" aria-current={!kind ? "page" : undefined} className={`btn px-2.5 py-1 text-xs ${!kind ? "border-gold text-fg" : ""}`}>
          Latest
        </Link>
        {NEWS_KINDS.map((k) => (
          <Link
            key={k.path}
            href={`/news/${k.path}/`}
            aria-current={kind?.path === k.path ? "page" : undefined}
            className={`btn px-2.5 py-1 text-xs ${kind?.path === k.path ? "border-gold text-fg" : ""}`}
          >
            {k.label}
          </Link>
        ))}
      </nav>
      {posts.length ? (
        <NewsList posts={posts} units={getUnitMap()} />
      ) : (
        <p className="panel p-4 text-sm text-fg-2">No posts yet. News is read from warthunder.com once a day.</p>
      )}
      <p className="text-xs text-fg-3">
        The {SHOWN} newest posts{kind ? " in this category" : ""}. Titles, summaries and images belong to Gaijin
        Entertainment.
      </p>
    </div>
  );
}
