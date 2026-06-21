'use strict';
// ============================================================
// FIGURE EDITOR (dev-only) — Flash-style joint editor for The Hard Part figures.
// ------------------------------------------------------------
// Shares the ONE global scope with figure-poses.js + figure.js (classic <script>),
// so it edits the REAL FIG_POSES / GAIT_PARAMS in place and renders with the REAL
// figureInner / lerpPose / _gaitPose — WYSIWYG with the library + minis.
//
// It re-derives joint screen positions exactly as the renderer does (_resolve /
// _resolveFront + _applyConstraints) so draggable handles sit on the drawn joints;
// dragging an end-joint sets that BONE's ANGLE toward the cursor (lengths fixed by FK
// so nothing detaches). facing:-1 mirroring is undone in the cursor→model math.
//
// Autosave: any change debounces a POST {poses,gait} to /api/save (the save-server),
// which also snapshots a version. On open it mints a sessionId, GETs current, and
// writes a session-start snapshot; a version list offers revert + restore-to-start.
//
// NEVER add these tool files to sw.js — they must not ship to users.
// ============================================================

const SCALE = 10;                 // 50x60 viewBox → 500x600 px canvas
const VW = 50, VH = 60;
const D2R = Math.PI / 180;        // (figure.js already declares a top-level `DEG`; don't shadow/collide it)
const GAIT_KEYS = ['walk', 'run', 'kb_carry'];   // kb_carry == farmer carry (procedural)

// ---- editor state ----
const ED = {
  move: 'standing',     // selected move key (a FIG_POSES key or a gait key)
  frame: 'f1',          // active frame
  scrub: 0,             // scrub t (0..1)
  playing: false,
  raf: 0,
  sel: null,            // selected joint handle id (for readout)
  drag: null,           // active drag descriptor
  locks: {},            // { 'move|frame|field': true } per-joint lock
  showOnion: true, showGrid: false, showGuides: false, snapGrid: false, snapAngle: false,
  sessionId: null,
  saveTimer: 0,
  startSnapshotDone: false,
};

const $ = (id) => document.getElementById(id);
const isGait = (k) => GAIT_KEYS.indexOf(k) >= 0;
const round2 = (v) => Math.round(v * 100) / 100;
const lockKey = (field) => ED.move + '|' + ED.frame + '|' + field;

// current active pose object (the live reference inside FIG_POSES, so edits persist)
function activePose() { const d = FIG_POSES[ED.move]; return d ? d[ED.frame] : null; }
function otherPose() { const d = FIG_POSES[ED.move]; return d ? d[ED.frame === 'f1' ? 'f2' : 'f1'] : null; }
function isFront(pose) { return pose && pose.view === 'front'; }

// ============================================================
// BOOT
// ============================================================
function boot() {
  ED.sessionId = 's' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  buildMoveList();
  buildPropTypeSelect();
  buildCopyFromSelectors();
  wireFrameBar();
  wirePlayBar();
  wireVersions();
  wireCanvasPointer();
  selectMove('standing');
  initSession();   // GET current + write a session-start snapshot
}

// ============================================================
// LEFT — move list
// ============================================================
function buildMoveList() {
  const ul = $('moveList'); ul.innerHTML = '';
  const poseKeys = Object.keys(FIG_POSES);
  // standing first (sanity), then the rest in registry order
  poseKeys.sort((a, b) => (a === 'standing' ? -1 : b === 'standing' ? 1 : 0));
  poseKeys.forEach(k => ul.appendChild(moveLi(k, 'pose')));
  GAIT_KEYS.forEach(k => ul.appendChild(moveLi(k, 'gait')));
}
function moveLi(key, kind) {
  const li = document.createElement('li');
  li.textContent = key;
  li.dataset.move = key;
  if (kind === 'gait') li.className = 'gait';
  const tag = document.createElement('span'); tag.className = 'tag';
  tag.textContent = kind === 'gait' ? 'gait' : (FIG_POSES[key] && FIG_POSES[key].f1.view === 'front' ? 'front' : 'side');
  li.appendChild(tag);
  li.onclick = () => selectMove(key);
  return li;
}
function selectMove(key) {
  ED.move = key; ED.frame = 'f1'; ED.sel = null; stopPlay();
  document.querySelectorAll('#moveList li').forEach(li => li.classList.toggle('active', li.dataset.move === key));
  document.querySelectorAll('#frameSeg .fbtn').forEach(b => b.classList.toggle('active', b.dataset.frame === 'f1'));
  const gait = isGait(key);
  $('gaitPanel').hidden = !gait;
  $('frameBar').style.display = gait ? 'none' : 'flex';
  $('rightTitle').textContent = gait ? 'Gait fields (n/a — use sliders)' : 'Fields — ' + ED.frame;
  if (gait) { buildGaitControls(); $('fields').innerHTML = ''; $('props').innerHTML = ''; }
  else { rebuildRight(); }
  renderCanvas();
}

// ============================================================
// CENTER — canvas render
// ============================================================
function modelToScreen(p) { return [p[0] * SCALE, p[1] * SCALE]; }

