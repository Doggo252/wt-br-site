from wtbr.records import Candidate, Record, match, norm, parse


def rec(name, nation="usa", br=None):
    return Record(nation=nation, name=name, kills=10, player="p", br=br, patch="2.59")


def test_parse_skips_blank_names_and_keeps_empty_kills():
    text = (
        '"Kills","Tank","Player","BR","Patch Version","Screenshot ","Screenshot 2","Video"\n'
        '"24","M1A2 SEPv3","LSEVENOBAP","12.7","2.59","1","",""\n'
        '"","M1A1 (YouTube Cup)","","11.7","","","",""\n'
        '"","","","","","","",""\n'
    )
    rows = parse("usa", text)
    assert [r.name for r in rows] == ["M1A2 SEPv3", "M1A1 (YouTube Cup)"]
    assert rows[0].kills == 24 and rows[1].kills is None


def test_emoji_maps_to_game_glyph():
    assert norm("🌩️M1A1 HC") == norm("◍M1A1 HC")
    assert norm("🐾Tiger") == norm("␠Tiger")


def test_exact_then_loose_matching():
    cands = [
        Candidate("us_m1a1_hc_usmc_sm", "usa", ["◍M1A1 HC"], 33),
        Candidate("fr_m4a3e2", "france", ["▄M4A3E2"], 14),  # operator glyph the sheet omits
        Candidate("germ_waffentraeger", "germany", ["Waffenträger"], 14),
    ]
    rows = [rec("🌩️M1A1 HC"), rec("M4A3E2", "france"), rec("Waffentrager", "germany")]
    match(rows, cands, {})
    assert [r.id for r in rows] == ["us_m1a1_hc_usmc_sm", "fr_m4a3e2", "germ_waffentraeger"]


def test_same_name_resolved_by_br_and_overrides_win():
    cands = [
        Candidate("tree_copy", "usa", ["M4"], 8),  # 3.7
        Candidate("premium_copy", "usa", ["M4"], 9),  # 4.0
    ]
    rows = [rec("M4", br="4.0")]
    match(rows, cands, {})
    assert rows[0].id == "premium_copy"

    rows = [rec("M4", br="4.0")]
    match(rows, cands, {"usa|M4": "tree_copy"})
    assert rows[0].id == "tree_copy"


def test_nation_scoped():
    cands = [Candidate("sw_t_34", "sweden", ["T-34"], 9)]
    rows = [rec("T-34", "ussr")]
    match(rows, cands, {})
    assert rows[0].id is None
