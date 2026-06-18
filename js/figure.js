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
};
const DEG = Math.PI / 180;
function _pt(j, angDeg, len) { const a = angDeg * DEG; return [j[0] + len * Math.cos(a), j[1] + len * Math.sin(a)]; }
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
  const arm = (a) => { if (!a) return null; const elbow = _pt(shoulder, a[0], FIG.uarm); const hand = _pt(elbow, a[1], FIG.farm); return { elbow, hand }; };
  const leg = (l) => { if (!l) return null; const knee = _pt(pelvis, l[0], FIG.thigh); const ankle = _pt(knee, l[1], FIG.shank); const toe = _pt(ankle, l[2] == null ? 5 : l[2], FIG.foot); return { knee, ankle, toe }; };
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
  const SW = 2.5, DIM = 'var(--paper-dim)';
  const out = [];
  const ground = pose.ground == null ? FIG.ground : pose.ground;
  // ground line first (behind)
  if (pose.ground !== false) out.push(`<line x1="2" y1="${_n(ground)}" x2="48" y2="${_n(ground)}" stroke-width="1.5" stroke="#807868"/>`);
  // props behind the body (wall/bench/band drawn under near limbs); may be a fn of the joints
  if (pose.propsBehind) out.push(typeof pose.propsBehind === 'function' ? pose.propsBehind(J) : pose.propsBehind);
  // far-side limbs (dim, for depth) drawn behind torso
  out.push('<g stroke="' + DIM + '" stroke-width="' + SW + '" stroke-linecap="round" stroke-linejoin="round" fill="none">');
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
  // props in front (dumbbell at hand, etc.)
  if (pose.propsFront) out.push(typeof pose.propsFront === 'function' ? pose.propsFront(J) : pose.propsFront);
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
function propBench(x, y, w, h) { return `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="1.5" fill="#3A3431" stroke="#807868" stroke-width="1"/>`; }
function propBenchLegs(x, y, w, h) { return `<line x1="${x + 2}" y1="${y}" x2="${x + 2}" y2="${y + h}" stroke="#807868" stroke-width="1.5"/><line x1="${x + w - 2}" y1="${y}" x2="${x + w - 2}" y2="${y + h}" stroke="#807868" stroke-width="1.5"/>`; }
function propWall(x, y1, y2) { return `<line x1="${x}" y1="${y1}" x2="${x}" y2="${y2}" stroke-width="2.5" stroke="#807868"/>`; }
function propDumbbell(J, which) { const h = (which === 'near' ? J.nearArm : J.farArm)?.hand; if (!h) return ''; return `<rect x="${_n(h[0] - 3)}" y="${_n(h[1] - 1.6)}" width="6" height="3.2" rx="1" fill="#D9A24E"/>`; }
function propKbAt(h) { if (!h) return ''; const x = _n(h[0]), y = _n(h[1]); return `<path d="M ${x - 1.8} ${y} a 1.8 1.8 0 0 1 3.6 0" fill="none" stroke="#D9A24E" stroke-width="1.1"/><circle cx="${x}" cy="${y + 2.8}" r="2.8" fill="#D9A24E"/>`; }
function propKettlebell(J, which) { return propKbAt((which === 'far' ? J.farArm : J.nearArm)?.hand); }
function propBand(J) { if (!J.nearLeg || !J.farLeg) return ''; const a = J.nearLeg.knee, b = J.farLeg.knee; return `<line x1="${_n(a[0])}" y1="${_n(a[1])}" x2="${_n(b[0])}" y2="${_n(b[1])}" stroke="#D9A24E" stroke-width="1.4" stroke-dasharray="2 1.5"/>`; }
// point a fraction f along segment a→b (for placing intensity marks on a muscle)
function _along(a, b, f) { return [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f]; }

