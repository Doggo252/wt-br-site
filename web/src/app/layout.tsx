import type { Metadata } from "next";
import Link from "@/components/Link";
import "@fontsource/fira-sans-condensed/400.css";
import "@fontsource/fira-sans-condensed/500.css";
import "@fontsource/fira-sans-condensed/600.css";
import "@fontsource/fira-sans-condensed/700.css";
import "@fontsource/pt-sans/400.css";
import "@fontsource/pt-sans/700.css";
import "./globals.css";
import { SITE_URL } from "@/lib/site";
import { Logo } from "@/components/Logo";
import {
  Compass,
  Crosshair,
  GitCompareArrows,
  Code,
  History,
  Info,
  Megaphone,
  Palette,
  Rss,
  ScrollText,
  Star,
  Store,
  Swords,
} from "lucide-react";
import { RandomVehicle } from "@/components/RandomVehicle";
import { NavLinks } from "@/components/NavLinks";
import { SearchBox } from "@/components/SearchBox";

const FOOT = "inline-flex items-center gap-2";
const ICON = "h-3.5 w-3.5 text-fg-3";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: "Uptier — War Thunder BR history", template: "%s · Uptier" },
  description: "Battle Rating history for every War Thunder vehicle, patch by patch.",
  openGraph: {
    siteName: "Uptier",
    type: "website",
    images: [{ url: "/og.png", width: 1200, height: 630, alt: "Uptier: every BR change, patch by patch." }],
  },
  twitter: { card: "summary_large_image" },
  alternates: { types: { "application/atom+xml": [{ url: "/feed.xml", title: "Uptier BR changes" }] } },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className="flex min-h-dvh flex-col overflow-x-clip">
        <header className="sticky top-0 z-40 border-b border-[#2a333b] bg-[#161b21]/90 backdrop-blur supports-[backdrop-filter]:bg-[#161b21]/75">
          <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-6 gap-y-2 px-4 pb-2 sm:flex-nowrap sm:pb-0">
            <Link href="/" className="py-2.5" aria-label="Uptier home">
              <Logo />
            </Link>
            <NavLinks />
            <SearchBox shortcut className="order-last w-full sm:order-none sm:ml-auto sm:w-60" />
          </div>
          {/* Thin gold rule, brightest in the middle. */}
          <div
            aria-hidden
            className="h-px bg-[linear-gradient(90deg,transparent,rgb(249_219_120/0.35),transparent)]"
          />
        </header>
        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:py-10">{children}</main>
        <footer className="mt-12 border-t border-[#2a333b] bg-[#14181d]">
          <div className="mx-auto grid max-w-6xl gap-8 px-4 py-8 text-sm sm:grid-cols-[2fr_1fr_1fr]">
            <div className="space-y-2">
              <Logo />
              <p className="max-w-sm text-fg-3">
                Battle Rating history for every War Thunder vehicle, patch by patch, rebuilt daily from the game files.
              </p>
            </div>
            <nav aria-label="Footer" className="grid content-start gap-1.5">
              <span className="eyebrow mb-1 text-fg-3">Browse</span>
              <Link href="/updates/" className={FOOT}><History className={ICON} aria-hidden />Updates</Link>
              <Link href="/patch-notes/" className={FOOT}><ScrollText className={ICON} aria-hidden />Patch notes</Link>
              <Link href="/market/" className={FOOT}><Store className={ICON} aria-hidden />Market prices</Link>
              <Link href="/announcements/" className={FOOT}><Megaphone className={ICON} aria-hidden />Planned changes</Link>
              <Link href="/compare/" className={FOOT}><GitCompareArrows className={ICON} aria-hidden />Compare</Link>
              <Link href="/lineup/" className={FOOT}><Swords className={ICON} aria-hidden />Lineup planner</Link>
              <Link href="/shells/" className={FOOT}><Crosshair className={ICON} aria-hidden />Shell penetration</Link>
              <Link href="/watchlist/" className={FOOT}><Star className={ICON} aria-hidden />Your watchlist</Link>
              <RandomVehicle className={`${FOOT} text-left text-link hover:underline`} />
              <Link href="/explore/" className={FOOT}><Compass className={ICON} aria-hidden />Explore</Link>
            </nav>
            <nav aria-label="About" className="grid content-start gap-1.5">
              <span className="eyebrow mb-1 text-fg-3">Site</span>
              <Link href="/about/" className={FOOT}><Info className={ICON} aria-hidden />About and sources</Link>
              <Link href="/design/" className={FOOT}><Palette className={ICON} aria-hidden />Style guide</Link>
              <a href="/feed.xml" className={FOOT}><Rss className={ICON} aria-hidden />Atom feed</a>
              <a href="https://github.com/Doggo252/wt-br-site" className={FOOT}><Code className={ICON} aria-hidden />Source code</a>
            </nav>
          </div>
          <div className="border-t border-[#22292f]">
            <p className="mx-auto max-w-6xl px-4 py-4 text-xs text-fg-3">
              Uptier is a fan site and is not affiliated with or endorsed by Gaijin Entertainment. War Thunder and
              related names and images are trademarks of Gaijin. Game data from the{" "}
              <a href="https://github.com/gszabi99/War-Thunder-Datamine">War Thunder Datamine</a>.
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}