// Resolve drawn joint positions for a pose, exactly as the renderer does.
// Returns { handleId -> {pt:[mx,my], field, parent:[mx,my], len, kind} } in MODEL coords
// (handles drawn after un-mirroring; see renderCanvas for the facing flip on draw).
function resolveHandles(pose) {
  if (isFront(pose)) return resolveHandlesFront(pose);
  const J = _resolve(pose); _applyConstraints(J, pose);
  const h = {};
  h.pelvis = { pt: J.pelvis, field: 'pelvis', kind: 'root' };
  h.shoulder = { pt: J.shoulder, field: 'torso', parent: J.pelvis, kind: 'angle' };
  h.head = { pt: J.headC, field: 'head', parent: J.shoulder, kind: 'angle', fallback: 'torso' };
  ['near', 'far'].forEach(side => {
    const arm = J[side + 'Arm'], leg = J[side + 'Leg'];
    if (arm) {
      h[side + 'Elbow'] = { pt: arm.elbow, field: side + 'Arm.0', parent: J.shoulder, kind: 'angle' };
      h[side + 'Hand'] = { pt: arm.hand, field: side + 'Arm.1', parent: arm.elbow, kind: 'angle' };
    }
    if (leg) {
      h[side + 'Knee'] = { pt: leg.knee, field: side + 'Leg.0', parent: J.pelvis, kind: 'angle' };
      h[side + 'Ankle'] = { pt: leg.ankle, field: side + 'Leg.1', parent: leg.knee, kind: 'angle' };
      h[side + 'Toe'] = { pt: leg.toe, field: side + 'Leg.2', parent: leg.ankle, kind: 'angle', fallback5: true };
    }
  });
  return h;
}
function resolveHandlesFront(pose) {
  const J = _resolveFront(pose); _applyConstraints(J, pose);
  const h = {};
  h.pelvis = { pt: J.c, field: 'pelvis', kind: 'root' };
  h.shoulder = { pt: J.shoulderC, field: 'torso', parent: J.c, kind: 'angle' };
  h.head = { pt: J.headC, field: 'head', parent: J.shoulderC, kind: 'angle', fallback: 'torso' };
  [['left', J.shL, J.hipL], ['right', J.shR, J.hipR]].forEach(([side, shBase, hipBase]) => {
    const arm = J[side + 'Arm'], leg = J[side + 'Leg'];
    if (arm) {
      h[side + 'Elbow'] = { pt: arm.elbow, field: side + 'Arm.0', parent: shBase, kind: 'angle' };
      h[side + 'Hand'] = { pt: arm.hand, field: side + 'Arm.1', parent: arm.elbow, kind: 'angle' };
    }
    if (leg) {
      h[side + 'Knee'] = { pt: leg.knee, field: side + 'Leg.0', parent: hipBase, kind: 'angle' };
      h[side + 'Ankle'] = { pt: leg.ankle, field: side + 'Leg.1', parent: leg.knee, kind: 'angle' };
    }
  });
  return h;
}

function renderCanvas() {
  const svg = $('canvas');
  if (isGait(ED.move)) { renderGaitCanvas(svg); return; }
  const pose = activePose(); if (!pose) { svg.innerHTML = ''; return; }
  const facing = pose.facing === -1;
  let body = '';
  // grid
  if (ED.showGrid) body += gridMarkup();
  // onion-skin: ghost of the inactive frame (rendered with its own facing baked in)
  if (ED.showOnion && otherPose()) body += `<g class="onion">${figureInner(otherPose())}</g>`;
  // the active figure (real renderer; facing flip already inside figureInner)
  body += figureInner(pose);
  // guides through the selected joint
  if (ED.showGuides && ED.sel) body += guideMarkup(pose, facing);
  // The figure markup is in 0..50 model space; scale the whole group ×SCALE.
  let inner = `<g transform="scale(${SCALE})">${body}</g>`;
  // handles drawn in screen space (un-mirrored: we flip handle x ourselves so they sit
  // on the drawn joints even when facing:-1 mirrors the figure group).
  inner += handlesMarkup(pose, facing);
  svg.innerHTML = inner;
  updateReadout(pose);
}
function gridMarkup() {
  let s = '';
  for (let x = 0; x <= VW; x += 5) s += `<line class="gline${x % 10 ? '' : ' major'}" x1="${x}" y1="0" x2="${x}" y2="${VH}"/>`;
  for (let y = 0; y <= VH; y += 5) s += `<line class="gline${y % 10 ? '' : ' major'}" x1="0" y1="${y}" x2="${VW}" y2="${y}"/>`;
  return s;
}
function guideMarkup(pose, facing) {
  const H = resolveHandles(pose); const hd = H[ED.sel]; if (!hd) return '';
  // guides live in the scaled (model-space) group but OUTSIDE figureInner's facing mirror,
  // so reflect x ourselves when facing:-1 to land on the drawn joint.
  const x = facing ? VW - hd.pt[0] : hd.pt[0], y = hd.pt[1];
  return `<line class="guide" x1="${round2(x)}" y1="0" x2="${round2(x)}" y2="${VH}"/><line class="guide" x1="0" y1="${round2(y)}" x2="${VW}" y2="${round2(y)}"/>`;
}
function handlesMarkup(pose, facing) {
  const H = resolveHandles(pose);
  let s = '';
  Object.keys(H).forEach(id => {
    const hd = H[id];
    let mx = hd.pt[0]; if (facing) mx = VW - mx;       // un-mirror so the handle sits on the drawn joint
    const [sx, sy] = [mx * SCALE, hd.pt[1] * SCALE];
    const locked = hd.kind === 'angle' && ED.locks[lockKey(hd.field)];
    const cls = ['handle', hd.kind === 'root' ? 'pelvis' : '', id === ED.sel ? 'sel' : '', locked ? 'locked' : ''].filter(Boolean).join(' ');
    s += `<circle class="${cls}" data-h="${id}" cx="${round2(sx)}" cy="${round2(sy)}" r="7"/>`;
  });
  return s;
}