// ---- FRONT (head-on) projection — for frontal-plane / symmetric moves (squat, band walk, hop) ----
// Pose uses leftArm/rightArm/leftLeg/rightLeg + hipW/shoulderW instead of near/far.
function _resolveFront(pose) {
  const c = pose.pelvis; const hipW = pose.hipW == null ? 8 : pose.hipW; const shW = pose.shoulderW == null ? 9 : pose.shoulderW;
  const torso = pose.torso == null ? 270 : pose.torso;
  const shoulderC = _pt(c, torso, FIG.torso);
  const headC = _pt(shoulderC, pose.head == null ? torso : pose.head, FIG.neck);
  const hipL = [c[0] - hipW / 2, c[1]], hipR = [c[0] + hipW / 2, c[1]];
  const shL = [shoulderC[0] - shW / 2, shoulderC[1]], shR = [shoulderC[0] + shW / 2, shoulderC[1]];
  const arm = (a, base) => { if (!a) return null; const e = _pt(base, a[0], FIG.uarm); const h = _pt(e, a[1], FIG.farm); return { elbow: e, hand: h }; };
  const leg = (l, base) => { if (!l) return null; const k = _pt(base, l[0], FIG.thigh); const an = _pt(k, l[1], FIG.shank); return { knee: k, ankle: an }; };
  return { c, shoulderC, headC, hipL, hipR, shL, shR, leftArm: arm(pose.leftArm, shL), rightArm: arm(pose.rightArm, shR), leftLeg: leg(pose.leftLeg, hipL), rightLeg: leg(pose.rightLeg, hipR) };
}
function figureInnerFront(pose, opts) {
  const J = _resolveFront(pose);
  _applyConstraints(J, pose);
  const SW = 2.5; const out = [];
  const ground = pose.ground == null ? FIG.ground : pose.ground;
  if (pose.ground !== false) out.push(`<line x1="2" y1="${_n(ground)}" x2="48" y2="${_n(ground)}" stroke-width="1.5" stroke="#807868"/>`);
  if (pose.propsBehind) out.push(typeof pose.propsBehind === 'function' ? pose.propsBehind(J) : pose.propsBehind);
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
  if (pose.propsFront) out.push(typeof pose.propsFront === 'function' ? pose.propsFront(J) : pose.propsFront);
  if (pose.intensity) { const i = typeof pose.intensity === 'function' ? pose.intensity(J) : pose.intensity; out.push(_intensity(i, opts && opts.feel)); }
  return out.join('');
}
function propGobletFront(J) { const a = J.leftArm && J.leftArm.hand, b = J.rightArm && J.rightArm.hand; if (!a || !b) return ''; const x = _n((a[0] + b[0]) / 2), y = _n((a[1] + b[1]) / 2); return `<rect x="${x - 2.2}" y="${y - 2.2}" width="4.4" height="4.4" rx="1" fill="#D9A24E"/>`; }
function propBandFront(J) { if (!J.leftLeg || !J.rightLeg) return ''; const a = J.leftLeg.knee, b = J.rightLeg.knee; return `<line x1="${_n(a[0])}" y1="${_n(a[1])}" x2="${_n(b[0])}" y2="${_n(b[1])}" stroke="#D9A24E" stroke-width="1.4" stroke-dasharray="2 1.5"/>`; }

// Public: build an <svg> for a pose with a class (a/b for cross-fade frames)
function poseSVG(pose, size, cls) { return `<svg class="${cls}" viewBox="0 0 50 60" width="${size}" height="${size}" aria-hidden="true">${figureInner(pose)}</svg>`; }

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
  }
  requestAnimationFrame(_figFrame);
}
if (typeof requestAnimationFrame !== 'undefined') requestAnimationFrame(_figFrame);

