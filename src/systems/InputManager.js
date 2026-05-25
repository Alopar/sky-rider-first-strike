const GAME_CAPTURE_KEY_CODES = [
  Phaser.Input.Keyboard.KeyCodes.UP,
  Phaser.Input.Keyboard.KeyCodes.DOWN,
  Phaser.Input.Keyboard.KeyCodes.LEFT,
  Phaser.Input.Keyboard.KeyCodes.RIGHT,
  Phaser.Input.Keyboard.KeyCodes.W,
  Phaser.Input.Keyboard.KeyCodes.A,
  Phaser.Input.Keyboard.KeyCodes.S,
  Phaser.Input.Keyboard.KeyCodes.D,
  Phaser.Input.Keyboard.KeyCodes.SPACE,
  Phaser.Input.Keyboard.KeyCodes.J,
  Phaser.Input.Keyboard.KeyCodes.ESC,
  Phaser.Input.Keyboard.KeyCodes.P
];

export class InputManager {
  constructor(scene) {
    this.scene = scene;
    const kb = scene.input.keyboard;
    this.keys = {
      up: kb.addKey(Phaser.Input.Keyboard.KeyCodes.UP),
      down: kb.addKey(Phaser.Input.Keyboard.KeyCodes.DOWN),
      left: kb.addKey(Phaser.Input.Keyboard.KeyCodes.LEFT),
      right: kb.addKey(Phaser.Input.Keyboard.KeyCodes.RIGHT),
      w: kb.addKey(Phaser.Input.Keyboard.KeyCodes.W),
      a: kb.addKey(Phaser.Input.Keyboard.KeyCodes.A),
      s: kb.addKey(Phaser.Input.Keyboard.KeyCodes.S),
      d: kb.addKey(Phaser.Input.Keyboard.KeyCodes.D),
      space: kb.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE),
      j: kb.addKey(Phaser.Input.Keyboard.KeyCodes.J),
      esc: kb.addKey(Phaser.Input.Keyboard.KeyCodes.ESC),
      p: kb.addKey(Phaser.Input.Keyboard.KeyCodes.P)
    };
  }

  /** Отключить перехват клавиш (экран feedback, пауза и т.п.) */
  setEnabled(enabled) {
    const kb = this.scene.input?.keyboard;
    if (!kb) return;

    kb.enabled = enabled;

    if (enabled) {
      kb.addCapture(GAME_CAPTURE_KEY_CODES);
      this.scene.game.canvas?.focus();
    } else {
      kb.resetKeys();
      kb.clearCaptures();
      this.scene.game.canvas?.blur();
    }
  }

  isLeft() { return this.keys.left.isDown || this.keys.a.isDown; }
  isRight() { return this.keys.right.isDown || this.keys.d.isDown; }
  isUp() { return this.keys.up.isDown || this.keys.w.isDown; }
  isDown() { return this.keys.down.isDown || this.keys.s.isDown; }
  isFiring() { return this.keys.space.isDown || this.keys.j.isDown; }
  isPausePressed() { return Phaser.Input.Keyboard.JustDown(this.keys.esc) || Phaser.Input.Keyboard.JustDown(this.keys.p); }
}