function renderGaitCanvas(svg) {
  const kind = ED.move === 'run' ? 'run' : 'walk';
  const carry = ED.move === 'kb_carry';
  const inner = _gaitInner(_gaitPose(kind, ED.scrub, carry), carry);
  svg.innerHTML = (ED.showGrid ? `<g transform="scale(${SCALE})">${gridMarkup()}</g>` : '')
    + `<g transform="scale(${SCALE})">${inner}</g>`;
  updateReadout(null);
}

// ============================================================
// CENTER — pointer (drag joints)
// ============================================================
function svgPoint(evt) {
  const svg = $('canvas'); const r = svg.getBoundingClientRect();
  const x = (evt.clientX - r.left) / r.width * 500;   // screen px in the 500x600 system
  const y = (evt.clientY - r.top) / r.height * 600;
  return [x / SCALE, y / SCALE];                       // → model 0..50 / 0..60
}
function wireCanvasPointer() {
  const svg = $('canvas');
  svg.addEventListener('pointerdown', (e) => {
    if (isGait(ED.move)) return;
    const t = e.target;
    if (!t || !t.dataset || !t.dataset.h) return;
    const id = t.dataset.h; const pose = activePose(); const H = resolveHandles(pose); const hd = H[id];
    if (!hd) return;
    if (hd.kind === 'angle' && ED.locks[lockKey(hd.field)]) { ED.sel = id; renderCanvas(); return; }
    ED.sel = id; ED.drag = { id, hd, pose }; svg.setPointerCapture(e.pointerId); e.preventDefault();
    renderCanvas();
  });
  svg.addEventListener('pointermove', (e) => {
    if (!ED.drag) return;
    let [mx, my] = svgPoint(e);
    const pose = ED.drag.pose; const facing = pose.facing === -1;
    if (facing) mx = VW - mx;                 // undo the render mirror → model coords
    if (ED.snapGrid) { mx = Math.round(mx); my = Math.round(my); }
    applyDrag(ED.drag.hd, mx, my, pose);
    renderCanvas(); rebuildRight(); scheduleSave();
  });
  const end = (e) => { if (ED.drag) { try { svg.releasePointerCapture(e.pointerId); } catch (_) {} ED.drag = null; } };
  svg.addEventListener('pointerup', end);
  svg.addEventListener('pointercancel', end);
}
// Apply a drag: root sets pelvis [x,y]; angle handles set the BONE angle from parent→cursor.
function applyDrag(hd, mx, my, pose) {
  if (hd.kind === 'root') {
    pose.pelvis[0] = round2(clamp(mx, 0, VW));
    pose.pelvis[1] = round2(clamp(my, 0, VH));
    return;
  }
  // angle from the drawn parent joint toward the cursor
  const px = hd.parent[0], py = hd.parent[1];
  let ang = Math.atan2(my - py, mx - px) / D2R;
  ang = ((ang % 360) + 360) % 360;
  if (ED.snapAngle) ang = Math.round(ang / 5) * 5;
  // HINGE CLAMP: the renderer re-clamps a shank/forearm relative to its parent BONE
  // (thigh/upper-arm), so the RAW absolute angle would diverge from the drawn joint.
  // Clamp here with the SAME limits/sign the renderer uses for this view so the stored
  // value matches the handle position. Toe (.2) is NOT clamped by the renderer.
  const cm = /^(near|far|left|right)(Arm|Leg)\.1$/.exec(hd.field);
  if (cm) {
    const parentArr = pose[cm[1] + cm[2]];
    const parentA = parentArr ? parentArr[0] : 0;
    const front = isFront(pose);
    if (cm[2] === 'Leg') {
      ang = front ? _clampRel(ang, parentA, -FIG.kneeMax, FIG.kneeMax)
                  : _clampRel(ang, parentA, FIG.kneeMin, FIG.kneeMax);
    } else {
      ang = _clampRel(ang, parentA, -FIG.elbowLim, FIG.elbowLim);
    }
    ang = ((ang % 360) + 360) % 360;
  }
  setField(pose, hd.field, round2(ang));
}
function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }

// ============================================================
// FIELD get/set — dotted paths into a pose (e.g. nearArm.0, pelvis.x, intensity.dir)
// ============================================================
function setField(pose, path, val) {
  if (path === 'torso') { pose.torso = val; return; }
  if (path === 'head') { pose.head = val; return; }
  const m = path.match(/^(near|far|left|right)(Arm|Leg)\.(\d)$/);
  if (m) {
    const key = m[1] + m[2]; const idx = +m[3];
    if (!pose[key]) pose[key] = (m[2] === 'Leg') ? [90, 90, 0] : [90, 90];
    pose[key][idx] = val; return;
  }
  if (path === 'pelvis.x') { pose.pelvis[0] = val; return; }
  if (path === 'pelvis.y') { pose.pelvis[1] = val; return; }
  if (path.indexOf('intensity.') === 0) {
    if (!pose.intensity) pose.intensity = { at: [25, 30], dir: 180, r: 2.4 };
    const k = path.slice('intensity.'.length);
    if (k === 'atx') pose.intensity.at[0] = val;
    else if (k === 'aty') pose.intensity.at[1] = val;
    else pose.intensity[k] = val;
    return;
  }
  pose[path] = val;
}

// ============================================================
// RIGHT — numeric fields, props, copy-from
// ============================================================
function rebuildRight() {
  if (isGait(ED.move)) return;
  $('rightTitle').textContent = 'Fields — ' + ED.frame;
  buildFields();
  buildProps();
  buildCopyFromFieldSelect();
}

