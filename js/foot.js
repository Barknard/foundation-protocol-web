'use strict';
// ============================================================
// FOOT DOMAIN — zones, routing, windows, gates, guidance, close-up figures
// ------------------------------------------------------------
// Contract-bounded module (decentralized-function law): everything a foot-pain check-in,
// the engine's rehab swap-in, and the result/library screens need about "where on the
// foot" lives here. Pure data + pure functions + markup BUILDERS (return SVG/HTML strings;
// no DOM writes, same pattern as figure.js) — no state mutation, no rendering.
// Load order: … program → figure → foot → engine → … (engine reads the helpers below).
// Spec: docs/superpowers/specs/2026-08-17-foot-pain-rehab-design.md §3, §6.3, §7, §8.
// Evidence: docs/EVIDENCE-FOOT.md. Names/signatures below are PINNED (plan's contract
// block) — do not rename or reshape; downstream lanes (engine/screens/sims) build against
// these exact identifiers.
// ============================================================

// ---------- zones + routing ----------
const FOOT_ZONES = ['heel', 'arch', 'ball', 'toes', 'top'];

// zone + ball-neural answer + red-flag screener -> injury kind. Any redFlag wins; a ball-zone
// neural-yes is itself routed as a referral (Morton's-neuroma pattern isn't self-manageable —
// EVIDENCE-FOOT.md §3d). heel/arch share the plantar-fasciitis protocol (the fascia runs
// heel-to-arch, so arch pain without medial-ankle features is treated the same — §1).
function footKind(zone, neural, redFlag) {
  if (redFlag) return 'foot-refer';
  if (zone === 'ball') return neural ? 'foot-refer' : 'foot-meta';
  if (zone === 'heel' || zone === 'arch') return 'foot-pf';
  return zone === 'toes' ? 'foot-toes' : 'foot-top';
}

// per-kind windows in DAYS; anything not listed (incl. 'acute', non-foot) -> {rice:3, ease:10}
// (byte-identical to today's generic injury windows — §3.3/§5.1 of the design spec).
// foot-pf ease ceiling 84d (12wk Rathleff block; evidence §6a: 3-6mo typical, this is a backstop).
// foot-meta ease ceiling 42d (6wk; evidence §6b, thinner evidence base, softer confidence).
const FOOT_WINDOWS = { 'foot-pf': { rice: 3, ease: 84 }, 'foot-meta': { rice: 3, ease: 42 } };
function footWindow(kind) { return FOOT_WINDOWS[kind] || { rice: 3, ease: 10 }; }

// kinds whose plan swaps in a rehab block (currentDayPlan's swap-in reads this, §5.3)
function footRehabKind(kind) { return kind === 'foot-pf' || kind === 'foot-meta'; }

// ---------- recovery gate (§3.5, §5.2) ----------
// recovery-gate definitions; answers object uses these keys. Question copy ships verbatim.
const FOOT_GATES = {
  'foot-pf': [
    { key: 'walk', q: 'Pain-free during normal daily walking?' },
    { key: 'morning', q: 'Morning first-step pain gone, or barely there?' },
    { key: 'raises', q: '20 single-leg heel raises without the pain flaring?' },
  ],
  'foot-meta': [
    { key: 'walk', q: 'Pain-free during normal daily walking?' },
    { key: 'morning', q: 'No ache under the ball of the foot on normal days?' },
    { key: 'raises', q: 'Your foot-core set done without the pain flaring?' },
  ],
};
function footGatePassed(kind, answers) {
  const gate = FOOT_GATES[kind]; if (!gate) return true;
  return gate.every(g => answers && answers[g.key] === true);
}

// relapse-prevention tail length (§5.4). 28-42d band per evidence §6c — that section is
// explicitly flagged EXTRAPOLATED there (no dedicated relapse-duration RCT for either
// condition exists); any copy that surfaces this number must say so, not present it as proven.
const REHAB_TAIL_DAYS = 35;   // 28–42d band, evidence §6c (extrapolated — copy must say so)

// plain-language condition names for banners/standingCall (§3.4) — never the raw zone/kind string.
const FOOT_CONDITION_NAMES = {
  'foot-pf': 'plantar heel pain', 'foot-meta': 'ball-of-foot overload',
  'foot-refer': 'foot pain — clinician', 'foot-toes': 'toe pain', 'foot-top': 'top-of-foot pain',
};