// Public: an animated skeleton figure for an exercise key (used by animatedFigure).
function skeletonFigure(key, size) {
  const s = size || 44; const def = FIG_POSES[key];
  const inner = def ? figureInner(def.f1, { feel: 1 }) : '';
  return `<span class="afig" style="width:${s}px;height:${s}px;display:inline-block;line-height:0;"><svg class="skfig" data-fig="${escAttr(key)}" viewBox="0 0 50 60" width="${s}" height="${s}" aria-hidden="true">${inner}</svg></span>`;
}
function escAttr(s) { return String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])); }
function hasFigurePose(key) { return !!FIG_POSES[key]; }

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
//   propsBehind    SVG drawn behind the body — use propWall()/propBench()/propBenchLegs().
//   propsFront     SVG (or fn(J)) drawn in front — use propDumbbell(J,'near'|'far') for weights.
//   intensity      {at:[x,y], dir:deg, r} or fn(J) → a pulsing red "feel it here" marker.
// Joint reality: knees/elbows bend one way only — author angles that don't hyperextend.
// The animator smoothly eases f1↔f2 and pulses the intensity automatically.
// ============================================================
// POSE REGISTRY — each exercise = two frames of joint angles.
// Angles per the convention above (down=90, right=0, up=270, left=180).
// near* = side facing viewer (solid); far* = back side (dim, depth).
// ============================================================
const FIG_POSES = {
  // sanity check — neutral stand
  standing: {
    f1: { pelvis:[25,34], torso:270, nearArm:[90,90], farArm:[92,92], nearLeg:[90,90,0], farLeg:[88,90,0] },
    f2: { pelvis:[25,34], torso:270, nearArm:[92,92], farArm:[90,90], nearLeg:[88,90,0], farLeg:[90,90,0] },
  },
  // Calf raise — both feet, rise onto toes (heels up); feel it in the calves.
  calf_raise: {
    f1: { pelvis:[25,33], torso:270, nearArm:[100,95], farArm:[100,95], nearLeg:[90,90,2], farLeg:[90,90,2],
          intensity:(J)=>({ at:[J.nearLeg.knee[0]-3, (J.nearLeg.knee[1]+J.nearLeg.ankle[1])/2], dir:180, r:2.6 }) },
    f2: { pelvis:[25,30], torso:270, nearArm:[100,95], farArm:[100,95], nearLeg:[90,90,60], farLeg:[90,90,60],
          intensity:(J)=>({ at:[J.nearLeg.knee[0]-3, (J.nearLeg.knee[1]+J.nearLeg.ankle[1])/2], dir:180, r:2.6 }) },
  },
  // Glute bridge — lying on BACK, shoulders+feet on floor, hips lifted into a line.
  glute_bridge: {
    dur: 2000,
    f1: { pelvis:[23,53], torso:160, head:186, nearArm:[16,2], farArm:[20,4], nearLeg:[350,93,0], farLeg:[346,93,0] },
    f2: { pelvis:[27,43], torso:142, head:178, nearArm:[20,2], farArm:[24,4], nearLeg:[10,90,0],  farLeg:[6,90,0] },
  },
  // Calf stretch — wall ahead (right); lean in, BACK leg straight (heel down) = stretch.
  calf_stretch: {
    f1: { pelvis:[22,34], torso:300, nearArm:[8,2], farArm:[12,4], nearLeg:[70,90,2], farLeg:[120,118,2], ground:56, wallX:44,
          propsBehind: propWall(44, 8, 56),
          intensity:(J)=>({ at:[J.farLeg.knee[0]-3, (J.farLeg.knee[1]+J.farLeg.ankle[1])/2], dir:180, r:2.6 }) },
    f2: { pelvis:[21,35], torso:303, nearArm:[6,0], farArm:[10,2], nearLeg:[72,92,2], farLeg:[124,120,2], ground:56, wallX:44,
          propsBehind: propWall(44, 8, 56),
          intensity:(J)=>({ at:[J.farLeg.knee[0]-3, (J.farLeg.knee[1]+J.farLeg.ankle[1])/2], dir:180, r:2.6 }) },
  },
  // Single-arm DB row — FACING RIGHT, hinged over a bench: FAR (support) hand braces flat on
  // the bench top, feet on the floor under the hips, NEAR (working) arm rows the dumbbell up.
  db_row: {
    dur: 1700,
    f1: { pelvis:[15,33], torso:6, head:6, farArm:[90,90], nearArm:[82,98], nearLeg:[100,90,4], farLeg:[96,90,4], ground:56,
          propsBehind: propBench(28,47,20,4) + propBenchLegs(28,51,20,5),
          propsFront:(J)=>propDumbbell(J,'near') },
    f2: { pelvis:[15,33], torso:6, head:6, farArm:[90,90], nearArm:[250,108], nearLeg:[100,90,4], farLeg:[96,90,4], ground:56,
          propsBehind: propBench(28,47,20,4) + propBenchLegs(28,51,20,5),
          propsFront:(J)=>propDumbbell(J,'near') },
  },
  // ---- balance / neuromuscular ----
  sl_stance: {
    f1: { pelvis:[25,34], torso:271, head:271, nearArm:[98,62], farArm:[108,57], nearLeg:[90,90,5], farLeg:[345,98,0] },
    f2: { pelvis:[25,33], torso:270, head:270, nearArm:[100,60], farArm:[110,55], nearLeg:[90,90,5], farLeg:[340,95,0] },
  },
  sl_squat: {
    f1: { pelvis:[25,33], torso:270, head:270, nearArm:[95,92], farArm:[98,92], nearLeg:[90,90,5], farLeg:[110,60,20] },
    f2: { pelvis:[25,36], torso:268, head:268, nearArm:[80,88], farArm:[83,88], nearLeg:[100,75,5], farLeg:[112,58,20] },
  },
  sl_hop: {   // front view (single-leg balance/landing — one leg planted, other tucked up)
    dur:1000,
    f1: { view:'front', pelvis:[25,42], torso:265, hipW:7, leftLeg:[95,100], rightLeg:[80,300], leftArm:[150,165], rightArm:[30,15] },
    f2: { view:'front', pelvis:[25,38], torso:268, hipW:7, leftLeg:[90,90], rightLeg:[80,300], leftArm:[140,150], rightArm:[40,28] },
  },
  // ---- hip ----
  hip_abd: {
    f1: { pelvis:[33,52], torso:178, head:178, nearArm:[200,210], farArm:[185,185], nearLeg:[6,6,30], farLeg:[5,5,30],
          intensity:(J)=>({ at:_along(J.pelvis,J.nearLeg.knee,0.3), dir:270, r:2.4 }) },
    f2: { pelvis:[33,52], torso:178, head:178, nearArm:[200,210], farArm:[185,185], nearLeg:[315,315,300], farLeg:[5,5,30] },
  },
  band_walk: {   // front view (lateral steps + band across knees)
    f1: { view:'front', pelvis:[25,38], torso:269, hipW:9, leftArm:[100,90], rightArm:[80,90], leftLeg:[100,84], rightLeg:[80,96],
          propsBehind:(J)=>propBandFront(J), intensity:(J)=>({ at:_along(J.hipL,J.leftLeg.knee,0.5), dir:180, r:2.2 }) },
    f2: { view:'front', pelvis:[25,38.5], torso:269, hipW:9, leftArm:[100,90], rightArm:[80,90], leftLeg:[114,80], rightLeg:[78,98] },
  },
  // ---- shin / calf ----
  sl_calf_raise: {
    f1: { pelvis:[25,33], torso:270, head:270, nearArm:[15,8], farArm:[40,200], nearLeg:[90,90,2], farLeg:[40,200,0], wallX:44,
          propsBehind: propWall(44,8,57), intensity:(J)=>({ at:_along(J.nearLeg.knee,J.nearLeg.ankle,0.5), dir:180, r:2.4 }) },
    f2: { pelvis:[25,30], torso:270, head:270, nearArm:[15,8], farArm:[40,200], nearLeg:[90,90,60], farLeg:[40,200,0], wallX:44,
          propsBehind: propWall(44,8,57) },
  },
  // ---- strength ----
  goblet_sq: {   // front view (symmetric squat, goblet at chest)
    f1: { view:'front', pelvis:[25,33], torso:270, hipW:8, shoulderW:9, leftArm:[58,72], rightArm:[122,108], leftLeg:[94,90], rightLeg:[86,90],
          propsFront:(J)=>propGobletFront(J) },
    f2: { view:'front', pelvis:[25,40], torso:272, hipW:8, shoulderW:9, leftArm:[58,72], rightArm:[122,108], leftLeg:[112,68], rightLeg:[68,112] },
  },
  pushup: {
    f1: { pelvis:[27,50], torso:8, head:8, nearArm:[100,95], farArm:[100,95], nearLeg:[170,170,90], farLeg:[170,170,90] },
    f2: { pelvis:[27,52], torso:8, head:8, nearArm:[150,70], farArm:[150,70], nearLeg:[170,170,90], farLeg:[170,170,90] },
  },
  plank: {
    f1: { pelvis:[26,46], torso:12, head:12, nearArm:[95,180], farArm:[92,180], nearLeg:[162,162,120], farLeg:[160,160,118] },
    f2: { pelvis:[26,46], torso:12, head:12, nearArm:[95,180], farArm:[92,180], nearLeg:[162,162,120], farLeg:[160,160,118] },
  },
  rdl: {
    f1: { pelvis:[25,33], torso:270, head:270, nearArm:[92,90], farArm:[88,90], nearLeg:[90,90,5], farLeg:[90,90,5],
          propsFront:(J)=>propDumbbell(J,'near')+propDumbbell(J,'far'),
          intensity:(J)=>({ at:_along(J.pelvis,J.nearLeg.knee,0.5), dir:200, r:2.4 }) },
    f2: { pelvis:[22,36], torso:20, head:12, nearArm:[90,90], farArm:[90,90], nearLeg:[85,95,0], farLeg:[83,95,0] },
  },
  oh_press: {
    f1: { pelvis:[25,35], torso:270, head:270, nearArm:[122,283], farArm:[118,287], nearLeg:[90,90,5], farLeg:[90,90,5],
          propsFront:(J)=>propDumbbell(J,'near')+propDumbbell(J,'far') },
    f2: { pelvis:[25,35], torso:270, head:270, nearArm:[272,272], farArm:[268,268], nearLeg:[90,90,5], farLeg:[90,90,5] },
  },
  split_sq: {
    f1: { pelvis:[25,38], torso:276, head:276, nearArm:[110,135], farArm:[115,140], nearLeg:[95,90,0], farLeg:[132,225,35],
          propsBehind:(J)=>propBench(J.farLeg.ankle[0]-7, J.farLeg.ankle[1], 16, 3) },
    f2: { pelvis:[24,42], torso:272, head:272, nearArm:[120,150], farArm:[125,155], nearLeg:[105,55,0], farLeg:[138,235,30] },
  },
  // ---- mobility ----
  dead_bug: {
    f1: { pelvis:[30,54], torso:180, head:180, nearArm:[270,270], farArm:[270,270], nearLeg:[270,0,0], farLeg:[270,0,0] },
    f2: { pelvis:[30,54], torso:180, head:180, nearArm:[185,182], farArm:[270,270], nearLeg:[270,0,0], farLeg:[10,5,0] },
  },
  // ---- kettlebell ----
  kb_swing: {
    dur:1200,
    f1: { pelvis:[26,40], torso:305, head:312, nearArm:[112,114], farArm:[108,110], nearLeg:[96,88,4], farLeg:[92,90,4],
          propsFront:(J)=>propKettlebell(J,'near') },
    f2: { pelvis:[25,33], torso:270, head:270, nearArm:[357,357], farArm:[353,353], nearLeg:[90,90,5], farLeg:[90,90,5] },
  },
  kb_carry: {   // front view — a kettlebell in EACH hand, tall posture, gentle march
    dur:1500,
    f1: { view:'front', pelvis:[25,33], torso:270, hipW:8, leftArm:[90,90], rightArm:[90,90], leftLeg:[92,92], rightLeg:[84,108],
          propsFront:(J)=>propKbAt(J.leftArm.hand)+propKbAt(J.rightArm.hand) },
    f2: { view:'front', pelvis:[25,33], torso:270, hipW:8, leftArm:[90,90], rightArm:[90,90], leftLeg:[96,108], rightLeg:[88,92] },
  },
};

