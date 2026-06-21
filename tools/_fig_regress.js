'use strict';
// ============================================================
// FIGURE REGRESSION HARNESS (Node, zero-dep)
// ------------------------------------------------------------
// Loads js/figure.js (and js/figure-poses.js after the data split) inside a vm
// sandbox with stubbed browser globals, then renders EVERY pose (figureInner on
// f1/f2) + each gait kind to inner-SVG strings. The props→data, gait-params and
// data-split refactor must NOT change any of these strings (float-tolerant diff
// lives elsewhere — here we capture/dump the exact render map).
//
//   node tools/_fig_regress.js capture [outfile]   write the render map to JSON
//                                                   (default: tools/.fig-baseline.json)
//   node tools/_fig_regress.js dump                 print the current render map JSON
//
// The app shares ONE global scope (classic <script> tags), so we evaluate each
// file in a single shared vm context — exactly mirroring the browser's load order.
// ============================================================
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.resolve(__dirname, '..');
const FIGURE_JS = path.join(ROOT, 'js', 'figure.js');
const FIGURE_POSES_JS = path.join(ROOT, 'js', 'figure-poses.js');
const DEFAULT_OUT = path.join(__dirname, '.fig-baseline.json');

// Browser globals figure.js touches (at load time: requestAnimationFrame; at call
// time: window.matchMedia, window.innerHeight, document.querySelectorAll,
// document.getElementById). Stub them so load + render never throws.
function makeSandbox() {
  const sandbox = {
    window: {
      matchMedia: () => ({ matches: false }),
      innerHeight: 800,
    },
    document: {
      querySelectorAll: () => [],
      getElementById: () => null,
    },
    requestAnimationFrame: () => 0,
    cancelAnimationFrame: () => {},
    console,
    Math,
    Date,
    JSON,
    Object,
    Array,
    String,
    Number,
  };
  sandbox.globalThis = sandbox;
  return sandbox;
}

// Evaluate a file in the shared context (mirrors a classic <script> tag).
function loadInto(ctx, file) {
  const code = fs.readFileSync(file, 'utf8');
  vm.runInContext(code, ctx, { filename: file });
}

// Build a fully-loaded context with FIG_POSES + renderers available as globals.
// Detect which file defines FIG_POSES: if figure.js still contains it (pre-split),
// load only figure.js; once it's been moved out, load figure-poses.js FIRST.
function buildContext() {
  const ctx = vm.createContext(makeSandbox());
  const figureSrc = fs.readFileSync(FIGURE_JS, 'utf8');
  const figureDefinesPoses = /\b(?:const|let|var)\s+FIG_POSES\b/.test(figureSrc);
  if (!figureDefinesPoses) {
    if (!fs.existsSync(FIGURE_POSES_JS)) {
      throw new Error('figure.js does not define FIG_POSES and js/figure-poses.js is missing');
    }
    loadInto(ctx, FIGURE_POSES_JS);   // defines FIG_POSES (+ GAIT_PARAMS) post-split
  }
  loadInto(ctx, FIGURE_JS);           // defines FIG, resolvers, renderers, gait
  return ctx;
}

// Render the whole figure set to a deterministic { key -> {f1, f2} } map plus the
// procedural gait frames. opts.feel is left default (undefined) so the static
// capture is stable; figureInner uses feel only for intensity opacity (==1 default).
//
// NOTE: `const FIG_POSES = …` in a classic <script> is a top-level LEXICAL binding,
// so under vm it is NOT a property of the context object — it can only be reached by
// evaluating code IN the same context. We therefore build the whole map via an
// in-context expression (which sees the lexical consts + function decls) and hand
// back a plain JSON-safe object.
function renderMap(ctx) {
  const builder = `(function () {
    if (typeof FIG_POSES === 'undefined') throw new Error('FIG_POSES not found after load');
    if (typeof figureInner !== 'function') throw new Error('figureInner not found after load');
    var poses = {};
    Object.keys(FIG_POSES).forEach(function (key) {
      var def = FIG_POSES[key];
      poses[key] = { f1: figureInner(def.f1), f2: figureInner(def.f2) };
    });
    var gait = {};
    if (typeof _gaitPose === 'function' && typeof _gaitInner === 'function') {
      var phases = [0, 0.25, 0.5, 0.75];
      ['walk', 'run'].forEach(function (kind) {
        var k = {};
        phases.forEach(function (ph) { k['p' + ph] = _gaitInner(_gaitPose(kind, ph, false), false); });
        gait[kind] = k;
      });
      var carry = {};
      phases.forEach(function (ph) { carry['p' + ph] = _gaitInner(_gaitPose('walk', ph, true), true); });
      gait.walk_carry = carry;
    }
    return { poses: poses, gait: gait };
  })()`;
  const result = vm.runInContext(builder, ctx, { filename: 'renderMap' });
  // Deep-copy out of the sandbox into host-realm plain objects (JSON round-trip).
  return JSON.parse(JSON.stringify(result));
}

function main() {
  const mode = process.argv[2] || 'dump';
  const ctx = buildContext();
  const map = renderMap(ctx);

  if (mode === 'capture') {
    const out = process.argv[3] ? path.resolve(process.argv[3]) : DEFAULT_OUT;
    fs.writeFileSync(out, JSON.stringify(map, null, 2));
    const poseCount = Object.keys(map.poses).length;
    const gaitCount = Object.keys(map.gait).length;
    console.log('captured ' + poseCount + ' pose keys + ' + gaitCount + ' gait kinds -> ' + out);
  } else if (mode === 'dump') {
    process.stdout.write(JSON.stringify(map, null, 2) + '\n');
  } else {
    console.error('usage: node tools/_fig_regress.js capture [outfile] | dump');
    process.exit(2);
  }
}

main();
