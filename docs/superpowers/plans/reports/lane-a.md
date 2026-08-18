# Lane A report — js/foot.js module + wiring

Owner: Lane A. Files owned: `js/foot.js` (create), `index.html`, `sw.js`, `js/config.js`.

## Log

- Read plan (`docs/superpowers/plans/2026-08-17-foot-pain-rehab.md`), design spec (`docs/superpowers/specs/2026-08-17-foot-pain-rehab-design.md` §3, §6.3, §7, §8), `AI-START-HERE.md` §4, `docs/EVIDENCE-FOOT.md`, and the existing patterns to match: `js/figure.js` header + prop style, `js/program.js` header/table style, `js/screens.js` `bodyMap()`/`fitBodyMap()` (screens.js:353-398), `css/base.css` tokens, `css/figures.css` `.afig`/`.skfig` conventions, `js/util.js` `escHtml`/`animatedFigure`.
- Starting implementation of `js/foot.js` against the pinned contract (names/signatures are law, not improvised).
- Wrote `js/foot.js` in full: `FOOT_ZONES`, `footKind`, `FOOT_WINDOWS`/`footWindow`, `footRehabKind`,
  `FOOT_GATES`/`footGatePassed` (gate question copy verbatim from the plan), `REHAB_TAIL_DAYS` (comment
  kept verbatim — the extrapolated-band caveat), `FOOT_CONDITION_NAMES`, `FOOT_GUIDES`/`footGuideFor`
  (four guides — toes/top/neuroma/redflag — all four content requirements from the plan bullet covered,
  every card ends with the mandated "Not improving after two weeks of sensible care? See a clinician."
  line), `footMapSvg(selZone)` (side-profile right-foot close-up, viewBox 0 0 100 152 matching bodyMap's
  scale so `fitBodyMap()` sizing carries over unchanged; 5 non-overlapping zones — toes/ball/arch/heel
  stacked as a vertical column with toes rotated to point up the tall viewBox, `top` as a side band
  representing the dorsum; `.bm-seg`-compatible classes so existing screens.css hover/sel/focus styling
  applies with zero new CSS for the base look; data-zone/role=button/tabindex=0/aria-pressed exactly
  mirroring `bodyMap()`'s `a(part)` pattern), `footCloseupFigure(key,size)` (two hand-authored 2-frame
  pairs, `pf_stretch` and `foot_intrinsic`, each frame a complete `<g class="f1">`/`<g class="f2">` —
  currentColor body linework matching `.afig{color:var(--paper)}`, `var(--paper-dim)` for the far leg
  matching figure.js's DIM constant, literal `#807868` ground matching figure.js's ground line exactly,
  `var(--strength)` accent tracing the tensioned/domed arch band).
- `node --check js/foot.js` — pass.
- Self-refine pass: found 3 curly/smart apostrophes (’) in FOOT_GUIDES copy that slipped in during
  authoring — codebase convention (screens.js) is straight ASCII apostrophes throughout. Fixed all 3 via
  Edit (never a PowerShell round-trip). Re-checked: `node --check` still passes, grep for
  `[’‘“”]` in js/foot.js now returns no matches.
- Wired the four owned files:
  - `index.html`: added `<script src="js/foot.js"></script>` between `figure.js` and `engine.js`.
    Verified final order matches the required
    `sprite,config,state,program,figure,foot,engine,storage,util,ui,screens,init`.
  - `sw.js`: `CACHE` → `'thp-shell-v2.3.0'`; `SHELL` array gained `'./js/foot.js'` right after
    `figure.js`.
  - `js/config.js`: `APP_VERSION` → `'2.3.0'`.
- Final verification (all green): `node --check js/foot.js`; index.html script order grep; sw.js SHELL
  contains foot.js; `grep CACHE sw.js` = `thp-shell-v2.3.0`; `grep APP_VERSION js/config.js` = `2.3.0`
  (lockstep, as required).

## Status: DONE. No dead ends. No deviations from the pinned contract (names/signatures match exactly).

Open concern for the overseer (not mine to fix — outside Lane A's owned files): the design spec §7.3
calls for a new routing branch in `animatedFigure` (`js/util.js`): "gait → skeleton pose → foot
close-up → legacy", i.e. something must call `footCloseupFigure(ex.key, size)` from `util.js` for the
Library/result screens to actually render `pf_stretch`/`foot_intrinsic` art. `util.js` is not listed as
an owned file under Task A-E in the plan (Task C owns screens.js/css only; Task D owns
figure.js/figure-poses.js only). Flagging so Task F (or whichever lane is closest) wires that one call
site — `js/foot.js` itself deliberately does not touch `util.js` (out of Lane A's file scope, and
`footCloseupFigure` is a pure builder per the pinned contract's "consumes nothing new").

