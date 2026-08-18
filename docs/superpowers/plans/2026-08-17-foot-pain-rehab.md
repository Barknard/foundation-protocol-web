# Foot Pain Drill-Down + Rehab — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** When a check-in reports foot pain, drill down to a zone, route to evidence-backed protocols or guidance, adapt the daily plan until a criteria-gated recovery, and prove it all with sims + e2e.

**Architecture:** New contract-bounded `js/foot.js` domain module (zones, routing, windows, gates, guides, close-up figures) consumed by the existing engine/screens through pinned signatures below. All other changes are additive edits to existing files. Zero build, classic scripts, one global scope, load order `… program → figure → foot → engine → …`.

**Tech Stack:** Vanilla JS/CSS PWA; node VM sim harnesses in `tools/`; Playwright MCP for e2e.

**Spec:** `docs/superpowers/specs/2026-08-17-foot-pain-rehab-design.md` (read it first; this plan implements it 1:1). Evidence: `docs/EVIDENCE-FOOT.md` — **a verification pass is updating it in parallel; Task F reconciles any rx/window changes before ship.**

## Global Constraints

- Branch `foot-pain-rehab`. **Lanes never run git** — the overseer commits (explicit paths only, never `-A`).
- One writer per file. Ownership is per task below; do not touch files outside your task.
- Storage keys unchanged (`foundation-protocol-*`). Non-foot injury behavior byte-identical (Task E pins it).
- Zero-scroll hurt screen; new tap targets ≥48px; radiogroup/aria patterns copied from the existing body map.
- `APP_VERSION` → `2.3.0` and `sw.js` `CACHE` → `thp-shell-v2.3.0` in lockstep (Task A).
- Copy style: plain language, no naked citations on glanceable surfaces (citations live on detail/result "why" and Settings→Evidence).
- WRITE AS YOU GO: each lane appends to `docs/superpowers/plans/reports/<lane>.md` (create it first; log results and dead ends as they land).
- `node --check js/<file>.js` after every edit to a js file. Never edit source via PowerShell round-trip.

---

## The pinned contract (all tasks build against THIS)

```js
// js/foot.js — the only new global surface. Names are law; do not improvise.
const FOOT_ZONES = ['heel','arch','ball','toes','top'];

// zone + ball-neural answer + red-flag screener -> injury kind
// neural is null unless zone==='ball'. Any redFlag wins.
function footKind(zone, neural, redFlag) {
  if (redFlag) return 'foot-refer';
  if (zone === 'ball') return neural ? 'foot-refer' : 'foot-meta';
  if (zone === 'heel' || zone === 'arch') return 'foot-pf';
  return zone === 'toes' ? 'foot-toes' : 'foot-top';
}

// per-kind windows in DAYS; anything not listed (incl. 'acute', non-foot) -> {rice:3, ease:10}
const FOOT_WINDOWS = { 'foot-pf': {rice:3, ease:84}, 'foot-meta': {rice:3, ease:42} };
function footWindow(kind) { return FOOT_WINDOWS[kind] || {rice:3, ease:10}; }

// kinds whose plan swaps in a rehab block
function footRehabKind(kind) { return kind === 'foot-pf' || kind === 'foot-meta'; }

// recovery-gate definitions; answers object uses these keys
const FOOT_GATES = {
  'foot-pf':   [ {key:'walk',    q:'Pain-free during normal daily walking?'},
                 {key:'morning', q:'Morning first-step pain gone, or barely there?'},
                 {key:'raises',  q:'20 single-leg heel raises without the pain flaring?'} ],
  'foot-meta': [ {key:'walk',    q:'Pain-free during normal daily walking?'},
                 {key:'morning', q:'No ache under the ball of the foot on normal days?'},
                 {key:'raises',  q:'Your foot-core set done without the pain flaring?'} ],
};
function footGatePassed(kind, answers) {
  const gate = FOOT_GATES[kind]; if (!gate) return true;
  return gate.every(g => answers && answers[g.key] === true);
}

const REHAB_TAIL_DAYS = 35;   // 28–42d band, evidence §6c (extrapolated — copy must say so)

const FOOT_CONDITION_NAMES = {
  'foot-pf':'plantar heel pain', 'foot-meta':'ball-of-foot overload',
  'foot-refer':'foot pain — clinician', 'foot-toes':'toe pain', 'foot-top':'top-of-foot pain' };

// guidance cards; footGuideFor returns null for protocol kinds
// each guide: {title, what, doNow:[...], seeSomeone:[...], cite}
function footGuideFor(kind, neural) { /* 'foot-toes'|'foot-top' -> FOOT_GUIDES.<zone>; 'foot-refer' -> neural ? FOOT_GUIDES.neuroma : FOOT_GUIDES.redflag */ }

// markup builders (return SVG/HTML strings; no DOM writes)
function footMapSvg(selZone)            // tappable close-up, buttons carry data-zone
function footCloseupFigure(key, size)   // 'pf_stretch' | 'foot_intrinsic' -> 2-frame figure markup; null otherwise
```

