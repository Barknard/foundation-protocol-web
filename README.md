# Foundation Protocol — Web

A single-file web app that runs the 40-week training program as a daily two-tap decision. Open from any browser, anywhere. Your data saves to your GitHub repo on every check-in, so the git history is your training log.

**The whole daily interaction is two taps:**

1. Did you meet today's goal? -> Done / Partial / Missed
2. How do you feel? -> Great / Good / OK / Rough / Wrecked

From those two answers the app gives one of four calls, each grounded in training research:

- **Progress** — move to the next session
- **Repeat** — run the same session again
- **Modify** — same session, easier variation
- **Rest** — take today off

Nothing to type. The only typing in the entire app is the one-time profile at the start.

```
foundation-web/
|- index.html       <- the entire app (86 KB, self-contained)
|- README.md        <- this file
\- data/.gitkeep    <- placeholder; the app writes data here
```

---

## How the call is made

The decision logic lives in `index.html` (search for "DECISION ENGINE") and is fully readable:

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

## What you do once

### 1. Push this folder to a public GitHub repo

```bash
git init
git add .
git commit -m "Foundation Protocol web app"
gh repo create foundation-protocol-web --public --source=. --push
```

Public is needed for free GitHub Pages. Your data is mild (a readiness rating and a done/partial/missed flag per day, no PII). If that is not comfortable, a paid GitHub plan allows private Pages.

### 2. Turn on GitHub Pages

Repo -> **Settings -> Pages -> Source: Deploy from a branch -> Branch: `main` / root -> Save**.

GitHub prints a URL like `https://barknard.github.io/foundation-protocol-web/`. That is your app. Open it on any device.

### 3. Create a Personal Access Token

Without a token the app is local-only (data stays in that one browser). With one, every check-in commits to your repo so you can use it from any device and never lose data.

GitHub -> Settings -> Developer settings -> Fine-grained tokens -> Generate new token.

- **Repository access:** Only select repositories -> your `foundation-protocol-web` repo.
- **Permissions:** Repository permissions -> **Contents: Read and write**. Nothing else.

Generate, copy the `github_pat_...` value.

### 4. Configure the app

Open your app URL, finish the one-time onboarding (weight, max pushup, longest walk, age, starting phase), then tap the gear -> Settings.

- **Repository:** `Barknard/foundation-protocol-web`
- **Personal Access Token:** paste it
- Tap **Test and sync now**. "Pushed to GitHub" means it worked. Your repo now has `data/profile.json`, `data/phase.json`, `data/checks.json`.

Every check-in after this commits in the background.

### 5. Add to your home screen

- **iPhone / Safari:** Share -> Add to Home Screen.
- **Android / Chrome:** menu -> Add to Home screen -> Install.

Opens like a native app. The favicon (a Fraunces "F" on warm dark) becomes the icon.

---

## The four tabs

- **Today** — the current session's plan (PT + strength/cardio + walk). Tap any prescription item to reveal its exercises inline, each with an animated figure, prescription, and coaching cue. A single "Daily check-in" button, and once you have checked in, today's call.
- **Library** — all 19 exercises with animated step figures (each cycles between two poses to show the movement), grouped by category. Tap any for steps and a coaching cue.
- **Progress** — where you are in the program, a readiness trend line (your "how do you feel" over time), adherence over the last 14 check-ins, and the all-time tally of the four calls. All of it built from the two-tap data; nothing to enter.
- **Phase** — all five phases (Infrastructure -> Foundation -> Run Introduction -> Build -> Target) with summary, focus, exit criteria, and the full sample week.

## Files in the repo as you use it

```
data/
|- profile.json   <- {weightKg, maxPushup, longestWalkMin, age, startingPhase, createdAt}
|- phase.json     <- {phase, week, dayInWeek, sessionsCleared, lastDecision}
\- checks.json    <- [{ts, date, goalMet, feel, hurt, decision, phase, week, dayInWeek}, ...]
```

Plain JSON. Each commit message is `Update data/checks.json`, so your repo's commit history reads as a chronological training log.

## How sync works

Local-first. Every check-in writes to `localStorage` instantly, then PUTs the changed file to `https://api.github.com/repos/{owner}/{repo}/contents/data/{file}.json`. Offline check-ins queue and flush when you reconnect. Last write wins; fine for a single user. The token sits only in the browser you set it up in, scoped to one repo, Contents only.

## Updating the app

Edit `index.html`, commit, push. GitHub Pages serves the new version within ~60 seconds. No build step. Your data is untouched because it lives in `data/*.json`.

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
