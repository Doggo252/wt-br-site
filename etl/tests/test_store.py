from wtbr import store

WIDGET = """
<div class="showcase__item product-widget js-cart__cart-item  "
     data-cart-item-id="{id}"
>
  <div class="product-widget__poster product-widget-poster">
    <img class="js-lazy-load" data-src="https://static-store.gaijin.net/img/items/x.jpg" alt="" />
  </div>
  <div class="product-widget-description__game-label">
    <span class="inline-icon-label inline-icon-label_137"></span>
    War Thunder
  </div>
  <div class="product-widget-description__title">
    {title}
  </div>
  <div class="product-widget-description__short-description">
<ul>
<li><i class="flag usa"> </i></i><i class="flag rank-8"></i><i class="flag air"></i>F/A-18С Early</li>
<li><i class="premium-wt"></i>Premium account for 30 days</li>
</ul>
  </div>
  <div class="product-widget__price showcase-item-price">
    {price}
  </div>
"""


def test_parse_catalog_reads_prices_discounts_and_vehicles():
    page = WIDGET.format(
        id=14191,
        title="F/A-18С Early (US) Pack",
        price='<span class="showcase-item-price__default">\n $79.99\n </span>',
    ) + WIDGET.format(
        id=15386,
        title="Bundle",
        price='<span class="showcase-item-price__old">$15.98</span>'
        '<span class="showcase-item-price__new">$13.58</span>',
    )
    a, b = store.parse_catalog(page)
    assert (a.id, a.title, a.price, a.oldPrice, a.currency) == (
        14191, "F/A-18С Early (US) Pack", 79.99, None, "$"
    )  # fmt: skip
    assert a.vehicles == [("F/A-18С Early", "usa", "air")]
    assert a.contents == ["Premium account for 30 days"]
    assert (b.price, b.oldPrice) == (13.58, 15.98)


UNITS = [
    ("us_m1a1_hc_usmc", "ground", "usa", ["M1A1 Click-Bait", 'Gun M1A1 HC "Click-Bait"']),
    ("us_m1a1_hc_usmc_sm", "ground", "usa", ["◍M1A1 HC", "◍M1A1 HC"]),
    ("ussr_t_80u_yt", "ground", "ussr", ["␙T-80U", "␙T-80U"]),
    ("ussr_t_80ue1", "ground", "ussr", ["T-80U-E1", "T-80U-E1"]),
    ("ussr_is_6", "ground", "ussr", ["IS-6", "IS-6"]),
    ("saab_105oe", "air", "sweden", ["SAAB-105OE", "SAAB-105OE"]),
    ("saab_ja37di_f21", "air", "sweden", ["JA37DI F21", "JA37DI Viggen F21"]),
    ("p-51a", "air", "usa", ["P-51A", "P-51A Mustang"]),
    ("p-51d-20-na", "air", "usa", ["P-51D-20-NA", "P-51D-20-NA Mustang"]),
]


def matched(name, nation, branch):
    p = store.Product(0, "", None, None, "$", vehicles=[(name, nation, branch)])
    return store.match_vehicles([p], UNITS).get(0, [None])[0]


def test_store_names_match_units():
    assert matched('M1A1 HC "Click-Bait"', "usa", "ground") == "us_m1a1_hc_usmc"
    assert matched("M1A1 HC (Senrai Maidens)", "usa", "ground") == "us_m1a1_hc_usmc_sm"
    assert matched("T-80U-E1", "ussr", "ground") == "ussr_t_80ue1"
    assert matched("Tank IS-6", "ussr", "ground") == "ussr_is_6"
    assert matched("Saab JA 37DI Viggen F21", "sweden", "air") == "saab_ja37di_f21"
    assert matched("P-51D-20 'Mustang' aircraft", "usa", "air") == "p-51d-20-na"
    assert matched("Stingray II", "usa", "ground") is None
