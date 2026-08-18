# Lane B report — Engine + program data

Task B: js/engine.js, js/program.js, js/state.js, js/storage.js.

## Step 0: read plan + spec + AI-START-HERE
Done. Contract is pinned in the plan (js/foot.js will be built by Lane A in parallel; I code
against the pinned contract signatures only, not the actual file, which may not exist yet).

Key existing engine.js anchors to verify before editing (plan says lines may drift):
- applyCheck hurt path: engine.js:89-211 (plan) — verifying actual line numbers next.
- currentDayPlan: engine.js:58-66 (plan)
- state.injury written ~101, !hurt-while-injured clear ~102-106

program.js anchors: EXERCISES ~141, BLOCKS ~26, BLOCK_EX ~155, loadReduction 396-403,
pruneInjury 362-368, standingCall 370-382.

Next: Read the four owned files in full before editing.

## Step 1: read all four owned files in full
Done: engine.js (212 lines), program.js (426 lines), state.js (22 lines), storage.js (204 lines).
Confirmed actual anchors vs plan's line numbers — close enough (program.js grew from earlier lane-b
edits landing on top of a slightly different baseline than the plan's line numbers assumed; used
Edit-tool unique-anchor matches instead of raw line numbers throughout, so drift didn't matter).

## Step 2: program.js edits (all via Edit, unique anchors)
1. BLOCKS: added footRehabPF, footRehabMeta, footRehabTail, lowImpactSub (verbatim per plan Task B).
2. Added `RUN_BLOCK_KEYS` const right after `day()` helper — explicit enumerated list
   ['rw1','rw2','rw3','easyRun','longRun','tempo','longRun10k'] so currentDayPlan()'s impact-cardio
   detection matches on the key list, never string-sniffing title/label text (plan requirement).
3. EXERCISES: added pf_heel_raise, pf_stretch, foot_intrinsic (cat 'Foot') — copy verbatim from plan.
4. BLOCK_EX: footRehabPF, footRehabMeta, footRehabTail, lowImpactSub, PLUS one implementation-detail
   addition not literally named in the plan's block list: `footRehabTailMeta` — a BLOCK_EX-only lookup
   alias (NOT a new BLOCKS entry) so a foot-meta tail's exercisesForBlock() resolves to
   [foot_intrinsic, calf_stretch] instead of the PF tail's [pf_heel_raise, calf_stretch], matching the
   plan's literal instruction: "implement BLOCK_EX.footRehabTail = [...] and for a meta tail substitute
   foot_intrinsic for pf_heel_raise in currentDayPlan (document inline)." The visible block object
   handed to Today/screens is ALWAYS { ...BLOCKS.footRehabTail, key } — only the lookup key differs
   between the two tail flavors. Documented inline at both the BLOCK_EX entry and the currentDayPlan()
   call site. Flagging this as a judgment call in the final summary since it's a small deviation in
   *mechanism* (an extra map key) even though the *behavior and single visible block name* match the
   plan exactly.
5. clearInjury(): added `rehabTailActive()` helper right after it (mirrors returnRampActive()'s
   until-based expiry check, but read-only — no self-mutation on read, since pruning is centralized).
6. pruneInjury(): added a second clause that nulls `state.rehabTail` (silently, no logEvent — spec
   §5.4 says tail expiry is silent, unlike injury-window expiry which does log) whenever
   `!rehabTailActive()`. All existing call sites (screens.js:215, init.js:6) automatically get tail
   pruning for free — did NOT touch either of those files.
7. standingCall(): `parts` var now prefers `FOOT_CONDITION_NAMES[inj.kind]` (guarded typeof, since
   FOOT_CONDITION_NAMES lives in foot.js/Lane A) and falls back to the original `(inj.parts||[]).join`
   — byte-identical for every kind FOOT_CONDITION_NAMES doesn't cover (i.e. 'acute' / non-foot).
8. loadReduction(): ease-note branch (non-RICE injury phase) now checks `footRehabKind(state.injury.kind)`
   (guarded typeof) and swaps in the foot-specific pain-rule copy verbatim from the plan; every other
   kind keeps the exact original string.
`node --check js/program.js` → OK.

