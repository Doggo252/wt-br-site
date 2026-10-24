# Uptier web

Next.js static export (App Router, TypeScript, Tailwind v4). `pnpm build` writes the site to `out/`.

```
pnpm install
pnpm dev      # http://localhost:3000, style guide at /design
pnpm build
pnpm lint
```

- Design tokens live in `src/app/globals.css` (`@theme`).
- Components live in `src/components/`.
- The game's glyph font is optional; see `public/fonts/README.md`.

This is Next.js 16. Its APIs differ from older versions; check `node_modules/next/dist/docs/` (see `AGENTS.md`).
