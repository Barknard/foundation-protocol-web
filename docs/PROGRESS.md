# Foundation Protocol — Progress Log

**Live:** https://barknard.github.io/foundation-protocol-web/ · **Repo:** `Barknard/foundation-protocol-web` (GitHub Pages, branch `main`)
**Source:** `~/foundation-protocol-web` · single self-contained `index.html` (+ `sw.js`, `manifest.json`, `icon.svg`, `logo.png`)
**Last updated:** 2026-06-17

A 40-week, research-grounded get-in-shape-without-injury program for ~40+, run as a daily two-tap autoregulated decision. Offline-capable PWA; optional GitHub data-sync per persona.

---

## What it is
- **Daily check-in (2 taps):** "Did you meet today's goal?" (done/partial/missed) + "How do you feel?" (1–5) → one of four calls: **Progress / Repeat / Modify / Rest**. Load only rises when you did the work *and* feel recovered. Only a Progress call advances the session pointer.
- **5 phases** (Infrastructure → Foundation → Run Introduction → Build → Target) over 40 weeks; autoregulation paces movement through them.

## Features shipped
**Onboarding & profile**
- Summit logo on the homepage (generated with open-source FLUX, recolored to the app palette) + matching SVG favicon/app icon.
- **Imperial default** weight (lb) with a lb/kg toggle and a greyed live auto-conversion to the side. Stored internally in kg.
- **Plain-language starting point** ("New / back after a break", "exercise sometimes", "train regularly") instead of phase jargon; conservative default, recommended-marked.
- **Username personas** — each profile saved as its own files: `data/users/<slug>/{profile,phase,checks}.json`. Switch/load a persona in Settings. Per-persona local storage (`foundation-protocol-state-v2:<slug>`). Legacy single-user data auto-migrates.

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
- 19 exercises, each an animated 2-frame stick figure (reworked to standard form: clean pushup/plank/RDL, plank forearms forward, supine dead-bug, lower goblet, red calf-emphasis on raises). Semantic color: floor=taupe, equipment=gold, motion=blue, body=cream.

**Data, sync, audit**
- **GitHub sync** (optional, per persona): push on check-in, pull on a fresh device, Test/Pull buttons. Hardened: 409 stale-SHA retry, `cache:'no-store'` on all sync GETs, cross-device checks merge, in-flight guard, allSettled pulls, auth-error surfacing. Token is user-pasted only (never embedded).
- **Activity log** (Settings → Data → Activity log): timestamped, color-tagged record of check-ins, calls, progressions, injuries, layoffs, syncs, persona/profile events; JSON export. Persisted per persona, capped at 500.
- Offline: service worker precaches the app shell (network-first `no-store` so deploys land instantly; API never cached). `.nojekyll` so Pages serves files as-is.

## Evidence basis
`docs/EVIDENCE-REVIEW.md` — an 8-topic web research + expert critique. Validated the **+10% session cap** (Johansen/Nielsen BJSM 2025), strength-from-day-1 (Lauersen BJSM 2018), conservative run intro, autoregulation, Zone-2/VO2max (Kokkinos JACC 2022), protein 1.6 g/kg. Drove the changes above (RICE→PEACE & LOVE, deloads, detraining, tendon-prep messaging).

## Testing
- 50 logic assertions (decision table, advance/rollover, applyCheck, injury, layoff tiers, deload, units, slug, session/completion, log) — **all pass**.
- 27 UI-flow assertions across every screen — **all pass**; rapid-navigation sweep clean (deferred-bind race guarded).
- GitHub push/pull round-trips verified against the live repo earlier; test data cleaned up.

## Pending (from EVIDENCE-REVIEW.md, not yet wired into the engine)
- Explicit **RIR 2–3 double-progression** for load advancement (currently in copy, not the engine).
- Split readiness into **sleep + soreness** multi-tap.
- **Phase-4 redesign** away from daily 100/100/100 toward quality sets + power + bone-snacks.
- Dynamic **power / bone-snack** prescriptions; dynamic-warm-up note; per-meal protein + creatine coaching.

## Updating
Edit `index.html`, `git push` to `main`; Pages redeploys (~1–4 min). Data lives in `data/users/<slug>/` and is untouched by code updates. To sync, paste a fine-grained GitHub PAT (Contents: Read & Write) in Settings.