## Step 3: engine.js edits
1. `currentDayPlan()`: rewrote to (a) keep the exact original lighten/no-lighten path byte-for-byte in
   effect (still returns content-identical output when no lr/no foot-rehab/no tail — now always
   returns a NEW `{day, blocks}` object rather than the raw `base` reference; confirmed nothing in the
   repo compares currentDayPlan() output by reference, only by content/blocks — grepped for
   `currentDayPlan() ===` and found no hits), (b) foot-rehab swap-in gated on
   `injuryActive() && footRehabKind(inj.kind)` — mobility block replaced by the kind's rehab block,
   RUN_BLOCK_KEYS-listed blocks replaced by `rest` (during RICE) or `lowImpactSub` (during ease),
   everything else (strength, walk-only cardio, rest, milestone) passed through untouched, (c)
   relapse-tail append (never swap) on idx 0/3 (Mon/Thu — pd.week is always Mon..Sun for every phase,
   confirmed by reading all 5 PHASES entries in program.js) while `!injuryActive() && rehabTailActive()`.
2. `applyCheck(goalMet, feel, hurt, parts, redFlag, foot)`: added the additive 6th param.
   - hurt branch: computes `kind`/`footInfo` from `foot.zone` via `footKind()` (guarded typeof — falls
     back to 'acute' + null exactly as before when no foot.zone or foot.js absent); windows now come
     from `footWindow(kind)` (guarded typeof, fallback `{rice:3,ease:10}` — the exact old hardcoded
     values) instead of the two hardcoded `3*86400000`/`10*86400000` literals. state.injury gains
     `kind` (was hardcoded 'acute', now real) and `foot`. Also nulls `state.rehabTail` on every fresh
     hurt flag (see judgment call below).
   - pain-free branch: added the criteria-gated clear for `footRehabKind(inj.kind)` kinds — passes only
     when `foot && foot.gate` is present AND `footGatePassed(kind, foot.gate)` is true; on pass, clears
     the injury and sets `state.rehabTail = {kind, until: localMidnight(now)+REHAB_TAIL_DAYS*86400000}`
     (guarded typeof, fallback 35 — the exact contract default) + logs the "Recovery gate passed" line;
     on fail, injury stays, logs which gate keys are still false, and overrides `outcome` to
     `{...INJURY_REST, why: 'Keep going — ...' + INJURY_REST.why}` so the UI reads as "still in
     rehab", not a fresh injury flag. Every other case (non-foot, foot-refer/toes/top, or a gated kind
     submitted with no `foot.gate` at all) falls through to the ORIGINAL unconditional
     clearInjury()+logEvent — byte-identical to today for all of those.
   - checks-row `entry`: added `footZone: (foot && foot.zone) || null` next to `parts`.
`node --check js/engine.js` → OK.

## Step 4: state.js edits
- Updated the stale `injury` comment (now documents kind/foot/redFlag/extended/firstSince/clearedAt).
- Updated `checks` comment to mention the new `footZone` field.
- Added real `rehabTail: null` field with comment (this is the one truly-persisted new top-level field).
- Added a comment-only block documenting `state._chk.footZone`/`.footNeural` shape — NOT declared as a
  live field (that object is created ad hoc by screens.js, which I don't own; contract only requires
  the shape be documented, not that state.js pre-declare a transient draft object other lanes own).
`node --check js/state.js` → OK.

## Step 5: storage.js edits — all five persistence points + logout
1. `logout()`: added `state.rehabTail = null;`.
2. `loadUserState()`: default-reset line adds `state.rehabTail = null;`; the `if (raw)` restore line
   adds `state.rehabTail = d.rehabTail || null;` (missing-field-safe for old saves).
3. `saveLocal()`: added `rehabTail: state.rehabTail` to the persisted JSON blob.
4. `fullBackup()`: added `rehabTail: state.rehabTail,`.
5. `applyBackup()`: added `state.rehabTail = obj.rehabTail || null;` (missing-field-safe for old backups).
`node --check js/storage.js` → OK.

## DEAD END / ESCALATION: the "reset" nulls half of the persistence checklist
The plan's Task B file-scope line says storage.js needs edits at "reset/logout nulls". `logout()` is
genuinely in storage.js (done, see Step 5.1). But the actual "Reset" button handler that zeroes
in-memory state (`state.lifts={}; state.returnRamp=null; state.layoffDismissedOn=null;` etc.) lives in
**js/screens.js** (`s-reset` click handler, ~line 1009-1013) — which is explicitly out of my ownership
("Touch NOTHING else (not foot.js, not screens.js, not the sims)"). I did NOT touch screens.js.
**Flagging for the overseer / Lane C: js/screens.js's Reset handler needs `state.rehabTail = null;`
added alongside its other nulls, or a from-fresh persona re-login would carry over a stale rehabTail
across the reset boundary until the next pruneInjury() call happened to clear it (harmless in practice
since pruneInjury() runs at boot via init.js, but it's a real gap in the "five-point + reset" checklist
that only screens.js can close).**

