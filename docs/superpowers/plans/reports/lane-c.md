# Lane C report — Screens + CSS (foot-pain-rehab, Task C)

Owner: coder (Lane C). Files owned: `js/screens.js`, `css/screens.css`, `css/figures.css`.
Consumes the pinned `js/foot.js` contract + extended `applyCheck(..., foot)` — built against the plan's
pinned names, called exactly as spelled.

## Log

- Read the plan (`docs/superpowers/plans/2026-08-17-foot-pain-rehab.md`), the design spec
  (`docs/superpowers/specs/2026-08-17-foot-pain-rehab-design.md` §2/§3 in full), `AI-START-HERE.md` §8,
  and the existing patterns to match: `bodyMap()`/`bmPickText()`/`fitBodyMap()` (screens.js:353-398 at
  plan-authoring time), goal chip-row radiogroup pattern (:506), the low-feel pain-discriminator
  "replace, don't stack" card, `checkFooter()`, `bindCheck()`'s focus-restoration (`_focusAfter`) idiom,
  and the deferred-bind (`setTimeout(bind,0)` + `state.ui.screen !== 'x'` guard) convention.
- Read `css/screens.css` and `css/figures.css` in full for the token palette (`--ink`/`--strength`/
  `--red-text`/`--mobility`/etc.), `.chip`/`.chip.yes`/`.chip.no` (already exist, reused as-is for every
  new Yes/No question), `.card-block`, `.wiz-nav`, and confirmed `figures.css` currently has **no**
  `anim2` keyframe (the plan brief's "mirror the anim2 pattern" points at something that no longer
  exists in this file — the old flip-book keyframes "died with the sprite frames" per an existing
  comment) — designed a small self-contained cross-fade keyframe instead, see below.
- **Mid-task discovery: Lanes A, B, D, and E had already landed** (`js/foot.js`, `js/engine.js`,
  `js/program.js`, `js/state.js`, `js/storage.js`, `js/figure-poses.js`, `js/figure.js`,
  `tools/_daysim.js`, `tools/_daysim-fixes.js` all present and modified on disk, with lane reports
  showing 18/18 + 23/23 + 9/10-expected sim runs). This is further along than "runs against the pinned
  contract, red until A/B land" — I read the real landed `js/foot.js`/`engine.js`/`program.js` to
  cross-check every identifier I call (see "Verification" below), and it let me self-refine against the
  REAL contract implementation rather than the pinned spec alone.

### Implementation (all in `js/screens.js` unless noted)