const ANGLE_FIELDS = ['torso', 'head'];
function buildFields() {
  const pose = activePose(); const box = $('fields'); box.innerHTML = '';
  const front = isFront(pose);
  // pelvis
  box.appendChild(numField('pelvis.x', pose.pelvis[0], 0.5));
  box.appendChild(numField('pelvis.y', pose.pelvis[1], 0.5));
  // torso / head
  box.appendChild(numField('torso', pose.torso == null ? '' : pose.torso, 1, true));
  box.appendChild(numField('head', pose.head == null ? '' : pose.head, 1, true, 'head (blank=torso)'));
  // limbs
  const limbs = front ? ['leftArm', 'rightArm', 'leftLeg', 'rightLeg'] : ['nearArm', 'farArm', 'nearLeg', 'farLeg'];
  limbs.forEach(key => {
    const arr = pose[key]; if (!arr) return;
    const isLeg = /Leg$/.test(key);
    box.appendChild(numField(key + '.0', arr[0], 1, true, key + ' upper'));
    box.appendChild(numField(key + '.1', arr[1], 1, true, key + (isLeg ? ' shank' : ' fore')));
    if (isLeg && !front) box.appendChild(numField(key + '.2', arr[2] == null ? '' : arr[2], 1, true, key + ' foot'));
  });
  // global scalars
  box.appendChild(numField('ground', pose.ground == null ? '' : pose.ground, 1, false, 'ground (blank=57)'));
  box.appendChild(numField('wallX', pose.wallX == null ? '' : pose.wallX, 1, false, 'wallX (blank=none)'));
  box.appendChild(numField('facing', pose.facing == null ? '' : pose.facing, 1, false, 'facing (-1=left)'));
  if (front) {
    box.appendChild(numField('hipW', pose.hipW == null ? '' : pose.hipW, 0.5, false, 'hipW (blank=8)'));
    box.appendChild(numField('shoulderW', pose.shoulderW == null ? '' : pose.shoulderW, 0.5, false, 'shoulderW (blank=9)'));
  }
  // duration lives on the whole def, but expose it on the active frame UI for convenience
  box.appendChild(numFieldDur());
  // intensity
  const it = pose.intensity;
  box.appendChild(numField('intensity.atx', it ? it.at[0] : '', 0.5, false, 'feel x'));
  box.appendChild(numField('intensity.aty', it ? it.at[1] : '', 0.5, false, 'feel y'));
  box.appendChild(numField('intensity.dir', it ? (it.dir == null ? '' : it.dir) : '', 5, false, 'feel dir'));
  box.appendChild(numField('intensity.r', it ? (it.r == null ? '' : it.r) : '', 0.2, false, 'feel r'));
  const itRow = document.createElement('div'); itRow.className = 'field wide';
  itRow.innerHTML = `<label>intensity marker</label><div class="row"><button class="tbtn" id="btnToggleIntensity">${it ? 'remove' : 'add'} feel-mark</button></div>`;
  itRow.querySelector('button').onclick = () => {
    if (pose.intensity) delete pose.intensity; else pose.intensity = { at: [pose.pelvis[0], pose.pelvis[1] - 4], dir: 180, r: 2.4 };
    rebuildRight(); renderCanvas(); scheduleSave();
  };
  box.appendChild(itRow);
}

function numField(field, value, step, lockable, labelText) {
  const wrap = document.createElement('div'); wrap.className = 'field' + (field.indexOf('intensity') === 0 ? '' : '');
  const id = 'f_' + field.replace(/[^a-z0-9]/gi, '_');
  const isAngle = ANGLE_FIELDS.indexOf(field) >= 0 || /(Arm|Leg)\.\d$/.test(field) || field === 'intensity.dir';
  const locked = !!ED.locks[lockKey(field)];
  wrap.innerHTML = `<label>${labelText || field}</label>
    <div class="row">
      <button class="step" data-d="-1" title="−">−</button>
      <input type="number" id="${id}" step="${step}" value="${value === '' || value == null ? '' : value}">
      <button class="step" data-d="1" title="+">+</button>
      ${lockable ? `<button class="lockbtn${locked ? ' on' : ''}" title="lock joint">${locked ? '🔒' : '🔓'}</button>` : ''}
    </div>`;
  const input = wrap.querySelector('input');
  const commit = (raw) => {
    const pose = activePose();
    if (raw === '' ) { clearField(pose, field); }
    else { setField(pose, field, isAngle ? normAngle(+raw) : +raw); }
    renderCanvas(); scheduleSave();
  };
  input.oninput = () => commit(input.value);
  wrap.querySelectorAll('.step').forEach(b => b.onclick = () => {
    const cur = input.value === '' ? 0 : +input.value;
    let nv = round2(cur + (+b.dataset.d) * step);
    if (isAngle) nv = normAngle(nv);
    input.value = nv; commit(nv);
  });
  if (lockable) { const lb = wrap.querySelector('.lockbtn'); if (lb) lb.onclick = () => { const k = lockKey(field); ED.locks[k] = !ED.locks[k]; rebuildRight(); renderCanvas(); }; }
  return wrap;
}
function numFieldDur() {
  const def = FIG_POSES[ED.move];
  const wrap = document.createElement('div'); wrap.className = 'field';
  wrap.innerHTML = `<label>dur ms (def-level, blank=2400)</label><div class="row"><input type="number" step="50" value="${def.dur == null ? '' : def.dur}"></div>`;
  const input = wrap.querySelector('input');
  input.oninput = () => { if (input.value === '') delete def.dur; else def.dur = +input.value; scheduleSave(); };
  return wrap;
}
function normAngle(v) { v = ((v % 360) + 360) % 360; return round2(v); }
function clearField(pose, field) {
  if (field === 'head' || field === 'ground' || field === 'wallX' || field === 'facing' || field === 'hipW' || field === 'shoulderW') { delete pose[field]; return; }
  if (field.indexOf('intensity.') === 0) { if (pose.intensity) { /* keep object; blank → leave as-is */ } return; }
  // angle slots fall back to safe defaults rather than vanish
  setField(pose, field, 0);
}

