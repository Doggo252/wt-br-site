"use client";

import { Dices } from "lucide-react";
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
      <Dices className="h-3.5 w-3.5 text-fg-3" aria-hidden />
      Random vehicle
    </button>
  );
}
