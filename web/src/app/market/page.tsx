import type { Metadata } from "next";
import { MarketBrowser } from "@/components/MarketBrowser";

export const metadata: Metadata = {
  title: "Gaijin Market prices",
  description:
    "Prices for War Thunder event vehicles, skins, decals and trophies on the Gaijin Market, with price drops and links to trade.",
};

export default function MarketPage() {
  return (
    <div className="space-y-6">
      <header>
        <p className="eyebrow">Gaijin Market</p>
        <h1 className="mt-1 text-4xl font-bold">Market prices</h1>
        <p className="mt-2 max-w-2xl text-fg-2">
          Every War Thunder item on the Gaijin Market: event vehicles, skins, decals, trophies and keys. Each links to
          its market page, and vehicles and skins link to the vehicle here.
        </p>
      </header>
      <MarketBrowser />
    </div>
  );
}
