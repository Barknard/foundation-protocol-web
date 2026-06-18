# The Hard Part — UX research & recommendations (2026-06-17)

Two evidence reviews (multi-agent, cited). Items marked ✅ are already implemented this session.

## A. Check-in cadence, journey, low-feel pain (decisions — implement)
- **Check-in = once-per-day, lock-with-edit** (NOT a greyed "come back tomorrow" wall — reads parental, blocks corrections; NOT re-check — repeated same-day ratings corrupt the signal, Springer 2024). ✅ "Check in again" replaced with "See where you are" + a quiet pre-filled "edit today's answer". Engine already overwrites the single dated record and rolls back a same-day downgrade.
- **Low-feel pain = 3-way discriminator at feel ≤2**: *Just tired/sore all over* (default, no injury) · *One spot hurts* → body-map · *Sharp/new/worse* → body-map pre-leaning injury. Soreness never lives in a joint; soreness path = relative rest/Modify, not immobilization. ✅ implemented.
- **Journey visibility (TODO):** a 5-phase stepper ("Phase X of 5: Name"), **endowed progress** (phases below the user's start shown pre-filled), within-phase **progressions-earned** (never "weeks behind"), a **proximal next-milestone** line ("clear 2 more Progress sessions to reach Foundation"), and the **capstone as the far horizon** (no live % bar). Tappable Today crumb → Progress. Fresh-start weekly framing. Refs: Kivetz 2006 (goal-gradient/endowed), Locke & Latham (proximal subgoals), Harkin 2016 (monitoring effect), Ryan & Deci (competence).
- **Completion framing:** acknowledge by *outcome*; every call incl. Rest/Missed is legitimate; **no streak counter** (keep it that way).

## B. Critical UX recommendations (substantial MISSING elements)
1. **CRITICAL — Import/Restore + lossless Export.** Export exists but there's no Import anywhere, and export drops injury/session/log. With GitHub down this is the *only* way to recover/move 40 weeks of data. (effort M)
2. **CRITICAL — Return trigger (opt-in).** No reminders/notifications at all. Add: a "when works best?" cue, an opt-in daily nudge (Notifications API), and an **.ics calendar export** (server-less, offline, sidesteps iOS-PWA push). Default OFF. (L)
3. **CRITICAL — Accessibility floor.** No `:focus-visible`; focus destroyed on every `render()`; body-map injury picker is pointer-only (not keyboard/SR operable). Violates WCAG 2.4.7/2.4.3/2.1.1/4.1.2 on the core flow. (L)
4. **HIGH — Protect destructive actions.** Reset / Pull-overwrite guarded only by `confirm()`; no backup-before-destroy, no undo; a corrupt blob silently falls through to onboarding (40 weeks vanish). Add safety snapshot + undo + recovery screen. (M)
5. **HIGH — Persistent global sync status** with plain-language errors + in-place retry (sync pip only exists on Today). (M)
6. **HIGH — Settings/Log reachable from every tab** (holds the only data safety net). (S)
7. **HIGH — Undo for daily check-in & mark-all.** (M)
8. **HIGH — First-run orientation:** explain the four calls + phases *before* the user is scored by them. (M)
9. **HIGH — Stop echoing the GitHub PAT into the DOM**; mask/scope it; make the daily CTA persistent. (M)

## C. Quick wins
- `role="status" aria-live="polite"` on #toast + .sync chip; aria-labels on icon-only buttons; `:focus-visible` rings.
- Lighten `--paper-low` (#807868 → ~#9A9282) for AA contrast on help text.
- Don't push tab screens onto the back-stack (Back stops looping through tabs).
- Library search box; Progress empty-state guard (0 checks); rem-based type scale for OS font-scaling.
- Surface the capstone once in onboarding's Plan step + a quiet line on Progress.
- 40-week rail on the Phase tab (5 segments sized 4/8/12/16, "Week N of 40").

## D. Structural backbone (recommended next build)
A **frozen app-shell**: fixed **header = "where you are"** (journey crumb/stepper, item A) + scrolling main + fixed **footer = nav/primary action** (item: consistent bottom bar). This single change satisfies the frozen-header/footer request, the journey-visibility request, and cross-screen consistency at once — every other item hangs off it.