Next: verify with node tools/_daysim.js and node tools/_daysim-fixes.js.

## Step 6: run the two official harnesses
`node tools/_daysim.js` → **18/18 scenarios, 0 assertion failures** (identical to baseline — this
harness doesn't yet load foot.js, so every one of these exercises the fallback/default path, which
is exactly the non-foot regression surface).

`node tools/_daysim-fixes.js` → **9/10 PASS, 1 expected FAIL**: `S10 figure coverage` fails with
"no figure for: pf_stretch, foot_intrinsic". Root cause: S10 (pre-existing, in program before this
plan) iterates every `EXERCISES` entry and requires either a gait key or a `FIG_POSES` entry — it has
no concept of `footCloseupFigure()` yet. Adding the 3 new EXERCISES entries (pf_heel_raise, pf_stretch,
foot_intrinsic — required by Task B) makes 2 of the 3 fail this check (pf_heel_raise will get a
FIG_POSES entry from Lane D and pass; pf_stretch/foot_intrinsic are close-up-figure-only by design,
per spec §7.3, and need `footCloseupFigure(key)` wired into the coverage check). The plan's own Task E
scope explicitly owns this fix: "S10 updated: an exercise key resolves if gait OR pose OR
footCloseupFigure(key) truthy" — tools/_daysim-fixes.js is Lane E's file, not mine, so I did not touch
it. **This is the expected, required, and anticipated consequence of Task B's exercise additions, not
a regression I introduced by error** — flagging clearly rather than silently leaving it red with no
explanation.

