import type { Metadata } from "next";
import Link from "@/components/Link";
import { SHOP_TABS, SectionTabs } from "@/components/SectionTabs";
import { PremiumBrowser, type PremiumRow } from "@/components/PremiumBrowser";
import { getIndex, getStore } from "@/lib/data";

export const metadata: Metadata = {
  title: "Premium vehicles and prices",
  description:
    "Every War Thunder premium vehicle with its price: Golden Eagles in game, Gaijin Store packs in dollars (with discounts) and Gaijin Market offers.",
};

export default function PremiumsPage() {
  const store = getStore();
  const rows: PremiumRow[] = getIndex()
    // SAM launcher trucks (`_launcher`, "TEL") come with their system's command vehicle.
    .filter((u) => u.status === "premium" && !u.removedIn && u.branch !== "naval" && !u.id.endsWith("_launcher"))
    .map((u) => {
      const pack = store?.packs.find((p) => p.price === u.storePrice && (p.units ?? []).includes(u.id));
      return {
        id: u.id,
        name: u.name,
        nation: u.nation,
        branch: u.branch as PremiumRow["branch"],
        type: u.type,
        br: u.br,
        image: !!u.image,
        ge: u.hidden ? null : (u.geCost ?? null),
        store: u.storePrice ?? null,
        storeOld: pack?.oldPrice ?? null,
        market: u.marketPrice ?? null,
      };
    });
  return (
    <div className="space-y-6">
      <header>
        <p className="eyebrow">Shop</p>
        <h1 className="mt-1 text-4xl font-bold">Premium vehicles</h1>
        <p className="mt-2 max-w-2xl text-fg-2">
          Every premium and what it costs: Golden Eagles in the in-game shop, a pack on the Gaijin Store, or an offer on
          the Gaijin Market. Packs usually include premium time and Golden Eagles too.{" "}
          <Link href="/deals/">See current discounts →</Link> Which earns the most?{" "}
          <Link href="/economy/">Compare their Silver Lion multipliers →</Link>
        </p>
      </header>
      <SectionTabs label="Shop" tabs={SHOP_TABS} current="/premiums/" />
      <PremiumBrowser rows={rows} />
      <p className="text-xs text-fg-3">
        Store prices in US dollars{store ? `, read ${store.fetched.slice(0, 10)}` : ""}; your region may differ. Golden
        Eagle prices are before any in-game sale. Event vehicles are on the{" "}
        <Link href="/market/">market page</Link>.
      </p>
    </div>
  );
}
