import type { Metadata } from "next";
import Link from "next/link";
import { getMeta, getIndex } from "@/lib/data";
import { nationName } from "@/lib/nations";

export const metadata: Metadata = {
  title: "Ground forces",
  description: "War Thunder ground tech trees with current Battle Ratings for every nation.",
};

export default function GroundIndex() {
  const meta = getMeta();
  const index = getIndex().filter((u) => !u.removedIn);
  return (
    <div>
      <h1 className="text-3xl font-bold">Ground forces</h1>
      <p className="mt-2 text-fg-2">
        {index.length.toLocaleString("en")} vehicles across {meta.nations.length} nations, as of update{" "}
        <span className="font-display tabular text-fg">{meta.version}</span>.
      </p>
      <ul className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {meta.nations.map((n) => {
          const units = index.filter((u) => u.nation === n);
          return (
            <li key={n}>
              <Link
                href={`/ground/${n}/`}
                className="relative block border border-card-border bg-card-bg p-4 no-underline before:absolute before:inset-x-0 before:-top-px before:h-[2px] before:bg-card-top before:content-[''] hover:brightness-125"
              >
                <span className="block font-display text-lg font-semibold text-fg">{nationName(n)}</span>
                <span className="text-sm text-fg-3">{units.length} vehicles</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
