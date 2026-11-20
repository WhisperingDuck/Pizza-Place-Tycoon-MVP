# Writing for the Route 1 stand

Open `source/content.json` in a text editor. It contains the interface labels, short responses, customer lines, receipt clues and event catalogue. The current words are drafts. Keep the names between braces, such as `{money}`, wherever they occur. The game fills in their values from the current day.

From this folder, run `python3 package.py`, then open or reload `pizza-place-tycoon.html`. Use the same file and browser every time to retain your review save. No server or internet connection is required. Choose **Reset sample**, then **Reset to Day 1**, to replay the same customers from empty stock. Reloading during service returns to the moment before opening. Reloading the receipt keeps the settled totals.

## Write a closing event

You can edit the existing event with ID `rain_check`, or add another entry like this to the `events` array.

```json
{
  "id": "awning_drip",
  "effect": "rain",
  "title": "Leak in the awning",
  "message": "A drip lands on the last paper plate. Across the road, the neighbours are already tying everything down for tomorrow.",
  "draft": true
}
```

Give each entry a permanent, unique lowercase ID. Use underscores between words. Reference an effect already in the catalogue. The engine handles its odds and consequences. The receipt prints the effect separately, so the message can stay in the owner’s voice. Closing events can use `rain`, `big_game`, `scratch`, `good_tv`, `bad_tv`, `cat`, `garbage` or `windfall`. The existing `rats` entry represents a conditional closing effect. Scheduled, recovery and secret effects retain their original triggers. Entries sharing an effect rotate by day number as variants of that effect.

1. Save the JSON and run `python3 package.py`. It checks missing strings, placeholders, repeat IDs and unknown effects before replacing the playable file.
2. To audition your example, add `#event=awning_drip` to the local HTML file’s address **and reload**. Reset the sample, make one batch, install the microwave and open. Forcing a review event replaces the natural closing draw and runs the chosen engine effect once during settlement.
3. Read the actual receipt. Check the long message in the compact layout and confirm that the next morning’s forecast reflects the rain. For a quiet closing, repeat with `#mode=sample&event=none`. For the regular sample, use `#mode=sample`, reload and reset. Removing the entire fragment returns to the continuing run.
4. Shorten labels if they wrap awkwardly at 390 pixels. Customer lines can be longer; the full counter log retains them. Keep `draft: true` on each event until the owner approves that line.

The standalone file embeds a snapshot of the JSON at packaging time. Edit the source JSON to keep revisions reproducible. Changing an event’s ID changes its preview address. Changing only its title or message preserves the address.


## Continuing-game content

The default mode is the continuing run. Use `#mode=sample` for the exact seed-6 comparison. Event previews belong to sample mode, for example `#mode=sample&event=rain_check`; an explicit `#mode=run&event=...` does not override continuing-game events.

The `catalogue` sections override displayed base-item and equipment labels/notes/effects. Original recipe labels are retained for the comparison. In the continuing run, `source/recipe-book.json` owns recipe and topping names, notes, clues, combinations, prices, premiums and delivery days/sales. These values affect the continuing game. `ruleReasons` translates engine validation messages. Stand actions, run endings, ledger rows and mode/restart text are in `ui` and `feedback`.

Keep the placeholders required by `package.py`. The sale line now uses `{item}`, and purchase feedback includes `{quantity}`. Closing notes include the full cash ledger so event and recycling income reconcile with closing cash.

## Recipe notebook and outcome labels

`outcomes` supplies the visible reaction labels in both logs; `discovery` supplies test feedback. The `ui` section includes the notebook controls and reveal text. Recipe clues remain visible before discovery; names and ingredient combinations are revealed after testing. Avoid putting the hidden recipe name in its clue if you want a puzzle.

`source/recipe-book.json` contains ten canonical recipes. Combinations ignore ingredient order. Do not duplicate a combination or recipe ID. Plain Slice must remain first, with no extra toppings. One prepared slice already includes dough, sauce and cheese; only additional toppings belong in a combination. Money values are integer cents. Each topping becomes available on its delivery day or sales threshold, whichever occurs first.

Save the JSON, run `python3 package.py`, and reload the same HTML. Core copy, placeholder and recipe-catalogue validation runs before the playable file is replaced. The normal run uses v2.3.0 rules; `#mode=sample` keeps the original v2.2.0 recipe unlocking and $53 comparison.
