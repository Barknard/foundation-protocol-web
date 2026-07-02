# The Hard Part — Progress Log

**App name:** **The Hard Part** (logo: stone-block "HARD PART" emblem, `logo.png` / `icon.png`). Formerly "Foundation Protocol".
**Live:** https://barknard.github.io/foundation-protocol-web/ · **Repo:** `Barknard/foundation-protocol-web` (GitHub Pages, branch `main`)
**Source:** `~/the-hard-part`
**Last updated:** 2026-06-19
**New AI / engineer?** Read [`AI-START-HERE.md`](../AI-START-HERE.md) first — it's the one-screen download for this repo.

A 40-week, research-grounded get-in-shape-without-injury program for ~40+, run as a daily two-tap autoregulated decision. Offline-capable, **local-first** PWA — data lives in `localStorage` per persona; the only backup is manual Export/Import JSON.

> ⚠️ **Hosting blocker (2026-06-17):** ALL of Eddie's GitHub Pages sites are 404 (foundation-protocol-web, datatrax-audiobook, princess-sparkle-v2 — the last builds cleanly yet 404s — and the `barknard.github.io` root). Cause is **account-level**: "Actions has been disabled for this user" (modern Pages builds run through Actions). Fix is on Eddie's account (verify email → billing → GitHub Support), not in any repo. A GitHub-Actions deploy workflow (`.github/workflows/deploy-pages.yml`) is already in place for when Actions is re-enabled.

## Architecture (refactored 2026-06-17)
No longer one giant HTML file. Now a **slim `index.html` spine** + modular assets, zero build step (classic ordered scripts share one global scope; deploys on Pages as-is):
- `css/` — `base.css` (tokens/type/layout), `components.css` (buttons/cards/fields/nav/wizard), `figures.css`, `screens.css`
- `js/` — `sprite.js` (injects the SVG icon/figure sheet), `config.js`, `state.js`, `program.js` (phases/exercises/blocks + injury/layoff/deload), **`figure.js`** (parametric skeleton figure engine: FK joints, side/front poses, continuous animator, procedural gait), `engine.js` (decide/applyCheck/advance), `storage.js` (localStorage persistence + Export/Import JSON), `util.js`, `ui.js` (router/render), `screens.js`, `init.js` (boot + SW). Load order: sprite → config → state → program → **figure** → engine → storage → util → ui → screens → init.
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
- **Username personas** — each profile is its own per-persona local store (`localStorage`, key `foundation-protocol-state-v2:<slug>`). Switch/load a persona in Settings. Legacy single-user data auto-migrates.

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
- 19 exercises, each a **parametric skeleton figure** (`js/figure.js`) animated start↔end of the rep; walk + run are procedural gait. Joints are connected by construction (no more hand-drawn-SVG limb gaps). Solid floor/wall, pulsing red "feel-it-here" intensity markers, side or front view per exercise. Semantic color: floor=taupe, equipment=gold, motion=blue, body=cream.

