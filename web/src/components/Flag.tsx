import { nationName } from "@/lib/nations";

/**
 * The game's country icon (copied from the datamine by the ETL to /img/flags/).
 * Decorative by default; pass `labelled` where the nation's name isn't written next to it.
 */
export function Flag({
  nation,
  className = "h-3.5",
  labelled = false,
}: {
  nation: string;
  className?: string;
  labelled?: boolean;
}) {
  return (
    // eslint-disable-next-line @next/next/no-img-element -- static SVG icon
    <img
      src={`/img/flags/${nation}.svg`}
      width={100}
      height={66}
      alt={labelled ? nationName(nation) : ""}
      title={labelled ? nationName(nation) : undefined}
      className={`inline-block aspect-[100/66] w-auto shrink-0 rounded-[1px] shadow-[0_0_0_1px_rgb(0_0_0/0.4)] ${className}`}
      loading="lazy"
    />
  );
}
