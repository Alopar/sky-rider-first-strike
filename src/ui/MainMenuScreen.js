const ASSETS = {
  bg: 'assets/svg/ui/menu_background.svg',
  frame: 'assets/svg/ui/menu_frame.svg',
  logo: 'assets/svg/ui/menu_logo.svg',
  buttonIdle: 'assets/svg/ui/button_play_idle.svg',
  buttonFocus: 'assets/svg/ui/button_play_focus.svg'
};

function ensureMainMenuStyles() {
  if (document.getElementById('ui-main-menu-styles')) return;
  const link = document.createElement('link');
  link.id = 'ui-main-menu-styles';
  link.rel = 'stylesheet';
  link.href = 'styles/ui-main-menu.css';
  document.head.appendChild(link);
}

export class MainMenuScreen {
  /**
   * @param {string} containerId
   * @param {() => void} onPlay
   */
  constructor(containerId, onPlay) {
    ensureMainMenuStyles();

    this.onPlay = onPlay;
    this.container = document.getElementById(containerId);
    if (!this.container) {
      throw new Error(`MainMenuScreen: container #${containerId} not found`);
    }

    this._visible = false;
    this.buildDOM();
    this.setupListeners();
  }

  buildDOM() {
    this.root = document.createElement('div');
    this.root.className = 'main-menu';
    this.root.setAttribute('role', 'dialog');
    this.root.setAttribute('aria-label', 'Главное меню');
    this.root.setAttribute('aria-hidden', 'true');

    this.bgImg = document.createElement('img');
    this.bgImg.className = 'main-menu__bg';
    this.bgImg.src = ASSETS.bg;
    this.bgImg.alt = '';
    this.bgImg.setAttribute('aria-hidden', 'true');

    this.frameImg = document.createElement('img');
    this.frameImg.className = 'main-menu__frame';
    this.frameImg.src = ASSETS.frame;
    this.frameImg.alt = '';
    this.frameImg.setAttribute('aria-hidden', 'true');

    const content = document.createElement('div');
    content.className = 'main-menu__content';

    this.logoImg = document.createElement('img');
    this.logoImg.className = 'main-menu__logo';
    this.logoImg.src = ASSETS.logo;
    this.logoImg.alt = 'Sky Rider First Strike';

    const playWrap = document.createElement('div');
    playWrap.className = 'main-menu__play-wrap';

    this.playButton = document.createElement('button');
    this.playButton.type = 'button';
    this.playButton.className = 'main-menu__play';
    this.playButton.setAttribute('aria-label', 'Играть');

    this.playImg = document.createElement('img');
    this.playImg.src = ASSETS.buttonIdle;
    this.playImg.alt = '';
    this.playImg.setAttribute('aria-hidden', 'true');

    this.playButton.appendChild(this.playImg);
    playWrap.appendChild(this.playButton);

    content.appendChild(this.logoImg);
    content.appendChild(playWrap);

    this.root.appendChild(this.bgImg);
    this.root.appendChild(this.frameImg);
    this.root.appendChild(content);

    this.container.appendChild(this.root);
  }

  setupListeners() {
    this.playButton.addEventListener('click', () => this.handlePlay());

    this.playButton.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        this.handlePlay();
      }
    });

    const setFocusArt = () => {
      this.playImg.src = ASSETS.buttonFocus;
    };
    const setIdleArt = () => {
      this.playImg.src = ASSETS.buttonIdle;
    };

    this.playButton.addEventListener('mouseenter', setFocusArt);
    this.playButton.addEventListener('mouseleave', setIdleArt);
    this.playButton.addEventListener('focus', setFocusArt);
    this.playButton.addEventListener('blur', setIdleArt);
  }

  handlePlay() {
    if (!this._visible) return;
    this.hide();
    this.onPlay?.();
  }

  show() {
    this._visible = true;
    this.root.classList.add('main-menu--visible');
    this.root.setAttribute('aria-hidden', 'false');
    this.playImg.src = ASSETS.buttonIdle;
    requestAnimationFrame(() => this.playButton.focus());
  }

  hide() {
    this._visible = false;
    this.root.classList.remove('main-menu--visible');
    this.root.setAttribute('aria-hidden', 'true');
    this.playButton.blur();
    this.playImg.src = ASSETS.buttonIdle;
  }
}
