# The Hard Part — Visual & Flow Critique

**Date:** 2026-06-22 · **App version:** 2.1.0 · **Reviewed at:** 390×844 (phone, mobile emulator)

## How this was produced

This is a **grounded** critique: the live app was served locally and driven screen-by-screen through the real flows (onboarding, the daily two-tap loop, all four outcome calls, the injury/pain path, both Progress states, every tab, Settings, the returning-user resume screen, and the activity log), capturing **28 screenshots** in `critique-shots-2026-06-22/`. Those screenshots — plus the actual CSS/JS source — were then reviewed by **9 independent design lenses** (hierarchy, typography, colour/contrast, spacing, flow, figures, mobile-fit, brand/voice, components/a11y). Every finding was **adversarially verified** by a skeptic whose job was to refute it; claims that were subjective taste, screenshot artifacts, or factually wrong were thrown out.

> **Scorecard:** 68 raw findings → 44 unique issues → **29 confirmed, 15 refuted.** Confirmed by severity: **2 × P1, 7 × P2, 20 × P3.** One bug was found *and fixed* during the review (below).

Severity scale: **P0** blocks the task / fails accessibility hard · **P1** materially hurts the experience or fails a11y · **P2** real defect worth fixing soon · **P3** polish / nitpick.

---

## TL;DR — the verdict

The Hard Part is a **genuinely well-engineered, principled app whose chrome and a one-size-fits-all layout rule are quietly working against its own mission.** The bones are real craft: the autoregulation loop, the research grounding, the parametric figure engine, the calm dark palette. But:

1. **Utility housekeeping outranks the mission.** A gold "BACK UP YOUR DATA" nudge is rendered as the **top card on every Today state** — above the session, above the post-check payoff, and most jarringly above the red *active-injury* recovery card. Its "Export now" button is a full-width solid-gold button **equal in weight to the screen's real primary action**, so the one colour that should mean "do this now" is spent twice.
2. **The two genuinely serious problems are accessibility — on the app's most safety-critical inputs.** The pain body-map (the thing that drives the recovery call) has ~27×22px hit targets jammed edge-to-edge, far below the app's own 48px token; and the core goal/feel two-tap controls expose **no selected state to screen readers**.
3. **A uniform no-scroll rule creates feast-or-famine rhythm:** sparse screens float (a gold CTA mid-screen over 250px of dead ink) while dense screens crowd their last line against the nav with no scroll cue.
4. **The brand evaporates the moment onboarding ends** — the carved-stone / Sisyphus identity never reappears on the screens people actually live in.

**This is one priority-pass and one accessibility-pass away from excellent.** Fix gold discipline + the two P1s and it goes from "promising" to "shippable for the 40+ audience it targets."

---

## ✅ Fixed during this review

**Detail screens lost the bottom-nav highlight** *(you reported this — `12`→`13` showed no tab lit on an exercise detail).* Root cause: `appFooter(screen)` passed the raw screen name to `renderNav()`, which only matches the four tab names, so `exerciseDetail`/`phaseDetail` lit nothing. **Fixed** with a `NAV_PARENT` map (`exerciseDetail → library`, `phaseDetail → phase`) in `js/ui.js`; verified visually (`23-FIXED-exercise-detail-library-lit.png`) and programmatically; `sw.js` cache bumped `v3.16.1`. *Not committed — your call.*

---

## What's genuinely strong (keep these)

