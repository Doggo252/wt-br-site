"""Build public/fonts/wt-blank.woff2: a zero-width font covering the WTSymbols range.

It is the last fallback in the WTSymbols @font-face, so without the game's
symbols_skyquake.ttf the private glyphs in vehicle names vanish instead of
rendering as boxes. Run: python3 scripts/make_blank_glyphs.py (needs fonttools, brotli).
"""

from pathlib import Path

from fontTools.fontBuilder import FontBuilder
from fontTools.pens.ttGlyphPen import TTGlyphPen

RANGES = [(0x2415, 0x2420), (0x22E0, 0x22E0), (0x2580, 0x25E5), (0x2622, 0x2622), (0xF059, 0xF059)]
OUT = Path(__file__).resolve().parent.parent / "public" / "fonts" / "wt-blank.woff2"

codes = [c for lo, hi in RANGES for c in range(lo, hi + 1)]
fb = FontBuilder(1000, isTTF=True)
fb.setupGlyphOrder([".notdef", "blank"])
fb.setupCharacterMap({c: "blank" for c in codes})
# Browsers reject a font whose glyf table is empty, so .notdef gets a small box.
pen = TTGlyphPen(None)
pen.moveTo((50, 0))
pen.lineTo((50, 500))
pen.lineTo((450, 500))
pen.lineTo((450, 0))
pen.closePath()
fb.setupGlyf({".notdef": pen.glyph(), "blank": TTGlyphPen(None).glyph()})
fb.setupHorizontalMetrics({".notdef": (500, 50), "blank": (0, 0)})
fb.setupHorizontalHeader(ascent=800, descent=-200)
fb.setupNameTable({"familyName": "WTBlank", "styleName": "Regular"})
fb.setupOS2(sTypoAscender=800, sTypoDescender=-200, usWinAscent=800, usWinDescent=200)
fb.setupPost()
fb.font.flavor = "woff2"
fb.save(OUT)
print(OUT, OUT.stat().st_size, "bytes")
