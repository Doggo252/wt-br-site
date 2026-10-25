import { nationName } from "@/lib/nations";

/** The game's country icon (copied from the datamine by the ETL to /img/flags/). */
export function Flag({ nation, className = "h-3.5" }: { nation: string; className?: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element -- static SVG icon
    <img
      src={`/img/flags/${nation}.svg`}
      alt={nationName(nation)}
      className={`inline-block aspect-[100/66] w-auto shrink-0 rounded-[1px] shadow-[0_0_0_1px_rgb(0_0_0/0.4)] ${className}`}
      loading="lazy"
    />
  );
}