- **The autoregulation loop is the real innovation, executed end-to-end.** A true two-tap check-in deterministically drives Progress / Repeat / Modify / Rest, and "readiness, not the calendar" is visible right in the ALL-TIME CALLS ledger. This is a defensible product idea, not a generic tracker.
- **Research is woven in, not bolted on** — inline citations, the "WHY THIS PLAN?" affordance, PEACE & LOVE injury guidance. The instinct to show your work is exactly right for a cautious 40+ user.
- **The parametric figure engine is ambitious and mostly lands.** Standing figures (Single-Leg Stance, Mini-Squat, Goblet front view) read instantly at hero *and* thumbnail scale; the run gait reads as running across frames; the low-opacity depth limb is a smart 3D cue at hero size.
- **The calm dark palette + Fraunces/mono pairing** give a focused, premium, non-gamified mood appropriate to the audience — a serious training companion, not streak-bait.
- **The colour-blind strategy is the right instinct** — every semantic colour is backed by a leading glyph *and* a word, so meaning rarely rests on hue alone (even where two colours collide in luminance — see P3).
- **The "Something hurts?" pain discriminator** (`19`) — routing a hurting user through "tired vs one spot vs sharp/new" into pain-monitored loading — is genuinely thoughtful flow design and the app's reason-for-being.
- **The voice, where it appears, is excellent and ownable**: *"Easy runs feel suspiciously slow. That is the point."*, *"Nice work showing up"*, the Sisyphus thesis. The raw material for a strong personality is all here.
- **The fixed footer action-bar on Check-in** (pinned "See the call") is the correct primary-action model — the team already knows how to anchor a CTA; it just isn't applied consistently.

---

## Cross-cutting themes

1. **Utility chrome outranks the mission.** Housekeeping and ambiguity steal the primary visual tier. Fix = a hierarchy law: *exactly one solid-gold primary per screen, ordered after the state-relevant content,* housekeeping demoted to a quiet neutral strip.
2. **Gold is overspent, so nothing is primary.** Solid gold is simultaneously brand, milestone, primary-CTA, Modify/Partial semantic, *and* disabled-CTA (at 0.4 opacity). When the hero colour means five things it stops directing the eye.
3. **Accessibility gaps on the most safety-critical inputs.** Both P1s sit on core safety surfaces; smaller controls also fall under the app's own 48px token. The app *owns* the right tokens — it just doesn't honour them where it matters most.
4. **A uniform no-scroll rule creates feast-or-famine rhythm.** Replace "every screen fits one viewport" with "**nothing reads as clipped under the nav; balanced rhythm per screen**," and pick one anchoring model for primary actions.
5. **Brand evaporates after onboarding.** The "it gets easier — that's the hard part" thesis is never reinforced on the daily check-in or the "done" state where it would do real emotional work.
6. **Voice whiplash: coach vs. clinician on the same card.** Warm copy sits inches from cold undefined jargon. Establish one rule: plain language first, evidence in a consistent expander, never jargon naked.

---

## P1 — Accessibility, on the safety-critical inputs

### P1.1 — Pain body-map hit targets are far below 48px and abut with no gutter
`08-checkin-hurt-bodymap.png`, `20-checkin-bodymap-selected.png`

**Problem.** The body-map renders hit rects at ~2.43 CSS px/unit: **knee ≈ 27×22, foot ≈ 32×22, shoulder ≈ 39×22** — all under the app's own `--tap-min:48px` and failing WCAG 2.5.5/2.5.8 — and left/right thigh & knee/foot pairs sit **edge-to-edge with no gutter.** This is the single most safety-critical input in an injury-prevention app: a mis-tap selects the wrong region and **mis-drives the recovery call.** And it happens despite a huge empty viewport (the figure occupies only the middle third) — the figure was shrunk to satisfy no-scroll.

**Redesign.** Two moves:
1. **Reclaim the space** — scale the silhouette up ~1.6× to fill from under the prompt down to the action bar.
2. **Decouple hit area from art** — render each region as an absolutely-positioned transparent `<button>` sized in CSS px (min 48×48; knee/foot ~56), the coloured silhouette purely decorative beneath. Add ≥8px gutters between L/R pairs, and group the 4 small per-side leg zones into 2 (UPPER LEG / LOWER LEG) so no target is ever <48px:

