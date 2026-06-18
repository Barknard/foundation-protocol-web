# The Hard Part — Progress Log

**App name:** **The Hard Part** (logo: stone-block "HARD PART" emblem, `logo.png` / `icon.png`). Formerly "Foundation Protocol".
**Live:** https://barknard.github.io/foundation-protocol-web/ · **Repo:** `Barknard/foundation-protocol-web` (GitHub Pages, branch `main`)
**Source:** `~/foundation-protocol-web`
**Last updated:** 2026-06-18
**New AI / engineer?** Read [`AI-START-HERE.md`](../AI-START-HERE.md) first — it's the one-screen download for this repo.

A 40-week, research-grounded get-in-shape-without-injury program for ~40+, run as a daily two-tap autoregulated decision. Offline-capable PWA; optional GitHub data-sync per persona.

> ⚠️ **Hosting blocker (2026-06-17):** ALL of Eddie's GitHub Pages sites are 404 (foundation-protocol-web, datatrax-audiobook, princess-sparkle-v2 — the last builds cleanly yet 404s — and the `barknard.github.io` root). Cause is **account-level**: "Actions has been disabled for this user" (modern Pages builds run through Actions). Fix is on Eddie's account (verify email → billing → GitHub Support), not in any repo. A GitHub-Actions deploy workflow (`.github/workflows/deploy-pages.yml`) is already in place for when Actions is re-enabled.

## Architecture (refactored 2026-06-17)
No longer one giant HTML file. Now a **slim `index.html` spine** + modular assets, zero build step (classic ordered scripts share one global scope; deploys on Pages as-is):
- `css/` — `base.css` (tokens/type/layout), `components.css` (buttons/cards/fields/nav/wizard), `figures.css`, `screens.css`
- `js/` — `sprite.js` (injects the SVG figure sheet), `config.js`, `state.js`, `program.js` (phases/exercises/blocks + injury/layoff/deload), `engine.js` (decide/applyCheck/advance), `storage.js` (localStorage + GitHub sync), `util.js`, `ui.js` (router/render), `screens.js`, `init.js` (boot + SW)
- `sw.js` precaches the spine + all css/js. Python is NOT used at runtime (browser app); kept zero-build deliberately.

---

## What it is
- **Daily check-in (2 taps):** "Did you meet today's goal?" (done/partial/missed) + "How do you feel?" (1–5) → one of four calls: **Progress / Repeat / Modify / Rest**. Load only rises when you did the work *and* feel recovered. Only a Progress call advances the session pointer.
- **5 phases** (Infrastructure → Foundation → Run Introduction → Build → Target) over 40 weeks; autoregulation paces movement through them.

## Features shipped
**Onboarding & profile**
- Summit logo on the homepage (generated with open-source FLUX, recolored to the app palette) + matching SVG favicon/app icon.
- **Imperial default** weight (lb) with a lb/kg toggle and a greyed live auto-conversion to the side. Stored internally in kg.
- **Plain-language starting point** ("New / back after a break", "exercise sometimes", "train regularly") instead of phase jargon; conservative default, recommended-marked.
- **Username personas** — each profile saved as its own files: `data/users/<slug>/{profile,phase,checks}.json`. Switch/load a persona in Settings. Per-persona local storage (`foundation-protocol-state-v2:<slug>`). Legacy single-user data auto-migrates.

**Today**
- "Today · why" card: a one-line rationale + expandable research detail + your own trend (readiness avg, % completed, progressions).
- Prescription blocks expand inline to the exercises (animated figures), persisted open state.
- **Workout-flow completion:** per-exercise done checkboxes, **multi-column grid** on wider screens, "Completed" grouping, per-block "Mark all complete", x/y counts. All-done **auto-answers the goal question** (feeling still asked).
- Banners: **Recovering** (active injury), **layoff** (welcome back), **lighter (deload) week**.

**Check-in & decision logic**
- Decision table (verified): hurt→Rest; feel≤1→Rest; feel2→Modify; done&feel≥4→Progress; done&feel3→Repeat; partial/missed→Repeat.
- **Injury:** "Something hurts" → tappable **body-segment map** (16 segments) + posterior chips, multi-select, + **red-flag screener**. Logs what hurts; gives a **PEACE & LOVE** rest call (or clinician routing on a red flag); 3-day protect window; pain-monitored ease-back; re-check clears it.
- **Time-aware detraining:** gap tiers — ≤2 wk same / 2–4 wk −15% / 4–8 wk 70% / 8 wk+ 60%; no load jump on the first session back.
- **Deload:** auto lighter-week banner ~every 5 weeks or on a 7-day under-recovery trend; never jumps load within an injury-protect window.
- Per-day completion dedupe; advances at most once per local day; local-timezone day boundary.

