import Link from "next/link";

// Placeholder until step 3 adds the latest-update hero.
export default function Home() {
  return (
    <section className="max-w-2xl">
      <h1 className="text-4xl font-bold">Every BR change, patch by patch.</h1>
      <p className="mt-3 text-fg-2">
        Uptier tracks the Battle Rating history of every War Thunder vehicle. Vehicle pages, the tech tree time machine
        and per-update diffs are on the way.
      </p>
      <p className="mt-6">
        <Link href="/design/">See the design system →</Link>
      </p>
    </section>
  );
}