// ---------- guidance cards (§3.2, §6.3) ----------
// Zones/kinds where the evidence doesn't support a home exercise protocol get an honest
// triage card instead of an invented program (EVIDENCE-FOOT.md §1: "route ALL toe-zone taps
// to see-a-clinician rather than attempting a self-management protocol"). Shape is pinned:
// {title, what, doNow:[...], seeSomeone:[...], cite}. Every card ends with the same
// not-improving catch-all so the closing behavior reads consistently across all four.
const FOOT_GUIDES = {
  toes: {
    title: "Toe pain isn't a load problem.",
    what: 'Toe pain usually comes from one of a few different patterns, and none of them is "overuse that responds to exercise" — so it needs the right eyes on it, not a home program.',
    doNow: [
      'Sudden hot, red, swollen joint (especially overnight, especially the big toe): get seen promptly — this pattern (gout-like) needs medication, not exercise.',
      'Gradual bump or stiffness at the big-toe joint: switch to footwear with a wide toe box now; a clinician can plan long-term care (bunion / stiff big toe pattern).',
      "A toe that got bent back and injured: protect it and get it checked — pushing through risks a joint that never quite works again.",
    ],
    seeSomeone: [
      "None of these respond to a home exercise program — that's why we're not giving you one.",
      'Not improving after two weeks of sensible care? See a clinician.',
    ],
    cite: 'Clinical consensus — gout, hallux valgus/rigidus, turf toe (EVIDENCE-FOOT.md §1)',
  },
  top: {
    title: 'Top-of-foot pain — usually pressure, sometimes bone.',
    what: 'Most top-of-foot pain is footwear pressing on the tendons that cross the top of the foot — irritating, not dangerous. That said, the exercise evidence for this specific spot is thin; treat this as a reasonable first try, not a guaranteed fix.',
    doNow: [
      'Relace your shoe, or skip an eyelet, over the sore spot.',
      'Switch to a softer tongue if you have one.',
      'Relative rest from impact while it settles.',
    ],
    seeSomeone: [
      "One pinpoint sore spot on a bone, pain at rest or at night, or a recent jump in training — stop and see a clinician. A navicular stress fracture hides from early X-rays and punishes people who train through it.",
      'Not improving after two weeks of sensible care? See a clinician.',
    ],
    cite: 'Clinical consensus — extensor tendinitis, navicular stress fracture (EVIDENCE-FOOT.md §1, §5)',
  },
  neuroma: {
    title: 'That burning between the toes needs an exam.',
    what: "Burning, numbness, tingling, or a pebble-in-sock feeling between two toes points to a nerve (a neuroma), not a muscle or joint overload problem — that's why this isn't getting a stretch-and-strengthen program. Self-care isn't wrong here because it's lazy; it targets the wrong tissue.",
    doNow: [
      "Tell the clinician exactly which two toes it's between, when it burns (walking, tight shoes, barefoot), and whether it feels like a pebble or a bunched-up sock even with the shoe off.",
      "Roomier, lower-heeled shoes can ease it in the meantime — that's comfort, not treatment.",
    ],
    seeSomeone: [
      'This is a professional-exam condition. Conservative care exists — padding, footwear changes, sometimes an injection — but a clinician needs to confirm what it is first.',
      'Not improving after two weeks of sensible care? See a clinician.',
    ],
    cite: "Mulder's-sign clinical consensus — Morton's neuroma (EVIDENCE-FOOT.md §3d)",
  },
  redflag: {
    title: "This one's not for self-management.",
    what: "One of your answers points to something outside a home exercise program's lane. Any one of these needs a clinician's eyes, not a training plan.",
    doNow: [
      "Stay off it as much as normal life allows until it's checked.",
      "Note when it started, what you were doing, and whether it's getting worse — that history helps the clinician.",
    ],
    seeSomeone: [
      'Pinpoint bone tenderness, pain at rest or at night, or a recent training spike: possible stress fracture — get imaging.',
      "A sudden pop with immediate loss of function, or can't bear weight: possible fracture or rupture — same-day care.",
      'Red-hot or swollen, or fever alongside the pain: possible infection or gout — same-day care.',
      'Not improving after two weeks of sensible care? See a clinician.',
    ],
    cite: 'Red-flag screening consensus — stress fracture, acute injury, systemic signs (EVIDENCE-FOOT.md §5)',
  },
};
// guidance cards; footGuideFor returns null for protocol kinds (foot-pf/foot-meta get the
// exercise protocol on the result screen instead, built from BLOCK_EX — not this table).
function footGuideFor(kind, neural) {
  if (kind === 'foot-toes') return FOOT_GUIDES.toes;
  if (kind === 'foot-top') return FOOT_GUIDES.top;
  if (kind === 'foot-refer') return neural ? FOOT_GUIDES.neuroma : FOOT_GUIDES.redflag;
  return null;
}

