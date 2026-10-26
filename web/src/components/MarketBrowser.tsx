"use client";

import { Search, Store, TrendingDown } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import Link from "@/components/Link";
import { Flag } from "./Flag";
import { nationName } from "@/lib/nations";

/** See app/data/market.json/route.ts. */
type Row = [string, string, string, string, string, string, number, number, number, number, string, string, number];

const TABS = [
  { key: "vehicles", label: "Vehicles", kinds: ["tank", "aircraft", "helicopter"] },
  { key: "skins", label: "Skins", kinds: ["skin"] },
  { key: "decals", label: "Decals", kinds: ["decal", "attachable"] },
  { key: "other", label: "Trophies & keys", kinds: ["chest", "key", "profile_icon"] },
] as const;

type Sort = "price-asc" | "price-desc" | "listings" | "spread";
const PAGE = 60;

const gjn = (v: number) => `${v.toLocaleString("en", { maximumFractionDigits: 2 })} GJN`;
const href = (name: string) => `https://trade.gaijin.net/market/1067/${encodeURIComponent(name)}`;

export function MarketBrowser() {
  const [data, setData] = useState<{ snapshot: string | null; snapshots: string[]; rows: Row[] } | null>(null);
  const [tab, setTab] = useState<(typeof TABS)[number]["key"]>("vehicles");
  const [q, setQ] = useState("");
  const [nation, setNation] = useState("");
  const [sort, setSort] = useState<Sort>("price-asc");
  const [limit, setLimit] = useState(PAGE);

  useEffect(() => {
    fetch("/data/market.json")
      .then((r) => r.json())
      .then(setData);
  }, []);

  const kinds: readonly string[] = TABS.find((t) => t.key === tab)!.kinds;
  const shown = useMemo(() => {
    if (!data) return [];
    const nq = q.trim().toLowerCase();
    const list = data.rows.filter(
      (r) =>
        kinds.includes(r[2]) &&
        r[2] !== "ship" &&
        (!nation || r[5] === nation) &&
        (!nq || r[1].toLowerCase().includes(nq) || r[4].toLowerCase().includes(nq)),
    );
    const price = (r: Row) => r[6] || Infinity;
    list.sort((a, b) => {
      if (sort === "price-asc") return price(a) - price(b);
      if (sort === "price-desc") return (b[6] || 0) - (a[6] || 0);
      if (sort === "listings") return b[8] - a[8];
      // Smallest gap between the lowest offer and the best buy order: easiest to flip or snipe.
      const gap = (r: Row) => (r[6] && r[7] ? (r[6] - r[7]) / r[6] : Infinity);
      return gap(a) - gap(b);
    });
    return list;
  }, [data, kinds, q, nation, sort]);

  // Price drops since the previous snapshot (only once there are two snapshots).
  const drops = useMemo(
    () =>
      (data?.rows ?? [])
        .filter((r) => r[12] > 0 && r[6] > 0 && r[6] <= r[12] * 0.8)
        .sort((a, b) => a[6] / a[12] - b[6] / b[12])
        .slice(0, 12),
    [data],
  );

  if (!data) return <p className="text-sm text-fg-3">Loading the market…</p>;
  const nations = [...new Set(data.rows.map((r) => r[5]).filter(Boolean))].sort();

  return (
    <div className="space-y-6">
      <section className="space-y-3">
        <h2 className="section-title">
          <TrendingDown className="h-5 w-5 text-gold/80" aria-hidden />
          Price drops
        </h2>
        {drops.length ? (
          <ItemGrid rows={drops} showDrop />
        ) : (
          <p className="panel p-4 text-sm text-fg-2">
            Drops of 20% or more since the previous snapshot show up here. There is one snapshot so far (
            {data.snapshot}); the list fills in from the next one.
          </p>
        )}
      </section>

      <div className="flex gap-1 border-b border-card-border" role="tablist">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            role="tab"
            aria-selected={tab === t.key}
            onClick={() => {
              setTab(t.key);
              setLimit(PAGE);
            }}
            className={`-mb-px border-b-2 px-3 py-1.5 font-display text-sm ${tab === t.key ? "border-gold text-fg" : "border-transparent text-fg-2 hover:text-fg"}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="panel flex flex-wrap items-end gap-4 p-3">
        <label className="flex flex-col gap-1 text-xs text-fg-3">
          Search
          <span className="relative">
            <Search className="pointer-events-none absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-fg-3" aria-hidden />
            <input type="search" value={q} onChange={(e) => setQ(e.target.value)} className={`${INPUT} pl-7`} />
          </span>
        </label>
        <label className="flex flex-col gap-1 text-xs text-fg-3">
          Nation
          <select value={nation} onChange={(e) => setNation(e.target.value)} className={INPUT}>
            <option value="">All</option>
            {nations.map((n) => (
              <option key={n} value={n}>
                {nationName(n)}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-xs text-fg-3">
          Sort
          <select value={sort} onChange={(e) => setSort(e.target.value as Sort)} className={INPUT}>
            <option value="price-asc">Cheapest first</option>
            <option value="price-desc">Most expensive first</option>
            <option value="listings">Most listings</option>
            <option value="spread">Smallest buy/sell gap</option>
          </select>
        </label>
        <p className="ml-auto text-sm text-fg-3" aria-live="polite">
          {shown.length.toLocaleString("en")} items
        </p>
      </div>

      <ItemGrid rows={shown.slice(0, limit)} />
      {shown.length > limit && (
        <div className="text-center">
          <button type="button" className="btn" onClick={() => setLimit((l) => l + PAGE * 3)}>
            Show more ({shown.length - limit} left)
          </button>
        </div>
      )}
      <p className="text-xs text-fg-3">
        Prices from a Gaijin Market snapshot taken {data.snapshot}. Buying and selling needs a Gaijin login; prices
        move constantly, so check the market before trading.
      </p>
    </div>
  );
}

function ItemGrid({ rows, showDrop = false }: { rows: Row[]; showDrop?: boolean }) {
  return (
    <ul className="grid grid-cols-[repeat(auto-fill,minmax(170px,1fr))] gap-2">
      {rows.map((r) => (
        <li key={r[0]} className="panel flex flex-col overflow-hidden">
          <a href={href(r[0])} rel="noopener" target="_blank" className="block no-underline hover:brightness-125">
            {r[10] ? (
              // eslint-disable-next-line @next/next/no-img-element -- remote Gaijin CDN thumbnail
              <img src={r[10]} alt="" loading="lazy" className="aspect-[16/9] w-full bg-black/30 object-contain" />
            ) : (
              <span className="flex aspect-[16/9] items-center justify-center bg-black/30 text-fg-3">
                <Store className="h-6 w-6" aria-hidden />
              </span>
            )}
            <span className="block px-2 pt-1.5 text-xs text-fg-2" title={r[1]}>
              <span className="line-clamp-2">{r[1]}</span>
            </span>
          </a>
          <span className="mt-auto flex items-center justify-between gap-2 px-2 pb-1.5 pt-1">
            <span className="font-display text-sm tabular text-gold">{r[6] ? gjn(r[6]) : "No offers"}</span>
            {showDrop && r[12] > 0 && (
              <span className="text-xs tabular text-good">−{Math.round((1 - r[6] / r[12]) * 100)}%</span>
            )}
            {r[5] && <Flag nation={r[5]} labelled className="h-3" />}
          </span>
          {r[3] && (
            <Link href={`/vehicle/${r[3]}/`} className="border-t border-card-border px-2 py-1 text-xs text-fg-3 hover:text-link">
              {r[2] === "skin" ? `For ${r[4] || "the vehicle"}` : "BR history and stats"} →
            </Link>
          )}
        </li>
      ))}
    </ul>
  );
}

const INPUT = "border border-card-border bg-bg px-2 py-1.5 text-sm text-fg focus:border-link focus:outline-none";
