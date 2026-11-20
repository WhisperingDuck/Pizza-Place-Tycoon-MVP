# v2.3.0 interface QA

The approved stand remains the visual reference. The next version adds a fourth header stat for slices sold, a compact milestone/notebook line, explicit customer outcome labels and a recipe notebook.

| CSS viewport | Preparation and service | Recipe notebook | Closing |
| --- | --- | --- | --- |
| 1596 × 947 | Stand, prep, price and persistent sales visible | Ingredient choices, result and menu controls in one panel | Receipt and next-day action visible |
| 1024 × 600 | Shallower stand, clear today/run totals and labeled log | Scrolls inside the panel; Back stays visible | No page overflow |
| 390 × 844 | Four header stats; stacked service and labeled outcomes | Two-column ingredient choices; discovery scrolls into view with keyboard focus | Taste-test count, receipt and continuation visible |

Both Chromium and WebKit passed all three sizes. The 180 browser checks include Enter/Space, Tab/Shift+Tab, Escape/Back focus return, preparation/service/report saves, restarting, discovery, a failed test, repeat protection, single-slot menu replacement and a five-day continuing run. Discovery/results are reachable without a pointer. Reduced-motion mode suppresses the reveal animation.

Color is paired with visible reaction labels. A customer's mood and payment stay separate: unhappy buyers are negative even when their payment is positive. Current lifetime sales remain visible through every phase; taste tests never inflate them.

Quiet and long event messages remain accessible inside the closing-note panel. The actual portable HTML passed a real-time $53 sample with zero external requests. See `review-status.md` and `verification/` for the recorded evidence. Physical-device and owner play-feel review remain separate.
