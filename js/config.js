'use strict';
// ============================================================
// CONFIG
// ============================================================
const APP_VERSION = '2.1.0';
const STORAGE_KEY = 'foundation-protocol-state-v2';        // legacy single-user blob (migrated on load)
const SETTINGS_KEY = 'foundation-protocol-settings-v2';
const ACTIVE_KEY = 'foundation-protocol-active-user';
const DATA_KEYS = ['profile', 'phase', 'checks'];
// Each persona's data lives in its own folder: data/users/<slug>/{profile,phase,checks}.json
function slugify(s) { return String(s || '').trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 40); }
function activeSlug() { return state.activeUser || (state.profile && state.profile.usernameSlug) || ''; }
function userStateKey(slug) { return `${STORAGE_KEY}:${slug}`; }
function dataPath(key) { return `data/users/${activeSlug() || 'default'}/${key}.json`; }
// Unit conversion (imperial default)
const LB_PER_KG = 2.2046226218;
function lbToKg(lb) { return lb / LB_PER_KG; }
function kgToLb(kg) { return kg * LB_PER_KG; }
function fmt1(n) { return (Math.round(n * 10) / 10).toString(); }

