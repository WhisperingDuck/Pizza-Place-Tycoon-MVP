# Candidate engine

Version **2.2.0**. Source archive `pizza-place-tycoon-v2.2.0-checkpoint.zip`.

SHA-256 of the original ZIP: `bfc895b2038a4c2e65006678cf325978b903fb5df6c2dc1ee8421d78e75bb907`.

The seven files in `js/` are byte-identical copies of the checkpoint's configuration, catalogue, state, events, customers, rules and persistence modules. The checkpoint's UI and input dispatcher are separate from this design review. Run `shasum -a 256 -c SHA256SUMS` from this directory to check the imported files.

The unmodified archive passed all 36 of its automated checks in Node on November 18. The earlier rebuild reported as passing 26 checks is a play-feel reference. Its exact revision is unconfirmed. The older handoff describes timed dough and instant slice preparation. This checkpoint advances both jobs through measured input, at 20 or 25 points per activation at skill zero.
