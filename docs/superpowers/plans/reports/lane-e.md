# Lane E — Sim scenarios (foot-pain-rehab, Task E)

Owner: tester (Lane E). Files owned: `tools/_daysim.js`, `tools/_daysim-fixes.js`.
Authored FROM the spec (`docs/superpowers/specs/2026-08-17-foot-pain-rehab-design.md`) and the
pinned contract (`docs/superpowers/plans/2026-08-17-foot-pain-rehab.md`), not from reading the
coder's implementation. `js/foot.js` was read only to confirm the contract surface (names/shapes),
as instructed.

**Status at lane start:** Lane A (`js/foot.js`), Lane B (`js/engine.js`, `js/program.js`,
`js/state.js`, `js/storage.js`), and Lane D (`js/figure-poses.js` pf_heel_raise pose) had ALL
already landed by the time this lane started reading. This is further along than "runs red until
B lands" — expect most scenarios to go GREEN on first run, not red-then-green. Logging this as a
finding, not softening any assertion because of it.

---

## Log (write-as-you-go)

- Read plan + spec + `js/foot.js` + `js/engine.js` + `js/program.js` + `js/state.js` +
  `js/storage.js` + `js/util.js` (animatedFigure) + `js/figure-poses.js`/`figure.js` (towelWedge/
  pf_heel_raise) to confirm the contract surface and load-order anchors. Confirmed: engine.js
  `applyCheck(goalMet, feel, hurt, parts, redFlag, foot)` already wired; `currentDayPlan()` already
  has the rehab swap-in and tail append; `state.rehabTail`/`state.injury.kind`/`state.injury.foot`
  already declared and persisted through all 5 points (state.js declares, storage.js load/save/
  fullBackup/applyBackup/logout all touch `rehabTail`).
- One contract nuance found (not a mismatch, a note): the "Mon/Thu" tail-append rule in
  `currentDayPlan()` keys off `state.phase.dayInWeek` (the PROGRAM's day-in-week pointer, which
  freezes during an active injury and only advances on a Progress outcome), not the real calendar
  weekday. Scenarios below drive the pointer explicitly / walk it forward rather than relying on
  calendar dates for "Mon/Thu", and cross-check against the phase table's own `day` label
  (`PHASES[i].week[d].day === 'Mon'/'Thu'`) rather than hand-computing an index, to avoid a
  hardcoded-arithmetic mistake in the test itself.
