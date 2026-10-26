"""War Thunder packs on the Gaijin Store (store.gaijin.net), with their prices and discounts.

The store's catalog pages list each product as a widget: title, price (an old and a new one when
discounted), nation and rank, and a short contents list where vehicles are marked with nation
and branch icons. robots.txt allows the catalog. Prices are whatever the store shows to the
fetching region (US dollars from GitHub's runners).
"""

import html
import json
import re
import time
import unicodedata
import urllib.request
from dataclasses import asdict, dataclass, field
from datetime import UTC, datetime
from pathlib import Path

from .records import CYRILLIC_LOOKALIKES, GLYPHS

SITE = "https://store.gaijin.net"
CATALOG = SITE + "/catalog.php?category={category}&page={page}"
CATEGORIES = ("WarThunderPacks", "SpecOffers")
USER_AGENT = "UptierBot/0.1 (+https://github.com/Doggo252/wt-br-site)"
DELAY_S = 1.0
MAX_PAGES = 30

# Store flag classes -> our nations and branches.
NATIONS = {
    "usa": "usa", "germany": "germany", "de": "germany", "ussr": "ussr", "britain": "britain",
    "uk": "britain", "japan": "japan", "jp": "japan", "china": "china", "cn": "china",
    "italy": "italy", "it": "italy", "france": "france", "fr": "france", "sweden": "sweden",
    "se": "sweden", "israel": "israel", "il": "israel",
}  # fmt: skip
BRANCHES = {"air": "air", "tanks": "ground", "helicopters": "heli", "navy": "naval"}

WIDGET = re.compile(r'class="showcase__item product-widget[^"]*"\s+data-cart-item-id="(\d+)"')
TITLE = re.compile(r'product-widget-description__title">\s*(.*?)\s*</div>', re.S)
IMAGE = re.compile(r'product-widget__poster[^>]*>\s*<img[^>]*data-src="([^"]+)"', re.S)
PRICE = re.compile(r'showcase-item-price__(default|old|new)">\s*([^<]+?)\s*</span>', re.S)
ENDS = re.compile(r'data-remain-time-date="(\d+)"')
DESCRIPTION = re.compile(r'product-widget-description__short-description">(.*?)</div>', re.S)
ITEM = re.compile(r"<li>(.*?)</li>", re.S)
FLAGS = re.compile(r'<i class="flag ([a-z\-]+)"')
GAME = re.compile(r'game-label">.*?</span>\s*(.*?)\s*</div>', re.S)


@dataclass
class Product:
    id: int
    title: str
    price: float | None
    oldPrice: float | None  # noqa: N815 - matches the JSON
    currency: str
    image: str | None = None
    endsAt: int | None = None  # noqa: N815 - discount end, unix seconds
    vehicles: list[tuple[str, str | None, str | None]] = field(default_factory=list)
    contents: list[str] = field(default_factory=list)

    @property
    def url(self) -> str:
        return f"{SITE}/story.php?id={self.id}"


def _text(fragment: str) -> str:
    return " ".join(html.unescape(re.sub(r"<[^>]+>", " ", fragment)).split())


def _money(s: str) -> tuple[float | None, str]:
    m = re.search(r"([^\d\s.,]*)\s*([\d.,]+)\s*([^\d\s.,]*)", s)
    if not m:
        return None, ""
    return float(m.group(2).replace(",", "")), (m.group(1) or m.group(3)).strip()


def parse_catalog(page: str) -> list[Product]:
    """War Thunder products on one catalog page."""
    starts = [m.start() for m in WIDGET.finditer(page)] + [len(page)]
    out = []
    for i, m in enumerate(WIDGET.finditer(page)):
        w = page[m.start() : starts[i + 1]]
        game = GAME.search(w)
        if game and "War Thunder" not in _text(game.group(1)):
            continue
        prices = {k: _money(v) for k, v in PRICE.findall(w)}
        (price, currency) = prices.get("new") or prices.get("default") or (None, "")
        old = prices.get("old", (None, ""))[0]
        vehicles, contents = [], []
        desc = DESCRIPTION.search(w)
        for li in ITEM.findall(desc.group(1) if desc else ""):
            flags = FLAGS.findall(li)
            name = _text(li)
            if not name:
                continue
            nation = next((NATIONS[f] for f in flags if f in NATIONS), None)
            branch = next((BRANCHES[f] for f in flags if f in BRANCHES), None)
            if branch:
                vehicles.append((name, nation, branch))
            else:
                contents.append(name)
        title = TITLE.search(w)
        image = IMAGE.search(w)
        ends = ENDS.search(w)
        out.append(
            Product(
                id=int(m.group(1)),
                title=_text(title.group(1)) if title else "",
                price=price,
                oldPrice=old if old and price and old > price else None,
                currency=currency,
                image=image.group(1) if image else None,
                endsAt=int(ends.group(1)) if ends else None,
                vehicles=vehicles,
                contents=contents,
            )
        )
    return out


