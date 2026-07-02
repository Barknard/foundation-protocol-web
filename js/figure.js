'use strict';
// ============================================================
// PARAMETRIC STICK FIGURE (skeleton + forward kinematics)
// ------------------------------------------------------------
// One skeleton, named joints, connected by construction. Each exercise is a
// POSE = joint angles for 2 frames; FK turns angles → xy so parts never detach.
//
// Coordinate system: SVG viewBox "0 0 50 60", y increases DOWNWARD, figure
// faces +x (right). ANGLE CONVENTION: degrees, measured so that a bone of
// length L from joint J at angle a ends at  J + (L·cos a, L·sin a).
//   a =   0° → points RIGHT (+x)
//   a =  90° → points DOWN  (+y)
//   a = 180° → points LEFT
//   a = 270° (=-90°) → points UP
// So a leg hanging straight down = 90°; torso straight up = 270°.
// ============================================================
const FIG = {
  torso: 17,   // pelvis → shoulder
  neck: 7,     // shoulder → head center
  headR: 3.5,
  thigh: 11, shank: 11, foot: 4,
  uarm: 7, farm: 6,
  ground: 57,
  // ANATOMICAL LIMITS (relative flexion of a child bone vs its parent, in degrees).
  // Knees & elbows are hinges: they fold ONE way only. The renderer clamps every
  // joint into these ranges so no pose (authored OR mid-interpolation) can bend a
  // limb backwards or fold it through itself. + = flexion, − = (slight) hyperextension.
  kneeMin: -6, kneeMax: 160,    // knee: shank vs thigh
  elbowLim: 162,                // elbow: |fore vs upper| (hinge magnitude, either reach)
};
const DEG = Math.PI / 180;
function _pt(j, angDeg, len) { const a = angDeg * DEG; return [j[0] + len * Math.cos(a), j[1] + len * Math.sin(a)]; }
// Normalize a degree delta to (−180, 180].
function _norm180(d) { d = ((d % 360) + 360) % 360; return d > 180 ? d - 360 : d; }
// Clamp a child bone's absolute angle so its flexion relative to the parent stays
// within [lo, hi] (the hinge's natural range). Returns the clamped absolute angle.
function _clampRel(childA, parentA, lo, hi) { const r = _norm180(childA - parentA); return parentA + Math.max(lo, Math.min(hi, r)); }
function _n(v) { return Math.round(v * 100) / 100; }
function _L(p, q, w, stroke) { return `<line x1="${_n(p[0])}" y1="${_n(p[1])}" x2="${_n(q[0])}" y2="${_n(q[1])}"${w ? ` stroke-width="${w}"` : ''}${stroke ? ` stroke="${stroke}"` : ''}/>`; }
function _poly(pts, w, stroke) { const d = pts.map((p, i) => `${i ? 'L' : 'M'} ${_n(p[0])} ${_n(p[1])}`).join(' '); return `<path d="${d}"${w ? ` stroke-width="${w}"` : ''}${stroke ? ` stroke="${stroke}"` : ''}/>`; }

// Resolve a POSE into the xy of every named joint.
// pose: { pelvis:[x,y], torso:deg, head:deg(optional, defaults to torso = straight neck),
//         nearArm:[upperDeg, foreDeg], farArm:[...], nearLeg:[thighDeg,shankDeg,footDeg], farLeg:[...] }
function _resolve(pose) {
  const pelvis = pose.pelvis;
  const shoulder = _pt(pelvis, pose.torso, FIG.torso);
  const headAng = (pose.head == null) ? pose.torso : pose.head;
  const headC = _pt(shoulder, headAng, FIG.neck);
  const arm = (a) => { if (!a) return null; const upperA = a[0]; const foreA = _clampRel(a[1], upperA, -FIG.elbowLim, FIG.elbowLim); const elbow = _pt(shoulder, upperA, FIG.uarm); const hand = _pt(elbow, foreA, FIG.farm); return { elbow, hand }; };
  const leg = (l) => { if (!l) return null; const thighA = l[0]; const shankA = _clampRel(l[1], thighA, FIG.kneeMin, FIG.kneeMax); const knee = _pt(pelvis, thighA, FIG.thigh); const ankle = _pt(knee, shankA, FIG.shank); const toe = _pt(ankle, l[2] == null ? 5 : l[2], FIG.foot); return { knee, ankle, toe }; };
  return {
    pelvis, shoulder, headC,
    nearArm: arm(pose.nearArm), farArm: arm(pose.farArm),
    nearLeg: leg(pose.nearLeg), farLeg: leg(pose.farLeg),
  };
}

