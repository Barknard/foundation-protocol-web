# The Hard Part — Multi-Update Design Spec

**Date:** 2026-06-20
**Author:** Eddie + Claude
**Status:** Approved design → pending spec review → implementation plan

Four independent workstreams approved in brainstorming. A (logo) and C (situps) are
small; D (RIR) is a new engine subsystem; B (animation editor) is a real tool with a
supporting refactor of `figure.js`.

> **Working agreement (this repo):** commit/push only when Eddie asks. The spec is
> written to disk but NOT committed automatically.

---

## Workstream A — Welcome logo uncropped; minis stay cropped

### Goal
The **welcome screen** shows the **full, uncropped `logo.png`** including its baked-in
**"HARD PART"** text, with **no separate HTML wordmark** underneath. The **mini** logos
(in-app header home button) stay **cropped to the emblem** (no text). Two visually
distinct treatments from the one `logo.png` (CSS crop — no new asset unless requested).

### Changes
- `js/screens.js` (`renderOnboarding`, step `r===1`, ~line 25): replace
  `<img class="brand-emblem" …><div class="brand-wordmark">The Hard Part</div>` with a
  single `<img class="brand-full" src="logo.png" alt="The Hard Part">`. Remove the wordmark.
- `css/components.css`: add `.brand-full { width:auto; max-width:88%; height:clamp(120px,34vw,168px);
  object-fit:contain; display:block; margin:0 auto 4px; user-select:none; -webkit-user-drag:none; }`.
  Leave `.brand-emblem` (header) and `.cap-screen .brand-emblem` (capstone) untouched.
  Remove the now-unused `.brand-wordmark` rule.
- Header home emblem (`screens.js:452`) and capstone emblem: **unchanged** (already cropped).

### Constraints / acceptance
- Welcome must remain **no-scroll** at 390×844 and on Eddie's window (onboarding never
  scrolls). Tune `.brand-full` height live in Playwright until welcome fits with the
  username + age fields below it.
- Header mini still shows the cropped stone emblem (no "HARD PART" text).
- `grep` shows no remaining `.brand-wordmark` usage.

---

## Workstream C — Reconcile the capstone (drop untrained situps)

### Goal
The capstone tests "100 situps" but nothing trains spinal flexion, and EVIDENCE-REVIEW §5
advises swapping repetitive loaded spinal flexion for **anti-extension core**. Replace
"100 situps" everywhere with a **2-minute plank** (already trained, testable, anti-extension).

New capstone line: **"10K run + 100 pushups + a 2-minute plank + 100 squats — in one session."**

### Changes (exact sites)
- `js/program.js:68` (P4 `summary`) and `:70` (P4 `exit` / "THE CAPSTONE …").
- `js/screens.js:158` (progress lead), `:461` (capstone screen headline), `:597` (P4 formula).
- Docs: `docs/HOW-IT-WORKS.md:5,129`; `docs/AI-START-HERE.md` §6 (line ~123);
  `docs/EVIDENCE-REVIEW.md` §5 — mark **resolved** (program already trains anti-extension
  core; the test now matches); `docs/PROGRESS.md` pending note — mark resolved.

### Acceptance
- `grep -i "situp\|sit-up"` returns only the EVIDENCE-REVIEW historical/resolved context.
- Capstone celebration screen renders the new line; phase-4 tab copy consistent.

---

## Workstream D — RIR 2-3 double-progression (advisory + auto; two-tap preserved)

### Goal
Wire EVIDENCE-REVIEW §6's rule into the engine **without** adding daily friction. The daily
check-in stays **goal + feel (+hurt)**. Each loaded lift carries a live prescription and
advances via the existing **Progress** signal.

### Data model — `state.lifts` (per persona, persisted)
Keyed by lift key. Each entry:
```
{ kind:'loaded'|'bodyweight'|'time',
  load:Number|null,        // null = "set your weight" until user sets it (no black box)
  unit:'lb'|'kg',
  step:Number,             // load increment (2.5 or 5)
  reps:Number,             // current rep target (or seconds for time)
  range:[lo,hi],           // working rep range
  goodStreak:Number,       // consecutive at-top sessions toward a load bump
  variation:String|null }  // for bodyweight: harder progression hint when range topped
```
Seeded lifts (on first strength exposure / persona init), conservative on-ramp:
| key | kind | range | step | seed load |
|---|---|---|---|---|
| goblet_sq | loaded | [8,12] | 2.5 | null (prompt) |
| rdl | loaded | [8,12] | 5 | null |
| oh_press | loaded | [8,10] | 2.5 | null |
| db_row | loaded | [8,12] | 2.5 | null |
| split_sq | loaded | [8,12] | bodyweight→2.5 | 0 |
| kb_swing | loaded | [12,15] | 5 | null |
| pushup | bodyweight | [6,12] | — | n/a |
| plank | time | [30,60]s | — | n/a |

