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

  isLeft() { return this.keys.left.isDown || this.keys.a.isDown; }
  isRight() { return this.keys.right.isDown || this.keys.d.isDown; }
  isUp() { return this.keys.up.isDown || this.keys.w.isDown; }
  isDown() { return this.keys.down.isDown || this.keys.s.isDown; }
  isFiring() { return this.keys.space.isDown || this.keys.j.isDown; }
  isPausePressed() { return Phaser.Input.Keyboard.JustDown(this.keys.esc) || Phaser.Input.Keyboard.JustDown(this.keys.p); }
}