```
WHERE DOES IT HURT?  TAP ALL THAT APPLY
+----------------------------------+
|              (head 56)           |
|     [L-arm 56]   [neck/shldr]    |
|     [   chest / torso 96    ]    |
|     [L-up-leg 56][gap][R 56]     |
|     [L-lo-leg 56][gap][R 56]     |
|     [L-foot 56  ][gap][R 56]     |
+----------------------------------+
[        Nothing hurts — clear     ]
```
Selected state fills the actual region (no offset halo), keeps `role=button`+`aria-pressed`, and adds a visible label chip ("Right knee") so meaning never rests on red fill alone. Re-measure every region at 390×844 to confirm ≥48px both axes.

### P1.2 — Goal chips & feel cells expose no selected state to screen readers
`07-checkin-default.png`, `09-checkin-selected.png`, `19-checkin-pain-discriminator.png`

**Problem.** Done/Partial/Missed and the five feel cells are plain buttons that only toggle a visual `.active` class (`js/screens.js:421-430`) — **no `aria-pressed`/`aria-checked`, no radiogroup** — while the body-map regions *do* expose `role=button`+`aria-pressed`. A screen-reader user hears "Done, button" with no idea what's selected, and the single-select feel grid is announced as five unrelated buttons. This is the product's **core two-tap interaction** and the gate that enables "See the call."

**Redesign.** Wrap goal chips in `div[role=radiogroup][aria-label="Did you meet today's goal?"]` and feel cells in `div[role=radiogroup][aria-label="How do you feel?"]`. Each option → `role=radio` with `aria-checked` toggled in the *same* handler as `.active` (single source of truth). Add roving `tabindex` so the grid is one stop, not five. Wire an `aria-live="polite"` node by the CTA announcing the gating microcopy ("Pick a goal and how you feel to see your call" → "Ready — see your call"). Verify with VoiceOver/TalkBack: selecting a feel should announce "Good, selected, 2 of 5."

---

## P2 — Real defects worth fixing soon

### P2.1 — The backup nudge tops every Today state and double-spends the primary gold
`05-today-precheck.png`, `11b-today-postcheck-lock.png`, `22-today-injury.png`

**Problem (precise).** `js/screens.js:262` prepends the backup nudge, so it is the **top card on every Today state.** It's a dark card with a thin gold stripe — *not* the largest element (the bottom "Daily check-in" CTA is) — but its inner **"Export now →" is a full-width solid-gold button equal in weight to the screen's real primary CTA.** So there are two co-equal gold buttons on pre-check Today, the nudge claims the top slot above the session and the post-check "✓ TODAY'S CALL · Progress" payoff, and in the injury state (`22`) it sits **above the red "RECOVERING · RIGHT KNEE" card.** The "No backup yet" copy is also off the calm coach voice.

> *Note: an earlier, louder version of this finding ("largest, highest-contrast element") was **downgraded** in verification — the nudge is not the biggest thing on screen. The defensible core stands: wrong priority order + duplicated primary gold.*

**Redesign.** Never render it first; order it **after** the state-relevant content; drop the solid-gold fill for a quiet neutral inline strip with a text link; **suppress it during an active injury window and on day 1**; soften copy: *"Your log lives only on this phone. Keep a backup safe → Export."*

### P2.2 — Injury Today shows two identical gold CTAs and subordinates the recovery card
`22-today-injury.png`

**Problem.** Two full-width solid-gold buttons appear at once — "Export now" (banner) and "Re-check pain" (recovery card) — so an injured user can't tell the recommended action. The red recovery card (the screen's reason-for-being) sits second, beneath housekeeping. *(Verification confirmed both buttons inherit the default solid-gold `--milestone` style; it downgraded the "invites mis-taps" angle because they sit in separate cards with a clear gap.)*

**Redesign.** One solid-gold primary per screen: **red recovery card first** with "Re-check pain" as the sole gold CTA, then today's call, then a demoted neutral backup strip (if shown at all).

