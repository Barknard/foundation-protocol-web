#!/usr/bin/env python3
"""figure-save-server.py — local dev server for The Hard Part figure animation editor.

Serves the repo root statically (drop-in replacement for `python -m http.server 8801`
while editing) AND accepts editor autosaves:

  GET  /api/current                     -> {poses, gait} reflecting the live js/figure-poses.js
  POST /api/save     {poses, gait}      -> rewrite js/figure-poses.js + snapshot
  GET  /api/versions ?session=<id>      -> [{ts, sessionStart}, ...] newest-first for a session
  POST /api/revert   {session, ts}      -> rewrite + snapshot the reverted state, return {poses, gait}

Stdlib only, no build step. The ONLY files this server ever writes are
js/figure-poses.js and paths under .figure-versions/ — every other write path is rejected.
"""
import json
import math
import os
import re
import sys
import threading
from datetime import datetime, timezone
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import urlparse, parse_qs

PORT = 8801
# repo root = parent of this tools/ dir
ROOT = Path(__file__).resolve().parent.parent
POSES_FILE = ROOT / 'js' / 'figure-poses.js'
VERSIONS_DIR = ROOT / '.figure-versions'

# ------------------------------------------------------------------
# Deterministic pretty serialization — numbers rounded like the renderer's _n
# (figure.js: `Math.round(v*100)/100`, i.e. <=2 decimals). 2-space indent, stable key order.
# ------------------------------------------------------------------
def _n(v):
    """Round numbers to <=2 decimals to match figure.js _n; pass non-numbers through.

    figure.js uses `Math.round(v*100)/100`, which is round-HALF-UP (toward +inf for the
    boundary), NOT Python's banker's rounding. Replicate Math.round exactly: for a value v,
    Math.round(x) == floor(x + 0.5); applied symmetrically about zero so -2.5 -> -2 like JS
    would (Math.round(-2.5) === -2). We implement |v| with floor(.. + .5) then re-sign.
    """
    if isinstance(v, bool):  # bool is an int subclass — keep as-is
        return v
    if isinstance(v, (int, float)):
        f = float(v)
        # round-half-up on the magnitude, matching JS Math.round semantics
        r = math.floor(abs(f) * 100 + 0.5) / 100 * (1 if f >= 0 else -1)
        # collapse -0.0 and integral floats so 5.0 -> 5 (matches JS number printing)
        if r == int(r):
            return int(r)
        return r
    return v


def _round_tree(node):
    """Recursively round every number in a poses/gait tree (lists + dicts)."""
    if isinstance(node, dict):
        return {k: _round_tree(v) for k, v in node.items()}
    if isinstance(node, list):
        return [_round_tree(v) for v in node]
    return _n(node)


def _js_object(rounded):
    """Pretty JSON (2-space) for an already-rounded FIG_POSES / GAIT_PARAMS value."""
    return json.dumps(rounded, indent=2, ensure_ascii=False)


def serialize(poses_rounded, gait_rounded):
    """Build the exact figure-poses.js text the spec mandates from ALREADY-ROUNDED trees.

    Callers must pass trees that have been through _round_tree, so the bytes written to
    js/figure-poses.js and the bytes stored in the snapshot derive from the SAME rounded
    values (revert -> save is then a no-op, never drifting).
    """
    return ("'use strict';\n"
            "const FIG_POSES = " + _js_object(poses_rounded) + ";\n"
            "const GAIT_PARAMS = " + _js_object(gait_rounded) + ";\n")


# ------------------------------------------------------------------
# Atomic write of the live figure-poses.js (temp file in same dir -> os.replace).
# A crash mid-write can never leave a half-written file that bricks the app.
# ------------------------------------------------------------------
def write_poses_file(poses_rounded, gait_rounded):
    """Write js/figure-poses.js atomically from already-rounded trees."""
    text = serialize(poses_rounded, gait_rounded)
    tmp = POSES_FILE.with_name(POSES_FILE.name + '.tmp')
    tmp.write_text(text, encoding='utf-8')
    os.replace(str(tmp), str(POSES_FILE))  # atomic on the same filesystem


