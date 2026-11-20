# Route 1 · v2.3.0

**Recipe route.** In the continuing run, the header keeps total slices sold visible. Day 2 introduces Onion and Pickles (or sales can unlock them sooner). Buy toppings in Stockroom, prep slices, open Recipes and choose the mix to test. A successful reveal has a direct menu action. A failed test is recorded; repeating it spends nothing. Recipes and test notes survive reload. Taste tests appear separately on the receipt and never increase sales progress.

Pepperoni and Mushroom arrive by Day 3, Green Peppers and Pineapple by Day 4, and Ham by Day 5. The notebook shows delivery/sales requirements and clues for undiscovered combinations. It contains ten recipes, including the starting Plain Slice. In a one-slot menu, a new discovery can replace the current recipe directly; Plain remains the fallback during service.

Customer entries carry explicit reaction labels, positive/negative styling and actual reputation changes. Neutral and unhappy reactions remain distinct from payment: a sale can earn money while harming reputation.

**Repeatable sample walkthrough.** Buy one flour, one sauce and one cheese. Finish the dough, then the eight-slice batch. Install the Clean Microwave, raise the plain slice price once to $3.25 and open. Watch the first two visitors. Read the receipt and continue to Day 2. Reset the sample to replay the same customers.

| Moment | Where to act | What changes |
| --- | --- | --- |
| Empty stand | The dough section has the flour count and its buy button. Sauce and cheese sit with the slice work. | A purchase adds one unit immediately, deducts its displayed cost from cash and adds it to spending. With no stock, each work control names the missing ingredients. |
| Making dough | Activate the dough control beside flour. | The first activation consumes one flour. Each activation fills the meter by 20 points at starting skill. The fifth produces one dough. Starting another job is blocked while work is underway. |
| Filling the tray | Activate the slice control beside sauce and cheese. | One dough, one sauce and one cheese are charged on the first activation. Four activations at starting skill complete the batch. The tray goes from zero to eight. Nothing else is charged while the meter fills. |
| Pricing and opening | Adjust the plain slice price beside the forecast. The opening control and its requirements stay together. | Each $0.25 step updates buy chance and the value of selling the tray. Visitors and capacity stay visible. Opening needs health, slices, an installed Clean Microwave and finished work. The microwave costs $20 once and carries into tomorrow. |
| At the counter | Watch the stand, the visitor’s reaction and the latest log entries. Pause to inspect an outcome. Open the full log for earlier visitors. | Each arrival precedes its decision. A purchase adds payment and removes one slice. A walkaway leaves the tray and till unchanged. Service settles automatically after the last turn and the end of the day. |
| Closing | Read the receipt, the counter observation and the event slot. Use the next-day button when ready. | Settlement records sold/prepared, expired leftovers, sales, spending and cash change. Health falls by one. A quiet day has a short empty-event message. A closing event can change cash or tomorrow’s forecast. |
| Tomorrow | Return to the same prep bench on Day 2. | Cash, reputation, unused base stock and the microwave carry forward. Dough and leftover slices expire. The next batch starts at the bench. |

**A receipt you can reconcile.** On the walkthrough above, six people visit. Four buy and two pass. Four of eight slices expire. Sales are $13, ingredients cost $4 and the microwave costs $20. Cash moves from $64 to $53, a change of −$11. Day 2 starts with 9/10 health. One experiment for tomorrow is to stock napkins and compare the buy chance at the same price.

**Small windows and keyboard.** At 1024 × 600, the landscape and counter shorten, and the live feed shows three recent entries. At 390 × 844, the two prep stations sit above the full-width price board. Service totals sit above the three-entry log. Open stand, Pause and Prepare for Day 2 share the action strip below the counter. The full log and long closing notes scroll inside their panels.

Stockroom sells the continuing catalogue during prep in packs of five; the bench buys single units. Locked toppings show their unlock requirements. Equipment lists all six checkpoint upgrades and their actual owned, affordable or locked states. Stand contains cleaning, once-daily training, a timed food order, recycling, recipes and the last five receipts. Opening a panel suspends service. Tab and Shift+Tab cycle through its controls. Back or Escape closes it and restores the invoking control. A manually paused day stays paused. Restart asks before replacing the selected mode's save.

**Work and saves.** Both modes retain click-to-fill work. The continuing run migrates existing schema-1/2 saves to schema 3 while keeping the original key, cash, progress, inventory and original unlocked recipes. Partial work and the notebook survive reload. Reloading service returns to the prepared checkpoint, including completed taste tests. A settled receipt stays settled. The comparison keeps the original v2.2.0 schema and its own isolated keys. Restarting either mode preserves the other save.