```js
// engine.js — applyCheck gains ONE optional param (additive; old call sites unchanged):
applyCheck(goalMet, feel, hurt, parts, redFlag, foot)
// foot = null | { zone:'heel'|'arch'|'ball'|'toes'|'top', neural:true|false|null, gate:null|{walk,morning,raises} }
```

```js
// state additions (all default null; declared in state.js, persisted in storage.js):
state._chk.footZone; state._chk.footNeural;          // draft only, not persisted
state.injury.kind;   state.injury.foot;              // {zone, neural} | null
state.rehabTail;                                     // {kind, until} | null
// checks row += footZone (string|null)
```

---

### Task A: `js/foot.js` module + wiring  — LANE A owns `js/foot.js`, `index.html`, `sw.js`, `js/config.js`

**Files:** Create `js/foot.js`; Modify `index.html` (script tag between figure.js and engine.js), `sw.js:16-27` (CACHE `thp-shell-v2.3.0`, SHELL += `./js/foot.js`), `js/config.js:5` (`APP_VERSION='2.3.0'`).
**Interfaces:** Produces the entire pinned contract above. Consumes nothing new.

- [ ] Create `docs/superpowers/plans/reports/lane-a.md`; log as you go.
- [ ] Implement the contract exactly as pinned. `FOOT_GUIDES` content (write in full, plain-language, this copy ships):
  - `toes`: title "Toe pain isn't a load problem." Symptom branches: sudden hot/red/swollen joint (esp. overnight, big toe) → "get seen promptly — this pattern (gout-like) needs medication, not exercise"; gradual bump/stiffness at the big-toe joint → "footwear with a wide toe box now; a clinician can plan long-term (bunion / stiff big toe pattern)"; bent-back toe injury → "protect it and get it checked — pushing through risks a joint that never quite works again". End: "None of these respond to a home exercise program — that's why we're not giving you one."
  - `top`: title "Top-of-foot pain — usually pressure, sometimes bone." Do-now: relace/skip an eyelet over the sore spot, softer tongue, relative rest from impact. The bone line: "One pinpoint sore spot on a bone, pain at rest or at night, or a recent jump in training — stop and see a clinician. A navicular stress fracture hides from early X-rays and punishes people who train through it." Thin-evidence sentence required.
  - `neuroma`: title "That burning between the toes needs an exam." Why self-care is wrong here; what to tell the clinician (which toes, when it burns, the pebble feeling).
  - `redflag`: title "This one's not for self-management." Names the flag categories; urgency proportional copy.
  - All four end with: "Not improving after two weeks of sensible care? See a clinician."