// ---------- markup builders (return SVG/HTML strings; no DOM writes) ----------

// Tappable side-profile right-foot close-up (§7.1). Same bodyMap conventions as
// screens.js:353-378 (`bodyMap()`): data-* button attrs, role=button, tabindex=0,
// aria-pressed, `.bm-seg` classes so existing screens.css hover/sel/focus styling applies
// with no new CSS required for the base look (Lane C only needs `.footmap` sizing rules).
// Same viewBox scale (100x152) as bodyMap so fitBodyMap()'s height-based sizing produces
// the same >=48px effective targets. Single-select (selZone is one string, not an array —
// the drill-down refines ONE location per check-in, §3.1).
// Layout: a vertical toe->ball->arch->heel column (foot rotated so toes point up, using the
// tall viewBox efficiently) plus a "top of foot" (dorsum) band alongside it. Five zones,
// no overlaps: toes y8-32, ball y34-60, arch y62-86, heel y86-134 (circle), top y30-94/x70-90.
function footMapSvg(selZone) {
  const a = (zone) => `data-zone="${escHtml(zone)}" role="button" tabindex="0" aria-label="${escHtml(zone)}" aria-pressed="${selZone === zone ? 'true' : 'false'}"`;
  const on = (zone) => selZone === zone ? ' sel' : '';
  const seg = (zone, x, y, w, h, rx) => `<rect class="bm-seg${on(zone)}" ${a(zone)} x="${x}" y="${y}" width="${w}" height="${h}" rx="${rx == null ? 8 : rx}"/>`;
  const segC = (zone, cx, cy, r) => `<circle class="bm-seg${on(zone)}" ${a(zone)} cx="${cx}" cy="${cy}" r="${r}"/>`;
  return `<svg viewBox="0 0 100 152" class="bodymap footmap" role="group" aria-label="Foot map — tap where it hurts.">
    ${seg('toes', 22, 8, 40, 24, 12)}
    ${seg('ball', 18, 34, 48, 26, 12)}
    ${seg('arch', 26, 62, 32, 24, 12)}
    ${segC('heel', 42, 110, 24)}
    ${seg('top', 70, 30, 20, 64, 10)}
  </svg>`;
}