def _get(url: str) -> str:
    req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT, "Accept": "text/html"})
    with urllib.request.urlopen(req, timeout=60) as r:
        return r.read().decode("utf-8")


def fetch(cache: Path) -> list[Product]:
    """Read every catalog page of each category into cache/catalog.json."""
    cache.mkdir(parents=True, exist_ok=True)
    found: dict[int, Product] = {}
    for category in CATEGORIES:
        for page in range(1, MAX_PAGES + 1):
            time.sleep(DELAY_S)
            products = parse_catalog(_get(CATALOG.format(category=category, page=page)))
            new = [p for p in products if p.id not in found]
            for p in products:
                found.setdefault(p.id, p)
            if not new:
                break
    data = {
        "fetched": datetime.now(UTC).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "products": [asdict(p) for p in found.values()],
    }
    (cache / "catalog.json").write_text(json.dumps(data, ensure_ascii=False, indent=1))
    return list(found.values())


def load(cache: Path) -> tuple[str, list[Product]] | None:
    f = cache / "catalog.json"
    if not f.exists():
        return None
    data = json.loads(f.read_text(encoding="utf-8"))
    products = []
    for p in data["products"]:
        p["vehicles"] = [tuple(v) for v in p.get("vehicles", [])]
        products.append(Product(**p))
    return data["fetched"], products


# Words the store adds around vehicle names ("Tank IS-6", "P-51D-20 'Mustang' aircraft").
FILLER = {"tank", "fighter", "plane", "aircraft", "helicopter", "bomber", "pack"}
MIN_COVERAGE = 0.5


def _words(name: str) -> list[str]:
    """'Tank IS-6' -> ['is6']; 'M1A1 HC (Senrai Maidens)' -> ['m1a1', 'hc', 'senrai', 'maidens']."""
    name = unicodedata.normalize("NFKD", GLYPHS.sub("", name.translate(CYRILLIC_LOOKALIKES)))
    name = "".join(c for c in name if not unicodedata.combining(c)).lower()
    name = re.sub(r"[-/.'’]", "", name)
    return [w for w in re.split(r"[^a-z0-9]+", name) if w and w not in FILLER]


def _same(a: str, b: str) -> float:
    """1 for equal words, 0.75 when one extends the other with letters ("p51d20" / "p51d20na",
    not "saab" / "saab105oe")."""
    if a == b:
        return 1.0
    short, long = sorted((a, b), key=len)
    return (
        0.75 if len(short) >= 3 and long.startswith(short) and long[len(short)].isalpha() else 0.0
    )


def _coverage(store_words: list[str], unit_words: list[str]) -> float:
    """How much of the unit's name the store's name contains, 0-1."""
    if not unit_words:
        return 0.0
    # The whole name inside the store's, word breaks aside ("JA37DI Viggen F21" in "Saab JA 37DI
    # Viggen F21").
    if len("".join(unit_words)) >= 4 and "".join(unit_words) in "".join(store_words):
        return 1.0
    return sum(max((_same(u, w) for w in store_words), default=0) for u in unit_words) / len(
        unit_words
    )


def match_vehicles(
    products: list[Product], units: list[tuple[str, str, str, list[str]]]
) -> dict[int, list[str]]:
    """Product id -> unit ids. `units` is (id, branch, nation, names) for the vehicles a pack can
    hold (premiums). Each vehicle a pack lists goes to the unit of that nation and branch whose
    name it covers best: the share of the unit's name words found in the store's name, taking
    the better of its short and full names, with ties going to an exact name and then to the unit
    sharing more words."""
    out: dict[int, list[str]] = {}
    for p in products:
        ids: list[str] = []
        for name, nation, branch in p.vehicles:
            words = _words(name)
            pool = [u for u in units if u[1] == branch and u[2] == nation]
            if "senrai" in words:  # anime-skin versions are separate units (`_sm`)
                pool = [u for u in pool if u[0].endswith("_sm")]
            best, best_score = None, (0.0, False, 0.0)
            for uid, _, _, names in pool:
                unit_words = [_words(n) for n in names]
                cover = max(_coverage(words, uw) for uw in unit_words)
                exact = any("".join(uw) == "".join(words) for uw in unit_words)
                shared = sum(
                    max((_same(w, t) for uw in unit_words for t in uw), default=0.0) for w in words
                )
                if (cover, exact, shared) > best_score:
                    best, best_score = uid, (cover, exact, shared)
            if best and best_score[0] >= MIN_COVERAGE and best not in ids:
                ids.append(best)
        if ids:
            out[p.id] = ids
    return out
