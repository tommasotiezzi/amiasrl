/* pages.js
   ════════════════════════════════════════════════════════════════
   Page renderers + the router (route table + dispatch).
   The router lives here because the route table directly references
   page functions defined in this file.
   ════════════════════════════════════════════════════════════════ */

import {
  APP_EL, TOS_VERSION, APP_STATUS_LABELS,
  api, store,
  dlog, derr, toast,
  escapeHtml, escapeHtmlMultiline, contractLabel,
  emptyState, readQuizCache, writeQuizCache, clearQuizCache,
  setPageTransition, loadingCenter, updateHeaderAuthUI,
  resolveImage,
  salaryRangeText, appPillHtml,
  renderMarkdown,
  bindLightboxTriggers,
} from './core.js';

import { questionHtml, bindMultipleChoice, bindOpenText, bindRanking } from './quiz.js';

/* ─────────────────────────────────────────────────────────────
   §9 — Pages
   ─────────────────────────────────────────────────────────── */

// ─── 9.1 Jobs list ──────────────────────────────────

async function renderJobsList() {
  let jobs;
  try { jobs = await api.listPublishedPositions(); }
  catch (e) { jobs = []; toast('Could not load positions', true); }

  APP_EL.innerHTML = `
    <section class="jobs-hero">
      <div class="container">
        <h1>Work with us</h1>
        <p>Join the team building Amia's future. We're looking for curious, passionate people who love getting things done.</p>
      </div>
    </section>
    <section class="jobs-section">
      <div class="container">
        ${jobs.length ? `
          <div class="jobs-grid">
            ${jobs.map(jobCard).join('')}
          </div>
        ` : `
          <p class="no-jobs">No open positions at the moment — check back soon!</p>
        `}
      </div>
    </section>
  `;
}

