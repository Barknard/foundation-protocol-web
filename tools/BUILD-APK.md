# Building the Android APK (self-contained, offline, sideloadable)

The Hard Part ships as a static web app, but it can be wrapped into a real Android APK
(a WebView app via **Capacitor**) that installs from a home-screen icon, runs fullscreen,
works fully offline with **no server**, and keeps its data in the app's private storage
(durable — not browser-evictable). This is the "just tap an icon and go" build.

## Prerequisites (already on this machine)
- **Android Studio** — provides the JDK (JBR 21) at `C:\Program Files\Android\Android Studio\jbr`.
- **Android SDK** at `C:\Users\<you>\AppData\Local\Android\Sdk` (build-tools + platforms 34/35/36).
- **Node + npm** (Capacitor CLI).

## Build folder
Build OUTSIDE this repo (keeps the static repo clean). Convention: `C:\Users\<you>\hardpart-apk`.

## Steps

```bash
# 1. Scaffold + copy the web app into www/
BUILD="$HOME/hardpart-apk"; REPO="$HOME/the-hard-part"
rm -rf "$BUILD" && mkdir -p "$BUILD/www" && cd "$BUILD"
cp "$REPO"/index.html "$REPO"/manifest.json "$REPO"/sw.js "$REPO"/.nojekyll \
   "$REPO"/logo.png "$REPO"/icon.png "$REPO"/icon-192.png "$REPO"/icon-512.png "$REPO"/icon-maskable-512.png www/
cp -r "$REPO"/css "$REPO"/js "$REPO"/fonts www/

# 2. Capacitor
npm init -y
npm install @capacitor/core @capacitor/cli @capacitor/android
npx cap init "The Hard Part" com.hardpart.app --web-dir www
npx cap add android
```

```
# 3. Tell Gradle where the SDK is. CRITICAL: use FORWARD SLASHES — a .properties file
#    treats backslashes as escapes, which corrupts the path ("filename syntax incorrect").
#    android/local.properties:
sdk.dir=C:/Users/<you>/AppData/Local/Android/Sdk
```

```bash
# 4. Launcher icon + splash from the brand art (PIL):
#    assets/icon-only.png (1024, emblem on #1A1614), icon-background.png (#1A1614),
#    icon-foreground.png (emblem ~62% centered, transparent),
#    splash.png / splash-dark.png (full logo.png ~34% on #1A1614, 2732x2732).
npm install -D @capacitor/assets
npx capacitor-assets generate --android
npx cap sync android
```

```powershell
# 5. Build the debug APK. Run Gradle via PowerShell (not Git Bash) with JAVA_HOME = JBR.
$env:JAVA_HOME = "C:\Program Files\Android\Android Studio\jbr"
cd "$HOME\hardpart-apk\android"
.\gradlew.bat assembleDebug --no-daemon
# Output: android\app\build\outputs\apk\debug\app-debug.apk
```

## Gotchas (learned the hard way)
- **`local.properties` must use forward slashes** (see step 3) — backslashes break the build.
- **Run Gradle from PowerShell**, with `JAVA_HOME` pointing at Android Studio's `jbr`.
- The APK is **debug-signed** — fine for personal sideloading; Play Protect will warn "unsafe app"
  (it just means not Google-signed). A Play release would need a real signing key.
- `server.androidScheme` defaults to `https` (Capacitor 3+), so the WebView origin is
  `https://localhost` → the service worker registers and `localStorage` persists in app storage.

## Updating the app
Re-copy the changed web files into `www/`, `npx cap sync android`, then re-run step 5.
Reinstall the APK on the phone (data survives a reinstall/update; it's cleared only by uninstall).

## Install on the phone
Transfer `app-debug.apk` to the phone → tap it → allow "install unknown apps" for that source →
Install → tap the **The Hard Part** icon. No server, no Termux, offline.

## Publish for download (GitHub Release)
GitHub **Pages** is blocked account-wide (Actions disabled for `Barknard`), but a GitHub
**Release** still serves binaries on a public repo — a no-login download link you can open
on the phone. The repo is `Barknard/foundation-protocol-web` (public). We use a single
**stable tag `apk`** so the download URL never changes across rebuilds.

Stable links (open on the phone):
- Release page: `https://github.com/Barknard/foundation-protocol-web/releases/tag/apk`
- Direct APK:   `https://github.com/Barknard/foundation-protocol-web/releases/download/apk/TheHardPart.apk`

**First publish (one time — the `apk` release already exists, so you won't need this again):**
```bash
gh release create apk ~/TheHardPart.apk -R Barknard/foundation-protocol-web \
  -t "The Hard Part — Android APK" -n "Sideloadable debug APK (offline, no server)."
```

**Republish after a rebuild (the normal path):** rebuild the APK (the "Updating the app"
section above → copy `www/`, `npx cap sync android`, Gradle step 5), copy it to
`~/TheHardPart.apk`, then overwrite the release asset in place — the URL stays the same:
```bash
cp ~/hardpart-apk/android/app/build/outputs/apk/debug/app-debug.apk ~/TheHardPart.apk
gh release upload apk ~/TheHardPart.apk --clobber -R Barknard/foundation-protocol-web
```
`--clobber` replaces the existing `TheHardPart.apk` asset, so the link above always serves
the newest build. (Needs `gh auth status` = logged in as `Barknard`.)
