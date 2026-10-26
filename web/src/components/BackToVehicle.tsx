"use client";

import { useEffect, useState } from "react";
import Link from "@/components/Link";

/**
 * On an update page opened from a vehicle's history (?from=<id>): a link back to that vehicle,
 * and its row highlighted and scrolled into view.
 */
export function BackToVehicle({ names }: { names: Record<string, string> }) {
  const [from, setFrom] = useState<string | null>(null);

  useEffect(() => {
    const id = new URLSearchParams(window.location.search).get("from");
    // eslint-disable-next-line react-hooks/set-state-in-effect -- the URL only exists on the client
    if (id && /^[\w.-]+$/.test(id)) setFrom(id);
  }, []);

  useEffect(() => {
    if (!from) return;
    document.querySelector(`[data-unit="${CSS.escape(from)}"]`)?.scrollIntoView({ block: "center" });
  }, [from]);

  if (!from) return null;
  return (
    <>
      <style>{`[data-unit="${CSS.escape(from)}"] { background: rgb(249 219 120 / 0.12); box-shadow: inset 3px 0 0 var(--color-gold); }`}</style>
      <Link href={`/vehicle/${from}/`} className="btn">
        ← Back to {names[from] ?? from}
      </Link>
    </>
  );
}
