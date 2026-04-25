/* quiz.js
   ════════════════════════════════════════════════════════════════
   Question renderers + slot-based ranking UI.
   Pure rendering helpers; no API calls. Called by pages.js when
   rendering the quiz-taking page.
   ════════════════════════════════════════════════════════════════ */

import { APP_EL, escapeHtml, questionImageUrl, optionImageUrl } from './core.js';

/* ─────────────────────────────────────────────────────────────
   §10 — Quiz renderers + slot-based ranking
   ─────────────────────────────────────────────────────────── */

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
      ${imgUrl ? questionImageBlock(imgUrl) : ''}
      ${body}
    </div>
  `;
}

// Question image: clickable + an explicit "expand" button so candidates
// know they can enlarge it.
function questionImageBlock(src) {
  const safeSrc = escapeHtml(src);
  return `
    <div class="question-image-wrap" data-lightbox-src="${safeSrc}" role="button" tabindex="0">
      <img class="question-image" src="${safeSrc}" alt="">
      <button type="button" class="image-expand-btn" data-lightbox-src="${safeSrc}" aria-label="Enlarge image">
        <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" d="M4 8V4h4M20 8V4h-4M4 16v4h4M20 16v4h-4"/>
        </svg>
        <span>Enlarge</span>
      </button>
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
  const safeImg = imgUrl ? escapeHtml(imgUrl) : null;
  return `
    <div class="mc-option" data-question-id="${escapeHtml(qId)}" data-value="${index}">
      ${box}
      <div style="flex:1;min-width:0">
        <span class="mc-label">${escapeHtml(label)}</span>
        ${safeImg ? `
          <div class="mc-option-image-wrap" data-lightbox-src="${safeImg}" role="button" tabindex="0">
            <img class="mc-option-image" src="${safeImg}" alt="">
            <button type="button" class="image-expand-btn image-expand-btn-sm" data-lightbox-src="${safeImg}" aria-label="Enlarge image">
              <svg width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" d="M4 8V4h4M20 8V4h-4M4 16v4h4M20 16v4h-4"/>
              </svg>
            </button>
          </div>
        ` : ''}
      </div>
    </div>
  `;
}


// ── Slot-based ranking ──
//
// Layout:
//   • Pool above (unranked options) — tap or drag from here.
//   • Slots below (numbered 1..N).  Tap an option in pool → fills next empty slot.
//                                   Tap an option in a slot → returns to pool.
//                                   Drag works between any two locations.
//
// Both interactions update the same internal state which is read on submit.

function rankingHtml(q) {
  const options = (q.config && q.config.options) || [];
  const n = options.length;

  const pool = options.map((opt) => rankingChipHtml(q.id, opt)).join('');
  const slots = Array.from({ length: n }, (_, i) => `
    <li class="rank-slot" data-question-id="${escapeHtml(q.id)}" data-slot-index="${i}">
      <span class="rank-slot-num">${i + 1}</span>
      <span class="rank-slot-empty">Tap or drag an answer here</span>
    </li>
  `).join('');

  return `
    <p class="question-hint">Tap an answer to place it in the next slot, or drag it where you want. Tap a placed answer to send it back.</p>
    <div class="rank-block" data-question-id="${escapeHtml(q.id)}">
      <div class="rank-pool-label">Available answers</div>
      <ul class="rank-pool" data-question-id="${escapeHtml(q.id)}" data-zone="pool">${pool}</ul>
      <div class="rank-slots-label">Your ranking <span class="rank-slots-hint">(top = most important)</span></div>
      <ol class="rank-slots" data-question-id="${escapeHtml(q.id)}" data-zone="slots">${slots}</ol>
    </div>
  `;
}

function rankingChipHtml(qId, opt) {
  return `
    <li class="rank-chip" draggable="true"
        data-question-id="${escapeHtml(qId)}"
        data-option-id="${escapeHtml(opt.id)}">
      <span class="rank-chip-label">${escapeHtml(opt.label || '')}</span>
      <span class="rank-chip-handle" aria-hidden="true">
        <svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" width="14" height="14">
          <path stroke-linecap="round" stroke-linejoin="round" d="M4 6h16M4 12h16M4 18h16"/>
        </svg>
      </span>
    </li>
  `;
}


