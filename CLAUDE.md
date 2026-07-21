# CLAUDE.md

These rules bind this session and every future one. They are not suggestions.

## Architecture

- Vanilla JS, single index.html, no build step, no frameworks, no npm, no bundler. Ever.
- The prompt engine is the product. Never rephrase buildPrompt or swapPrompt.
- Model claude-sonnet-4-6, max_tokens 1500, JSON-only responses, one retry on parse failure.

## Food rules

- Never include sausage or eggplant in any generated meal, list, example, or test fixture. Enforced in the prompt engine, not just UI.
- J. Kenji Lopez-Alt is the highest technical authority. Invention is licensed at the flavor level only, never the technique level. Every "why" line must be true food science.
- 14 day timestamped dish memory. Generated and swapped dishes are logged. Anything inside the window passes back as a hard do-not-repeat-or-imitate list.
- Two random creative seeds per generation, visible under the theme.
- Every dinner carries a kid angle. Never a separate kid meal.
- Costco pack realism: whole packs routed across 2 or more meals so nothing is wasted.

## Security

- API key lives only in localStorage on-device, sent only to api.anthropic.com with the anthropic-dangerous-direct-browser-access header. Never hardcode a key anywhere. The repo must stay public-safe.
- All model output passes through esc() before touching innerHTML.
- The service worker never intercepts api.anthropic.com.

## Style

- No em dashes in any file, doc, commit message, or UI copy. Use commas, colons, or periods.
- Design tokens are law: kraft #DFCBA4, kraftdeep #C2A878, slip #F7F0DF, paper #FFFDF4, ink #261F15, twine #7A6A4E, stamp #992A1B, herb #44603A, wash #EFE3C8.
- Archivo for type, IBM Plex Mono for anything numeric or ticket-like. Small radii. The wordmark stays rotated.