**Library / Phase**
- 19 exercises, each an animated 2-frame stick figure (reworked to standard form: clean pushup/plank/RDL, plank forearms forward, supine dead-bug, lower goblet, red calf-emphasis on raises). Semantic color: floor=taupe, equipment=gold, motion=blue, body=cream.

**Data, sync, audit**
- **GitHub sync** (optional, per persona): push on check-in, pull on a fresh device, Test/Pull buttons. Hardened: 409 stale-SHA retry, `cache:'no-store'` on all sync GETs, cross-device checks merge, in-flight guard, allSettled pulls, auth-error surfacing. Token is user-pasted only (never embedded).
- **Activity log** (Settings → Data → Activity log): timestamped, color-tagged record of check-ins, calls, progressions, injuries, layoffs, syncs, persona/profile events; JSON export. Persisted per persona, capped at 500.
- Offline: service worker precaches the app shell (network-first `no-store` so deploys land instantly; API never cached). `.nojekyll` so Pages serves files as-is.

## Evidence basis
`docs/EVIDENCE-REVIEW.md` — an 8-topic web research + expert critique. Validated the **+10% session cap** (Johansen/Nielsen BJSM 2025), strength-from-day-1 (Lauersen BJSM 2018), conservative run intro, autoregulation, Zone-2/VO2max (Kokkinos JACC 2022), protein 1.6 g/kg. Drove the changes above (RICE→PEACE & LOVE, deloads, detraining, tendon-prep messaging).

## Testing
- 50 logic assertions (decision table, advance/rollover, applyCheck, injury, layoff tiers, deload, units, slug, session/completion, log) — **all pass**.
- 27 UI-flow assertions across every screen — **all pass**; rapid-navigation sweep clean (deferred-bind race guarded).
- GitHub push/pull round-trips verified against the live repo earlier; test data cleaned up.

## 2026-06-17 — Audit, fixes, refactor, rebrand
**Adversarial audit** (multi-agent workflow): 11 subsystems, 33 confirmed issues, each independently verified. **Fixed:**
- *Safety:* red-flag screener now routes to clinician (`INJURY_FLAG`) / PEACE&LOVE rest (`INJURY_REST`) — both were dead code; hurt always showed the generic rest card.
- *Data integrity:* `mergeChecks` dedupes by calendar **date** (was raw ts → duplicate same-day rows inflating counts); same-day re-check that downgrades from Progress **rolls the pointer back** (snapshot in `entry._pre`); `underRecoveryTrend` no longer counts `repeat` (was firing spurious deloads).
- *Personas:* reset fully clears the persona (session/injury/log + activeUser pointer); onboarding **blocks a slug that collides** with an existing local persona; username capped 40 chars.
- *Engine fidelity:* Phase 4 reframed away from daily "100 push / 100 squat" → quality sets (RIR 2-3); the 100s remain only as the capstone TEST.
- *UX:* deload banner suppressed during an active injury; "Still standing" carried call bounded to ≤2 days; corrupt settings blob no longer aborts persona load.

**Verified:** ~70 in-browser assertions across 3 batches — full 30-combo decision table, **full 40-week sim to capstone (session 280)**, 120-day mixed-input sim (no dup rows), injury lifecycle by date, 8 layoff boundaries, every screen renders, persona isolation, reset-via-real-button. All pass.

**Refactor:** monolith → spine + `css/`*4 + `js/`*9 (see Architecture). Behavior-identical (re-ran the suite against the modular build).

**Rebrand:** app renamed **The Hard Part**; new transparent stone-block logo (`logo.png`) on welcome + `icon.png` favicon/PWA; default username placeholder **"Sisyphus"**.

**No-scroll setup:** root-caused the persistent scrollbar (nav-clearance padding was on `#app` for every screen). Moved nav clearance to nav screens only; setup (`.screen.no-nav.onb`) verified **0px scroll** on a 390-wide mobile emulator across all 3 steps.

**OAuth removed** entirely (GitHub-only, no third-party/paid services). **Cleanup:** removed `icon.svg`, `oauth-worker/`, `docs/SETUP-OAUTH.md`, `gen-logos/`, the Gemini source image.