// ---- props ----
const SIDE_PROP_TYPES = ['bench', 'wall', 'dumbbell', 'kettlebell', 'band'];
const FRONT_PROP_TYPES = ['goblet', 'bandFront', 'dumbbell'];
function buildPropTypeSelect() { /* populated per-view in buildProps */ }
function buildProps() {
  const pose = activePose(); const box = $('props'); box.innerHTML = '';
  const front = isFront(pose);
  // populate the add-type select for this view
  const sel = $('propType'); sel.innerHTML = '';
  (front ? FRONT_PROP_TYPES : SIDE_PROP_TYPES).forEach(t => { const o = document.createElement('option'); o.value = t; o.textContent = t; sel.appendChild(o); });
  // both lists shown so behind/front props are both editable
  ['propsBehind', 'propsFront'].forEach(listKey => {
    const list = pose[listKey];
    if (!list || !list.length) return;
    const hdr = document.createElement('div'); hdr.className = 'empty'; hdr.textContent = listKey;
    box.appendChild(hdr);
    list.forEach((spec, i) => box.appendChild(propCard(spec, listKey, i)));
  });
  if (!(pose.propsBehind && pose.propsBehind.length) && !(pose.propsFront && pose.propsFront.length)) {
    const e = document.createElement('div'); e.className = 'empty'; e.textContent = 'no props on this frame'; box.appendChild(e);
  }
}
function propCard(spec, listKey, idx) {
  const card = document.createElement('div'); card.className = 'prop';
  const head = document.createElement('div'); head.className = 'phead';
  head.innerHTML = `<span class="ptype">${spec.type} <span style="color:var(--dim);font-weight:400">(${listKey === 'propsBehind' ? 'behind' : 'front'})</span></span>`;
  const del = document.createElement('button'); del.className = 'pdel'; del.textContent = '✕'; del.title = 'remove';
  del.onclick = () => { const pose = activePose(); pose[listKey].splice(idx, 1); if (!pose[listKey].length) delete pose[listKey]; buildProps(); renderCanvas(); scheduleSave(); };
  head.appendChild(del); card.appendChild(head);
  const body = document.createElement('div'); body.className = 'pbody';
  const fieldsFor = {
    bench: [['x', 'num'], ['y', 'num'], ['w', 'num'], ['h', 'num'], ['legs', 'bool'], ['legH', 'num']],
    wall: [['x', 'num'], ['y1', 'num'], ['y2', 'num']],
    dumbbell: [['anchor', 'anchor']],
    kettlebell: [['anchor', 'anchor']],
    band: [['from', 'anchorKnee'], ['to', 'anchorKnee']],
    goblet: [],
    bandFront: [],
  }[spec.type] || [];
  fieldsFor.forEach(([f, kind]) => body.appendChild(propField(spec, listKey, idx, f, kind)));
  if (!fieldsFor.length) { const e = document.createElement('div'); e.className = 'pf full'; e.innerHTML = '<label>auto-positioned (tracks joints)</label>'; body.appendChild(e); }
  card.appendChild(body);
  return card;
}
function propField(spec, listKey, idx, f, kind) {
  const pf = document.createElement('div'); pf.className = 'pf' + (kind === 'bool' || kind === 'anchor' || kind === 'anchorKnee' ? ' full' : '');
  const commit = () => { renderCanvas(); scheduleSave(); };
  if (kind === 'bool') {
    pf.innerHTML = `<label>${f}</label>`;
    const cb = document.createElement('input'); cb.type = 'checkbox'; cb.checked = !!spec[f];
    cb.onchange = () => { spec[f] = cb.checked; commit(); }; pf.appendChild(cb);
  } else if (kind === 'anchor' || kind === 'anchorKnee') {
    pf.innerHTML = `<label>${f}</label>`;
    const s = document.createElement('select');
    const opts = isFront(activePose())
      ? ['leftHand', 'rightHand']
      : (kind === 'anchorKnee' ? ['nearKnee', 'farKnee'] : ['nearHand', 'farHand']);
    opts.forEach(o => { const op = document.createElement('option'); op.value = o; op.textContent = o; if (spec[f] === o) op.selected = true; s.appendChild(op); });
    s.onchange = () => { spec[f] = s.value; commit(); }; pf.appendChild(s);
  } else {
    pf.innerHTML = `<label>${f}</label>`;
    const inp = document.createElement('input'); inp.type = 'number'; inp.step = '0.5'; inp.value = spec[f] == null ? '' : spec[f];
    inp.oninput = () => { if (inp.value === '') delete spec[f]; else spec[f] = +inp.value; commit(); }; pf.appendChild(inp);
  }
  return pf;
}

// ---- add prop ----
function addProp() {
  const pose = activePose(); const type = $('propType').value; const front = isFront(pose);
  // hand-held props draw in FRONT of the body; structural / band props draw BEHIND it
  const FRONT_LIST = ['dumbbell', 'kettlebell', 'goblet'];
  const listKey = FRONT_LIST.indexOf(type) >= 0 ? 'propsFront' : 'propsBehind';
  const spec = makePropSpec(type, front);
  if (!pose[listKey]) pose[listKey] = [];
  pose[listKey].push(spec);
  buildProps(); renderCanvas(); scheduleSave();
}
function makePropSpec(type, front) {
  switch (type) {
    case 'bench': return { type: 'bench', x: 28, y: 47, w: 20, h: 4, legs: true };
    case 'wall': return { type: 'wall', x: 44, y1: 8, y2: 56 };
    case 'dumbbell': return front ? { type: 'dumbbell', anchor: 'leftHand' } : { type: 'dumbbell', anchor: 'nearHand' };
    case 'kettlebell': return { type: 'kettlebell', anchor: 'nearHand' };
    case 'band': return { type: 'band', from: 'nearKnee', to: 'farKnee' };
    case 'goblet': return { type: 'goblet' };
    case 'bandFront': return { type: 'bandFront' };
    default: return { type };
  }
}