- [ ] `footMapSvg(selZone)`: side-profile right foot, viewBox ~`0 0 100 152` like `bodyMap()` (`screens.js:353-378`), 5 zone `<rect>/<circle>/<path>` buttons using the same `a(part)` attribute pattern (`data-zone`, `role=button`, `tabindex=0`, `aria-pressed`), `.bm-seg`-compatible classes so existing CSS mostly applies; every target ≥48px after `fitBodyMap` scaling.
- [ ] `footCloseupFigure`: two 2-frame pairs — `pf_stretch` (seated, hand pulling toes toward shin: f1 toes neutral, f2 toes drawn back with visible arch band) and `foot_intrinsic` (bare foot on ground: f1 flat, f2 arch domed + toes pressing). Same warm palette vars as figures (`--ink`, `--strength` accent), `<g class="f1">/<g class="f2">` cross-faded by a tiny CSS keyframe added by Lane C; no rAF hook needed.
- [ ] Wire: `index.html` script tag; `sw.js` CACHE + SHELL; `config.js` version. `node --check js/foot.js`. Log completion in the lane report.

### Task B: Engine + program data — LANE B owns `js/engine.js`, `js/program.js`, `js/state.js`, `js/storage.js`

**Files:** Modify `js/program.js` (EXERCISES ~:141, BLOCKS ~:26, BLOCK_EX ~:155, loadReduction :396-403, pruneInjury :362-368, standingCall :370-382), `js/engine.js` (applyCheck :89-211, currentDayPlan :58-66), `js/state.js:11`, `js/storage.js` (:21 load, :55 save, :98 fullBackup, :185 applyBackup, reset/logout nulls).
**Interfaces:** Consumes the pinned foot.js contract. Produces: `currentDayPlan()` returning swapped blocks; extended `applyCheck` signature; new EXERCISES keys `pf_heel_raise`, `pf_stretch`, `foot_intrinsic`; blocks `footRehabPF`, `footRehabMeta`, `footRehabTail`, `lowImpactSub`.

- [ ] Create `docs/superpowers/plans/reports/lane-b.md`; log as you go.
- [ ] EXERCISES (cat `'Foot'`, full entries — this copy ships; rx numbers may be adjusted by the evidence verification pass, Task F reconciles):
  - `pf_heel_raise` — "Towel Heel Raise" · rx "every other day · 3×12, building to 5×8 heavier" · steps: roll a towel, place under toes on a step edge; rise on one leg 3 seconds; hold 2; lower 3; rest between sets; when 12 feel easy, add a loaded backpack and drop reps · cue "The towel is the point — it tensions the arch so the raise trains the fascia, not just the calf. The rest day is part of the dose."
  - `pf_stretch` — "Plantar Fascia Stretch" · rx "10 sec × 10, three times a day" · steps: sit, cross the sore foot over the other knee; grip the base of the toes; pull toes back toward the shin until the arch band tightens; hold 10 seconds · cue "Do the first set before your feet touch the floor in the morning."
  - `foot_intrinsic` — "Foot Core" · rx "daily · 5×5-sec arch holds + 2×15 towel curls" · steps: bare foot flat; draw the ball of the foot toward the heel to dome the arch WITHOUT curling toes, hold 5; then scrunch a towel toward you with the toes · cue "Commonly recommended and safe — the evidence here is still thin, and that's the honest truth."
