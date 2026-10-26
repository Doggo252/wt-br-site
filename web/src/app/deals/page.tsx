import type { Metadata } from "next";
import { BadgePercent, ShoppingCart, Store, TrendingDown } from "lucide-react";
import Link from "@/components/Link";
import { ShopTabs } from "@/components/ShopTabs";
import { UnitCard } from "@/components/UnitCard";
import { getMarket, getMeta, getStore, getUnitMap } from "@/lib/data";
import type { MarketEntry, StorePack } from "@/lib/data.gen";

export const metadata: Metadata = {
  title: "Deals",
  description:
    "War Thunder discounts right now: Gaijin Store packs on sale, Gaijin Market price drops and the cheapest vehicles you can buy outright.",
};

const VEHICLE_KINDS = new Set(["tank", "aircraft", "helicopter"]);
const marketHref = (name: string) => `https://trade.gaijin.net/market/1067/${encodeURIComponent(name)}`;
const gjn = (v: number) => `${v.toLocaleString("en", { maximumFractionDigits: 2 })} GJN`;

export default function DealsPage() {
  const store = getStore();
  const market = getMarket();
  const units = getUnitMap();
  // Build time: pages are rebuilt daily, so a sale that has ended drops off on the next build.
  const now = Date.parse(getMeta().generatedAt) / 1000;

  const onSale = (store?.packs ?? [])
    .filter((p) => p.oldPrice && p.price && (!p.endsAt || p.endsAt > now))
    .sort((a, b) => a.price! / a.oldPrice! - b.price! / b.oldPrice!);

  // Market items at least 20% under their price in the previous snapshot.
  const drops = (market?.items ?? [])
    .map((it) => {
      const h = it.history ?? [];
      const prev = h.length > 1 ? h[h.length - 2].price : null;
      return { it, prev };
    })
    .filter(({ it, prev }) => prev && it.price && it.price <= prev * 0.8)
    .sort((a, b) => a.it.price! / a.prev! - b.it.price! / b.prev!)
    .slice(0, 24);

  const cheapVehicles = (market?.items ?? [])
    .filter((it) => VEHICLE_KINDS.has(it.kind) && it.price && it.unit && units.has(it.unit))
    .sort((a, b) => a.price! - b.price!)
    .slice(0, 18);

  return (
    <div className="space-y-10">
      <header>
        <p className="eyebrow">Shop</p>
        <h1 className="mt-1 text-4xl font-bold">Deals</h1>
        <p className="mt-2 max-w-2xl text-fg-2">
          What&rsquo;s cheaper than usual right now on the Gaijin Store and the Gaijin Market. Refreshed daily; check the
          store before buying, since sales can end early. Full price lists are on{" "}
          <Link href="/premiums/">premium vehicles</Link> and <Link href="/market/">market prices</Link>.
        </p>
      </header>
      <ShopTabs current="/deals/" />

      <section className="space-y-3">
        <h2 className="section-title">
          <BadgePercent className="h-5 w-5 text-gold/80" aria-hidden />
          On sale at the Gaijin Store
        </h2>
        {onSale.length ? (
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {onSale.map((p) => (
              <PackCard key={p.id} p={p} units={units} />
            ))}
          </ul>
        ) : (
          <p className="panel p-4 text-sm text-fg-2">
            Nothing on the store is discounted right now. Gaijin runs sales around holidays, anniversaries and major
            updates; this list fills in when one starts.
          </p>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="section-title">
          <TrendingDown className="h-5 w-5 text-gold/80" aria-hidden />
          Gaijin Market price drops
        </h2>
        {drops.length ? (
          <ul className="grid grid-cols-[repeat(auto-fill,minmax(170px,1fr))] gap-2">
            {drops.map(({ it, prev }) => (
              <MarketTile key={it.name} it={it} note={`−${Math.round((1 - it.price! / prev!) * 100)}%`} />
            ))}
          </ul>
        ) : (
          <p className="panel p-4 text-sm text-fg-2">
            Drops of 20% or more between market snapshots show up here
            {market ? ` (latest snapshot ${market.snapshot})` : ""}.
          </p>
        )}
      </section>

      {cheapVehicles.length > 0 && (
        <section className="space-y-3">
          <h2 className="section-title">
            <Store className="h-5 w-5 text-gold/80" aria-hidden />
            Cheapest vehicles on the market
          </h2>
          <p className="text-sm text-fg-2">
            Event and limited vehicles you can buy outright for Gaijin Coins, lowest offer first
            {market ? ` (snapshot ${market.snapshot})` : ""}.
          </p>
          <ul className="grid grid-cols-[repeat(auto-fill,minmax(150px,1fr))] gap-2">
            {cheapVehicles.map((it) => {
              const u = units.get(it.unit!)!;
              return (
                <li key={it.name} className="flex justify-center">
                  <UnitCard
                    name={u.name}
                    rank={u.br.rb}
                    status={u.status}
                    image={u.image ? `/img/units/${u.id}.webp` : undefined}
                    href={`/vehicle/${u.id}/`}
                    price={it.price!}
                  />
                </li>
              );
            })}
          </ul>
        </section>
      )}
    </div>
  );
}

function PackCard({ p, units }: { p: StorePack; units: ReturnType<typeof getUnitMap> }) {
  const off = Math.round((1 - p.price! / p.oldPrice!) * 100);
  const ends = p.endsAt ? new Date(p.endsAt * 1000) : null;
  return (
    <li className="panel flex flex-col overflow-hidden">
      <a href={p.url} rel="noopener" target="_blank" className="block no-underline hover:brightness-125">
        {p.image ? (
          // eslint-disable-next-line @next/next/no-img-element -- remote store image
          <img src={p.image} alt="" loading="lazy" className="aspect-[16/9] w-full bg-black/30 object-cover" />
        ) : (
          <span className="flex aspect-[16/9] items-center justify-center bg-black/30 text-fg-3">
            <ShoppingCart className="h-6 w-6" aria-hidden />
          </span>
        )}
        <span className="block px-3 pt-2 font-display text-fg">{p.title}</span>
      </a>
      <div className="flex items-baseline gap-2 px-3 pt-1">
        <s className="text-sm tabular text-fg-3">
          {p.currency ?? "$"}
          {p.oldPrice}
        </s>
        <span className="font-display text-lg tabular text-gold">
          {p.currency ?? "$"}
          {p.price}
        </span>
        <span className="text-sm tabular text-good">−{off}%</span>
      </div>
      {ends && (
        <p className="px-3 text-xs text-fg-3">
          Until {ends.toLocaleDateString("en-GB", { day: "numeric", month: "short", timeZone: "UTC" })}
        </p>
      )}
      {(p.units ?? []).length > 0 && (
        <p className="mt-auto flex flex-wrap gap-x-3 gap-y-1 px-3 pb-2 pt-2 text-sm">
          {(p.units ?? []).map((id) =>
            units.has(id) ? (
              <Link key={id} href={`/vehicle/${id}/`}>
                {units.get(id)!.name} →
              </Link>
            ) : null,
          )}
        </p>
      )}
    </li>
  );
}

function MarketTile({ it, note }: { it: MarketEntry; note: string }) {
  return (
    <li className="panel flex flex-col overflow-hidden">
      <a href={marketHref(it.name)} rel="noopener" target="_blank" className="block no-underline hover:brightness-125">
        {it.icon ? (
          // eslint-disable-next-line @next/next/no-img-element -- remote Gaijin CDN thumbnail
          <img src={it.icon} alt="" loading="lazy" className="aspect-[16/9] w-full bg-black/30 object-contain" />
        ) : (
          <span className="flex aspect-[16/9] items-center justify-center bg-black/30 text-fg-3">
            <Store className="h-6 w-6" aria-hidden />
          </span>
        )}
        <span className="line-clamp-2 block px-2 pt-1.5 text-xs text-fg-2">{it.title}</span>
      </a>
      <span className="mt-auto flex items-center justify-between gap-2 px-2 pb-1.5 pt-1">
        <span className="font-display text-sm tabular text-gold">{gjn(it.price!)}</span>
        <span className="text-xs tabular text-good">{note}</span>
      </span>
    </li>
  );
}