### Rule (double progression)
On a strength-day check whose **outcome === `progress`**, for each lift in that day's
strength blocks (`exercisesForBlock` of the day's `strength` blocks):
- **loaded/bodyweight:** if `reps < hi` → `reps++` (reps climb per Progress). If `reps === hi`
  → `goodStreak++`; when `goodStreak >= 2` → `load += step` (loaded) or set `variation`
  (bodyweight), `reps = lo`, `goodStreak = 0`.
- **time (plank):** climb seconds toward `hi`; at `hi` for 2 → suggest a harder variation.
- One variable changes per session; load bumps gated by 2 consecutive at-top (per §6).

### Integration (engine.js)
- Compute the advance inside `applyCheck`, mirroring the existing day-gate roll-back:
  snapshot the touched lifts into `entry._liftPre` **when** advancing (same condition as
  `_pre` pointer snapshot); on a same-day downgrade away from Progress, restore `_liftPre`
  (so a re-check can't double-advance or strand a lift). Only advance lifts on the
  **first** Progress of the day; on a repeat-Progress same day, keep the prior snapshot.
- A helper `advanceDayLifts(dayPlan)` / `rollbackDayLifts(snap)` in `program.js`.

### UI
- **Exercise detail** (strength lifts): show `Goblet squat — 3×{reps} @ {load} {unit} ·
  RIR 2-3: stop ~2-3 reps short` (or "Set your weight" when `load==null`) + a **± load**
  control (sets `state.lifts[key].load`, saves). Bodyweight: `3×{reps}` + variation hint.
- **Today** strength-block reveal: compact one-line prescription per lift.
- No change to the check-in flow.

### Persistence / sync
- `state.lifts` saved via existing `saveLocal()` (whole-`state` serialization — verify in
  storage.js; add to any explicit allow-list if present). **Known gap (documented):** lifts
  are not GitHub-synced yet (same status as injury/log/session).

### Acceptance
- Per-lift prescription renders and the ± control persists across reload.
- Harness test: simulate N strength-Progress sessions → reps climb to `hi`, then after 2
  at-top → load `+= step`, reps reset to `lo`; non-strength Progress doesn't touch lifts;
  same-day downgrade rolls the lift back.

---

## Workstream B — Figure animation editor (Flash-style, with autosave + versions)

### Goal
A dev tool to view each exercise's frames, drag joints (staying connected via FK), set/read
exact axis positions and copy values across exercises for consistency, tweak existing moves,
and author new ones — saving back to the **library and every mini** app-wide, with autosave
and session version history. Chosen options: **data split + local save-server**, **2-frame
(f1/f2) model + editable props/equipment** (not a multi-keyframe timeline).

### B1. Props become data (figure.js refactor) — foundation
Today `propsFront`/`propsBehind` hold **functions/strings**, which blocks serialization and
drag-editing. Convert to **arrays of prop specs**:
```
propsBehind: [ {type:'bench', x,y,w,h, legs:true},  {type:'wall', x,y1,y2} ]
propsFront:  [ {type:'dumbbell', anchor:'nearHand'}, {type:'kettlebell', anchor:'farHand'} ]
```
Prop spec types (side view): `bench{x,y,w,h,legs?}`, `wall{x,y1,y2}`,
`dumbbell{anchor}`, `kettlebell{anchor}` (`anchor ∈ nearHand|farHand`),
`band{from,to}` (`from/to ∈ nearKnee|farKnee`).
Front view: `goblet{}` (auto: between leftHand/rightHand), `bandFront{}` (between knees),
`dumbbell{anchor:leftHand|rightHand}`.
- Add `renderProp(spec, J)` dispatching to the **existing draw primitives** (`propBench`,
  `propWall`, `propDumbbell`, `propKbAt`, `propGobletFront`, `propBandFront`) — anchored
  props resolve coords from `J` at render time (so they still track the hand across f1↔f2);
  free props (bench/wall) use explicit coords.
- `figureInner` / `figureInnerFront`: replace the function/string branches with
  `renderProps(pose.propsBehind, J)` / `renderProps(pose.propsFront, J)`.
- **All** FIG_POSES entries converted; no function-valued fields remain. (`intensity` is
  already always an object `{at,dir,r}` — confirmed across the registry — so after the prop
  conversion every pose is pure data / JSON-serializable.)

### B2. Gait parameters become data
Walk/run/farmer-carry are procedural (`_gaitPose`) with hardcoded constants. Extract to
`GAIT_PARAMS`:
```
GAIT_PARAMS = {
  walk: {dur:1050, torsoLean:3,  hipFlex:20, kneeSwing:34, kneeLand:12, armSwing:20, armBend:15},
  run:  {dur:680,  torsoLean:14, hipFlex:32, kneeSwing:58, kneeLand:26, armSwing:38, armBend:80},
  carry:{dur:1050, nearHand:[84,88], farHand:[96,92]},
}
```
`_gaitPose` reads from `GAIT_PARAMS`. Output must be unchanged with the current constants
(regression-checked).

### B3. Data split → `js/figure-poses.js`
- Move `FIG_POSES` (now pure data) + `GAIT_PARAMS` into a new **`js/figure-poses.js`**
  (`'use strict'; const FIG_POSES = {…}; const GAIT_PARAMS = {…};`).
- `js/figure.js` keeps `FIG`, resolvers, renderers (incl. `renderProp`), prop primitives,
  the animator, gait. It references the globals from `figure-poses.js`.
- `index.html`: add `<script src="js/figure-poses.js"></script>` **before** `figure.js`.
- `sw.js`: add `js/figure-poses.js` to the cached shell list; bump `CACHE` (next `fp-shell-vX.Y.Z`).

### B4. Editor — `tools/figure-editor.html` (+ `tools/figure-editor.js`, `tools/figure-editor.css`)
Dev-only. Loads `js/figure-poses.js` + `js/figure.js` so it uses the **real renderers**
(WYSIWYG with library/minis).
- **Exercise list** (left): 19 pose moves + `standing` + 3 gait moves. Selecting a pose move
  shows the joint editor; a gait move shows the `GAIT_PARAMS` slider panel + live preview.
- **Canvas** (center): the pose rendered at scale (50-unit viewBox → ~10×) with **draggable
  joint handles**. Dragging an end-joint sets that **bone's angle** toward the cursor (bone
  lengths fixed by FK → never disconnects); dragging the pelvis sets the root `[x,y]`.
  Handle→field map: shoulder→`torso`, head→`head`, elbow→upper-arm, hand→fore-arm,
  knee→thigh, ankle→shank, toe→foot (near/far side, or left/right in front view).
  `facing:-1` mirroring is accounted for in cursor→angle math.
- **Frame control:** select active frame **f1 / f2**; edits write the active frame.
  **Onion-skin** ghost of the inactive frame; **scrub** slider previews `lerpPose(f1,f2,t)`;
  **play** runs a local rAF using the real `lerpPose`/`figureInner`. Buttons: copy f1→f2,
  mirror.
- **Numeric panel** (right): inputs for every angle, `pelvis.x/y`, `torso`, `head`,
  `ground`, `wallX`, `facing`, `hipW`/`shoulderW`, `dur`, intensity `{at,dir,r}`.
  **Prop editor:** add/remove props; drag free props (bench/wall); pick anchors for
  anchored props.
- **Alignment / "make identical" tools:** grid overlay (5-unit) + guides; live readout of a
  selected joint's `(x,y)` and angle; **copy a field/joint from another exercise** (pick
  source exercise + frame + field → paste into active); snap-to-grid / snap-angle; per-joint
  lock.

