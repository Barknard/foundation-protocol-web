'use strict';
/* SVG sprite — stick figures + UI icons. Injected as the first child of <body>. */
document.body.insertAdjacentHTML('afterbegin', String.raw`<svg xmlns="http://www.w3.org/2000/svg" style="display:none" aria-hidden="true">
  <!-- PT Neuromuscular -->
  <symbol id="ic-sl-stance" viewBox="0 0 50 60">
    <circle cx="25" cy="8" r="3.5" fill="currentColor"/>
    <g stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" fill="none">
      <line x1="25" y1="11.5" x2="25" y2="32"/>
      <path d="M 25 16 L 31 22 L 35 27"/>
      <path d="M 25 16 L 19 22 L 15 27"/>
      <line x1="25" y1="32" x2="25" y2="55"/>
      <path d="M 25 32 L 18 40 L 25 42"/>
      <line x1="2" y1="57" x2="48" y2="57" stroke-width="1.5" stroke="#807868"/>
    </g>
  </symbol>
  <symbol id="ic-sl-squat" viewBox="0 0 50 60">
    <circle cx="25" cy="10" r="3.5" fill="currentColor"/>
    <g stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" fill="none">
      <line x1="25" y1="13.5" x2="25" y2="33"/>
      <path d="M 25 18 L 33 25 L 38 28"/>
      <path d="M 25 18 L 17 25 L 12 28"/>
      <path d="M 25 33 L 22 44 L 25 55"/>
      <path d="M 25 33 L 31 40 L 34 38"/>
      <line x1="2" y1="57" x2="48" y2="57" stroke-width="1.5" stroke="#807868"/>
    </g>
  </symbol>
  <symbol id="ic-sl-hop" viewBox="0 0 50 60">
    <circle cx="22" cy="14" r="3.5" fill="currentColor"/>
    <g stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" fill="none">
      <line x1="22" y1="17.5" x2="24" y2="36"/>
      <path d="M 22 22 L 30 26 L 35 24"/>
      <path d="M 22 22 L 16 24 L 12 21"/>
      <path d="M 24 36 L 22 46 L 26 53"/>
      <path d="M 24 36 L 30 42 L 35 40"/>
      <line x1="2" y1="57" x2="48" y2="57" stroke-width="1.5" stroke="#807868"/>
      <path d="M 8 30 L 13 30" stroke-width="1.2" stroke="#6A93C8"/>
      <path d="M 11 28 L 13 30 L 11 32" stroke-width="1.2" stroke="#6A93C8"/>
    </g>
  </symbol>
  <!-- PT Hip -->
  <symbol id="ic-hip-abd" viewBox="0 0 50 60">
    <circle cx="10" cy="32" r="3.5" fill="currentColor"/>
    <g stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" fill="none">
      <line x1="13.5" y1="32" x2="33" y2="34"/>
      <path d="M 14 33 L 15 38 L 13 43"/>
      <path d="M 16 32 L 22 30"/>
      <line x1="33" y1="34" x2="45" y2="42"/>
      <path d="M 33 34 L 42 28 L 47 24"/>
      <line x1="2" y1="57" x2="48" y2="57" stroke-width="1.5" stroke="#807868"/>
    </g>
  </symbol>
  <symbol id="ic-glute-bridge" viewBox="0 0 50 60">
    <circle cx="7" cy="45" r="3.5" fill="currentColor"/>
    <g stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" fill="none">
      <line x1="10.5" y1="45" x2="28" y2="32"/>
      <path d="M 11 47 L 15 50 L 19 50"/>
      <path d="M 28 32 L 32 45 L 38 53"/>
      <path d="M 28 32 L 30 46 L 36 54"/>
      <line x1="2" y1="57" x2="48" y2="57" stroke-width="1.5" stroke="#807868"/>
    </g>
  </symbol>
  <symbol id="ic-band-walk" viewBox="0 0 50 60">
    <circle cx="25" cy="10" r="3.5" fill="currentColor"/>
    <g stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" fill="none">
      <line x1="25" y1="13.5" x2="26" y2="32"/>
      <path d="M 25 18 L 18 25 L 14 28"/>
      <path d="M 25 18 L 32 25 L 36 28"/>
      <path d="M 26 32 L 18 44 L 14 55"/>
      <path d="M 26 32 L 34 44 L 38 55"/>
      <path d="M 18 44 Q 26 47 34 44" stroke-dasharray="1.5 1.5" stroke="#D9A24E"/>
      <line x1="2" y1="57" x2="48" y2="57" stroke-width="1.5" stroke="#807868"/>
    </g>
  </symbol>
  <!-- PT Shin -->
  <symbol id="ic-calf-raise" viewBox="0 0 50 60">
    <circle cx="25" cy="9" r="3.5" fill="currentColor"/>
    <g stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" fill="none">
      <line x1="25" y1="12.5" x2="25" y2="34"/>
      <path d="M 25 16 L 20 26"/>
      <path d="M 25 16 L 30 26"/>
      <line x1="22" y1="34" x2="22" y2="56"/>
      <line x1="28" y1="34" x2="28" y2="56"/>
      <line x1="19" y1="57" x2="25" y2="57" stroke-width="1.5"/>
      <line x1="25" y1="57" x2="31" y2="57" stroke-width="1.5"/>
      <line x1="2" y1="57" x2="48" y2="57" stroke-width="1.5" stroke="#807868"/>
    </g>
  </symbol>
  <symbol id="ic-sl-calf-raise" viewBox="0 0 50 60">
    <circle cx="22" cy="9" r="3.5" fill="currentColor"/>
    <g stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" fill="none">
      <line x1="22" y1="12.5" x2="22" y2="34"/>
      <line x1="22" y1="16" x2="38" y2="20"/>
      <line x1="22" y1="16" x2="17" y2="26"/>
      <line x1="22" y1="34" x2="22" y2="56"/>
      <line x1="19" y1="57" x2="26" y2="57" stroke-width="1.5"/>
      <path d="M 22 34 L 28 40 L 26 45"/>
      <line x1="42" y1="6" x2="42" y2="56" stroke-width="2" stroke="#D9A24E"/>
      <line x1="2" y1="57" x2="42" y2="57" stroke-width="1.5" stroke="#807868"/>
    </g>
  </symbol>
  <symbol id="ic-calf-stretch" viewBox="0 0 50 60">
    <circle cx="17" cy="13" r="3.5" fill="currentColor"/>
    <g stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" fill="none">
      <line x1="18" y1="16" x2="26" y2="34"/>
      <path d="M 20 19 L 30 21 L 40 22"/>
      <path d="M 20 22 L 30 25 L 40 25"/>
      <path d="M 26 34 L 31 44 L 33 54"/>
      <path d="M 26 34 L 19 45 L 14 54"/>
      <line x1="42" y1="6" x2="42" y2="54" stroke-width="2" stroke="#D9A24E"/>
      <line x1="2" y1="54" x2="42" y2="54" stroke-width="1.5" stroke="#807868"/>
    </g>
  </symbol>
  <!-- Strength Day A -->
  <symbol id="ic-goblet-sq" viewBox="0 0 50 60">
    <circle cx="25" cy="14" r="3.5" fill="currentColor"/>
    <g stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" fill="none">
      <line x1="25" y1="17.5" x2="25" y2="33"/>
      <path d="M 25 20 L 21 27 L 23 32"/>
      <path d="M 25 20 L 29 27 L 27 32"/>
    </g>
    <rect x="20" y="30" width="10" height="6" rx="1" fill="#D9A24E"/>
    <g stroke="#D9A24E" stroke-width="1.2" stroke-linecap="round" fill="none">
      <line x1="22" y1="30" x2="22" y2="28"/>
      <line x1="28" y1="30" x2="28" y2="28"/>
    </g>
    <g stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" fill="none">
      <path d="M 25 33 L 16 43 L 14 55"/>
      <path d="M 25 33 L 34 43 L 36 55"/>
      <line x1="2" y1="57" x2="48" y2="57" stroke-width="1.5" stroke="#807868"/>
    </g>
  </symbol>
  <symbol id="ic-pushup" viewBox="0 0 50 60">
    <circle cx="44" cy="33" r="3.5" fill="currentColor"/>
    <g stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" fill="none">
      <line x1="41" y1="34" x2="12" y2="43"/>
      <path d="M 12 43 L 6 50"/>
      <line x1="3" y1="51" x2="9" y2="51" stroke-width="1.5"/>
      <line x1="38" y1="35" x2="38" y2="50"/>
      <line x1="35" y1="51" x2="41" y2="51" stroke-width="1.5"/>
      <line x1="2" y1="52" x2="48" y2="52" stroke-width="1.5" stroke="#807868"/>
    </g>
  </symbol>
  <symbol id="ic-db-row" viewBox="0 0 50 60">
    <circle cx="14" cy="22" r="3.5" fill="currentColor"/>
    <g stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" fill="none">
      <line x1="17" y1="24" x2="38" y2="26"/>
      <path d="M 35 26 L 35 36"/>
      <path d="M 38 26 L 38 36"/>
      <path d="M 22 26 L 18 32 L 18 38"/>
    </g>
    <rect x="13" y="38" width="10" height="4" fill="#D9A24E"/>
    <g stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" fill="none">
      <line x1="17" y1="25" x2="6" y2="36"/>
      <line x1="30" y1="38" x2="46" y2="38" stroke-width="2" stroke="#D9A24E"/>
      <line x1="32" y1="38" x2="32" y2="50" stroke-width="1.5" stroke="#D9A24E"/>
      <line x1="44" y1="38" x2="44" y2="50" stroke-width="1.5" stroke="#D9A24E"/>
      <line x1="2" y1="52" x2="48" y2="52" stroke-width="1.5" stroke="#807868"/>
    </g>
  </symbol>
  <symbol id="ic-plank" viewBox="0 0 50 60">
    <circle cx="45" cy="36" r="3.5" fill="currentColor"/>
    <g stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" fill="none">
      <line x1="42" y1="37" x2="16" y2="44"/>
      <path d="M 16 44 L 7 50"/>
      <line x1="4" y1="51" x2="10" y2="51" stroke-width="1.5"/>
      <path d="M 41 38 L 41 50 L 47 50"/>
      <line x1="2" y1="52" x2="48" y2="52" stroke-width="1.5" stroke="#807868"/>
    </g>
  </symbol>
  <!-- Strength Day B -->
  <symbol id="ic-rdl" viewBox="0 0 50 60">
    <circle cx="25" cy="9" r="3.5" fill="currentColor"/>
    <g stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" fill="none">
      <line x1="25" y1="12.5" x2="25" y2="34"/>
      <line x1="24" y1="16" x2="20" y2="33"/>
      <line x1="26" y1="16" x2="30" y2="33"/>
      <path d="M 25 34 L 22 46 L 21 57"/>
      <path d="M 25 34 L 28 46 L 29 57"/>
      <line x1="2" y1="57" x2="48" y2="57" stroke-width="1.5" stroke="#807868"/>
    </g>
    <rect x="16" y="32" width="8" height="3" rx="1" fill="#D9A24E"/>
    <rect x="26" y="32" width="8" height="3" rx="1" fill="#D9A24E"/>
  </symbol>
  <symbol id="ic-oh-press" viewBox="0 0 50 60">
    <circle cx="25" cy="14" r="3.5" fill="currentColor"/>
    <g stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" fill="none">
      <line x1="25" y1="17.5" x2="25" y2="37"/>
      <line x1="22" y1="19" x2="20" y2="5"/>
      <line x1="28" y1="19" x2="30" y2="5"/>
    </g>
    <rect x="15" y="3" width="10" height="3" fill="#D9A24E"/>
    <rect x="25" y="3" width="10" height="3" fill="#D9A24E"/>
    <g stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" fill="none">
      <line x1="25" y1="37" x2="22" y2="55"/>
      <line x1="25" y1="37" x2="28" y2="55"/>
      <line x1="2" y1="57" x2="48" y2="57" stroke-width="1.5" stroke="#807868"/>
    </g>
  </symbol>
  <symbol id="ic-split-sq" viewBox="0 0 50 60">
    <circle cx="22" cy="11" r="3.5" fill="currentColor"/>
    <g stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" fill="none">
      <line x1="22" y1="14.5" x2="22" y2="33"/>
      <line x1="19" y1="17" x2="16" y2="33"/>
      <line x1="25" y1="17" x2="28" y2="33"/>
    </g>
    <rect x="12" y="33" width="8" height="3" fill="#D9A24E"/>
    <rect x="24" y="33" width="8" height="3" fill="#D9A24E"/>
    <g stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" fill="none">
      <path d="M 22 33 L 17 44 L 14 55"/>
      <path d="M 22 33 L 32 42 L 42 46"/>
      <line x1="38" y1="46" x2="48" y2="46" stroke-width="2" stroke="#D9A24E"/>
      <line x1="40" y1="46" x2="40" y2="55" stroke-width="1.5" stroke="#D9A24E"/>
      <line x1="46" y1="46" x2="46" y2="55" stroke-width="1.5" stroke="#D9A24E"/>
      <line x1="2" y1="55" x2="48" y2="55" stroke-width="1.5" stroke="#807868"/>
    </g>
  </symbol>
  <symbol id="ic-dead-bug" viewBox="0 0 50 60">
    <circle cx="9" cy="46" r="3.5" fill="currentColor"/>
    <g stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" fill="none">
      <line x1="12" y1="47" x2="31" y2="47"/>
      <path d="M 15 47 L 13 33"/>
      <path d="M 17 47 L 20 33"/>
      <path d="M 31 47 L 31 34 L 41 33"/>
      <path d="M 28 47 L 28 37 L 37 36"/>
      <line x1="2" y1="50" x2="48" y2="50" stroke-width="1.5" stroke="#807868"/>
    </g>
  </symbol>
  <!-- Cardio -->
  <symbol id="ic-walking" viewBox="0 0 50 60">
    <circle cx="27" cy="9" r="3.5" fill="currentColor"/>
    <g stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" fill="none">
      <line x1="26" y1="12.5" x2="24" y2="33"/>
      <path d="M 25 17 L 31 23"/>
      <path d="M 25 17 L 20 24"/>
      <path d="M 24 33 L 30 43 L 34 53"/>
      <path d="M 24 33 L 19 44 L 15 53"/>
      <path d="M 34 53 L 37 53" stroke-width="1.5"/>
      <path d="M 13 53 L 16 53" stroke-width="1.5"/>
      <line x1="2" y1="57" x2="48" y2="57" stroke-width="1.5" stroke="#807868"/>
    </g>
  </symbol>
  <symbol id="ic-running" viewBox="0 0 50 60">
    <circle cx="30" cy="11" r="3.5" fill="currentColor"/>
    <g stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" fill="none">
      <line x1="28" y1="14" x2="23" y2="33"/>
      <path d="M 27 18 L 33 19 L 35 24"/>
      <path d="M 27 18 L 21 21 L 19 26"/>
      <path d="M 23 33 L 31 38 L 33 46"/>
      <path d="M 23 33 L 17 40 L 19 49"/>
      <line x1="2" y1="55" x2="48" y2="55" stroke-width="1.5" stroke="#807868"/>
      <path d="M 5 18 L 12 18" stroke-width="1" stroke="#6A93C8"/>
      <path d="M 4 24 L 11 24" stroke-width="1" stroke="#6A93C8"/>
    </g>
  </symbol>

  <!-- UI icons -->
  <symbol id="ic-today" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2"/>
    <line x1="16" y1="2" x2="16" y2="6"/>
    <line x1="8" y1="2" x2="8" y2="6"/>
    <line x1="3" y1="10" x2="21" y2="10"/>
    <circle cx="12" cy="15" r="2" fill="currentColor"/>
  </symbol>
  <symbol id="ic-library" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
  </symbol>
  <symbol id="ic-progress" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
  </symbol>
  <symbol id="ic-phase" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <path d="M4 4h16v4H4z"/><path d="M4 12h16v4H4z"/><path d="M4 20h10v0H4z"/>
  </symbol>
  <symbol id="ic-back" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <path d="M19 12H5"/><polyline points="12 19 5 12 12 5"/>
  </symbol>
  <symbol id="ic-settings" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <circle cx="12" cy="12" r="3"/>
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
  </symbol>
  <symbol id="ic-chev-right" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <polyline points="9 18 15 12 9 6"/>
  </symbol>
  <symbol id="ic-check" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
    <polyline points="20 6 9 17 4 12"/>
  </symbol>
  <symbol id="ic-sl-stance-2" viewBox="0 0 50 60">
    <circle cx="25" cy="8" r="3.5" fill="currentColor"/>
    <g stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" fill="none">
      <line x1="25" y1="11.5" x2="25" y2="32"/>
      <path d="M 25 16 L 33 18 L 39 16"/>
      <path d="M 25 16 L 17 18 L 11 16"/>
      <line x1="25" y1="32" x2="25" y2="55"/>
      <path d="M 25 32 L 16 38 L 23 40"/>
      <line x1="2" y1="57" x2="48" y2="57" stroke-width="1.5" stroke="#807868"/>
    </g>
  </symbol>
  <symbol id="ic-sl-squat-2" viewBox="0 0 50 60">
    <circle cx="25" cy="17" r="3.5" fill="currentColor"/>
    <g stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" fill="none">
      <line x1="25" y1="20.5" x2="25" y2="40"/>
      <path d="M 25 25 L 33 32 L 38 35"/>
      <path d="M 25 25 L 17 32 L 12 35"/>
      <path d="M 25 40 L 33 47 L 25 55"/>
      <path d="M 25 40 L 31 47 L 34 45"/>
      <line x1="2" y1="57" x2="48" y2="57" stroke-width="1.5" stroke="#807868"/>
    </g>
  </symbol>
  <symbol id="ic-sl-hop-2" viewBox="0 0 50 60">
    <circle cx="22" cy="22" r="3.5" fill="currentColor"/>
    <g stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" fill="none">
      <line x1="22" y1="25.5" x2="24" y2="44"/>
      <path d="M 22 30 L 28 36.6 L 31 41"/>
      <path d="M 22 30 L 17 33.8 L 13 37"/>
      <path d="M 24 44 L 33 49 L 26 53"/>
      <path d="M 24 44 L 30 50 L 35 48"/>
      <line x1="2" y1="57" x2="48" y2="57" stroke-width="1.5" stroke="#807868"/>
      <path d="M 10 36 L 10 41" stroke-width="1.2" stroke="#6A93C8"/>
      <path d="M 8 39 L 10 41 L 12 39" stroke-width="1.2" stroke="#6A93C8"/>
    </g>
  </symbol>
  <symbol id="ic-hip-abd-2" viewBox="0 0 50 60">
    <circle cx="10" cy="32" r="3.5" fill="currentColor"/>
    <g stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" fill="none">
      <line x1="13.5" y1="32" x2="33" y2="34"/>
      <path d="M 14 33 L 15 38 L 13 43"/>
      <path d="M 16 32 L 22 30"/>
      <line x1="33" y1="34" x2="45" y2="42"/>
      <path d="M 33 34 L 42 40 L 47 44"/>
      <line x1="2" y1="57" x2="48" y2="57" stroke-width="1.5" stroke="#807868"/>
    </g>
  </symbol>
  <symbol id="ic-glute-bridge-2" viewBox="0 0 50 60">
    <circle cx="7" cy="45" r="3.5" fill="currentColor"/>
    <g stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" fill="none">
      <line x1="10.5" y1="45" x2="31.7" y2="49.5"/>
      <path d="M 11 47 L 15 50 L 19 50"/>
      <path d="M 31.7 49.5 L 44.7 45.6 L 38 53"/>
      <path d="M 31.7 49.5 L 45.7 51.4 L 36 54"/>
      <line x1="2" y1="57" x2="48" y2="57" stroke-width="1.5" stroke="#807868"/>
    </g>
  </symbol>
  <symbol id="ic-band-walk-2" viewBox="0 0 50 60">
    <circle cx="25" cy="10" r="3.5" fill="currentColor"/>
    <g stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" fill="none">
      <line x1="25" y1="13.5" x2="26" y2="32"/>
      <path d="M 25 18 L 18 25 L 14 28"/>
      <path d="M 25 18 L 32 25 L 36 28"/>
      <path d="M 26 32 L 21 45.5 L 19 57"/>
      <path d="M 26 32 L 31 45.5 L 33 57"/>
      <path d="M 21 45.5 Q 26 48.5 31 45.5" stroke-dasharray="1.5 1.5" stroke="#D9A24E"/>
      <line x1="2" y1="57" x2="48" y2="57" stroke-width="1.5" stroke="#807868"/>
    </g>
  </symbol>
  <symbol id="ic-calf-raise-2" viewBox="0 0 50 60">
    <circle cx="25" cy="5" r="3.5" fill="currentColor"/>
    <g stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" fill="none">
      <line x1="25" y1="8.5" x2="25" y2="30"/>
      <path d="M 25 12 L 20 22"/>
      <path d="M 25 12 L 30 22"/>
      <line x1="22" y1="30" x2="22" y2="52"/>
      <line x1="28" y1="30" x2="28" y2="52"/>
      <path d="M 22 52 L 21 57"/>
      <path d="M 28 52 L 29 57"/>
      <line x1="2" y1="57" x2="48" y2="57" stroke-width="1.5" stroke="#807868"/>
      <path d="M 19 40 Q 17 46 19 51" stroke-width="1.6" stroke="#E26B5F"/>
      <path d="M 31 40 Q 33 46 31 51" stroke-width="1.6" stroke="#E26B5F"/>
    </g>
  </symbol>
  <symbol id="ic-sl-calf-raise-2" viewBox="0 0 50 60">
    <circle cx="22" cy="5" r="3.5" fill="currentColor"/>
    <g stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" fill="none">
      <line x1="22" y1="8.5" x2="22" y2="30"/>
      <line x1="22" y1="12" x2="38" y2="16"/>
      <line x1="22" y1="12" x2="17" y2="22"/>
      <line x1="22" y1="30" x2="22" y2="52"/>
      <path d="M 22 52 L 21 57"/>
      <path d="M 22 30 L 28 36 L 26 41"/>
      <line x1="42" y1="6" x2="42" y2="56" stroke-width="2" stroke="#D9A24E"/>
      <line x1="2" y1="57" x2="42" y2="57" stroke-width="1.5" stroke="#807868"/>
      <path d="M 19 40 Q 17 46 19 51" stroke-width="1.6" stroke="#E26B5F"/>
    </g>
  </symbol>
  <symbol id="ic-calf-stretch-2" viewBox="0 0 50 60">
    <circle cx="17" cy="13" r="3.5" fill="currentColor"/>
    <g stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" fill="none">
      <line x1="18" y1="16" x2="26" y2="34"/>
      <path d="M 20 19 L 30 21 L 40 22"/>
      <path d="M 20 22 L 30 25 L 40 25"/>
      <path d="M 26 34 L 31 44 L 33 54"/>
      <path d="M 26 34 L 20 44 L 16 54"/>
      <line x1="42" y1="6" x2="42" y2="54" stroke-width="2" stroke="#D9A24E"/>
      <line x1="2" y1="54" x2="42" y2="54" stroke-width="1.5" stroke="#807868"/>
    </g>
  </symbol>
  <symbol id="ic-goblet-sq-2" viewBox="0 0 50 60">
    <circle cx="25" cy="23" r="3.5" fill="currentColor"/>
    <g stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" fill="none">
      <line x1="25" y1="26.5" x2="25" y2="41"/>
      <path d="M 25 29 L 22 38 L 24 46"/>
      <path d="M 25 29 L 28 38 L 26 46"/>
    </g>
    <rect x="20" y="45" width="10" height="6" rx="1" fill="#D9A24E"/>
    <g stroke="#D9A24E" stroke-width="1.2" stroke-linecap="round" fill="none">
      <line x1="22" y1="45" x2="22" y2="43"/>
      <line x1="28" y1="45" x2="28" y2="43"/>
    </g>
    <g stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" fill="none">
      <path d="M 25 41 L 13 44 L 15 55"/>
      <path d="M 25 41 L 37 44 L 35 55"/>
      <line x1="2" y1="57" x2="48" y2="57" stroke-width="1.5" stroke="#807868"/>
    </g>
  </symbol>
  <symbol id="ic-pushup-2" viewBox="0 0 50 60">
    <circle cx="44" cy="38" r="3.5" fill="currentColor"/>
    <g stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" fill="none">
      <line x1="41" y1="39" x2="12" y2="46"/>
      <path d="M 12 46 L 6 51"/>
      <line x1="3" y1="52" x2="9" y2="52" stroke-width="1.5"/>
      <path d="M 38 40 L 34 47 L 38 51"/>
      <line x1="35" y1="52" x2="41" y2="52" stroke-width="1.5"/>
      <line x1="2" y1="53" x2="48" y2="53" stroke-width="1.5" stroke="#807868"/>
    </g>
  </symbol>
  <symbol id="ic-db-row-2" viewBox="0 0 50 60">
    <circle cx="14" cy="22" r="3.5" fill="currentColor"/>
    <g stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" fill="none">
      <line x1="17" y1="24" x2="38" y2="26"/>
      <path d="M 35 26 L 35 36"/>
      <path d="M 38 26 L 38 36"/>
      <path d="M 22 26 L 28 23 L 28 29"/>
    </g>
    <rect x="23" y="29" width="10" height="4" fill="#D9A24E"/>
    <g stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" fill="none">
      <line x1="17" y1="25" x2="6" y2="36"/>
      <line x1="30" y1="38" x2="46" y2="38" stroke-width="2" stroke="#D9A24E"/>
      <line x1="32" y1="38" x2="32" y2="50" stroke-width="1.5" stroke="#D9A24E"/>
      <line x1="44" y1="38" x2="44" y2="50" stroke-width="1.5" stroke="#D9A24E"/>
      <line x1="2" y1="52" x2="48" y2="52" stroke-width="1.5" stroke="#807868"/>
    </g>
  </symbol>
  <symbol id="ic-plank-2" viewBox="0 0 50 60">
    <circle cx="45" cy="35" r="3.5" fill="currentColor"/>
    <g stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" fill="none">
      <line x1="42" y1="36" x2="16" y2="42"/>
      <path d="M 16 42 L 7 50"/>
      <line x1="4" y1="51" x2="10" y2="51" stroke-width="1.5"/>
      <path d="M 41 37 L 41 50 L 47 50"/>
      <line x1="2" y1="52" x2="48" y2="52" stroke-width="1.5" stroke="#807868"/>
    </g>
  </symbol>
  <symbol id="ic-rdl-2" viewBox="0 0 50 60">
    <circle cx="13" cy="20" r="3.5" fill="currentColor"/>
    <g stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" fill="none">
      <line x1="15" y1="22" x2="27" y2="34"/>
      <line x1="18" y1="25" x2="20" y2="42"/>
      <line x1="20" y1="26" x2="24" y2="42"/>
      <path d="M 27 34 L 29 46 L 30 57"/>
      <path d="M 27 34 L 25 46 L 24 57"/>
      <line x1="2" y1="57" x2="48" y2="57" stroke-width="1.5" stroke="#807868"/>
    </g>
    <rect x="15" y="42" width="8" height="3" rx="1" fill="#D9A24E"/>
    <rect x="21" y="42" width="8" height="3" rx="1" fill="#D9A24E"/>
  </symbol>
  <symbol id="ic-oh-press-2" viewBox="0 0 50 60">
    <circle cx="25" cy="14" r="3.5" fill="currentColor"/>
    <g stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" fill="none">
      <line x1="25" y1="17.5" x2="25" y2="37"/>
      <line x1="22" y1="19" x2="19" y2="33"/>
      <line x1="28" y1="19" x2="31" y2="33"/>
    </g>
    <rect x="15" y="18" width="10" height="3" fill="#D9A24E"/>
    <rect x="25" y="18" width="10" height="3" fill="#D9A24E"/>
    <g stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" fill="none">
      <line x1="25" y1="37" x2="22" y2="55"/>
      <line x1="25" y1="37" x2="28" y2="55"/>
      <line x1="2" y1="57" x2="48" y2="57" stroke-width="1.5" stroke="#807868"/>
    </g>
  </symbol>
  <symbol id="ic-split-sq-2" viewBox="0 0 50 60">
    <circle cx="22" cy="19" r="3.5" fill="currentColor"/>
    <g stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" fill="none">
      <line x1="22" y1="22.5" x2="22" y2="41"/>
      <line x1="19" y1="25" x2="16" y2="41"/>
      <line x1="25" y1="25" x2="28" y2="41"/>
    </g>
    <rect x="12" y="41" width="8" height="3" fill="#D9A24E"/>
    <rect x="24" y="41" width="8" height="3" fill="#D9A24E"/>
    <g stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" fill="none">
      <path d="M 22 41 L 11 45.5 L 14 55"/>
      <path d="M 22 41 L 32.5 49.5 L 42 46"/>
      <line x1="38" y1="46" x2="48" y2="46" stroke-width="2" stroke="#D9A24E"/>
      <line x1="40" y1="46" x2="40" y2="55" stroke-width="1.5" stroke="#D9A24E"/>
      <line x1="46" y1="46" x2="46" y2="55" stroke-width="1.5" stroke="#D9A24E"/>
      <line x1="2" y1="55" x2="48" y2="55" stroke-width="1.5" stroke="#807868"/>
    </g>
  </symbol>
  <symbol id="ic-dead-bug-2" viewBox="0 0 50 60">
    <circle cx="9" cy="46" r="3.5" fill="currentColor"/>
    <g stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" fill="none">
      <line x1="12" y1="47" x2="31" y2="47"/>
      <path d="M 15 47 L 6 43"/>
      <path d="M 17 47 L 20 33"/>
      <path d="M 31 47 L 42 48"/>
      <path d="M 28 47 L 28 37 L 37 36"/>
      <line x1="2" y1="50" x2="48" y2="50" stroke-width="1.5" stroke="#807868"/>
    </g>
  </symbol>
  <symbol id="ic-walking-2" viewBox="0 0 50 60">
    <circle cx="27" cy="9" r="3.5" fill="currentColor"/>
    <g stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" fill="none">
      <line x1="26" y1="12.5" x2="24" y2="33"/>
      <path d="M 25 17 L 20 23"/>
      <path d="M 25 17 L 31 24"/>
      <path d="M 24 33 L 19 43 L 15 53"/>
      <path d="M 24 33 L 30 44 L 34 53"/>
      <path d="M 34 53 L 37 53" stroke-width="1.5"/>
      <path d="M 13 53 L 16 53" stroke-width="1.5"/>
      <line x1="2" y1="57" x2="48" y2="57" stroke-width="1.5" stroke="#807868"/>
    </g>
  </symbol>
  <symbol id="ic-walking-3" viewBox="0 0 50 60">
    <circle cx="26" cy="8" r="3.5" fill="currentColor"/>
    <g stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" fill="none">
      <line x1="26" y1="11.5" x2="25" y2="32"/>
      <path d="M 25 17 L 28 25"/>
      <path d="M 25 17 L 22 25"/>
      <path d="M 25 32 L 23 44 L 22 54"/>
      <path d="M 25 32 L 27 44 L 29 54"/>
      <path d="M 20 54 L 23 54" stroke-width="1.5"/>
      <path d="M 27 54 L 30 54" stroke-width="1.5"/>
      <line x1="2" y1="57" x2="48" y2="57" stroke-width="1.5" stroke="#807868"/>
    </g>
  </symbol>
  <symbol id="ic-running-2" viewBox="0 0 50 60">
    <circle cx="30" cy="11" r="3.5" fill="currentColor"/>
    <g stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" fill="none">
      <line x1="28" y1="14" x2="23" y2="33"/>
      <path d="M 27 18 L 21 19 L 19 24"/>
      <path d="M 27 18 L 33 21 L 35 26"/>
      <path d="M 23 33 L 17 38 L 15 46"/>
      <path d="M 23 33 L 30 40 L 32 49"/>
      <line x1="2" y1="55" x2="48" y2="55" stroke-width="1.5" stroke="#807868"/>
      <path d="M 5 18 L 12 18" stroke-width="1" stroke="#6A93C8"/>
      <path d="M 4 24 L 11 24" stroke-width="1" stroke="#6A93C8"/>
    </g>
  </symbol>
  <symbol id="ic-running-3" viewBox="0 0 50 60">
    <circle cx="29" cy="11" r="3.5" fill="currentColor"/>
    <g stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" fill="none">
      <line x1="28" y1="14" x2="24" y2="33"/>
      <path d="M 27 18 L 31 22 L 33 27"/>
      <path d="M 27 18 L 23 22 L 21 27"/>
      <path d="M 24 33 L 27 41 L 25 49"/>
      <path d="M 24 33 L 21 41 L 23 49"/>
      <line x1="2" y1="55" x2="48" y2="55" stroke-width="1.5" stroke="#807868"/>
      <path d="M 5 18 L 12 18" stroke-width="1" stroke="#6A93C8"/>
      <path d="M 4 24 L 11 24" stroke-width="1" stroke="#6A93C8"/>
    </g>
  </symbol>
  <symbol id="ic-kb-swing" viewBox="0 0 50 60">
    <circle cx="25" cy="17" r="3.5" fill="currentColor"/>
    <g stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" fill="none">
      <line x1="25" y1="20.5" x2="24" y2="33"/>
      <path d="M 25 23 L 22 33 L 25 41"/>
      <path d="M 25 23 L 28 33 L 25 41"/>
      <path d="M 24 33 L 17 45 L 15 55"/>
      <path d="M 24 33 L 31 45 L 33 55"/>
      <line x1="2" y1="57" x2="48" y2="57" stroke-width="1.5" stroke="#807868"/>
    </g>
    <rect x="21" y="40" width="8" height="6" rx="2" fill="#D9A24E"/>
    <path d="M 23 40 Q 25 37 27 40" stroke="#D9A24E" stroke-width="1.3" fill="none"/>
  </symbol>
  <symbol id="ic-kb-swing-2" viewBox="0 0 50 60">
    <circle cx="25" cy="9" r="3.5" fill="currentColor"/>
    <g stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" fill="none">
      <line x1="25" y1="12.5" x2="25" y2="34"/>
      <path d="M 25 16 L 23 20 L 25 23"/>
      <path d="M 25 16 L 27 20 L 25 23"/>
      <path d="M 25 34 L 21 45 L 20 55"/>
      <path d="M 25 34 L 29 45 L 30 55"/>
      <line x1="2" y1="57" x2="48" y2="57" stroke-width="1.5" stroke="#807868"/>
    </g>
    <rect x="21" y="22" width="8" height="6" rx="2" fill="#D9A24E"/>
    <path d="M 23 22 Q 25 19 27 22" stroke="#D9A24E" stroke-width="1.3" fill="none"/>
  </symbol>
  <symbol id="ic-kb-carry" viewBox="0 0 50 60">
    <circle cx="25" cy="9" r="3.5" fill="currentColor"/>
    <g stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" fill="none">
      <line x1="25" y1="12.5" x2="25" y2="34"/>
      <line x1="25" y1="16" x2="18" y2="33"/>
      <line x1="25" y1="16" x2="32" y2="33"/>
      <path d="M 25 34 L 22 46 L 21 56"/>
      <path d="M 25 34 L 28 46 L 29 56"/>
      <line x1="2" y1="57" x2="48" y2="57" stroke-width="1.5" stroke="#807868"/>
    </g>
    <rect x="14" y="33" width="8" height="6" rx="2" fill="#D9A24E"/>
    <rect x="28" y="33" width="8" height="6" rx="2" fill="#D9A24E"/>
    <g stroke="#D9A24E" stroke-width="1.3" fill="none"><path d="M 16 33 Q 18 30 20 33"/><path d="M 30 33 Q 32 30 34 33"/></g>
  </symbol>
  <symbol id="ic-kb-carry-2" viewBox="0 0 50 60">
    <circle cx="25" cy="9" r="3.5" fill="currentColor"/>
    <g stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" fill="none">
      <line x1="25" y1="12.5" x2="25" y2="34"/>
      <line x1="25" y1="16" x2="18" y2="33"/>
      <line x1="25" y1="16" x2="32" y2="33"/>
      <path d="M 25 34 L 20 45 L 18 55"/>
      <path d="M 25 34 L 30 45 L 32 55"/>
      <line x1="2" y1="57" x2="48" y2="57" stroke-width="1.5" stroke="#807868"/>
    </g>
    <rect x="14" y="33" width="8" height="6" rx="2" fill="#D9A24E"/>
    <rect x="28" y="33" width="8" height="6" rx="2" fill="#D9A24E"/>
    <g stroke="#D9A24E" stroke-width="1.3" fill="none"><path d="M 16 33 Q 18 30 20 33"/><path d="M 30 33 Q 32 30 34 33"/></g>
  </symbol>
<symbol id="ic-why" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <path d="M9 5a3 3 0 0 0-3 3 3 3 0 0 0-1.5 5.4A3 3 0 0 0 6 19a3 3 0 0 0 3 1"/>
    <path d="M9 5v15"/>
    <path d="M6 8.5c1.2.6 2.2.6 3 0"/>
    <path d="M5.4 13.4c1.4-.5 2.6-.4 3.6.3"/>
    <path d="M13 7.2a2.4 2.4 0 0 1 4 1.6c0 1.6-2.4 2-2.4 3.6"/>
    <path d="M14.6 15.4h.01"/>
  </symbol>
</svg>
`);