- `tools/_daysim.js`: added `foot.js` to the FILES load order (after `program.js`, before
  `engine.js` — matches index.html order since this harness doesn't load figure.js at all).
  Hoisted `footKind`, `footGatePassed`, `footWindow`, `currentDayPlan`, `REHAB_TAIL_DAYS`.
  Added `doCheckFoot()` helper (mirrors `doCheck()` but forwards the 6th `foot` param, which the
  plain `doCheck()` wrapper doesn't have).
  Authored: `scenarioFootPfLifecycle`, `scenarioFootMetaWindow`, `scenarioFootReflagDuringTail`,
  `scenarioNonFootRegressionPin`, `scenarioFootDst`.
- `tools/_daysim-fixes.js`: added `foot.js` to FILES (after `program.js`, before `engine.js`).
  Updated S10 to accept a gait/pose/foot-closeup resolution (was gait/pose only — foot.js's
  `footCloseupFigure` branch in `util.js animatedFigure` was previously untested by this
  assertion, a real coverage gap this pins shut). Authored S11–S15.
- `node --check tools/_daysim.js`: PASS.
- First run of `tools/_daysim.js` with all 5 new scenarios: 1 failure —
  `scenarioFootDst` asserted a bare pain-free re-check with no gate must NOT clear a foot-pf injury.
  **This was a mistake in my own scenario authoring, not a code bug**: spec §5.2 explicitly says
  "a pain-free submit *without* the gate (shouldn't happen via UI) falls back to today's behavior"
  (i.e. it DOES clear — a deliberate defensive fallback for a state the real UI never produces).
  Per the tester charter I do not weaken a failing assertion to make it pass, but I DO fix an
  assertion that contradicts the spec's own text — that's a test-authoring bug, not a product bug.
  Corrected the scenario to exercise the REAL foot-pf clear path (the 3-chip gate, all-true) across
  the DST boundary instead, which is what the plan's "mirrors scenarioInjuryWindowVsCalendar" bullet
  actually calls for (that scenario asserts the injury clears on a pain-free recheck; the foot-pf
  equivalent of "clears" is the gated path). Logged both the original wrong assertion and the fix
  in the scenario's own comment so the reasoning survives in the source.
- Re-ran `tools/_daysim.js` after the fix: **0 assertion failures across 23 scenarios** (18 existing
  + 5 new, all GREEN). Given Lane A/B/D had already landed before this lane started, GREEN-on-first-
  correct-attempt is the expected outcome, not a sign the tests are toothless — each scenario was
  verified to be a real, two-sided check (see "gate-lie self-audit" below).
- `node --check` both files: PASS.
- **Gate-lie self-audit** (spec §9 "every new assertion is red-first (broken by reverting its
  feature) before it counts"). Since Lanes A/B/D had already landed, the scenarios came up GREEN
  on a correct first pass rather than red-then-green — so red-first was verified retroactively by
  sabotage, on SCRATCH COPIES of the source (never the real repo js files, per this lane's file
  ownership: `tools/_daysim.js` and `tools/_daysim-fixes.js` only). 4 targeted sabotage runs:
  1. `footRehabKind()` forced to always return `false` (swap-in disabled) → 15/23 `_daysim.js`
     assertions correctly went red (all footRehabPF/footRehabMeta/lowImpactSub/tail assertions in
     `scenarioFootPfLifecycle`, `scenarioFootMetaWindow`, `scenarioFootReflagDuringTail`,
     `scenarioFootDst`); `scenarioNonFootRegressionPin` correctly stayed green (unaffected, as it
     should be).
  2. `footGatePassed()` forced to always return `true` (gate bypass) → `_daysim.js`'s "blocked
     gate" assertions went red (4 failures) and `_daysim-fixes.js` S14 went red
     (`injury=false ... tail=true` — the all-no gate incorrectly cleared and armed a tail).
  3. `footKind()` patched to ignore `neural` on the ball zone → S11 went red
     (`kind=foot-meta` instead of `foot-refer`); S12/S13 correctly stayed green (unrelated).
  4. `engine.js`'s swap-in guard patched to fire for ANY active injury, not just foot-pf/meta →
     `scenarioNonFootRegressionPin` went red and ONLY that scenario (`keysMatchAll7Days:false`,
     showing the shoulder injury's mobility slot swapped to `footRehabMeta` and every run-day
     swapped to `rest` on all 7 program days) — confirms the regression pin has real teeth and
     isn't a bystander that would pass regardless.
  All 4 sabotage runs restored the scratch copy from the real (untouched) repo file before the next
  sabotage. The real repo js files were never modified during this audit.
- Final verification on the real (unmodified) repo files: `node --check` both PASS;
  `tools/_daysim.js` → 0 failures / 23 scenarios; `tools/_daysim-fixes.js` → 15/15 PASS, exit 0.

---

## Red/green table

| Scenario | File | Spec ref | First-run result | Final result | Notes |
|---|---|---|---|---|---|
| scenarioFootPfLifecycle | `_daysim.js` | §3.3 row1, §5.1-§5.4 | GREEN | GREEN | Full lifecycle: flag→window→swap-in(RICE)→swap-in(ease)→blocked gate→passed gate→tail Mon/Thu rule→post-expiry baseline. See gate-lie audit #1/#2 above for sensitivity. |
| scenarioFootMetaWindow | `_daysim.js` | §3.3 row2, §5.1 | GREEN | GREEN | ball+neural=false → foot-meta, 42d ease, footRehabMeta swap-in. |
| scenarioFootReflagDuringTail | `_daysim.js` | §5.4 | GREEN | GREEN | Re-flag mid-tail: fresh injury (extended:0), old tail cleared, fresh windows. |
| scenarioNonFootRegressionPin | `_daysim.js` | Preserved Invariant #1, §3.3 footnote | GREEN | GREEN | Shoulder injury: kind='acute', windows 3d/10d exactly, all 7 program days' block keys match the raw phase table (no swap engages), bare pain-free clear needs no gate. Confirmed sensitive via sabotage #4. |
| scenarioFootDst | `_daysim.js` | §9 ("mirrors the DST scenario") | **RED (my own authoring bug — see log)** | GREEN (assertion corrected) | Original assertion contradicted spec §5.2's documented no-gate fallback; rewrote to test the real gated-clear path across DST. |
| S10 figure coverage (updated) | `_daysim-fixes.js` | §7.3, §9 | GREEN | GREEN | Extended to accept gait / FIG_POSES / footCloseupFigure(key) as 3 valid resolution paths — this is a genuine coverage gap this closes: pf_stretch/foot_intrinsic previously had NO figure-coverage assertion at all. |
| S11 ball+neural=yes → foot-refer | `_daysim-fixes.js` | §3.3 row3 | GREEN | GREEN | Confirmed sensitive via sabotage #3. |
| S12 red flag → clinician (INJURY_FLAG) + foot-refer | `_daysim-fixes.js` | §3.3 last row | GREEN | GREEN | Reads `out.title` (UI-visible), not `.key` — INJURY_FLAG and INJURY_REST share key:'rest'. |
| S13 toes/top → generic windows, no swap | `_daysim-fixes.js` | §3.3 rows4-5 | GREEN | GREEN | Both zones checked in one scenario (kind, windows, no-swap for each). |
| S14 gate all-no cannot clear | `_daysim-fixes.js` | §3.5 | GREEN | GREEN | Confirmed sensitive via sabotage #2. |
| S15 rehabTail backup round-trip | `_daysim-fixes.js` | §4 | GREEN | GREEN | fullBackup() → applyBackup() into a reset persona; kind+until preserved exactly. |

**Totals:** `_daysim.js` 23/23 scenarios, 0 assertion failures (18 pre-existing + 5 new).
`_daysim-fixes.js` 15/15 scenarios PASS, exit 0 (9 pre-existing + 1 updated (S10) + 5 new).

## Contract mismatches found between `js/foot.js` and the plan

None. `js/foot.js` implements the pinned contract block verbatim: `FOOT_ZONES`, `footKind`,
`FOOT_WINDOWS`/`footWindow` (foot-pf 3/84, foot-meta 3/42, default 3/10), `footRehabKind`,
`FOOT_GATES`/`footGatePassed` (exact question copy + keys `walk`/`morning`/`raises`),
`REHAB_TAIL_DAYS=35`, `FOOT_CONDITION_NAMES`, `footGuideFor`, `footMapSvg`, `footCloseupFigure`
(pf_stretch/foot_intrinsic only, null otherwise) all matched what the scenarios needed with no
adjustment. `js/engine.js`'s `applyCheck` signature and `currentDayPlan()` swap-in/tail-append also
matched the plan's pinned contract exactly (additive 6th `foot` param; `state.injury.kind`/`.foot`;
`state.rehabTail`). The one thing worth flagging for Task F (not a mismatch, a documentation gap):
the tail-append "Mon/Thu" rule operates on `state.phase.dayInWeek` (the program's internal week
pointer, which freezes during an active injury and only advances on a Progress outcome) — NOT the
real calendar weekday. The spec/plan text ("fixed weekdays Mon/Thu for determinism") reads
ambiguously on this point; it's implemented correctly and consistently with the phase table's own
`day` labels, but Task F's docs pass (AI-START-HERE §8) should say explicitly that "Mon/Thu" means
program-week position, not calendar day, so nobody reads the banner copy and expects it tied to the
real day of the week.
