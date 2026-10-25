"use client";

import { useRouter } from "next/navigation";
import { loadIndex } from "./SearchBox";

/** Jumps to a random vehicle that's still in the game. */
export function RandomVehicle({ className = "" }: { className?: string }) {
  const router = useRouter();
  return (
    <button
      type="button"
      className={className}
      onClick={async () => {
        const rows = (await loadIndex()).filter((r) => !r[4]);
        const r = rows[Math.floor(Math.random() * rows.length)];
        if (r) router.push(`/vehicle/${r[0]}/`);
      }}
    >
      Random vehicle
    </button>
  );
}
