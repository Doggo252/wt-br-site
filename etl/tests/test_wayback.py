import json

from wtbr import wayback
from wtbr.build import _early_history
from wtbr.models import Ranks, UnitDetail

SEP = '</span><span class="ttx-unvisible ttx-value">/</span>'
INFOBOX = (
    '<div class="ttx-table-line"><span class="ttx-sb ttx-value">{sb}' + SEP
    + '<span class="ttx-rb ttx-value">{rb}' + SEP + '<span class="ttx-ab ttx-value">{ab}</span>'
    '<span class="ttx-name"><span title="Battle ratings" style="cursor: help">BR</span></span></div>'
)  # fmt: skip


def capture(ts: str, page: str, ab: float, rb: float, sb: float) -> dict:
    return {"ts": ts, "page": page, "snippet": INFOBOX.format(ab=ab, rb=rb, sb=sb)}


def test_parse_infobox_reads_modes_right_to_left():
    assert wayback.parse_infobox(INFOBOX.format(ab=2.7, rb=2.7, sb=3.3)) == (2.7, 2.7, 3.3)
    assert wayback.parse_infobox("<div>Battle ratings</div>") is None


def test_page_series_keeps_the_ends_of_each_run():
    records = [
        capture("20190101000000", "A7M2", 4.3, 5.3, 4.3),
        capture("20190201000000", "A7M2", 4.3, 5.3, 4.3),
        capture("20190301000000", "A7M2", 4.3, 5.3, 4.3),
        capture("20190401000000", "A7M2", 4.3, 5.3, 4.7),
        {"ts": "20190501000000", "page": "Tanks"},  # not a vehicle page
    ]
    assert wayback.page_series(records) == {
        "A7M2": [
            ["20190101000000", 4.3, 5.3, 4.3],
            ["20190301000000", 4.3, 5.3, 4.3],
            ["20190401000000", 4.3, 5.3, 4.7],
        ]
    }
    # Merging a later run with the earlier result drops captures inside a run.
    later = [capture("20190601000000", "A7M2", 4.3, 5.3, 4.7)]
    merged = wayback.page_series(later, wayback.page_series(records))
    assert [r[0] for r in merged["A7M2"]] == ["20190101000000", "20190301000000",
                                              "20190401000000", "20190601000000"]  # fmt: skip


def test_page_captures_one_a_month_and_resume():
    url = "https://wiki.warthunder.com/{}"
    rows = [
        ["20190101", url.format("A7M2")],
        ["20190115", url.format("A7M2")],  # same month
        ["20190101", url.format("2A26_(125_mm)")],  # a gun
        ["20190101", url.format("Category:Fighters")],
        ["20190201", url.format("A7M2")],
        ["20190101", url.format("Ariete")],
    ]
    assert [(t[0], t[2]) for t in wayback.page_captures(rows)] == [
        ("20190101", "A7M2"), ("20190201", "A7M2"), ("20190101", "Ariete")
    ]  # fmt: skip
    assert [t[2] for t in wayback.page_captures(rows, after="A7M2")] == ["Ariete"]


def unit(uid: str, name: str, nation: str = "italy", **kw) -> UnitDetail:
    return UnitDetail(
        id=uid, branch="ground", nation=nation, rank=7, type="medium_tank", name=name, fullName=name,
        status=kw.pop("status", "tree"), br=Ranks(ab=30, rb=30, sb=30), **kw
    )  # fmt: skip


def test_early_history_from_wiki_captures(tmp_path):
    (tmp_path / "wiki").mkdir()
    (tmp_path / "wiki" / "2019-10-15.json").write_text(
        json.dumps(
            {
                "date": "2019-10-15",
                "source": "list",
                "rows": [
                    ["italy", "Ariete", 10.0, 10.0, 10.0],
                    ["britain", "Churchill Mk I", 3.0, 3.0, 3.0],
                ],
            }
        )  # fmt: skip
    )
    (tmp_path / "wiki-pages.json").write_text(
        json.dumps(
            {
                "url": "{ts}/{page}",
                "pages": {
                    "Ariete": [
                        ["20190817000000", 10.0, 10.0, 10.0],
                        ["20191211000000", 10.3, 10.3, 10.3],
                    ],
                    "Churchill_Mk_I": [
                        ["20190301000000", 3.0, 3.0, 3.0],
                        ["20190401000000", 3.3, 3.0, 3.0],  # a slip, put back
                        ["20190501000000", 3.0, 3.0, 3.0],
                    ],
                },
            }
        )  # fmt: skip
    )
    details = {
        "tree": unit("tree", "Ariete"),
        "later": unit("later", "Ariete", status="premium", added="2.17.0.8"),  # not in 2019
        "churchill": unit("churchill", "Churchill I", nation="britain"),  # renamed since
    }
    _early_history(details, [], tmp_path)

    assert details["later"].early == []
    newest, first = details["tree"].early
    assert (first.date, first.br) == ("2019-08-17", {"ab": 10.0, "rb": 10.0, "sb": 10.0})
    assert (newest.date, newest.after) == ("2019-12-11", "2019-10-15")
    assert newest.change == {m: (10.0, 10.3) for m in ("ab", "rb", "sb")}
    assert newest.url == "20191211000000/Ariete"
    [only] = details["churchill"].early
    assert (only.date, only.br["ab"]) == ("2019-03-01", 3.0)