# ------------------------------------------------------------------
# In-memory authoritative copy of the current on-disk state. Updated on every
# /api/save and /api/revert; initialized on startup from js/figure-poses.js.
# Guarded by a lock since ThreadingHTTPServer handles requests concurrently.
# ------------------------------------------------------------------
_CURRENT = {'poses': {}, 'gait': {}}
_CURRENT_LOCK = threading.Lock()


def _slice_literal(text, marker):
    """Extract the JS object/array literal that follows `const <marker> = ` up to ';\\n'.

    Tolerant by design: returns the substring between 'const <marker> = ' and the next
    ';\\n' (the serializer always ends each declaration that way). Returns None if not found.
    """
    head = 'const ' + marker + ' = '
    i = text.find(head)
    if i < 0:
        return None
    start = i + len(head)
    end = text.find(';\n', start)
    if end < 0:
        return None
    return text[start:end]


def load_current_from_disk():
    """Initialize _CURRENT from js/figure-poses.js using a tolerant parse.

    Slices out the FIG_POSES / GAIT_PARAMS literals and json.loads them. The hand-authored
    file may use JS-only syntax (unquoted keys, trailing commas, comments) that isn't valid
    JSON; if either parse fails we fall back to empty dicts. The client tolerates empty
    ({}), and the editor's first /api/save immediately makes _CURRENT authoritative.
    """
    poses, gait = {}, {}
    try:
        text = POSES_FILE.read_text(encoding='utf-8')
        praw = _slice_literal(text, 'FIG_POSES')
        graw = _slice_literal(text, 'GAIT_PARAMS')
        if praw is not None:
            p = json.loads(praw)
            if isinstance(p, dict):
                poses = p
        if graw is not None:
            g = json.loads(graw)
            if isinstance(g, dict):
                gait = g
    except (OSError, ValueError):
        poses, gait = {}, {}
    with _CURRENT_LOCK:
        _CURRENT['poses'] = poses
        _CURRENT['gait'] = gait


def get_current():
    """Snapshot of the in-memory current state (returns plain dicts, safe to serialize)."""
    with _CURRENT_LOCK:
        return {'poses': _CURRENT['poses'], 'gait': _CURRENT['gait']}


def set_current(poses, gait):
    """Replace the in-memory current state."""
    with _CURRENT_LOCK:
        _CURRENT['poses'] = poses
        _CURRENT['gait'] = gait


# ------------------------------------------------------------------
# Snapshots — .figure-versions/<sessionId>/<ISO-timestamp>.json holds the full payload.
# ------------------------------------------------------------------
_SAFE_SESSION = re.compile(r'^[A-Za-z0-9_-]+$')
_SAFE_TS = re.compile(r'^[A-Za-z0-9_.+-]+$')  # ISO ts with ':' replaced by '-'


def _session_dir(session):
    """Resolve + validate a session dir strictly under .figure-versions/."""
    if not session or not _SAFE_SESSION.match(session):
        return None
    d = (VERSIONS_DIR / session).resolve()
    try:
        d.relative_to(VERSIONS_DIR.resolve())  # reject traversal
    except ValueError:
        return None
    return d


def _iso_ts():
    """UTC ISO timestamp, filename-safe (':' -> '-')."""
    return datetime.now(timezone.utc).strftime('%Y-%m-%dT%H-%M-%S.%fZ')


def write_snapshot(session, payload):
    d = _session_dir(session)
    if d is None:
        return None
    d.mkdir(parents=True, exist_ok=True)
    ts = _iso_ts()
    (d / (ts + '.json')).write_text(json.dumps(payload, ensure_ascii=False), encoding='utf-8')
    return ts


def list_snapshots(session):
    """Return [{ts, sessionStart}, ...] NEWEST-FIRST for a session.

    `ts` is the filename stem (the same identifier /api/revert expects). `sessionStart`
    is read back from each snapshot's stored JSON flag. Snapshots that fail to parse are
    treated as non-start so the list still renders.
    """
    d = _session_dir(session)
    if d is None or not d.is_dir():
        return []
    out = []
    for ts in sorted((p.stem for p in d.glob('*.json')), reverse=True):  # newest first
        start = False
        try:
            data = json.loads((d / (ts + '.json')).read_text(encoding='utf-8'))
            start = bool(isinstance(data, dict) and data.get('sessionStart'))
        except (OSError, ValueError):
            start = False
        out.append({'ts': ts, 'sessionStart': start})
    return out


