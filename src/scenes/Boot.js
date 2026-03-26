import Phaser from 'phaser';

export default class Boot extends Phaser.Scene {
  constructor() {
    super('Boot');
  }

  preload() {
    const W = this.cameras.main.width;
    const H = this.cameras.main.height;
    const barW = 400, barH = 30;
    const barX = (W - barW) / 2, barY = H / 2;
    const bg = this.add.graphics();
    bg.fillStyle(0x333333, 1);
    bg.fillRect(barX, barY, barW, barH);
    const fill = this.add.graphics();
    const loadText = this.add.text(W / 2, barY - 40, 'Loading...', {
      fontSize: '28px', color: '#ffffff', fontFamily: 'Arial',
    }).setOrigin(0.5);

    this.load.on('progress', (v) => {
      fill.clear();
      fill.fillStyle(0x4ade80, 1);
      fill.fillRect(barX + 4, barY + 4, (barW - 8) * v, barH - 8);
    });
    this.load.on('complete', () => {
      bg.destroy(); fill.destroy(); loadText.destroy();
    });

    // Load sprite frames (same as runner)
    const base = import.meta.env.BASE_URL || '/';
    this.load.setBaseURL(window.location.origin);
    this.load.setPath(base);

    const sprites = {
      polar: { idle: 8, hurt: 6, dead: 10 },
      teddy: { idle: 8, hurt: 6, dead: 10 },
    };
    for (const [char, anims] of Object.entries(sprites)) {
      for (const [anim, count] of Object.entries(anims)) {
        for (let i = 0; i < count; i++) {
          this.load.image(`${char}_${anim}_${i}`, `sprites/${char}/${anim}/${i}.png`);
        }
      }
    }
  }

  create() {
    // Create animations for both characters
    const animDefs = [
      { key: 'idle', count: 8, rate: 8, repeat: -1 },
      { key: 'hurt', count: 6, rate: 10, repeat: 0 },
      { key: 'dead', count: 10, rate: 8, repeat: 0 },
    ];

    for (const char of ['polar', 'teddy']) {
      for (const def of animDefs) {
        const frames = [];
        for (let i = 0; i < def.count; i++) {
          frames.push({ key: `${char}_${def.key}_${i}` });
        }
        this.anims.create({
          key: `${char}_${def.key}`,
          frames,
          frameRate: def.rate,
          repeat: def.repeat,
        });
      }
    }

    // Create procedural textures for bugs, stones, fortifications
    this.createProceduralAssets();

    this.scene.start('MenuScene');
  }

