# Pizza Place Tycoon

Download **[pizza-place-tycoon.html](pizza-place-tycoon.html)** and open it in a browser. It is self-contained and makes no external requests.

The continuing game uses the approved roadside stand, prep controls, live counter log and receipt, backed by the unchanged v2.2.0 checkpoint. Play Days 1–5 for this review; the checkpoint's 100-day limit remains unchanged.

- **Stand**: clean, train, order food, return cans, manage recipes and read the previous five receipts.
- **Stockroom**: buy five units per press. The three buttons at the prep bench buy one unit each.
- **Equipment**: the checkpoint's six upgrades, with their actual prices, unlocks and effects.
- **Play sample**: switch to the repeatable seed-6 comparison. **Return to run** restores the continuing game. The two saves and restart controls are separate.
- **Restart run**: asks before replacing the continuing save. Cancelling keeps it intact.

## The comparison day

In the sample, buy one flour, one sauce and one cheese at the bench. Press dough five times, prep four times, buy the microwave, raise the price once to $3.25 and open.

Six visitors produce four sales and two walkaways: $64 − $4 ingredients − $20 equipment + $13 sales = **$53 closing cash**. Four slices expire. Do not buy extra stock or use Stand actions when reproducing this route.

## Saves and keyboard

The continuing game retains the checkpoint's `pizza-place-rebuild.run.v1` key, version-2 schema and built-in version-1 migration. A partial job survives reload. Reloading service restores the complete prepared checkpoint with the same random state; a settled receipt is not settled again. Sample saves retain `roadside.one-day.design-v1.*`.

Tab/Shift+Tab move between controls. Enter and Space activate buttons. Dialogs trap Tab; Escape/Back closes them and restores focus. Service pauses in a panel and while the tab is hidden. A manually paused day stays paused after a panel closes.

## Editing and checks

Edit interface text, reactions, catalogue labels and event copy in [source/content.json](source/content.json). Economic effects remain in [checkpoint/js/config.js](checkpoint/js/config.js) and the checkpoint rules; changing an event's prose does not change its effect. [COPY.md](COPY.md) describes previews.

```sh
python3 package.py
npm test
npm install
npx playwright install --with-deps chromium webkit
npm run test:browser
```

The PR workflow checks packaging, checkpoint checksums, save/simulation regressions, both Chromium and WebKit at **1596 × 947**, **1024 × 600** and **390 × 844**, plus a real-time sample. Captures and the portable HTML are collected as an artifact.

This is a draft review build. Owner approval of the itch.io draft is separate; this workflow does not publish, deploy or merge it.