- [ ] BLOCKS: `footRehabPF {kind:'mobility', label:'Foot rehab • 12 min', title:'Plantar Heel Rehab', detail:'Heel raise • Fascia stretch • Calf • Foot core'}`; `footRehabMeta {kind:'mobility', label:'Foot rehab • 8 min', title:'Forefoot Rehab', detail:'Calf • Foot core'}`; `footRehabTail {kind:'mobility', label:'Foot upkeep • 6 min', title:'Foot Relapse-Prevention', detail:'Key exercise • Calf'}`; `lowImpactSub {kind:'cardio', label:'Low-impact • 25 min', title:'Low-Impact Cardio', detail:'Brisk walk (bike/swim if you have them)'}`. BLOCK_EX: pf→[pf_heel_raise,pf_stretch,calf_stretch,foot_intrinsic]; meta→[calf_stretch,foot_intrinsic]; tail→[pf_heel_raise,calf_stretch] (pf tail) — tail exercises chosen at swap time by kind: implement `BLOCK_EX.footRehabTail = ['pf_heel_raise','calf_stretch']` and for a meta tail substitute `foot_intrinsic` for `pf_heel_raise` in `currentDayPlan` (document inline).
- [ ] `applyCheck(..., foot)`: on hurt with a foot zone → `kind = footKind(foot.zone, foot.neural, redFlag)`; `state.injury.kind = kind`; `state.injury.foot = {zone: foot.zone, neural: foot.neural}`; windows from `footWindow(kind)` (replaces both hardcoded `3*86400000`/`10*86400000` — non-foot path passes no kind and gets the identical default). Checks row `+= footZone`.
- [ ] Gated clear: in the `!hurt && injuryActive()` branch — if `footRehabKind(state.injury.kind)`: clear ONLY if `footGatePassed(kind, foot && foot.gate)`; on clear set `state.rehabTail = {kind, until: localMidnight(now) + REHAB_TAIL_DAYS*86400000}` and `logEvent('injury', 'Recovery gate passed — <name> cleared; 5 weeks of light upkeep begins')`; on fail: injury stays, `logEvent('injury','Gate not yet met — <which keys were no>')`, outcome stays INJURY_REST with "keep going" copy override. Non-foot kinds: existing behavior untouched.
- [ ] `currentDayPlan()` swap-in, exactly: when injury active and `footRehabKind(kind)` — map the day's blocks: mobility→rehab block for kind; cardio with impact (block keys containing run intervals — enumerate the actual run block keys from BLOCKS and match on key list, not string sniffing) → `injuryInRice() ? BLOCKS.rest : lowImpactSub`; strength→unchanged (existing injury `loadReduction` note already applies); rest→unchanged. When `state.rehabTail` active (and no active injury): append `footRehabTail` (with the kind-substitution above) to the day's blocks on Mon and Thu (`dayInWeek` 0 and 3). Prune expired tail wherever `pruneInjury()` is called.
- [ ] `standingCall()` label uses `FOOT_CONDITION_NAMES[kind]` when set (falls back to parts join). `loadReduction()` ease note for foot kinds: "Pain-monitored ease-back — up to ~3/10 that settles by morning is OK; climbing pain means back off."
- [ ] Persistence: `rehabTail` through all five points + reset/logout nulls; missing-field imports default null. `node --check` all four files. Log in lane report.

### Task C: Screens + CSS — LANE C owns `js/screens.js`, `css/screens.css`, `css/figures.css`

**Files:** Modify `js/screens.js` (renderCheck :399-464, bindCheck :483-583, checkFooter :473-481, chkReady :467-471, renderResult :587-614, renderToday :213-325, dayWhy :147-197, renderLibrary cats :643, renderSettings evidence list ~:920), `css/screens.css`, `css/figures.css`.
**Interfaces:** Consumes `footMapSvg`, `footCloseupFigure`, `FOOT_GATES`, `FOOT_ZONES`, `footGuideFor`, `FOOT_CONDITION_NAMES`, `footRehabKind`, extended `applyCheck(..., foot)`.

