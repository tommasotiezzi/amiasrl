/* ═══════════════════════════════════════════════════════════════
 * AMIA CAREERS — script.js  (v2, no supabase-js)
 *
 * Direct-to-PostgREST client. No supabase-js dependency. No Web
 * Locks. No hidden session manager. Auth + HTTP in ~120 lines, the
 * rest is pages.
 *
 * Structure:
 *   §1  Config
 *   §2  Debug helpers
 *   §3  Session (localStorage)
 *   §4  HTTP client  — core fetch wrapper
 *   §5  API          — typed calls to /auth, /rest, /storage, /rpc
 *   §6  State store
 *   §7  Utils
 *   §8  Router
 *   §9  Pages
 *   §10 Quiz renderers + ranking drag-drop
 *   §11 Bootstrap
 * ══════════════════════════════════════════════════════════════ */

(function () {
  'use strict';


  /* ─────────────────────────────────────────────────────────────
     §1 — Config
     ─────────────────────────────────────────────────────────── */

  const SUPABASE_URL = 'https://lekkiacgjhjdhfzztpwd.supabase.co';
  const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxla2tpYWNnamhqZGhmenp0cHdkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA0NjA3OTMsImV4cCI6MjA4NjAzNjc5M30.69UEjEoyV-v6ZYR4QgsyVusQhtWesCEA_EEizHSEyHg';

  const SESSION_KEY = 'amia-careers-session';
  const QUIZ_CACHE_PREFIX = 'amia-careers:quiz:';
  const REQUEST_TIMEOUT_MS = 15000;
  const UPLOAD_TIMEOUT_MS = 45000;

  const APP_EL = document.getElementById('app');
  const TOAST_EL = document.getElementById('toast');


  /* ─────────────────────────────────────────────────────────────
     §2 — Debug helpers
       Tagged so they can be stripped later with a grep.
     ─────────────────────────────────────────────────────────── */

  const DEBUG = true;
  function dlog() {
    if (!DEBUG) return;
    console.log('%c[amia]', 'color:#FF6444;font-weight:600', ...arguments);
  }
  function derr(label, err) {
    if (!DEBUG) return;
    console.error('%c[amia] ' + label, 'color:#c62828;font-weight:600', err);
  }

  window.addEventListener('unhandledrejection', (e) => derr('UNHANDLED REJECTION', e.reason));
  window.addEventListener('error', (e) => derr('UNCAUGHT ERROR', e.error || e.message));


  /* ─────────────────────────────────────────────────────────────
     §3 — Session storage
       Owns the access token + refresh token. Plain object in
       localStorage under one key. We read it on every request.
     ─────────────────────────────────────────────────────────── */

  const session = {
    read() {
      try {
        const raw = localStorage.getItem(SESSION_KEY);
        if (!raw) return null;
        const s = JSON.parse(raw);
        if (!s || !s.access_token) return null;
        return s;
      } catch { return null; }
    },
    write(s) {
      if (s) localStorage.setItem(SESSION_KEY, JSON.stringify(s));
      else localStorage.removeItem(SESSION_KEY);
    },
    clear() { localStorage.removeItem(SESSION_KEY); },
    isExpired(s) {
      if (!s || !s.expires_at) return true;
      return (s.expires_at * 1000) < Date.now() + 30000; // 30s safety margin
    },
    user(s) {
      return (s && s.user) || null;
    },
  };


  /* ─────────────────────────────────────────────────────────────
     §4 — HTTP client
       One place where HTTP happens. Handles auth header, timeout,
       error shape, JSON body encoding. No retries — if the server
       said no, the server said no.
     ─────────────────────────────────────────────────────────── */

  async function request(path, opts = {}) {
    const {
      method = 'GET',
      headers = {},
      body,
      auth = true,           // attach Bearer token if we have one
      raw = false,           // skip JSON parse (for storage uploads)
      timeout = REQUEST_TIMEOUT_MS,
    } = opts;

    const url = SUPABASE_URL + path;
    const h = {
      'apikey': SUPABASE_ANON_KEY,
      ...headers,
    };

    if (auth) {
      const s = session.read();
      if (s && s.access_token) {
        h['Authorization'] = 'Bearer ' + s.access_token;
      }
    }

    let payload;
    if (body !== undefined) {
      if (body instanceof Blob || body instanceof File) {
        payload = body;
      } else if (typeof body === 'string') {
        payload = body;
      } else {
        payload = JSON.stringify(body);
        if (!h['Content-Type']) h['Content-Type'] = 'application/json';
      }
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeout);

    dlog('→', method, path);
    const t0 = performance.now();
    let res;
    try {
      res = await fetch(url, {
        method,
        headers: h,
        body: payload,
        signal: controller.signal,
      });
    } catch (e) {
      clearTimeout(timer);
      const ms = Math.round(performance.now() - t0);
      if (e.name === 'AbortError') {
        derr(`✗ ${method} ${path} timed out (${ms}ms)`, e);
        const err = new Error(`Timeout after ${timeout}ms`);
        err.isTimeout = true;
        throw err;
      }
      derr(`✗ ${method} ${path} network error (${ms}ms)`, e);
      throw e;
    }
    clearTimeout(timer);
    const ms = Math.round(performance.now() - t0);

    if (raw) {
      dlog('←', method, path, res.status, `(${ms}ms)`);
      return res;
    }

    const contentType = res.headers.get('content-type') || '';
    let data = null;
    if (contentType.includes('application/json')) {
      try { data = await res.json(); } catch { data = null; }
    } else {
      try { data = await res.text(); } catch { data = null; }
    }

    if (!res.ok) {
      const msg = (data && (data.message || data.msg || data.error_description || data.error)) || `HTTP ${res.status}`;
      derr(`✗ ${method} ${path} ${res.status} (${ms}ms)`, data);
      const err = new Error(msg);
      err.status = res.status;
      err.data = data;
      throw err;
    }

    dlog('←', method, path, res.status, `(${ms}ms)`);
    return data;
  }


  /* ─────────────────────────────────────────────────────────────
     §5 — API
       Every call the careers page makes. One function per endpoint.
     ─────────────────────────────────────────────────────────── */

  const api = {

    // Auth ─────────────────────────────────────────────

    async signUp(email, password) {
      const data = await request('/auth/v1/signup', {
        method: 'POST',
        body: { email, password },
        auth: false,
      });
      // With email confirmation disabled, signup returns a full session.
      // We still normalize shape: auth-v1/signup returns the User object
      // merged with access_token/refresh_token at top level.
      if (data && data.access_token) {
        session.write({
          access_token: data.access_token,
          refresh_token: data.refresh_token,
          expires_at: data.expires_at,
          user: data.user || { id: data.id, email: data.email },
        });
      }
      return session.read();
    },

    async signIn(email, password) {
      const data = await request('/auth/v1/token?grant_type=password', {
        method: 'POST',
        body: { email, password },
        auth: false,
      });
      session.write({
        access_token: data.access_token,
        refresh_token: data.refresh_token,
        expires_at: data.expires_at,
        user: data.user,
      });
      return session.read();
    },

    async signOut() {
      const s = session.read();
      if (s && s.access_token) {
        try {
          await request('/auth/v1/logout', { method: 'POST' });
        } catch (e) {
          // A logout error doesn't matter — we clear locally either way.
          dlog('signOut server call failed (continuing)', e.message);
        }
      }
      session.clear();
    },

    async refreshSession() {
      const s = session.read();
      if (!s || !s.refresh_token) return null;
      try {
        const data = await request('/auth/v1/token?grant_type=refresh_token', {
          method: 'POST',
          body: { refresh_token: s.refresh_token },
          auth: false,
        });
        session.write({
          access_token: data.access_token,
          refresh_token: data.refresh_token,
          expires_at: data.expires_at,
          user: data.user,
        });
        return session.read();
      } catch (e) {
        derr('refreshSession failed — clearing session', e);
        session.clear();
        return null;
      }
    },

    // PostgREST ─────────────────────────────────────────

    async listPublishedPositions() {
      return await request(
        '/rest/v1/positions?select=id,slug,title,department,location,contract_type&status=eq.published&order=published_at.desc',
        { auth: false }
      );
    },

    async getPositionBySlugOrId(slugOrId) {
      // Try slug first
      const bySlug = await request(
        `/rest/v1/positions?select=*&slug=eq.${encodeURIComponent(slugOrId)}&status=eq.published`,
        { auth: false }
      );
      if (bySlug && bySlug.length) return bySlug[0];
      // UUID fallback
      if (/^[0-9a-f-]{36}$/i.test(slugOrId)) {
        const byId = await request(
          `/rest/v1/positions?select=*&id=eq.${encodeURIComponent(slugOrId)}&status=eq.published`,
          { auth: false }
        );
        if (byId && byId.length) return byId[0];
      }
      return null;
    },

    async getMyCandidate() {
      const s = session.read();
      if (!s || !s.user) return null;
      const rows = await request(
        `/rest/v1/candidates?select=*&user_id=eq.${s.user.id}`,
      );
      return rows && rows.length ? rows[0] : null;
    },

    async insertCandidate(payload) {
      const rows = await request('/rest/v1/candidates', {
        method: 'POST',
        headers: { 'Prefer': 'return=representation' },
        body: payload,
      });
      return rows[0];
    },

    async updateCandidate(id, payload) {
      const rows = await request(`/rest/v1/candidates?id=eq.${id}`, {
        method: 'PATCH',
        headers: { 'Prefer': 'return=representation' },
        body: payload,
      });
      return rows[0];
    },

    async findExistingApplication(positionId, candidateId) {
      const rows = await request(
        `/rest/v1/applications?select=id&position_id=eq.${positionId}&candidate_id=eq.${candidateId}`
      );
      return rows && rows.length ? rows[0] : null;
    },

    async createApplication(payload) {
      const rows = await request('/rest/v1/applications', {
        method: 'POST',
        headers: { 'Prefer': 'return=representation' },
        body: payload,
      });
      return rows[0];
    },

    async listMyApplications(candidateId) {
      const rows = await request(
        `/rest/v1/applications?select=*,position:positions(title,department,pre_quiz_id,post_quiz_id,att_quiz_id)&candidate_id=eq.${candidateId}&order=created_at.desc`
      );
      // PostgREST returns embedded row as nested object when using FK hint; as array only for m2m.
      // Normalize just in case:
      return (rows || []).map((a) => ({
        ...a,
        position: Array.isArray(a.position) ? a.position[0] : a.position,
      }));
    },

    async getApplicationWithPosition(applicationId) {
      const rows = await request(
        `/rest/v1/applications?select=*,position:positions(*)&id=eq.${applicationId}`
      );
      if (!rows || !rows.length) return null;
      const a = rows[0];
      return { ...a, position: Array.isArray(a.position) ? a.position[0] : a.position };
    },

    // Storage ───────────────────────────────────────────

    async uploadCV(candidateId, file) {
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
      const path = `${candidateId}/${Date.now()}_${safeName}`;
      await request(`/storage/v1/object/cvs/${path}`, {
        method: 'POST',
        headers: {
          'Content-Type': file.type || 'application/pdf',
          'x-upsert': 'false',
        },
        body: file,
        raw: true,
        timeout: UPLOAD_TIMEOUT_MS,
      });
      return path;
    },

    // RPCs ──────────────────────────────────────────────

    async getQuizForCandidate(applicationId, quizType) {
      const data = await request('/rest/v1/rpc/get_quiz_for_candidate', {
        method: 'POST',
        body: {
          p_application_id: applicationId,
          p_quiz_type: quizType,
        },
      });
      // RPC returning TABLE arrives as an array of rows in PostgREST
      return Array.isArray(data) ? data[0] : data;
    },

    async submitQuiz(applicationId, quizType, answers, startedAt, completedAt) {
      return await request('/rest/v1/rpc/submit_quiz', {
        method: 'POST',
        body: {
          p_application_id: applicationId,
          p_quiz_type: quizType,
          p_answers: answers,
          p_started_at: startedAt,
          p_completed_at: completedAt,
        },
        timeout: 25000,
      });
    },
  };


  /* ─────────────────────────────────────────────────────────────
     §6 — State store
       Two values: current candidate, anything derived from session.
     ─────────────────────────────────────────────────────────── */

  const store = {
    _candidate: null,

    get user() {
      const s = session.read();
      return s ? s.user : null;
    },
    get isAuthed() { return !!this.user; },
    get candidate() { return this._candidate; },

    setCandidate(c) { this._candidate = c; },

    async hydrate() {
      const s = session.read();
      if (!s) { this._candidate = null; updateHeaderAuthUI(); return; }
      if (session.isExpired(s)) {
        dlog('session expired, attempting refresh');
        const refreshed = await api.refreshSession();
        if (!refreshed) { this._candidate = null; updateHeaderAuthUI(); return; }
      }
      try {
        this._candidate = await api.getMyCandidate();
      } catch (e) {
        derr('hydrate: getMyCandidate failed', e);
        this._candidate = null;
      }
      updateHeaderAuthUI();
    },
  };


  /* ─────────────────────────────────────────────────────────────
     §7 — Utils
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
  function escapeHtmlMultiline(s) { return escapeHtml(s).replace(/\n/g, '<br>'); }

  const CONTRACT_LABELS = {
    full_time: 'Full-time', part_time: 'Part-time',
    freelance: 'Freelance', internship: 'Stage',
  };
  function contractLabel(t) { return CONTRACT_LABELS[t] || t; }

  const APP_STATUS_LABELS = {
    applied: 'Candidato', interview: 'Colloquio',
    hired: 'Assunto', rejected: 'Scartato',
  };

  function questionImageUrl(config) {
    if (!config) return null;
    return resolveImage(config.image_path || config.image_url);
  }
  function optionImageUrl(opt) {
    if (!opt || typeof opt !== 'object') return null;
    return resolveImage(opt.image_path || opt.image_url);
  }
  function resolveImage(p) {
    if (!p) return null;
    if (/^https?:\/\//i.test(p)) return p;
    return `${SUPABASE_URL}/storage/v1/object/public/question-images/${p}`;
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

  function updateHeaderAuthUI() {
    document.querySelectorAll('[data-requires-auth="true"]').forEach((el) => {
      if (store.isAuthed) el.removeAttribute('hidden');
      else el.setAttribute('hidden', '');
    });
  }

  // Quiz cache — keeps shuffled question order stable across refresh
  function quizCacheKey(appId, t) { return `${QUIZ_CACHE_PREFIX}${appId}:${t}`; }
  function readQuizCache(appId, t) {
    try {
      const raw = sessionStorage.getItem(quizCacheKey(appId, t));
      if (!raw) return null;
      const p = JSON.parse(raw);
      if (!p || !p.quiz_id || !Array.isArray(p.questions)) {
        sessionStorage.removeItem(quizCacheKey(appId, t));
        return null;
      }
      return p;
    } catch {
      try { sessionStorage.removeItem(quizCacheKey(appId, t)); } catch {}
      return null;
    }
  }
  function writeQuizCache(appId, t, payload) {
    try { sessionStorage.setItem(quizCacheKey(appId, t), JSON.stringify(payload)); } catch {}
  }
  function clearQuizCache(appId, t) {
    try { sessionStorage.removeItem(quizCacheKey(appId, t)); } catch {}
  }

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
     §8 — Router
     ─────────────────────────────────────────────────────────── */

  let currentTeardown = null;

  const routes = [
    [/^\/$/,                                () => renderJobsList()],
    [/^\/apply\/([^/]+)$/,                  (slug) => renderApply(slug)],
    [/^\/portal$/,                          () => renderPortal()],
    [/^\/quiz-overview\/([^/]+)\/([^/]+)$/, (id, t) => renderQuizOverview(id, t)],
    [/^\/quiz\/([^/]+)\/([^/]+)$/,          (id, t) => renderQuiz(id, t)],
  ];

  async function route() {
    const path = (location.hash || '#/').slice(1) || '/';
    dlog('route →', path);

    if (typeof currentTeardown === 'function') {
      try { currentTeardown(); } catch (e) { derr('teardown', e); }
      currentTeardown = null;
    }

    try {
      await store.hydrate();
    } catch (e) {
      derr('route: hydrate failed', e);
      // Non-fatal: continue as anon
    }

    const needsAuth = /^\/(portal|quiz|quiz-overview)/.test(path);
    if (needsAuth && !store.isAuthed) {
      dlog('auth required, redirecting to /');
      location.hash = '#/';
      return;
    }

    for (const [regex, handler] of routes) {
      const m = path.match(regex);
      if (m) {
        APP_EL.innerHTML = loadingCenter();
        try {
          const td = await handler(...m.slice(1));
          if (typeof td === 'function') currentTeardown = td;
          setPageTransition(APP_EL);
        } catch (e) {
          derr(`page error: ${path}`, e);
          APP_EL.innerHTML = emptyState(
            'Qualcosa è andato storto',
            e.message || 'Errore nel caricamento della pagina.',
            '#/', 'Torna alla home'
          );
        }
        return;
      }
    }
    location.hash = '#/';
  }


  /* ─────────────────────────────────────────────────────────────
     §9 — Pages
     ─────────────────────────────────────────────────────────── */

  // ─── 9.1 Jobs list ──────────────────────────────────

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
          ${jobs.length ? `
            <div class="jobs-grid">
              ${jobs.map(jobCard).join('')}
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

  // ─── 9.2 Apply (single form, auth section visible) ──

  async function renderApply(slugOrId) {
    let position;
    try { position = await api.getPositionBySlugOrId(slugOrId); }
    catch { position = null; }

    if (!position) {
      APP_EL.innerHTML = emptyState(
        'Posizione non disponibile',
        'Questa posizione non esiste o non è più aperta.',
        '#/', 'Vedi posizioni aperte'
      );
      return;
    }

    // Already applied? Redirect.
    if (store.isAuthed && store.candidate) {
      try {
        const ex = await api.findExistingApplication(position.id, store.candidate.id);
        if (ex) {
          toast('Hai già una candidatura per questa posizione');
          location.hash = '#/portal';
          return;
        }
      } catch (e) { dlog('existing-app check failed (non-fatal)', e.message); }
    }

    renderApplyForm(position);
  }

  function renderApplyForm(position) {
    const authed = store.isAuthed;
    const cand = store.candidate;

    APP_EL.innerHTML = `
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

        <form id="apply-form" class="apply-form" novalidate>
          ${authed ? accountBlockAuthed() : accountBlockSignup()}

          <fieldset class="form-section">
            <legend class="form-section-title">
              Informazioni di contatto
            </legend>
            <div class="form-grid">
              <div class="form-group">
                <label class="form-label" for="f-first">Nome <span class="required">*</span></label>
                <input type="text" id="f-first" class="form-input" placeholder="Mario" required
                  value="${escapeHtml(cand?.first_name || '')}">
              </div>
              <div class="form-group">
                <label class="form-label" for="f-last">Cognome <span class="required">*</span></label>
                <input type="text" id="f-last" class="form-input" placeholder="Rossi" required
                  value="${escapeHtml(cand?.last_name || '')}">
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
            </div>
          </fieldset>

          <fieldset class="form-section">
            <legend class="form-section-title">La tua candidatura</legend>
            <div class="form-grid">
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
                  <input type="file" id="f-cv" class="form-file-input" accept=".pdf,application/pdf" required>
                </label>
              </div>
            </div>
          </fieldset>

          <div class="form-consent">
            <label class="consent-label">
              <input type="checkbox" id="f-consent" required>
              <span>Accetto il trattamento dei miei dati personali per finalità di selezione,
                secondo la <a href="https://amia.technology/privacy" target="_blank" rel="noopener">privacy policy</a>.
                <span class="required">*</span></span>
            </label>
          </div>

          <button type="submit" class="submit-btn" id="apply-submit-btn">
            ${authed ? 'Invia candidatura' : 'Crea account e invia candidatura'}
            <svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3"/>
            </svg>
          </button>
        </form>
      </div>
    `;

    bindApplyForm(position);
  }

  function accountBlockSignup() {
    return `
      <fieldset class="form-section form-section-account">
        <legend class="form-section-title">
          Crea il tuo account candidato
        </legend>
        <p class="form-section-desc">
          Un account ti serve per seguire la candidatura e completare i quiz di valutazione.
          Se ne hai già uno, <button type="button" class="link-btn" id="switch-to-signin">accedi qui</button>.
        </p>
        <div class="form-grid" id="account-fields">
          <div class="form-group">
            <label class="form-label" for="f-email">Email <span class="required">*</span></label>
            <input type="email" id="f-email" class="form-input" placeholder="la.tua@email.com"
              autocomplete="email" required>
          </div>
          <div class="form-group">
            <label class="form-label" for="f-pass">Password <span class="required">*</span></label>
            <input type="password" id="f-pass" class="form-input" placeholder="Minimo 6 caratteri"
              autocomplete="new-password" minlength="6" required>
          </div>
        </div>
      </fieldset>
    `;
  }

  function accountBlockSignin() {
    const user = store.user;
    return `
      <fieldset class="form-section form-section-account">
        <legend class="form-section-title">
          Accedi al tuo account
        </legend>
        <p class="form-section-desc">
          Hai già un account? Accedi per continuare.
          Se non ne hai uno, <button type="button" class="link-btn" id="switch-to-signup">registrati qui</button>.
        </p>
        <div class="form-grid" id="account-fields">
          <div class="form-group">
            <label class="form-label" for="f-email">Email <span class="required">*</span></label>
            <input type="email" id="f-email" class="form-input" placeholder="la.tua@email.com"
              autocomplete="email" required>
          </div>
          <div class="form-group">
            <label class="form-label" for="f-pass">Password <span class="required">*</span></label>
            <input type="password" id="f-pass" class="form-input" placeholder="••••••••"
              autocomplete="current-password" required>
          </div>
        </div>
      </fieldset>
    `;
  }

  function accountBlockAuthed() {
    const user = store.user;
    return `
      <fieldset class="form-section form-section-account form-section-authed">
        <div class="auth-status">
          <p>Stai candidandoti come <strong>${escapeHtml(user.email)}</strong></p>
          <button type="button" class="link-btn" id="logout-btn">Esci</button>
        </div>
      </fieldset>
    `;
  }

  function bindApplyForm(position) {
    const form = APP_EL.querySelector('#apply-form');

    // CV file input — validate on change, update label
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

    // Logout (when authed)
    const logoutBtn = APP_EL.querySelector('#logout-btn');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', async () => {
        await api.signOut();
        toast('Disconnesso');
        renderApply(position.slug || position.id);
      });
    }

    // Signup ↔ signin toggle
    const toSignin = APP_EL.querySelector('#switch-to-signin');
    if (toSignin) {
      toSignin.addEventListener('click', () => {
        APP_EL.querySelector('.form-section-account').outerHTML = accountBlockSignin();
        const back = APP_EL.querySelector('#switch-to-signup');
        if (back) back.addEventListener('click', () => {
          APP_EL.querySelector('.form-section-account').outerHTML = accountBlockSignup();
          bindApplyFormToggles(position);
        });
      });
    }
    const toSignup = APP_EL.querySelector('#switch-to-signup');
    if (toSignup) {
      toSignup.addEventListener('click', () => {
        APP_EL.querySelector('.form-section-account').outerHTML = accountBlockSignup();
        bindApplyFormToggles(position);
      });
    }

    // Submit
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      submitApplication(position);
    });
  }

  // Re-bind toggle links after account block swaps
  function bindApplyFormToggles(position) {
    const toSignin = APP_EL.querySelector('#switch-to-signin');
    if (toSignin) toSignin.addEventListener('click', () => {
      APP_EL.querySelector('.form-section-account').outerHTML = accountBlockSignin();
      bindApplyFormToggles(position);
    });
    const toSignup = APP_EL.querySelector('#switch-to-signup');
    if (toSignup) toSignup.addEventListener('click', () => {
      APP_EL.querySelector('.form-section-account').outerHTML = accountBlockSignup();
      bindApplyFormToggles(position);
    });
  }

  async function submitApplication(position) {
    const btn = APP_EL.querySelector('#apply-submit-btn');
    const first = APP_EL.querySelector('#f-first').value.trim();
    const last  = APP_EL.querySelector('#f-last').value.trim();
    const phone = APP_EL.querySelector('#f-phone').value.trim();
    const linkedin = APP_EL.querySelector('#f-linkedin').value.trim();
    const cover = APP_EL.querySelector('#f-cover').value.trim();
    const cvFile = APP_EL.querySelector('#f-cv').files[0];
    const consent = APP_EL.querySelector('#f-consent').checked;

    // Validation
    if (!consent) { toast('Devi accettare il trattamento dei dati', true); return; }
    if (!first || !last) { toast('Nome e cognome sono obbligatori', true); return; }
    if (!cvFile) { toast('Il CV è obbligatorio', true); return; }
    if (cvFile.type !== 'application/pdf') { toast('Il CV deve essere in formato PDF', true); return; }
    if (cvFile.size > 10 * 1024 * 1024) { toast('Il CV non può superare 10 MB', true); return; }

    // Auth fields (only present when not logged in)
    const accountSection = APP_EL.querySelector('.form-section-account');
    const needsAuth = accountSection && !accountSection.classList.contains('form-section-authed');
    let email, password, isSignup;
    if (needsAuth) {
      email = APP_EL.querySelector('#f-email').value.trim();
      password = APP_EL.querySelector('#f-pass').value;
      if (!email || !password) { toast('Compila email e password', true); return; }
      // "signup" mode if the block shows "Crea il tuo account"
      isSignup = !!accountSection.querySelector('#switch-to-signin');
      if (isSignup && password.length < 6) {
        toast('La password deve essere di almeno 6 caratteri', true); return;
      }
    }

    btn.disabled = true;
    const originalBtnHtml = btn.innerHTML;
    btn.textContent = 'Invio in corso...';

    try {
      // Step 0: auth (signup or signin) if not logged in
      if (needsAuth) {
        dlog('submit step 0: auth', isSignup ? 'signup' : 'signin');
        if (isSignup) await api.signUp(email, password);
        else          await api.signIn(email, password);
        // After signup with confirmation disabled, session exists.
        if (!store.isAuthed) throw new Error('Impossibile creare la sessione. Controlla la mail per confermare l\'account.');
      }

      // Step 1: ensure candidate row
      dlog('submit step 1: candidate row');
      let candidate = store.candidate;
      if (!candidate) {
        // Might exist from a previous session
        candidate = await api.getMyCandidate();
      }
      const candidatePayload = {
        user_id: store.user.id,
        first_name: first,
        last_name: last,
        email: store.user.email,
        phone: phone || null,
        linkedin_url: linkedin || null,
      };
      if (candidate) {
        candidate = await api.updateCandidate(candidate.id, candidatePayload);
      } else {
        candidate = await api.insertCandidate(candidatePayload);
      }
      store.setCandidate(candidate);

      // Step 2: duplicate guard
      dlog('submit step 2: duplicate check');
      const existing = await api.findExistingApplication(position.id, candidate.id);
      if (existing) {
        toast('Hai già una candidatura per questa posizione', true);
        location.hash = '#/portal';
        return;
      }

      // Step 3: CV upload
      dlog('submit step 3: CV upload');
      const cvPath = await api.uploadCV(candidate.id, cvFile);

      // Step 4: application insert
      dlog('submit step 4: application insert');
      await api.createApplication({
        position_id: position.id,
        candidate_id: candidate.id,
        status: 'applied',
        cv_file_path: cvPath,
        cover_letter: cover || null,
      });

      dlog('submit: all steps complete');
      toast('Candidatura inviata! 🎉');
      setTimeout(() => { location.hash = '#/portal'; }, 1200);

    } catch (err) {
      derr('submit failed', err);
      toast(err.message || 'Errore durante l\'invio', true);
      btn.disabled = false;
      btn.innerHTML = originalBtnHtml;
    }
  }


  // ─── 9.3 Portal ─────────────────────────────────────

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
        ${apps.length
          ? apps.map(applicationCard).join('')
          : emptyState('Nessuna candidatura', 'Inizia dando un\'occhiata alle posizioni aperte.', '#/', 'Vedi posizioni aperte')
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
      duration: '25 min',
      done: !!app.pre_quiz_completed_at,
      score: app.pre_quiz_score, max: app.pre_quiz_max_score,
    });
    if (p.post_quiz_id) quizzes.push({
      type: 'post', label: 'Quiz Skills', icon: '💻',
      subtitle: 'Competenze tecniche per il ruolo',
      duration: '35 min',
      done: !!app.post_quiz_completed_at,
      score: app.post_quiz_score, max: app.post_quiz_max_score,
    });
    if (p.att_quiz_id) quizzes.push({
      type: 'att', label: 'Domande Attitudinali', icon: '💬',
      subtitle: 'Motivazione, cultura e modo di lavorare',
      duration: 'Libero',
      done: !!app.att_quiz_completed_at,
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
        ${quizzes.length
          ? `<div class="quiz-rows">${quizzes.map((q) => quizRow(app.id, q)).join('')}</div>`
          : '<p class="quiz-empty">Nessun quiz per questa posizione.</p>'
        }
      </div>
    `;
  }

  function quizRow(appId, q) {
    if (q.done) {
      let scoreEl;
      if (q.type === 'att') {
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
          <a href="#/quiz-overview/${encodeURIComponent(appId)}/${encodeURIComponent(q.type)}" class="quiz-go-btn">Inizia</a>
        </div>
      </div>
    `;
  }

  function bindLogout() {
    const btn = APP_EL.querySelector('#logout-btn');
    if (!btn) return;
    btn.addEventListener('click', async () => {
      await api.signOut();
      toast('Disconnesso');
      location.hash = '#/';
    });
  }


  // ─── 9.4 Quiz overview ──────────────────────────────

  const QUIZ_TYPE_INFO = {
    pre: {
      icon: '🧠', title: 'Quiz Logica',
      desc: 'Valutiamo le tue capacità di ragionamento logico, problem solving e pensiero critico. Include domande a scelta multipla e domande di ranking.',
      rules: [
        'Alcune domande a scelta multipla possono avere più risposte corrette',
        'Nelle domande di ranking trascina gli elementi per ordinarli',
        'La qualità conta più della velocità',
      ],
    },
    post: {
      icon: '💻', title: 'Quiz Skills',
      desc: 'Valutiamo le tue competenze tecniche specifiche per il ruolo. Include domande teoriche, scenari pratici e ranking.',
      rules: [
        'Le domande sono specifiche per la posizione a cui ti sei candidato',
        'Per le domande aperte, sii concreto e usa esempi reali',
        'Meglio provare che lasciare in bianco',
      ],
    },
    att: {
      icon: '💬', title: 'Domande Attitudinali',
      desc: 'Queste domande ci aiutano a conoscerti meglio. Non ci sono risposte giuste o sbagliate — vogliamo capire come lavori.',
      rules: [
        'Rispondi in modo autentico: la coerenza conta più della "risposta giusta"',
        'Non c\'è un limite di tempo',
        'Le tue risposte guidano il colloquio, non lo sostituiscono',
      ],
    },
  };

  async function renderQuizOverview(applicationId, quizType) {
    const info = QUIZ_TYPE_INFO[quizType];
    if (!info) { toast('Quiz non valido', true); location.hash = '#/portal'; return; }

    let app, quiz;
    try {
      app = await api.getApplicationWithPosition(applicationId);
      if (!app) throw new Error('Candidatura non trovata');

      const cached = readQuizCache(applicationId, quizType);
      if (cached) {
        quiz = cached;
      } else {
        quiz = await api.getQuizForCandidate(applicationId, quizType);
        if (!quiz) throw new Error('Quiz non disponibile');
        writeQuizCache(applicationId, quizType, quiz);
      }
    } catch (err) {
      derr('overview load', err);
      toast(err.message || 'Errore', true);
      location.hash = '#/portal';
      return;
    }

    const doneMap = {
      pre: app.pre_quiz_completed_at,
      post: app.post_quiz_completed_at,
      att: app.att_quiz_completed_at,
    };
    if (doneMap[quizType]) {
      toast('Hai già completato questo quiz');
      location.hash = '#/portal';
      return;
    }

    const count = Array.isArray(quiz.questions) ? quiz.questions.length : 0;
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
            <ul>${info.rules.map((r) => `<li>${escapeHtml(r)}</li>`).join('')}</ul>
          </div>
        </div>

        <div class="quiz-overview-warn">
          <p class="warn-title">⚠️ Importante</p>
          <p class="warn-body">
            Non condividere, copiare o divulgare il contenuto di questo quiz.
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


  // ─── 9.5 Quiz ───────────────────────────────────────

  async function renderQuiz(applicationId, quizType) {
    let app, quiz;
    try {
      app = await api.getApplicationWithPosition(applicationId);
      if (!app) throw new Error('Candidatura non trovata');

      const doneMap = {
        pre: app.pre_quiz_completed_at,
        post: app.post_quiz_completed_at,
        att: app.att_quiz_completed_at,
      };
      if (doneMap[quizType]) {
        toast('Hai già completato questo quiz');
        location.hash = '#/portal';
        return;
      }

      const cached = readQuizCache(applicationId, quizType);
      if (cached) quiz = cached;
      else {
        quiz = await api.getQuizForCandidate(applicationId, quizType);
        if (!quiz) throw new Error('Quiz non disponibile');
        writeQuizCache(applicationId, quizType, quiz);
      }
    } catch (err) {
      derr('quiz load', err);
      toast(err.message || 'Errore', true);
      location.hash = '#/portal';
      return;
    }

    const questions = Array.isArray(quiz.questions) ? quiz.questions : [];
    if (!questions.length) {
      APP_EL.innerHTML = emptyState('Quiz non disponibile', 'Questo quiz non ha ancora domande configurate.', '#/portal', 'Torna al portale');
      return;
    }
    dlog('renderQuiz:', { quizId: quiz.quiz_id, count: questions.length, types: questions.map((q) => q.question_type) });

    const startedAt = new Date();
    const durationMs = quiz.duration_minutes ? quiz.duration_minutes * 60000 : null;

    // answers shape:
    //   MC:      [index, ...]           0-based indices
    //   ranking: ["id", ...]            option IDs, top→bottom
    //   open:    "string"
    const answers = {};
    for (const q of questions) {
      if (q.question_type === 'ranking') {
        answers[q.id] = ((q.config && q.config.options) || []).map((o) => o.id);
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

    bindMultipleChoice(questions, answers);
    bindOpenText(questions, answers);
    const rankingTeardown = bindRanking(questions, answers);

    // Timer
    let timerId = null, expired = false;
    if (durationMs) {
      const timerEl = APP_EL.querySelector('#quiz-timer');
      const tick = () => {
        const elapsed = Date.now() - startedAt.getTime();
        const remaining = Math.max(0, durationMs - elapsed);
        const m = Math.floor(remaining / 60000);
        const s = Math.floor((remaining % 60000) / 1000);
        timerEl.textContent = `⏱ ${m}:${String(s).padStart(2, '0')}`;
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
      if (submitting) { dlog('doSubmit: already submitting'); return; }
      submitting = true;
      submitBtn.disabled = true;
      submitBtn.textContent = 'Invio in corso...';
      const completedAt = new Date();
      dlog('doSubmit:', { quizType, answerCount: Object.keys(answers).length });

      try {
        const result = await api.submitQuiz(
          applicationId, quizType, answers,
          startedAt.toISOString(), completedAt.toISOString()
        );
        clearQuizCache(applicationId, quizType);
        dlog('doSubmit success', result);

        const hasScore = quizType !== 'att' && result && result.max_score > 0;
        if (hasScore) {
          const pct = Math.round((result.total_score / result.max_score) * 100);
          toast(`Quiz completato! ${pct}% 🎉`);
        } else {
          toast('Quiz completato! 🎉');
        }
        setTimeout(() => { location.hash = '#/portal'; }, 1500);
      } catch (err) {
        derr('doSubmit failed', err);

        // Timeout-safety: the RPC may have actually landed
        if (err && err.isTimeout) {
          try {
            const check = await api.getApplicationWithPosition(applicationId);
            const field = quizType === 'pre'  ? check?.pre_quiz_completed_at
                        : quizType === 'post' ? check?.post_quiz_completed_at
                        :                       check?.att_quiz_completed_at;
            if (field) {
              clearQuizCache(applicationId, quizType);
              toast('Quiz completato! 🎉');
              setTimeout(() => { location.hash = '#/portal'; }, 1200);
              return;
            }
          } catch (e2) { derr('post-timeout check', e2); }
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

    return () => {
      if (timerId) clearInterval(timerId);
      if (typeof rankingTeardown === 'function') rankingTeardown();
    };
  }


  /* ─────────────────────────────────────────────────────────────
     §10 — Quiz renderers + ranking drag-drop
     ─────────────────────────────────────────────────────────── */

  function questionHtml(q, index, total) {
    const imgUrl = questionImageUrl(q.config);
    const points = q.points > 0 ? ` · ${q.points} punti` : '';

    let body;
    if (q.question_type === 'multiple_choice') body = mcHtml(q);
    else if (q.question_type === 'ranking') body = rankingHtml(q);
    else if (q.question_type === 'open_text') {
      body = `<textarea class="open-textarea" data-question-id="${escapeHtml(q.id)}" placeholder="Scrivi la tua risposta..." rows="6"></textarea>`;
    } else if (q.question_type === 'file_upload') {
      body = `<div class="file-upload-placeholder">Upload file disponibile a breve. Puoi proseguire senza caricare nulla.</div>`;
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
    const hint = multi ? `<p class="question-hint">Puoi selezionare più risposte.</p>` : '';
    return hint + options.map((opt, j) => mcOptionHtml(q.id, opt, j, multi)).join('');
  }

  function mcOptionHtml(qId, opt, index, multi) {
    let label, imgUrl = null;
    if (typeof opt === 'string') label = opt;
    else if (opt && typeof opt === 'object') {
      label = opt.label || opt.text || '';
      imgUrl = optionImageUrl(opt);
    } else label = String(opt);
    const box = multi ? '<div class="mc-checkbox"></div>' : '<div class="mc-radio"></div>';
    return `
      <div class="mc-option" data-question-id="${escapeHtml(qId)}" data-value="${index}">
        ${box}
        <div style="flex:1;min-width:0">
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
        const card = opt.closest('.question-card');
        card.querySelectorAll('.mc-option').forEach((o) => {
          const v = parseInt(o.dataset.value, 10);
          o.classList.toggle('selected', (answers[qId] || []).includes(v));
        });
      });
    });
  }

  function bindOpenText(questions, answers) {
    APP_EL.querySelectorAll('.open-textarea').forEach((ta) => {
      ta.addEventListener('input', () => { answers[ta.dataset.questionId] = ta.value; });
    });
  }

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
        const rect = target.getBoundingClientRect();
        const mid = rect.top + rect.height / 2;
        if (e.clientY < mid) list.insertBefore(dragged, target);
        else list.insertBefore(dragged, target.nextSibling);
      };
      const onDrop = (e) => {
        e.preventDefault();
        list.querySelectorAll('.drop-target').forEach((el) => el.classList.remove('drop-target'));
        const qId = list.dataset.questionId;
        const items = Array.from(list.querySelectorAll('.ranking-item'));
        answers[qId] = items.map((it) => it.dataset.optionId);
        items.forEach((it, i) => { it.querySelector('.ranking-rank').textContent = String(i + 1); });
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

})();