// Floor & wall are SOLID: shift the whole figure up so nothing dips below the ground,
// and clamp anything past a declared wall (pose.wallX) back to the wall. Keeps limbs rigid.
function _applyConstraints(J, pose) {
  const ground = pose.ground == null ? FIG.ground : pose.ground;
  const pts = [];
  ['pelvis', 'shoulder', 'headC', 'c', 'shoulderC', 'hipL', 'hipR', 'shL', 'shR'].forEach(k => { if (J[k]) pts.push(J[k]); });
  ['nearArm', 'farArm', 'leftArm', 'rightArm'].forEach(k => { const o = J[k]; if (o) { pts.push(o.elbow, o.hand); } });
  ['nearLeg', 'farLeg', 'leftLeg', 'rightLeg'].forEach(k => { const o = J[k]; if (o) { pts.push(o.knee, o.ankle); if (o.toe) pts.push(o.toe); } });
  // floor: lowest point (incl. head's bottom edge) must sit on/above the ground line
  let maxY = (J.headC ? J.headC[1] + FIG.headR : -Infinity);
  pts.forEach(p => { if (p && p[1] > maxY) maxY = p[1]; });
  const dy = maxY - ground;
  if (dy > 0) pts.forEach(p => { if (p) p[1] -= dy; });
  // wall: nothing crosses to the right of wallX (hands rest on it)
  if (pose.wallX != null) pts.forEach(p => { if (p && p[0] > pose.wallX) p[0] = pose.wallX; });
}

// Render one POSE to inner SVG markup (no <svg> wrapper). opts.feel (0..1) pulses intensity marks.
function figureInner(pose, opts) {
  if (pose.view === 'front') return figureInnerFront(pose, opts);
  const J = _resolve(pose);
  _applyConstraints(J, pose);
  // DEPTH: near limbs are full-weight + solid; far limbs are dimmer AND thinner so the
  // body reads with front/back depth (not a flat cut-out). SW=near, FAR_SW=far.
  const SW = 2.5, FAR_SW = 1.9, DIM = 'var(--paper-dim)';
  const out = [];
  const ground = pose.ground == null ? FIG.ground : pose.ground;
  // ground line first (behind)
  if (pose.ground !== false) out.push(`<line x1="2" y1="${_n(ground)}" x2="48" y2="${_n(ground)}" stroke-width="1.5" stroke="#807868"/>`);
  // props behind the body (wall/bench/band drawn under near limbs); array of prop specs
  if (pose.propsBehind) out.push(renderProps(pose.propsBehind, J));
  // far-side limbs (dim + thinner, for depth) drawn behind torso
  out.push('<g stroke="' + DIM + '" stroke-width="' + FAR_SW + '" stroke-linecap="round" stroke-linejoin="round" fill="none">');
  if (J.farLeg) out.push(_poly([J.pelvis, J.farLeg.knee, J.farLeg.ankle, J.farLeg.toe]));
  if (J.farArm) out.push(_poly([J.shoulder, J.farArm.elbow, J.farArm.hand]));
  out.push('</g>');
  // body group (near, solid)
  out.push('<g stroke="currentColor" stroke-width="' + SW + '" stroke-linecap="round" stroke-linejoin="round" fill="none">');
  out.push(_L(J.pelvis, J.shoulder));                     // torso
  out.push(_L(J.shoulder, _pt(J.shoulder, (pose.head == null ? pose.torso : pose.head), FIG.neck - FIG.headR))); // neck
  if (J.nearLeg) out.push(_poly([J.pelvis, J.nearLeg.knee, J.nearLeg.ankle, J.nearLeg.toe]));
  if (J.nearArm) out.push(_poly([J.shoulder, J.nearArm.elbow, J.nearArm.hand]));
  out.push('</g>');
  // head
  out.push(`<circle cx="${_n(J.headC[0])}" cy="${_n(J.headC[1])}" r="${FIG.headR}" fill="currentColor"/>`);
  // props in front (dumbbell at hand, etc.); array of prop specs
  if (pose.propsFront) out.push(renderProps(pose.propsFront, J));
  // intensity marks (where you should feel it) — pulsing red double-arc at a point
  if (pose.intensity) { const i = typeof pose.intensity === 'function' ? pose.intensity(J) : pose.intensity; out.push(_intensity(i, opts && opts.feel)); }
  let svg = out.join('');
  if (pose.facing === -1) svg = '<g transform="translate(50,0) scale(-1,1)">' + svg + '</g>';   // mirror to face left
  return svg;
}
// red "feel it here" double-arc centered at [x,y], opening dir (deg); feel(0..1) pulses opacity.
function _intensity(spec, feel) {
  const [x, y] = spec.at; const r = spec.r || 3; const d = (spec.dir == null ? 180 : spec.dir) * DEG;
  const nx = Math.cos(d), ny = Math.sin(d);             // offset normal
  const op = (feel == null ? 1 : Math.max(0.2, Math.min(1, feel)));
  const arc = (off) => { const cx = x + nx * off, cy = y + ny * off; return `<path d="M ${_n(cx - ny * r)} ${_n(cy + nx * r)} Q ${_n(cx + nx * r * 1.1)} ${_n(cy + ny * r * 1.1)} ${_n(cx + ny * r)} ${_n(cy - nx * r)}" stroke="#E26B5F" stroke-width="1.8" fill="none" stroke-linecap="round"/>`; };
  return `<g opacity="${_n(op)}">${arc(0) + arc(2.2)}</g>`;
}

