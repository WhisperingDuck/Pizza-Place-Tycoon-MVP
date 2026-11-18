# One-day design review

**Final result: passed** for the Wednesday prototype walkthrough. The owner's decision on feel and pace is open.

| CSS viewport | Preparation | Service | Receipt and following day |
| --- | --- | --- | --- |
| 1596 × 947 | Flour and dough together, sauce and cheese at the tray, full price board | Four recent entries and full log | Receipt, observation and next-day button visible |
| 1024 × 600 | Same controls below a shallower landscape | Three recent entries | Continue visible beneath the receipt |
| 390 × 844 | Two prep stations above the price board | Totals and three recent entries stacked | Receipt above the observation and next-day action |

The review used macOS WebKit with the HTML loaded from memory and external requests blocked. The real interface controls drove purchases, five dough presses, four slice presses, pricing, opening, pause and resume, log inspection, closing, day-two preparation and confirmed reset. A controlled clock made the captures repeatable. At all three viewports, the document fit the window horizontally and vertically through the core route.

The original November drawing supplied the stand proportions, overhead sign, awning, trees, poles, counter and road. The microwave appears after purchase, slices appear on the counter after prep, and closing changes the light and sign. The captures show the actual ready desktop counter and a compact service transaction.

- **Cash reconciliation.** At $3.25 and one batch, four sales plus two walkaways account for all six visitors. $64 opening cash − $4 ingredients − $20 equipment + $13 sales = $53 closing cash. Four slices expire. Day 2 opens with $53, 9/10 health and the microwave installed.
- **Keyboard.** Enter opens Stockroom, Tab stays in the dialog, Escape returns focus to Stockroom and Space buys flour. Back returns focus to the log without advancing the queue. Manual pause persists across panel use.
- **Content and edge cases.** A quiet receipt has an empty-event line. A forced rain event shows its effect. A long test message fits behind the full closing note on the phone, with its final sentence accessible. Packaging checks required copy, duplicate IDs, placeholders and unknown effect references.
- **Candidate.** All 36 checkpoint checks pass. The adapter also passed save isolation, mid-service reload to the pre-opening checkpoint and settled-receipt reload checks. Tested rule work uses measured presses for both jobs. The earlier 26-check revision has no confirmed source match.

The original candidate and its tests remain separate from the sketch. Full-run interface coverage, physical-device testing and the owner's release playthrough belong to the integration and itch.io review.
