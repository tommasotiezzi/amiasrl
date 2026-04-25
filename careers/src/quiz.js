/* quiz.js
   ════════════════════════════════════════════════════════════════
   Question renderers + ranking drag-drop.
   Pure rendering helpers; no API calls. Called by pages.js when
   rendering the quiz-taking page.
   ════════════════════════════════════════════════════════════════ */

import { APP_EL, escapeHtml, questionImageUrl, optionImageUrl } from './core.js';

function questionHtml(q, index, total) {
  const imgUrl = questionImageUrl(q.config);
  const points = q.points > 0 ? ` · ${q.points} punti` : '';

  let body;
  if (q.question_type === 'multiple_choice') body = mcHtml(q);
  else if (q.question_type === 'ranking') body = rankingHtml(q);
  else if (q.question_type === 'open_text') {
    body = `<textarea class="open-textarea" data-question-id="${escapeHtml(q.id)}" placeholder="Write your answer..." rows="6"></textarea>`;
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
  const hint = multi ? `<p class="question-hint">You can select more than one answer.</p>` : '';
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
  const hint = `<p class="question-hint">Drag to order from most important (top) to least important.</p>`;
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
   Exports
   ─────────────────────────────────────────────────────────── */

export { questionHtml, bindMultipleChoice, bindOpenText, bindRanking };