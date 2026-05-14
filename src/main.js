class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: "BootScene" });
  }

  create() {
    this.cameras.main.setBackgroundColor(0x1a1a2e);
  }
}

const config = {
  type: Phaser.AUTO,
  width: 960,
  height: 540,
  parent: "game",
  scene: [BootScene],
};

new Phaser.Game(config);
