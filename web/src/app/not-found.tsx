import Link from "next/link";
import { SearchBox } from "@/components/SearchBox";

export default function NotFound() {
  return (
    <div className="max-w-xl">
      <h1 className="text-3xl font-bold">Page not found</h1>
      <p className="mt-2 text-fg-2">
        That page doesn&apos;t exist. If you followed a link to a vehicle, it may have been renamed in the game files.
      </p>
      <SearchBox className="mt-5" />
      <p className="mt-5">
        <Link href="/">Back to the home page</Link>
      </p>
    </div>
  );
}