### P2.3 — No-scroll rule → floaty CTAs + dead voids on sparse screens, crowding on dense ones
`05`, `11b`, `07`, `09`, `14`, `08`

**Problem.** `min-height:100svh` top-anchored layout gives feast-or-famine rhythm: Today's gold "Daily check-in" hovers at ~70% with ~250px dead below; Check-in leaves a ~350px void above a footer-pinned CTA; Progress leaves ~240px empty under a hollow Readiness card (true even when populated — see `26`); meanwhile the body-map and exercise detail crowd. Today also uses a *different* anchoring model than Check-in.

**Redesign.** Pick **one** anchoring model — adopt Check-in's footer action-bar for the primary CTA everywhere (make `.screen` a flex column, push the button down with `margin-top:auto`), and use reclaimed space deliberately (e.g. surface trend / next-session inline on Progress) rather than leaving gaps.

### P2.4 — Exercise detail overflows with no scroll cue, crowding the form STEPS
`13-exercise-goblet.png` (vs `17-exercise-run-frame1.png`)

**Problem.** Goblet detail measures `scrollHeight 1055 > 845`, so it scrolls — but step 03 sits jammed against the nav with **no fade or peeking row**, while simpler Easy Run fits. The injury-preventing form cues read as cut off, and the no-scroll promise only holds for low-step exercises.

> *Reconciliation: verification **refuted** three separate "content is permanently clipped under the nav" claims (the result Source line, the injury warning sentence, the injury "YOU'RE DONE" card). Those screens use `min-height:100svh` + ~96px reserved footer padding, so they scroll and everything is reachable. The real, confirmed issue is the **missing scroll affordance** on dense screens — content reads as clipped even though it isn't.*

**Redesign.** Stop chasing no-scroll; chase "nothing reads as clipped." Clamp the figure card to ~280px max-height, add a bottom gradient fade over the steps list, and pad the scroll container so the final step clears the fixed nav.

### P2.5 — Red `#CE4F38` fails 4.5:1 on small text — on the highest-stakes states
`22`, `14`, `19`, `21`

**Problem.** Measured: red is **4.11:1 on ink, 3.86:1 on card surface, 3.38:1 for paper-on-red** — so the "RECOVERING · RIGHT KNEE · DAY 1 OF 3" label, the red Missed/Rest count digits, and the active white-on-red "Missed" chip **all fail the small-text floor** — exactly the states a 40+ or bright-light viewer most needs to read.

**Redesign.** Add a lighter `--red-text:#E0735C` (≥4.5:1 on ink) for small red labels/digits; keep deep `#CE4F38` for large headlines/stripes/fills; render small labels in paper carrying red only on the adjacent glyph/stripe; lighten the active Missed chip rather than white-on-red.

### P2.6 — Goblet "dumbbell" prop is a tiny featureless orange square at the wrong height
`13-exercise-goblet.png`

**Problem.** `propGobletFront()` draws the prop as one ~4.4×4.4 rounded rect at the hand midpoint → a small orange block at the **pelvis**, not the chest the step text calls for ("Hold dumbbell vertically at chest"). It has no shape language, so it's distinguished from a bodyweight squat by **colour alone** — conflicting with the app's own "colour never carries meaning alone" principle.

**Redesign.** Redraw as an **outlined vertical dumbbell** (two plate rects + handle) or cupped-hands bracket, ~2× larger, anchored at **chest** between the hands so it reads on the dark card and matches the cue.

### P2.7 — Side-Lying Hip Abduction thumbnail collapses into an unreadable smudge
`12-library.png`

**Problem.** Drawn at the same scale as vertical standing figures, the side-lying (floor) figure renders as a thin horizontal tangle hugging the bottom of its 92×92 card with the top half empty — it doesn't read as a body, breaking glance recognition and forcing reliance on the text label.

**Redesign.** Add per-pose framing for horizontal figures: zoom + vertically centre to fill the box, thicken stroke at thumbnail scale, draw a ground line so orientation reads as intentional.