// Props ----------------------------------------------------------------
// renderProps(list, J): turn an ARRAY of plain prop specs into SVG markup, dispatching
// each to the existing draw primitives. Anchored props (dumbbell/kettlebell + the front
// goblet/band) resolve their coords from the resolved joints J at render time so they
// still track the hand across f1↔f2; free props (bench/wall/band) use explicit coords.
function renderProps(list, J) { return Array.isArray(list) ? list.map(s => renderProp(s, J)).join('') : ''; }
function renderProp(spec, J) {
  if (!spec || !spec.type) return '';
  switch (spec.type) {
    // side-view free props
    case 'bench': return propBench(spec.x, spec.y, spec.w, spec.h) + (spec.legs ? propBenchLegs(spec.x, spec.y + spec.h, spec.w, spec.legH == null ? 5 : spec.legH) : '');
    case 'wall':  return propWall(spec.x, spec.y1, spec.y2);
    // side-view anchored props (resolve from J)
    case 'dumbbell':   return spec.anchor === 'farHand' ? propDumbbell(J, 'far') : propDumbbell(J, 'near');
    case 'kettlebell': return spec.anchor === 'farHand' ? propKettlebell(J, 'far') : propKettlebell(J, 'near');
    case 'band':       return propBand(J, spec.from, spec.to);
    // front-view props
    case 'goblet':    return propGobletFront(J);
    case 'bandFront': return propBandFront(J);
    default: return '';
  }
}
function propBench(x, y, w, h) { return `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="1.5" fill="#3A3431" stroke="#807868" stroke-width="1"/>`; }
function propBenchLegs(x, y, w, h) { return `<line x1="${x + 2}" y1="${y}" x2="${x + 2}" y2="${y + h}" stroke="#807868" stroke-width="1.5"/><line x1="${x + w - 2}" y1="${y}" x2="${x + w - 2}" y2="${y + h}" stroke="#807868" stroke-width="1.5"/>`; }
function propWall(x, y1, y2) { return `<line x1="${x}" y1="${y1}" x2="${x}" y2="${y2}" stroke-width="2.5" stroke="#807868"/>`; }
function propDumbbell(J, which) { const h = (which === 'near' ? J.nearArm : J.farArm)?.hand; if (!h) return ''; return `<rect x="${_n(h[0] - 3)}" y="${_n(h[1] - 1.6)}" width="6" height="3.2" rx="1" fill="#D9A24E"/>`; }
function propKbAt(h) { if (!h) return ''; const x = _n(h[0]), y = _n(h[1]); return `<path d="M ${x - 1.8} ${y} a 1.8 1.8 0 0 1 3.6 0" fill="none" stroke="#D9A24E" stroke-width="1.1"/><circle cx="${x}" cy="${y + 2.8}" r="2.8" fill="#D9A24E"/>`; }
function propKettlebell(J, which) { return propKbAt((which === 'far' ? J.farArm : J.nearArm)?.hand); }
// Resolve a side-view band endpoint name ('nearKnee'|'farKnee') to its joint xy.
function _bandPt(J, name) { return name === 'farKnee' ? (J.farLeg && J.farLeg.knee) : (J.nearLeg && J.nearLeg.knee); }
function propBand(J, from, to) { const a = _bandPt(J, from == null ? 'nearKnee' : from), b = _bandPt(J, to == null ? 'farKnee' : to); if (!a || !b) return ''; return `<line x1="${_n(a[0])}" y1="${_n(a[1])}" x2="${_n(b[0])}" y2="${_n(b[1])}" stroke="#D9A24E" stroke-width="1.4" stroke-dasharray="2 1.5"/>`; }