// ============================================================
// COPY-FROM another exercise
// ============================================================
function buildCopyFromSelectors() {
  const sel = $('cfMove'); sel.innerHTML = '';
  Object.keys(FIG_POSES).forEach(k => { const o = document.createElement('option'); o.value = k; o.textContent = k; sel.appendChild(o); });
  sel.onchange = buildCopyFromFieldSelect;
  $('cfFrame').onchange = buildCopyFromFieldSelect;
  buildCopyFromFieldSelect();
}
function buildCopyFromFieldSelect() {
  const sel = $('cfField'); if (!sel) return; sel.innerHTML = '';
  const src = sourcePose(); if (!src) return;
  copyableFields(src).forEach(f => { const o = document.createElement('option'); o.value = f; o.textContent = f; sel.appendChild(o); });
}
function sourcePose() { const k = $('cfMove').value; const fr = $('cfFrame').value; return FIG_POSES[k] ? FIG_POSES[k][fr] : null; }
function copyableFields(pose) {
  const out = ['ALL', 'pelvis', 'torso', 'head', 'ground', 'wallX', 'facing', 'intensity'];
  const front = isFront(pose);
  (front ? ['leftArm', 'rightArm', 'leftLeg', 'rightLeg', 'hipW', 'shoulderW'] : ['nearArm', 'farArm', 'nearLeg', 'farLeg']).forEach(k => { if (pose[k] != null) out.push(k); });
  if (pose.propsBehind) out.push('propsBehind');
  if (pose.propsFront) out.push('propsFront');
  return out;
}
function doCopyFrom() {
  const src = sourcePose(); const dst = activePose(); if (!src || !dst) return;
  const field = $('cfField').value;
  if (field === 'ALL') { const keep = dst; Object.keys(keep).forEach(k => delete keep[k]); Object.assign(keep, clone(src)); }
  else if (src[field] === undefined) { delete dst[field]; }
  else { dst[field] = clone(src[field]); }
  rebuildRight(); renderCanvas(); scheduleSave();
}
function clone(v) { return JSON.parse(JSON.stringify(v)); }

// ============================================================
// FRAME bar (f1/f2, copy, mirror, toggles)
// ============================================================
function wireFrameBar() {
  document.querySelectorAll('#frameSeg .fbtn').forEach(b => b.onclick = () => {
    ED.frame = b.dataset.frame; ED.sel = null;
    document.querySelectorAll('#frameSeg .fbtn').forEach(x => x.classList.toggle('active', x === b));
    rebuildRight(); renderCanvas();
  });
  $('btnCopy12').onclick = () => {
    const def = FIG_POSES[ED.move]; const from = ED.frame, to = from === 'f1' ? 'f2' : 'f1';
    def[to] = clone(def[from]); $('btnCopy12').textContent = 'copied ' + from + '→' + to;
    setTimeout(() => $('btnCopy12').textContent = 'copy f1→f2', 1200);
    renderCanvas(); scheduleSave();
  };
  $('btnMirror').onclick = () => { mirrorFrame(activePose()); rebuildRight(); renderCanvas(); scheduleSave(); };
  const toggles = { onionChk: 'showOnion', gridChk: 'showGrid', guideChk: 'showGuides', snapGridChk: 'snapGrid', snapAngChk: 'snapAngle' };
  Object.keys(toggles).forEach(id => { const el = $(id); el.checked = ED[toggles[id]]; el.onchange = () => { ED[toggles[id]] = el.checked; renderCanvas(); }; });
}
// Mirror a frame left↔right. Front view swaps left/right limb sets; side view flips facing
// and reflects every angle across the vertical (a → 180 − a) so the pose reads mirrored.
function mirrorFrame(pose) {
  if (isFront(pose)) {
    [['leftArm', 'rightArm'], ['leftLeg', 'rightLeg']].forEach(([a, b]) => { const t = pose[a]; pose[a] = pose[b]; pose[b] = t; });
    pose.pelvis[0] = round2(VW - pose.pelvis[0]);
    return;
  }
  const refl = (a) => normAngle(180 - a);
  pose.torso = refl(pose.torso);
  if (pose.head != null) pose.head = refl(pose.head);
  ['nearArm', 'farArm'].forEach(k => { if (pose[k]) { pose[k][0] = refl(pose[k][0]); pose[k][1] = refl(pose[k][1]); } });
  ['nearLeg', 'farLeg'].forEach(k => { if (pose[k]) { pose[k][0] = refl(pose[k][0]); pose[k][1] = refl(pose[k][1]); if (pose[k][2] != null) pose[k][2] = refl(pose[k][2]); } });
  pose.pelvis[0] = round2(VW - pose.pelvis[0]);
  pose.facing = pose.facing === -1 ? undefined : -1;
  if (pose.facing === undefined) delete pose.facing;
  if (pose.intensity) pose.intensity.at[0] = round2(VW - pose.intensity.at[0]);
  if (pose.wallX != null) pose.wallX = round2(VW - pose.wallX);
}