**Data, sync, audit**
- **Local-first data** (per persona): all state lives in the browser (`localStorage`, key `foundation-protocol-state-v2:<slug>`); the only backup/transfer is manual **Export / Import JSON**. There are **zero network calls to GitHub** for data. *(A former optional GitHub Contents-API data-sync — user-pasted fine-grained PAT, per-persona push/pull — was **REMOVED 2026-06-24**, commit `ca9cea4`: using the repo as an application datastore tripped GitHub's abuse detection and blocked Pages.)*
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

## 2026-06-19 — Parametric skeleton figure engine, color-blind palette, logout
The hand-drawn 2/3/4-frame SVG figures were the root cause of every "looks insane / wrong
direction / limbs don't connect" report, so they were **replaced by a parametric skeleton**
(`js/figure.js`) — joints are now connected by construction.

**Figure engine (`js/figure.js`)**
- **Model:** named joints + forward kinematics. `FIG` segment lengths (torso 17, neck 7,
  headR 3.5, thigh/shank 11, foot 4, uarm 7, farm 6, ground 57). Angle convention
  `end = J + (L·cos°, L·sin°)`: **down=90, right=0, up=270, left=180**.
- **Pose format:** side view = `{pelvis:[x,y], torso, head, nearArm:[upper,fore],
  farArm:[…], nearLeg:[thigh,shank,foot], farLeg:[…], facing:-1?, ground?, wallX?,
  propsBehind, propsFront, intensity}`; `f1` = rep start, `f2` = rep end. **Front view**
  (`view:'front'`) uses `leftArm/rightArm/leftLeg/rightLeg` + `hipW/shoulderW`, mirrored
  across center — used for **goblet squat, band walk, single-leg hop, farmer carry** (read
  better head-on).
- **Animator:** one throttled (~25 fps) rAF loop interpolates every on-screen `.skfig`
  (f1↔f2, eased ping-pong) and runs procedural `.gaitfig`; off-screen figures are skipped;
  the **red intensity marker pulses** with the feel signal. `_applyConstraints` makes the
  **floor and wall solid** (the whole figure shifts so nothing passes through).
- **Knee-bend rule** (the bug that bit twice): facing right, `shankA = thighA + kneeBend`
  so the shank folds back and the knee tracks forward; `shank < thigh` bends the wrong way.
- **Walk + run** are **procedural gait** (`gaitFigure`/`_gaitPose`): knee bends during the
  swing phase (no gliding), hip flexes via cos, arms swing antiphase to the same-side leg,
  the lowest foot is planted to the ground each frame.
- **Adding an exercise** = add one `FIG_POSES` entry (f1/f2 joint angles + optional
  `dur`/props/`intensity`) — **no SVG drawing**. Prop helpers: `propBench`, `propWall`,
  `propDumbbell`, `propKbAt`, `propKettlebell`, `propBand`, `propGobletFront`,
  `propBandFront`. Authoring rules are documented in a header comment in `figure.js`; a
  `__figPreview` dev harness renders the whole set. `animatedFigure()` routes walk/run →
  `gaitFigure`, posed keys → `skeletonFigure`, else the legacy symbol flip-book.

**Color-blindness (WCAG 1.4.1)** — without disturbing the warm yellow/brown look:
- Palette re-spaced by **lightness** so hue is never the only cue: `--strength` #CE4F38
  (darkest) / `--cardio` #5B86C4 / `--mobility` #92C285 / `--milestone` #E3AC3C (lightest).
- **Redundant glyphs**: call icons `ic-call-{progress,repeat,modify,rest}` and goal states
  `ic-goal-{partial,missed}` so red/green never carry meaning alone.

**Other**
- **Sticky Today header:** the vertical "Today's goal · X/N" rail stays pinned at the top
  while an expanded prescription list scrolls (`.goal-vert { position: sticky; top: 62px }`).
- **Logout / switch account:** `logout()` is a **soft** sign-out (saves, zeroes in-memory
  state, clears the active-user pointer, but keeps each persona's localStorage). "Log out"
  button in Settings; the welcome-screen **resume is now a dropdown** (`#onb-resume-sel` +
  Continue) instead of a long list.
- **Final figure fixes from review:** walk swing-phase knee lift; sl_squat + split_sq knee
  direction; glute bridge head/shoulders planted (only hips lift); goblet squat arms hold the
  bell low/centered; farmer carry tall two-hand; single-leg hop a real vertical hop;
  kettlebell swing slowed (~2200 ms). All re-verified by screenshot.
- SW cache bumped to **`fp-shell-v3.1.0`**; `js/figure.js` added to the precache SHELL.

## 2026-06-19 (cont.) — Figure refinements + a pose reference doc
- **Bigger figures:** Today exercise-card figures 46→76px, Library list 56→92px, and the
  exercise-detail **demo hero ~140→280px** (the Library is where big matters most).
- **Depth + joint limits** in `js/figure.js`: far limbs are dimmer **and thinner** for
  front/back depth; knees & elbows are clamped to natural hinge ranges so nothing folds the
  wrong way (side view clamps the knee by direction; **front view clamps by magnitude**, since
  the left/right legs flex opposite ways — that fixed the goblet "slide" and the single-leg
  hop's tucked leg).
- **Gait landing:** the stance knee gives at each foot-strike so walk/run visibly land & rebound.
- **Pinned "feel" marks:** the red intensity markers are fixed points now (calf raise, single-
  leg calf raise, calf stretch, hip abduction, band walk, RDL) so they don't drift start→end.
- **Pose fixes:** calf stretch moves only the back leg; goblet squat bends both knees out with
  the feet planted; overhead press presses on the right side; split-squat bench is fixed with
  legs (stationary).
- **Farmer carry** now reuses the **procedural walk gait** with a **kettlebell in each hand**
  (arms hang, no swing) instead of a static march.
- **"Why this plan?"** persists upper-right in every Today state (pre-check and checked-in).
- **New doc:** [`docs/FIGURE-POSES.md`](FIGURE-POSES.md) — decoded from `FIG_POSES`: per-exercise
  start/end of every body part as angle (with arrow) **and** on-screen (x, y), plus a list of
  off-canvas reaches worth tweaking. SW cache `fp-shell-v3.3.0`.

## 2026-06-24 — GitHub data-sync removed (now strictly local-first)
The optional GitHub Contents-API data-sync (user-pasted fine-grained PAT, per-persona push/pull on check-in) was **removed entirely** (commit `ca9cea4`). Using the repo as an application datastore tripped GitHub's abuse detection and blocked Pages, so the app is now **strictly local-first**: data lives in `localStorage` per persona and the only backup/transfer is manual **Export / Import JSON** — zero network calls to GitHub. Earlier dated entries that mention sync / PAT / "Pull" describe that now-removed feature. (GitHub **Pages** hosting and the public repo are unaffected.)

## Pending (from EVIDENCE-REVIEW.md, not yet wired into the engine)
- Explicit **RIR 2–3 double-progression** for load advancement (currently in copy, not the engine).
- ~~**Situp training gap:** the capstone tests 100 situps but no situp/curl-up movement is trained (core block is plank+carries). Add a graded ab movement or reconcile the test.~~ **RESOLVED 2026-06-20:** test reconciled — the capstone now requires a **2-minute plank** instead of 100 situps, matching the trained anti-extension core (plank + carries) per EVIDENCE-REVIEW §5.
- Split readiness into **sleep + soreness** multi-tap; per-meal protein + creatine coaching; **+10% run cap** is advisory copy only (no distance logging).
- ~~**Sync coverage:** injury/log/session are NOT yet synced to GitHub (only profile/phase/checks); profile/phase push is last-writer-wins.~~ **OBSOLETE 2026-06-24:** GitHub data-sync was removed entirely (see above); the app is local-first, so there is no sync to extend — backup is Export/Import JSON.

## Updating
Edit files under `css/`+`js/` (or the `index.html` spine), `git push` to `main`. Data lives locally in the browser (`localStorage`, per persona) and is untouched by code updates.

## 2026-07-02 — Seven-fix batch from the holistic multi-agent review (v2.2.0)
A 181-agent adversarial review (9 finder dimensions → 3-skeptic verification per major finding → completeness critic) plus a live browser pass surfaced 3 critical + ~20 major defects. All seven recommended fix groups shipped, sim-verified red→green:

1. **Deload deadlock (critical)** — `isDeloadWeek()` is pointer-derived and the deload hold converted every Progress to Repeat, so the pointer could never leave loaded week 5 (33 frozen days in sim). The scheduled deload week now advances with the lightened prescription (`loadReduction()` has teeth) and self-expires after its 7 sessions; return-day/injury/under-recovery holds are unchanged.
2. **Honest APK backup (critical)** — Android System WebView has no `navigator.share` and stock Capacitor ignores `<a download>`, so every export in the APK was a silent no-op that still toasted "Backup saved" and green-lit destructive reset. `downloadBackup()` is now async and native-first: `@capacitor/filesystem` writes the JSON to app cache, `@capacitor/share` opens the system share sheet, and it resolves `true` only when the share completes. All callers await it and word toasts honestly ("No backup left this device — delete anyway?").
3. **Cross-persona import (critical)** — importing persona B's backup while A was active snapshotted A and destroyed B's newer data unrecoverably. The import now snapshots and confirms against the persona the *file* targets, even when logged out.
4. **Engine trio (major)** — (a) an evening→morning schedule (<12h across midnight) *replaced* yesterday's history row; it now keeps both rows and holds the pointer for one day ("tooSoon" Repeat — the day counts, the load doesn't step up); the hold also covers same-day pencil re-edits of that morning check and expires naturally after 12h; backward-clock tamper protection unchanged. (b) "I didn't take time off" is now honored by the engine: the dismissal is stored as a persisted DATE (`layoffDismissedOn` — "I was active this day") and `effectiveLayoffGap()` caps every gap measurement across it, so the bogus gap never acts while real absence *after* the dismissal still counts in full (an adversarial verifier killed the first scalar design for being both too permanent and too fragile). (c) `lastCheckTs(excludeToday)` — re-editing the return-day check no longer collapses the layoff gap to 0.
5. **One-liners** — the storage-pressure warning compared an object to 0.8 and could never fire (both call sites); the SW runtime cache now only stores `resp.ok` responses (a mid-deploy 404 can no longer poison the offline shell); `savedPersonas()` filters `:backup` aux keys itself (the welcome screen listed "name:backup" as a login and forked saves onto it).
6. **Interaction pass** — selection is globally off with input opt-ins (no more long-press selection handles); the scroll cue updates when expanding/collapsing blocks and filtering the Library (and measures `max(html, body)` height); onboarding scrolls instead of clipping the Age field on short viewports; the Library search input (`type=search`) joins the field CSS (was UA-default 13px); the mark-done check gets a 48px hit pad (`::after`) so a near-miss can't yank you to the detail screen; `overscroll-behavior-y: none`; the Android back gesture now navigates back instead of exiting the app (`@capacitor/app` listener; exits only from Today/welcome roots).
7. **Great deletion + one identity** — the superseded flip-book animation system is gone (~48 sprite symbols, `FRAMES`, the `util.js` fallback, `.anim*` keyframes — sprite.js 569→51 lines); dead CSS blocks removed (sync pip, password/textarea, switch, slider, zone, screen-head, bm-chip, `.btn`, `.no-nav`); vestigial code removed (`markDirty` shim, `_preDay`, `capstoneReached`, dev harnesses `__rirTest`/`__figPreview`/`poseSVG`, orphan `standing` pose, `carry.dur`, `.nojekyll` in the app copy); `dayWhy()`'s formula + "where this leads" are now actually rendered in the why-panel (the comments always claimed they were); log export renamed `the-hard-part-log-*`; sw.js rewritten under the current name with cache `thp-shell-v2.2.0`; `APP_VERSION` 2.2.0. The `foundation-protocol-*` localStorage prefixes stay **on purpose** (renaming would orphan every install's data) and are documented as such in config.js.

Also fixed en route: reset now zeroes `targetReachedAt`/`celebrationSeen` (a new persona after reset could instantly trigger the capstone celebration).

**Verification:** `tools/_daysim.js` (the 18-scenario temporal-invariant harness) passes 0 failures against the new engine, and the new `tools/_daysim-fixes.js` pins the four engine fixes red→green plus the verifier-found holes and exercise→figure coverage (10 scenarios). A 6-verifier + 2-regressor adversarial fleet then re-attacked every fix; its 3 major refutations of the first dismissal/tooSoon design are what produced the date-anchor model above. Live browser pass: onboarding→session→check-in→call→lockout, offline boot on the new SW (old cache auto-purged), zero console messages throughout.
