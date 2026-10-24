import type { MetadataRoute } from "next";
import { getIndex, getMeta, getVersions } from "@/lib/data";
import { SITE_URL } from "@/lib/site";

export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  const meta = getMeta();
  const url = (path: string) => `${SITE_URL}${path}`;
  const lastModified = meta.date;
  return [
    { url: url("/"), lastModified, priority: 1 },
    { url: url("/ground/"), lastModified },
    { url: url("/updates/"), lastModified },
    { url: url("/records/"), lastModified },
    { url: url("/explore/"), lastModified },
    { url: url("/about/") },
    ...meta.nations.map((n) => ({ url: url(`/ground/${n}/`), lastModified })),
    ...getIndex().map((u) => ({ url: url(`/vehicle/${u.id}/`), lastModified })),
    ...getVersions().map((v) => ({ url: url(`/updates/${v.v}/`), lastModified: v.d })),
  ];
}