## 2026-06-18 — App shell, day-gate, action-first Today, data safety, a11y
Research-driven (3 cited reviews in `docs/UX-RECOMMENDATIONS.md`). All in-browser tested.
- **Frozen app shell:** every screen = fixed header ("where you are": journey on Today, title elsewhere) + scrolling main + fixed footer (nav, or action bar on onboarding/check). Header+footer share one solid color, width-capped 540 (fixed the "odd"/mismatched footer).
- **Day-gate (timestamp):** one check-in per local calendar day. After check-in, Today shows the call + rest/hydrate + a live "next session opens in Xh Ym (tomorrow)" countdown; next session locked until the next real day. Killed the re-check loop. Edit = pencil on the call card (lock-with-edit).
- **Action-first Today** (NN/g layer-cake, serial-position, progressive disclosure, Fogg): call/session hero leads, ONE filled primary, single banner (injury>layoff>deload), "why" collapsed at the bottom. Journey crumb is Today-only.
- **Data safety (no-GitHub-needed):** lossless Export (incl. injury/session/log/units), Import backup, Restore-last-auto-backup, backup-before-destroy (Reset/Pull snapshot + Reset auto-downloads first).
- **Accessibility:** :focus-visible rings; body-map keyboard/SR operable (role/aria-pressed/Enter-Space); toast aria-live; contrast bump; per-exercise aria-labels.
- **Quick wins:** Library search; Progress empty-state; Back no longer cycles tabs; 3-way low-feel pain discriminator; logo fixed ~172px; "e.g." placeholders; default name "Sisyphus".

## 2026-06-18 (cont.) — Why-formula, no-scroll polish, gait figures, streamlined injury input, full validation
- **"Why this plan?"** brain icon (`ic-why`) on Today opens a **dynamic** panel: today's
  reasoning + the formula + where it leads + your readiness trend (`dayWhy()`), per
  phase/week/age. **Phase tab** now shows the current phase's plain-language formula + the
  studies it's based on (`PHASE_WHY`), plus each phase's formula + references in its detail.
- **No-scroll everywhere it should be:** header single-lined (title no longer clipped);
  `100svh` so content that fits doesn't scroll; **exercise detail** (smaller figure hero) and
  **Progress** (dropped duplicate title, side-by-side stat columns, smaller chart) fit with
  0px scroll on a 390×844 phone; setup never scrolls. Library stays a scrolling list (intended).
- **Tabs get a back-to-Today arrow**; whole exercise card opens its full-steps detail
  (keyboard-activatable; ✓ toggle stops propagation). Hover/press feedback added throughout.
- **Gait figures reworked** (research: human gait cycle): walk + run are now **4-frame**
  loops (`anim4`: contact→passing→contact→passing; run adds flight + ~90° arm pump + knee
  drive). **Glute bridge** redrawn as a proper supine hip-lift. New `animatedFigure` 4-frame mode.
- **Streamlined "Something hurts"**: tapping it minimizes goal/feel to a one-line "change"
  summary and opens an **enlarged tap-the-body map** that fills the screen (no scroll);
  removed the posterior chips and the verbose red-flag screener (its warning-sign guidance
  moved to text on the rest result). **Fixed a real bug:** `bindCheck` bailed on `!goal`, so
  in hurt mode the body-map taps / clear / red-flag were all dead — now guarded on screen+state.
- **Service worker hardened:** install fetches the shell with `cache:'no-store'` (was
  re-caching stale files from the HTTP cache → old-vs-new figure mismatch between windows);
  cache bumped (now `v2.9.0`). This was the cause of "the emulator and website look different".
- **Full validation pass** (in-browser, clean reload): day-gate verified (one row/day, no
  double-advance, same-day downgrade rolls back); decide() 30-combo truth table; every screen
  renders + handlers bind; **12 depth/length persona sims** (start phase 0/1/2; 60–500 days;
  all-good / mixed / oscillating / injury patterns) all monotonic, bounded, no dup rows; long
  good runs reach the **Target/capstone** (~250–460 days, deload-paced) with sensible end-state
  guidance; save/load + backup round-trips. **Result: 20/20 + 41/42** — the lone "fail" was a
  harness artifact (`daysSinceLastCheck` uses real `Date.now()`; the sim faked dates but not the
  clock → bogus layoff). Documented in `AI-START-HERE.md` §5.

## Pending (from EVIDENCE-REVIEW.md, not yet wired into the engine)
- Explicit **RIR 2–3 double-progression** for load advancement (currently in copy, not the engine).
- **Situp training gap:** the capstone tests 100 situps but no situp/curl-up movement is trained (core block is plank+carries). Add a graded ab movement or reconcile the test.
- Split readiness into **sleep + soreness** multi-tap; per-meal protein + creatine coaching; **+10% run cap** is advisory copy only (no distance logging).
- **Sync coverage:** injury/log/session are NOT yet synced to GitHub (only profile/phase/checks); profile/phase push is last-writer-wins. ("Update the save" — next.)

## Updating
Edit files under `css/`+`js/` (or the `index.html` spine), `git push` to `main`. Data lives in `data/users/<slug>/` and is untouched by code updates. To sync, paste a fine-grained GitHub PAT (Contents: Read & Write) in Settings.
