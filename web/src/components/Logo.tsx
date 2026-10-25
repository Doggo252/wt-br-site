/** Double chevron (a rank insignia pointing up: "uptier") plus wordmark. */
export function Logo() {
  return (
    <span className="inline-flex items-center gap-2">
      <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
        <path d="M4 13 12 6l8 7" fill="none" stroke="var(--color-gold)" strokeWidth="2.6" strokeLinecap="square" />
        <path
          d="M4 19 12 12l8 7"
          fill="none"
          stroke="var(--color-gold)"
          strokeOpacity="0.55"
          strokeWidth="2.6"
          strokeLinecap="square"
        />
      </svg>
      <span className="font-display text-lg font-bold tracking-[0.14em] text-fg">UPTIER</span>
    </span>
  );
}
