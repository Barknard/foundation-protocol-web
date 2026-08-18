# AI-START-HERE — The Hard Part (read this first)

> One-screen download for any AI/engineer picking up this repo. Read this top to
> bottom before touching code. Deeper detail lives in `docs/` (linked at the end).

---

## 1. What this is
**The Hard Part** (formerly "Foundation Protocol") is a **40-week, research-grounded,
get-in-shape-without-injury program for ~40+**, delivered as an offline-capable **PWA**
hosted on **GitHub Pages**. It runs the whole program as a **daily two-tap decision**.

- Live (when hosting is up): `https://barknard.github.io/foundation-protocol-web/`
- Repo: `Barknard/foundation-protocol-web`, branch **`main`**, served from repo root.
- Owner: Eddie (GitHub `Barknard`). Built iteratively with Claude.
- Logo/brand: stone-block "HARD PART" emblem (`logo.png` welcome, `icon.png` favicon/PWA).
  Default username placeholder is **"Sisyphus"** (the rock-rolling motif).

## 2. How to run & test (do this before trusting anything)
- **No build step.** It's static files. Serve the repo root over HTTP:
  `python -m http.server 8801` (tests in this project use `localhost:8801`).
- **Syntax-check JS without a browser:** `node --check js/<file>.js` (the scripts share
  one global scope, so `node --check` validates syntax; it can't resolve cross-file refs).
- **⚠️ SERVICE-WORKER STALENESS IS THE #1 TESTING TRAP.** `sw.js` caches the app shell.
  During rapid edits each browser window can serve a *mix* of old/new files (e.g. fresh
  `sprite.js` but stale `program.js`). Symptoms: "undefined function", old figures, a
  feature "not applying". **Always, before trusting a test:** unregister the SW + clear
  caches, then hard-reload:
  ```js
  // run in the page, then reload with cache bypass
  for (const r of await navigator.serviceWorker.getRegistrations()) await r.unregister();
  for (const k of await caches.keys()) await caches.delete(k);
  ```
  In Chrome DevTools MCP use `navigate_page {type:'reload', ignoreCache:true}`. Bump
  `CACHE` in `sw.js` (`fp-shell-vX.Y.Z`) on every meaningful change so deploys land clean.
  The SW install now fetches the shell with `cache:'no-store'` so it can't re-cache stale.
- **Two browsers used in testing:** Playwright MCP = **Eddie's real viewing window**
  (HARD RULE: never `browser_resize` it; it's his screen). Chrome DevTools MCP = the
  **mobile emulator** (390×844) — resize that one for phone checks.

## 3. Hosting status (IMPORTANT, not a code problem)
All of Eddie's GitHub Pages sites 404 — **account-level**: *"Actions has been disabled
for this user"* (modern Pages builds run through Actions). Fix is on Eddie's account
(verify email → billing → GitHub Support); a support ticket is filed. **Pushes still
work**; nothing in any repo will fix it. A `.github/workflows/deploy-pages.yml` is in
place for when Actions is re-enabled. Don't rabbit-hole on "deploy is broken" — it's the
account block.

## 4. Architecture (modular, zero-build)
A slim **`index.html` spine** + ordered classic `<script>`/`<link>` tags. All JS shares
one global scope (no modules/bundler) so any function/const is global. Load order matters
(see `index.html`): `sprite → config → state → program → figure → engine → storage → util →
ui → screens → init`.

```
index.html        40-line spine: meta/title, 4 css links, #app, #toast, 10 ordered js tags
css/
  base.css        tokens (colors/type), layout, the app-shell (fixed header/main/footer), spacers
  components.css   buttons/cards/fields/nav/wizard/brand-logo
  figures.css     animated SVG figure sizing + anim2/anim3/anim4 keyframes; .lib-row; .bodymap
  screens.css     per-screen styles (today/check/progress), interaction feedback, no-scroll rules
js/
  sprite.js       injects the SVG <symbol> sheet (UI icons + color-blind glyphs) into the DOM
  config.js       constants (APP_VERSION, storage keys)
  state.js        the single `state` object + load/init
  program.js      PHASES, EXERCISES, BLOCKS, + layoff/deload/injury helpers
  figure.js       parametric skeleton figure engine: FK joints, side/front poses (FIG_POSES),
                  continuous rAF animator, procedural walk/run gait, solid floor/wall, prop helpers
  foot.js         foot-pain domain: zone→condition routing (footKind), per-kind injury windows,
                  recovery gates, guidance cards, tappable foot-map SVG, 2-frame foot close-ups
                  (loads between figure and engine; engine reads its helpers)
  engine.js       decide(), applyCheck(), advancePointer(), OUTCOMES, injury outcomes
  storage.js      localStorage (per-persona) + Export/Import backup/restore
  util.js         isoToday, escHtml, svgUse, animatedFigure, msUntilTomorrow, fmtCountdown
  ui.js           router: navigate(), render(), appHeader/appFooter (app shell), bindEvents()
  screens.js      every screen's render* + bind* (today/check/library/progress/phase/settings/log/result/onboarding)
  init.js         boot + service-worker registration
sw.js             offline app shell; network-first no-store; cache key fp-shell-vX.Y.Z
manifest.json     PWA manifest (name "The Hard Part")
docs/             deeper docs (see §12)
```
Per-persona data lives in the browser's localStorage (see §10), not in repo files.

## 5. THE FORMULA (the heart of the app) — `js/engine.js`
Load follows **readiness, not the calendar.** You earn the next session by doing the work
*and* recovering. Daily input = **two taps**: goal (`done`/`partial`/`missed`) + feel
(`1–5`), plus an optional **hurt** flag.

`decide(goalMet, feel, hurt)` — pure, first match wins:
```
hurt            → Rest   (injury path; red flag → clinician)
feel ≤ 1        → Rest
feel = 2        → Modify (same movement, easier)
done & feel ≥4  → Progress  ← the ONLY outcome that advances the pointer
done & feel = 3 → Repeat
partial/missed  → Repeat
```
`applyCheck(goalMet, feel, hurt, parts, redFlag)` wraps `decide` and applies **modifiers**,
mutates `state`, and returns the outcome:
- **Injury** (`hurt`): sets `state.injury` (PEACE & LOVE windows — `riceUntil` ~3d,
  `easeUntil` ~10d); `redFlag` → `INJURY_FLAG` (clinician), else `INJURY_REST`. Re-check
  with no pain clears it. (Note: the UI red-flag *screener* was removed per Eddie; the
  warning-sign guidance now lives as text in `INJURY_REST.why`. `redFlag` still works if set.)
- **Layoff ease-in** (line ~99): if `progress` but `layoffTier()` (gap ≥15d) or still in
  the injury-protect window → downgraded to `repeat` (no load jump on the first day back).
- **Day-gate** (the "date toll-gate"): **one check per local calendar day.** Same-day
  re-check **replaces** the row (no dup); advancing happens **at most once/day**; a same-day
  downgrade away from Progress **rolls the pointer back** via `entry._pre`. `isoToday()` is
  the day boundary; `msUntilTomorrow()`/`fmtCountdown()` drive the "next session opens in
  Xh Ym" lock on Today.
- **Deload** (`deloadActive`): a lighter week every ~5 weeks (`isDeloadWeek`, phase ≥1) or
  on an under-recovery trend (`underRecoveryTrend`: ≥3 of last 7 are feel≤2/modify/rest —
  deliberately does NOT count plain `repeat`, else steady feel-3 training trips a false deload).
- **`advancePointer()`**: dayInWeek → week → phase. Only `progress` calls it.

**Gotcha for simulations:** `daysSinceLastCheck()` = `Date.now() − lastCheckDate`. If you
override `isoToday()` to fake days but leave `Date.now()` real, you get a bogus huge
"layoff" that forces endless `repeat`. To sim depth/length, also stub
`daysSinceLastCheck = () => 1` (normal daily cadence). This is a *harness* concern only —
real usage is consistent.

## 6. The journey: 5 phases → capstone
`PHASES` (in `program.js`): **0 Infrastructure** (wk 1–4) → **1 Foundation** (5–12) →
**2 Run Introduction** (13–24) → **3 Build** (25–40) → **4 Target** (41+). Each phase has a
plain-language **formula + research references** surfaced on the **Phase tab**
(`PHASE_WHY` in `screens.js`). **Capstone TEST:** a 10K + 100 pushups + a 2-minute plank + 100 squats in one
session. The pointer walks the phases; only Progress carries it forward, so the program is
exactly as long as the body needs (a clean all-good run reaches the capstone in ~280
sessions / ~250–460 calendar days once deloads are counted).

## 7. Research basis (cited in `docs/EVIDENCE-REVIEW.md`)
Autoregulation > fixed % (Saw/Main/Gastin BJSM 2016); strength halves injuries (Lauersen
BJSM 2018); the **+10% session spike** is the real running-injury driver (Johansen/Nielsen
BJSM 2025); slow tendon/bone adaptation paces early phases (Bohm/Arampatzis Sports Med
2015); **PEACE & LOVE** over RICE (BJSM 2019/2020); **RIR 2–3 / anti-failure** for 40+
(ACSM/Pelland 2025); **VO₂max** drives longevity (Kokkinos JACC 2022); protein ~1.6 g/kg.

## 8. UX / screens
- **App shell:** every screen = fixed **header** ("where you are": journey crumb on Today,
  title + back-to-Today arrow on Library/Progress/Phase, gear → Settings) + scrolling
  **main** + fixed **footer** (nav tabs, or an action bar on onboarding/check). Header &
  footer share one solid color, width-capped 540, so they look uniform.
- **No-scroll rules:** setup/onboarding never scrolls; Today fits with the check-in button
  above the fold (vertical "Today's goal" rail); **exercise detail** and **Progress** are
  compacted to fit with no scroll; the **hurt** check-in fits (enlarged body-map). Library
  is the one intentional scrolling list. Mechanism: `100svh` (≤ viewport) so content that
  fits doesn't scroll; `overflow:hidden` only on onboarding.
- **Today:** the call/session leads; a brain **"Why this plan?"** icon (`ic-why`) opens a
  **dynamic** panel — today's reasoning + the formula + where it leads + your readiness
  trend (`dayWhy()` in `screens.js`). After check-in: the call + rest/hydrate + a live
  "next session opens in Xh Ym" countdown (day-gate lock); edit via the pencil.
- **Check-in:** goal chips + feel grid (+ a 3-way low-feel pain discriminator). Tapping
  **"Something hurts"** *minimizes* goal/feel to a one-line "change" summary and opens an
  enlarged tap-the-body map (no chips/screener clutter); Submit ("See the call") / clear.
  **Foot taps drill down** (v2.3.0): the map swaps to a 5-zone foot close-up (heel/arch/
  ball/toes/top) + a ball-only neural question + a 4-chip red-flag screener; heel/arch →
  plantar-fascia protocol, clean ball → forefoot protocol, toes/top → guidance cards,
  neural signs or any red flag → clinician routing. Foot conditions get LONGER windows
  (84d/42d ceilings), a rehab block swapped into the day plan, and a criteria-gated
  recovery (3 gate chips on the pain-free re-check) followed by a 35-day light "tail".
  Evidence: `docs/EVIDENCE-FOOT.md` (verified 2026-08-17 — do not overclaim heel-raise
  superiority; it's complementary to the stretch).
- **Library:** searchable list of 19 exercises, each an animated figure → full-steps detail
  (whole card is tappable). **Progress:** program position + readiness chart + side-by-side
  stat columns. **Phase:** current phase formula + references + all five phases.
- **Whole exercise card** navigates to its detail (role=button, keyboard-activatable); the
  ✓ toggle `stopPropagation`s so it doesn't also navigate.

## 9. Animated figures — parametric skeleton (`js/figure.js`)
Exercise figures are **not hand-drawn SVGs** anymore — they're a **parametric skeleton**
(named joints + forward kinematics), so limbs always connect and angles are data, not
pixels. `animatedFigure(ex, size)` (`util.js`) routes: walk/run → `gaitFigure` (procedural
gait), any `hasFigurePose(ex.key)` → `skeletonFigure`, else the legacy symbol flip-book.

- **Coordinates:** `FIG` = segment lengths (torso 17, neck 7, headR 3.5, thigh/shank 11,
  foot 4, uarm 7, farm 6, ground 57); `viewBox 0 0 50 60`. Angle convention
  `end = J + (L·cos°, L·sin°)`: **down=90, right=0, up=270, left=180**.
- **A pose** (entry in `FIG_POSES`, **19 exercises** + a `standing` sanity check) has `f1`
  (rep start) and `f2` (rep end). Side view: `{pelvis:[x,y], torso, head, nearArm:[upper,
  fore], farArm, nearLeg:[thigh,shank,foot], farLeg, facing:-1?, ground?, wallX?,
  propsBehind, propsFront, intensity}`. **Front view** (`view:'front'`): `leftArm/rightArm/
  leftLeg/rightLeg` + `hipW/shoulderW`, mirrored across center — used for goblet squat,
  band walk, single-leg hop, farmer carry.
- **Animator:** one throttled (~25 fps) rAF loop interpolates every on-screen `.skfig`
  (f1↔f2, eased ping-pong) and runs procedural `.gaitfig`; off-screen figures skip; the red
  **intensity marker pulses** with the feel signal. `_applyConstraints` makes the **floor +
  wall solid** (the figure shifts so nothing passes through).
- **Knee-bend rule** (the recurring bug): facing right, `shankA = thighA + kneeBend` — shank
  folds back, knee tracks forward. `shank < thigh` = wrong-way bend.
- **Walk + run** are procedural (`_gaitPose`): knee bends in the **swing** phase (no
  gliding), hip flexes via cos, arms swing antiphase to the same-side leg, the lowest foot
  is planted each frame. Glute bridge is a supine hip-lift with the head/shoulders planted.
- **To add an exercise:** add ONE `FIG_POSES` entry (f1/f2 joint angles + optional
  `dur`/props/`intensity`) — no drawing. Prop helpers: `propBench`, `propWall`,
  `propDumbbell`, `propKbAt`, `propKettlebell`, `propBand`, `propGobletFront`,
  `propBandFront`. A `__figPreview` dev harness renders the whole set; authoring rules are
  in a header comment in `figure.js`.
- **Color-blind glyphs** (in `sprite.js`): call icons `ic-call-{progress,repeat,modify,rest}`
  + goal states `ic-goal-{partial,missed}` so red/green never carry meaning alone; the
  palette is also separated by lightness (§8 / `base.css`).

## 10. Data & persistence
- localStorage keys (**do not rename — preserves existing data**):
  `foundation-protocol-state-v2:<slug>`, `foundation-protocol-active-user`,
  `foundation-protocol-settings-v2`.
- **Personas:** each profile is its own localStorage entry
  (`foundation-protocol-state-v2:<slug>`) holding that persona's profile/phase/checks; no
  per-persona files are written to the repo.
- **Data safety (local-first):** lossless **Export / Import / Restore-last-auto-backup**
  in `storage.js` (`fullBackup`/`downloadBackup`/`applyBackup`/`snapshotBeforeDestroy`/
  `restoreBackup`); Reset snapshots + downloads a backup first. Opt-in persistent-storage
  request guards against the browser evicting localStorage.

## 11. Testing approach (what "verified" means here)
Logic is validated by **in-browser harnesses** (run via the DevTools/Playwright MCP
`evaluate` after a clean reload). Coverage that should always pass:
- `decide()` 30-combo truth table; every screen renders; handlers bind.
- **Day-gate:** one row/day, no double-advance, downgrade rolls back.
- **Depth/length sims:** dozens of personas (starting phase 0/1/2; 60–500 days; all-good /
  mixed / oscillating / injury patterns) → no errors, monotonic `sessionsCleared`, phase
  in-bounds, no dup-day rows; long good runs **reach the Target/capstone**.
- Save/load + backup export/import round-trips.
- **Sim harnesses (run BOTH before shipping):** `node tools/_daysim.js` (23 scenarios,
  read the TOTAL line — it always exits 0) + `node tools/_daysim-fixes.js` (15 pinned
  scenarios, exits nonzero on failure). Foot-rehab scenarios include a non-foot
  regression pin: generic injuries must behave byte-identically to pre-v2.3.0.
- **Last full pass: 20/20 + 41/42** (the one "fail" was the `daysSinceLastCheck` sim
  artifact in §5, not an app bug).
HARD RULE (Eddie): always Playwright-test or set up for user testing after changes; no
placeholder stubs — build until it works; parallelize independent work via agents.

## 12. Deeper docs
- `docs/HOW-IT-WORKS.md` — full plain-language explanation of the formula + feedback loop.
- `docs/EVIDENCE-REVIEW.md` — the research review behind every rule.
- `docs/UX-RECOMMENDATIONS.md` — the UX research that drove the app-shell/no-scroll work.
- `docs/PROGRESS.md` — chronological progress log (rebrand, audit, refactor, day-gate, etc.).

## 13. Working agreements (carry these forward)
- Push/commit only when Eddie asks (he does ask often — then commit + push to `main`).
- Keep it **free** — no paid or third-party services (OAuth was removed).
- Bump `sw.js` `CACHE` on meaningful changes; verify with a clean reload, not a warm one.
- Match the existing modular style; keep `index.html` a thin spine; zero build step.
