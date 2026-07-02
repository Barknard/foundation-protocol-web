'use strict';
// ============================================================
// CONFIG
// ============================================================
const APP_VERSION = '2.2.0';   // ONE version for the whole app — sw.js's CACHE name must match it
// The storage prefixes below keep the app's original working name ("Foundation Protocol") ON PURPOSE:
// renaming the keys would orphan every existing install's saved history, and the data covenant outranks
// branding. Everything user-facing — UI, exports, cache name — says "The Hard Part"; the key prefix is history.
const STORAGE_KEY = 'foundation-protocol-state-v2';        // + legacy single-user blob (migrated on load)
const SETTINGS_KEY = 'foundation-protocol-settings-v2';
const ACTIVE_KEY = 'foundation-protocol-active-user';
function slugify(s) { return String(s || '').trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 40); }
function activeSlug() { return state.activeUser || (state.profile && state.profile.usernameSlug) || ''; }
function userStateKey(slug) { return `${STORAGE_KEY}:${slug}`; }
// Slugs of personas saved locally on this device (for "switch account" / resume).
// Aux keys (auto-backup snapshots like "eddie:backup") share the prefix but carry a ':' — filter them HERE
// so every caller is safe: the welcome screen once listed "eddie:backup" as a login and forked saves onto it.
function savedPersonas() {
  const out = [], pre = STORAGE_KEY + ':';
  try { for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); if (k && k.indexOf(pre) === 0) { const slug = k.slice(pre.length); if (slug && slug.indexOf(':') === -1) out.push(slug); } } } catch (_) {}
  return out;
}
// Unit conversion (imperial default)
const LB_PER_KG = 2.2046226218;
function lbToKg(lb) { return lb / LB_PER_KG; }
function kgToLb(kg) { return kg * LB_PER_KG; }
function fmt1(n) { return (Math.round(n * 10) / 10).toString(); }

