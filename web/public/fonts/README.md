# WTSymbols font

Vehicle names in War Thunder use private glyphs (country and event markers such as `◍`, `␠`, `▂`, `␙`). The game draws them from `symbols_skyquake.ttf`.

That font is **not** in the War Thunder Datamine. The datamine only has the index of the game's packed font archive, `gui.vromfs.bin_u/idx/ui/fonts.vromfs.bin`, which lists `ttfs/…symbols_skyquake…`. The font itself ships with the game client in `ui/fonts.vromfs.bin`.

## Adding it

1. From a War Thunder install, unpack `ui/fonts.vromfs.bin` with a vromfs unpacker (for example, wt-tools' `vromfs_unpacker`).
2. Copy `symbols_skyquake.ttf` here. Optionally, also save a subset WOFF2 as `wt-symbols.woff2`, which is smaller and preferred:
   ```
   pyftsubset symbols_skyquake.ttf --unicodes="U+2415-2420,U+22E0,U+2580-25E5,U+2622,U+F059" \
     --flavor=woff2 --output-file=wt-symbols.woff2
   ```
3. Reload `/design`. The "Name glyphs" section reports whether the font loaded.

Until the file is here, the glyphs fall back to system fonts and the site still works.

Redistributing a game font is a licensing gray area; see PLAN.md §2 before shipping it publicly.
