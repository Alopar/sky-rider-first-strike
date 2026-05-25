import { EventBus } from '../systems/EventBus.js';
import { EVT } from '../systems/events.js';
import {
  FEEDBACK_SCALES,
  DEFAULT_RATING,
  createDefaultRatings,
  buildFeedbackJson
} from '../config/feedback-schema.js';

function formatElapsedMs(ms) {
  const totalSec = Math.max(0, Math.floor(ms / 1000));
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

function ensureFeedbackStyles() {
  if (document.getElementById('ui-feedback-styles')) return;
  const link = document.createElement('link');
  link.id = 'ui-feedback-styles';
  link.rel = 'stylesheet';
  link.href = 'styles/ui-feedback.css';
  document.head.appendChild(link);
}

export class EndGameFeedbackScreen {
  constructor(containerId) {
    ensureFeedbackStyles();

    this.container = document.getElementById(containerId);
    if (!this.container) {
      throw new Error(`EndGameFeedbackScreen: container #${containerId} not found`);
    }

    this.runData = null;
    this.ratings = createDefaultRatings();
    this.scaleInputs = [];

    this.buildDOM();
    this.setupListeners();
  }

  buildDOM() {
    this.root = document.createElement('div');
    this.root.className = 'feedback-screen';
    this.root.setAttribute('aria-hidden', 'true');

    const backdrop = document.createElement('div');
    backdrop.className = 'feedback-screen__backdrop';

    this.panel = document.createElement('div');
    this.panel.className = 'feedback-screen__panel';

    this.titleElement = document.createElement('h2');
    this.titleElement.className = 'feedback-screen__title';

    this.statsElement = document.createElement('div');
    this.statsElement.className = 'feedback-screen__stats';

    const scalesWrap = document.createElement('div');
    scalesWrap.className = 'feedback-screen__scales';

    for (const scale of FEEDBACK_SCALES) {
      const row = document.createElement('div');
      row.className = 'feedback-scale';

      const header = document.createElement('div');
      header.className = 'feedback-scale__header';

      const label = document.createElement('span');
      label.className = 'feedback-scale__label';
      label.textContent = scale.label;

      const valueEl = document.createElement('span');
      valueEl.className = 'feedback-scale__value';
      valueEl.textContent = String(DEFAULT_RATING);

      header.appendChild(label);
      header.appendChild(valueEl);

      const hint = document.createElement('span');
      hint.className = 'feedback-scale__hint';
      hint.textContent = scale.hint;

      const range = document.createElement('input');
      range.type = 'range';
      range.className = 'feedback-scale__range';
      range.min = '0';
      range.max = '1';
      range.step = '0.01';
      range.value = String(DEFAULT_RATING);
      range.setAttribute('aria-label', scale.label);

      range.addEventListener('input', () => {
        const v = parseFloat(range.value);
        this.ratings[scale.key] = v;
        valueEl.textContent = v.toFixed(2);
      });

      row.appendChild(header);
      row.appendChild(hint);
      row.appendChild(range);
      scalesWrap.appendChild(row);

      this.scaleInputs.push({ key: scale.key, range, valueEl });
    }

    const commentLabel = document.createElement('label');
    commentLabel.className = 'feedback-screen__comment-label';
    commentLabel.textContent = 'Комментарий';
    commentLabel.setAttribute('for', 'feedback-comment');

    this.commentInput = document.createElement('textarea');
    this.commentInput.id = 'feedback-comment';
    this.commentInput.className = 'feedback-screen__comment';
    this.commentInput.placeholder = 'Что улучшить в следующей итерации…';

    const actions = document.createElement('div');
    actions.className = 'feedback-screen__actions';

    this.copyButton = document.createElement('button');
    this.copyButton.type = 'button';
    this.copyButton.className = 'feedback-screen__btn';
    this.copyButton.textContent = 'Скопировать в буфер';
    this.copyButton.addEventListener('click', () => this.copyToClipboard());

    this.retryButton = document.createElement('button');
    this.retryButton.type = 'button';
    this.retryButton.className = 'feedback-screen__btn feedback-screen__btn--primary';
    this.retryButton.textContent = 'Повторить';
    this.retryButton.addEventListener('click', () => {
      EventBus.emit(EVT.FEEDBACK_RETRY);
    });

    actions.appendChild(this.copyButton);
    actions.appendChild(this.retryButton);

    this.panel.appendChild(this.titleElement);
    this.panel.appendChild(this.statsElement);
    this.panel.appendChild(scalesWrap);
    this.panel.appendChild(commentLabel);
    this.panel.appendChild(this.commentInput);
    this.panel.appendChild(actions);

    this.root.appendChild(backdrop);
    this.root.appendChild(this.panel);
    this.container.appendChild(this.root);
  }

  setupListeners() {
    EventBus.on(EVT.RUN_ENDED, (payload) => this.show(payload));
    EventBus.on(EVT.GAME_START, () => this.hide());
  }

  show(payload) {
    this.runData = payload;
    this.resetRatings();

    const isWin = payload.outcome === 'win';
    this.titleElement.textContent = isWin ? 'Миссия выполнена' : 'Поражение';
    this.titleElement.className = `feedback-screen__title feedback-screen__title--${isWin ? 'win' : 'lose'}`;

    this.statsElement.innerHTML = [
      `<span class="feedback-screen__stat">Счёт: ${payload.score}</span>`,
      `<span class="feedback-screen__stat">Время: ${formatElapsedMs(payload.elapsedMs)}</span>`,
      `<span class="feedback-screen__stat">HP: ${payload.hpRemaining}</span>`,
      `<span class="feedback-screen__stat">Оружие: ${payload.weaponLevel}</span>`
    ].join('');

    this.root.classList.add('feedback-screen--visible');
    this.root.setAttribute('aria-hidden', 'false');
  }

  hide() {
    this.runData = null;
    this.root.classList.remove('feedback-screen--visible');
    this.root.setAttribute('aria-hidden', 'true');
    this.commentInput.value = '';
    this.resetRatings();
    this.copyButton.textContent = 'Скопировать в буфер';
    this.copyButton.classList.remove('feedback-screen__btn--copied');
  }

  resetRatings() {
    this.ratings = createDefaultRatings();
    for (const { key, range, valueEl } of this.scaleInputs) {
      range.value = String(DEFAULT_RATING);
      valueEl.textContent = DEFAULT_RATING.toFixed(2);
      this.ratings[key] = DEFAULT_RATING;
    }
  }

  async copyToClipboard() {
    if (!this.runData) return;

    const json = buildFeedbackJson({
      run: this.runData,
      ratings: this.ratings,
      comment: this.commentInput.value
    });

    const text = JSON.stringify(json, null, 2);

    try {
      await navigator.clipboard.writeText(text);
      this.copyButton.textContent = 'Скопировано';
      this.copyButton.classList.add('feedback-screen__btn--copied');
      window.setTimeout(() => {
        if (this.runData) {
          this.copyButton.textContent = 'Скопировать в буфер';
          this.copyButton.classList.remove('feedback-screen__btn--copied');
        }
      }, 2000);
    } catch {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.style.position = 'fixed';
      textarea.style.left = '-9999px';
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      this.copyButton.textContent = 'Скопировано';
      this.copyButton.classList.add('feedback-screen__btn--copied');
    }
  }
}
