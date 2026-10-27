import { Coins, Paintbrush, Store } from "lucide-react";
import type { Camo } from "@/lib/data.gen";

const marketHref = (name: string) => `https://trade.gaijin.net/market/1067/${encodeURIComponent(name)}`;
const gjn = (price: number) => `${price.toLocaleString("en", { maximumFractionDigits: 2 })} GJN`;

/**
 * Every camouflage for a vehicle: the game's own, with what unlocks each and its Golden Eagle
 * price, then the Marketplace ones players made, with the lowest offer at the last snapshot.
 */
export function CamoList({ camos, asOf }: { camos: Camo[]; asOf?: string }) {
  const game = camos.filter((c) => !c.market);
  const market = camos.filter((c) => c.market);
  return (
    <div className="space-y-6">
      {game.length > 0 && (
        <div className="panel overflow-x-auto">
          <h3 className="flex items-center gap-2 border-b border-card-border px-3 py-2 font-display text-sm font-semibold uppercase tracking-wider text-fg">
            <Paintbrush className="h-4 w-4 text-fg-3" aria-hidden />
            In the game · {game.length}
          </h3>
          <table className="data-table w-full text-sm">
            <thead>
              <tr>
                <th scope="col">Camouflage</th>
                <th scope="col">How to unlock</th>
                <th scope="col" className="text-right">
                  Or buy
                </th>
              </tr>
            </thead>
            <tbody>
              {game.map((c) => (
                <tr key={c.id}>
                  <td className="font-display text-fg">{c.name}</td>
                  <td className="text-fg-2">{c.how ?? "Buy only"}</td>
                  <td className="whitespace-nowrap text-right tabular">
                    {c.gold != null ? (
                      <span className="inline-flex items-center gap-1 text-gold">
                        <Coins className="h-3.5 w-3.5" aria-hidden />
                        {c.gold.toLocaleString("en")} GE
                      </span>
                    ) : (
                      <span className="text-fg-3">–</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {market.length > 0 && (
        <div>
          <h3 className="mb-2 flex items-center gap-2 font-display text-sm font-semibold uppercase tracking-wide text-fg-3">
            <Store className="h-4 w-4 text-gold/80" aria-hidden />
            On the Marketplace · {market.length}
          </h3>
          <ul className="grid grid-cols-[repeat(auto-fill,minmax(150px,1fr))] gap-2">
            {market.map((c) => (
              <li key={c.id}>
                <a
                  href={marketHref(c.market!)}
                  rel="noopener"
                  target="_blank"
                  className="panel block h-full overflow-hidden no-underline transition hover:brightness-125"
                >
                  {c.image && (
                    // eslint-disable-next-line @next/next/no-img-element -- remote Gaijin CDN thumbnail
                    <img src={c.image} alt="" loading="lazy" className="aspect-[16/9] w-full bg-black/30 object-cover" />
                  )}
                  <span className="block px-2 pt-1.5 text-xs text-fg-2" title={c.name}>
                    <span className="line-clamp-2">{c.name}</span>
                  </span>
                  <span className="block px-2 pb-1.5 font-display text-sm tabular text-gold">
                    {c.price != null ? gjn(c.price) : <span className="text-fg-3">No offers</span>}
                  </span>
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}
      <p className="text-xs text-fg-3">
        Game camouflages and their unlock conditions are from the game files; kills count in any mode unless a mode is
        named. Marketplace camouflages are made by players and traded for GJN{asOf ? `; prices as of ${asOf}` : ""}.
      </p>
    </div>
  );
}