- [ ] Create `docs/superpowers/plans/reports/lane-c.md`; log as you go.
- [ ] Drill-down step: in hurt mode, tapping `left foot`/`right foot` sets `state._chk._footSide` and swaps the map area to `footMapSvg(t.footZone)` (same container `fitBodyMap` sizes; breadcrumb shows "Left foot · ball"); "◀ whole body" ghost returns (zone kept). Zone tap = single-select toggle → `state._chk.footZone`. Ball zone selected → neural question card (Yes/No chips → `t.footNeural`). Then the 4-chip red-flag screener (pinpoint bone spot · rest/night pain · pop/can't bear weight · red-hot/fever), any-yes → `t.redFlag=true`. `chkReady` in hurt mode with a foot part additionally requires `footZone` + (ball → neural answered) + screener answered (track `t._screened`). All targets ≥48px; aria-pressed + roving tabindex copied from body-map pattern.
- [ ] Re-check gate: when `injuryActive()` and `footRehabKind(state.injury.kind)` and user submits pain-free — render the 3 gate chips from `FOOT_GATES[kind]` (each Yes/No) BEFORE submit enables; pass answers as `foot.gate`. Submit passes `foot = {zone: injury.foot.zone, neural: injury.foot.neural, gate}`.
- [ ] Result screen: for `foot-pf`/`foot-meta` extend the Rest card with the protocol block — condition name, the block's exercises w/ rx (read from BLOCK_EX so it can't drift), the pain rule line, expected time-course (PF "most people feel real change in 2–6 weeks; full recovery often takes months — the plan adapts until your foot passes the gate, not until a date"), "what changes tomorrow". For guidance kinds render `footGuideFor(kind, neural)` card. Citations rendered the existing way.
- [ ] Today: banner label via `FOOT_CONDITION_NAMES`; day ≥14 without an improving trend (any gate attempt logged failing after day 14) → add clinician nudge line to banner. `dayWhy()` new top branch when foot rehab or tail active: why loading beats rest (2 sentences), what the gate is, citation pointer. Tail visible as its appended block; no banner.
- [ ] Library: add `'Foot'` to the cats array; detail pages for the 3 new exercises route figures: `footCloseupFigure(key)` first, else skeleton. CSS: `.footmap` sizing under `.bodymap` rules; close-up cross-fade keyframes (reduced-motion aware, mirror `figures.css` anim2 pattern); gate/neural chip styles reuse `.chip` patterns. Log in lane report.

### Task D: Skeleton figure — LANE D owns `js/figure-poses.js`, `js/figure.js`, `docs/FIGURE-POSES.md`

**Files:** Modify `js/figure.js` (renderProp :127-142 — add `towelWedge` case + `propTowelWedge(x,y)` primitive: small rolled-towel ellipse pair), `js/figure-poses.js` (add `pf_heel_raise` entry), `docs/FIGURE-POSES.md` (append entry note).
**Interfaces:** Produces `FIG_POSES.pf_heel_raise` (side view, `frame` zoomed to lower leg, step-edge bench prop + towelWedge under toes; f1 heel below step level/knee soft, f2 full rise on forefoot; intensity marker pinned at the arch, fixed point per the pinned-feel rule; dur ~2600ms). Consumes nothing new. **Knee-bend rule: shankA = thighA + kneeBend, facing right.**

- [ ] Create `docs/superpowers/plans/reports/lane-d.md`; log as you go.
- [ ] Author pose using existing `calf_raise` (`figure-poses.js:18-59`) as the base; add bench prop as the step edge (`propBench` at low height) + `towelWedge` at the toe position; `frame` cropped to roughly the lower half (start from `"14 26 32 32"`, tune by preview). Verify in the `tools/figure-editor.html` harness (serve via `python tools/figure-save-server.py`, port 8801) and screenshot for the lane report. `node --check` both files. Log completion.

### Task E: Sim scenarios — LANE E owns `tools/_daysim.js`, `tools/_daysim-fixes.js` (STARTS after Task A lands; runs red until B lands — expected)

**Files:** Modify `tools/_daysim.js` (:63 FILES += `foot.js` after program.js; :104 hoist += `footKind`,`footGatePassed`,`footWindow`; new scenarios pushed at :478-496), `tools/_daysim-fixes.js` (:29 FILES += `foot.js`; new scenarios before the report block :216; S10 updated for the close-up branch).
**Interfaces:** Consumes the pinned contract + Task B behavior. Produces the shipping gate.