## Step 7: self-QA beyond node --check + the official (non-foot-aware) harnesses
Since `js/foot.js` turned out to already exist on disk (Lane A landed ahead of my pass — confirmed
its exports match the pinned contract exactly: FOOT_ZONES, footKind, FOOT_WINDOWS/footWindow,
footRehabKind, FOOT_GATES/footGatePassed, REHAB_TAIL_DAYS=35, FOOT_CONDITION_NAMES, FOOT_GUIDES/
footGuideFor, footMapSvg, footCloseupFigure — all present, all matching signatures), and since neither
official harness loads foot.js yet (Lane E hasn't wired it in — confirmed via grep, zero "foot"
references in tools/_daysim.js or tools/_daysim-fixes.js), I wrote a throwaway self-check harness in
my scratchpad (not part of the repo) that loads the REAL config/state/program/figure/foot/engine/
util/storage.js stack in a VM sandbox (mirroring tools/_daysim.js's pattern) and ran 38 assertions
end-to-end against the actual foot.js:
- Foot-pf lifecycle: hurt+heel → kind=foot-pf, ease=84d/rice=3d, injury.foot={zone:'heel',neural:null},
  checks-row footZone='heel'; mobility slot swaps to footRehabPF; a run-block slot swaps to `rest`
  during RICE and to `lowImpactSub` during ease; partial gate (2/3 true) keeps the injury active and
  the outcome key is 'rest'; full gate clears the injury and arms `rehabTail` (~35 days out, kind
  preserved); the tail block appears at dayInWeek 1/4 ("Mon"/"Thu" — confirmed these are ordinal
  program-week positions via `state.phase.dayInWeek`, NOT the real calendar weekday — currentDayPlan()
  never reads the clock) and is absent elsewhere; pruneInjury() silently drops the tail after expiry
  and the plan reverts to baseline.
- Foot-meta: ball+neural=false → kind=foot-meta, ease=42d, rehab block=footRehabMeta; on a full-gate
  clear, `exercisesForBlock('footRehabTailMeta')` resolves to [foot_intrinsic, calf_stretch] while
  `exercisesForBlock('footRehabTail')` (the PF tail) still resolves to [pf_heel_raise, calf_stretch] —
  confirms the tail substitution mechanism works and doesn't cross-contaminate the two lists.
- Re-flag during tail: hurt again (different zone, foot-meta) mid-PF-tail → fresh injury with its own
  kind/windows, and `state.rehabTail` is nulled by the fresh flag (my judgment call, see below).
- Non-foot regression pin: `applyCheck(..., ['shoulder'], false)` with NO 6th `foot` arg at all →
  kind='acute', windows exactly 3d/10d, `injury.foot===null`, `currentDayPlan()` never swaps in any
  foot block, bare pain-free re-check (no gate object) clears immediately, checks-row `footZone===null`.
- Edge case: a gated-kind injury (foot-pf) re-checked pain-free with NO `foot` argument at all (an
  old-style/non-UI call site) falls back to the legacy immediate clear rather than getting stuck
  forever — confirms my reading of spec §5.2's "falls back to today's behavior" escape hatch.
- Copy: `standingCall()` label reads "Recovering · plantar heel pain · day N of M" for foot-pf;
  `loadReduction()`'s ease-phase note is the foot-specific pain-rule string for a foot-rehab kind and
  the exact original string, byte-for-byte, for a non-foot kind.
All 38 assertions passed on the first fully-corrected run (two rounds of self-check bugs were caught
and fixed along the way — both were test-harness mistakes, not production bugs: (1) I initially drove
"which day" via the sim clock instead of `state.phase.dayInWeek`, since currentDayPlan() is driven by
the program pointer, not the calendar — same mechanism the rest of the app already uses; (2) I
compared `state.rehabTail.until` against the outer script's real unfaked `Date.now()` instead of the
sandbox's fake clock).

A second throwaway script verified the storage.js persistence points directly against real
config/state/.../storage.js: save→loadUserState round-trip preserves `rehabTail`; `fullBackup()`
includes it; `applyBackup()` restores it; an old backup object with no `rehabTail` key at all
defaults to `null` without throwing; `logout()` nulls it.

Re-ran both official harnesses after all edits settled: `node tools/_daysim.js` → 18/18, 0 failures.
`node tools/_daysim-fixes.js` → 9/10 (S10 red, expected/explained above). `node --check` on all four
owned files → OK.

## Summary of every behavior branch added (final)
1. `applyCheck(goalMet, feel, hurt, parts, redFlag, foot)` — additive 6th param, `foot = null |
   {zone, neural, gate}`.
2. On `hurt` with `foot.zone` set: `kind = footKind(zone, neural, redFlag)` (else 'acute');
   `state.injury.kind`/`state.injury.foot` populated; windows from `footWindow(kind)` replace the two
   hardcoded 3d/10d literals (identical default for every other case, incl. `foot.js` not yet loaded).
3. On every fresh `hurt` flag (foot or not): `state.rehabTail = null` — a fresh injury supersedes any
   relapse-prevention tail in flight (judgment call, see "Deviations" below).
4. On pain-free re-check while `footRehabKind(injury.kind)` is true AND `foot.gate` was supplied:
   gate pass → `clearInjury()` + `state.rehabTail = {kind, until: localMidnight(now)+REHAB_TAIL_DAYS*86400000}`
   + a "Recovery gate passed" log line; gate fail → injury stays, a "Gate not yet met — <keys>" log
   line, and `outcome` is overridden to `{...INJURY_REST, why: 'Keep going — ...'}` (key stays 'rest').
5. Every other pain-free case (non-foot, foot-refer/toes/top, or a gated kind submitted with no
   `foot.gate` at all) is the ORIGINAL unconditional `clearInjury()` + log line — untouched.
6. Checks-row `entry.footZone = (foot && foot.zone) || null`.
7. `currentDayPlan()`: while `injuryActive() && footRehabKind(kind)` — mobility block → footRehabPF/
   footRehabMeta; any `RUN_BLOCK_KEYS`-listed block → `rest` (RICE) or `lowImpactSub` (ease); strength/
   walk-only-cardio/rest/milestone unchanged (strength keeps its pain-rule note via the pre-existing
   `lightenBlock`/`loadReduction` path, no fork). While `!injuryActive() && rehabTailActive()` and
   `idx` (0-based program-week position) is 0 or 3 ("Mon"/"Thu" slots): `BLOCKS.footRehabTail` is
   APPENDED (never swapped), with its `exercisesForBlock` lookup key set to `footRehabTailMeta` for a
   foot-meta tail (substituting foot_intrinsic for pf_heel_raise) or `footRehabTail` otherwise.
8. `pruneInjury()`: unchanged injury-expiry clause, PLUS a new silent (`no logEvent`) clause that nulls
   `state.rehabTail` once `!rehabTailActive()` — inherited for free by every existing call site
   (screens.js:215, init.js:6) since I didn't need to touch either file.
9. `standingCall()`: label prefers `FOOT_CONDITION_NAMES[kind]`, falls back to the original
   `parts.join(', ')` for every kind not in that table (i.e. every non-foot injury, byte-identical).
10. `loadReduction()`: ease-phase note branches on `footRehabKind(injury.kind)` — foot-pf/foot-meta get
    the new pain-rule copy verbatim; every other kind (incl. foot-refer/toes/top, which the spec
    explicitly says reuse the generic load-reduction copy) gets the original string unchanged.
11. New program.js data: EXERCISES ×3 (pf_heel_raise, pf_stretch, foot_intrinsic, cat 'Foot'), BLOCKS
    ×4 (footRehabPF, footRehabMeta, footRehabTail, lowImpactSub), BLOCK_EX ×5 (the 4 above plus the
    `footRehabTailMeta` lookup alias), `RUN_BLOCK_KEYS` const, `rehabTailActive()` helper.
12. state.js: `rehabTail: null` field added; `injury`/`checks` shape comments updated; a
    documentation-only comment for `state._chk.footZone/.footNeural` (screens.js-owned, not declared
    here).
13. storage.js: `rehabTail` threaded through all five persistence points (loadUserState load + its
    default-reset line, saveLocal, fullBackup, applyBackup) and `logout()`'s nulls.

## Deviations from the plan text, and why
1. **`footRehabTailMeta` BLOCK_EX key** (not literally named in the plan's 4-block list). The plan's
   own instruction for the tail substitution is procedural ("implement BLOCK_EX.footRehabTail = [...]
   and for a meta tail substitute foot_intrinsic for pf_heel_raise in currentDayPlan, document
   inline") rather than declarative, so I chose the mechanism: a second BLOCK_EX entry used purely as
   an `exercisesForBlock()` lookup key, never as a second visible block (the rendered block object is
   always `{...BLOCKS.footRehabTail, key: <lookup key>}` — one BLOCKS entry, matching the plan's single
   named block exactly). Documented at both the BLOCK_EX definition and the currentDayPlan() call site.
2. **`state.rehabTail = null` on every fresh `hurt` flag**, including re-flags of a different zone/kind
   mid-tail. The plan's scenario name ("scenarioFootReflagDuringTail... tail replaced by new windows")
   is ambiguous between "the injury's own windows restart" (definitely true regardless) and "a new
   tail object replaces the old one" (only literally true if a NEW gated clear happens later). I chose
   to null the stale tail immediately on re-flag rather than leave a dangling old `until` timestamp
   that could resurface after a non-gated clear of the new injury (e.g. re-flag as foot-toes, which
   clears immediately and unconditionally — the old PF tail would otherwise reappear even though the
   person's relapse-prevention window logically ended when they got hurt again). Low risk either way
   since currentDayPlan() already gates tail-append on `!injuryActive()`.
3. **Gate-fallback interpretation** (spec §5.2: "a pain-free submit without the gate ... falls back to
   today's behavior"). The pinned `footGatePassed(kind, answers)` returns `false` when `answers` is
   undefined (its `every()` short-circuits on the first missing key), which would NOT fall back to
   legacy behavior if called directly — it would permanently block the clear. I read "falls back to
   today's behavior" as an instruction to CALLERS of `footGatePassed`, not a claim about
   `footGatePassed`'s own return value: my code only invokes gate-checking at all when `foot &&
   foot.gate` is truthy; when a gated-kind injury gets a pain-free submit with no gate object present,
   it takes the legacy unconditional-clear branch. Verified in self-QA test T5a.
4. **`currentDayPlan()` return-object identity**: previously returned the raw `pd.week[idx]` object by
   reference when no load-reduction was active; now always returns a new `{day, blocks}` object
   (content-identical, never reference-identical, in that no-op case). Grepped the repo for
   `currentDayPlan() ===`-style reference comparisons and found none — content is all that's read
   anywhere (Today, session tracking, sims). Flagging since "byte-identical" could be read either way.

## ESCALATION (repeated from Step 5, action needed from someone who owns screens.js)
`js/screens.js`'s Settings→Reset handler (`s-reset` click, ~line 1009-1013) nulls
`state.lifts/returnRamp/layoffDismissedOn/...` directly and needs `state.rehabTail = null;` added
alongside them. I did not touch screens.js (explicitly out of scope for Lane B). Not fixing this
doesn't break anything today (pruneInjury() at boot would clean up a stale carried-over rehabTail),
but it's a real gap in the "five persistence points + reset/logout" checklist that only a screens.js
owner (Lane C or the overseer) can close.

## Final file list touched
- js/engine.js
- js/program.js
- js/state.js
- js/storage.js
(No other files touched. No git commands run.)
