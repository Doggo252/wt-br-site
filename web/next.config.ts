import type { NextConfig } from "next";
import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";

// A build ID derived from the site commit and the data version, so rebuilding with nothing new
// produces identical files and Firebase Hosting has nothing to upload.
function buildId(): string {
  const meta = "../data/meta.json";
  const dataVersion = existsSync(meta) ? JSON.parse(readFileSync(meta, "utf8")).commit : "no-data";
  const site = process.env.GITHUB_SHA ?? "local";
  return createHash("sha256").update(`${site}:${dataVersion}`).digest("hex").slice(0, 16);
}

const nextConfig: NextConfig = {
  // Fully static site: `next build` writes HTML/JS/CSS to out/ for Firebase Hosting.
  output: "export",
  // /vehicle/foo -> /vehicle/foo/index.html, which static hosts serve without rewrites.
  trailingSlash: true,
  images: { unoptimized: true },
  generateBuildId: async () => buildId(),
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
