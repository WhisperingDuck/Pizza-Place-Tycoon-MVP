"""Assemble the local, dependency-free design preview. Python 3.8+."""
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent
SOURCE = ROOT / "source"
ENGINE = ROOT / "checkpoint" / "js"
CURRENT_ENGINE = ROOT / "engine" / "js"
OUTPUT = ROOT / "pizza-place-tycoon.html"
ENGINE_MODULES = ("config", "data", "state", "events", "customers", "logic", "save")
MARKER = "<!-- STAND_SCRIPTS -->"

# These names are the content interface consumed by the candidate adapter.
TEXT_KEYS = {
    "names": "flour sauce cheese napkins paper_plates microwave plain dough".split(),
    "feedback": (
        "start newDay bought installed doughReady slicesReady doughWorking slicesWorking price noCash "
        "installedAlready beforeOpen noFlour noIngredients finishWork noMicrowave noTray "
        "noMicrowaveOrTray noHealth ready restore saveUnavailable incompatible equipmentInstalled clean train food recycle wheelchair menu fallback"
    ).split(),
    "effects": "big_game rain scratch good_tv bad_tv cat garbage windfall weekend rats sympathy wheelchair".split(),
    "counter": "opened arrived arrivalShort sale walk out busy soldOut atCapacity closed unlock".split(),
    "receipt": "quiet supplyClue wasteClue stockClue capacityClue overprepClue sellThroughClue".split(),
}
TOKENS = {
    "feedback.bought": "quantity item cost", "feedback.installed": "cost", "feedback.slicesReady": "batch",
    "feedback.doughWorking": "progress", "feedback.slicesWorking": "progress", "feedback.price": "price",
    "feedback.noIngredients": "items", "counter.opened": "visitors", "counter.arrived": "n",
    "counter.sale": "n item money line", "counter.walk": "n line", "counter.out": "n", "counter.busy": "n",
    "effects.big_game": "count", "effects.rain": "percent", "effects.scratch": "cash",
    "effects.good_tv": "rep", "effects.bad_tv": "rep", "effects.cat": "rep dirt",
    "effects.windfall": "multiple", "effects.weekend": "count", "effects.sympathy": "cash",
    "effects.wheelchair": "count rep",
    "feedback.equipmentInstalled": "item cost", "counter.unlock": "count names",
    "counter.closed": "sold", "receipt.supplyClue": "passed visitors", "receipt.wasteClue": "passed visitors",
    "receipt.stockClue": "count", "receipt.capacityClue": "count", "receipt.overprepClue": "count",
}
UI_TOKENS = {
    "day": "day",
    "onHand": "count item",
    "buyPrice": "cost",
    "buyDetail": "item cost count",
    "doughCount": "count",
    "trayCount": "count",
    "workProgress": "progress",
    "need": "items",
    "readyHint": "count price",
    "buyMicrowave": "cost",
    "visitorCount": "count total",
    "visitor": "n",
    "paid": "n paid",
    "receiptNo": "day",
    "closeBalance": "cash health",
    "next": "day",
    "transaction": "item stock",
}
REACTIONS = ("delighted", "satisfied", "neutral", "disgusted", "passed")


def unique_keys(pairs):
    result = {}
    for name, value in pairs:
        if name in result:
            raise ValueError(f"Duplicate JSON key: {name}")
        result[name] = value
    return result


def require_text(obj, key, location):
    if not isinstance(obj.get(key), str) or not obj[key].strip():
        raise ValueError(f"Missing text at {location}.{key}")
    return obj[key]


def validate(content, surface):
    for group, names in TEXT_KEYS.items():
        section = content.get(group)
        if not isinstance(section, dict):
            raise ValueError(f"Missing copy section: {group}")
        for key in names:
            value = require_text(section, key, group)
            expected = set(TOKENS.get(f"{group}.{key}", "").split())
            actual = set(re.findall(r"\{([a-zA-Z_]\w*)\}", value))
            if actual != expected:
                raise ValueError(f"{group}.{key}: expected placeholders {sorted(expected)}, found {sorted(actual)}")
    ui = content.get("ui")
    if not isinstance(ui, dict) or not ui:
        raise ValueError("Missing interface copy in ui")
    for key in ui:
        require_text(ui, key, "ui")
    # Static interface names include both property access and literal dictionary keys.
    ui_refs = set(re.findall(r"\b(?:u|ui)\.([a-zA-Z_]\w*)", surface))
    ui_refs.update(re.findall(r"\b(?:u|ui)\[['\"]([a-zA-Z_]\w*)['\"]\]", surface))
    ui_refs.update(re.findall(r'data-ui="([a-zA-Z_]\w*)"', surface))
    ui_refs.update(("doughStart", "doughMore", "slicesStart", "slicesMore", "flour", "sauce", "cheese", "napkins", "paper_plates"))
    for phase in ("Prep", "Service", "Report"):
        ui_refs.update((phase.lower() + "Phase", phase.lower() + "Bench", "scene" + phase, "sceneAlt" + phase))
    for key in sorted(ui_refs):
        require_text(ui, key, "ui")
    for key, names in UI_TOKENS.items():
        value = require_text(ui, key, "ui")
        actual = set(re.findall(r"\{([a-zA-Z_]\w*)\}", value))
        if actual != set(names.split()):
            raise ValueError(f"ui.{key}: expected placeholders {names}, found {sorted(actual)}")
    for mood in REACTIONS:
        lines = content.get("reactions", {}).get(mood)
        if not isinstance(lines, list) or not lines or any(not isinstance(s, str) or not s.strip() for s in lines):
            raise ValueError(f"Missing draft reaction lines: {mood}")
    # Read the actual imported effect dispatcher so an unknown reference cannot slip into a package.
    effects = set(re.findall(r"case '([a-z_]+)':", (ENGINE / "events.js").read_text(encoding="utf-8")))
    seen, covered = set(), set()
    for i, event in enumerate(content.get("events", [])):
        if not isinstance(event, dict):
            raise ValueError(f"events[{i}] must be an object")
        for key in ("id", "effect", "title", "message"):
            require_text(event, key, f"events[{i}]")
        if not re.fullmatch(r"[a-z][a-z0-9_]*", event["id"]) or event["id"] in seen or event["id"] == "none":
            raise ValueError(f"Invalid, reserved or duplicate event ID: {event['id']}")
        if event["effect"] not in effects:
            raise ValueError(f"Unknown checkpoint effect: {event['effect']}")
        if not isinstance(event.get("draft"), bool):
            raise ValueError(f"events[{i}].draft must be true or false")
        seen.add(event["id"])
        covered.add(event["effect"])
    if effects != covered:
        raise ValueError("Missing copy for checkpoint effects: " + ", ".join(sorted(effects - covered)))


