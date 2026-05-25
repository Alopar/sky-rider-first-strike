import { EventBus } from '../systems/EventBus.js';
import { EVT } from '../systems/events.js';
import { gameConfig } from '../config/game-config.js';
import { level01 } from '../config/levels/level-01.js';

const MAX_LIVES = gameConfig.player.maxHp;
const MAX_WEAPON_LEVEL = 5;
const LIFE_ICON = '\u2708\uFE0F';

function formatElapsedMs(ms) {
  const totalSec = Math.max(0, Math.floor(ms / 1000));
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

function ensureHudStyles() {
  if (document.getElementById('ui-overlay-styles')) return;
  const link = document.createElement('link');
  link.id = 'ui-overlay-styles';
  link.rel = 'stylesheet';
  link.href = 'styles/ui-overlay.css';
  document.head.appendChild(link);
}

function buildStackedPanel(className, labelText) {
  const panel = document.createElement('div');
  panel.className = `hud-panel ${className}`;
  const label = document.createElement('span');
  label.className = 'hud-label';
  label.textContent = labelText;
  const value = document.createElement('div');
  panel.appendChild(label);
  panel.appendChild(value);
  return { panel, label, value };
}

export class UIOverlay {
  constructor(containerId) {
    ensureHudStyles();

    this.container = document.getElementById(containerId);
    if (!this.container) {
      this.container = document.createElement('div');
      this.container.id = containerId;
      document.body.appendChild(this.container);
    }

    const w = gameConfig.width;
    const h = gameConfig.height;

    this.container.style.position = 'absolute';
    this.container.style.top = '0';
    this.container.style.left = '0';
    this.container.style.width = `${w}px`;
    this.container.style.height = `${h}px`;
    this.container.style.pointerEvents = 'none';
    this.container.style.boxSizing = 'border-box';

    this.buildHUD();
    this.setupListeners();
  }

  buildHUD() {
    this.container.innerHTML = '';

    this.hudElement = document.createElement('div');
    this.hudElement.className = 'hud-bar';

    const scoreBlock = buildStackedPanel('hud-panel--score', 'Score');
    this.scoreElement = document.createElement('span');
    this.scoreElement.className = 'hud-value';
    this.scoreElement.textContent = '0';
    scoreBlock.value.appendChild(this.scoreElement);

    const timerBlock = buildStackedPanel('hud-panel--timer', 'Time');
    this.timerElement = document.createElement('span');
    this.timerElement.className = 'hud-value hud-value--timer';
    this.timerElement.textContent = '0:00';
    timerBlock.value.appendChild(this.timerElement);

    const livesBlock = buildStackedPanel('hud-panel--lives', 'Lives');
    this.livesContainer = document.createElement('div');
    this.livesContainer.className = 'hud-lives';
    this.lifeIcons = [];
    for (let i = 0; i < MAX_LIVES; i++) {
      const icon = document.createElement('span');
      icon.className = 'hud-life hud-life--active';
      icon.textContent = LIFE_ICON;
      icon.setAttribute('role', 'img');
      icon.setAttribute('aria-label', `Life ${i + 1}`);
      this.lifeIcons.push(icon);
      this.livesContainer.appendChild(icon);
    }
    livesBlock.value.appendChild(this.livesContainer);

    const weaponBlock = buildStackedPanel('hud-panel--weapon', 'Weapon');
    this.weaponLevelContainer = document.createElement('div');
    this.weaponLevelContainer.className = 'hud-weapon-levels';
    this.weaponLevelDots = [];
    for (let i = 0; i < MAX_WEAPON_LEVEL; i++) {
      const dot = document.createElement('span');
      dot.className = 'hud-weapon-dot';
      dot.setAttribute('aria-hidden', 'true');
      this.weaponLevelDots.push(dot);
      this.weaponLevelContainer.appendChild(dot);
    }
    weaponBlock.value.appendChild(this.weaponLevelContainer);

    this.hudElement.appendChild(scoreBlock.panel);
    this.hudElement.appendChild(timerBlock.panel);
    this.hudElement.appendChild(weaponBlock.panel);
    this.hudElement.appendChild(livesBlock.panel);
    this.container.appendChild(this.hudElement);

    this._lastHp = MAX_LIVES;
    this.renderWeaponLevel(1);
    this.hudElement.style.display = 'none';
  }

  renderWeaponLevel(level) {
    const clamped = Math.max(1, Math.min(MAX_WEAPON_LEVEL, level));
    this.weaponLevelDots.forEach((dot, index) => {
      dot.classList.toggle('hud-weapon-dot--active', index < clamped);
    });
  }

  renderLives(hp) {
    const clamped = Math.max(0, Math.min(MAX_LIVES, hp));
    const justLost = clamped < this._lastHp;

    this.lifeIcons.forEach((icon, index) => {
      const alive = index < clamped;
      const wasActive = icon.classList.contains('hud-life--active');

      icon.classList.toggle('hud-life--active', alive);
      icon.classList.toggle('hud-life--lost', !alive);

      if (justLost && wasActive && !alive) {
        icon.classList.remove('hud-life--hit');
        void icon.offsetWidth;
        icon.classList.add('hud-life--hit');
        icon.addEventListener(
          'animationend',
          () => icon.classList.remove('hud-life--hit'),
          { once: true }
        );
      }
    });

    this._lastHp = clamped;
  }

  setupListeners() {
    EventBus.on(EVT.SCORE_CHANGED, (score) => {
      this.scoreElement.textContent = String(score);
    });

    EventBus.on(EVT.LEVEL_TIME_CHANGED, (elapsedMs) => {
      this.timerElement.textContent = formatElapsedMs(elapsedMs);
    });

    EventBus.on(EVT.HP_CHANGED, (hp) => {
      this.renderLives(hp);
    });

    EventBus.on(EVT.WEAPON_LEVEL_CHANGED, (level) => {
      this.renderWeaponLevel(level);
    });

    EventBus.on(EVT.RUN_ENDED, () => {
      this.hudElement.style.display = 'none';
    });

    EventBus.on(EVT.LEVEL_COMPLETE, () => {
      this.timerElement.textContent = formatElapsedMs(level01.duration);
    });

    EventBus.on(EVT.GAME_START, () => {
      this.scoreElement.textContent = '0';
      this.timerElement.textContent = '0:00';
      this.renderLives(MAX_LIVES);
      this.renderWeaponLevel(1);
      this.hudElement.style.display = '';
    });
  }
}