// ----------------------------------------------------------------------
// PREVIEW harness (dev only): __figPreview(['glute_bridge', ...]) injects a
// labeled grid into #app so frames can be screenshotted & visually audited.
// ----------------------------------------------------------------------
function __figPreview(keys, frame) {
  keys = keys || Object.keys(FIG_POSES);
  const cell = (k) => {
    const p = FIG_POSES[k]; if (!p) return `<div style="padding:8px;color:#E26B5F">${k}: MISSING</div>`;
    const box = (inner, lbl) => `<div style="text-align:center"><div style="background:#211C19;border:1px solid #3A3431;border-radius:10px;display:inline-block">${inner}</div><div style="font-family:monospace;font-size:10px;color:#9A9282">${lbl}</div></div>`;
    return `<div style="border:1px solid #3A3431;border-radius:12px;padding:8px;margin:4px"><div style="color:#E8E2D2;font-size:13px;margin-bottom:4px">${k}</div><div style="display:flex;gap:8px;justify-content:center;align-items:center">${box(skeletonFigure(k, 116), 'live')}${box(poseSVG(p.f1, 72, 'a'), 'f1')}${box(poseSVG(p.f2, 72, 'a'), 'f2')}</div></div>`;
  };
  const html = `<div style="padding:12px;display:grid;grid-template-columns:1fr 1fr;gap:6px;background:#1A1614">${keys.map(cell).join('')}</div>`;
  document.getElementById('app').innerHTML = html;
  return keys.length + ' figures previewed';
}
