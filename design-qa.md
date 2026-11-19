# Stand integration QA

The one-day stand is the owner's approved visual and interaction reference. Its continuing-game integration passed browser review on November 19, 2026.

| CSS viewport | Preparation | Service | Receipt and continuation |
| --- | --- | --- | --- |
| 1596 × 947 | Stand, three prep areas and price board | Totals and recent counter entries | Receipt, observation and next-day button visible |
| 1024 × 600 | Same controls under a shallower landscape | Totals and three recent entries | Complete receipt and continuation visible |
| 390 × 844 | Two prep stations above the price board | Stacked totals and recent log | Receipt, closing-note link and next-day action visible |

Chromium and WebKit each passed the complete sample and Days 1–5 at every viewport. The document and primary action fit each size. Screenshots were reviewed for scene composition, service feedback, phone receipts and long copy. Secondary panels keep their headings and Back control visible while their contents scroll.

The sample retains the approved $3.25 / $53 result. The continuing run uses unchanged v2.2.0 rules, normal randomness and compatible saves. Browser checks cover partial work, service restoration, settled receipts, five-day ledgers, restarts, isolated saves, Enter/Space, Tab/Shift+Tab and Escape/Back focus return. The actual standalone file passed a 20.5-second real-time sample without external requests.

A queued native dialog close event could interfere with a newly opened panel. Closing now restores focus and clears its pause synchronously; stale events leave an open panel alone. The regression route opens and closes all four secondary panels consecutively.

See `review-status.md` for provenance, results and remaining owner review. `verification/` holds the final passing browser log, summary and selected captures. The earlier approved reference captures remain in `previews/`.
