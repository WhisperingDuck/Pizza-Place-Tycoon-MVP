# Days 1–5 integration review

Verified November 19, 2026 on `design/one-playable-day`, continuing from `7a70fbe708f645a08f8eed478625930bd859e294`.

The approved stand, prep controls, live counter log and receipt are available throughout the continuing game. **Play sample** and **Return to run** keep separate saves. Copy, customer lines, catalogue descriptions and event variants remain editable in `source/content.json`.

## Handoff and rules

Read `START-HERE.md` in the supplied handoff ZIP and extracted its original checkpoint separately. The checkpoint ZIP matches SHA-256 `bfc895b2038a4c2e65006678cf325978b903fb5df6c2dc1ee8421d78e75bb907`. All seven imported engine files match the original and `checkpoint/SHA256SUMS`. Rules and save schema are unchanged.

The original one-day HTML and integrated sample each produced four sales, two walkaways, four leftovers, $13 revenue, $24 spending and **$53 closing cash at $3.25**. The following morning begins at 9/10 health with the microwave installed.

## Results

| Check | Result |
| --- | --- |
| Original checkpoint `node tests/test.js` | 36/36 passed |
| Packaging, reproducible HTML and engine checksums | Passed |
| `npm test` | 17/17 passed |
| `npm run test:browser` | 168 checks passed |
| Chromium 134 and WebKit 18.4 | Each passed at 1596 × 947, 1024 × 600 and 390 × 844 |
| Actual `file://` HTML, unaccelerated service | $53 closing cash after 20.5 seconds; prepared save restored; zero external requests |

Every browser/size combination completed the sample and Days 1–5 using the actual controls. Checks cover partial prep, mid-service restoration to the prepared checkpoint, settled receipts, five-day cash ledgers, food delivery, separate modes, cancelled and confirmed restarts, manual pause and dialog pause. Keyboard coverage includes Enter, Space, Tab, Shift+Tab, Escape, Back and focus return.

Both 390-pixel routes previewed a quiet closing and a long rain-event message. Its final sentence and ledger remain accessible by scrolling inside the closing-note panel. Screenshots were reviewed for desktop preparation, compact service, phone receipts, Day 5 and long copy.

Browser testing found and fixed a queued-dialog-close race that could lose focus and clear the next panel's pause. Cleanup now runs immediately and ignores stale native close events. Regression tests also respect the checkpoint's longer duration on busy days.

`verification/browser.log` and `verification/summary.json` record the final passing run. Representative captures are in `verification/screenshots/`; the complete set is reproduced by the browser script and collected by CI.

## Owner review

Open `pizza-place-tycoon.html`, play five days and use **Play sample** for comparison. The 100-day rule remains; Day 6 is available. Try a different price or stock plan to assess pace and usefulness of the receipt. Browser sizes are emulated viewports; physical-device testing and the owner's play-feel decision remain open.

The PR remains a draft. No merge, deployment, itch.io upload or publication is included. Approval of the itch.io draft is separate.
