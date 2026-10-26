import { getMarket, getUnitMap } from "@/lib/data";

export const dynamic = "force-static";

/**
 * Compact Gaijin Market list for the market page:
 * [name, title, kind, unit id, unit display name, country, price, buy, sellers, buyers, icon, quality,
 *  previous price (from the snapshot before, or 0)]
 */
export function GET() {
  const m = getMarket();
  const units = getUnitMap();
  const rows = (m?.items ?? []).map((i) => {
    const h = i.history ?? [];
    const prev = h.length > 1 ? (h[h.length - 2].price ?? 0) : 0;
    return [
      i.name,
      i.title,
      i.kind,
      i.unit ?? "",
      i.unit ? (units.get(i.unit)?.name ?? "") : "",
      i.country ?? "",
      i.price ?? 0,
      i.buy ?? 0,
      i.sellers ?? 0,
      i.buyers ?? 0,
      i.icon ?? "",
      i.quality ?? "",
      prev,
    ];
  });
  return Response.json({ snapshot: m?.snapshot ?? null, snapshots: m?.snapshots ?? [], rows });
}