---

## P3 — Polish & nitpicks (20)

**Colour / contrast**
- **Green and gold share luminance** (`#92C285` 0.464 vs `#E3AC3C` 0.462): the CVD lightness-defence collapses for the two lightest colours — in ALL-TIME CALLS they're told apart by hue + tiny glyph only. *Fix: lighten green to ~0.62 luminance (e.g. `#B6D9A8`); verify on a desaturated Progress.* `14`,`10`,`05`
- **Blue & paper-low small mono text sit at/under 4.5:1** on dark cards (the "EASY · 30 MIN" label, Repeat digit, inactive feel labels, field help). *Fix: `--blue-text:#7AA0D8`, `--mono-low:#B0A896` for small-mono roles.* `05`,`14`,`07`,`01`
- **Disabled "See the call" is just gold at 0.4 opacity** (~2.4:1) — reads as a dull primary button, not "blocked," with no stated requirement. *Fix: inert style = `surface-1` fill + `paper-dim` text + 1px rule; add live gating microcopy.* `07`,`08`,`09`

**Typography / labels**
- **"WHY THIS PLAN?" label is 9.5px mono** — below the 12px floor, yet it's the only door to the research rationale. *Fix: bump to `.label-sm` 12px, tracking ~0.05em, or shorten to "WHY?".* `05`,`06`
- **Mono-uppercase label styles proliferate** (≥4 sizes, 2–3 trackings, 4+ colours) so a section header looks like a status tag looks like a caption; colour is used for ranking instead of meaning. *Fix: collapse to two roles (SECTION / CAPTION), semantic colour only, promote check-in questions to sentence-case headlines.* multiple
- **"Rest & protect" Fraunces-900 ampersand** renders as a heavy ornate ligature that reads like a typesetting glitch on a high-stakes screen. *Fix: spell out "and" in display titles.* `21`,`22`

**Figures**
- **Easy Run frame 2 reads as standing, not push-off**, and frames differ in height/lean → "jogging in place" jitter. *Fix: mirror frame 1 for an opposite stride at the same pelvis-Y/head-height/lean.* `17`,`18`
- **Figure stroke too thin at thumbnail scale**; the ghost depth-limb adds noise at 92px. *Fix: scale stroke-width to figure size; hide the ghost limb below ~120px.* `12`,`13`,`17`
- **Pain body-map is a blocky humanoid** that clashes with the stick-figure exercise language; the selected halo reads as a sticker. *Fix: harmonise toward the stick-figure aesthetic; fill the tapped region directly.* `08`,`20`

**Flow / states / controls**
- **Result screen offers three exits** (back, 4-tab nav, gold CTA). *Verification downgraded this to a taste call* — the gold CTA clearly dominates — but a footer action-bar (primary "Start next session" + text-link "Back to today") would remove all doubt. `10`,`21`
- **Two hurt-mode entry paths reach inconsistent submittable states** — the direct "Something hurts?" toggle lands on the body-map with goal/feel unset and "See the call" stuck disabled with no nudge, while the ROUGH→discriminator route carries them. *Fix: inline a goal/feel mini-picker on the direct path.* `08`,`19`,`20`
- **Weight stepper shows empty "Set lb"** (reads as un-filled/failed) with 40×40 buttons and a "−" with nothing to decrement. *Fix: default "0 lb", 48×48 steppers, dim "−" at floor.* `13`
- **Post-check edit/undo is a tiny unlabelled corner pencil** beside a static-looking countdown. *Fix: labelled "Edit today's check-in" link; make the countdown visibly tick.* `11b`
- **Header emblem (30×27) & banner dismiss "×" are unlabelled, sub-48px controls.** *Fix: pad `.hd-home` to 48×48 + aria-label "Home / Today"; dismiss → 48×48 labelled icon.* `05`,`11b`,`16`
- **Card padding & radii inconsistent** (≥4 radii: 16/14/12/24). *Fix: two radius tiers (16 content / 12 compact, 999 pills) + one padding token.* multiple

