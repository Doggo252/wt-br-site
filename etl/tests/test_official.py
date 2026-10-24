from types import SimpleNamespace

from wtbr import official

GROUND = (
    "Ground Forces,Arcade,,Realistic,,Comments\n"
    ",was,now,was,now,\n"
    "EMBT,12.7,13.3,12.7,13.3,\n"
    "Same BR,5.0,5.0,5.0,5.0,\n"
    "Pz.IV G (Italy),4.0,4.0,3.7,4.0,Uptier\n"
)
AIR = (
    ",Arcade,,Air Realistic,,Ground Realistic and Simulator,,Air Simulator,,Comments\n"
    ",was,now,was,now,was,now,was,now,\n"
    "Typhoon (AESA),14.7,15.0,14.7,15.0,13.0,14.0,14.7,15.0,\n"
)


def test_parse_ground_tab():
    rows = official.parse_tab("Ground Forces", GROUND)
    assert [r.name for r in rows] == ["EMBT", "Pz.IV G (Italy)"]  # unchanged rows skipped
    assert rows[0].changes == {"ab": (35, 37), "rb": (35, 37)}
    assert rows[1].changes == {"rb": (8, 9)} and rows[1].comment == "Uptier"


def test_parse_air_tab_with_ground_battle_column():
    (row,) = official.parse_tab("Aircraft", AIR)
    assert row.branch == "air"
    assert row.changes == {"ab": (41, 42), "rb": (41, 42), "grb": (36, 39), "sb": (41, 42)}


def test_naval_and_bracket_tabs_ignored():
    assert official.parse_tab("Naval Vessels", GROUND) == []
    assert official.parse_tab("Air Simulator Brackets", AIR) == []


def test_split_nation_and_glyph_suffixes():
    assert official.split_nation("Pz.IV G (Italy)") == ("Pz.IV G", "italy")
    assert official.split_nation("F-16AM (France, Belgium)") == ("F-16AM", "france")
    assert official.split_nation("M1A1 HC (SM)") == ("◍M1A1 HC", None)
    assert official.split_nation("AH-64A (GR)") == ("AH-64A (GR)", None)


def hp(d, ab, rb, sb):
    return SimpleNamespace(d=d, ab=ab, rb=rb, sb=sb)


def test_outcomes():
    history = [hp("2025-01-01", 10, 10, 10), hp("2025-02-10", 11, 11, 10)]
    # Announced 2025-02-01: RB 10 -> 11 happened, SB 10 -> 11 didn't.
    assert official.outcome(history, "2025-02-01", "2025-06-01", "rb", 10, 11) == "applied"
    assert official.outcome(history, "2025-02-01", "2025-06-01", "sb", 10, 11) == "not_applied"
    assert official.outcome(history, "2025-02-01", "2025-06-01", "ab", 10, 12) == "different"
    # Within 45 days and unchanged: still pending.
    assert official.outcome(history, "2025-02-01", "2025-02-05", "sb", 10, 11) == "pending"
