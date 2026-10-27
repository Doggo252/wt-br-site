/** News categories, from the post's URL on warthunder.com. `path` is the /news/<path>/ page. */
export const NEWS_KINDS = [
  { kind: "devblog", path: "devblogs", label: "Devblogs" },
  { kind: "event", path: "events", label: "Events" },
  { kind: "shop", path: "shop", label: "Shop and discounts" },
  { kind: "special", path: "specials", label: "Specials" },
  { kind: "fixes", path: "fixes", label: "It’s fixed" },
  { kind: "video", path: "videos", label: "Videos" },
  { kind: "news", path: "other", label: "Other news" },
] as const;

export const KIND_LABEL: Record<string, string> = {
  devblog: "Devblog",
  event: "Event",
  shop: "Shop",
  special: "Special",
  fixes: "It’s fixed",
  video: "Video",
  news: "News",
  esports: "Esports",
  community: "Community",
  update: "Update",
};