def script(content):
    if re.search(r"</script", content, re.I):
        raise ValueError("A bundled JavaScript module contains a literal closing script tag")
    return "<script>\n" + content + "\n</script>"


def main():
    content = json.loads((SOURCE / "content.json").read_text(encoding="utf-8"), object_pairs_hook=unique_keys)
    book = json.loads((SOURCE / "recipe-book.json").read_text(encoding="utf-8"), object_pairs_hook=unique_keys)
    ingredient_ids = set()
    if book.get("maxToppings") != 3:
        raise ValueError("The notebook supports three selected toppings")
    for item in book["ingredients"]:
        if item["id"] in ingredient_ids or not re.fullmatch(r"[a-z][a-z0-9_]*", item["id"]):
            raise ValueError("Invalid or duplicate topping ID")
        ingredient_ids.add(item["id"])
        require_text(item, "name", item["id"])
        for key in ("cost", "day", "sold"):
            if type(item[key]) is not int or item[key] <= 0:
                raise ValueError("Invalid topping balance: " + item["id"])
    recipe_ids, combinations = set(), set()
    for recipe in book["recipes"]:
        combo = tuple(sorted(recipe["ingredients"]))
        if not re.fullmatch(r"[a-z][a-z0-9_]*", recipe["id"]) or recipe["id"] in recipe_ids or combo in combinations or len(combo) != len(set(combo)) or len(combo) > book["maxToppings"] or not set(combo) <= ingredient_ids:
            raise ValueError("Invalid or duplicate recipe: " + recipe["id"])
        if type(recipe["bonus"]) is not int or recipe["bonus"] < 0 or not 0 <= recipe["delight"] <= 1:
            raise ValueError("Invalid recipe balance")
        for key in ("name", "note", "clue"):
            require_text(recipe, key, recipe["id"])
        recipe_ids.add(recipe["id"]); combinations.add(combo)
    if book["recipes"][0]["id"] != "plain" or book["recipes"][0]["ingredients"]:
        raise ValueError("Plain Slice must be the first recipe without extra toppings")
    for group, keys in {"outcomes": "delighted satisfied neutral disgusted passed soldOut capacity arrival system discovery", "discovery": "beforeOpen finishWork choose limit locked known repeat needSlice needStock found notYet"}.items():
        for key in keys.split():
            require_text(content[group], key, group)
    surface = (SOURCE / "surface.html").read_text(encoding="utf-8")
    validate(content, surface)
    if surface.count(MARKER) != 1:
        raise ValueError(f"Expected exactly one {MARKER} in the interface template")
    encoded = json.dumps(content, ensure_ascii=False, indent=2).replace("<", "\\u003c")
    pieces = ['<script id="stand-copy" type="application/json">\n' + encoded + '\n</script>']
    pieces.append('<script id="recipe-data" type="application/json">\n' + json.dumps(book, ensure_ascii=False).replace("<", "\\u003c") + '\n</script>')
    pieces.append(script((SOURCE / "mode.js").read_text(encoding="utf-8")))
    pieces.append(script("window.Pizza = {}; Pizza.RECIPE_BOOK = JSON.parse(document.getElementById('recipe-data').textContent);"))
    for name in ENGINE_MODULES:
        original = (ENGINE / (name + ".js")).read_text(encoding="utf-8")
        current = (CURRENT_ENGINE / (name + ".js")).read_text(encoding="utf-8")
        pieces.append(script("if (window.PizzaMode.sample) {\n" + original + "\n} else {\n" + current + "\n}"))
        if name == "customers":
            pieces.append(script("if (!window.PizzaMode.sample) {\n" + (CURRENT_ENGINE / "recipes.js").read_text(encoding="utf-8") + "\n}"))
    for file in ("scene.js", "adapter.js"):
        pieces.append(script((SOURCE / file).read_text(encoding="utf-8")))
    final = surface.replace(MARKER, "\n".join(pieces))
    temporary = OUTPUT.with_suffix(".tmp")
    temporary.write_text(final, encoding="utf-8")
    temporary.replace(OUTPUT)
    print(f"Built {OUTPUT.name} · {len(content['events'])} event entries · {len(content['ui'])} interface strings")


if __name__ == "__main__":
    try:
        main()
    except (OSError, ValueError, KeyError) as error:
        print(f"Build stopped: {error}", file=sys.stderr)
        sys.exit(1)
