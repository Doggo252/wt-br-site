import NextLink from "next/link";

/**
 * next/link without automatic prefetch. Next prefetches every link that scrolls into view,
 * and some pages here are large (an announcement page's payload can top 1 MB), so a home
 * page visit was pulling ~3 MB in the background. Static pages load quickly on click anyway.
 */
export default function Link(props: React.ComponentProps<typeof NextLink>) {
  return <NextLink prefetch={false} {...props} />;
}
