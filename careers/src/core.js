/* core.js
   ════════════════════════════════════════════════════════════════
   Config, debug, session, HTTP, API, state store, utility helpers.
   Pure infrastructure — no page rendering, no routing.

   The router lives in pages.js (it needs to reference page renderers).
   ════════════════════════════════════════════════════════════════ */

/* ─────────────────────────────────────────────────────────────
   §1 — Config
   ─────────────────────────────────────────────────────────── */

const SUPABASE_URL = 'https://lekkiacgjhjdhfzztpwd.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxla2tpYWNnamhqZGhmenp0cHdkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA0NjA3OTMsImV4cCI6MjA4NjAzNjc5M30.69UEjEoyV-v6ZYR4QgsyVusQhtWesCEA_EEizHSEyHg';

const SESSION_KEY = 'amia-careers-session';
const QUIZ_CACHE_PREFIX = 'amia-careers:quiz:';
const REQUEST_TIMEOUT_MS = 15000;
const UPLOAD_TIMEOUT_MS = 45000;

// Terms/privacy policy version. Bump this date string whenever the
// policy text changes — candidates who accepted an older version may
// need to re-accept under GDPR, depending on the change.
const TOS_VERSION = '2026-04-18';

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

  async signUp(email, password, metadata) {
    // `data` on signup becomes `raw_user_meta_data` on auth.users,
    // which our create_profile_on_signup trigger reads to fill in
    // tos_accepted_at / tos_version on the profiles row.
    const body = { email, password };
    if (metadata && typeof metadata === 'object') body.data = metadata;
    const data = await request('/auth/v1/signup', {
      method: 'POST',
      body,
      auth: false,
    });
    // With email confirmation disabled, signup returns a full session.
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
    // [DEBUG] Explicitly clear dependent state so next render is consistent.
    store.setCandidate(null);
    updateHeaderAuthUI();
    dlog('signOut: done, session cleared');
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
      '/rest/v1/positions?select=id,slug,title,department,location,contract_type,salary_min,salary_max,app_name,app_color_from,app_color_to&status=eq.published&order=published_at.desc',
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
  freelance: 'Freelance', internship: 'Internship',
};
function contractLabel(t) { return CONTRACT_LABELS[t] || t; }

const APP_STATUS_LABELS = {
  applied: 'Applied', interview: 'Interview',
  hired: 'Hired', rejected: 'Rejected',
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


// ── Salary range formatter ──

function salaryRangeText(min, max) {
  if (!min && !max) return '';
  const fmt = (v) => '€' + Number(v).toLocaleString('it-IT');
  if (min && max && min !== max) return `${fmt(min)} — ${fmt(max)}`;
  return fmt(min || max);
}


// ── App pill (gradient) ──

function appPillHtml(p, size /* 'sm' | 'md' */) {
  if (!p || !p.app_name) return '';
  const from = p.app_color_from || '#6b7280';
  const to   = p.app_color_to   || '#374151';
  const cls = size === 'md' ? 'app-pill app-pill-md' : 'app-pill';
  return `<span class="${cls}" style="background-image:linear-gradient(135deg, ${from} 0%, ${to} 100%)">${escapeHtml(p.app_name)}</span>`;
}


// ── Lightbox ──
// Click-anywhere-to-close fullscreen image viewer.

let _lightboxKeyHandler = null;

function openLightbox(src, alt) {
  // Remove any existing one first
  closeLightbox();

  const overlay = document.createElement('div');
  overlay.className = 'lightbox-overlay';
  overlay.innerHTML = `
    <button class="lightbox-close" aria-label="Close">×</button>
    <img class="lightbox-img" src="${escapeHtml(src)}" alt="${escapeHtml(alt || '')}">
  `;
  overlay.addEventListener('click', closeLightbox);

  _lightboxKeyHandler = (e) => { if (e.key === 'Escape') closeLightbox(); };
  document.addEventListener('keydown', _lightboxKeyHandler);

  document.body.appendChild(overlay);
  document.body.style.overflow = 'hidden';
}

function closeLightbox() {
  const overlay = document.querySelector('.lightbox-overlay');
  if (overlay) overlay.remove();
  if (_lightboxKeyHandler) {
    document.removeEventListener('keydown', _lightboxKeyHandler);
    _lightboxKeyHandler = null;
  }
  document.body.style.overflow = '';
}

// Bind any element with [data-lightbox-src] to open lightbox on click.
// Call this after rendering any container that may include lightbox triggers.
function bindLightboxTriggers(root /* defaults to document */) {
  const scope = root || document;
  scope.querySelectorAll('[data-lightbox-src]').forEach((el) => {
    if (el._lightboxBound) return;
    el._lightboxBound = true;
    el.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      openLightbox(el.dataset.lightboxSrc, el.dataset.lightboxAlt || '');
    });
  });
}


