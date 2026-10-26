import Link from "@/components/Link";
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
  /** Vehicle class (UnitSummary.type), shown as a small badge. */
  type?: string;
  /** Gaijin Market price in GJN, shown instead of the class badge. */
  price?: number;
  /** Any other price ("$59.99", "6,590 GE"), shown the same way when there is no market price. */
  cost?: string;
  costTitle?: string;
};

const TYPE_ABBR: Record<string, string> = {
  light_tank: "LT",
  medium_tank: "MT",
  heavy_tank: "HT",
  tank_destroyer: "TD",
  spaa: "AA",
  fighter: "FTR",
  strike: "ATK",
  bomber: "BMR",
  attack_helicopter: "AH",
  utility_helicopter: "UH",
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
  type,
  price,
  cost,
  costTitle,
}: UnitCardProps) {
  const inactive = availability !== "current";
  const changed = previousRank !== undefined && previousRank !== rank;
  const dir = changed ? (rank > previousRank ? "up" : "down") : null;
  const tag = TAG[availability] ?? TAG[status];

  const body = (
    <>
      <div className="relative aspect-[2/1] w-full overflow-hidden bg-[radial-gradient(ellipse_70%_60%_at_50%_60%,rgb(255_255_255/0.07),transparent_70%)]">
        {image ? (
          // eslint-disable-next-line @next/next/no-img-element -- static export, images are pre-sized
          <img
            src={image}
            alt=""
            loading="lazy"
            className={`h-full w-full object-contain drop-shadow-[0_4px_6px_rgb(0_0_0/0.5)] transition-transform duration-200 group-hover:scale-[1.04] ${inactive ? "opacity-45 grayscale" : ""}`}
          />
        ) : (
          <TankSilhouette />
        )}
        {(price != null || cost) && !inactive ? (
          <span
            className="absolute left-1 top-1 rounded-sm bg-black/65 px-1 font-display text-[10px] tabular text-gold"
            title={price != null ? "Lowest offer on the Gaijin Market" : costTitle}
          >
            {price != null ? `${price.toLocaleString("en", { maximumFractionDigits: price < 100 ? 2 : 0 })} GJN` : cost}
          </span>
        ) : (
          (tag || (type && TYPE_ABBR[type])) && (
            <span className="absolute left-1 top-1 rounded-sm bg-black/55 px-1 font-display text-[10px] uppercase tracking-wide text-fg-2">
              {tag ?? TYPE_ABBR[type!]}
            </span>
          )
        )}
        {dir && previousRank !== undefined && (
          <span
            className={`absolute right-1 top-1 inline-flex items-center gap-0.5 rounded-sm bg-black/60 px-1 font-display text-[11px] font-semibold tabular ${dir === "up" ? "text-bad" : "text-good"}`}
          >
            <Arrow dir={dir} />
            {formatBrDelta(previousRank, rank)}
          </span>
        )}
      </div>
      <div className="flex items-center justify-between gap-1.5 border-t border-black/30 bg-black/20 px-1.5 py-1">
        <span
          className={`min-w-0 truncate font-display text-[13px] leading-tight ${inactive ? "text-fg-3" : NAME_COLOR[status]}`}
          title={name}
        >
          {name}
        </span>
        <span className="shrink-0 rounded-sm bg-black/35 px-1 font-display text-[12px] font-semibold leading-[1.3] tabular text-fg">
          {formatBr(rank)}
        </span>
      </div>
    </>
  );

  const className = [
    "group relative block w-full min-w-[120px] max-w-[180px] overflow-hidden border",
    "before:absolute before:inset-x-0 before:top-0 before:z-10 before:h-[2px] before:content-['']",
    PALETTE[inactive ? "disabled" : status],
    "bg-[image:linear-gradient(180deg,rgb(255_255_255/0.05),transparent_45%)] shadow-[0_6px_16px_-10px_rgb(0_0_0/0.9)]",
    selected ? "outline outline-1 outline-fg" : "",
    href
      ? "transition duration-150 hover:-translate-y-px hover:brightness-125 hover:shadow-[0_8px_22px_-10px_rgb(23_203_252/0.35)] focus-visible:brightness-125"
      : "",
  ].join(" ");

  const label = `${name}, BR ${formatBr(rank)}${tag ? `, ${tag}` : ""}${price != null ? `, ${price} GJN on the Gaijin Market` : cost ? `, ${cost}` : ""}${
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