// ---- FRONT (head-on) projection — for frontal-plane / symmetric moves (squat, band walk, hop) ----
// Pose uses leftArm/rightArm/leftLeg/rightLeg + hipW/shoulderW instead of near/far.
function _resolveFront(pose) {
  const c = pose.pelvis; const hipW = pose.hipW == null ? 8 : pose.hipW; const shW = pose.shoulderW == null ? 9 : pose.shoulderW;
  const torso = pose.torso == null ? 270 : pose.torso;
  const shoulderC = _pt(c, torso, FIG.torso);
  const headC = _pt(shoulderC, pose.head == null ? torso : pose.head, FIG.neck);
  const hipL = [c[0] - hipW / 2, c[1]], hipR = [c[0] + hipW / 2, c[1]];
  const shL = [shoulderC[0] - shW / 2, shoulderC[1]], shR = [shoulderC[0] + shW / 2, shoulderC[1]];
  const arm = (a, base) => { if (!a) return null; const foreA = _clampRel(a[1], a[0], -FIG.elbowLim, FIG.elbowLim); const e = _pt(base, a[0], FIG.uarm); const h = _pt(e, foreA, FIG.farm); return { elbow: e, hand: h }; };
  // Front view: left & right legs flex in OPPOSITE relative directions (a squat bends the
  // left knee out one way, the right knee out the other), so clamp the knee by MAGNITUDE
  // only (no fold-through) rather than by a single sign — otherwise one leg gets straightened
  // and the foot slides out sideways.
  const leg = (l, base) => { if (!l) return null; const shankA = _clampRel(l[1], l[0], -FIG.kneeMax, FIG.kneeMax); const k = _pt(base, l[0], FIG.thigh); const an = _pt(k, shankA, FIG.shank); return { knee: k, ankle: an }; };
  return { c, shoulderC, headC, hipL, hipR, shL, shR, leftArm: arm(pose.leftArm, shL), rightArm: arm(pose.rightArm, shR), leftLeg: leg(pose.leftLeg, hipL), rightLeg: leg(pose.rightLeg, hipR) };
}
function figureInnerFront(pose, opts) {
  const J = _resolveFront(pose);
  _applyConstraints(J, pose);
  const SW = 2.5; const out = [];
  const ground = pose.ground == null ? FIG.ground : pose.ground;
  if (pose.ground !== false) out.push(`<line x1="2" y1="${_n(ground)}" x2="48" y2="${_n(ground)}" stroke-width="1.5" stroke="#807868"/>`);
  if (pose.propsBehind) out.push(renderProps(pose.propsBehind, J));
  out.push('<g stroke="currentColor" stroke-width="' + SW + '" stroke-linecap="round" stroke-linejoin="round" fill="none">');
  out.push(_L(J.c, J.shoulderC));            // spine
  out.push(_L(J.hipL, J.hipR));              // hip bar
  out.push(_L(J.shL, J.shR));                // shoulder bar
  const footStub = (a, dir) => _L(a, [a[0] + dir * 2.6, a[1]]);
  if (J.leftLeg) { out.push(_poly([J.hipL, J.leftLeg.knee, J.leftLeg.ankle])); out.push(footStub(J.leftLeg.ankle, -1)); }
  if (J.rightLeg) { out.push(_poly([J.hipR, J.rightLeg.knee, J.rightLeg.ankle])); out.push(footStub(J.rightLeg.ankle, 1)); }
  if (J.leftArm) out.push(_poly([J.shL, J.leftArm.elbow, J.leftArm.hand]));
  if (J.rightArm) out.push(_poly([J.shR, J.rightArm.elbow, J.rightArm.hand]));
  out.push('</g>');
  out.push(`<circle cx="${_n(J.headC[0])}" cy="${_n(J.headC[1])}" r="${FIG.headR}" fill="currentColor"/>`);
  if (pose.propsFront) out.push(renderProps(pose.propsFront, J));
  if (pose.intensity) { const i = typeof pose.intensity === 'function' ? pose.intensity(J) : pose.intensity; out.push(_intensity(i, opts && opts.feel)); }
  return out.join('');
}
function propGobletFront(J) {
  const a = J.leftArm && J.leftArm.hand, b = J.rightArm && J.rightArm.hand; if (!a || !b) return '';
  const x = _n((a[0] + b[0]) / 2), y = _n((a[1] + b[1]) / 2);
  // A recognizable vertical dumbbell (two plates + handle), ~2x the old featureless square and outlined so it
  // reads on the dark card — shape carries the meaning, not colour alone (step text: "hold dumbbell vertically").
  const fill = '#E3AC3C', edge = '#8a6a2e';
  return `<g fill="${fill}" stroke="${edge}" stroke-width="0.5" stroke-linejoin="round">`
    + `<rect x="${x - 2.6}" y="${_n(y - 4.6)}" width="5.2" height="2.4" rx="0.7"/>`   // top plate
    + `<rect x="${x - 1.1}" y="${_n(y - 2.4)}" width="2.2" height="4.8" rx="0.5"/>`   // handle
    + `<rect x="${x - 2.6}" y="${_n(y + 2.2)}" width="5.2" height="2.4" rx="0.7"/>`   // bottom plate
    + `</g>`;
}
function propBandFront(J) { if (!J.leftLeg || !J.rightLeg) return ''; const a = J.leftLeg.knee, b = J.rightLeg.knee; return `<line x1="${_n(a[0])}" y1="${_n(a[1])}" x2="${_n(b[0])}" y2="${_n(b[1])}" stroke="#D9A24E" stroke-width="1.4" stroke-dasharray="2 1.5"/>`; }


