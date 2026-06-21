#!/usr/bin/env python3
"""Package The Hard Part as a self-contained ZIP for installing on a phone (PWA via Termux).

Bundles ONLY the runtime app (no git/docs/dev-tools/data), plus a Termux launcher and
install instructions, under a top-level `hard-part/` folder. Output: hard-part-app.zip at repo root.

Run:  python tools/package-app.py
"""
import os, zipfile, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, 'hard-part-app.zip')
TOP = 'hard-part'   # folder name inside the zip

# Runtime files the installed app needs (must match the SW shell + index.html refs).
FILES = [
    'index.html', 'manifest.json', 'sw.js', '.nojekyll',
    'logo.png', 'icon.png', 'icon-192.png', 'icon-512.png', 'icon-maskable-512.png',
    'css/base.css', 'css/components.css', 'css/figures.css', 'css/screens.css',
    'js/sprite.js', 'js/config.js', 'js/state.js', 'js/program.js',
    'js/figure-poses.js', 'js/figure.js', 'js/engine.js', 'js/storage.js',
    'js/util.js', 'js/ui.js', 'js/screens.js', 'js/init.js',
    'fonts/fraunces-latin-var.woff2', 'fonts/ibm-plex-sans-latin-var.woff2',
    'fonts/ibm-plex-mono-latin-400.woff2', 'fonts/ibm-plex-mono-latin-500.woff2',
]

START_SH = """#!/data/data/com.termux/files/usr/bin/bash
# The Hard Part — local launcher (Termux). Serves the app on a FIXED port so the installed
# PWA keeps the same origin (and therefore your saved data) every time. Do not change the port.
cd "$(dirname "$0")" || exit 1
PORT=8801
echo ""
echo "  The Hard Part is serving at:  http://localhost:$PORT"
echo "  -> Open that URL in Chrome, then  Menu (3 dots) -> Install app / Add to Home screen."
echo "  -> Keep this running during install + the first launch. After that it works offline."
echo "  (Press Ctrl+C to stop the server.)"
echo ""
python -m http.server $PORT --bind 127.0.0.1
"""

INSTALL_MD = """# The Hard Part - install on your phone (offline, just for you)

This is the whole app in one folder. No GitHub, no account, no internet needed after install.
Your data stays on this phone (back it up from Settings -> Export now).

## One-time setup (Termux)

1. Install **Termux** (from F-Droid or the Play Store) and open it.
2. Install Python + unzip (first time only):
   ```
   pkg update -y && pkg install -y python unzip
   ```
3. Get this `hard-part-app.zip` onto the phone (Downloads is fine), then in Termux:
   ```
   cd ~/storage/downloads        # (run `termux-setup-storage` once if this folder is missing)
   unzip -o hard-part-app.zip
   cd hard-part
   bash start.sh
   ```
   (If `~/storage/downloads` isn't there, just `unzip` wherever the file is and `cd hard-part`.)
4. You'll see: `serving at http://localhost:8801`. Open **Chrome**, go to **http://localhost:8801**.
5. Chrome menu (3 dots) -> **Install app** (or **Add to Home screen**). Tap **Install**.
6. An icon appears on your home screen. Open it from there - it runs fullscreen, like an app.

That's it. After the first launch you can close Termux; the app opens offline from the icon.

## Keep your data safe

- It lives only on this phone. In the app: **Settings** (gear) shows "on-device storage: protected"
  once Android grants persistent storage (tap it if it says best-effort).
- Use **Export now** on the Today screen (or Settings -> Export) every so often to save a backup
  file you can keep in Google Drive / email. **Import** restores it on a new phone.

## Updating later (optional)

The installed copy doesn't auto-update (there's no server). To apply a newer version:
1. Replace the `hard-part` folder with the new files, `bash start.sh` again.
2. Open the home-screen app **once while the server is running** - it pulls the new version,
   then works offline again.

## Notes

- Always use port **8801** - the app's saved data is tied to `localhost:8801`.
- iPhone: same idea but use Safari -> Share -> Add to Home Screen (you still need a local
  server; Termux is Android-only, so on iOS use any local-server app).
"""

def main():
    missing = [f for f in FILES if not os.path.exists(os.path.join(ROOT, f))]
    if missing:
        print('MISSING runtime files:', missing); sys.exit(1)
    if os.path.exists(OUT):
        os.remove(OUT)
    with zipfile.ZipFile(OUT, 'w', zipfile.ZIP_DEFLATED) as z:
        for f in FILES:
            z.write(os.path.join(ROOT, f), f'{TOP}/{f}')
        z.writestr(f'{TOP}/start.sh', START_SH)
        z.writestr(f'{TOP}/INSTALL.md', INSTALL_MD)
    size = os.path.getsize(OUT)
    with zipfile.ZipFile(OUT) as z:
        n = len(z.namelist())
    print(f'OK wrote {OUT}  ({n} entries, {size//1024} KB)')

if __name__ == '__main__':
    main()
