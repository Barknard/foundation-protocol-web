# Foundation Protocol — Update Design (2026-06-16)

Self-contained single-file PWA (`index.html`). All changes are additive edits to that one file; the existing GitHub data-sync engine is untouched. Four user-requested changes.

## 1. GitHub deploy (access + saves to GitHub)

- Project lives at `C:\Users\Eddie Thompson\foundation-protocol-web` (matches README repo name).
- `git init` → commit → `gh repo create foundation-protocol-web --public --source=. --push` (account: Barknard, already authed with `repo` scope).
- Enable GitHub Pages via `gh api` (deploy from `main` / root). Live URL: `https://barknard.github.io/foundation-protocol-web/`.
- **Data-sync token stays manual** — never embed a token in a public repo. The app's PUT-to-Contents-API sync already exists; user pastes a fine-grained PAT in Settings once, then every check-in auto-commits to `data/*.json`.
- Future code updates: edit `index.html`, push, Pages redeploys in ~60s. User data untouched (lives in `data/`).

## 2. Font — global ~20% bump

- Single regex pass multiplying every `font-size: Npx` in the file (CSS classes **and** inline template styles) by 1.2, rounded. Run ONCE on the baseline before adding new CSS (new CSS authored at the bumped scale) to avoid double-scaling.
- Affects the full type scale, buttons, chips, inputs, nav, toasts, library, steps, etc. uniformly so spacing stays balanced.
- `.field input` stays ≥16px (actually 19px) so iOS doesn't zoom on focus.

## 3. Animated illustrations

- **Uniform 2-frame model.** Every exercise becomes a two-pose movement (rest/extended ↔ active). The existing 19 symbols are kept as frame A (`ic-<key>`); one new complementary pose symbol per exercise is authored as frame B (`ic-<key>-2`).
- **Hard consistency rule:** within an exercise, both frames share identical head radius (3.5), torso length, hip anchor, and ground line — only the moving joints change. Otherwise the cross-fade jitters.
- New data field on each exercise: `frames: ['ic-<key>','ic-<key>-2']`. `icon` retained = `frames[0]` for back-compat.
- **`animatedFigure(ex, size)` component:** stacks the two frame SVGs absolutely and cross-fades on a single looping CSS keyframe (hold-rest → move → hold-active → move-back, ~1.8s). Pure CSS, survives re-render. `prefers-reduced-motion` → show frame A only (no animation).
- Used in: Library list rows, exercise-detail hero, and the new Today inline cards.

## 4. Today: tap-to-reveal exercises near the prescription

- **`day()` change:** attach the block key to each block object (`{...BLOCKS[k], key:k}`) so `renderToday` can map a card to its exercises (the key is currently lost).
- **`BLOCK_EX` map:** block key → exercise keys, e.g. `strA → [goblet_sq, pushup, db_row, plank]`, `ptFull → [sl_stance, hip_abd, glute_bridge, band_walk, calf_raise, calf_stretch]`, `walk* → [walk]`, run blocks → `[run]`, `opmAm → [pushup, goblet_sq]`, etc. `rest`/`hooper` → none.
- **Interaction:** each prescription card with exercises gets a chevron and is tappable; tapping toggles an inline panel directly beneath it (pure-DOM `.open` class toggle, no navigation, no full re-render — so the figures keep animating and scroll is preserved). Cards with no exercises (rest, weekly review) have no chevron and don't toggle.
- Each revealed exercise = compact card: animated figure + name + prescription (`rx`) + cue + a "Full steps →" link into the existing `exerciseDetail` screen.

## 5. Testing (always-test rule)

Playwright against the running app: (a) font visibly larger, (b) tapping a Today block reveals its animated exercises inline, (c) figures animate (two distinct poses), (d) Library + exercise detail still render and animate, (e) onboarding → check-in → result flow intact, (f) reduced-motion fallback. Screenshots captured for each. Fix-until-clean loop on any broken pose geometry.

## Out of scope (YAGNI)

No change to the decision engine, no new data fields persisted to GitHub, no AI-image assets (keeps the file self-contained), no in-app text-size control (global bump chosen instead).