### B5. Save-server — `tools/figure-save-server.py`
A small Python `http.server` that **serves the repo statically** (replaces
`python -m http.server 8801` while editing) **and** handles:
- `POST /api/save` `{poses, gait}` → rewrite `js/figure-poses.js` (deterministic pretty
  serialization; numbers rounded as `_n` does) **and** snapshot
  `.figure-versions/<sessionId>/<ISO-ts>.json`. Client debounces (autosave).
- `GET /api/versions?session=…` → list snapshots; `POST /api/revert {session, ts}` →
  return that payload (client applies; it also becomes the new current + a fresh snapshot).
- **Session:** client mints `sessionId` on open, writes a **session-start** snapshot first
  (restore-to-start safety net), then a snapshot per change through close.
- **Safety:** server writes only `js/figure-poses.js` and under `.figure-versions/`; rejects
  any other path. Add `.figure-versions/` to `.gitignore`.

### B6. Verification
- **Regression (critical):** capture rendered inner-SVG for every pose `f1`/`f2`/live + each
  gait frame **before** the refactor (via `__figPreview`/`evaluate`), and **after** — assert
  visually/structurally identical (float tolerance). The props→data + gait-params + data-split
  refactor must not change any on-screen figure.
- **Editor functional (Playwright/DevTools):** drag a joint → pose field updates → autosave
  POST writes `figure-poses.js` → version snapshot exists → revert restores → app reload
  shows the edit in the **library and minis**.
- `node --check` on new/changed JS; clean SW reload (unregister + clear caches) before
  trusting any test.
- Editor assets live under `tools/` and are **never** added to the `sw.js` shell list (not
  shipped to users).

---

## Sequencing & collision control
- A, C, D, B touch mostly disjoint files. **`js/screens.js` is shared by A, C, D** → those
  edits are partitioned by function/region (or serialized) to avoid clashes.
- B's refactor (B1–B3) is the prerequisite for the editor (B4–B5); B6 gates B done.
- Implementation runs as **parallel agents + Playwright verification** (per repo hard rules:
  always test; no placeholder stubs; parallelize independent work) — only after spec approval
  and the implementation plan.

## Out of scope (this round)
- GitHub sync for `state.lifts` (documented known gap).
- Multi-keyframe (N-frame) timeline — the editor stays 2-frame (f1/f2).
- A separate literal `emblem.png` asset (using CSS crop unless Eddie requests the file).
- Hosting/GitHub-Pages account block (unrelated, account-level).
