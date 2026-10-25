"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

/** Left/right arrow keys go to the previous/next page, unless focus is in a form control. */
export function ArrowKeyNav({ prev, next }: { prev?: string | null; next?: string | null }) {
  const router = useRouter();
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.altKey || e.ctrlKey || e.metaKey || e.shiftKey) return;
      const t = e.target as HTMLElement;
      if (t.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(t.tagName)) return;
      if (t.closest("[role=radiogroup], [role=tablist], [role=slider]")) return;
      const href = e.key === "ArrowLeft" ? prev : e.key === "ArrowRight" ? next : null;
      if (href) router.push(href);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [prev, next, router]);
  return null;
}