  createProceduralAssets() {
    // --- Stones (projectile) ---
    const stoneG = this.add.graphics();
    stoneG.fillStyle(0x888888);
    stoneG.fillCircle(10, 10, 10);
    stoneG.fillStyle(0xaaaaaa);
    stoneG.fillCircle(8, 7, 5);
    stoneG.generateTexture('stone', 20, 20);
    stoneG.destroy();

    // --- Ant (green, small) ---
    const antG = this.add.graphics();
    antG.fillStyle(0x22aa44);
    antG.fillCircle(16, 16, 12);
    antG.fillStyle(0x118833);
    antG.fillCircle(16, 16, 8);
    // legs
    antG.lineStyle(2, 0x116622);
    antG.lineBetween(6, 10, 0, 4);
    antG.lineBetween(6, 16, 0, 16);
    antG.lineBetween(6, 22, 0, 28);
    antG.lineBetween(26, 10, 32, 4);
    antG.lineBetween(26, 16, 32, 16);
    antG.lineBetween(26, 22, 32, 28);
    // eyes
    antG.fillStyle(0xffffff);
    antG.fillCircle(20, 13, 3);
    antG.fillStyle(0x000000);
    antG.fillCircle(21, 13, 1.5);
    antG.generateTexture('bug_ant', 32, 32);
    antG.destroy();

    // --- Beetle (brown, medium) ---
    const beetleG = this.add.graphics();
    beetleG.fillStyle(0x8B4513);
    beetleG.fillEllipse(20, 20, 36, 30);
    beetleG.fillStyle(0xa0522d);
    beetleG.fillEllipse(20, 18, 28, 22);
    // shell line
    beetleG.lineStyle(2, 0x654321);
    beetleG.lineBetween(20, 6, 20, 34);
    // eyes
    beetleG.fillStyle(0xffffff);
    beetleG.fillCircle(26, 14, 3);
    beetleG.fillStyle(0x000000);
    beetleG.fillCircle(27, 14, 1.5);
    // armor shine
    beetleG.fillStyle(0xcd853f, 0.4);
    beetleG.fillEllipse(14, 14, 10, 8);
    beetleG.generateTexture('bug_beetle', 40, 40);
    beetleG.destroy();

    // --- Mosquito (gray, small) ---
    const mosqG = this.add.graphics();
    mosqG.fillStyle(0x888888);
    mosqG.fillCircle(16, 18, 8);
    mosqG.fillStyle(0xaaaaaa);
    mosqG.fillCircle(16, 18, 5);
    // wings
    mosqG.fillStyle(0xcccccc, 0.5);
    mosqG.fillEllipse(8, 10, 14, 8);
    mosqG.fillEllipse(24, 10, 14, 8);
    // proboscis
    mosqG.lineStyle(2, 0x666666);
    mosqG.lineBetween(22, 18, 32, 18);
    mosqG.generateTexture('bug_mosquito', 34, 28);
    mosqG.destroy();

    // --- Bee (yellow) ---
    const beeG = this.add.graphics();
    beeG.fillStyle(0xFFD700);
    beeG.fillEllipse(20, 20, 32, 26);
    // stripes
    beeG.fillStyle(0x222222);
    beeG.fillRect(10, 16, 20, 3);
    beeG.fillRect(10, 22, 20, 3);
    // wings
    beeG.fillStyle(0xffffff, 0.6);
    beeG.fillEllipse(10, 8, 16, 10);
    beeG.fillEllipse(30, 8, 16, 10);
    // eye
    beeG.fillStyle(0x000000);
    beeG.fillCircle(26, 17, 2);
    // stinger
    beeG.fillStyle(0x222222);
    beeG.fillTriangle(4, 20, 0, 17, 0, 23);
    beeG.generateTexture('bug_bee', 40, 32);
    beeG.destroy();

    // --- Spider (boss, black, large) ---
    const spiderG = this.add.graphics();
    spiderG.fillStyle(0x222222);
    spiderG.fillCircle(30, 30, 22);
    spiderG.fillStyle(0x333333);
    spiderG.fillCircle(30, 28, 16);
    // red marking
    spiderG.fillStyle(0xff0000);
    spiderG.fillCircle(30, 26, 5);
    // legs
    spiderG.lineStyle(3, 0x111111);
    for (let i = 0; i < 4; i++) {
      const ly = 18 + i * 8;
      spiderG.lineBetween(12, ly, 0, ly - 6);
      spiderG.lineBetween(48, ly, 60, ly - 6);
    }
    // eyes (8 eyes)
    spiderG.fillStyle(0xff0000);
    spiderG.fillCircle(24, 22, 3);
    spiderG.fillCircle(36, 22, 3);
    spiderG.fillStyle(0xff4444);
    spiderG.fillCircle(22, 18, 2);
    spiderG.fillCircle(38, 18, 2);
    spiderG.generateTexture('bug_spider', 60, 60);
    spiderG.destroy();

    // --- Stone Wall fortification ---
    const wallG = this.add.graphics();
    wallG.fillStyle(0x666666);
    wallG.fillRoundedRect(0, 0, 40, 50, 4);
    wallG.fillStyle(0x888888);
    wallG.fillRoundedRect(2, 2, 36, 10, 2);
    wallG.fillRoundedRect(2, 14, 36, 10, 2);
    wallG.fillRoundedRect(2, 26, 36, 10, 2);
    wallG.fillRoundedRect(2, 38, 36, 10, 2);
    wallG.lineStyle(1, 0x555555);
    wallG.strokeRoundedRect(0, 0, 40, 50, 4);
    wallG.generateTexture('fort_wall', 40, 50);
    wallG.destroy();

    // --- Fire Trap fortification ---
    const fireG = this.add.graphics();
    fireG.fillStyle(0x444444);
    fireG.fillRoundedRect(0, 10, 40, 40, 4);
    // fire
    fireG.fillStyle(0xff4400);
    fireG.fillTriangle(20, 0, 8, 30, 32, 30);
    fireG.fillStyle(0xffaa00);
    fireG.fillTriangle(20, 8, 12, 28, 28, 28);
    fireG.fillStyle(0xffff00);
    fireG.fillTriangle(20, 14, 15, 26, 25, 26);
    fireG.generateTexture('fort_fire', 40, 50);
    fireG.destroy();

    // --- Ice Wall fortification ---
    const iceG = this.add.graphics();
    iceG.fillStyle(0x88ccff);
    iceG.fillRoundedRect(0, 0, 40, 50, 4);
    iceG.fillStyle(0xaaddff);
    iceG.fillRoundedRect(2, 2, 36, 46, 3);
    // ice crystals
    iceG.fillStyle(0xffffff, 0.6);
    iceG.fillTriangle(10, 5, 5, 20, 15, 20);
    iceG.fillTriangle(25, 8, 20, 22, 30, 22);
    iceG.fillTriangle(18, 25, 12, 42, 24, 42);
    iceG.lineStyle(1, 0x66aadd);
    iceG.strokeRoundedRect(0, 0, 40, 50, 4);
    iceG.generateTexture('fort_ice', 40, 50);
    iceG.destroy();

    // --- Heart icon ---
    const hG = this.add.graphics();
    hG.fillStyle(0xff4444);
    hG.fillTriangle(12, 0, 0, 16, 24, 16);
    hG.fillTriangle(0, 10, 12, 24, 24, 10);
    hG.generateTexture('heart', 24, 24);
    hG.destroy();
  }
}
