# How The Hard Part works

*A plain-language tour of the engine behind the app — what the user taps, the formula that turns those taps into a call, how it adapts to real life, the evidence under the hood, and how every session points at the capstone.*

The Hard Part is a 40-week plan to get a 40-plus body genuinely fit — to a 10K plus 100 pushups, a 2-minute plank, and 100 squats in one session — **without getting hurt on the way**. The whole app is built around one idea: *load should follow readiness, not the calendar.* You don't earn a harder session by surviving a week; you earn it by doing the work and recovering well. Everything below is how that idea becomes code.

---

## 1. The daily feedback loop — two taps

Once per local day, the user answers two questions. That's the entire input.

1. **Did you hit today's goal?** — `done`, `partial`, or `missed`.
2. **How do you feel?** — a 1-to-5 dial (1 = wrecked, 5 = great).

Plus one always-available flag: **Did something hurt?** (sharp pain / a tweak), which can name a body part and raise a clinician red flag (can't bear weight, bone-point tenderness, numbness, deformity, a "pop", rapid swelling).

Key properties of the check-in:

- **Once per local day (the day-gate).** The check is keyed to the local calendar date. If you already checked in today, re-opening it shows your existing answer and lets you **edit** it — "lock with edit." You can't accidentally check in twice and double-advance the plan.
- **It's the only input.** No logging sets, no timers, no spreadsheets. Two taps and you're done.
- **It always produces a clear call** with an action and a *why*. No black box — the app tells you exactly what to do next and the reasoning behind it.

The output is always one of four calls: **Progress, Repeat, Modify, Rest**.

---

## 2. THE FORMULA — how two taps become a call

This is the heart of the engine (`decide(goalMet, feel, hurt)` in `js/engine.js`). Read top to bottom; the first matching rule wins:

```
if hurt            → Rest   (and escalate to a clinician on a red flag)
if feel <= 1       → Rest
if feel == 2       → Modify
if goalMet == done → feel >= 4 ? Progress : Repeat
otherwise          → Repeat   (partial or missed)
```

In words:

- **Hurt beats everything.** Sharp pain is not training stress — it's a stop sign. A plain tweak routes to *Rest & protect* (PEACE & LOVE). A red flag routes to *See a clinician first*.
- **Feeling wrecked (1) → Rest.** Recovery outranks the plan. Re-check tomorrow; nothing is lost by resting a day.
- **Feeling run-down (2) → Modify.** Keep the movement pattern, drop the intensity — incline pushups, bodyweight squats, run-walk instead of running. You keep the habit without digging a hole.
- **Did the work AND feel great (done + 4-5) → Progress.** This is the *only* path that moves you forward.
- **Did the work but only okay (done + 3) → Repeat.** You're recovered but not fresh enough to add load; repeating consolidates the adaptation already underway.
- **Partial or missed → Repeat.** The session wasn't completed, so there's nothing new to build on yet.

**Only Progress advances the pointer.** The "pointer" is your exact place in the plan — *phase → week → session*. Repeat, Modify, and Rest all hold you in place. Load only ever goes up on the single condition that you both completed the work and recovered well.

A few guardrails wrapped around the formula (also in `applyCheck`):

- **Advance at most once per day, and roll it back.** If you Progress in the morning and then edit your check-in to something lower, the app un-advances the pointer so your position always matches today's real call. No drift.
- **Demotion coming back.** A Progress call is quietly downgraded to Repeat if you're returning from a layoff or you're still inside an injury-protect window (see below) — so you never leap forward on your first day back.

---

## 3. How it dynamically and intelligently updates

The daily formula handles *today*. Four extra layers handle the slower, messier realities of training a 40-plus body. They're modifiers that sit on top of the call.

### Autoregulation (the base layer)
Already covered above: the plan moves only when you're ready, holds when you're steady, eases when you're tired, and stops when you hurt. This is what makes the program "intelligent" rather than a fixed calendar — every day's dose is decided by that day's signal.

### Layoff tiers — gap-aware return ramps (`layoffTier`)
The app measures days since your last check-in and ramps your return based on the gap, because **tendons de-adapt faster than your heart and muscles** — the classic 40-plus reinjury trap:

- **Under 15 days** — no penalty, resume where you left off.
- **15-28 days** — *Welcome back.* About 15% lighter today, rebuild over a week; hold running at your last tolerated run-walk, not your best.
- **29-56 days (~1-2 months)** — *Easing back in.* Start ~30% lighter, higher reps, +10%/week; running throttles back to early run-walk intervals.
- **57+ days** — *Restart, smartly.* Start ~40% lighter and rebuild running from the run-walk start — but with "muscle memory" messaging, because it comes back much faster the second time.

On the first day back, a would-be Progress is demoted to Repeat — no load jump straight out of a break.

### Deload — the lighter week (`deloadActive`)
Daily readiness catches *acute* bad days but misses *slow-accumulating* fatigue. So the app inserts a lighter week automatically:

- **Scheduled:** every ~5th week (week number divisible by 5, from Phase 1 on).
- **Early trigger:** if 3 or more of your last 7 check-ins were rough (feel ≤ 2, or a Modify/Rest call), it deloads early.

Note: a plain *Repeat* deliberately does **not** count toward that trigger — steady training at feel-3 is "holding," not under-recovery, so it won't trip a false deload. A deload **cuts load, it doesn't stop** — a full week off can actually dent strength.

### Injury — date-bounded PEACE & LOVE (`applyCheck` injury block + `standingCall`)
When you flag pain, the app opens a **bounded recovery window** instead of an open-ended "rest":

- **Protect window (~3 days):** offload the painful movement, keep moving everything that doesn't hurt. PEACE — and explicitly *not* RICE/ice-as-healing.
- **Ease-back window (to ~10 days):** pain-monitored loading — keep pain at or under ~3-5/10 and gone by next morning. LOVE — gentle progressive loading beats prolonged rest.
- **Red flag → clinician.** A warning sign halts self-rehab and routes you to care first — it matters more at 40-plus.
- **Self-healing dates.** Re-checking with no pain clears the injury early; re-flagging *extends* the window; and a stale window past its end date **auto-expires** back to normal training. The injury also surfaces as a persistent "standing call" across the days it covers, counting down (`day 2 of 3`), so the plan stays honest without you re-entering anything.

### Day-gate and per-day dedupe
One check per local day, editable. Internally the engine de-dupes by date (`state.checks.findIndex(c => c.date === today)`), so editing replaces today's entry rather than stacking a new one — which is what keeps the once-per-day advance and the roll-back logic exact.

### The +10% run cap (advisory)
Wherever a run appears, the session carries an advisory cap: **never run more than ~10% over your longest run in the last 30 days.** This governs running at the *session* level — the spike that actually causes overuse injury — rather than via discredited weekly-volume rules.

---

## 4. The research basis

The plan is unusually well-evidenced; the design choices map directly onto current sports-science consensus (full citations in `docs/EVIDENCE-REVIEW.md`):

- **Autoregulation over fixed percentages.** Effort/readiness-based progression matches or beats fixed plans with fewer over-reaching days (Greig 2022; network meta-analysis 2025; Granero-Gallegos 2021). Hence: load rises only on *done + feeling good*.
- **Strength as the primary injury insurance.** Strength training cuts overuse injuries by roughly half (Lauersen, BJSM 2018) — which is why strength enters in week 5, before any running, and never leaves.
- **Session-level spike control for running.** Single-session distance spikes, not gradual weekly buildup, drive overuse injury (Johansen/Nielsen, BJSM 2025; 5,205 runners, mean age 46) — the basis for the +10%-over-longest-recent-run cap.
- **Slowest-tissue pacing.** Tendons and bone lag the heart and muscles by months (Bohm/Arampatzis 2015; ACSM Bone Position Stand) — so Phase 0 is deliberately gentle, and the first month of any new running is treated as the highest-risk window.
- **Detraining asymmetry.** Tendon stiffness falls toward baseline in ~2 months while muscle/neural strength snaps back (Kubo 2010) — exactly why the layoff tiers restart *running* more conservatively than strength. Myonuclear memory means the *second* build is faster (Cumming 2024).
- **Deload as reduced load, not rest.** Lighter back-off weeks every ~4-6 weeks dissipate fatigue; a full week off slightly blunts strength (Bell 2024/2025; Coleman/Burke 2024).
- **PEACE & LOVE over RICE.** The originator of RICE retracted it; current consensus is protect-and-load, not prolonged rest and ice, with NSAIDs/ice de-emphasized (Dubois/Esculier, BJSM 2019/2020; Mirkin 2015) — and a red-flag screener for a population with higher fracture and medication-interaction risk.
- **Quality over grinding at the capstone.** Beyond ~10 hard sets per muscle there's no added benefit and more injury risk; training to failure adds nothing (Pelland 2025; ACSM 2026) — so the capstone is trained with quality sets (RIR 2-3) and a 10K build, not 100 fatiguing reps a day.
- **Readiness drivers.** Sleep loss cuts performance ~7.6% and blunts adaptation (Craven 2022); soreness flags tissue still repairing (Doma 2023) — which is what the daily *feel* tap is standing in for.

---

## 5. How it all builds toward the capstone

The plan is a pointer walking through five phases. **Only Progress moves it**, so the journey is exactly as long as your body needs — never faster.

| Phase | Length | What it builds |
|---|---|---|
| **0 — Infrastructure** | 4 wk | No training stress. Daily walking (build to 60 min), daily PT for hips/glutes/calves/balance, protein dialed in. Builds the slowest tissue first while fitness "feels" ready early. |
| **1 — Foundation** | 8 wk | Strength enters — two full-body sessions (Day A push/squat, Day B hinge/press) plus easy walks. The injury-insurance layer. |
| **2 — Run Introduction** | 12 wk | Run-walk intervals begin (1 min run / 4 min walk), 2× weekly, strength continues. The +10% session cap and eccentric calf work protect bone and tendon. |
| **3 — Build** | 16 wk | Continuous running becomes possible — 3 runs/week, polarized 80% easy / 20% hard, strength up to 3×. |
| **4 — Target** | capstone | Strength + a little power + the 10K build, trained with quality sets — not daily max volume. |

Each phase has explicit **exit criteria** (e.g. Phase 0: walk 60 min comfortably, 30-sec single-leg eyes closed; Phase 3: 5K continuous, 50 pushups unbroken). When the pointer finishes a phase it rolls into the next, but only Progress calls carry it there — so every step forward is a recovered, completed step.

**The capstone:** a 10K run plus 100 pushups, a 2-minute plank, and 100 squats **in a single session.** You arrive there not by grinding hundreds of reps daily (high injury risk at 40-plus for no extra gain), but by the cumulative effect of the autoregulated engine: forty-ish weeks of *progress when ready, hold when steady, ease when tired, stop when hurt* — with layoffs, deloads, and injuries absorbed automatically along the way.

That's the whole machine. Two taps a day, one formula, four modifiers, and a pointer that only ever moves when your body says yes.

---

*Reference files: `js/engine.js` (the `decide` formula, injury routing, pointer advance/rollback), `js/program.js` (phases, blocks, exercises, `layoffTier`, `deloadActive`, injury window), `docs/EVIDENCE-REVIEW.md` (full citations).*