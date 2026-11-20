# Pizza Place Tycoon

Download **[pizza-place-tycoon.html](pizza-place-tycoon.html)** and open it in a browser. It is self-contained and makes no external requests.

**v2.3.0** carries the approved stand into a continuing game with clearer customer outcomes, a persistent slices-sold total and a recipe notebook. Play Days 1–5 to reach the early deliveries and try discoveries. The 100-day limit remains.

- **Stand**: clean, train, order food, return cans, manage recipes and read the previous five receipts.
- **Stockroom**: buy five units per press. The three buttons at the prep bench buy one unit each.
- **Equipment**: the checkpoint's six upgrades, with their actual prices, unlocks and effects.
- **Recipes**: select one to three stocked toppings and test a prepared slice. Successful combinations fill the notebook; failed mixes stay in the notes. Tests use one slice and one portion of each topping. Repeating a known or failed mix costs nothing. Put a new discovery on the menu directly from its reveal.
- **Play sample**: switch to the repeatable seed-6 comparison. **Return to run** restores the continuing game. The two saves and restart controls are separate.
- **Restart run**: asks before replacing the continuing save. Cancelling keeps it intact.

## The comparison day

In the sample, buy one flour, one sauce and one cheese at the bench. Press dough five times, prep four times, buy the microwave, raise the price once to $3.25 and open.

Six visitors produce four sales and two walkaways: $64 − $4 ingredients − $20 equipment + $13 sales = **$53 closing cash**. Four slices expire. Do not buy extra stock or use Stand actions when reproducing this route.

## Saves and keyboard

The continuing game retains the `pizza-place-rebuild.run.v1` key and migrates schema 1/2 to 3. Cash, stock, progress and original unlocked recipes carry forward. A valid original save is backed up once when storage permits. A partial job and discoveries survive reload. Reloading service restores the complete prepared checkpoint with the same luck; a settled receipt is not settled again. The original sample remains on schema 2 in its separate `roadside.one-day.design-v1.*` slots.

Tab/Shift+Tab move between controls. Enter and Space activate buttons. Dialogs trap Tab; Escape/Back closes them and restores focus. Service pauses in a panel and while the tab is hidden. A manually paused day stays paused after a panel closes.

## Editing and checks

Edit interface text, outcome labels, reactions, equipment copy and events in [source/content.json](source/content.json). Edit current recipe names, clues, combinations, topping prices and deliveries in [source/recipe-book.json](source/recipe-book.json). Other continuing-game balance is in [engine/js/config.js](engine/js/config.js). The original checkpoint is the isolated comparison engine. [COPY.md](COPY.md) describes previews; [engine/README.md](engine/README.md) describes the rule changes.

```sh
python3 package.py
npm test
npm ci
npx playwright install --with-deps chromium webkit
npm run test:browser
```

The PR workflow checks packaging, checkpoint checksums, save/simulation regressions, both Chromium and WebKit at **1596 × 947**, **1024 × 600** and **390 × 844**, plus a real-time sample. Captures and the portable HTML are collected as an artifact.

This is a draft review build. Owner approval of the itch.io draft is separate; this workflow does not publish, deploy or merge it.

This version passes **31 model checks and 180 browser checks**. The 36 original checkpoint checks remain a separate reference. See [review-status.md](review-status.md) and [verification/](verification/) for results and captures. The actual HTML opened from disk passes the real-time sample with $53 and no external requests.

Service has a 20-second minimum; the checkpoint extends busy days so each visitor has time to arrive and decide. Reloading service restores the prepared checkpoint. The continuing run can proceed to Day 6; its 100-day limit remains.
