from wtbr import market


def item(name, kind, icon="", **tags):
    return {
        "hash_name": name,
        "name": name,
        "icon": icon,
        "tags": [f"type:{kind}"] + [f"{k}:{v}" for k, v in tags.items()],
    }


def test_prices_are_hundred_millionths_of_a_gjn():
    assert market.gjn(249000000) == 2.49
    assert market.gjn(None) is None


def test_vehicle_id_from_icon():
    it = {"icon": "https://static-ggc.gaijin.net/units/fr_amx_50_surblinde_improved.png"}
    assert market.vehicle_id(it) == "fr_amx_50_surblinde"
    assert market.vehicle_id({"icon": "https://wt-ugc.cdn.gaijin.net/d7/x.icon.jpg"}) is None


def test_skins_match_the_longest_vehicle_name_in_nation_and_type():
    vehicles = [
        ("germ_leopard_2a6", "ground", "germany", ["Leopard 2A6"]),
        ("germ_leopard_2", "ground", "germany", ["Leopard 2"]),
        ("sw_leopard_2a6", "ground", "sweden", ["Leopard 2A6"]),
        ("ussr_obj_279", "ground", "ussr", ["Object 279"]),
    ]
    items = [
        item("Leopard 2A6 'Desert'", "skin", vehicleType="tank", country="germany"),
        item("Leopard 2 'Plain'", "skin", vehicleType="tank", country="germany"),
        item("Object 279: Black camouflage", "skin", vehicleType="tank", country="ussr"),
        item("Leopard 2A6 'Desert'", "decal"),
    ]
    assert market.match_skins(items, vehicles) == {
        "Leopard 2A6 'Desert'": "germ_leopard_2a6",
        "Leopard 2 'Plain'": "germ_leopard_2",
        "Object 279: Black camouflage": "ussr_obj_279",
    }