def read_snapshot(session, ts):
    d = _session_dir(session)
    if d is None or not ts or not _SAFE_TS.match(ts):
        return None
    f = (d / (ts + '.json')).resolve()
    try:
        f.relative_to(d)  # must stay inside the session dir
    except ValueError:
        return None
    if not f.is_file():
        return None
    return json.loads(f.read_text(encoding='utf-8'))


# ------------------------------------------------------------------
# HTTP handler — static file server (repo root) + the /api/* endpoints.
# ------------------------------------------------------------------
class Handler(BaseHTTPRequestHandler):
    server_version = 'FigureSaveServer/1.0'

    def _send_json(self, obj, status=200):
        body = json.dumps(obj).encode('utf-8')
        self.send_response(status)
        self.send_header('Content-Type', 'application/json; charset=utf-8')
        self.send_header('Content-Length', str(len(body)))
        self.send_header('Cache-Control', 'no-store')
        self.end_headers()
        self.wfile.write(body)

    def _read_body(self):
        n = int(self.headers.get('Content-Length') or 0)
        if n <= 0:
            return {}
        return json.loads(self.rfile.read(n).decode('utf-8'))

    # -- GET: /api/current, /api/versions, else static file from repo root ----
    def do_GET(self):
        parsed = urlparse(self.path)
        if parsed.path == '/api/current':
            # reflect the live on-disk state (in-memory copy, init'd from figure-poses.js).
            # Always 200; falls back to {poses:{}, gait:{}} which the client tolerates.
            return self._send_json(get_current())
        if parsed.path == '/api/versions':
            session = (parse_qs(parsed.query).get('session') or [''])[0]
            if _session_dir(session) is None:
                return self._send_json({'error': 'bad session'}, 400)
            # TOP-LEVEL ARRAY, newest-first: [{ts, sessionStart}, ...]
            return self._send_json(list_snapshots(session))
        return self._serve_static(parsed.path, head=False)

    def do_HEAD(self):
        self._serve_static(urlparse(self.path).path, head=True)

    # -- POST: /api/save, /api/revert ----------------------------------------
    def do_POST(self):
        parsed = urlparse(self.path)
        try:
            body = self._read_body()
        except (ValueError, json.JSONDecodeError):
            return self._send_json({'error': 'bad json'}, 400)

        if parsed.path == '/api/save':
            poses, gait = body.get('poses'), body.get('gait')
            if not isinstance(poses, dict) or not isinstance(gait, dict):
                return self._send_json({'error': 'save needs {poses, gait} objects'}, 400)
            session = body.get('session') or 'unsessioned'
            if _session_dir(session) is None:
                return self._send_json({'error': 'bad session'}, 400)
            session_start = bool(body.get('sessionStart'))
            # Round ONCE; the SAME rounded trees feed both the file and the snapshot,
            # so disk == snapshot and a later revert->save is a stable no-op.
            poses_r = _round_tree(poses)
            gait_r = _round_tree(gait)
            try:
                # Snapshot BEFORE overwriting the live file: a crash still leaves the backstop.
                ts = write_snapshot(session, {'poses': poses_r, 'gait': gait_r,
                                              'sessionStart': session_start})
                # SAFETY: write_poses_file() + POSES_FILE is the ONLY library write path
                # (atomic: temp file in same dir -> os.replace).
                write_poses_file(poses_r, gait_r)
            except OSError as e:
                return self._send_json({'error': 'write failed: %s' % e}, 500)
            set_current(poses_r, gait_r)  # in-memory current now matches disk
            return self._send_json({'ok': True, 'wrote': 'js/figure-poses.js', 'session': session, 'ts': ts})

        if parsed.path == '/api/revert':
            session, ts = body.get('session'), body.get('ts')
            snap = read_snapshot(session, ts)
            if snap is None:
                return self._send_json({'error': 'snapshot not found'}, 404)
            poses = snap.get('poses') if isinstance(snap, dict) else None
            gait = snap.get('gait') if isinstance(snap, dict) else None
            if not isinstance(poses, dict) or not isinstance(gait, dict):
                return self._send_json({'error': 'snapshot malformed'}, 500)
            # The snapshot was stored already-rounded; round again is idempotent and safe.
            poses_r = _round_tree(poses)
            gait_r = _round_tree(gait)
            try:
                # (a) rewrite the live file from the reverted state (atomic), then
                # (b) write a NEW snapshot so disk == reverted state has a backstop too.
                write_poses_file(poses_r, gait_r)
                write_snapshot(session, {'poses': poses_r, 'gait': gait_r, 'sessionStart': False})
            except OSError as e:
                return self._send_json({'error': 'revert write failed: %s' % e}, 500)
            set_current(poses_r, gait_r)  # (c) in-memory current now matches reverted disk
            # return the reverted payload (client merges {poses, gait})
            return self._send_json({'ok': True, 'session': session, 'ts': ts,
                                    'poses': poses_r, 'gait': gait_r})

        return self._send_json({'error': 'unknown endpoint'}, 404)

    # -- static file serving, sandboxed to the repo root ---------------------
    _MIME = {
        '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
        '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8',
        '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
        '.svg': 'image/svg+xml', '.ico': 'image/x-icon', '.webmanifest': 'application/manifest+json',
        '.woff': 'font/woff', '.woff2': 'font/woff2', '.map': 'application/json',
    }

    def _resolve(self, url_path):
        """Map a URL path to a file strictly inside ROOT, or None if it escapes."""
        rel = url_path.lstrip('/')
        if rel == '' or rel.endswith('/'):
            rel += 'index.html'
        target = (ROOT / rel).resolve()
        try:
            target.relative_to(ROOT)  # reject any ../ traversal
        except ValueError:
            return None
        if target.is_dir():
            target = (target / 'index.html')
        return target

    def _serve_static(self, url_path, head):
        target = self._resolve(url_path)
        if target is None:
            return self._send_json({'error': 'forbidden'}, 403)
        if not target.is_file():
            return self._send_json({'error': 'not found'}, 404)
        try:
            data = target.read_bytes()
        except OSError:
            return self._send_json({'error': 'not found'}, 404)
        ctype = self._MIME.get(target.suffix.lower(), 'application/octet-stream')
        self.send_response(200)
        self.send_header('Content-Type', ctype)
        self.send_header('Content-Length', str(len(data)))
        self.send_header('Cache-Control', 'no-store')  # dev: never cache, avoids SW staleness
        self.end_headers()
        if not head:
            self.wfile.write(data)

    def log_message(self, fmt, *args):  # terser one-line access log
        sys.stderr.write('  %s - %s\n' % (self.address_string(), fmt % args))


def _banner(port):
    line = '=' * 64
    print(line)
    print(' The Hard Part — figure save-server')
    print(line)
    print(' Port           : %d' % port)
    print(' Serving        : %s  (the full app, statically)' % ROOT)
    print(' Also accepts   : editor autosaves -> js/figure-poses.js + .figure-versions/')
    print(' Endpoints      : GET /api/current  POST /api/save  GET /api/versions  POST /api/revert')
    print(' Editor URL     : http://localhost:%d/tools/figure-editor.html' % port)
    print(' App URL        : http://localhost:%d/' % port)
    print(line)
    print(' (Replaces `python -m http.server %d` while editing figures.)' % port)
    sys.stdout.flush()


def main():
    port = PORT
    if len(sys.argv) > 1:
        try:
            port = int(sys.argv[1])
        except ValueError:
            sys.exit('usage: figure-save-server.py [port]')
    load_current_from_disk()  # seed the in-memory /api/current copy from js/figure-poses.js
    httpd = ThreadingHTTPServer(('localhost', port), Handler)
    _banner(port)
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print('\nstopped.')
        httpd.server_close()


if __name__ == '__main__':
    main()
