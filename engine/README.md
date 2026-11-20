# Current engine · v2.3.0

The continuing engine starts from the v2.2.0 checkpoint in `../checkpoint/js/`. The checkpoint stays byte-identical and remains the engine for **Play sample**. Packaging selects exactly one implementation of each engine module at runtime; the two engines never run together.

The current engine adds recipe discovery, seven topping deliveries, taste-test accounting, single-slot menu replacement and schema-3 migration. Core dough/prep work, customer timing, randomness, supplies, reputation, equipment, spoilage, health, cash settlement and the 100-day ending retain the checkpoint behavior unless described below.

- `source/recipe-book.json` owns recipe names, combinations, clues, premiums, delight bonuses, topping prices and unlock days/sales.
- `js/recipes.js` owns deterministic tests, ingredient and FIFO-lot consumption, attempt records and validation. A test costs one prepared slice and one portion of each selected topping. It never consumes RNG or counts as a sale. Known and previously failed combinations cannot be charged again.
- `js/state.js` owns the notebook and daily tasted-slice count. Toppings become available on their delivery day or when their sales threshold is reached, whichever comes first. Availability does not discover recipes.
- `js/logic.js` accepts recipe experiments and lets a known recipe replace the single starting menu slot. Plain remains the automatic fallback. Other menu-slot limits remain unchanged.
- `js/save.js` migrates schema 1/2 to 3, preserving the continuing key and previously unlocked original recipes. A valid original save is retained once under the `.pre-2.3.0` suffix when storage permits. New stock starts at zero. Prepared checkpoints include the notebook and tasted stock.

The older CSVs supplied names, descriptions and combinations, especially Dill-icious, Forest Forage, Classic Ham & Cheese, Hawaiian Dream and Sweet & Savory. Forest Forage is the canonical mushroom/green-pepper/onion recipe; the duplicate Veggie Delight combination was not imported. The much larger upgrade/event catalogue and its legacy balance were not applied to this version.
