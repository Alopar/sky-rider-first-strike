export class LayerManager {
  constructor(scene) {
    this.scene = scene;
    
    // Depth ranges as per docs:
    // 0-99: Parallax
    // 100-199: bgEnemies
    // 175-199: debrisEnemies
    // 200-299: playerBullets
    // 300-399: fgEnemies, enemyBullets
    // 400-449: Player
    // 450-499: Effects

    this.groups = {
      playerBullets: scene.physics.add.group(),
      enemyBullets: scene.physics.add.group(),
      bgEnemies: scene.physics.add.group(),
      debrisEnemies: scene.physics.add.group(),
      fgEnemies: scene.physics.add.group(),
      powerUps: scene.physics.add.group()
    };
  }

  getGroup(name) {
    return this.groups[name];
  }
}
