import type { Branch } from "@/lib/branches";

/** Small silhouettes for the three branches (24×24, currentColor). */
const PATHS: Record<Branch, string> = {
  ground: "M2 15h20l-1.5 3.5h-17zM5 11h11l1.5 4h-14zM14 11.6h8v1.6h-8zM8 8h6v3H8zM3 18.5h18a1.75 1.75 0 0 1 0 3.5H3a1.75 1.75 0 0 1 0-3.5z",
  air: "M11 2h2l1 7 8 4v2l-8-2-.6 5.5 2.6 2v1.5L12 21l-4 1v-1.5l2.6-2L10 13l-8 2v-2l8-4z",
  heli: "M2 4h20v1.4H2zM11.3 5.4h1.4v2.2h-1.4zM6 8h9a5 5 0 0 1 5 5v1.5H11L6 12zM2 9.5l4 1.6V13L2 11.5zM8 16h11v1.4H8zM10 14.5h1.4V16H10zM16 14.5h1.4V16H16z",
};

export function BranchIcon({ branch, className = "h-4 w-4" }: { branch: Branch; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden="true">
      <path d={PATHS[branch]} />
    </svg>
  );
}
