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

// Render one POSE to inner SVG markup (no <svg> wrapper). cls drives anim layering.
function figureInner(pose) {
  const J = _resolve(pose);
  const SW = 2.5, DIM = 'var(--paper-dim)';
  const out = [];
  const ground = pose.ground == null ? FIG.ground : pose.ground;
  // ground line first (behind)
  if (pose.ground !== false) out.push(`<line x1="2" y1="${_n(ground)}" x2="48" y2="${_n(ground)}" stroke-width="1.5" stroke="#807868"/>`);
  // props behind the body (wall/bench/band drawn under near limbs)
  if (pose.propsBehind) out.push(pose.propsBehind);
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
  // intensity marks (where you should feel it) — red double-arc at a point
  if (pose.intensity) { const i = typeof pose.intensity === 'function' ? pose.intensity(J) : pose.intensity; out.push(_intensity(i)); }
  return out.join('');
}
// red "feel it here" double-arc centered at [x,y], opening direction dir (deg)
function _intensity(spec) {
  const [x, y] = spec.at; const r = spec.r || 3; const d = (spec.dir == null ? 180 : spec.dir) * DEG;
  const nx = Math.cos(d), ny = Math.sin(d);             // offset normal
  const a1 = [x + nx * 0 - ny * r, y + ny * 0 + nx * r];
  const arc = (off) => { const cx = x + nx * off, cy = y + ny * off; return `<path d="M ${_n(cx - ny * r)} ${_n(cy + nx * r)} Q ${_n(cx + nx * r * 1.1)} ${_n(cy + ny * r * 1.1)} ${_n(cx + ny * r)} ${_n(cy - nx * r)}" stroke="#E26B5F" stroke-width="1.6" fill="none" stroke-linecap="round"/>`; };
  return arc(0) + arc(2.2);
}

// Props ----------------------------------------------------------------
function propBench(x, y, w, h) { return `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="1.5" fill="#3A3431" stroke="#807868" stroke-width="1"/>`; }
function propBenchLegs(x, y, w, h) { return `<line x1="${x + 2}" y1="${y}" x2="${x + 2}" y2="${y + h}" stroke="#807868" stroke-width="1.5"/><line x1="${x + w - 2}" y1="${y}" x2="${x + w - 2}" y2="${y + h}" stroke="#807868" stroke-width="1.5"/>`; }
function propWall(x, y1, y2) { return `<line x1="${x}" y1="${y1}" x2="${x}" y2="${y2}" stroke-width="2.5" stroke="#807868"/>`; }
function propDumbbell(J, which) { const h = (which === 'near' ? J.nearArm : J.farArm)?.hand; if (!h) return ''; return `<rect x="${_n(h[0] - 3)}" y="${_n(h[1] - 1.6)}" width="6" height="3.2" rx="1" fill="#D9A24E"/>`; }

// Public: build an <svg> for a pose with a class (a/b for cross-fade frames)
function poseSVG(pose, size, cls) { return `<svg class="${cls}" viewBox="0 0 50 60" width="${size}" height="${size}" aria-hidden="true">${figureInner(pose)}</svg>`; }

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
    f1: { pelvis:[25,49], torso:150, head:184, nearArm:[20,2], farArm:[24,4], nearLeg:[332,90,0], farLeg:[336,90,0] },
    f2: { pelvis:[27,43], torso:142, head:178, nearArm:[20,2], farArm:[24,4], nearLeg:[10,90,0],  farLeg:[6,90,0] },
  },
  // Calf stretch — wall ahead (right); lean in, BACK leg straight (heel down) = stretch.
  calf_stretch: {
    f1: { pelvis:[22,34], torso:300, nearArm:[8,2], farArm:[12,4], nearLeg:[70,90,2], farLeg:[120,118,2], ground:56,
          propsBehind: propWall(44, 8, 56),
          intensity:(J)=>({ at:[J.farLeg.knee[0]-3, (J.farLeg.knee[1]+J.farLeg.ankle[1])/2], dir:180, r:2.6 }) },
    f2: { pelvis:[21,35], torso:303, nearArm:[6,0], farArm:[10,2], nearLeg:[72,92,2], farLeg:[124,120,2], ground:56,
          propsBehind: propWall(44, 8, 56),
          intensity:(J)=>({ at:[J.farLeg.knee[0]-3, (J.farLeg.knee[1]+J.farLeg.ankle[1])/2], dir:180, r:2.6 }) },
  },
  // Single-arm DB row — hinge at a bench, far hand braces ON the bench top, near arm rows a dumbbell.
  db_row: {
    f1: { pelvis:[24,34], torso:200, head:196, nearArm:[95,90], farArm:[80,90], nearLeg:[95,90,0], farLeg:[100,92,0], ground:57,
          propsBehind: propBench(30,40,16,4) + propBenchLegs(30,44,16,11),
          propsFront:(J)=>propDumbbell(J,'near') },
    f2: { pelvis:[24,34], torso:200, head:196, nearArm:[120,250], farArm:[80,90], nearLeg:[95,90,0], farLeg:[100,92,0], ground:57,
          propsBehind: propBench(30,40,16,4) + propBenchLegs(30,44,16,11),
          propsFront:(J)=>propDumbbell(J,'near') },
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
    const f = frame == null ? null : frame;
    const one = (pose, lbl) => `<div style="text-align:center"><div style="background:#211C19;border:1px solid #3A3431;border-radius:10px;display:inline-block">${poseSVG(pose, 120, 'a')}</div><div style="font-family:monospace;font-size:10px;color:#9A9282">${lbl}</div></div>`;
    return `<div style="border:1px solid #3A3431;border-radius:12px;padding:8px;margin:4px"><div style="color:#E8E2D2;font-size:13px;margin-bottom:4px">${k}</div><div style="display:flex;gap:8px;justify-content:center">${one(p.f1, '1')}${one(p.f2, '2')}</div></div>`;
  };
  const html = `<div style="padding:12px;display:grid;grid-template-columns:1fr 1fr;gap:6px;background:#1A1614">${keys.map(cell).join('')}</div>`;
  document.getElementById('app').innerHTML = html;
  return keys.length + ' figures previewed';
}
