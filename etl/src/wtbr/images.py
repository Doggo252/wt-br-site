"""Mirror vehicle images from the official encyclopedia CDN as WebP.

The CDN keys are lower-case IDs: images/<id.lower()>.png (512x256).
"""

import io
import urllib.error
import urllib.request
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

from PIL import Image

CDN = "https://static.encyclopedia.warthunder.com/images/{}.png"
USER_AGENT = "UptierBot/0.1 (+https://github.com/Doggo252/wt-br-site)"


def _fetch(uid: str, dest: Path) -> str:
    out = dest / f"{uid}.webp"
    if out.exists():
        return "cached"
    req = urllib.request.Request(CDN.format(uid.lower()), headers={"User-Agent": USER_AGENT})
    try:
        with urllib.request.urlopen(req, timeout=30) as r:
            data = r.read()
    except urllib.error.HTTPError as e:
        return "missing" if e.code in (403, 404) else f"error {e.code}"
    except OSError as e:
        return f"error {e}"
    img = Image.open(io.BytesIO(data))
    img.save(out, "WEBP", quality=80, method=4)
    return "fetched"


def mirror(ids: list[str], dest: Path, workers: int = 8) -> dict[str, list[str]]:
    dest.mkdir(parents=True, exist_ok=True)
    results: dict[str, list[str]] = {}
    with ThreadPoolExecutor(workers) as pool:
        for uid, res in zip(ids, pool.map(lambda u: _fetch(u, dest), ids), strict=True):
            results.setdefault(res, []).append(uid)
    return results


def copy_flags(datamine_dir: Path, icons_rel: str, dest: Path) -> int:
    """The game's country icons (gameuiskin/country_<nation>.svg) -> img/flags/<nation>.svg."""
    import re

    dest.mkdir(parents=True, exist_ok=True)
    n = 0
    for f in (datamine_dir / icons_rel).glob("country_*.svg"):
        m = re.fullmatch(r"country_([a-z_]+)\.svg", f.name)
        if m and not m.group(1).endswith(("_round", "_modern")):
            (dest / f"{m.group(1)}.svg").write_text(
                strip_svg_metadata(f.read_text(encoding="utf-8")), encoding="utf-8"
            )
            n += 1
    return n


def strip_svg_metadata(svg: str) -> str:
    """Drop the editor's <metadata> block (Adobe XMP), most of each icon's bytes."""
    import re

    return re.sub(r"\s*<metadata>.*?</metadata>", "", svg, flags=re.S)