// ── Markdown renderer ──
// Lean inline markdown — supports the subset we need:
//   **bold**, *italic*, `code`, [text](url),
//   # ## ### headings, > blockquote, --- hr,
//   - / 1. lists, blank-line paragraphs.
// No HTML escaping is needed for inputs because we escape first then inject markdown patterns.

function renderMarkdown(md) {
  if (!md) return '';
  // Escape HTML first
  let s = String(md)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  // Code spans: `code`
  s = s.replace(/`([^`\n]+)`/g, '<code>$1</code>');

  // Bold then italic
  s = s.replace(/\*\*([^*\n]+)\*\*/g, '<strong>$1</strong>');
  s = s.replace(/(^|[^*])\*([^*\n]+)\*(?!\*)/g, '$1<em>$2</em>');

  // Links [text](url) — only allow http(s) and mailto:
  s = s.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (m, text, url) => {
    if (!/^(https?:|mailto:)/i.test(url)) return m;
    return `<a href="${url}" target="_blank" rel="noopener noreferrer">${text}</a>`;
  });

  // Process line by line for blocks
  const lines = s.split('\n');
  const out = [];
  let inUl = false, inOl = false, inP = false, inBq = false;

  const closeBlocks = () => {
    if (inP)  { out.push('</p>');          inP = false; }
    if (inUl) { out.push('</ul>');         inUl = false; }
    if (inOl) { out.push('</ol>');         inOl = false; }
    if (inBq) { out.push('</blockquote>'); inBq = false; }
  };

  for (let line of lines) {
    if (/^\s*$/.test(line)) { closeBlocks(); continue; }

    // Headings
    let m = /^(#{1,3})\s+(.+)$/.exec(line);
    if (m) {
      closeBlocks();
      const level = m[1].length;
      out.push(`<h${level}>${m[2]}</h${level}>`);
      continue;
    }

    // Hr
    if (/^(\*{3,}|-{3,})\s*$/.test(line)) {
      closeBlocks();
      out.push('<hr>');
      continue;
    }

    // Blockquote
    m = /^>\s?(.*)$/.exec(line);
    if (m) {
      if (!inBq) { closeBlocks(); out.push('<blockquote>'); inBq = true; }
      out.push(m[1]);
      continue;
    }

    // Unordered list
    m = /^[-*+]\s+(.+)$/.exec(line);
    if (m) {
      if (!inUl) { closeBlocks(); out.push('<ul>'); inUl = true; }
      out.push(`<li>${m[1]}</li>`);
      continue;
    }

    // Ordered list
    m = /^\d+\.\s+(.+)$/.exec(line);
    if (m) {
      if (!inOl) { closeBlocks(); out.push('<ol>'); inOl = true; }
      out.push(`<li>${m[1]}</li>`);
      continue;
    }

    // Paragraph
    if (!inP && !inBq) { closeBlocks(); out.push('<p>'); inP = true; }
    out.push(line);
  }
  closeBlocks();
  return out.join('\n');
}



/* ─────────────────────────────────────────────────────────────
   Exports
   ─────────────────────────────────────────────────────────── */

export {
  // §1 config
  SUPABASE_URL, SUPABASE_ANON_KEY, SESSION_KEY, QUIZ_CACHE_PREFIX,
  REQUEST_TIMEOUT_MS, UPLOAD_TIMEOUT_MS, TOS_VERSION,
  APP_EL, TOAST_EL,

  // §2 debug
  dlog, derr,

  // §3 session
  session,

  // §4 http
  request,

  // §5 api
  api,

  // §6 store
  store,

  // §7 utils
  toast, escapeHtml, escapeHtmlMultiline,
  contractLabel, APP_STATUS_LABELS,
  questionImageUrl, optionImageUrl, resolveImage,
  setPageTransition, loadingCenter, updateHeaderAuthUI,
  readQuizCache, writeQuizCache, clearQuizCache,
  emptyState,
  salaryRangeText, appPillHtml,
  openLightbox, closeLightbox, bindLightboxTriggers,
  renderMarkdown,
};