// ============================================================
// PLAY / scrub
// ============================================================
function wirePlayBar() {
  $('btnPlay').onclick = () => ED.playing ? stopPlay() : startPlay();
  $('scrub').oninput = () => { ED.scrub = +$('scrub').value; $('scrubT').textContent = 't ' + ED.scrub.toFixed(2); if (ED.playing) stopPlay(); renderScrub(); };
}
function startPlay() {
  ED.playing = true; $('btnPlay').textContent = 'pause';
  const def = FIG_POSES[ED.move]; const dur = (def && def.dur) || 2400;
  const step = (ts) => {
    if (!ED.playing) return;
    if (isGait(ED.move)) {
      const kind = ED.move === 'run' ? 'run' : 'walk'; const carry = ED.move === 'kb_carry';
      // carry's period is edited via GAIT_PARAMS.carry.dur (the carry slider), not walk.dur
      const gd = (carry && GAIT_PARAMS.carry && GAIT_PARAMS.carry.dur != null) ? GAIT_PARAMS.carry.dur : GAIT_PARAMS[kind].dur;
      ED.scrub = (ts % gd) / gd; renderGaitCanvas($('canvas'));
    } else {
      const t = 0.5 - 0.5 * Math.cos((ts % dur) / dur * 2 * Math.PI);
      ED.scrub = t; $('scrub').value = t.toFixed(2); $('scrubT').textContent = 't ' + t.toFixed(2);
      $('canvas').innerHTML = `<g transform="scale(${SCALE})">${ED.showGrid ? gridMarkup() : ''}${figureInner(lerpPose(def.f1, def.f2, t), { feel: 1 })}</g>`;
    }
    ED.raf = requestAnimationFrame(step);
  };
  ED.raf = requestAnimationFrame(step);
}
function stopPlay() { ED.playing = false; $('btnPlay').textContent = 'play'; if (ED.raf) cancelAnimationFrame(ED.raf); ED.raf = 0; }
// read-only scrub preview of lerpPose(f1,f2,t)
function renderScrub() {
  if (isGait(ED.move)) { renderGaitCanvas($('canvas')); return; }
  const def = FIG_POSES[ED.move];
  $('canvas').innerHTML = `<g transform="scale(${SCALE})">${ED.showGrid ? gridMarkup() : ''}${ED.showOnion && def.f1 ? `<g class="onion">${figureInner(def.f2)}</g>` : ''}${figureInner(lerpPose(def.f1, def.f2, ED.scrub), { feel: 1 })}</g>`;
}

// ============================================================
// GAIT controls (sliders for GAIT_PARAMS)
// ============================================================
const GAIT_SLIDERS = {
  walk: [['dur', 400, 2000, 10], ['torsoLean', 0, 30, 1], ['hipFlex', 0, 60, 1], ['kneeSwing', 0, 100, 1], ['kneeLand', 0, 50, 1], ['armSwing', 0, 60, 1], ['armBend', 0, 120, 1], ['hipX', 15, 35, 0.5], ['hipY', 25, 45, 0.5], ['kneeBase', 0, 30, 1], ['footAngle', -120, 0, 1]],
  run: [['dur', 300, 1500, 10], ['torsoLean', 0, 40, 1], ['hipFlex', 0, 70, 1], ['kneeSwing', 0, 120, 1], ['kneeLand', 0, 60, 1], ['armSwing', 0, 80, 1], ['armBend', 0, 160, 1], ['hipX', 15, 35, 0.5], ['hipY', 25, 45, 0.5], ['kneeBase', 0, 30, 1], ['footAngle', -120, 0, 1]],
  kb_carry: [['dur', 400, 2000, 10], ['nearHand0', 60, 120, 1], ['nearHand1', 60, 120, 1], ['farHand0', 60, 120, 1], ['farHand1', 60, 120, 1]],
};
function gaitParamKey() { return ED.move === 'kb_carry' ? 'carry' : ED.move; }
function buildGaitControls() {
  const box = $('gaitControls'); box.innerHTML = '';
  const pk = gaitParamKey(); const G = GAIT_PARAMS[pk];
  GAIT_SLIDERS[ED.move].forEach(([f, lo, hi, step]) => {
    const row = document.createElement('div'); row.className = 'grow';
    const cur = readGaitField(G, f);
    row.innerHTML = `<label>${f}</label><input type="range" min="${lo}" max="${hi}" step="${step}" value="${cur}"><output>${cur}</output>`;
    const rng = row.querySelector('input'); const out = row.querySelector('output');
    rng.oninput = () => { writeGaitField(G, f, +rng.value); out.textContent = rng.value; renderGaitCanvas($('canvas')); scheduleSave(); };
    box.appendChild(row);
  });
}
function readGaitField(G, f) {
  if (f === 'nearHand0') return G.nearHand[0]; if (f === 'nearHand1') return G.nearHand[1];
  if (f === 'farHand0') return G.farHand[0]; if (f === 'farHand1') return G.farHand[1];
  return G[f];
}
function writeGaitField(G, f, v) {
  if (f === 'nearHand0') G.nearHand[0] = v; else if (f === 'nearHand1') G.nearHand[1] = v;
  else if (f === 'farHand0') G.farHand[0] = v; else if (f === 'farHand1') G.farHand[1] = v;
  else G[f] = v;
}

// ============================================================
// READOUT (selected joint x,y + angle)
// ============================================================
function updateReadout(pose) {
  const el = $('jointReadout');
  if (!pose || !ED.sel) { el.textContent = '—'; return; }
  const H = resolveHandles(pose); const hd = H[ED.sel]; if (!hd) { el.textContent = '—'; return; }
  let ang = '';
  if (hd.kind === 'angle') { const a = Math.atan2(hd.pt[1] - hd.parent[1], hd.pt[0] - hd.parent[0]) / D2R; ang = ' · ∠' + round2(((a % 360) + 360) % 360) + '°'; }
  el.textContent = `${ED.sel} (${round2(hd.pt[0])}, ${round2(hd.pt[1])})${ang}`;
}

