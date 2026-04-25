/* main.js
   ════════════════════════════════════════════════════════════════
   Entry point. Imports core + pages, wires hashchange, runs boot.
   Loaded via <script type="module" src="./src/main.js"></script>.
   ════════════════════════════════════════════════════════════════ */

import {
  QUIZ_CACHE_PREFIX,
  session, store, api,
  dlog, derr,
} from './core.js';

import { route } from './pages.js';

/* ─────────────────────────────────────────────────────────────
   §11 — Bootstrap
   ─────────────────────────────────────────────────────────── */

// Console escape hatch
window.__amia = {
  version: 'careers-v2',
  session, store, api,
  reset: async () => {
    try { await api.signOut(); } catch {}
    for (let i = sessionStorage.length - 1; i >= 0; i--) {
      const k = sessionStorage.key(i);
      if (k && k.startsWith(QUIZ_CACHE_PREFIX)) sessionStorage.removeItem(k);
    }
    location.hash = '#/';
    location.reload();
  },
  state: () => ({
    user: store.user && { id: store.user.id, email: store.user.email },
    candidate: store.candidate && { id: store.candidate.id, name: store.candidate.first_name },
    route: location.hash,
  }),
};

window.addEventListener('hashchange', route);

(async function boot() {
  dlog('boot — script.js v2 loaded');
  try {
    await store.hydrate();
  } catch (e) {
    derr('boot hydrate failed (continuing)', e);
  }
  route();
})();