- **Drill-down step** (§3.1): `bodyMap()`'s `[data-part]` handler special-cases `'left foot'`/`'right
  foot'` — single-select per foot (picking one clears the other), sets `_footSide`/`_footView=true`,
  resets zone/neural/screener when the side actually changes, re-opens the close-up on a re-tap of an
  already-selected foot rather than deselecting it. New `renderFootStep(t)` renders whichever sub-step
  is next — ball-only neural question, then the 4-chip red-flag screener, then `footMapSvg(t.footZone)`
  — one at a time in the SAME `fitBodyMap`-sized slot the body map used, never appended below it (the
  zero-scroll invariant). `"◀ whole body"` ghost (`.foot-back`, new class, ≥48px) returns to the body
  map without losing the drill-down answers. `fitBodyMap()`'s selector widened to
  `svg.bodymap, svg.footmap` (confirmed after Lane A landed: `footMapSvg` actually emits
  `class="bodymap footmap"`, so `.bodymap` alone already matched — the widened selector is a safe no-op
  insurance, not dead weight, since it doesn't assume which class ships).
- **`chkReady(t)`** extended: hurt mode now additionally requires `footZone` (+ `footNeural` for ball) +
  `_screened` whenever a foot part is present in `t.parts` — checked regardless of which view is
  showing, so backing out via "whole body" can't skip the screener. Non-hurt mode additionally requires
  all three `FOOT_GATES[kind]` answers when `injuryActive() && footRehabKind(injury.kind)`.
- **Recovery re-check gate** (§3.5): `footGateChipsHtml(t)` renders the 3 gate chips from `FOOT_GATES`
  (verbatim question copy) as Yes/No chip-rows (reusing `.chip.yes`/`.chip.no`, already styled) whenever
  a pain-free re-check is happening on an active foot-rehab injury; wired with the same in-place
  radiogroup update pattern as the existing goal chip-row (no full re-render for a chip pick).
- **Submit**: `footParamForSubmit(t)` builds the pinned `foot = {zone, neural, gate}` shape — from the
  fresh drill-down on a hurt submit, or from `state.injury.foot` + the just-answered gate on a pain-free
  re-check; `null` otherwise. `applyCheck(t.goalMet, t.feel, t.hurt, t.parts, t.redFlag, foot)` now
  passes the 6th param. `state.ui.resultFoot`/`resultFootHurt` stashed right before `delete state._chk`
  (same convention as the existing `resultOutcome` stash) so the result screen has what it needs.
- **Result screen** (§3.2/§3.5): `footResultBlockHtml()` picks one of four blocks by reading current
  state (never re-deriving `kind` itself — always trusts `state.injury.kind`/`state.rehabTail.kind`,
  the engine's own output, so copy can't drift): `footProtocolBlockHtml` (foot-pf/foot-meta — exercises
  read live from `BLOCK_EX`/`EXERCISES`, pain rule, time-course, "what changes tomorrow", short
  citation), `footGuideBlockHtml` (renders `footGuideFor(kind, neural)`'s `{title, what, doNow,
  seeSomeone, cite}` shape verbatim), `footTailStartedBlockHtml` (gate-cleared → tail begins),
  `footGateFailedBlockHtml` (names exactly which gate question(s) are still unmet).
- **Today**: banner label already comes from `standingCall()` (Lane B → `FOOT_CONDITION_NAMES`), no
  change needed there. Added `footClinicianNudgeText()` — day ≥14 of an active foot-rehab injury AND a
  logged "Gate not yet met" entry since the injury started → appends a clinician-nudge sentence to the
  banner's action line (reads the injury log itself, never a private flag). `dayWhy()` gained a new top
  branch (checked before the phase-based chain) for an active foot-rehab injury or its relapse tail —
  why loading beats rest, what the gate is, a pointer to Settings → Evidence.
- **Library**: `'Foot'` appended to the `cats` array.
- **Figure routing** (§7.3): new `figureFor(ex, size)` tries `footCloseupFigure(ex.key, size)` first,
  falls back to `animatedFigure(ex, size)` — applied at all three call sites that render a figure from
  an `EXERCISES` entry (Today's exercise card, Library row, exercise-detail hero). Confirmed via grep
  that these were the *only* three `animatedFigure(ex, ...)` call sites in the app, so this closes Lane
  A's own flagged open concern ("nothing wires `footCloseupFigure` into the UI, and `util.js` isn't
  owned by any lane") without touching `util.js` at all.
- **Settings → Evidence**: appended the two primary foot-pain citations (Rathleff 2015, DiGiovanni
  2003/2006) + a pointer line to `docs/EVIDENCE-FOOT.md`, matching the existing bibliography-string
  format.
- **Fixed Lane B's flagged escalation**: `lane-b.md` reported that the Settings → Reset handler (in
  screens.js, out of Lane B's scope) needed `state.rehabTail = null;` alongside its other nulls. Added
  it (one line, `s-reset` click handler).
- **CSS** (`css/screens.css`): `.footmap` sizing rule (mirrors `.bodymap` — confirmed redundant-but-safe
  once Lane A's actual class list was visible), `.foot-back` (48px ghost back-button), `.chip.screen-chip
  .active` (red-flag chips read as a warning when selected — same lighter-red-fill + dark-text technique
  already used by `.chip.no.active` for contrast). Added `.foot-back` to the existing touch-action /
  hover / press selector lists alongside the other interactive classes. Zone-button styling needed **no**
  new CSS — confirmed `footMapSvg`'s buttons carry `.bm-seg`/`.bm-seg.sel`, already fully styled.
- **CSS** (`css/figures.css`): a small self-authored cross-fade keyframe (`footcu-cross`, 2.6s ease-in-out,
  `g.f1`/`g.f2` with `reverse` direction on f2) since no `anim2` pattern actually exists in this file to
  mirror; reduced-motion override freezes on f1 visible/f2 hidden via `animation: none` (verified this
  wins over the global `screens.css` reduced-motion rule regardless of cascade order, since the global
  rule only forces `animation-duration`/`animation-iteration-count`, never `animation-name`). Confirmed
  no pre-existing `.f1`/`.f2` class usage anywhere else in the codebase (grep), so the selector is scoped
  safely without needing a dedicated wrapper class. No figure *sizing* CSS was needed —
  `footCloseupFigure` wraps its output in `<span class="afig">...` exactly like `skeletonFigure`/
  `gaitFigure`, so every existing `.afig`/`.fig-hero .afig`/`.lib-row .fig svg`/`.ex-card .fig` rule
  already applies with zero new code.
- `node --check js/screens.js` — pass, throughout (re-run after every edit batch).

## Verification (real integration test, not blind against the spec)

Since Lanes A/B/D had already landed, I wrote a throwaway VM harness in my scratchpad (mirrors
`tools/_daysim.js`'s load pattern — not a repo file) that loads the REAL
`config→state→program→figure-poses→figure→foot→engine→storage→util→screens.js` stack and drove **44
assertions** directly against my new screens.js functions AND the real `applyCheck`/`currentDayPlan`
they call into:

- Full drill-down render sequence (side pick → zone pick → ball-only neural question → screener →
  confirmed foot map), `chkReady` false at every incomplete step and true only once complete, for both
  a ball zone (goes through the neural question) and a non-ball zone (skips straight to the screener).
- `footParamForSubmit` → real `applyCheck(...)` round-trip: confirmed `state.injury.kind` resolves via
  the REAL `footKind()` (not a re-derivation of my own), `state.injury.foot` matches what was submitted,
  checks-row `footZone` is set.
- Result screen: foot-meta protocol block lists exactly `calf_stretch`/`foot_intrinsic` (never the
  PF-only heel raise) read live from `BLOCK_EX`; a gate-clear submission renders the "Recovery gate
  passed" tail-started block using `FOOT_CONDITION_NAMES`; a gate-fail submission names exactly the
  failed question(s) and omits the passed one.
- Non-foot regression: a plain body-part hurt flag builds `foot=null`, `applyCheck` keeps
  `kind:'acute'`/`injury.foot:null`, and a bare pain-free re-check on it needs no gate — `chkReady`/
  `footGateChipsHtml` are both inert for it.
- `figureFor()`: `pf_stretch` → the close-up (`class="footfig"`), `pf_heel_raise` → the skeleton pose
  (Lane D's `FIG_POSES` entry, `class="skfig"`), `walk` → the gait figure, unaffected.
- `dayWhy()`'s new branch names the condition via `FOOT_CONDITION_NAMES` (not the raw kind string);
  `footClinicianNudgeText()` stays empty with no failed-gate log entry even past day 14, and fires once
  one exists.
- Also spot-checked outside the harness: `renderLibrary()` shows the `Foot` category with all 3 new
  exercise names; `renderToday()` (pre-check-in state) shows the swapped `Foot rehab` block label and
  the plain-language banner name; `renderSettings()` mentions `EVIDENCE-FOOT.md`; editing
  (`state.ui.params.edit`) a previously-submitted foot check-in reopens cleanly (body map, foot part
  pre-selected, drill-down correctly disabled/incomplete until re-answered — documented limitation, not
  a crash, see below).
- First run surfaced 2 failures — **both were bugs in my own test harness, not in screens.js**: (1) a
  case-sensitivity mismatch (my assertion checked for lowercase "plantar heel pain", the actual
  sentence-capitalized text is "Plantar heel pain — cleared its recovery gate."); (2) state leakage
  between test sections (`state.log` wasn't reset between scenarios, so an earlier "Gate not yet met"
  log entry from a different scenario made a later day-14-nudge check look like a false positive).
  Fixed both in the harness and re-ran clean: **44/44 pass**.
- `node --check js/screens.js` — pass (final).

## Known limitation (documented, not fixed — judgment call)

Editing (pencil icon) a previously-submitted foot check-in does **not** restore `footZone`/`footNeural`
— it pre-fills `goalMet`/`feel`/`hurt`/`parts` only (mirroring the existing `redFlag: false` reset on
edit), so the user must re-tap into the foot and redo the zone/neural/screener steps before "See the
call" re-enables. This matches an existing precedent (redFlag is already reset to false on every edit,
never restored) and is also a hard constraint of the pinned contract: the checks row only persists
`footZone` (a string), never `footNeural`, so full rehydration isn't possible from stored data anyway.
Verified this doesn't crash — it degrades to "re-answer the drill-down," never a stuck/broken screen.

## Seams I could NOT exercise (real DOM / event wiring — flagging for the overseer's Playwright pass)

Everything above is verified as pure string-output + state-mutation logic against the real engine. I do
**not** have a browser in this toolset, so the following are unverified by me and need the integrated
Playwright pass:
- Actual click/keyboard event wiring in `bindCheck()` (the `[data-zone]`, `[data-q="neural"]`,
  `.screen-chip`, `#foot-screen-go`, `[data-q^="gate-"]`, `#foot-whole-body` handlers) — I traced these
  by hand against the existing body-map/goal-chip patterns they mirror, but never fired a real DOM click.
- `fitBodyMap()`'s actual pixel sizing on a real viewport when the drill-down's extra "◀ whole body"
  strip adds height above the map (the math is the same dynamic `getBoundingClientRect().top` measure
  the existing body map already relies on, so it should self-adjust, but only a real render proves it).
- The cross-fade keyframe's visual result (opacity timing, whether the two close-up frames read as a
  clean loop vs. a jarring cut) — CSS was reasoned through, not screenshotted.
- Focus continuity in a real browser (`_focusAfter` selector targets were chosen to always exist in the
  next render, e.g. `.screen-chip` after a zone pick, `.foot-back` after the screener's Continue — but
  keyboard-tab order across the transitions is untested).
- The `Recovery check` gate card's visual fit within the zero-scroll invariant on a genuinely small
  phone (390×844) — I kept it compact and noted in-code that this is the one accepted place where the
  existing scroll-cue fallback may kick in on short viewports, since three yes/no questions is real
  content and this flow is rare (only during an active foot-rehab re-check), unlike the hurt screen's
  own hard zero-scroll requirement.

## Final file list touched
- `js/screens.js`
- `css/screens.css`
- `css/figures.css`
(No other files touched. No git commands run.)