function bindMultipleChoice(questions, answers) {
  APP_EL.querySelectorAll('.mc-option').forEach((opt) => {
    opt.addEventListener('click', (e) => {
      // Don't toggle if user clicked the lightbox/expand button
      if (e.target.closest('.image-expand-btn') || e.target.closest('.mc-option-image-wrap')) return;
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


/**
 * Bind ranking blocks. Per question:
 *   - State: a Map<slotIndex, optionId | null>
 *   - Pool DOM is the "unranked" zone, slots DOM are the placed positions
 *   - Tap a chip in pool → fills the lowest empty slot
 *   - Tap a chip in a slot → moves it back to pool
 *   - Drag a chip onto a slot → places it (if slot empty), or swaps (if filled)
 *   - Drag a chip back to pool → removes it from slots
 *   - On every change, write answers[qId] = array of optionIds in slot order
 *     (slots that are still empty are excluded — submit will warn)
 */
function bindRanking(questions, answers) {
  const blocks = APP_EL.querySelectorAll('.rank-block');
  const cleanups = [];

  blocks.forEach((block) => {
    const qId = block.dataset.questionId;
    const pool  = block.querySelector('.rank-pool');
    const slots = block.querySelector('.rank-slots');
    if (!pool || !slots) return;

    function commit() {
      const placed = Array.from(slots.querySelectorAll('.rank-slot')).map((slot) => {
        const chip = slot.querySelector('.rank-chip');
        return chip ? chip.dataset.optionId : null;
      });
      // Only include consecutive filled slots from the top — actually no,
      // we just submit whatever's placed (any holes mean unfinished).
      const filled = placed.filter(Boolean);
      // If complete (all slots filled), submit full order. Otherwise submit
      // partial — server will see an array shorter than expected and handle.
      if (filled.length === placed.length) {
        answers[qId] = placed;
      } else {
        // Mark as in-progress: remove key so submit-validation catches it.
        delete answers[qId];
      }
    }

    function placeChipInSlot(chip, slot) {
      // If slot already has a chip, push the existing one back to pool first
      const existing = slot.querySelector('.rank-chip');
      if (existing && existing !== chip) {
        pool.appendChild(existing);
      }
      slot.appendChild(chip);
      slot.classList.add('rank-slot-filled');
      // Hide the placeholder text via class
      commit();
      updateSlotPlaceholders();
    }

    function returnChipToPool(chip) {
      pool.appendChild(chip);
      commit();
      updateSlotPlaceholders();
    }

    function placeChipInFirstEmptySlot(chip) {
      const allSlots = slots.querySelectorAll('.rank-slot');
      for (const slot of allSlots) {
        if (!slot.querySelector('.rank-chip')) {
          placeChipInSlot(chip, slot);
          return true;
        }
      }
      return false;
    }

    function updateSlotPlaceholders() {
      slots.querySelectorAll('.rank-slot').forEach((slot) => {
        slot.classList.toggle('rank-slot-filled', !!slot.querySelector('.rank-chip'));
      });
    }

    // ── Tap interactions ──
    const onClick = (e) => {
      const chip = e.target.closest('.rank-chip');
      if (!chip || !block.contains(chip)) return;

      // Where is it?
      if (pool.contains(chip)) {
        // Move to first empty slot
        placeChipInFirstEmptySlot(chip);
      } else {
        // It's in a slot — return to pool
        returnChipToPool(chip);
      }
    };
    block.addEventListener('click', onClick);

    // ── Drag-drop interactions ──
    let dragged = null;

    const onDragStart = (e) => {
      const chip = e.target.closest('.rank-chip');
      if (!chip || !block.contains(chip)) return;
      dragged = chip;
      chip.classList.add('rank-chip-dragging');
      e.dataTransfer.effectAllowed = 'move';
      try { e.dataTransfer.setData('text/plain', chip.dataset.optionId || ''); } catch {}
    };

    const onDragEnd = () => {
      if (dragged) dragged.classList.remove('rank-chip-dragging');
      dragged = null;
      block.querySelectorAll('.rank-drop-hover').forEach((el) => el.classList.remove('rank-drop-hover'));
    };

    const onDragOver = (e) => {
      if (!dragged) return;
      // We accept drops on slots OR the pool itself
      const slot = e.target.closest('.rank-slot');
      const onPool = pool.contains(e.target) || e.target === pool;
      if (!slot && !onPool) return;
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';

      block.querySelectorAll('.rank-drop-hover').forEach((el) => el.classList.remove('rank-drop-hover'));
      (slot || pool).classList.add('rank-drop-hover');
    };

    const onDragLeave = (e) => {
      const target = e.target.closest('.rank-slot') || (e.target === pool ? pool : null);
      if (target) target.classList.remove('rank-drop-hover');
    };

    const onDrop = (e) => {
      if (!dragged) return;
      block.querySelectorAll('.rank-drop-hover').forEach((el) => el.classList.remove('rank-drop-hover'));
      const slot = e.target.closest('.rank-slot');
      const onPool = pool.contains(e.target) || e.target === pool;
      if (!slot && !onPool) return;
      e.preventDefault();
      if (slot) placeChipInSlot(dragged, slot);
      else      returnChipToPool(dragged);
    };

    block.addEventListener('dragstart', onDragStart);
    block.addEventListener('dragend',   onDragEnd);
    block.addEventListener('dragover',  onDragOver);
    block.addEventListener('dragleave', onDragLeave);
    block.addEventListener('drop',      onDrop);

    cleanups.push(() => {
      block.removeEventListener('click',     onClick);
      block.removeEventListener('dragstart', onDragStart);
      block.removeEventListener('dragend',   onDragEnd);
      block.removeEventListener('dragover',  onDragOver);
      block.removeEventListener('dragleave', onDragLeave);
      block.removeEventListener('drop',      onDrop);
    });

    updateSlotPlaceholders();
  });

  return () => cleanups.forEach((fn) => { try { fn(); } catch {} });
}


/* ─────────────────────────────────────────────────────────────
   Exports
   ─────────────────────────────────────────────────────────── */

export { questionHtml, bindMultipleChoice, bindOpenText, bindRanking };