import Link from "next/link";
import { Arrow } from "./Arrow";
import { formatBr, formatBrDelta } from "@/lib/br";
import type { Availability, UnitStatus } from "@/lib/units";

export type UnitCardProps = {
  name: string;
  /** Raw economic rank for the selected mode. */
  rank: number;
  status?: UnitStatus;
  availability?: Availability;
  /** Rank at the previous version; set when this version changed the BR. */
  previousRank?: number;
  selected?: boolean;
  image?: string;
  href?: string;
};

/** Card palettes from unitcard.css: background / 1px border / 2px top line. */
const PALETTE: Record<UnitStatus | "disabled", string> = {
  tree: "bg-card-bg border-card-border before:bg-card-top",
  premium: "bg-card-premium-bg border-card-premium-border before:bg-card-premium-top",
  event: "bg-card-premium-bg border-card-premium-border before:bg-card-premium-top",
  squadron: "bg-card-squadron-bg border-card-squadron-border before:bg-card-squadron-top",
  disabled: "bg-card-disabled-bg border-card-disabled-border before:bg-card-disabled-top",
};

const NAME_COLOR: Record<UnitStatus, string> = {
  tree: "text-fg",
  premium: "text-premium",
  event: "text-premium",
  squadron: "text-squadron",
};

const TAG: Partial<Record<UnitStatus | Availability, string>> = {
  event: "Event",
  unobtainable: "Unobtainable",
  removed: "Removed",
  notYet: "Not yet added",
};

export function UnitCard({
  name,
  rank,
  status = "tree",
  availability = "current",
  previousRank,
  selected = false,
  image,
  href,
}: UnitCardProps) {
  const inactive = availability !== "current";
  const changed = previousRank !== undefined && previousRank !== rank;
  const dir = changed ? (rank > previousRank ? "up" : "down") : null;
  const tag = TAG[availability] ?? TAG[status];

  const body = (
    <>
      <div className="relative aspect-[2/1] w-full overflow-hidden">
        {image ? (
          // eslint-disable-next-line @next/next/no-img-element -- static export, images are pre-sized
          <img
            src={image}
            alt=""
            loading="lazy"
            className={`h-full w-full object-contain ${inactive ? "opacity-50 grayscale" : ""}`}
          />
        ) : (
          <TankSilhouette />
        )}
        {tag && (
          <span className="absolute left-1 top-1 rounded-sm bg-bg/80 px-1 font-display text-[10px] uppercase tracking-wide text-fg-2">
            {tag}
          </span>
        )}
        {dir && previousRank !== undefined && (
          <span
            className={`absolute right-1 top-1 inline-flex items-center gap-0.5 rounded-sm bg-bg/80 px-1 font-display text-[11px] tabular ${dir === "up" ? "text-bad" : "text-good"}`}
          >
            <Arrow dir={dir} />
            {formatBrDelta(previousRank, rank)}
          </span>
        )}
      </div>
      <div className="flex items-baseline justify-between gap-2 px-1.5 pb-1 pt-0.5">
        <span
          className={`min-w-0 truncate font-display text-[13px] leading-tight ${inactive ? "text-fg-3" : NAME_COLOR[status]}`}
          title={name}
        >
          {name}
        </span>
        <span className="shrink-0 font-display text-[13px] font-semibold tabular text-fg-2">
          {formatBr(rank)}
        </span>
      </div>
    </>
  );

  const className = [
    "group relative block w-full min-w-[120px] max-w-[180px] border",
    "before:absolute before:inset-x-0 before:-top-px before:h-[2px] before:content-['']",
    PALETTE[inactive ? "disabled" : status],
    selected ? "outline outline-1 outline-fg" : "",
    href ? "transition-[filter] hover:brightness-125 focus-visible:brightness-125" : "",
  ].join(" ");

  const label = `${name}, BR ${formatBr(rank)}${tag ? `, ${tag}` : ""}${
    dir && previousRank !== undefined ? `, changed from ${formatBr(previousRank)}` : ""
  }`;

  return href ? (
    <Link href={href} className={`${className} no-underline`} aria-label={label} aria-current={selected || undefined}>
      {body}
    </Link>
  ) : (
    <div className={className} aria-label={label} role="group">
      {body}
    </div>
  );
}

/** Placeholder until vehicle images are mirrored in step 2. */
function TankSilhouette() {
  return (
    <svg viewBox="0 0 120 60" className="h-full w-full text-fg/10" aria-hidden="true" fill="currentColor">
      <path d="M22 38h76l6 8H16zM34 28h40l6 10H30zM74 31h34v3H74zM18 46h84a6 6 0 0 1 0 8H18a6 6 0 0 1 0-8z" />
    </svg>
  );
}
