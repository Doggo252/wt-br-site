import Link from "next/link";
import { SearchBox } from "@/components/SearchBox";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-xl py-10 text-center">
      <p className="font-display text-8xl font-bold leading-none text-gold/80">404</p>
      <h1 className="mt-4 text-3xl font-bold">Page not found</h1>
      <p className="mt-2 text-fg-2">
        That page doesn&apos;t exist. If you followed a link to a vehicle, it may have been renamed in the game files.
      </p>
      <SearchBox className="mx-auto mt-6 max-w-sm text-left" />
      <div className="mt-6 flex flex-wrap justify-center gap-2">
        <Link href="/" className="btn">
          Home
        </Link>
        <Link href="/ground/" className="btn">
          Ground trees
        </Link>
        <Link href="/updates/" className="btn">
          Updates
        </Link>
      </div>
    </div>
  );
}
