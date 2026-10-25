/** Small vehicle image for table rows (images are 2:1). */
export function Thumb({ id, image }: { id: string; image?: boolean }) {
  return image ? (
    // eslint-disable-next-line @next/next/no-img-element -- static export
    <img
      src={`/img/units/${id}.webp`}
      alt=""
      loading="lazy"
      className="h-6 w-12 shrink-0 object-contain drop-shadow-[0_2px_2px_rgb(0_0_0/0.6)]"
    />
  ) : (
    <span className="h-6 w-12 shrink-0" />
  );
}