**Voice / brand**
- **Brand evaporates after onboarding**; the header emblem is a muddy ~40px thumbnail. *Fix: thread a rotating engraved-stone Sisyphus line into the post-check "done" card; replace the emblem with a legible 40px mark + small "HARD PART" wordmark.* multiple
- **Injury "WHY" is a ~90-word clinical wall** (PEACE & LOVE vs RICE, NSAIDs, "Vascularization", a BJSM cite) landing at the user's most anxious moment. *Fix: lead with one plain sentence ("Back off the movement that hurts, keep everything else moving — gentle activity heals faster than total rest."), move the rest into an "The evidence" expander.* `21`
- **Voice whiplash** — warm coach copy inches from cold jargon ("Tibialis · Calf", "HR over pace", inline citations). *Fix: gloss jargon in primary copy ("Tibialis"→"shin"), route citations to the "WHY/evidence" affordance, never inline.* multiple
- **"See the call" is unexplained jargon at first use.** *Fix: first-run microcopy under the CTA: "We'll read your check-in and make today's call: progress, repeat, modify, or rest."* `07`,`09`,`10`

---

## Investigated and dismissed (15 refuted)

The adversarial pass killed these — recorded so they don't resurface:

- **Result "Source" line / injury warning / injury "done" card clipped under nav** — *false.* Those screens scroll (`min-height:100svh`) and reserve ~96px footer padding; content is reachable. (The real issue is the scroll *cue* — see P2.4.)
- **Inter-card gaps uneven on Today** — *false.* Measured identical 18px throughout.
- **Goblet hero captured at standing frame / doesn't read as a squat** — *false.* It reads clearly as a deep squat.
- **Gray floor bar inconsistent across figures** — *false.* Byte-identical draw path in all three renderers.
- **"HARD PART" wordmark too low-contrast** — *false.* Measured 5.4:1 (highlights 7.9:1), clears AA.
- **Mid-sentence mono/Fraunces font shifts** — *false.* The crumb is a single `.mono` element.
- **Phase "FORMULA" citations a tiny edge-to-edge wall / "B3SM"** — *false.* "BJSM" is a thumbnail artifact; card has normal padding.
- **Body-map selected state is an offset floating ring** — *false.* The "ring" is the segment's own 2px stroke; the region fills.
- **Check-in "Feel —" token ambiguous with the separator** — *false.* Separator is a middot, the dash is the explicit null placeholder.
- **Celebration overlay doesn't render** — *false in substance.* It exists (`celebrate()`, 1500ms `.crown`); my screenshot just missed the window (the a11y tree caught "✦ You're set up").
- **540px cap strands the UI on tablet** — *not visible* in any captured shot (phone-only); a hypothetical to test, not a defect.
- **Onboarding bottom voids** — intended no-scroll behaviour, low priority.

---

## Supplementary states (captured after the main pass — lighter review)

These five fill the biggest coverage gaps the completeness critic flagged; captured by me directly and reviewed by eye (not through the full 9-lens + verify pipeline, so treat as medium-confidence):

- **`24-result-repeat.png` — Repeat call** (the *most common* outcome). Clean: blue "↻ Repeat this session", "Got it" CTA. Consistent with the other calls. No new issues.
- **`25-result-modify.png` — Modify call.** Gold "⇉ Easier version next" with a unique "TODAY, EASIER" two-card block (gold stripes). **Confirms P2.4 from another angle:** the "WHY" section sits below the fold against the nav with no scroll cue.
- **`26-progress-with-data.png` — populated Readiness chart.** The blue line chart reads well — **but** (a) the bottom void from P2.3 persists even on this data-rich screen, and (b) the line/dots are a single flat blue; tinting the dots by feel-band (red→gold→green) would echo the palette and make readiness legible at a glance. *(New, low-priority.)*
- **`27-welcome-back-resume.png` — returning-user resume.** Profile dropdown + "Continue", *plus* inline new-profile fields on the same step — a bit busy; "Continue" is the clear path, fine.
- **`28-activity-log.png` — Activity Log.** Strong: timestamped feed with colour-coded type tags (CHECK / INJURY-red / PROGRESS-green / PROFILE-gold). The red tag inherits the P2.5 contrast concern.