// ============================================================
// CONTINUOUS ANIMATOR — smoothly interpolate f1 ↔ f2 (ease-loop) and pulse the
// intensity marker. Drives any <svg class="skfig" data-fig="<key>"> on the page.
// One throttled rAF loop scans the DOM; off-screen figures are skipped.
// ============================================================
function _lerp(a, b, t) { return a + (b - a) * t; }
function _lerpAng(a, b, t) { let d = ((b - a + 540) % 360) - 180; return a + d * t; }
function _lerpPair(a, b, t) { return a && b ? a.map((v, i) => _lerpAng(v, b[i], t)) : (a || b); }
function lerpPose(p1, p2, t) {
  return {
    pelvis: [_lerp(p1.pelvis[0], p2.pelvis[0], t), _lerp(p1.pelvis[1], p2.pelvis[1], t)],
    torso: _lerpAng(p1.torso, p2.torso, t),
    head: (p1.head == null && p2.head == null) ? null : _lerpAng(p1.head == null ? p1.torso : p1.head, p2.head == null ? p2.torso : p2.head, t),
    nearArm: _lerpPair(p1.nearArm, p2.nearArm, t), farArm: _lerpPair(p1.farArm, p2.farArm, t),
    nearLeg: _lerpPair(p1.nearLeg, p2.nearLeg, t), farLeg: _lerpPair(p1.farLeg, p2.farLeg, t),
    leftArm: _lerpPair(p1.leftArm, p2.leftArm, t), rightArm: _lerpPair(p1.rightArm, p2.rightArm, t),
    leftLeg: _lerpPair(p1.leftLeg, p2.leftLeg, t), rightLeg: _lerpPair(p1.rightLeg, p2.rightLeg, t),
    // view/widths + props/intensity/ground/facing/wall carried from f1 (static across the rep)
    view: p1.view, hipW: p1.hipW, shoulderW: p1.shoulderW,
    ground: p1.ground, facing: p1.facing, wallX: p1.wallX, propsBehind: p1.propsBehind, propsFront: p1.propsFront, intensity: p1.intensity,
  };
}
let _figLast = 0;
function _figFrame(ts) {
  if (ts - _figLast >= 40) {                 // ~25fps is plenty for stick figures
    _figLast = ts;
    const reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const vh = window.innerHeight || 800;
    const els = document.querySelectorAll('svg.skfig');
    for (const el of els) {
      const def = FIG_POSES[el.dataset.fig]; if (!def) continue;
      const r = el.getBoundingClientRect();
      if (r.bottom < -20 || r.top > vh + 20) continue;     // skip off-screen
      const dur = def.dur || 2400;
      const t = reduce ? 1 : 0.5 - 0.5 * Math.cos((ts % dur) / dur * 2 * Math.PI);  // ease ping-pong
      const feel = reduce ? 1 : 0.35 + 0.65 * (0.5 - 0.5 * Math.cos((ts % 1100) / 1100 * 2 * Math.PI));
      el.innerHTML = figureInner(lerpPose(def.f1, def.f2, t), { feel });
    }
    // procedural walk/run gait figures
    for (const el of document.querySelectorAll('svg.gaitfig')) {
      const r = el.getBoundingClientRect();
      if (r.bottom < -20 || r.top > vh + 20) continue;
      const kind = el.dataset.gait; const carry = el.dataset.carry === '1'; const dur = GAIT_PARAMS[kind === 'run' ? 'run' : 'walk'].dur;
      const p = reduce ? 0.12 : (ts % dur) / dur;
      el.innerHTML = _gaitInner(_gaitPose(kind, p, carry), carry);
    }
  }
  requestAnimationFrame(_figFrame);
}
if (typeof requestAnimationFrame !== 'undefined') requestAnimationFrame(_figFrame);

