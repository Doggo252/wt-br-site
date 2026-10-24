/**
 * Up/down triangle drawn as SVG. The ▲▼ characters sit inside the WTSymbols
 * unicode-range, so text arrows would render as game glyphs.
 */
export function Arrow({ dir, className = "" }: { dir: "up" | "down"; className?: string }) {
  return (
    <svg
      viewBox="0 0 10 10"
      width="0.7em"
      height="0.7em"
      aria-hidden="true"
      className={`inline-block shrink-0 ${className}`}
      fill="currentColor"
    >
      {dir === "up" ? <path d="M5 1 9.5 9h-9z" /> : <path d="M5 9 .5 1h9z" />}
    </svg>
  );
}
