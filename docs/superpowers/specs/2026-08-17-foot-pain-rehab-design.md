# Foot Pain Drill-Down + Rehab — Design Spec (2026-08-17)

**Status:** APPROVED-DESIGN (Eddie, 2026-08-17) — pending spec review before implementation planning.
**Evidence base:** `docs/EVIDENCE-FOOT.md` (2026-08-16). Every prescription in this spec traces to a section there.
**Decisions locked by Eddie (2026-08-16/17):** full-screen foot step · all five zones supported (protocols where evidence supports, guidance cards where it doesn't) · rehab block swap-in with criteria-gated recovery · hybrid figures (tappable SVG map + skeleton frame-zoom + two hand-authored close-ups).

---

## 1. What this adds, in one paragraph

When a check-in reports foot pain, the app asks *where on the foot* via a full-screen tappable foot map (heel, arch, ball, toes, top). Heel/arch routes to the plantar-fasciitis protocol (Rathleff heel raise + DiGiovanni stretch + calf stretch); ball — after a one-question neuroma screen — routes to the metatarsalgia protocol (calf stretch + intrinsic foot work, honestly framed as thin evidence); toes and top-of-foot get zone-specific triage/guidance cards, not invented exercise programs. A red-flag screener (stress fracture, can't-bear-weight, systemic signs) runs before any protocol and routes to a clinician. While a foot condition is active, the daily plan adapts: a foot-rehab block swaps into the PT slot, impact cardio substitutes or pauses under the pain-monitoring rule, and other strength continues. Recovery is criteria-gated (pain-free walking + morning first-step pain resolved + the key exercise clean), followed by a relapse-prevention tail, with impact returning through the program's existing graded ramp.

## 2. Preserved invariants (non-negotiable)

- **Non-foot injury behavior is byte-identical.** Every other body part keeps today's exact flow, windows, and copy. A pinned sim scenario proves it.
- **Storage keys unchanged** (`foundation-protocol-*`). New state is additive fields only.
- **Zero-scroll hurt screen.** The foot map is a full-screen *replacement* step, sized by the `fitBodyMap` mechanism, never content appended below.
- **Zero build, no network, free.** New code follows the classic-script global-scope pattern.
- **Existing exercises, blocks, poses untouched** except: `calf_stretch` gains a foot-relevance tag; the Library gains a `Foot` category.

## 3. UX flows

### 3.1 Check-in drill-down (hurt mode)
1. User taps **Something hurts** (or low-feel discriminator) → existing body map.
2. Tapping `left foot` / `right foot` → screen swaps in place to the **foot close-up map**: a hand-authored tappable SVG (bodyMap conventions: `data-zone` buttons, `aria-pressed`, ≥48px targets, live breadcrumb "Hurting: Left foot · ball"). A "◀ whole body" ghost returns to the body map (foot selection preserved).
3. Zones: `heel` · `arch` · `ball` · `toes` · `top`. Single-select per foot (the drill-down refines ONE location; other body parts can still be multi-selected on the body map as today).
4. **Ball only:** one follow-up card — "Any burning, numbness, tingling, or a pebble-in-sock feeling between two toes?" Yes/No chips. Yes ⇒ neuroma-pattern clinician routing (§3.3).
5. **Red-flag screener** (all zones, after zone pick, same screen as the follow-up where present): 4 yes/no chips — pinpoint bone tenderness on one spot · pain at rest or at night · started with a pop / can't bear weight · foot is red-hot/swollen or fever. Any yes ⇒ sets `redFlag` ⇒ `INJURY_FLAG` routing (§3.3). All-no ⇒ proceed.
6. Submit ("See the call") requires: foot side + zone (+ screener answered). The existing neutral goal/feel backfill applies unchanged.

### 3.2 Result screen (the call)
- `foot-pf` / `foot-meta`: the Rest-call card gains a **protocol summary block**: the condition in plain language, the 3–4 exercises with rx, the pain rule ("some pain is OK — up to ~3/10, settling by next morning; climbing pain means back off"), the expected time-course, and "what changes in your plan starting tomorrow." Citations shown the way existing calls cite.
- Toes / top-of-foot (screener-clean): the call renders the **zone guidance card** (§6) instead of an exercise protocol.
- Neuroma-pattern or any red flag: `INJURY_FLAG` clinician card with condition-specific copy (what to say to the clinician, why self-management is wrong here). First real consumer of the existing dead routing.

### 3.3 Routing table (zone → outcome)

| Zone | Screen path | `injury.kind` | Program adapts? |
|---|---|---|---|
| heel, arch | protocol | `foot-pf` | yes — rehab swap-in |
| ball, neural=no | protocol | `foot-meta` | yes — rehab swap-in |
| ball, neural=yes | clinician (neuroma copy) | `foot-refer` | generic injury window |
| toes | guidance card | `foot-toes` | generic injury window |
| top (screener-clean) | guidance card | `foot-top` | generic injury window |
| any zone, red flag | clinician (`INJURY_FLAG`) | `foot-refer` | generic injury window |

`foot-refer`/`foot-toes`/`foot-top` reuse today's generic 3d/10d windows and load reduction — no new engine mechanics, only new content.

### 3.4 Today during active foot rehab (`foot-pf`/`foot-meta`)
- Recovery banner: `Recovering · plantar heel pain · day N` (plain-language condition name, not the zone string) with **Re-check pain →** unchanged.
- The day's plan comes from the swap-in (§5.3): foot-rehab block first, strength block (if the day had one) with a pain-rule note, impact cardio substituted (brisk walk / bike / swim "if available; walking is always the default") or Rest during the 3-day protect window.
- `dayWhy()` gains a foot-rehab branch: why loading beats rest, what gates recovery, trend of re-checks.
- Stone line stays suppressed (existing behavior).

### 3.5 Recovery re-check (the gate)
For `foot-pf`/`foot-meta`, tapping "feeling better" in the re-check replaces the bare pain-free clear with **three gate chips**:
1. Pain-free during normal daily walking?
2. Morning first-step pain gone or barely there? *(PF; for `foot-meta`: no ache under the ball during normal days?)*
3. 20 single-leg heel raises without the pain flaring? *(PF; for `foot-meta`: the intrinsic-foot set completed without flare?)*

- **All yes** ⇒ injury clears ⇒ **relapse tail** starts (§5.4) ⇒ result copy explains the tail + graded return of impact via the existing ramp.
- **Any no** ⇒ stays in rehab; the "no" is logged; copy: which criterion isn't met and what to keep doing.
- **Day ≥14 with no improvement trend** ⇒ banner adds the clinician nudge (evidence §5: not-responding catch-all).

### 3.6 Library
New `Foot` category with the new exercises. Each detail page carries its evidence framing (strong for heel raise/PF stretch; "commonly recommended, evidence still thin" for intrinsic work).

## 4. Data model (additive only)

```
state._chk   += footZone: 'heel'|'arch'|'ball'|'toes'|'top' | null
             += footNeural: true|false|null      // asked only for ball
             (redFlag already exists — the screener finally writes it)

checks row   += footZone (string|null)           // follows the `parts` precedent

state.injury += kind: 'foot-pf'|'foot-meta'|'foot-refer'|'foot-toes'|'foot-top'|'acute'
             += foot: {zone, neural} | null      // null for non-foot injuries

state.rehabTail = {kind, until} | null           // relapse-prevention window after clear
```
`rehabTail` must be added to all five persistence points (state declaration, load, save, fullBackup, applyBackup) and nulled on reset/logout. Old backups import cleanly (missing fields default null).

## 5. Engine changes

### 5.1 Kind-aware windows
`applyCheck` hurt path sets `kind` from the routing table. Windows by kind:
- `foot-pf`: protect 3d (unchanged) · ease **ceiling 84d** (12 weeks — Rathleff block length; evidence §6a says 3–6 months typical, the ceiling is a backstop, not a schedule)
- `foot-meta`: protect 3d · ease ceiling **42d** (6 weeks; evidence §6b)
- all other kinds (incl. every non-foot injury): 3d/10d exactly as today.
`pruneInjury` backstop mechanism unchanged — it just reads the per-kind ceiling.

### 5.2 Criteria-gated clear
The pain-free clear for `foot-pf`/`foot-meta` requires the three gate answers (§3.5) — carried through `applyCheck` as an additive param; a pain-free submit *without* the gate (shouldn't happen via UI) falls back to today's behavior.

### 5.3 Rehab swap-in at `currentDayPlan()`
The single choke point. When injury is active with kind `foot-pf`/`foot-meta`:
- Mobility/PT block → replaced by `footRehabPF` / `footRehabMeta`.
- Strength block → kept, with the pain-rule note appended (via the existing lighten/note mechanism, not a copy fork).
- Impact cardio (run blocks) → substituted with the low-impact block during ease; `Rest` during the 3-day protect.
- Non-impact cardio, rest days → unchanged.
Some days therefore render 3 blocks; Today's checklist already iterates blocks generically.

### 5.4 Relapse tail
On a gated clear: `state.rehabTail = {kind, until: +35d}` (28–42d band from evidence §6c — flagged extrapolated there and in the why-copy). While active: the foot-rehab block (light variant, 2×/week — fixed weekdays Mon/Thu for determinism) is **appended** to the day, nothing else changes. Expiry is silent (pruned like injuries). A new foot-pain flag during the tail behaves as a fresh injury (re-flag, windows restart).

### 5.5 Pain-rule + heel-raise cadence (deliberate v1 simplifications)
- The every-other-day Rathleff cadence is carried in the exercise rx/steps copy ("every other day — the rest day is part of the dose"), not enforced by the checklist.
- The ≤3/10 pain rule is instructional copy on the block note + result card, not a numeric input. (A pain slider is a possible v2; out of scope.)

## 6. Content: exercises, blocks, guidance cards

### 6.1 New exercises (in `EXERCISES`, cat `Foot`)
| key | name | rx | evidence |
|---|---|---|---|
| `pf_heel_raise` | Towel Heel Raise | every other day · 3×12 → 5×8 heavier | Rathleff 2015 — 3s up/2s hold/3s down, towel under toes, step edge, add backpack load over weeks |
| `pf_stretch` | Plantar Fascia Stretch | 10s × 10, 3×/day | DiGiovanni 2003/2006 — seated, cross leg, pull toes back; cue: before first morning steps |
| `foot_intrinsic` | Foot Core (short-foot + towel curls) | daily · 5×5s holds + 2×15 curls | thin-evidence framing in copy (evidence §3a) |

`calf_stretch` (exists) is tagged foot-relevant and included in both rehab blocks — no authoring.

### 6.2 New blocks
- `footRehabPF` (kind `mobility`): pf_heel_raise · pf_stretch · calf_stretch · foot_intrinsic
- `footRehabMeta` (kind `mobility`): calf_stretch · foot_intrinsic
- `footRehabTail` (kind `mobility`, light): condition's key exercise + calf_stretch
- `lowImpactSub` (kind `cardio`): brisk walk default; bike/swim/elliptical "if available" in detail copy.

### 6.3 Guidance cards (`FOOT_GUIDES`)
Authored data (title, plain-language "what this usually is", what-to-do-now, when-to-see-someone, citations):
- `toes` — symptom-branched: sudden hot/red/swollen (gout pattern → prompt care) · gradual bump/stiffness (bunion/hallux rigidus → footwear + clinician) · bent-back injury (turf toe → protect + clinician).
- `top` — lacing/footwear pressure + relative rest (extensor tendinitis pattern, thin-evidence flagged); reached only when the stress-fracture screener is clean, and the card still names the "one pinpoint spot / night pain / recent spike → clinician" line.
- `neuroma` — why this pattern needs a professional exam; conservative care exists but isn't self-serve.
All three end with the not-improving-in-2-weeks → clinician catch-all.

## 7. Figures (hybrid)

1. **Foot map SVG** — hand-authored, side-profile foot with 5 zone buttons, bodyMap conventions. Static (no animation).
2. **Skeleton + frame zoom** — `pf_heel_raise` gets a `FIG_POSES` entry (side view, step-edge prop + new small towel-wedge prop under the toes, `frame` zoomed to the lower leg); `calf_stretch` already has a pose.
3. **Hand-authored 2-frame close-ups** — `pf_stretch` and `foot_intrinsic` need visible toes, which the skeleton cannot draw. Two small purpose-built SVG figure pairs (bodyMap art style, f1/f2 cross-fade on the existing animator cadence). New routing branch in `animatedFigure`: gait → skeleton pose → **foot close-up** → legacy. The S10 figure-coverage sim assertion learns the new branch.

## 8. Module layout (decentralized-function law)

New file **`js/foot.js`** — the foot domain in one contract-bounded module: `FOOT_ZONES`, zone→kind routing (`footKind(zone, neural, redFlag)`), per-kind windows table, gate-criteria definitions, `FOOT_GUIDES`, the close-up figure builders, and pure helpers the engine/screens call. No DOM writes except the figure builders returning markup strings (same pattern as `figure.js`).
- Load order: `… program → figure → foot → engine → …` (engine reads foot helpers).
- Exercises/blocks stay in `program.js` (the existing registries the Library/sims read).
- Wiring: `index.html` script tag · `sw.js` SHELL list · both sim harnesses' file lists · `_daysim.js` hoist array for any new fn a scenario calls.

## 9. Test plan (the audit Eddie asked for)

**Sim (both harnesses green before any ship):**
- `_daysim.js` new scenarios: full PF lifecycle (flag → swap-in → blocked gate → passed gate → tail → ramp → normal); metatarsalgia window; re-flag during tail; **non-foot injury regression pin** (byte-identical windows/flow vs today); DST-crossing foot window (mirrors the existing injury DST scenario).
- `_daysim-fixes.js` new pinned scenarios: neural-yes routes to refer; red-flag routes to INJURY_FLAG; toes/top get generic windows + guidance content; gate cannot clear with any "no"; rehabTail persistence round-trip (backup export → import). S10 updated for the close-up figure branch; every new exercise key must resolve.
- `node --check` on all js.

**E2E (Playwright, mobile emulator 390×844, SW unregistered + hard reload first):**
- Drive the full drill-down: hurt → foot → zone → (ball: neural question) → screener → call → next-day Today shows the swapped plan → re-check gate (fail then pass) → tail visible → normal plan returns.
- Regression: a non-foot injury flow unchanged; all four tabs render; check-in a11y (radiogroup/aria-pressed) intact on the new screens; zero console errors.
- Then the standing full-suite pass (decide() truth table, day-gate, depth sims) per AI-START-HERE §11.

**Gate-lie check:** every new assertion is red-first (broken by reverting its feature) before it counts; no assertion may read only its own projection (e.g., the swap-in test asserts what `currentDayPlan()` *returns to the UI*, not an internal flag).

## 10. Ship checklist
- `APP_VERSION` 2.2.0 → **2.3.0** in `config.js` + `sw.js` CACHE `thp-shell-v2.3.0` (lockstep rule).
- `index.html` script tag for `foot.js`; `sw.js` SHELL += `./js/foot.js`; sim file lists updated.
- `docs/EVIDENCE-FOOT.md` linked from Settings → Evidence base; `AI-START-HERE.md` §4/§8 updated (new file, new flow); `docs/PROGRESS.md` entry.
- Commit/push + Pages verify only on Eddie's word; APK rebuild (versionCode 4) as a follow-up when Eddie asks.

## 11. Out of scope (named so they don't creep)
Numeric pain slider · left+right simultaneous foot drill-down (one refined location per check-in) · orthotic/footwear-fitting content beyond the guidance lines · night-splint programming · toe-segment skeleton articulation · any network feature.