// Public: an animated skeleton figure for an exercise key (used by animatedFigure).
function skeletonFigure(key, size) {
  const s = size || 44; const def = FIG_POSES[key];
  const inner = def ? figureInner(def.f1, { feel: 1 }) : '';
  // Horizontal floor poses (side-lying, supine) occupy only a thin band of the default 0 0 50 60 box and
  // render as an unreadable smudge at thumbnail scale. A per-pose `frame` viewBox zooms+centres them to fill
  // the box. The animator sets innerHTML only, so the viewBox chosen here persists across the f1↔f2 cycle.
  const vb = (def && def.frame) ? def.frame : '0 0 50 60';
  return `<span class="afig" style="width:${s}px;height:${s}px;display:inline-block;line-height:0;"><svg class="skfig" data-fig="${escAttr(key)}" viewBox="${vb}" width="${s}" height="${s}" aria-hidden="true">${inner}</svg></span>`;
}
function escAttr(s) { return String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])); }
function hasFigurePose(key) { return !!FIG_POSES[key]; }

// ============================================================
// PROCEDURAL WALK / RUN GAIT — continuous joint-angle cycle (research wu9fztkf0).
// Legs 180° out of phase; arms antiphase to the same-side leg; pelvis bobs at 2×;
// run adds forward lean + body hop. Lowest foot is planted on the floor each frame
// (fixes the floating-figure defect).
// ============================================================
function _gaitPose(kind, p, carry) {
  const run = kind === 'run'; const TAU = Math.PI * 2;
  const G = GAIT_PARAMS[run ? 'run' : 'walk'];
  const torsoA = 270 + G.torsoLean;                         // up + forward lean
  const hip = [G.hipX, G.hipY];                             // final y set by contact-shift (natural bob)
  const shoulder = _pt(hip, torsoA, FIG.torso);
  const head = _pt(shoulder, torsoA, FIG.neck);
  // ph=0 at foot-contact (leg forward); stance ph 0→0.5 (foot travels back), swing 0.5→1 (knee lifts).
  const leg = (ph) => {
    const hipFlex = G.hipFlex * Math.cos(TAU * ph);         // + forward at contact, − at toe-off
    const thighA = 90 - hipFlex;
    const swing = Math.max(0, Math.sin(TAU * (ph - 0.5)));  // 0 in stance, peaks mid-swing (ph 0.75)
    // LANDING: at this leg's foot-strike (ph≈0/1) the stance knee gives to absorb the
    // impact, so the body visibly dips & rebounds each step (run absorbs harder).
    const stance = Math.max(0, Math.cos(TAU * ph));         // 1 at foot-strike, 0 by mid-cycle
    const land = G.kneeLand * Math.pow(stance, 1.6);
    const kneeBend = G.kneeBase + G.kneeSwing * Math.pow(swing, 1.1) + land;
    const shankA = thighA + kneeBend;                       // shank folds BACK (correct flexion)
    const knee = _pt(hip, thighA, FIG.thigh);
    const ankle = _pt(knee, shankA, FIG.shank);
    const toe = _pt(ankle, shankA + G.footAngle, FIG.foot);
    return { knee, ankle, toe };
  };
  const arm = (ph) => {
    const upperA = 90 - G.armSwing * Math.cos(TAU * ph);    // opposite to its (antiphase) leg
    const elbow = _pt(shoulder, upperA, FIG.uarm);
    const hand = _pt(elbow, upperA - G.armBend, FIG.farm);
    return { elbow, hand };
  };
  const Lleg = leg(p), Rleg = leg((p + 0.5) % 1);
  // Carry (farmer carry): arms hang at the sides holding a weight — no swing; a slight
  // forward/back splay so the near & far hand (and their kettlebells) read separately.
  let Larm, Rarm;
  if (carry) {
    const C = GAIT_PARAMS.carry;
    const hang = (upperA, foreA) => { const elbow = _pt(shoulder, upperA, FIG.uarm); return { elbow, hand: _pt(elbow, foreA, FIG.farm) }; };
    Larm = hang(C.nearHand[0], C.nearHand[1]);    // near hand (slightly forward)
    Rarm = hang(C.farHand[0], C.farHand[1]);      // far hand (slightly back)
  } else {
    Larm = arm((p + 0.5) % 1); Rarm = arm(p);               // arm opposes same-side leg
  }
  // plant the lowest foot on the floor (no floating)
  const feet = [Lleg.ankle, Lleg.toe, Rleg.ankle, Rleg.toe];
  let maxY = -1e9; feet.forEach(q => { if (q[1] > maxY) maxY = q[1]; });
  const dy = maxY - FIG.ground;
  [hip, shoulder, head, Lleg.knee, Lleg.ankle, Lleg.toe, Rleg.knee, Rleg.ankle, Rleg.toe, Larm.elbow, Larm.hand, Rarm.elbow, Rarm.hand].forEach(q => { q[1] -= dy; });
  return { hip, shoulder, head, Lleg, Rleg, Larm, Rarm };
}
function _gaitInner(J, carry) {
  const SW = 2.5, FAR_SW = 1.9, DIM = 'var(--paper-dim)';
  let out = `<line x1="2" y1="${FIG.ground}" x2="48" y2="${FIG.ground}" stroke-width="1.5" stroke="#807868"/>`;
  out += `<g stroke="${DIM}" stroke-width="${FAR_SW}" stroke-linecap="round" stroke-linejoin="round" fill="none">`;
  out += _poly([J.hip, J.Rleg.knee, J.Rleg.ankle, J.Rleg.toe]) + _poly([J.shoulder, J.Rarm.elbow, J.Rarm.hand]);
  out += '</g>';
  out += `<g stroke="currentColor" stroke-width="${SW}" stroke-linecap="round" stroke-linejoin="round" fill="none">`;
  out += _L(J.hip, J.shoulder) + _poly([J.hip, J.Lleg.knee, J.Lleg.ankle, J.Lleg.toe]) + _poly([J.shoulder, J.Larm.elbow, J.Larm.hand]);
  out += '</g>';
  out += `<circle cx="${_n(J.head[0])}" cy="${_n(J.head[1])}" r="${FIG.headR}" fill="currentColor"/>`;
  if (carry) out += propKbAt(J.Rarm.hand) + propKbAt(J.Larm.hand);   // a kettlebell in each hand (far then near)
  return out;
}
function gaitFigure(kind, size, carry) { const s = size || 44; return `<span class="afig" style="width:${s}px;height:${s}px;display:inline-block;line-height:0;"><svg class="gaitfig" data-gait="${kind}"${carry ? ' data-carry="1"' : ''} viewBox="0 0 50 60" width="${s}" height="${s}" aria-hidden="true">${_gaitInner(_gaitPose(kind, 0, carry), carry)}</svg></span>`; }

