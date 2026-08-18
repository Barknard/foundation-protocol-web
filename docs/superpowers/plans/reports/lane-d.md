# Lane D — Skeleton figure (`pf_heel_raise`)

Owns: `js/figure.js` (renderProp dispatch + `propTowelWedge` only), `js/figure-poses.js`
(new `pf_heel_raise` entry only), `docs/FIGURE-POSES.md` (append entry note).

## Plan
- Base: `calf_raise` (figure-poses.js:18-59), made single-leg + step-based.
- New prop `towelWedge` (rolled towel under the toes) + reuse `bench` (low, as the step edge).
- Near leg (working leg): f1 heel dropped below the step (dorsiflexed, footAngle ~300°,
  soft knee), f2 full rise onto the forefoot (footAngle ~60°, knee nearly straight) — mirrors
  calf_raise's footAngle sweep but anchored to the step top instead of the floor, plus the
  extra eccentric drop below step level.
- Far leg: reused verbatim from `sl_calf_raise`'s tucked far leg (`[40,200,0]`, constant
  both frames) — already-shipped, known-good "single-leg tucked" shape.
- Intensity marker pinned at the arch, identical `{at,dir,r}` object duplicated in f1 AND f2
  (confirmed via figure.js:224-226 `lerpPose` that the animator only reads f1's static fields,
  but the editor's per-frame tabs call `figureInner` on the raw f1/f2 pose directly, so both
  copies must carry the same value for it to look pinned when scrubbing).

## Log

- [x] Created this report.
- [x] Read figure.js header contract (angle convention, knee-bend rule, prop dispatch,
      `lerpPose` static-field carry, `frame`/`ground` mechanics) and figure-poses.js
      `calf_raise` (18-59), `sl_calf_raise` (594-673, tucked far-leg + wall pattern),
      `split_sq`/`db_row` (bench prop usage), `sl_hop` (`frame` viewBox usage).
- [x] Hand-derived pelvis/ankle/toe coordinates via forward kinematics so the toe (ball of
      foot) stays pinned near the same spot on the step/towel across f1↔f2, and the ankle
      swings from below the step (f1, heel-drop) to well above it (f2, full rise). Will
      visually confirm/tune in the editor rather than trust the math blindly.
- [x] Added `case 'towelWedge'` to `renderProp` + `propTowelWedge(x,y)` primitive in
      js/figure.js (warm cream/tan two-ellipse roll, distinct from the metal-prop palette).
- [x] Added `FIG_POSES.pf_heel_raise` to js/figure-poses.js (inserted after `calf_raise`).
- [x] `node --check js/figure.js` / `node --check js/figure-poses.js` — both pass.
- [x] Visual verification. No Playwright MCP browser tool was available in this agent's
      toolset, so I used a scratchpad Node script (`playwright` npm package, cached
      Chromium at `~/AppData/Local/ms-playwright`) driving `tools/figure-save-server.py`
      (port 8801) headlessly — same target, same result: real editor, real renderer.
  - Screenshotted f1/f2 (onion-skin off, clean canvas) and pulled EXACT resolved joint
    coordinates via the editor's own `_resolve()` (not hand-trig) to confirm the design:
    - near-leg toe (ball of foot / towel contact) pinned almost identically both frames:
      f1 (29.00, 47.98), f2 (29.00, 48.01) — the working foot doesn't slide on the step.
    - near-leg ankle: f1 (27.00, 51.44) — **below** the bench top (y=51) = heel dropped
      below the step edge, dorsiflexed stretch. f2 (27.00, 44.54) — well **above** the
      bench top = full plantarflexion, up on the forefoot. Correct direction both ways.
    - pelvis rises f1→f2 by ~7 units (29.55→22.56), consistent with the whole body rising
      as the ankle pivots around the fixed toe contact — physically correct for this drill.
  - Found ONE `pageerror` on every load: `Cannot read properties of null (reading
    'pelvis')` at `figure-editor.js:318` (`buildFields`), thrown from `boot()`'s default
    `selectMove('standing')` — confirmed via `grep` that `FIG_POSES` has **no `standing`
    key** on this branch at all (pre-existing drift; `figure-editor.js` isn't in my lane's
    ownership and `standing` isn't part of Task D). Selecting `pf_heel_raise` itself, frame
    flips, and thumbnail renders threw **zero** additional errors in repeated runs.
  - First `frame` guess ("14 26 32 32", the plan's suggested start) left too much dead
    space around the narrow standing-leg silhouette at thumbnail scale (44px) — tightened
    to **`"16 24 23 34"`** after a visual pass at 44/96/200px, which fills the crop with
    the working leg + towel + step and keeps the ground line fully in frame. (One on-disk
    edit while the server was running required a server restart — the save-server caches
    `FIG_POSES` in memory from boot and would otherwise have clobbered the file back to
    the stale value on the next page load's session-start autosave.)
  - Verdict: limbs connect with no detachment (near/far leg and arm chains are single
    continuous polylines through the FK), the knee bends the anatomically-correct direction
    (soft flexion f1→straighter f2, never past kneeMax), the towel wedge is clearly visible
    sitting on the bench under the toes in both frames, and the tightened frame crops well
    at thumbnail size (44/96/200px all checked) — the torso/head fall outside the crop by
    design (lower-body focus per the task).
  - Screenshots + the coordinate dump are in the scratchpad (session-local, not the repo):
    `pf_f1_clean.png`, `pf_f2_clean.png`, `pf_frame_crop_check.png`, `pf_thumb_sizes.png`.
  - Server killed after verification; confirmed port 8801 no longer listening.

## Final pose values (js/figure-poses.js, `FIG_POSES.pf_heel_raise`)
- `dur`: 2600
- f1: pelvis [28.53, 29.55], torso 270, nearArm/farArm [100, 95], nearLeg [90, 98, 300]
  (soft knee, heel dropped below the step), farLeg [40, 200, 0] (tucked, from
  `sl_calf_raise`), ground 57, propsBehind: bench {x:17,y:51,w:16,h:6} + towelWedge
  {x:29,y:49}, intensity {at:[28,47], dir:90, r:2.2} (pinned at the arch).
- f2: pelvis [27.58, 22.56], torso 270, nearArm/farArm [100, 95], nearLeg [90, 93, 60]
  (straighter knee, full rise on the forefoot), farLeg [40, 200, 0], same props/ground/
  intensity as f1 (duplicated verbatim per the pinned-feel rule).
- `frame`: "16 24 23 34" (tuned from the plan's "14 26 32 32" starting point).

## Scope check
Only `js/figure.js` (renderProp dispatch + `propTowelWedge`), `js/figure-poses.js`
(`pf_heel_raise` entry only), and `docs/FIGURE-POSES.md` (new entry) were touched.
`git diff --stat` confirms: figure.js +4/-0, figure-poses.js +100/-0, FIGURE-POSES.md
+28/-0. `figure-editor.js` (pre-existing `standing` bug) was NOT touched — out of scope.
