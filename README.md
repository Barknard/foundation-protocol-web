# The Hard Part

A 40-week, research-grounded program to get in shape without getting hurt, built for people around 40 and up. It runs as an offline-first PWA, and the whole daily interaction is two taps.

**The whole daily interaction is two taps:**

1. Did you meet today's goal? -> Done / Partial / Missed
2. How do you feel? -> Great / Good / OK / Rough / Wrecked

From those two answers the app gives one of four calls, each grounded in training research:

- **Progress** — move to the next session
- **Repeat** — run the same session again
- **Modify** — same session, easier variation
- **Rest** — take today off

Nothing to type. The only typing in the entire app is the one-time profile at the start.

---

## How the call is made

| You answer | The app says |
|---|---|
| Flagged sharp pain | **Rest** — stop, check the pain, see a physio if it persists |
| Feel Wrecked | **Rest** |
| Feel Rough | **Modify** (easier variation of the same session) |
| Done + feel Good or Great | **Progress** (advance to the next session) |
| Done + feel OK | **Repeat** (hold; consolidate before adding load) |
| Partial or Missed (feeling fine) | **Repeat** (run the same session again) |

The principle is autoregulation: load only goes up when you did the work **and** feel recovered. The calendar does not push you forward; your readiness does. Only a **Progress** call advances the session pointer. Repeat, Modify, and Rest all hold you on the same session until you are ready.

### A note on the simplification

The original program used a weekly 4-item Hooper Index (sleep, stress, fatigue, soreness). This version collapses that into a single daily readiness tap. That is a deliberate trade: a single-item readiness rating is less granular, but subjective readiness still tracks training response better than objective markers (Saw, Main and Gastin, BJSM 2016), and a daily one-tap check gets answered where a weekly four-slider form gets skipped. If you ever want the richer weekly version back, it is a small change to the decision engine.

---

## Your data

Strictly local-first. Everything lives in this browser's `localStorage`, scoped per persona. Nothing is sent anywhere — there is no account, no login, no token, and no personal data ever leaves the device.

To back up your progress or move to a new device, use **Settings -> Export backup** to download a JSON file, and **Import backup** to load it on the other device. A **Reset** auto-saves a backup first, so you cannot wipe yourself out by accident. You can also opt in to persistent storage so the browser does not evict your data.

---

## Architecture

Zero build step. The app is a set of plain static files:

```
the-hard-part/
|- index.html       <- slim HTML spine
|- css/             <- stylesheets
|- js/              <- app modules, loaded as ordered classic <script> tags
|- sw.js            <- service worker (offline cache)
|- manifest.json    <- PWA manifest
\- icons/, fonts/   <- app icon and Fraunces typeface
```

No bundler, no module loader — the `js/` files are loaded in order as classic `<script>` tags. `sw.js` caches the shell so the app works offline and launches from the home screen.

---

## Run / host

It is just static files.

**Locally:**

```bash
python -m http.server 8801
```

Then open `http://localhost:8801`.

**On the web — GitHub Pages:** in the repo, **Settings -> Pages -> Deploy from a branch -> `main` / root -> Save**. Pages serves the PWA at:

```
https://barknard.github.io/foundation-protocol-web/
```

Open that on any device and add it to your home screen:

- **iPhone / Safari:** Share -> Add to Home Screen.
- **Android / Chrome:** menu -> Add to Home screen -> Install.

It opens like a native app.

## Updating the app

Edit the `css/`/`js/` files (or the `index.html` spine), bump the `CACHE` constant in `sw.js` so clients pick up the new shell, and push to `main`. GitHub Pages redeploys within a minute or so. No build step. User data is untouched, because it lives locally in each browser, not in the deploy.

## Android

A sideloadable debug APK is published on the GitHub Releases page under the tag `apk`:

```
https://github.com/Barknard/foundation-protocol-web/releases/download/apk/TheHardPart.apk
```

Download it on the phone, tap to install, and allow installs from this source when prompted.

---

## The four tabs

- **Today** — the current session's plan (PT + strength/cardio + walk). Tap any prescription item to reveal its exercises inline, each with an animated figure, prescription, and coaching cue. A single "Daily check-in" button, and once you have checked in, today's call.
- **Library** — all 19 exercises with animated step figures (each cycles between two poses to show the movement), grouped by category. Tap any for steps and a coaching cue.
- **Progress** — where you are in the program, a readiness trend line (your "how do you feel" over time), adherence over the last 14 check-ins, and the all-time tally of the four calls. All of it built from the two-tap data; nothing to enter.
- **Phase** — all five phases (Infrastructure -> Foundation -> Run Introduction -> Build -> Target) with summary, focus, exit criteria, and the full sample week.

## What I am deliberately not doing

No streak counter that resets on a miss. No badges, no leaderboard, no "X% of users like you finished today." Those mechanisms route through guilt, which raises short-term opens at the cost of long-term adherence by undermining the autonomy and competence that actually predict continued use. The app's only persuasion is showing you the call and the research behind it.

## Evidence base

Cited in-app under Settings -> Evidence base:

- Hooper SL et al. Markers for monitoring overtraining and recovery. Med Sci Sports Exerc 1995;27(1):106-112.
- Saw AE, Main LC, Gastin PB. Subjective self-reported measures trump objective measures: a systematic review. Br J Sports Med 2016;50(5):281-291.
- Lally P et al. How are habits formed: modelling habit formation in the real world. Eur J Soc Psychol 2010;40(6):998-1009.
- Kokkinos P et al. J Am Coll Cardiol 2022;80(6):598-609.
- Kokura Y et al. Clin Nutr ESPEN 2024;63:417-426.
- Nielsen Norman Group. Dark Mode: How Users Think About It. 2023.

## License

Personal use. Distribute as you wish.