// ============================================================
// HOW TO ADD AN EXERCISE
// ------------------------------------------------------------
// Add a key to FIG_POSES with two frames (f1 = start, f2 = end of the rep):
//   <key>: { dur?: ms, f1: POSE, f2: POSE }
// POSE fields (all angles in DEGREES; down=90, right=0, up=270, left=180):
//   pelvis:[x,y]   root, in the 0..50 / 0..60 viewBox.
//   torso          absolute angle of pelvis→shoulder (270 = upright; 142 ≈ lying, head left).
//   head           optional absolute angle of the neck→head (defaults to torso = straight neck).
//   nearArm/farArm [upperArmDeg, foreArmDeg]   near = solid (facing side), far = dim (depth).
//   nearLeg/farLeg [thighDeg, shankDeg, footDeg]
//   facing:-1      mirror the whole figure to face LEFT (default faces right).
//   ground         floor y (default 57). FLOOR & WALL ARE SOLID — the renderer shifts the
//                  figure up so nothing dips below `ground`.
//   wallX          a vertical wall x; nothing crosses to its right (hands rest on it).
//   propsBehind    ARRAY of prop specs drawn behind the body — e.g. {type:'wall',x,y1,y2},
//                  {type:'bench',x,y,w,h,legs:true}, {type:'bandFront'}.
//   propsFront     ARRAY of prop specs drawn in front — e.g. {type:'dumbbell',anchor:'nearHand'},
//                  {type:'kettlebell',anchor:'nearHand'}, {type:'goblet'} (anchored specs
//                  resolve to a hand at render time). renderProp() dispatches to the primitives.
//   intensity      {at:[x,y], dir:deg, r} or fn(J) → a pulsing red "feel it here" marker.
//
// THE 6 DIRECTIONS (how depth is modelled in a 2D figure):
//   up/down/left/right  → the in-plane angle (down=90, right=0, up=270, left=180).
//   forward/backward    → DEPTH (toward/away from the viewer):
//       • side view  — `near*` limbs = the side facing you (solid, full stroke);
//                       `far*` limbs = the far side (dim + thinner). `facing:-1`
//                       turns the whole body around (forward vs backward).
//       • front view — `view:'front'` with left*/right* limbs in the frontal plane.
//   Pick the view whose plane shows the movement (squat/press depth → side;
//   lateral/abduction/symmetric → front).
// Joint reality (ENFORCED — the renderer clamps every joint, so a bad angle can't
//   bend a limb the wrong way even mid-interpolation):
//       knee  — shank folds toward the hamstring only: flexion ∈ [kneeMin, kneeMax].
//       elbow — hinge magnitude ≤ elbowLim (no fold-through).
//   Still author angles that respect this — the clamp is a safety net, not a crutch.
// The animator smoothly eases f1↔f2 and pulses the intensity automatically.
// ============================================================
// POSE REGISTRY (FIG_POSES) + GAIT_PARAMS now live as pure data in js/figure-poses.js
// (loaded BEFORE this file — see index.html). They are referenced here as globals.