- [ ] Create `docs/superpowers/plans/reports/lane-e.md`; log as you go. Write every scenario RED-FIRST where possible (against current code before B lands) and note in the report which went red→green — the gate-lie taxonomy forbids cannot-fail tests.
- [ ] `_daysim.js` scenarios (assert via the existing `assert(cond, scenario, msg)` pattern; every assertion reads what the UI reads — `currentDayPlan()` output, `state.injury`, checks rows — never a private flag):
  - `scenarioFootPfLifecycle`: day1 hurt+heel → injury.kind `foot-pf`, ease window 84d, next-day plan's mobility slot is `footRehabPF` and run-day cardio is `rest` (rice) then `lowImpactSub` (ease); day10 pain-free re-check with gate `{walk:true,morning:false,raises:true}` → still injured; day24 all-true gate → cleared, `rehabTail` set `until` ≈ +35d, Mon/Thu plans include `footRehabTail`, non-Mon/Thu don't; after tail expiry plans identical to baseline.
  - `scenarioFootMetaWindow`: ball+neural=false → `foot-meta`, ease 42d, rehab block is `footRehabMeta`.
  - `scenarioFootReflagDuringTail`: hurt again mid-tail → fresh injury, tail replaced by new windows.
  - `scenarioNonFootRegressionPin`: shoulder injury — assert kind falls back, windows exactly 3d/10d, `currentDayPlan()` blocks deep-equal the pre-feature behavior for all 7 days, clear on bare pain-free re-check (NO gate required).
  - `scenarioFootDst`: PF window across the Nov DST boundary (mirror `scenarioInjuryWindowVsCalendar` :253-268).
- [ ] `_daysim-fixes.js` pinned scenarios: S11 neural-yes → `foot-refer` + generic windows; S12 redFlag → INJURY_FLAG outcome key + `foot-refer`; S13 toes/top → generic windows and NO rehab swap; S14 gate all-no cannot clear; S15 rehabTail survives fullBackup→applyBackup round-trip; S10 updated: an exercise key resolves if gait OR pose OR `footCloseupFigure(key)` truthy.
- [ ] Run both; report the red/green table in the lane report. (Green requires B; that's expected and logged, not hidden.)

### Task F: Integration + evidence reconcile + docs — OVERSEER (fable), after A–E land

- [ ] Reconcile the verification lane's spec-impact list (**verdict landed 2026-08-17**): all numbers KEEP (rx, 84d/42d windows, ≤3/10 rule, 20-raise criterion, tail). **SOFTEN COPY ONLY**, two places: (1) heel raise must NOT be billed "best-evidenced/superior" anywhere user-facing — present as *complementary to the stretch* (Rathleff's 3-month FFI edge did not persist at 1/6/12 months; the 2021 BJSM guide he co-authored left strengthening out of the core tier); (2) the 20-heel-raise gate copy is consensus-based, not trial-derived — phrase as "a common readiness check", never "the proven test". Audit Lane B's exercise cues + Lane C's result/Library framing against EVIDENCE-FOOT.md's verification section before ship.
- [ ] `AI-START-HERE.md`: §4 file tree += foot.js; §8 check-in flow note; §11 new scenarios. `docs/PROGRESS.md`: dated entry.
- [ ] Full gate: `node --check` all js; `_daysim.js` (existing 18 + new, 0 failures — read the TOTAL line, it always exits 0); `_daysim-fixes.js` exit 0; Playwright e2e per spec §9 (SW unregister + clean reload first; drill-down full path, non-foot regression, tabs render, zero console errors).
- [ ] Commit sequence per milestone (overseer, explicit paths). Push branch; PR #1 updates automatically. Pages deploy + APK only on Eddie's word.

## Self-review (done at authoring)

- Spec coverage: §3.1→C; §3.2→C(+A guides); §3.3→A(footKind)+B; §3.4→B(swap)+C(banner/why); §3.5→A(gates)+B(clear)+C(chips); §3.6→C; §4→B; §5→B(+A tables); §6→B(content)+A(guides); §7→A(map/close-ups)+D(pose); §8→A; §9→E(+F e2e); §10→A(version)+F. No gaps.
- No placeholders: guide copy, exercise copy, gate questions, window values, scenario assertions are all concrete above.
- Type consistency: `foot` param shape, gate keys `{walk,morning,raises}`, kind strings, and block keys are identical across A/B/C/E. `footZone` string on checks row everywhere.
