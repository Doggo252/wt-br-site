import type { Metadata } from "next";
import Link from "next/link";
import { TechTree, type TreeUnit } from "@/components/TechTree";
import { getMeta, getTree, unitsInNation } from "@/lib/data";
import { nationName } from "@/lib/nations";

export const dynamicParams = false;

export function generateStaticParams() {
  return getMeta().nations.map((nation) => ({ nation }));
}

type Params = { params: Promise<{ nation: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { nation } = await params;
  return {
    title: `${nationName(nation)} ground tech tree`,
    description: `Every ${nationName(nation)} ground vehicle in War Thunder with its current Arcade, Realistic and Simulator Battle Rating.`,
  };
}

export default async function NationPage({ params }: Params) {
  const { nation } = await params;
  const tree = getTree(nation);
  const units: Record<string, TreeUnit> = {};
  for (const u of unitsInNation(nation).filter((u) => !u.removedIn)) {
    units[u.id] = { name: u.name, status: u.status, hidden: u.hidden, br: u.br, image: u.image };
  }
  const meta = getMeta();

  return (
    <div>
      <nav aria-label="Nations" className="mb-4 flex flex-wrap gap-x-4 gap-y-1 text-sm">
        {meta.nations.map((n) =>
          n === nation ? (
            <span key={n} aria-current="page" className="font-display font-semibold text-fg">
              {nationName(n)}
            </span>
          ) : (
            <Link key={n} href={`/ground/${n}/`} className="font-display text-fg-2 no-underline hover:text-fg">
              {nationName(n)}
            </Link>
          ),
        )}
      </nav>
      <h1 className="mb-1 text-3xl font-bold">{nationName(nation)}</h1>
      <p className="mb-5 text-sm text-fg-3">
        {Object.keys(units).length} vehicles · update <span className="tabular">{meta.version}</span>
      </p>
      {/* Break out of the page column so wide trees can use the whole window. */}
      <div className="relative left-1/2 w-[calc(100vw-2rem)] max-w-[1400px] -translate-x-1/2">
        <TechTree columns={tree.columns} units={units} />
      </div>
    </div>
  );
}
