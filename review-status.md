# v2.3.0 review · Recipe notebook

The continuing build adds recipe experiments and clearer customer feedback while preserving the approved stand. The original v2.2.0 checkpoint stays isolated behind **Play sample**.

## What to play

- **Customer log:** reaction labels and positive/negative borders appear in the live and full logs. An unhappy customer remains negative even if they paid. Actual reputation changes are printed separately.
- **Slices sold:** total sales remain in the main header, with progress toward the next sales milestone. The live counter explicitly labels today's sold count.
- **Recipes:** buy toppings, prep slices, then open the notebook. Test up to three toppings using one slice and one portion of each ingredient. Successful recipes stay discovered; failed mixes are recorded. Known/failed combinations cannot charge twice. A reveal can put the recipe straight onto the single-slot menu.
- **Early progression:** Onion/Pickles arrive by Day 2, Pepperoni/Mushroom by Day 3, Green Peppers/Pineapple by Day 4 and Ham by Day 5. Sales can unlock them sooner. There are ten recipes including Plain Slice.
- **Existing runs:** schema 1/2 saves migrate to 3 with cash, stock, progress and original unlocked recipes retained. A valid original is backed up once when storage permits. The original sample retains its own schema-2 save.

## Verified

| Check | Result |
| --- | --- |
| Current simulation, discovery, accounting and migration | 31 model checks passed |
| Chromium 134 and WebKit 18.4 | 180 browser checks passed |
| Review sizes in each browser | 1596 × 947, 1024 × 600, 390 × 844 |
| Original checkpoint reference | 36/36 checks passed; all seven imported checksums unchanged |
| Actual HTML opened from disk | $53 comparison after 20.4 seconds; no external requests |
| Packaging | Reproduces the verified HTML byte for byte |

Every browser/size combination completed the sample and Days 1–5, including discovery of Dill-icious, a failed Onion-only test, duplicate-test blocking, immediate menu replacement and reload. Taste tests appear separately on the receipt and reconcile with sold/expired slices. Normal service saves, partial work, settled receipts, isolated modes, restarts and keyboard/pause behavior also passed. Quiet and long event text were checked on the phone layout.

Model checks cover every canonical combination, FIFO topping use, exact test costs, missing/locked stock, no service-time experiments, no RNG consumption, save migration/backups, damaged notebook data and an unhappy paid sale with negative reputation. All discovery records persist with the prepared service checkpoint.

Screenshots were reviewed for the header, outcome labels, compact service, the phone discovery reveal and the Day 5 receipt. `verification/` contains the final browser/model logs, summary, build hash and selected captures. These are local execution results, not a claim that a GitHub Actions runner completed.

## Data choices

The supplied CSVs provided names, descriptions and a small set of combinations: Dill-icious, Forest Forage, Classic Ham & Cheese, Hawaiian Dream and Sweet & Savory join the original five recipes. The duplicate Forest Forage/ Veggie Delight combination has one canonical recipe. The larger legacy upgrade/event catalogue and its old balance were not imported.

Copy/outcome/event text stays in `source/content.json`; recipe combinations, clues, names and topping balance are in `source/recipe-book.json`. Current rules are separate from the archived comparison in `engine/js/`.

The run can continue past Day 5 under the 100-day limit. Owner play-feel review and physical-device testing remain open. The PR stays a draft; no merge, itch.io upload or publication is included.