function jobCard(j) {
  const href = `#/apply/${encodeURIComponent(j.slug || j.id)}`;
  const ral = salaryRangeText(j.salary_min, j.salary_max);
  return `
    <a href="${href}" class="job-card">
      <div class="job-card-info">
        <div class="job-card-titlerow">
          <h3>${escapeHtml(j.title)}</h3>
          ${appPillHtml(j, 'sm')}
        </div>
        <div class="job-card-meta">
          <span>${escapeHtml(j.department)}</span>
          <span>·</span>
          <span>${escapeHtml(j.location)}</span>
          <span>·</span>
          <span>${escapeHtml(contractLabel(j.contract_type))}</span>
          ${ral ? `<span>·</span><span class="job-card-salary">${escapeHtml(ral)}</span>` : ''}
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

// ─── 9.2 Apply ──────────────────────────────────────
// Three shapes depending on user state:
//   - not authed, signup mode (default) → full apply form with inline signup
//   - not authed, signin mode            → email+password only, standalone
//   - authed, already applied            → redirect to portal (never renders)
//   - authed, not applied                → full apply form, prefilled, no signup block

async function renderApply(slugOrId) {
  let position;
  try { position = await api.getPositionBySlugOrId(slugOrId); }
  catch { position = null; }

  if (!position) {
    APP_EL.innerHTML = emptyState(
      'Position unavailable',
      'This position does not exist or is no longer open.',
      '#/', 'See open positions'
    );
    return;
  }

  // Authed? Check if they already applied — redirect if so.
  if (store.isAuthed && store.candidate) {
    try {
      const ex = await api.findExistingApplication(position.id, store.candidate.id);
      if (ex) {
        toast('You have already applied for this position');
        location.hash = '#/portal';
        return;
      }
    } catch (e) { dlog('existing-app check failed (non-fatal)', e.message); }
  }

  renderApplyForm(position);
}

// Standalone sign-in view. Authenticates, then branches:
//   - If a position is provided (apply-bound flow): redirect to portal if the
//     candidate already applied, otherwise show the apply form.
//   - If no position (top-level "/signin" route): redirect to portal on success.
async function renderSigninView(position) {
  const isStandalone = !position;
  APP_EL.innerHTML = `
    <div class="job-detail">
      <a href="#/" class="job-back">← All positions</a>
      ${isStandalone ? `
        <h1>Sign in</h1>
        <p class="quiz-desc" style="margin-top:8px">Sign in to access your applications and pending quizzes.</p>
      ` : `
        <h1>${escapeHtml(position.title)}</h1>
        <div class="job-detail-meta">
          <span>${escapeHtml(position.department)}</span>
          <span>·</span>
          <span>${escapeHtml(position.location)}</span>
          <span>·</span>
          <span>${escapeHtml(contractLabel(position.contract_type))}</span>
        </div>
      `}

      <form id="signin-form" class="apply-form" novalidate style="max-width:480px">
        <fieldset class="form-section form-section-account">
          <legend class="form-section-title">${isStandalone ? 'Welcome back' : 'Sign in to your account'}</legend>
          <p class="form-section-desc">
            ${isStandalone
              ? `Don\'t have an account yet? <a href="#/" style="color:var(--accent);text-decoration:underline">Browse open positions</a> and apply.`
              : `Sign in to continue with your application. New here? <button type="button" class="link-btn" id="switch-to-signup">Create an account</button>.`
            }
          </p>
          <div class="form-grid">
            <div class="form-group">
              <label class="form-label" for="si-email">Email <span class="required">*</span></label>
              <input type="email" id="si-email" class="form-input" placeholder="you@example.com"
                autocomplete="email" required>
            </div>
            <div class="form-group">
              <label class="form-label" for="si-pass">Password <span class="required">*</span></label>
              <input type="password" id="si-pass" class="form-input" placeholder="••••••••"
                autocomplete="current-password" required>
            </div>
          </div>
        </fieldset>

        <button type="submit" class="submit-btn" id="signin-btn">
          Sign in
          <svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3"/>
          </svg>
        </button>
      </form>
    </div>
  `;

  // Back to signup (only present in apply-bound flow)
  const switchBtn = APP_EL.querySelector('#switch-to-signup');
  if (switchBtn) {
    switchBtn.addEventListener('click', () => {
      renderApplyForm(position);
    });
  }

  APP_EL.querySelector('#signin-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = APP_EL.querySelector('#si-email').value.trim();
    const pass  = APP_EL.querySelector('#si-pass').value;
    if (!email || !pass) { toast('Enter email and password', true); return; }

    const btn = APP_EL.querySelector('#signin-btn');
    const originalHtml = btn.innerHTML;
    btn.disabled = true;
    btn.textContent = 'Signing in...';

    try {
      await api.signIn(email, pass);
      await store.hydrate();

      if (isStandalone) {
        // Top-level signin → straight to portal
        toast('Signed in');
        location.hash = '#/portal';
        return;
      }

      // Apply-bound signin: check for existing application
      if (store.candidate) {
        try {
          const ex = await api.findExistingApplication(position.id, store.candidate.id);
          if (ex) {
            toast('You have already applied — redirecting to your area');
            location.hash = '#/portal';
            return;
          }
        } catch (err) {
          dlog('existing-app check after signin failed (non-fatal)', err.message);
        }
      }

      // Not applied yet → show apply form prefilled
      toast('Signed in');
      renderApplyForm(position);
    } catch (err) {
      derr('signin failed', err);
      toast(err.message || 'Invalid email or password', true);
      btn.disabled = false;
      btn.innerHTML = originalHtml;
    }
  });
}

function renderApplyForm(position) {
  const authed = store.isAuthed;
  const cand = store.candidate;
  const ral = salaryRangeText(position.salary_min, position.salary_max);
  const hasComp = ral || position.stock_options || position.bonus;

  APP_EL.innerHTML = `
    <div class="job-detail">
      <a href="#/" class="job-back">← All positions</a>
      <div class="job-detail-titlerow">
        <h1>${escapeHtml(position.title)}</h1>
        ${appPillHtml(position, 'md')}
      </div>
      <div class="job-detail-meta">
        <span>${escapeHtml(position.department)}</span>
        <span>·</span>
        <span>${escapeHtml(position.location)}</span>
        <span>·</span>
        <span>${escapeHtml(contractLabel(position.contract_type))}</span>
      </div>

      <div class="job-description md-content">${renderMarkdown(position.description || '')}</div>

      ${hasComp ? `
        <div class="job-comp">
          <div class="job-comp-title">Compensation</div>
          <dl class="job-comp-list">
            ${ral ? `
              <dt>Salary range</dt>
              <dd>${escapeHtml(ral)}</dd>
            ` : ''}
            ${position.stock_options ? `
              <dt>Stock options</dt>
              <dd>${escapeHtml(position.stock_options)}</dd>
            ` : ''}
            ${position.bonus ? `
              <dt>Bonus</dt>
              <dd>${escapeHtml(position.bonus)}</dd>
            ` : ''}
          </dl>
        </div>
      ` : ''}

      <form id="apply-form" class="apply-form" novalidate>
        ${authed ? accountBlockAuthed() : accountBlockSignup()}

        <fieldset class="form-section">
          <legend class="form-section-title">
            Informazioni di contatto
          </legend>
          <div class="form-grid">
            <div class="form-group">
              <label class="form-label" for="f-first">First name <span class="required">*</span></label>
              <input type="text" id="f-first" class="form-input" placeholder="Jane" required
                value="${escapeHtml(cand?.first_name || '')}">
            </div>
            <div class="form-group">
              <label class="form-label" for="f-last">Last name <span class="required">*</span></label>
              <input type="text" id="f-last" class="form-input" placeholder="Doe" required
                value="${escapeHtml(cand?.last_name || '')}">
            </div>
            <div class="form-group">
              <label class="form-label" for="f-phone">Phone</label>
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
          <legend class="form-section-title">Your application</legend>
          <div class="form-grid">
            <div class="form-group full">
              <label class="form-label" for="f-cover">Cover letter</label>
              <textarea id="f-cover" class="form-textarea"
                placeholder="Add anything relevant to your application: a portfolio link, a piece of work you're proud of, why you'd be a fit, references, anything else you want us to know."></textarea>
            </div>
            <div class="form-group full">
              <label class="form-label">CV (PDF) <span class="required">*</span></label>
              <label class="form-file-label" id="cv-label" for="f-cv">
                <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                </svg>
                <span id="cv-label-text">Upload your CV</span>
                <input type="file" id="f-cv" class="form-file-input" accept=".pdf,application/pdf" required>
              </label>
            </div>
          </div>
        </fieldset>

        <div class="form-consent">
          <label class="consent-label">
            <input type="checkbox" id="f-consent" required>
            <span>I consent to the processing of my personal data for recruitment purposes,
              as stated in the <a href="https://amia.technology/privacy" target="_blank" rel="noopener">privacy policy</a>.
              <span class="required">*</span></span>
          </label>
        </div>

        <button type="submit" class="submit-btn" id="apply-submit-btn">
          ${authed ? 'Submit application' : 'Create account and apply'}
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
        Create your candidate account
      </legend>
      <p class="form-section-desc">
        You'll need an account to track your application and complete the assessment quizzes.
        If you already have one, <button type="button" class="link-btn" id="switch-to-signin">sign in here</button>.
      </p>
      <div class="form-grid" id="account-fields">
        <div class="form-group">
          <label class="form-label" for="f-email">Email <span class="required">*</span></label>
          <input type="email" id="f-email" class="form-input" placeholder="you@example.com"
            autocomplete="email" required>
        </div>
        <div class="form-group">
          <label class="form-label" for="f-pass">Password <span class="required">*</span></label>
          <input type="password" id="f-pass" class="form-input" placeholder="Minimum 6 characters"
            autocomplete="new-password" minlength="6" required>
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
        <p>Applying as <strong>${escapeHtml(user.email)}</strong></p>
        <button type="button" class="link-btn" id="logout-btn">Logout</button>
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
      cvText.textContent = 'Upload your CV';
      return;
    }
    if (file.type !== 'application/pdf') {
      toast('PDF files only', true); cvInput.value = ''; return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast('File exceeds 10 MB', true); cvInput.value = ''; return;
    }
    cvLabel.classList.add('has-file');
    cvText.textContent = `${file.name} (${(file.size / (1024*1024)).toFixed(1)} MB)`;
  });

  // Logout (when authed)
  const logoutBtn = APP_EL.querySelector('#logout-btn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', async (e) => {
      e.preventDefault();
      dlog('apply-logout: clicked');
      await api.signOut();
      toast('Logged out');
      renderApply(position.slug || position.id);
    });
  }

  // "Sign in here" → standalone signin view (not an inline swap).
  // The signin flow handles the "already applied? redirect" logic itself.
  const toSignin = APP_EL.querySelector('#switch-to-signin');
  if (toSignin) {
    toSignin.addEventListener('click', () => renderSigninView(position));
  }

  // Submit
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    submitApplication(position);
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
  if (!consent) { toast('You must accept the data processing consent', true); return; }
  if (!first || !last) { toast('First and last name are required', true); return; }
  if (!cvFile) { toast('CV is required', true); return; }
  if (cvFile.type !== 'application/pdf') { toast('CV must be in PDF format', true); return; }
  if (cvFile.size > 10 * 1024 * 1024) { toast('CV cannot exceed 10 MB', true); return; }

  // Auth fields (only present when not logged in)
  const accountSection = APP_EL.querySelector('.form-section-account');
  const needsAuth = accountSection && !accountSection.classList.contains('form-section-authed');
  let email, password, isSignup;
  if (needsAuth) {
    email = APP_EL.querySelector('#f-email').value.trim();
    password = APP_EL.querySelector('#f-pass').value;
    if (!email || !password) { toast('Enter email and password', true); return; }
    // "signup" mode if the block shows "Crea il tuo account"
    isSignup = !!accountSection.querySelector('#switch-to-signin');
    if (isSignup && password.length < 6) {
      toast('Password must be at least 6 characters', true); return;
    }
  }

  btn.disabled = true;
  const originalBtnHtml = btn.innerHTML;
  btn.textContent = 'Submitting...';

  try {
    // Step 0: auth (signup or signin) if not logged in
    if (needsAuth) {
      dlog('submit step 0: auth', isSignup ? 'signup' : 'signin');
      if (isSignup) {
        // Record TOS consent at signup time. The checkbox has already
        // been validated above, so if we got here the user ticked it.
        await api.signUp(email, password, {
          tos_accepted_at: new Date().toISOString(),
          tos_version: TOS_VERSION,
        });
      } else {
        await api.signIn(email, password);
      }
      // After signup with confirmation disabled, session exists.
      if (!store.isAuthed) throw new Error('Could not create session. Check your email to confirm your account.');
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
      toast('You have already applied for this position', true);
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
    toast('Application submitted! 🎉');
    setTimeout(() => { location.hash = '#/portal'; }, 1200);

  } catch (err) {
    derr('submit failed', err);
    toast(err.message || 'Submission error', true);
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
          <h1>My area</h1>
          <p>No applications yet.</p>
          <div class="portal-userbar">
            <span>${escapeHtml(store.user?.email || '')}</span>
            <button class="link-btn" id="logout-btn">Logout</button>
          </div>
        </div>
      </section>
      <section class="portal-section">
        ${emptyState(
          'No applications',
          'Start by checking out our open positions.',
          '#/', 'See open positions'
        )}
      </section>
    `;
    bindLogout();
    return;
  }

  let apps;
  try { apps = await api.listMyApplications(store.candidate.id); }
  catch (e) { apps = []; toast('Could not load data', true); }

  APP_EL.innerHTML = `
    <section class="portal-hero">
      <div class="container">
        <h1>Hi, ${escapeHtml(store.candidate.first_name)} 👋</h1>
        <p>Your applications and pending quizzes.</p>
        <div class="portal-userbar">
          <span>${escapeHtml(store.user.email)}</span>
          <button class="link-btn" id="logout-btn">Logout</button>
        </div>
      </div>
    </section>
    <section class="portal-section">
      ${apps.length
        ? apps.map(applicationCard).join('')
        : emptyState('No applications', 'Start by checking out our open positions.', '#/', 'See open positions')
      }
    </section>
  `;

  bindLogout();
}

function applicationCard(app) {
  const p = app.position || {};
  const quizzes = [];
  if (p.pre_quiz_id) quizzes.push({
    type: 'pre', label: 'Logic Quiz', icon: '🧠',
    subtitle: 'Logical reasoning and problem solving',
    duration: '25 min',
    done: !!app.pre_quiz_completed_at,
    score: app.pre_quiz_score, max: app.pre_quiz_max_score,
  });
  if (p.post_quiz_id) quizzes.push({
    type: 'post', label: 'Skills Quiz', icon: '💻',
    subtitle: 'Role-specific technical skills',
    duration: '35 min',
    done: !!app.post_quiz_completed_at,
    score: app.post_quiz_score, max: app.post_quiz_max_score,
  });
  if (p.att_quiz_id) quizzes.push({
    type: 'att', label: 'Attitudinal Questions', icon: '💬',
    subtitle: 'Motivation, culture and work style',
    duration: 'Untimed',
    done: !!app.att_quiz_completed_at,
  });

  const allDone = quizzes.length > 0 && quizzes.every((q) => q.done);

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
        : '<p class="quiz-empty">No quizzes for this position.</p>'
      }
      ${allDone ? `
        <div class="app-card-congrats">
          <div class="app-card-congrats-icon">🎉</div>
          <p class="app-card-congrats-title">All quizzes completed</p>
          <p class="app-card-congrats-body">
            Congratulations — you've completed all the quizzes. Thank you for your time;
            we'll be in touch as soon as possible to follow up with your application.
          </p>
        </div>
      ` : ''}
    </div>
  `;
}

function quizRow(appId, q) {
  if (q.done) {
    const scoreEl = `<div class="quiz-row-score score-good">✓<div class="score-sub">Completed</div></div>`;
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
          <div class="meta-sub">Not started</div>
        </div>
        <a href="#/quiz-overview/${encodeURIComponent(appId)}/${encodeURIComponent(q.type)}" class="quiz-go-btn">Start</a>
      </div>
    </div>
  `;
}

function bindLogout() {
  const btn = APP_EL.querySelector('#logout-btn');
  if (!btn) { dlog('bindLogout: no #logout-btn in DOM'); return; }
  dlog('bindLogout: attaching click handler');
  btn.addEventListener('click', async (e) => {
    e.preventDefault();
    dlog('logout: clicked');
    await api.signOut();
    toast('Logged out');
    location.hash = '#/';
    // Force a re-route in case we were already at #/
    if ((location.hash || '#/') === '#/') route();
  });
}


// ─── 9.4 Quiz overview ──────────────────────────────

const QUIZ_TYPE_INFO = {
  pre: {
    icon: '🧠', title: 'Logic Quiz',
    desc: 'We assess your logical reasoning, problem solving, and critical thinking. Includes multiple-choice and ranking questions.',
    rules: [
      'Some multiple-choice questions may have more than one correct answer',
      'For ranking questions, drag the items to order them',
      'Quality matters more than speed',
    ],
  },
  post: {
    icon: '💻', title: 'Skills Quiz',
    desc: 'We assess the technical skills specific to this role. Includes theoretical questions, practical scenarios, and ranking.',
    rules: [
      'Questions are tailored to the position you applied for',
      'For open-ended questions, be concrete and use real examples',
      'Better to try than to leave blank',
    ],
  },
  att: {
    icon: '💬', title: 'Attitudinal Questions',
    desc: 'These questions help us get to know you better. There are no right or wrong answers — we want to understand how you work.',
    rules: [
      'Answer authentically: consistency matters more than the "right answer"',
      'There is no time limit',
      'Your answers guide the interview, not replace it',
    ],
  },
};

async function renderQuizOverview(applicationId, quizType) {
  const info = QUIZ_TYPE_INFO[quizType];
  if (!info) { toast('Quiz non valido', true); location.hash = '#/portal'; return; }

  let app, quiz;
  try {
    app = await api.getApplicationWithPosition(applicationId);
    if (!app) throw new Error('Application not found');

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
    toast(err.message || 'Error', true);
    location.hash = '#/portal';
    return;
  }

  const doneMap = {
    pre: app.pre_quiz_completed_at,
    post: app.post_quiz_completed_at,
    att: app.att_quiz_completed_at,
  };
  if (doneMap[quizType]) {
    toast('You have already completed this quiz');
    location.hash = '#/portal';
    return;
  }

  const count = Array.isArray(quiz.questions) ? quiz.questions.length : 0;
  const p = app.position;

  APP_EL.innerHTML = `
    <div class="quiz-overview">
      <a href="#/portal" class="job-back">← My applications</a>

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
            <p class="stat-label">Questions</p>
          </div>
          <div>
            <p class="stat-num">${quiz.duration_minutes ? escapeHtml(String(quiz.duration_minutes)) + ' min' : '∞'}</p>
            <p class="stat-label">Time${quiz.duration_minutes ? '' : ' (unlimited)'}</p>
          </div>
        </div>
        <div class="quiz-overview-rules">
          <p class="rules-title">Before Starting</p>
          <ul>${info.rules.map((r) => `<li>${escapeHtml(r)}</li>`).join('')}</ul>
        </div>
      </div>

      <div class="quiz-overview-warn">
        <p class="warn-title">⚠️ Important</p>
        <p class="warn-body">
          Do not share, copy or disclose the content of this quiz.
          The answers must be the fruit of your personal work.
          ${quiz.duration_minutes ? `
            <br><br>
            The timer starts the moment you click <strong>Start quiz</strong> and runs server-side
            — leaving and returning to the page does not reset it.
            When the timer hits zero your quiz will be <strong>auto-submitted</strong> with whatever
            answers you have entered.
          ` : ''}
        </p>
      </div>

      <div class="quiz-overview-actions">
        <a href="#/quiz/${encodeURIComponent(applicationId)}/${encodeURIComponent(quizType)}"
           class="submit-btn" style="text-decoration:none">
          Start quiz
          <svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3"/>
          </svg>
        </a>
        <p class="hint">This page will not start your task</p>
      </div>
    </div>
  `;
}


// ─── 9.5 Quiz ───────────────────────────────────────

async function renderQuiz(applicationId, quizType) {
  let app, quiz;
  try {
    app = await api.getApplicationWithPosition(applicationId);
    if (!app) throw new Error('Application not found');

    const doneMap = {
      pre: app.pre_quiz_completed_at,
      post: app.post_quiz_completed_at,
      att: app.att_quiz_completed_at,
    };
    if (doneMap[quizType]) {
      toast('You have already completed this quiz');
      location.hash = '#/portal';
      return;
    }

    const cached = readQuizCache(applicationId, quizType);
    if (cached) quiz = cached;
    else {
      quiz = await api.getQuizForCandidate(applicationId, quizType);
      if (!quiz) throw new Error('Quiz not available');
      writeQuizCache(applicationId, quizType, quiz);
    }
  } catch (err) {
    derr('quiz load', err);
    toast(err.message || 'Error', true);
    location.hash = '#/portal';
    return;
  }

  const questions = Array.isArray(quiz.questions) ? quiz.questions : [];
  if (!questions.length) {
    APP_EL.innerHTML = emptyState('Quiz unavailable', 'This quiz has no questions configured yet.', '#/portal', 'Back to portal');
    return;
  }
  dlog('renderQuiz:', { quizId: quiz.quiz_id, count: questions.length, types: questions.map((q) => q.question_type) });

  // Server-anchored timer. We ask the DB for the started_at for this
  // (application, quiz_type) pair. First call writes NOW(); subsequent calls
  // (page reloads, navigating away and back) return the same value, so the
  // timer cannot be reset by the candidate.
  let startedAt;
  try {
    const startedIso = await api.startQuiz(applicationId, quizType);
    startedAt = new Date(startedIso);
    if (isNaN(startedAt.getTime())) throw new Error('invalid started_at');
  } catch (e) {
    derr('start_quiz failed, falling back to local now', e);
    startedAt = new Date();
  }
  const durationMs = quiz.duration_minutes ? quiz.duration_minutes * 60000 : null;

  // answers shape:
  //   MC:      [index, ...]           0-based indices
  //   ranking: ["id", ...]            option IDs, top→bottom (set only when fully placed)
  //   open:    "string"
  // Note: ranking doesn't pre-seed anymore — candidate must place every chip
  // into a slot for it to count as "answered". MC and open seed as empty.
  const _answers = {};
  for (const q of questions) {
    if (q.question_type === 'multiple_choice') _answers[q.id] = [];
    else if (q.question_type === 'open_text')  _answers[q.id] = '';
    // ranking: leave undefined until candidate completes the slots
  }

  // Wrap in a Proxy so any write dispatches a "quiz:progress" event.
  // The sticky progress bar listens to this and recomputes counts.
  const answers = new Proxy(_answers, {
    set(t, k, v) {
      const ok = Reflect.set(t, k, v);
      window.dispatchEvent(new CustomEvent('quiz:progress'));
      return ok;
    },
    deleteProperty(t, k) {
      const ok = Reflect.deleteProperty(t, k);
      window.dispatchEvent(new CustomEvent('quiz:progress'));
      return ok;
    },
  });

  APP_EL.innerHTML = `
    <div class="quiz-page quiz-page-with-bar">
      <a href="#/portal" class="job-back">← My applications</a>
      <h1>${escapeHtml(quiz.title)}</h1>
      ${quiz.description ? `<p class="quiz-desc">${escapeHtml(quiz.description)}</p>` : ''}

      <div id="quiz-questions">
        ${questions.map((q, i) => questionHtml(q, i, questions.length)).join('')}
      </div>
    </div>
  `;

  // Sticky bar lives OUTSIDE #app because #app receives `.page-active` with a
  // transform, which would trap `position: fixed` descendants in its containing
  // block (i.e. they'd scroll with the page). Appending to <body> avoids that.
  const oldBar = document.getElementById('quiz-stickybar');
  if (oldBar) oldBar.remove();

  const stickyBar = document.createElement('div');
  stickyBar.className = 'quiz-stickybar';
  stickyBar.id = 'quiz-stickybar';
  stickyBar.innerHTML = `
    <button type="button" class="quiz-progress-btn" id="quiz-progress-btn" aria-haspopup="true" aria-expanded="false">
      <span class="quiz-progress-fill" id="quiz-progress-fill"></span>
      <span class="quiz-progress-label">
        <span id="quiz-progress-count">0 of ${questions.length}</span>
        <span class="quiz-progress-sub">answered</span>
      </span>
    </button>
    <div class="quiz-progress-popover" id="quiz-progress-popover" role="menu" hidden>
      <div class="quiz-progress-popover-title">Missing answers</div>
      <div class="quiz-progress-popover-grid" id="quiz-progress-popover-grid"></div>
    </div>

    ${durationMs ? `<div class="quiz-timer" id="quiz-timer">⏱ --:--</div>` : '<div></div>'}

    <button class="submit-btn quiz-submit-btn" id="quiz-submit">
      Submit quiz
      <svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/>
      </svg>
    </button>
  `;
  document.body.appendChild(stickyBar);

  bindMultipleChoice(questions, answers);
  bindOpenText(questions, answers);
  const rankingTeardown = bindRanking(questions, answers);
  bindLightboxTriggers(APP_EL);

  // ── Sticky bar progress + popover ──
  const progressBtn   = document.getElementById('quiz-progress-btn');
  const progressFill  = document.getElementById('quiz-progress-fill');
  const progressCount = document.getElementById('quiz-progress-count');
  const popover       = document.getElementById('quiz-progress-popover');
  const popoverGrid   = document.getElementById('quiz-progress-popover-grid');

  function isAnswered(q) {
    const a = answers[q.id];
    if (a == null) return false;
    if (Array.isArray(a)) return a.length > 0;
    if (typeof a === 'string') return a.trim().length > 0;
    return true;
  }

  function updateProgress() {
    const answered = questions.filter(isAnswered).length;
    const total = questions.length;
    const pct = total ? (answered / total) * 100 : 0;
    progressCount.textContent = `${answered} of ${total}`;
    progressFill.style.width = pct + '%';

    // Build popover content: list of missing question numbers
    const missing = [];
    questions.forEach((q, i) => { if (!isAnswered(q)) missing.push(i + 1); });
    if (missing.length === 0) {
      popoverGrid.innerHTML = '<p class="quiz-progress-popover-done">✓ All questions answered</p>';
    } else {
      popoverGrid.innerHTML = missing.map((n) => `
        <button type="button" class="quiz-progress-chip" data-q-index="${n - 1}">${n}</button>
      `).join('');
    }
  }

  function togglePopover(force) {
    const open = force != null ? force : popover.hasAttribute('hidden');
    if (open) {
      popover.removeAttribute('hidden');
      progressBtn.setAttribute('aria-expanded', 'true');
    } else {
      popover.setAttribute('hidden', '');
      progressBtn.setAttribute('aria-expanded', 'false');
    }
  }

  progressBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    togglePopover();
  });

  popover.addEventListener('click', (e) => {
    const chip = e.target.closest('.quiz-progress-chip');
    if (!chip) return;
    const idx = parseInt(chip.dataset.qIndex, 10);
    const cards = APP_EL.querySelectorAll('.question-card');
    if (cards[idx]) {
      cards[idx].scrollIntoView({ behavior: 'smooth', block: 'center' });
      cards[idx].classList.add('question-flash');
      setTimeout(() => cards[idx].classList.remove('question-flash'), 1400);
    }
    togglePopover(false);
  });

  // Click outside closes popover
  const onDocClick = (e) => {
    if (!popover.contains(e.target) && !progressBtn.contains(e.target)) {
      togglePopover(false);
    }
  };
  document.addEventListener('click', onDocClick);

  window.addEventListener('quiz:progress', updateProgress);
  updateProgress();

  // Timer — hard cutoff. At 0:00 the quiz auto-submits with whatever
  // answers the candidate has entered. Note the use of getElementById
  // for #quiz-timer because it lives in the sticky bar appended to body,
  // not inside APP_EL.
  let timerId = null, expired = false;
  if (durationMs) {
    const timerEl = document.getElementById('quiz-timer');
    const tick = () => {
      const elapsed = Date.now() - startedAt.getTime();
      const remaining = Math.max(0, durationMs - elapsed);
      const m = Math.floor(remaining / 60000);
      const s = Math.floor((remaining % 60000) / 1000);
      if (timerEl) timerEl.textContent = `⏱ ${m}:${String(s).padStart(2, '0')}`;
      if (timerEl && remaining < 300000) timerEl.classList.add('warning');
      if (remaining <= 0 && !expired) {
        expired = true;
        if (timerEl) {
          timerEl.classList.remove('warning');
          timerEl.classList.add('expired');
          timerEl.textContent = '⏱ Time expired';
        }
        clearInterval(timerId);
        // Lock the UI so the candidate can't keep editing answers
        // while the auto-submit is in flight.
        APP_EL.querySelectorAll('button, input, textarea, [draggable]').forEach((el) => {
          if (el.tagName === 'BUTTON') el.disabled = true;
          else if ('disabled' in el) el.disabled = true;
          el.setAttribute('draggable', 'false');
        });
        APP_EL.classList.add('quiz-locked');
        toast('Time expired — submitting');
        doSubmit();
      }
    };
    tick();
    timerId = setInterval(tick, 500);
  }

  const submitBtn = document.getElementById('quiz-submit');
  if (submitBtn) submitBtn.addEventListener('click', () => doSubmit());

  let submitting = false;
  async function doSubmit() {
    if (submitting) { dlog('doSubmit: already submitting'); return; }
    submitting = true;
    submitBtn.disabled = true;
    submitBtn.textContent = 'Submitting...';
    const completedAt = new Date();
    dlog('doSubmit:', { quizType, answerCount: Object.keys(answers).length });

    try {
      const result = await api.submitQuiz(
        applicationId, quizType, answers,
        startedAt.toISOString(), completedAt.toISOString()
      );
      clearQuizCache(applicationId, quizType);
      dlog('doSubmit success', result);
      toast('Quiz completed! 🎉');
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
            toast('Quiz completed! 🎉');
            setTimeout(() => { location.hash = '#/portal'; }, 1200);
            return;
          }
        } catch (e2) { derr('post-timeout check', e2); }
      }

      toast(err.message || 'Submission error', true);
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
    document.removeEventListener('click', onDocClick);
    window.removeEventListener('quiz:progress', updateProgress);
    const bar = document.getElementById('quiz-stickybar');
    if (bar) bar.remove();
  };
}




/* ─────────────────────────────────────────────────────────────
   §8 — Router
   ─────────────────────────────────────────────────────────── */

let currentTeardown = null;

const routes = [
  [/^\/$/,                                () => renderJobsList()],
  [/^\/signin$/,                          () => renderSigninView(null)],
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

  // Already-signed-in users visiting /signin → straight to portal
  if (path === '/signin' && store.isAuthed) {
    dlog('already signed in, redirecting to /portal');
    location.hash = '#/portal';
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
          'Something went wrong',
          e.message || 'Error loading this page.',
          '#/', 'Back to home'
        );
      }
      return;
    }
  }
  location.hash = '#/';
}


/* ─────────────────────────────────────────────────────────────
   Exports
   ─────────────────────────────────────────────────────────── */

export { route };