// Hand-authored 2-frame close-up pairs (§7.3) for the two exercises whose visible TOES the
// parametric skeleton (figure.js) can't draw. Same warm-palette vars as the skeleton figures:
// currentColor (inherits `.afig { color: var(--paper); }`, figures.css) for the body/limb
// linework, var(--paper-dim) for the far/background leg (matches figure.js's DIM constant),
// '#807868' for the ground line (matches figure.js's literal ground color exactly, so the
// two figure styles sit together in the Library without a visual seam), and var(--strength)
// for the engaged-tissue accent (the tensioned/domed arch band) — the same "red = the
// loaded structure" convention figure.js uses for its intensity marker.
// <g class="f1">/<g class="f2"> are two COMPLETE frames (not FK-interpolated) — Lane C
// cross-fades them with a CSS opacity keyframe; no rAF hook needed, nothing here animates.
const FOOT_CLOSEUPS = {
  // Seated plantar-fascia stretch (DiGiovanni protocol, EVIDENCE-FOOT.md §2c): f1 toes
  // neutral, f2 toes pulled back toward the shin with the tensioned arch band shown.
  pf_stretch: {
    f1: `<line x1="4" y1="52" x2="46" y2="52" stroke-width="1.5" stroke="#807868"/>
      <circle cx="19" cy="9" r="3.4" fill="currentColor"/>
      <path d="M19 12.4 L16 29" stroke-width="2.4" fill="none" stroke-linecap="round" stroke="currentColor"/>
      <path d="M16 29 L9 37 L8 50" stroke-width="1.7" fill="none" stroke-linecap="round" stroke-linejoin="round" stroke="var(--paper-dim)"/>
      <path d="M16 29 L23 33 L30 31" stroke-width="2.4" fill="none" stroke-linecap="round" stroke-linejoin="round" stroke="currentColor"/>
      <path d="M30 31 L41 32" stroke-width="2.2" fill="none" stroke-linecap="round" stroke="currentColor"/>
      <path d="M41 32 L44 31 M41 32 L44.5 32.6 M41 32 L43.5 34.2" stroke-width="1.3" fill="none" stroke-linecap="round" stroke="currentColor"/>
      <path d="M19 12.4 L25 19 L39 31" stroke-width="2.1" fill="none" stroke-linecap="round" stroke-linejoin="round" stroke="currentColor"/>`,
    f2: `<line x1="4" y1="52" x2="46" y2="52" stroke-width="1.5" stroke="#807868"/>
      <circle cx="19" cy="9" r="3.4" fill="currentColor"/>
      <path d="M19 12.4 L16 29" stroke-width="2.4" fill="none" stroke-linecap="round" stroke="currentColor"/>
      <path d="M16 29 L9 37 L8 50" stroke-width="1.7" fill="none" stroke-linecap="round" stroke-linejoin="round" stroke="var(--paper-dim)"/>
      <path d="M16 29 L23 33 L30 31" stroke-width="2.4" fill="none" stroke-linecap="round" stroke-linejoin="round" stroke="currentColor"/>
      <path d="M30 31 L36 24" stroke-width="2.2" fill="none" stroke-linecap="round" stroke="currentColor"/>
      <path d="M36 24 L38 21 M36 24 L36 20.5 M36 24 L34 21" stroke-width="1.3" fill="none" stroke-linecap="round" stroke="currentColor"/>
      <path d="M30 32 Q33.5 31.5 35.5 27" stroke-width="1.7" fill="none" stroke-linecap="round" stroke="var(--strength)"/>
      <path d="M19 12.4 L26 18 L35 23" stroke-width="2.1" fill="none" stroke-linecap="round" stroke-linejoin="round" stroke="currentColor"/>`,
  },
  // Bare foot on the ground (short-foot hold + towel curls, EVIDENCE-FOOT.md §3a): f1 flat,
  // f2 arch domed + toes curling/pressing, with the domed arch traced in the accent color.
  foot_intrinsic: {
    f1: `<line x1="4" y1="52" x2="46" y2="52" stroke-width="1.5" stroke="#807868"/>
      <path d="M22 14 L23 38" stroke-width="2.4" fill="none" stroke-linecap="round" stroke="currentColor"/>
      <path d="M23 38 L18 47 L16 50" stroke-width="2.2" fill="none" stroke-linecap="round" stroke-linejoin="round" stroke="currentColor"/>
      <path d="M16 50 Q22 51 27 49 T37 47 L45 47" stroke-width="2.2" fill="none" stroke-linecap="round" stroke-linejoin="round" stroke="currentColor"/>
      <path d="M45 47 L48 46 M45 47 L48.2 47.6 M45 47 L47.6 49.2" stroke-width="1.3" fill="none" stroke-linecap="round" stroke="currentColor"/>`,
    f2: `<line x1="4" y1="52" x2="46" y2="52" stroke-width="1.5" stroke="#807868"/>
      <path d="M22 14 L23 38" stroke-width="2.4" fill="none" stroke-linecap="round" stroke="currentColor"/>
      <path d="M23 38 L18 47 L16 50" stroke-width="2.2" fill="none" stroke-linecap="round" stroke-linejoin="round" stroke="currentColor"/>
      <path d="M16 50 Q22 45 27 43 T37 45 Q41 46 45 47" stroke-width="2.2" fill="none" stroke-linecap="round" stroke-linejoin="round" stroke="currentColor"/>
      <path d="M16 50 Q22 45 27 43 T37 45" stroke-width="1.6" fill="none" stroke-linecap="round" stroke="var(--strength)"/>
      <path d="M45 47 L47.5 49 M45 47 L48 48.4 M45 47 L47.3 50.2" stroke-width="1.3" fill="none" stroke-linecap="round" stroke="currentColor"/>`,
  },
};
// 'pf_stretch' | 'foot_intrinsic' -> 2-frame figure markup; null otherwise (the routing
// branch that consumes this — gait -> skeleton pose -> foot close-up -> legacy, §7.3 — is
// wired where `animatedFigure` lives; this builder only returns markup, never touches the DOM).
function footCloseupFigure(key, size) {
  const pair = FOOT_CLOSEUPS[key];
  if (!pair) return null;
  const s = size || 44;
  return `<span class="afig footfig" style="width:${s}px;height:${s}px;display:inline-block;line-height:0;"><svg class="footfig-svg" data-footfig="${escHtml(key)}" viewBox="0 0 50 60" width="${s}" height="${s}" aria-hidden="true"><g class="f1">${pair.f1}</g><g class="f2">${pair.f2}</g></svg></span>`;
}
