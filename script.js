/* ═══════════════════════════════════════════════════════════════
 * AMIA CAREERS — script.js
 *
 * Vanilla JS SPA for the candidate side of the Amia ATS.
 *
 * Flow (constrained by RLS policies):
 *   1. Browse published positions (anon, no auth needed)
 *   2. Job detail + apply form
 *   3. On submit:  signUp (if needed) → candidate row → CV upload → application
 *   4. Portal: own applications + quiz launchers
 *   5. Quiz overview → quiz taking (via get_quiz_for_candidate + submit_quiz RPCs)
 *
 * Structure:
 *   §1 Config + Supabase client
 *   §2 State store  (session + candidate)
 *   §3 Utils        (toast, escape, format, image URLs, etc.)
 *   §4 API layer    (wrappers around supabase calls)
 *   §5 Router       (hash-based, with per-page teardown)
 *   §6 Pages
 *   §7 Quiz renderers (MC, ranking, open_text)
 *   §8 Ranking drag-drop
 *   §9 Bootstrap
 * ══════════════════════════════════════════════════════════════ */

(function () {
  'use strict';


  /* ─────────────────────────────────────────────────────────────
     §1 — Config + Supabase client
     ─────────────────────────────────────────────────────────── */

  // Anon key is safe in client code — security enforced by RLS.
  const SUPABASE_URL = 'https://lekkiacgjhjdhfzztpwd.supabase.co';
  const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxla2tpYWNnamhqZGhmenp0cHdkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA0NjA3OTMsImV4cCI6MjA4NjAzNjc5M30.69UEjEoyV-v6ZYR4QgsyVusQhtWesCEA_EEizHSEyHg';

  // Singleton guard. Multiple GoTrueClient instances sharing the same
  // localStorage key deadlock each other on token refresh. If anything
  // tries to createClient again, reuse ours.
  //
  // ALSO: disable the Web Locks API with a no-op lock.
  // Supabase auth-js has a known bug (supabase-js#1594, #2111) where
  // `getUser`/`getSession`/`refreshSession` hang indefinitely when a
  // lock gets acquired but never released — e.g. when a tab closes or
  // a request aborts mid-auth. The lock has no timeout, so every
  // subsequent auth call queues behind it forever, never making a
  // network request. The workaround straight from the Supabase team
  // is to swap the lock for a function that just runs the callback.
  // Safe for single-tab usage; we're a careers page, not a multi-tab
  // admin dashboard.
  const noOpLock = async (_name, _acquireTimeout, fn) => fn();

  const sb = (function () {
    if (window.__amiaSupabaseClient) {
      console.warn('[amia] reusing existing Supabase client (avoiding GoTrue deadlock)');
      return window.__amiaSupabaseClient;
    }
    const client = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: { lock: noOpLock },
    });
    window.__amiaSupabaseClient = client;
    return client;
  })();

  const APP_EL = document.getElementById('app');
  const TOAST_EL = document.getElementById('toast');


  /* ─────────────────────────────────────────────────────────────
     §1.5 — [DEBUG] Debug infrastructure
       Prefixed logger + timeout wrapper + global escape hatch.
       Every debug addition in this file is marked with [DEBUG] so
       we can strip them out with a single sed once the flow is
       stable.
     ─────────────────────────────────────────────────────────── */

  // Toggle this to silence logs without removing them.
  const DEBUG = true;

  // Timeout for any single network operation. Hangs become thrown errors
  // with a line number instead of an infinite spinner.
  const OP_TIMEOUT_MS = 12000;

  function dlog() {
    if (!DEBUG) return;
    const args = Array.from(arguments);
    const tag = `%c[amia]`;
    console.log(tag, 'color:#FF6444;font-weight:600', ...args);
  }
  function dgroup(label) { if (DEBUG) console.groupCollapsed(`%c[amia] ${label}`, 'color:#FF6444;font-weight:600'); }
  function dgroupEnd()   { if (DEBUG) console.groupEnd(); }
  function derr(label, err) {
    if (!DEBUG) return;
    console.error(`%c[amia] ${label}`, 'color:#c62828;font-weight:600', err);
  }

  // Wrap any promise with a hard timeout. Use for every supabase / RPC
  // call so a broken token / network hang surfaces as an error within
  // OP_TIMEOUT_MS instead of spinning forever.
  function withTimeout(promise, label, ms) {
    const timeoutMs = ms || OP_TIMEOUT_MS;
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        const e = new Error(`Timeout (${timeoutMs}ms) on: ${label}`);
        e.isTimeout = true;
        derr(`TIMEOUT: ${label}`, e);
        reject(e);
      }, timeoutMs);
      Promise.resolve(promise).then(
        (v) => { clearTimeout(timer); resolve(v); },
        (e) => { clearTimeout(timer); reject(e); }
      );
    });
  }

  // Time an async operation and log start/end.
  async function timed(label, fn) {
    dlog(`→ ${label}`);
    const t0 = performance.now();
    try {
      const result = await fn();
      const ms = Math.round(performance.now() - t0);
      dlog(`← ${label} ok (${ms}ms)`);
      return result;
    } catch (e) {
      const ms = Math.round(performance.now() - t0);
      derr(`✗ ${label} failed (${ms}ms)`, e);
      throw e;
    }
  }

  // Catch any unhandled promise rejection so we see problems even when
  // they escape a try/catch in user code.
  window.addEventListener('unhandledrejection', (event) => {
    derr('UNHANDLED REJECTION', event.reason);
  });
  window.addEventListener('error', (event) => {
    derr('UNCAUGHT ERROR', event.error || event.message);
  });

  // Nuclear reset — clears everything we care about and reloads.
  // Type `__amia.reset()` in the console to unstick a broken session.
  function nukeClientState() {
    dlog('nuking client state (localStorage + sessionStorage)');
    try {
      // Clear Supabase auth token (prefix varies; match ours explicitly)
      const authKeys = [];
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && (k.startsWith('sb-') || k.includes('supabase') || k.startsWith('amia-'))) {
          authKeys.push(k);
        }
      }
      authKeys.forEach((k) => { dlog('  removing localStorage:', k); localStorage.removeItem(k); });
    } catch (e) { derr('localStorage clear failed', e); }

    try {
      const ssKeys = [];
      for (let i = 0; i < sessionStorage.length; i++) {
        const k = sessionStorage.key(i);
        if (k) ssKeys.push(k);
      }
      ssKeys.forEach((k) => { dlog('  removing sessionStorage:', k); sessionStorage.removeItem(k); });
    } catch (e) { derr('sessionStorage clear failed', e); }
  }

  // Expose a tiny debug handle. You can run these in the console:
  //   __amia.reset()        → full reset + reload
  //   __amia.state()        → dump current user + candidate
  //   __amia.cache()        → list all quiz caches
  //   __amia.clearCache()   → wipe quiz caches only (keeps auth)
  //   __amia.version        → build tag
  window.__amia = {
    version: 'careers-debug-1',
    sb,                       // Use this in console instead of createClient!
    reset: async () => {
      try { await sb.auth.signOut(); } catch (e) { derr('signOut during reset', e); }
      nukeClientState();
      location.hash = '#/';
      setTimeout(() => location.reload(), 50);
    },
    state: () => ({
      user: store._user ? { id: store._user.id, email: store._user.email } : null,
      candidate: store._candidate ? { id: store._candidate.id, name: store._candidate.first_name } : null,
      route: location.hash,
    }),
    cache: () => {
      const out = {};
      for (let i = 0; i < sessionStorage.length; i++) {
        const k = sessionStorage.key(i);
        if (k && k.startsWith(QUIZ_CACHE_PREFIX)) {
          try { out[k] = JSON.parse(sessionStorage.getItem(k)); } catch { out[k] = '<unparseable>'; }
        }
      }
      return out;
    },
    clearCache: () => {
      const keys = [];
      for (let i = 0; i < sessionStorage.length; i++) {
        const k = sessionStorage.key(i);
        if (k && k.startsWith(QUIZ_CACHE_PREFIX)) keys.push(k);
      }
      keys.forEach((k) => sessionStorage.removeItem(k));
      dlog(`cleared ${keys.length} quiz cache entries`);
    },
  };

  dlog('boot — script.js loaded, __amia helpers ready');


  /* ─────────────────────────────────────────────────────────────
     §2 — State store
       Only two pieces of app-wide state: the auth session and
       the candidate row. Everything else is page-local.
     ─────────────────────────────────────────────────────────── */

  const store = {
    _user: null,
    _candidate: null,

    get user() { return this._user; },
    get candidate() { return this._candidate; },
    get isAuthed() { return !!this._user; },

    setUser(u) {
      this._user = u;
      // candidate row is tied to user; clear when user changes
      if (!u) this._candidate = null;
      updateHeaderAuthUI();
    },
    setCandidate(c) { this._candidate = c; },

    async hydrate() {
      // [DEBUG] timeout on getUser — primary cause of infinite spinner
      // if the stored token is corrupt (Supabase client hangs internally
      // on refresh loop instead of erroring out).
      try {
        const { data } = await withTimeout(sb.auth.getUser(), 'auth.getUser');
        this._user = data.user || null;
        dlog('hydrate: user =', this._user ? this._user.email : '(none)');
      } catch (e) {
        derr('hydrate: getUser failed or timed out — wiping auth state', e);
        // Broken token state: nuke and continue as anon.
        try { await sb.auth.signOut(); } catch {}
        nukeClientState();
        this._user = null;
      }

      if (this._user) {
        try {
          await withTimeout(this.loadCandidate(), 'loadCandidate');
        } catch (e) {
          derr('hydrate: loadCandidate failed — continuing without candidate row', e);
          this._candidate = null;
        }
      }
      updateHeaderAuthUI();
    },

    async loadCandidate() {
      if (!this._user) { this._candidate = null; return; }
      const { data, error } = await sb.from('candidates')
        .select('*')
        .eq('user_id', this._user.id)
        .maybeSingle();
      if (error) {
        derr('loadCandidate: query error', error);
        throw error;
      }
      this._candidate = data || null;
      dlog('loadCandidate: candidate =', this._candidate ? this._candidate.id : '(none)');
    },
  };

  // [DEBUG] Now that store exists, attach it to the debug handle.
  // Read current state from console with: __amia.store.user / __amia.store.candidate
  window.__amia.store = store;


  /* ─────────────────────────────────────────────────────────────
     §3 — Utils
     ─────────────────────────────────────────────────────────── */

  let toastTimer = null;
  function toast(msg, isError) {
    TOAST_EL.textContent = msg;
    TOAST_EL.classList.toggle('error', !!isError);
    TOAST_EL.classList.add('show');
    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(() => TOAST_EL.classList.remove('show'), 3000);
  }

  function escapeHtml(s) {
    if (s == null) return '';
    return String(s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  // Convert newlines to <br>, but escape everything else.
  function escapeHtmlMultiline(s) {
    return escapeHtml(s).replace(/\n/g, '<br>');
  }

  const CONTRACT_LABELS = {
    full_time:   'Full-time',
    part_time:   'Part-time',
    freelance:   'Freelance',
    internship:  'Stage',
  };
  function contractLabel(t) { return CONTRACT_LABELS[t] || t; }

  const APP_STATUS_LABELS = {
    applied:   'Candidato',
    interview: 'Colloquio',
    hired:     'Assunto',
    rejected:  'Scartato',
  };

  // Question-images bucket is public → direct URL, no signing needed.
  // Defensive: look in both question-level and option-level `image_path` /
  // `image_url` fields. Admin can settle on a convention later without
  // breaking us.
  function questionImageUrl(config) {
    if (!config) return null;
    return resolveImage(config.image_path || config.image_url);
  }
  function optionImageUrl(opt) {
    if (!opt || typeof opt !== 'object') return null;
    return resolveImage(opt.image_path || opt.image_url);
  }
  function resolveImage(pathOrUrl) {
    if (!pathOrUrl) return null;
    if (/^https?:\/\//i.test(pathOrUrl)) return pathOrUrl;
    return `${SUPABASE_URL}/storage/v1/object/public/question-images/${pathOrUrl}`;
  }

  function setPageTransition(container) {
    container.classList.remove('page-enter', 'page-active');
    container.classList.add('page-enter');
    requestAnimationFrame(() => {
      container.classList.remove('page-enter');
      container.classList.add('page-active');
    });
  }

  function loadingCenter() {
    return '<div class="loading-center"><div class="spinner"></div></div>';
  }

  // Keep "La mia area" link hidden when logged out.
  function updateHeaderAuthUI() {
    document.querySelectorAll('[data-requires-auth="true"]').forEach((el) => {
      if (store.isAuthed) el.removeAttribute('hidden');
      else el.setAttribute('hidden', '');
    });
  }

  // SessionStorage: cache quiz payload so refresh mid-quiz doesn't re-shuffle
  const QUIZ_CACHE_PREFIX = 'amia-careers:quiz:';
  function quizCacheKey(appId, quizType) {
    return `${QUIZ_CACHE_PREFIX}${appId}:${quizType}`;
  }
  function readQuizCache(appId, quizType) {
    try {
      const raw = sessionStorage.getItem(quizCacheKey(appId, quizType));
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      // [DEBUG] Validate the cache payload looks like a real quiz row.
      // If the schema drifted or the cache was written by an older build,
      // discard rather than render garbage.
      if (!parsed || typeof parsed !== 'object' || !parsed.quiz_id || !Array.isArray(parsed.questions)) {
        dlog('readQuizCache: invalid payload, discarding', parsed);
        sessionStorage.removeItem(quizCacheKey(appId, quizType));
        return null;
      }
      return parsed;
    } catch (e) {
      derr('readQuizCache: parse failed, clearing', e);
      try { sessionStorage.removeItem(quizCacheKey(appId, quizType)); } catch {}
      return null;
    }
  }
  function writeQuizCache(appId, quizType, payload) {
    try {
      sessionStorage.setItem(quizCacheKey(appId, quizType), JSON.stringify(payload));
    } catch { /* quota, ignore */ }
  }
  function clearQuizCache(appId, quizType) {
    try { sessionStorage.removeItem(quizCacheKey(appId, quizType)); } catch {}
  }


  /* ─────────────────────────────────────────────────────────────
     §4 — API layer
       One place where RPC argument names live. If Supabase renames
       something, only this section changes.
     ─────────────────────────────────────────────────────────── */

  const api = {

    async listPublishedPositions() {
      return timed('api.listPublishedPositions', async () => {
        const { data, error } = await withTimeout(
          sb.from('positions')
            .select('id, slug, title, department, location, contract_type')
            .eq('status', 'published')
            .order('published_at', { ascending: false }),
          'positions.select'
        );
        if (error) throw error;
        return data || [];
      });
    },

    async getPositionBySlugOrId(slugOrId) {
      return timed(`api.getPositionBySlugOrId(${slugOrId})`, async () => {
        let res = await withTimeout(
          sb.from('positions').select('*')
            .eq('slug', slugOrId).eq('status', 'published').maybeSingle(),
          'position.bySlug'
        );
        if (res.data) return res.data;
        if (/^[0-9a-f-]{36}$/i.test(slugOrId)) {
          res = await withTimeout(
            sb.from('positions').select('*')
              .eq('id', slugOrId).eq('status', 'published').maybeSingle(),
            'position.byId'
          );
          return res.data || null;
        }
        return null;
      });
    },

    async signUp(email, password) {
      return timed('api.signUp', async () => {
        const { data, error } = await withTimeout(
          sb.auth.signUp({ email, password }),
          'auth.signUp'
        );
        if (error) throw error;
        return data.user;
      });
    },

    async signIn(email, password) {
      return timed('api.signIn', async () => {
        const { data, error } = await withTimeout(
          sb.auth.signInWithPassword({ email, password }),
          'auth.signIn'
        );
        if (error) throw error;
        return data.user;
      });
    },

    async signOut() {
      return timed('api.signOut', async () => {
        await withTimeout(sb.auth.signOut(), 'auth.signOut');
      });
    },

    async upsertCandidate(payload) {
      return timed('api.upsertCandidate', async () => {
        if (store.candidate) {
          const { data, error } = await withTimeout(
            sb.from('candidates').update(payload).eq('id', store.candidate.id).select().single(),
            'candidates.update'
          );
          if (error) throw error;
          return data;
        }
        const { data, error } = await withTimeout(
          sb.from('candidates').insert(payload).select().single(),
          'candidates.insert'
        );
        if (error) throw error;
        return data;
      });
    },

    async findExistingApplication(positionId, candidateId) {
      return timed('api.findExistingApplication', async () => {
        const { data } = await withTimeout(
          sb.from('applications')
            .select('id')
            .eq('position_id', positionId)
            .eq('candidate_id', candidateId)
            .maybeSingle(),
          'applications.findExisting'
        );
        return data;
      });
    },

    async uploadCV(candidateId, file) {
      return timed(`api.uploadCV (${(file.size / 1024).toFixed(0)}KB)`, async () => {
        const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
        const path = `${candidateId}/${Date.now()}_${safeName}`;
        // Upload timeout: larger than default since 10MB over slow 3G takes time
        const { error } = await withTimeout(
          sb.storage.from('cvs').upload(path, file, {
            contentType: 'application/pdf',
            upsert: false,
          }),
          'storage.upload',
          30000
        );
        if (error) throw error;
        return path;
      });
    },

    async createApplication(payload) {
      return timed('api.createApplication', async () => {
        const { data, error } = await withTimeout(
          sb.from('applications').insert(payload).select().single(),
          'applications.insert'
        );
        if (error) throw error;
        return data;
      });
    },

    async listMyApplications(candidateId) {
      return timed('api.listMyApplications', async () => {
        const { data, error } = await withTimeout(
          sb.from('applications')
            .select('*, position:positions(title, department, pre_quiz_id, post_quiz_id, att_quiz_id)')
            .eq('candidate_id', candidateId)
            .order('created_at', { ascending: false }),
          'applications.listMine'
        );
        if (error) throw error;
        return (data || []).map((a) => ({
          ...a,
          position: Array.isArray(a.position) ? a.position[0] : a.position,
        }));
      });
    },

    async getApplicationWithPosition(applicationId) {
      return timed(`api.getApplicationWithPosition(${applicationId})`, async () => {
        const { data, error } = await withTimeout(
          sb.from('applications')
            .select('*, position:positions(*)')
            .eq('id', applicationId)
            .maybeSingle(),
          'applications.byId'
        );
        if (error) throw error;
        if (!data) return null;
        return {
          ...data,
          position: Array.isArray(data.position) ? data.position[0] : data.position,
        };
      });
    },

    async getQuizQuestionCount(quizId) {
      return timed('api.getQuizQuestionCount', async () => {
        const { count } = await withTimeout(
          sb.from('quiz_questions')
            .select('*', { count: 'exact', head: true })
            .eq('quiz_id', quizId),
          'quiz_questions.count'
        );
        return count ?? 0;
      });
    },

    async getQuizForCandidate(applicationId, quizType) {
      return timed(`api.getQuizForCandidate(${quizType})`, async () => {
        const { data, error } = await withTimeout(
          sb.rpc('get_quiz_for_candidate', {
            p_application_id: applicationId,
            p_quiz_type: quizType,
          }),
          'rpc.get_quiz_for_candidate'
        );
        if (error) { derr('RPC get_quiz_for_candidate error', error); throw error; }
        const row = Array.isArray(data) ? data[0] : data;
        dlog('RPC returned', {
          quiz_id: row?.quiz_id, title: row?.title,
          question_count: Array.isArray(row?.questions) ? row.questions.length : 0,
          duration: row?.duration_minutes,
        });
        return row;
      });
    },

    async submitQuiz(applicationId, quizType, answers, startedAt, completedAt) {
      return timed(`api.submitQuiz(${quizType})`, async () => {
        dlog('submitQuiz payload keys:', Object.keys(answers).length, 'questions answered');
        const { data, error } = await withTimeout(
          sb.rpc('submit_quiz', {
            p_application_id: applicationId,
            p_quiz_type: quizType,
            p_answers: answers,
            p_started_at: startedAt,
            p_completed_at: completedAt,
          }),
          'rpc.submit_quiz',
          20000
        );
        if (error) { derr('RPC submit_quiz error', error); throw error; }
        dlog('submit_quiz result:', data);
        return data;
      });
    },
  };


  /* ─────────────────────────────────────────────────────────────
     §5 — Router
       Each page's render function may return a `teardown` callback
       (to clear timers / listeners). We call it before the next
       page mounts. This replaces the old module-level state leaks.
     ─────────────────────────────────────────────────────────── */

  let currentTeardown = null;

  // Route patterns: [regex, handler(args...)]
  // The handler receives captured groups in order.
  const routes = [
    [/^\/$/,                                () => renderJobsList()],
    [/^\/apply\/([^/]+)$/,                  (slug) => renderApply(slug)],
    [/^\/portal$/,                          () => renderPortal()],
    [/^\/quiz-overview\/([^/]+)\/([^/]+)$/, (appId, type) => renderQuizOverview(appId, type)],
    [/^\/quiz\/([^/]+)\/([^/]+)$/,          (appId, type) => renderQuiz(appId, type)],
  ];

  async function route() {
    const path = (location.hash || '#/').slice(1) || '/';
    dlog(`route → ${path}`);                              // [DEBUG]

    // Teardown previous page
    if (typeof currentTeardown === 'function') {
      dlog('  tearing down previous page');                // [DEBUG]
      try { currentTeardown(); } catch (e) { derr('teardown error', e); }
      currentTeardown = null;
    }

    // Ensure auth state is fresh before routing
    try {
      await withTimeout(store.hydrate(), 'store.hydrate (in route)');
    } catch (e) {
      derr('route: hydrate failed — showing error and bailing to /', e);
      APP_EL.innerHTML = emptyState(
        'Errore di connessione',
        'Non riusciamo a caricare questa pagina. Prova a ricaricare o a resettare la sessione (apri la console e digita __amia.reset()).',
        '#/', 'Torna alla home'
      );
      return;
    }

    // Auth guard for pages that need it
    const needsAuth = /^\/(portal|quiz|quiz-overview)/.test(path);
    if (needsAuth && !store.isAuthed) {
      dlog('  auth required but not authed → redirecting to /');  // [DEBUG]
      location.hash = '#/';
      return;
    }

    // Match and dispatch
    for (const [regex, handler] of routes) {
      const m = path.match(regex);
      if (m) {
        const args = m.slice(1);
        dlog(`  matched ${regex} with args`, args);         // [DEBUG]
        APP_EL.innerHTML = loadingCenter();
        try {
          const maybeTeardown = await handler(...args);
          if (typeof maybeTeardown === 'function') currentTeardown = maybeTeardown;
          setPageTransition(APP_EL);
        } catch (e) {
          derr(`page handler threw: ${path}`, e);
          APP_EL.innerHTML = emptyState(
            'Qualcosa è andato storto',
            (e && e.message) ? e.message : 'Errore inatteso nel caricamento della pagina.',
            '#/', 'Torna alla home'
          );
        }
        return;
      }
    }

    // Fallback → jobs list
    dlog('  no route matched → falling back to /');        // [DEBUG]
    location.hash = '#/';
  }


  /* ─────────────────────────────────────────────────────────────
     §6 — Pages
     ─────────────────────────────────────────────────────────── */


  /* ── 6.1 — Jobs list (public) ── */

  async function renderJobsList() {
    let jobs;
    try { jobs = await api.listPublishedPositions(); }
    catch (e) { jobs = []; toast('Errore nel caricamento', true); }

    APP_EL.innerHTML = `
      <section class="jobs-hero">
        <div class="container">
          <h1>Lavora con noi</h1>
          <p>Unisciti al team che sta costruendo il futuro di Amia. Cerchiamo persone curiose, appassionate e con voglia di fare.</p>
        </div>
      </section>

      <section class="jobs-section">
        <div class="container">
          ${jobs.length > 0 ? `
            <div class="jobs-grid">
              ${jobs.map((j) => jobCard(j)).join('')}
            </div>
          ` : `
            <p class="no-jobs">Al momento non ci sono posizioni aperte, ma torna a trovarci!</p>
          `}
        </div>
      </section>
    `;
  }

  function jobCard(j) {
    const href = `#/apply/${encodeURIComponent(j.slug || j.id)}`;
    return `
      <a href="${href}" class="job-card">
        <div class="job-card-info">
          <h3>${escapeHtml(j.title)}</h3>
          <div class="job-card-meta">
            <span>${escapeHtml(j.department)}</span>
            <span>·</span>
            <span>${escapeHtml(j.location)}</span>
            <span>·</span>
            <span>${escapeHtml(contractLabel(j.contract_type))}</span>
          </div>
        </div>
        <div class="job-card-arrow" aria-hidden="true">
          <svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7"/>
          </svg>
        </div>
      </a>
    `;
  }


  /* ── 6.2 — Apply page (public → authed on submit) ── */

  async function renderApply(slugOrId) {
    let position;
    try { position = await api.getPositionBySlugOrId(slugOrId); }
    catch (e) { position = null; }

    if (!position) {
      APP_EL.innerHTML = emptyState(
        'Posizione non disponibile',
        'Questa posizione non esiste o non è più aperta.',
        '#/', 'Vedi posizioni aperte'
      );
      return;
    }

    // If already applied, redirect to portal
    if (store.isAuthed && store.candidate) {
      const existing = await api.findExistingApplication(position.id, store.candidate.id);
      if (existing) {
        toast('Hai già una candidatura per questa posizione');
        location.hash = '#/portal';
        return;
      }
    }

    APP_EL.innerHTML = applyPageHtml(position);
    bindApplyPage(position);
  }

  function applyPageHtml(position) {
    const authed = store.isAuthed;
    const cand = store.candidate;
    return `
      <div class="job-detail">
        <a href="#/" class="job-back">← Tutte le posizioni</a>

        <h1>${escapeHtml(position.title)}</h1>
        <div class="job-detail-meta">
          <span>${escapeHtml(position.department)}</span>
          <span>·</span>
          <span>${escapeHtml(position.location)}</span>
          <span>·</span>
          <span>${escapeHtml(contractLabel(position.contract_type))}</span>
        </div>

        <div class="job-description">${escapeHtmlMultiline(position.description || '')}</div>

        <div class="apply-section">
          <h2>Candidati</h2>
          <p class="subtitle">Compila il form per candidarti a questa posizione.</p>

          <div class="auth-box" id="auth-box">
            ${authed ? authedStatusHtml() : authFormHtml()}
          </div>

          <form id="apply-form" class="${authed ? '' : 'form-disabled'}" novalidate>
            <div class="form-grid">
              <div class="form-group">
                <label class="form-label" for="f-first">Nome <span class="required">*</span></label>
                <input type="text" id="f-first" class="form-input" placeholder="Mario"
                  value="${escapeHtml(cand?.first_name || '')}" required>
              </div>
              <div class="form-group">
                <label class="form-label" for="f-last">Cognome <span class="required">*</span></label>
                <input type="text" id="f-last" class="form-input" placeholder="Rossi"
                  value="${escapeHtml(cand?.last_name || '')}" required>
              </div>
              <div class="form-group">
                <label class="form-label" for="f-phone">Telefono</label>
                <input type="tel" id="f-phone" class="form-input" placeholder="+39 333 1234567"
                  value="${escapeHtml(cand?.phone || '')}">
              </div>
              <div class="form-group">
                <label class="form-label" for="f-linkedin">LinkedIn</label>
                <input type="url" id="f-linkedin" class="form-input" placeholder="https://linkedin.com/in/..."
                  value="${escapeHtml(cand?.linkedin_url || '')}">
              </div>
              <div class="form-group full">
                <label class="form-label" for="f-cover">Lettera di presentazione</label>
                <textarea id="f-cover" class="form-textarea"
                  placeholder="Raccontaci perché ti piacerebbe lavorare con noi..."></textarea>
              </div>
              <div class="form-group full">
                <label class="form-label">CV (PDF) <span class="required">*</span></label>
                <label class="form-file-label" id="cv-label" for="f-cv">
                  <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                  </svg>
                  <span id="cv-label-text">Carica il tuo CV</span>
                  <input type="file" id="f-cv" class="form-file-input" accept=".pdf,application/pdf">
                </label>
              </div>
            </div>
            <button type="submit" class="submit-btn" id="apply-submit-btn">
              Invia candidatura
              <svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3"/>
              </svg>
            </button>
          </form>
        </div>
      </div>
    `;
  }

  function authedStatusHtml() {
    return `
      <div class="auth-status">
        <p>Stai candidandoti come <strong>${escapeHtml(store.user.email)}</strong></p>
        <button type="button" class="link-btn" id="logout-btn">Esci</button>
      </div>
    `;
  }

  function authFormHtml() {
    return `
      <div id="auth-form" data-mode="signup">
        <h3 id="auth-title">Crea il tuo account</h3>
        <p class="subtitle" id="auth-subtitle">Serve un account per candidarti e completare i quiz.</p>
        <div class="form-grid">
          <div class="form-group">
            <label class="form-label" for="auth-email">Email <span class="required">*</span></label>
            <input type="email" id="auth-email" class="form-input" placeholder="la.tua@email.com" autocomplete="email">
          </div>
          <div class="form-group">
            <label class="form-label" for="auth-pass">Password <span class="required">*</span></label>
            <input type="password" id="auth-pass" class="form-input" placeholder="Minimo 6 caratteri"
              autocomplete="new-password" minlength="6">
          </div>
        </div>
        <button type="button" class="submit-btn compact" id="auth-btn">
          <span id="auth-btn-text">Crea account</span>
        </button>
        <p class="auth-toggle">
          <span id="auth-toggle-text">Hai già un account?</span>
          <a id="auth-toggle-link">Accedi</a>
        </p>
      </div>
    `;
  }

  function bindApplyPage(position) {
    const form = APP_EL.querySelector('#apply-form');

    // CV file chooser
    const cvInput = APP_EL.querySelector('#f-cv');
    const cvLabel = APP_EL.querySelector('#cv-label');
    const cvText  = APP_EL.querySelector('#cv-label-text');
    cvInput.addEventListener('change', () => {
      const file = cvInput.files[0];
      if (!file) {
        cvLabel.classList.remove('has-file');
        cvText.textContent = 'Carica il tuo CV';
        return;
      }
      if (file.type !== 'application/pdf') {
        toast('Solo file PDF', true); cvInput.value = ''; return;
      }
      if (file.size > 10 * 1024 * 1024) {
        toast('Il file supera 10 MB', true); cvInput.value = ''; return;
      }
      cvLabel.classList.add('has-file');
      cvText.textContent = `${file.name} (${(file.size / (1024*1024)).toFixed(1)} MB)`;
    });

    // Auth box bindings (signup/signin toggle + submit)
    const authBox = APP_EL.querySelector('#auth-box');
    if (store.isAuthed) {
      authBox.querySelector('#logout-btn').addEventListener('click', async () => {
        await api.signOut();
        store.setUser(null);
        toast('Disconnesso');
        // Stay on this page; re-render so the form becomes disabled again
        route();
      });
    } else {
      bindAuthForm(authBox, position);
    }

    // Form submit — only runs when authed; otherwise the form is disabled.
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      if (!store.isAuthed) { toast('Devi prima creare un account o accedere', true); return; }
      submitApplication(position);
    });
  }

  function bindAuthForm(root, position) {
    const authForm = root.querySelector('#auth-form');
    const toggleLink = root.querySelector('#auth-toggle-link');
    const titleEl    = root.querySelector('#auth-title');
    const subEl      = root.querySelector('#auth-subtitle');
    const btnText    = root.querySelector('#auth-btn-text');
    const toggleText = root.querySelector('#auth-toggle-text');
    const btn        = root.querySelector('#auth-btn');
    const emailInp   = root.querySelector('#auth-email');
    const passInp    = root.querySelector('#auth-pass');

    toggleLink.addEventListener('click', () => {
      const isSignup = authForm.dataset.mode === 'signup';
      authForm.dataset.mode = isSignup ? 'signin' : 'signup';
      titleEl.textContent    = isSignup ? 'Accedi' : 'Crea il tuo account';
      subEl.textContent      = isSignup ? 'Usa le credenziali del tuo account.'
                                        : 'Serve un account per candidarti e completare i quiz.';
      btnText.textContent    = isSignup ? 'Accedi' : 'Crea account';
      toggleText.textContent = isSignup ? 'Non hai un account?' : 'Hai già un account?';
      toggleLink.textContent = isSignup ? 'Registrati' : 'Accedi';
    });

    btn.addEventListener('click', async () => {
      const email = emailInp.value.trim();
      const pass  = passInp.value;
      if (!email || !pass) { toast('Compila email e password', true); return; }
      if (pass.length < 6) { toast('La password deve essere di almeno 6 caratteri', true); return; }

      btn.disabled = true;
      const original = btnText.textContent;
      btnText.textContent = 'Attendere...';

      try {
        if (authForm.dataset.mode === 'signup') {
          await api.signUp(email, pass);
          toast('Account creato!');
        } else {
          await api.signIn(email, pass);
          toast('Accesso effettuato!');
        }
        await store.hydrate();
        // Re-render apply page with authed state (prefills name fields if candidate exists)
        renderApply(position.slug || position.id);
      } catch (err) {
        toast(err.message || 'Errore di autenticazione', true);
        btn.disabled = false;
        btnText.textContent = original;
      }
    });
  }

  // The sequenced submit: candidate → CV → application.
  // Must be this order because of RLS (CV path must match candidate id;
  // application requires cv_file_path NOT NULL).
  async function submitApplication(position) {
    const btn = APP_EL.querySelector('#apply-submit-btn');
    const first = APP_EL.querySelector('#f-first').value.trim();
    const last  = APP_EL.querySelector('#f-last').value.trim();
    const phone = APP_EL.querySelector('#f-phone').value.trim();
    const linkedin = APP_EL.querySelector('#f-linkedin').value.trim();
    const cover = APP_EL.querySelector('#f-cover').value.trim();
    const cvFile = APP_EL.querySelector('#f-cv').files[0];

    // Validation
    if (!first || !last) { toast('Nome e cognome sono obbligatori', true); return; }
    if (!cvFile) { toast('Il CV è obbligatorio', true); return; }
    if (cvFile.type !== 'application/pdf') { toast('Il CV deve essere in formato PDF', true); return; }
    if (cvFile.size > 10 * 1024 * 1024) { toast('Il CV non può superare 10 MB', true); return; }

    btn.disabled = true;
    btn.textContent = 'Invio in corso...';
    dlog('submitApplication: starting', { positionId: position.id });

    try {
      // 1. Upsert candidate row
      dlog('submitApplication: step 1/4 — candidate upsert');
      const candidate = await api.upsertCandidate({
        user_id: store.user.id,
        first_name: first,
        last_name: last,
        email: store.user.email,
        phone: phone || null,
        linkedin_url: linkedin || null,
      });
      store.setCandidate(candidate);

      // 2. Guard against duplicate applications (could happen if they
      //    opened two tabs and applied on both).
      dlog('submitApplication: step 2/4 — duplicate check');
      const existing = await api.findExistingApplication(position.id, candidate.id);
      if (existing) {
        toast('Hai già una candidatura per questa posizione', true);
        location.hash = '#/portal';
        return;
      }

      // 3. Upload CV
      dlog('submitApplication: step 3/4 — CV upload');
      const cvPath = await api.uploadCV(candidate.id, cvFile);

      // 4. Create application
      dlog('submitApplication: step 4/4 — application insert');
      await api.createApplication({
        position_id: position.id,
        candidate_id: candidate.id,
        status: 'applied',
        cv_file_path: cvPath,
        cover_letter: cover || null,
      });

      dlog('submitApplication: done');
      toast('Candidatura inviata! 🎉');
      setTimeout(() => { location.hash = '#/portal'; }, 1200);

    } catch (err) {
      derr('submitApplication: failed', err);
      toast(err.message || 'Errore durante l\'invio', true);
      btn.disabled = false;
      btn.innerHTML = `
        Invia candidatura
        <svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3"/>
        </svg>
      `;
    }
  }


  /* ── 6.3 — Portal (candidate dashboard) ── */

  async function renderPortal() {
    if (!store.candidate) {
      APP_EL.innerHTML = `
        <section class="portal-hero">
          <div class="container">
            <h1>La mia area</h1>
            <p>Non hai ancora candidature.</p>
            <div class="portal-userbar">
              <span>${escapeHtml(store.user?.email || '')}</span>
              <button class="link-btn" id="logout-btn">Esci</button>
            </div>
          </div>
        </section>
        <section class="portal-section">
          ${emptyState(
            'Nessuna candidatura',
            'Inizia dando un\'occhiata alle posizioni aperte.',
            '#/', 'Vedi posizioni aperte'
          )}
        </section>
      `;
      bindLogout();
      return;
    }

    let apps;
    try { apps = await api.listMyApplications(store.candidate.id); }
    catch (e) { apps = []; toast('Errore nel caricamento', true); }

    APP_EL.innerHTML = `
      <section class="portal-hero">
        <div class="container">
          <h1>Ciao, ${escapeHtml(store.candidate.first_name)} 👋</h1>
          <p>Ecco le tue candidature e i quiz da completare.</p>
          <div class="portal-userbar">
            <span>${escapeHtml(store.user.email)}</span>
            <button class="link-btn" id="logout-btn">Esci</button>
          </div>
        </div>
      </section>
      <section class="portal-section">
        ${apps.length > 0
          ? apps.map(applicationCard).join('')
          : emptyState(
              'Nessuna candidatura',
              'Inizia dando un\'occhiata alle posizioni aperte.',
              '#/', 'Vedi posizioni aperte'
            )
        }
      </section>
    `;

    bindLogout();
  }

  function applicationCard(app) {
    const p = app.position || {};
    const quizzes = [];
    if (p.pre_quiz_id) quizzes.push({
      type: 'pre', label: 'Quiz Logica', icon: '🧠',
      subtitle: 'Ragionamento logico e problem solving',
      duration: '25 minuti',
      done: !!app.pre_quiz_completed_at,
      score: app.pre_quiz_score, max: app.pre_quiz_max_score,
    });
    if (p.post_quiz_id) quizzes.push({
      type: 'post', label: 'Quiz Skills', icon: '💻',
      subtitle: 'Competenze tecniche per il ruolo',
      duration: '35 minuti',
      done: !!app.post_quiz_completed_at,
      score: app.post_quiz_score, max: app.post_quiz_max_score,
    });
    if (p.att_quiz_id) quizzes.push({
      type: 'att', label: 'Domande Attitudinali', icon: '💬',
      subtitle: 'Motivazione, cultura e modo di lavorare',
      duration: 'Nessun limite',
      done: !!app.att_quiz_completed_at,
      score: null, max: null,
    });

    return `
      <div class="app-card">
        <div class="app-card-header">
          <div>
            <h3>${escapeHtml(p.title || '—')}</h3>
            <span class="app-card-dept">${escapeHtml(p.department || '')}</span>
          </div>
          <span class="status-badge status-${escapeHtml(app.status)}">${escapeHtml(APP_STATUS_LABELS[app.status] || app.status)}</span>
        </div>
        ${quizzes.length > 0 ? `
          <div class="quiz-rows">
            ${quizzes.map((q) => quizRow(app.id, q)).join('')}
          </div>
        ` : `
          <p style="font-size:13px; color:var(--muted-soft); font-weight:300">
            Nessun quiz per questa posizione.
          </p>
        `}
      </div>
    `;
  }

  function quizRow(appId, q) {
    if (q.done) {
      let scoreEl;
      if (q.type === 'att') {
        // Attitudinal: no percentage to show (composite is admin-only)
        scoreEl = `<div class="quiz-row-score score-good">✓<div class="score-sub">Completato</div></div>`;
      } else if (q.score != null && q.max) {
        const pct = Math.round((q.score / q.max) * 100);
        const cls = pct >= 80 ? 'score-good' : pct >= 60 ? 'score-mid' : 'score-low';
        scoreEl = `<div class="quiz-row-score ${cls}">${pct}%<div class="score-sub">Completato</div></div>`;
      } else {
        scoreEl = `<div class="quiz-row-score score-good">✓<div class="score-sub">Completato</div></div>`;
      }
      return `
        <div class="quiz-row done">
          <div class="quiz-row-left">
            <span class="quiz-row-icon">${q.icon}</span>
            <div class="quiz-row-text">
              <p class="label">${escapeHtml(q.label)}</p>
              <p class="subtitle">${escapeHtml(q.subtitle)}</p>
            </div>
          </div>
          <div class="quiz-row-right">${scoreEl}</div>
        </div>
      `;
    }
    return `
      <div class="quiz-row">
        <div class="quiz-row-left">
          <span class="quiz-row-icon">${q.icon}</span>
          <div class="quiz-row-text">
            <p class="label">${escapeHtml(q.label)}</p>
            <p class="subtitle">${escapeHtml(q.subtitle)}</p>
          </div>
        </div>
        <div class="quiz-row-right">
          <div class="quiz-row-meta">
            <div class="meta-duration">⏱ ${escapeHtml(q.duration)}</div>
            <div class="meta-sub">Non completato</div>
          </div>
          <a href="#/quiz-overview/${encodeURIComponent(appId)}/${encodeURIComponent(q.type)}" class="quiz-go-btn">
            Inizia
          </a>
        </div>
      </div>
    `;
  }

  function bindLogout() {
    const btn = APP_EL.querySelector('#logout-btn');
    if (!btn) return;
    btn.addEventListener('click', async () => {
      await api.signOut();
      store.setUser(null);
      toast('Disconnesso');
      location.hash = '#/';
    });
  }


  /* ── 6.4 — Quiz overview (briefing page) ── */

  const QUIZ_TYPE_INFO = {
    pre: {
      icon: '🧠', title: 'Quiz Logica',
      desc: 'Questo quiz valuta le tue capacità di ragionamento logico, problem solving e pensiero critico. Include domande a scelta multipla e domande di ranking.',
      rules: [
        'Alcune domande a scelta multipla possono avere più risposte corrette',
        'Nelle domande di ranking trascina gli elementi per ordinarli',
        'Rispondi con calma — la qualità conta più della velocità',
      ],
    },
    post: {
      icon: '💻', title: 'Quiz Skills',
      desc: 'Questo quiz valuta le tue competenze tecniche specifiche per il ruolo. Include domande teoriche, scenari pratici e ranking di opzioni.',
      rules: [
        'Le domande sono specifiche per la posizione a cui ti sei candidato',
        'Per le domande aperte, sii concreto e usa esempi reali',
        'Non c\'è penalità per risposte errate — meglio provare che lasciare in bianco',
      ],
    },
    att: {
      icon: '💬', title: 'Domande Attitudinali',
      desc: 'Queste domande ci aiutano a conoscerti meglio come persona e professionista. Non ci sono risposte giuste o sbagliate — vogliamo capire come lavori.',
      rules: [
        'Rispondi in modo autentico — la coerenza conta più della "risposta giusta"',
        'Non c\'è un limite di tempo: prenditi tutto lo spazio che ti serve',
        'Le tue risposte guidano il colloquio, non lo sostituiscono',
      ],
    },
  };

  async function renderQuizOverview(applicationId, quizType) {
    const info = QUIZ_TYPE_INFO[quizType];
    if (!info) { toast('Quiz non valido', true); location.hash = '#/portal'; return; }

    let app, quiz, count;
    try {
      app = await api.getApplicationWithPosition(applicationId);
      if (!app) throw new Error('not found');
      const p = app.position;
      const quizId = quizType === 'pre' ? p.pre_quiz_id
                   : quizType === 'post' ? p.post_quiz_id
                   : p.att_quiz_id;
      if (!quizId) throw new Error('quiz not configured');

      // Fetch quiz meta (RLS blocks this for candidates — fall back to the RPC,
      // which we'll call with an intermediate path: use the quiz row inside the
      // payload for title/description/duration, and ask for question count via RPC).
      // Simpler: the RPC returns title + description + duration_minutes + questions.
      // We use the RPC here *just to populate the overview*. It's the same RPC the
      // quiz page will use; both call sites go through the session cache so the
      // shuffle order is stable.
      const cached = readQuizCache(applicationId, quizType);
      if (cached) {
        quiz = cached;
      } else {
        quiz = await api.getQuizForCandidate(applicationId, quizType);
        if (!quiz) throw new Error('quiz not found');
        writeQuizCache(applicationId, quizType, quiz);
      }
      count = Array.isArray(quiz.questions) ? quiz.questions.length : 0;
    } catch (err) {
      console.error('overview load failed', err);
      toast(err.message || 'Errore nel caricamento', true);
      location.hash = '#/portal';
      return;
    }

    // Completion guard: if already done, send back to portal
    const completedMap = {
      pre: app.pre_quiz_completed_at,
      post: app.post_quiz_completed_at,
      att: app.att_quiz_completed_at,
    };
    if (completedMap[quizType]) {
      toast('Hai già completato questo quiz');
      location.hash = '#/portal';
      return;
    }

    const p = app.position;
    APP_EL.innerHTML = `
      <div class="quiz-overview">
        <a href="#/portal" class="job-back">← Le mie candidature</a>

        <div class="quiz-overview-header">
          <span class="icon" aria-hidden="true">${info.icon}</span>
          <h1>${escapeHtml(info.title)}</h1>
          <p>${escapeHtml(p.title)} · ${escapeHtml(p.department)}</p>
        </div>

        <div class="quiz-overview-card">
          <p class="quiz-overview-desc">${escapeHtml(info.desc)}</p>
          <div class="quiz-overview-stats">
            <div>
              <p class="stat-num">${count || '—'}</p>
              <p class="stat-label">Domande</p>
            </div>
            <div>
              <p class="stat-num">${quiz.duration_minutes ? escapeHtml(String(quiz.duration_minutes)) + ' min' : '∞'}</p>
              <p class="stat-label">Tempo${quiz.duration_minutes ? '' : ' (illimitato)'}</p>
            </div>
          </div>
          <div class="quiz-overview-rules">
            <p class="rules-title">Da sapere prima di iniziare:</p>
            <ul>
              ${info.rules.map((r) => `<li>${escapeHtml(r)}</li>`).join('')}
            </ul>
          </div>
        </div>

        <div class="quiz-overview-warn">
          <p class="warn-title">⚠️ Importante</p>
          <p class="warn-body">
            Non condividere, copiare o divulgare il contenuto di questo quiz in nessuna forma.
            Le risposte devono essere il frutto del tuo lavoro personale.
            ${quiz.duration_minutes ? 'Il timer partirà nel momento in cui clicchi "Inizia il quiz".' : ''}
          </p>
        </div>

        <div class="quiz-overview-actions">
          <a href="#/quiz/${encodeURIComponent(applicationId)}/${encodeURIComponent(quizType)}"
             class="submit-btn" style="text-decoration:none">
            Inizia il quiz
            <svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3"/>
            </svg>
          </a>
          <p class="hint">Questa pagina non farà iniziare la tua task</p>
        </div>
      </div>
    `;
  }


  /* ── 6.5 — Quiz (taking page) ── */

  async function renderQuiz(applicationId, quizType) {
    let app, quiz;
    try {
      app = await api.getApplicationWithPosition(applicationId);
      if (!app) throw new Error('not found');
      // Completion guard
      const completedMap = {
        pre: app.pre_quiz_completed_at,
        post: app.post_quiz_completed_at,
        att: app.att_quiz_completed_at,
      };
      if (completedMap[quizType]) {
        toast('Hai già completato questo quiz');
        location.hash = '#/portal';
        return;
      }

      // Reuse cached payload if present — keeps shuffle stable on refresh.
      const cached = readQuizCache(applicationId, quizType);
      if (cached) {
        quiz = cached;
      } else {
        quiz = await api.getQuizForCandidate(applicationId, quizType);
        if (!quiz) throw new Error('quiz not found');
        writeQuizCache(applicationId, quizType, quiz);
      }
    } catch (err) {
      console.error('quiz load failed', err);
      toast(err.message || 'Errore nel caricamento', true);
      location.hash = '#/portal';
      return;
    }

    const questions = Array.isArray(quiz.questions) ? quiz.questions : [];
    dlog('renderQuiz: mounted', {
      quizId: quiz.quiz_id, title: quiz.title,
      questionCount: questions.length, types: questions.map((q) => q.question_type),
      duration: quiz.duration_minutes, fromCache: !!readQuizCache(applicationId, quizType),
    });
    if (questions.length === 0) {
      APP_EL.innerHTML = emptyState(
        'Quiz non disponibile',
        'Questo quiz non ha ancora domande configurate.',
        '#/portal', 'Torna al portale'
      );
      return;
    }

    // Timer: captured when the quiz is first mounted on this page,
    // passed unchanged through to submit_quiz.
    const startedAt = new Date();
    const durationMs = quiz.duration_minutes ? quiz.duration_minutes * 60000 : null;

    // Answers map: { [question_id]: answer }
    //   MC:      [index, index, ...]   (0-based indices into options)
    //   ranking: [id, id, id, ...]     (option ids, ordered top→bottom)
    //   open:    "string"
    const answers = {};

    // For ranking questions: initial order is the RPC's shuffled order.
    // Seed the answers map with current visual order so a submit-without-
    // interaction still records a valid (if random) ranking.
    for (const q of questions) {
      if (q.question_type === 'ranking') {
        const opts = (q.config && q.config.options) || [];
        answers[q.id] = opts.map((o) => o.id);
      } else if (q.question_type === 'multiple_choice') {
        answers[q.id] = [];
      } else if (q.question_type === 'open_text') {
        answers[q.id] = '';
      }
    }

    APP_EL.innerHTML = `
      <div class="quiz-page">
        <a href="#/portal" class="job-back">← Le mie candidature</a>
        <h1>${escapeHtml(quiz.title)}</h1>
        ${quiz.description ? `<p class="quiz-desc">${escapeHtml(quiz.description)}</p>` : ''}
        ${durationMs ? `<div class="quiz-timer" id="quiz-timer">⏱ --:--</div>` : ''}

        <div id="quiz-questions">
          ${questions.map((q, i) => questionHtml(q, i, questions.length)).join('')}
        </div>

        <button class="submit-btn" id="quiz-submit">
          Consegna quiz
          <svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/>
          </svg>
        </button>
      </div>
    `;

    // Bindings
    bindMultipleChoice(questions, answers);
    bindOpenText(questions, answers);
    const rankingTeardown = bindRanking(questions, answers);

    let timerId = null;
    let expired = false;
    if (durationMs) {
      const timerEl = APP_EL.querySelector('#quiz-timer');
      const tick = () => {
        const elapsed = Date.now() - startedAt.getTime();
        const remaining = Math.max(0, durationMs - elapsed);
        const mins = Math.floor(remaining / 60000);
        const secs = Math.floor((remaining % 60000) / 1000);
        timerEl.textContent = `⏱ ${mins}:${String(secs).padStart(2, '0')}`;
        if (remaining < 300000) timerEl.classList.add('warning');
        if (remaining <= 0 && !expired) {
          expired = true;
          timerEl.classList.remove('warning');
          timerEl.classList.add('expired');
          timerEl.textContent = '⏱ Tempo scaduto';
          clearInterval(timerId);
          toast('Tempo scaduto — invio in corso');
          doSubmit();
        }
      };
      tick();
      timerId = setInterval(tick, 500);
    }

    const submitBtn = APP_EL.querySelector('#quiz-submit');
    submitBtn.addEventListener('click', () => doSubmit());

    let submitting = false;
    async function doSubmit() {
      if (submitting) { dlog('doSubmit: already submitting, ignoring');  return; }
      submitting = true;
      submitBtn.disabled = true;
      submitBtn.textContent = 'Invio in corso...';
      dlog('doSubmit: starting', { quizType, answerCount: Object.keys(answers).length });

      const completedAt = new Date();

      try {
        const result = await api.submitQuiz(
          applicationId, quizType, answers,
          startedAt.toISOString(), completedAt.toISOString()
        );
        clearQuizCache(applicationId, quizType);
        dlog('doSubmit: success', result);

        // For logic/skills, show a small thank-you with score; for att, no score.
        const hasScore = quizType !== 'att' && result && result.max_score > 0;
        if (hasScore) {
          const pct = Math.round((result.total_score / result.max_score) * 100);
          toast(`Quiz completato! ${pct}% 🎉`);
        } else {
          toast('Quiz completato! 🎉');
        }
        setTimeout(() => { location.hash = '#/portal'; }, 1500);
      } catch (err) {
        derr('doSubmit: submit failed', err);

        // [DEBUG] If we timed out, the RPC may have actually succeeded server-side.
        // Check the application row to see if the quiz was recorded — if yes,
        // don't let the user re-submit (we'd overwrite).
        if (err && err.isTimeout) {
          dlog('doSubmit: timeout → checking if submission actually landed');
          try {
            const check = await api.getApplicationWithPosition(applicationId);
            const completedField = quizType === 'pre'  ? check?.pre_quiz_completed_at
                                 : quizType === 'post' ? check?.post_quiz_completed_at
                                 :                       check?.att_quiz_completed_at;
            if (completedField) {
              dlog('doSubmit: quiz actually landed — redirecting to portal');
              clearQuizCache(applicationId, quizType);
              toast('Quiz completato! 🎉');
              setTimeout(() => { location.hash = '#/portal'; }, 1200);
              return;
            }
          } catch (checkErr) {
            derr('doSubmit: post-timeout check also failed', checkErr);
          }
        }

        toast(err.message || 'Errore durante l\'invio', true);
        submitting = false;
        submitBtn.disabled = false;
        submitBtn.innerHTML = `
          Consegna quiz
          <svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/>
          </svg>
        `;
      }
    }

    // Teardown
    return () => {
      if (timerId) clearInterval(timerId);
      if (typeof rankingTeardown === 'function') rankingTeardown();
    };
  }


  /* ─────────────────────────────────────────────────────────────
     §7 — Quiz renderers (markup + bindings per question type)
     ─────────────────────────────────────────────────────────── */

  function questionHtml(q, index, total) {
    const imgUrl = questionImageUrl(q.config);
    const points = q.points > 0 ? ` · ${q.points} punti` : '';

    let body;
    if (q.question_type === 'multiple_choice') {
      body = mcHtml(q);
    } else if (q.question_type === 'ranking') {
      body = rankingHtml(q);
    } else if (q.question_type === 'open_text') {
      body = `<textarea class="open-textarea" data-question-id="${escapeHtml(q.id)}"
                placeholder="Scrivi la tua risposta..." rows="6"></textarea>`;
    } else if (q.question_type === 'file_upload') {
      body = `<div class="file-upload-placeholder">
        Upload di file sarà disponibile a breve. Puoi proseguire senza caricare nulla per ora.
      </div>`;
    } else {
      body = `<div class="file-upload-placeholder">Tipo di domanda non supportato: ${escapeHtml(q.question_type)}</div>`;
    }

    return `
      <div class="question-card" data-question-id="${escapeHtml(q.id)}">
        <div class="question-num">Domanda ${index + 1} di ${total}${points}</div>
        <div class="question-text">${escapeHtml(q.question_text)}</div>
        ${imgUrl ? `<img class="question-image" src="${escapeHtml(imgUrl)}" alt="">` : ''}
        ${body}
      </div>
    `;
  }

  function mcHtml(q) {
    const options = (q.config && q.config.options) || [];
    const multi = !!(q.config && q.config.allow_multiple);
    if (multi) {
      // Small hint so candidates know multi is allowed
      const hint = `<p class="question-hint">Puoi selezionare più risposte.</p>`;
      return hint + options.map((opt, j) => mcOptionHtml(q.id, opt, j, true)).join('');
    }
    return options.map((opt, j) => mcOptionHtml(q.id, opt, j, false)).join('');
  }

  function mcOptionHtml(qId, opt, index, multi) {
    // Options are strings (per schema); but be defensive in case admin
    // swaps to object-options with images later.
    let label, imgUrl = null;
    if (typeof opt === 'string') {
      label = opt;
    } else if (opt && typeof opt === 'object') {
      label = opt.label || opt.text || '';
      imgUrl = optionImageUrl(opt);
    } else {
      label = String(opt);
    }
    const box = multi ? '<div class="mc-checkbox"></div>' : '<div class="mc-radio"></div>';
    return `
      <div class="mc-option" data-question-id="${escapeHtml(qId)}" data-value="${index}">
        ${box}
        <div style="flex:1; min-width:0">
          <span class="mc-label">${escapeHtml(label)}</span>
          ${imgUrl ? `<img class="mc-option-image" src="${escapeHtml(imgUrl)}" alt="">` : ''}
        </div>
      </div>
    `;
  }

  function rankingHtml(q) {
    const options = (q.config && q.config.options) || [];
    const hint = `<p class="question-hint">Trascina per ordinare dal più importante (in alto) al meno importante.</p>`;
    const items = options.map((opt, i) => `
      <li class="ranking-item" draggable="true"
          data-question-id="${escapeHtml(q.id)}"
          data-option-id="${escapeHtml(opt.id)}">
        <span class="ranking-rank">${i + 1}</span>
        <span class="ranking-label">${escapeHtml(opt.label || '')}</span>
        <span class="ranking-handle" aria-hidden="true">
          <svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" d="M4 6h16M4 12h16M4 18h16"/>
          </svg>
        </span>
      </li>
    `).join('');
    return `${hint}<ul class="ranking-list" data-question-id="${escapeHtml(q.id)}">${items}</ul>`;
  }

  function bindMultipleChoice(questions, answers) {
    APP_EL.querySelectorAll('.mc-option').forEach((opt) => {
      opt.addEventListener('click', () => {
        const qId = opt.dataset.questionId;
        const val = parseInt(opt.dataset.value, 10);
        const q = questions.find((x) => x.id === qId);
        if (!q) return;
        const multi = !!(q.config && q.config.allow_multiple);

        if (multi) {
          if (!Array.isArray(answers[qId])) answers[qId] = [];
          const idx = answers[qId].indexOf(val);
          if (idx >= 0) answers[qId].splice(idx, 1);
          else answers[qId].push(val);
        } else {
          answers[qId] = [val];
        }

        // Update UI within this question's options
        const card = opt.closest('.question-card');
        card.querySelectorAll('.mc-option').forEach((o) => {
          const v = parseInt(o.dataset.value, 10);
          const selected = (answers[qId] || []).includes(v);
          o.classList.toggle('selected', selected);
        });
      });
    });
  }

  function bindOpenText(questions, answers) {
    APP_EL.querySelectorAll('.open-textarea').forEach((ta) => {
      ta.addEventListener('input', () => {
        answers[ta.dataset.questionId] = ta.value;
      });
    });
  }


  /* ─────────────────────────────────────────────────────────────
     §8 — Ranking drag-drop
       HTML5 DnD, no library. On drop, rewrite the answers[] array
       for that question in the new visual order.
     ─────────────────────────────────────────────────────────── */

  function bindRanking(questions, answers) {
    const lists = APP_EL.querySelectorAll('.ranking-list');
    const cleanups = [];

    lists.forEach((list) => {
      let dragged = null;

      const onDragStart = (e) => {
        const item = e.target.closest('.ranking-item');
        if (!item || item.parentElement !== list) return;
        dragged = item;
        item.classList.add('dragging');
        e.dataTransfer.effectAllowed = 'move';
        // Firefox requires setData to start a drag
        try { e.dataTransfer.setData('text/plain', item.dataset.optionId || ''); } catch {}
      };

      const onDragEnd = () => {
        if (dragged) dragged.classList.remove('dragging');
        dragged = null;
        list.querySelectorAll('.drop-target').forEach((el) => el.classList.remove('drop-target'));
      };

      const onDragOver = (e) => {
        e.preventDefault();
        if (!dragged) return;
        e.dataTransfer.dropEffect = 'move';
        const target = e.target.closest('.ranking-item');
        list.querySelectorAll('.drop-target').forEach((el) => el.classList.remove('drop-target'));
        if (!target || target === dragged || target.parentElement !== list) return;
        target.classList.add('drop-target');

        // Decide insert before or after based on midline
        const rect = target.getBoundingClientRect();
        const midpoint = rect.top + rect.height / 2;
        if (e.clientY < midpoint) {
          list.insertBefore(dragged, target);
        } else {
          list.insertBefore(dragged, target.nextSibling);
        }
      };

      const onDrop = (e) => {
        e.preventDefault();
        list.querySelectorAll('.drop-target').forEach((el) => el.classList.remove('drop-target'));
        // Rewrite answer array & rank badges from current DOM order
        const qId = list.dataset.questionId;
        const items = Array.from(list.querySelectorAll('.ranking-item'));
        answers[qId] = items.map((it) => it.dataset.optionId);
        items.forEach((it, i) => {
          it.querySelector('.ranking-rank').textContent = String(i + 1);
        });
      };

      list.addEventListener('dragstart', onDragStart);
      list.addEventListener('dragend', onDragEnd);
      list.addEventListener('dragover', onDragOver);
      list.addEventListener('drop', onDrop);

      cleanups.push(() => {
        list.removeEventListener('dragstart', onDragStart);
        list.removeEventListener('dragend', onDragEnd);
        list.removeEventListener('dragover', onDragOver);
        list.removeEventListener('drop', onDrop);
      });
    });

    return () => cleanups.forEach((fn) => { try { fn(); } catch {} });
  }


  /* ─────────────────────────────────────────────────────────────
     Empty state helper
     ─────────────────────────────────────────────────────────── */

  function emptyState(title, body, href, linkLabel) {
    return `
      <div class="empty-state">
        <h2>${escapeHtml(title)}</h2>
        <p>${escapeHtml(body)}</p>
        <a href="${escapeHtml(href)}" class="submit-btn" style="text-decoration:none">
          ${escapeHtml(linkLabel)}
        </a>
      </div>
    `;
  }


  /* ─────────────────────────────────────────────────────────────
     §9 — Bootstrap
     ─────────────────────────────────────────────────────────── */

  // Keep local store in sync when the user logs in/out elsewhere
  // (e.g. multi-tab) and route if the session changes.
  sb.auth.onAuthStateChange(async (event, session) => {
    dlog('auth event:', event, 'user:', session?.user?.email || '(none)');   // [DEBUG]
    store.setUser(session?.user || null);
    if (session?.user) {
      try { await store.loadCandidate(); }
      catch (e) { derr('loadCandidate on auth event', e); }
    }
  });

  window.addEventListener('hashchange', route);

  (async function boot() {
    dlog('boot: starting');                                                   // [DEBUG]
    try {
      await withTimeout(store.hydrate(), 'boot.hydrate', 10000);
    } catch (e) {
      derr('boot: hydrate failed', e);
      // [DEBUG] When hydrate times out, the Supabase client has usually entered
      // a stuck refresh loop that signOut+nuke can't recover from in the same
      // page lifetime. We need to clear storage AND reload so a fresh client
      // starts without the poisoned state.
      //
      // Safeguard against reload loops: only auto-reload once per session.
      const RELOAD_FLAG = 'amia:auto-recovered';
      if (!sessionStorage.getItem(RELOAD_FLAG)) {
        dlog('boot: auto-recovery — clearing storage and reloading');
        nukeClientState();
        sessionStorage.setItem(RELOAD_FLAG, '1');
        location.hash = '#/';
        location.reload();
        return;
      }
      derr('boot: hydrate failed even after auto-recovery — bailing to error screen');
      // Already tried once: show a real error the user can act on.
      APP_EL.innerHTML = emptyState(
        'Errore di connessione',
        'Non riusciamo a connetterci al server. Prova a ricaricare tra qualche minuto, oppure apri la console e digita __amia.reset().',
        '#/', 'Ricarica'
      );
      return;
    }
    dlog('boot: routing');                                                    // [DEBUG]
    // [DEBUG] Clear auto-recovery flag on successful boot so a future
    // genuine problem can trigger the recovery fresh.
    try { sessionStorage.removeItem('amia:auto-recovered'); } catch {}
    route();
  })();

})();