// ============================================================
// AUTOSAVE + VERSIONS (talks to tools/figure-save-server.py)
// ============================================================
function setStatus(state, text) {
  const s = $('status'); s.className = 'status' + (state ? ' ' + state : ''); $('statusText').textContent = text;
}
function payload() { return { poses: FIG_POSES, gait: GAIT_PARAMS }; }

async function initSession() {
  setStatus('saving', 'loading…');
  try {
    const r = await fetch('/api/current', { cache: 'no-store' });
    if (r.ok) {
      const cur = await r.json();
      // server is source of truth on open; merge its data into the live globals so the
      // editor edits exactly what's on disk (and the app will load).
      // Only adopt the server's copy when it actually HAS data. An empty {} means the server has
      // nothing saved yet (fresh start, or the hand-authored figure-poses.js couldn't be parsed) —
      // in that case the <script>-loaded globals ARE the on-disk truth and must NOT be wiped.
      if (cur && cur.poses && Object.keys(cur.poses).length) { Object.keys(FIG_POSES).forEach(k => delete FIG_POSES[k]); Object.assign(FIG_POSES, cur.poses); }
      if (cur && cur.gait && Object.keys(cur.gait).length) Object.assign(GAIT_PARAMS, cur.gait);
      buildMoveList(); selectMove(ED.move in FIG_POSES || isGait(ED.move) ? ED.move : 'standing');
    }
    // write the session-start snapshot (restore-to-start safety net)
    await fetch('/api/save', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(Object.assign({ session: ED.sessionId, sessionStart: true }, payload())) });
    ED.startSnapshotDone = true;
    setStatus('ok', 'session ' + ED.sessionId);
    loadVersions();
  } catch (e) {
    setStatus('err', 'offline — start figure-save-server.py');
  }
}

function scheduleSave() {
  setStatus('saving', 'editing…');
  if (ED.saveTimer) clearTimeout(ED.saveTimer);
  ED.saveTimer = setTimeout(saveNow, 400);   // debounce ~400ms
}
async function saveNow() {
  setStatus('saving', 'saving…');
  try {
    const r = await fetch('/api/save', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(Object.assign({ session: ED.sessionId }, payload())) });
    if (!r.ok) throw new Error('save ' + r.status);
    const t = new Date().toLocaleTimeString();
    setStatus('ok', 'saved ' + t);
    loadVersions();
  } catch (e) {
    setStatus('err', 'save failed — is the server up?');
  }
}

function wireVersions() {
  $('btnRefreshVer').onclick = loadVersions;
  $('btnRestoreStart').onclick = () => { const v = ED._startTs; if (v) revertTo(v); else setStatus('err', 'no session-start snapshot yet'); };
  $('btnAddProp').onclick = addProp;
  $('btnCopyFrom').onclick = doCopyFrom;
}
async function loadVersions() {
  try {
    const r = await fetch('/api/versions?session=' + encodeURIComponent(ED.sessionId), { cache: 'no-store' });
    if (!r.ok) return;
    const list = await r.json();   // [{ts, sessionStart?}, ...] newest first
    if (Array.isArray(list) && list.length) { const start = list.find(v => v.sessionStart); if (start) ED._startTs = start.ts; }
    renderVersions(list);
  } catch (e) { /* server may not implement versions yet */ }
}
function renderVersions(list) {
  const ul = $('versionList'); ul.innerHTML = '';
  if (!Array.isArray(list) || !list.length) { const e = document.createElement('li'); e.textContent = 'no versions yet'; ul.appendChild(e); return; }
  list.forEach(v => {
    const li = document.createElement('li'); if (v.sessionStart) li.className = 'start';
    const ts = document.createElement('span'); ts.className = 'vts'; ts.textContent = (v.sessionStart ? '★ start · ' : '') + fmtTs(v.ts);
    const btn = document.createElement('button'); btn.className = 'tbtn rev'; btn.textContent = 'revert';
    btn.onclick = () => revertTo(v.ts);
    li.appendChild(ts); li.appendChild(btn); ul.appendChild(li);
  });
}
// Snapshot timestamps are filename-safe (colons in the time replaced with dashes, e.g.
// 2026-06-20T18-05-15.731321Z); normalize back to ISO before Date-parsing so it doesn't show "Invalid Date".
function fmtTs(ts) { try { const d = new Date(String(ts).replace(/T(\d{2})-(\d{2})-(\d{2})/, 'T$1:$2:$3')); return isNaN(d) ? ts : d.toLocaleString(); } catch (_) { return ts; } }
async function revertTo(ts) {
  setStatus('saving', 'reverting…');
  try {
    const r = await fetch('/api/revert', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ session: ED.sessionId, ts }) });
    if (!r.ok) throw new Error('revert ' + r.status);
    const data = await r.json();   // { poses, gait } payload of that snapshot
    if (data && data.poses) { Object.keys(FIG_POSES).forEach(k => delete FIG_POSES[k]); Object.assign(FIG_POSES, data.poses); }
    if (data && data.gait) Object.assign(GAIT_PARAMS, data.gait);
    buildMoveList(); selectMove(ED.move in FIG_POSES || isGait(ED.move) ? ED.move : 'standing');
    // reverting also becomes the new current + a fresh snapshot (server writes it on revert)
    setStatus('ok', 'reverted to ' + fmtTs(ts));
    loadVersions();
  } catch (e) { setStatus('err', 'revert failed'); }
}

// ---- go ----
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