Also newly observed: a nice contextual variant — when an injury is active, the check-in retitles to **"Pain re-check / Still sore, or good to ease back in?"** (good touch).

---

## Coverage gaps still open (worth a second session)

Not yet captured/reviewed — ordered by likelihood of hiding problems:

1. **Phase *detail* screen** (`renderPhaseDetail`) — focus/exit bullets + a full "Sample week" of stacked coloured card-blocks; likely overflow + many stripes to judge.
2. **Deload "lighter week"** and **layoff "easing back in"** Today banners (distinct from injury; layoff uniquely carries *two* dismiss affordances and three copy tiers).
3. **Injury *ease-back* state** (after the ~3-day protect window flips to a gold "Ease back in" card) — distinct from the protect state shown.
4. **Exercise detail with a load actually set** — the `+/−` stepper at "45 lb", the RIR prescription block, and Today's per-lift `.lift-strip`.
5. **Pain discriminator "One spot hurts"** (non-sharp) branch — produces a *different* result than the "sharp/new" path shown.
6. **Capstone / Target** chrome-less celebration screen (no header/nav) — verify safe-area + scroll.
7. **Toasts** (success/error, ~20 trigger sites) and the **sync-status pill** (5 states) — never seen; verify contrast + position over the nav.
8. **Cloud-sync expanded form** (repo + PAT fields, the custom `.switch` toggle) — dark-mode field contrast.
9. **Native confirm() dialogs** (Reset / Import / Logout) over the dark UI; the destructive Reset flow.
10. **Live animation smoothness** (jank / limb jitter / many-canvas CPU on the Library list) — needs a performance trace, not stills.
11. **Larger-than-540 / landscape / iPad** (a stated target) — centring + gutters never verified.
12. **Bright-outdoor legibility** of a dark-only UI for an app used on walks/runs — a real use-case risk with no light theme.

---

## Recommended order of attack

1. **Two P1 accessibility fixes** (body-map targets, goal/feel ARIA) — small, high-leverage, safety-critical.
2. **Gold-priority discipline** (P2.1, P2.2, P3 disabled-CTA): one solid-gold primary per screen; demote the backup nudge; suppress it during injury/day-1.
3. **Layout anchoring** (P2.3, P2.4): one CTA model + scroll affordances; stop clipping-by-perception.
4. **Contrast tokens** (P2.5, P3 green/gold/blue): a few new text-only colour tokens.
5. **Figure polish** (P2.6, P2.7, P3 run/stroke) and **voice/brand pass** (jargon glossing, injury copy, brand beats) — the craft layer.

---

### Appendix — screenshot index (`critique-shots-2026-06-22/`)

`01-welcome` · `02-onboard-numbers` · `03-onboard-plan` · `04-onboard-crown`* · `05-today-precheck` · `06-today-why-panel` · `07-checkin-default` · `08-checkin-hurt-bodymap` · `09-checkin-selected` · `10-result-progress` · `11b-today-postcheck-lock` · `12-library` · `13-exercise-goblet` (pre-fix) · `14-progress` (empty) · `15-phase` · `16-settings` · `17/18-exercise-run` (gait frames) · `19-checkin-pain-discriminator` · `20-checkin-bodymap-selected` · `21-result-injury` · `22-today-injury` · `23-FIXED-exercise-detail-library-lit` · `24-result-repeat` · `25-result-modify` · `26-progress-with-data` · `27-welcome-back-resume` · `28-activity-log`

\* `04` did not freeze the overlay (auto-removes after 1500ms).
