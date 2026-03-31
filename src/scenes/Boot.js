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
      polar: { idle: 8, hurt: 6, dead: 10, run: 10 },
      teddy: { idle: 8, hurt: 6, dead: 10, run: 10 },
    };
    for (const [char, anims] of Object.entries(sprites)) {
      for (const [anim, count] of Object.entries(anims)) {
        for (let i = 0; i < count; i++) {
          this.load.image(`${char}_${anim}_${i}`, `sprites/${char}/${anim}/${i}.png`);
        }
      }
    }

    // Bug image assets
    this.load.image('bug_ant_img', 'sprites/bugs/ant.png');
    this.load.image('bug_beetle_img', 'sprites/bugs/beetle.png');
    this.load.image('bug_mosquito_img', 'sprites/bugs/mosquito.png');
    this.load.image('bug_bee_img', 'sprites/bugs/bee.png');
    this.load.image('bug_spider_img', 'sprites/bugs/spider.png');
  }

  create() {
    // Create animations for both characters
    const animDefs = [
      { key: 'idle', count: 8, rate: 8, repeat: -1 },
      { key: 'run', count: 10, rate: 14, repeat: -1 },
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

    // --- Ant (upgraded, 64x64) ---
    const antG = this.add.graphics();
    // Shadow
    antG.fillStyle(0x000000, 0.15);
    antG.fillEllipse(32, 56, 40, 8);
    // Abdomen
    antG.fillStyle(0x8B2500);
    antG.fillEllipse(14, 32, 22, 18);
    antG.fillStyle(0xA03000, 0.4);
    antG.fillEllipse(11, 29, 10, 8); // shine
    // Thorax (waist)
    antG.fillStyle(0x7A2000);
    antG.fillEllipse(30, 32, 12, 10);
    // Head
    antG.fillStyle(0x8B2500);
    antG.fillCircle(44, 32, 10);
    // Eyes (big, cute)
    antG.fillStyle(0xFFFFFF);
    antG.fillCircle(48, 29, 5);
    antG.fillCircle(48, 35, 5);
    antG.fillStyle(0x000000);
    antG.fillCircle(50, 29, 2.5);
    antG.fillCircle(50, 35, 2.5);
    antG.fillStyle(0xFFFFFF);
    antG.fillCircle(51, 28, 1);
    antG.fillCircle(51, 34, 1);
    // Mandibles
    antG.lineStyle(2.5, 0x5C1800);
    antG.lineBetween(53, 28, 60, 22);
    antG.lineBetween(53, 36, 60, 42);
    // Antennae (curved)
    antG.lineStyle(1.5, 0x6B2000);
    antG.lineBetween(48, 22, 52, 12);
    antG.lineBetween(52, 12, 58, 8);
    antG.fillCircle(58, 8, 2);
    antG.lineBetween(48, 22, 50, 14);
    antG.lineBetween(50, 14, 56, 12);
    antG.fillCircle(56, 12, 2);
    // Legs (6, thicker)
    antG.lineStyle(2.5, 0x6B2000);
    antG.lineBetween(34, 26, 38, 14); antG.lineBetween(38, 14, 44, 10);
    antG.lineBetween(28, 26, 28, 16); antG.lineBetween(28, 16, 34, 10);
    antG.lineBetween(22, 26, 18, 16); antG.lineBetween(18, 16, 22, 8);
    antG.lineBetween(34, 38, 38, 50); antG.lineBetween(38, 50, 44, 54);
    antG.lineBetween(28, 38, 28, 48); antG.lineBetween(28, 48, 34, 52);
    antG.lineBetween(22, 38, 18, 48); antG.lineBetween(18, 48, 22, 54);
    antG.generateTexture('bug_ant', 64, 64);
    antG.destroy();

    // --- Beetle (upgraded, 64x64) ---
    const beetleG = this.add.graphics();
    beetleG.fillStyle(0x000000, 0.15);
    beetleG.fillEllipse(32, 56, 44, 8);
    // Shell
    beetleG.fillStyle(0x1B7A40);
    beetleG.fillEllipse(28, 32, 44, 38);
    // Shell gradient
    beetleG.fillStyle(0x2E9B57, 0.6);
    beetleG.fillEllipse(24, 26, 24, 18);
    // Shell line
    beetleG.lineStyle(2, 0x0F5A28);
    beetleG.lineBetween(28, 13, 28, 51);
    // Shell pattern
    beetleG.fillStyle(0x0F5A28, 0.5);
    beetleG.fillCircle(18, 24, 4);
    beetleG.fillCircle(38, 24, 4);
    beetleG.fillCircle(18, 36, 3.5);
    beetleG.fillCircle(38, 36, 3.5);
    beetleG.fillCircle(28, 28, 3);
    // Head
    beetleG.fillStyle(0x155A30);
    beetleG.fillCircle(52, 32, 9);
    // Eyes
    beetleG.fillStyle(0xFFFFFF);
    beetleG.fillCircle(56, 29, 4);
    beetleG.fillCircle(56, 35, 4);
    beetleG.fillStyle(0x000000);
    beetleG.fillCircle(57, 29, 2);
    beetleG.fillCircle(57, 35, 2);
    // Mandibles
    beetleG.lineStyle(3, 0x0A3A18);
    beetleG.lineBetween(59, 27, 64, 22);
    beetleG.lineBetween(59, 37, 64, 42);
    // Legs
    beetleG.lineStyle(2.5, 0x1A5A2A);
    beetleG.lineBetween(38, 16, 44, 6);
    beetleG.lineBetween(28, 14, 30, 4);
    beetleG.lineBetween(18, 16, 12, 6);
    beetleG.lineBetween(38, 48, 44, 58);
    beetleG.lineBetween(28, 50, 30, 60);
    beetleG.lineBetween(18, 48, 12, 58);
    beetleG.generateTexture('bug_beetle', 64, 64);
    beetleG.destroy();

    // --- Mosquito (upgraded, 64x56) ---
    const mosqG = this.add.graphics();
    mosqG.fillStyle(0x000000, 0.1);
    mosqG.fillEllipse(32, 50, 30, 6);
    // Wings (large, transparent)
    mosqG.fillStyle(0xCCDDEE, 0.35);
    mosqG.fillEllipse(24, 8, 30, 16);
    mosqG.fillEllipse(24, 48, 30, 16);
    mosqG.lineStyle(0.5, 0x8899AA, 0.3);
    mosqG.lineBetween(12, 8, 38, 5);
    mosqG.lineBetween(12, 48, 38, 51);
    mosqG.lineBetween(18, 6, 32, 12);
    mosqG.lineBetween(18, 50, 32, 44);
    // Body
    mosqG.fillStyle(0x555555);
    mosqG.fillEllipse(26, 28, 22, 12);
    // Abdomen (blood-filled)
    mosqG.fillStyle(0x993333);
    mosqG.fillEllipse(12, 28, 18, 16);
    mosqG.fillStyle(0xBB4444, 0.4);
    mosqG.fillEllipse(10, 25, 8, 8);
    // Head
    mosqG.fillStyle(0x444444);
    mosqG.fillCircle(40, 28, 7);
    // Proboscis
    mosqG.lineStyle(2, 0x333333);
    mosqG.lineBetween(47, 28, 62, 28);
    mosqG.lineStyle(1, 0x222222);
    mosqG.lineBetween(62, 28, 64, 27);
    mosqG.lineBetween(62, 28, 64, 29);
    // Eyes (big red compound)
    mosqG.fillStyle(0xDD2222);
    mosqG.fillCircle(43, 25, 4);
    mosqG.fillCircle(43, 31, 4);
    mosqG.fillStyle(0xFF4444, 0.5);
    mosqG.fillCircle(42, 24, 2);
    mosqG.fillCircle(42, 30, 2);
    // Legs (thin, dangling)
    mosqG.lineStyle(1, 0x444444);
    mosqG.lineBetween(30, 34, 36, 48);
    mosqG.lineBetween(26, 34, 26, 50);
    mosqG.lineBetween(22, 34, 16, 48);
    mosqG.lineBetween(34, 34, 40, 46);
    mosqG.lineBetween(18, 34, 10, 46);
    mosqG.lineBetween(30, 22, 36, 10);
    mosqG.generateTexture('bug_mosquito', 64, 56);
    mosqG.destroy();

    // --- Bee (upgraded, 64x56) ---
    const beeG = this.add.graphics();
    beeG.fillStyle(0x000000, 0.15);
    beeG.fillEllipse(32, 50, 36, 6);
    // Wings
    beeG.fillStyle(0xFFFFFF, 0.45);
    beeG.fillEllipse(34, 6, 28, 14);
    beeG.fillEllipse(34, 50, 28, 14);
    beeG.lineStyle(0.5, 0xDDCC88, 0.3);
    beeG.lineBetween(22, 6, 46, 3);
    beeG.lineBetween(22, 50, 46, 53);
    // Abdomen
    beeG.fillStyle(0xFFCC00);
    beeG.fillEllipse(18, 28, 30, 26);
    // Stripes
    beeG.fillStyle(0x1A1A00);
    beeG.fillRect(6, 20, 24, 5);
    beeG.fillRect(6, 30, 24, 5);
    beeG.fillRect(8, 40, 18, 4);
    // Fuzz
    beeG.fillStyle(0xFFDD44, 0.35);
    beeG.fillEllipse(18, 26, 24, 18);
    // Thorax
    beeG.fillStyle(0xDDAA00);
    beeG.fillCircle(36, 28, 10);
    // Head
    beeG.fillStyle(0xCC9900);
    beeG.fillCircle(48, 28, 8);
    // Eyes
    beeG.fillStyle(0x000000);
    beeG.fillCircle(52, 25, 3.5);
    beeG.fillCircle(52, 31, 3.5);
    beeG.fillStyle(0x333300);
    beeG.fillCircle(53, 24, 1.5);
    beeG.fillCircle(53, 30, 1.5);
    // Antennae
    beeG.lineStyle(1.5, 0x886600);
    beeG.lineBetween(52, 20, 58, 12);
    beeG.fillCircle(58, 12, 2);
    beeG.lineBetween(52, 20, 56, 14);
    beeG.fillCircle(56, 14, 1.5);
    // Stinger
    beeG.fillStyle(0x1A1A00);
    beeG.fillTriangle(3, 28, 0, 24, 0, 32);
    beeG.generateTexture('bug_bee', 64, 56);
    beeG.destroy();

    // --- Spider (boss, upgraded, 96x96) ---
    const spiderG = this.add.graphics();
    spiderG.fillStyle(0x000000, 0.15);
    spiderG.fillEllipse(48, 86, 60, 10);
    // Abdomen
    spiderG.fillStyle(0x1A1A1A);
    spiderG.fillCircle(36, 54, 30);
    // Hourglass pattern
    spiderG.fillStyle(0xDD0000);
    spiderG.fillTriangle(36, 34, 26, 54, 46, 54);
    spiderG.fillTriangle(36, 74, 26, 54, 46, 54);
    // Abdomen texture
    spiderG.fillStyle(0x2A2A2A, 0.4);
    spiderG.fillEllipse(28, 46, 16, 12);
    spiderG.fillStyle(0x333333, 0.3);
    spiderG.fillEllipse(44, 62, 12, 10);
    // Cephalothorax
    spiderG.fillStyle(0x222222);
    spiderG.fillEllipse(62, 50, 26, 22);
    // Legs (8, thick)
    spiderG.lineStyle(4, 0x111111);
    spiderG.lineBetween(50, 42, 38, 20); spiderG.lineBetween(38, 20, 24, 4);
    spiderG.lineBetween(48, 46, 34, 28); spiderG.lineBetween(34, 28, 16, 12);
    spiderG.lineBetween(48, 58, 34, 68); spiderG.lineBetween(34, 68, 16, 82);
    spiderG.lineBetween(50, 62, 38, 76); spiderG.lineBetween(38, 76, 24, 92);
    spiderG.lineBetween(72, 42, 82, 20); spiderG.lineBetween(82, 20, 94, 4);
    spiderG.lineBetween(74, 46, 86, 28); spiderG.lineBetween(86, 28, 96, 12);
    spiderG.lineBetween(74, 58, 86, 68); spiderG.lineBetween(86, 68, 96, 82);
    spiderG.lineBetween(72, 62, 82, 76); spiderG.lineBetween(82, 76, 94, 92);
    // Leg joints
    spiderG.fillStyle(0x1A1A1A);
    [{ x: 38, y: 20 }, { x: 34, y: 28 }, { x: 34, y: 68 }, { x: 38, y: 76 },
     { x: 82, y: 20 }, { x: 86, y: 28 }, { x: 86, y: 68 }, { x: 82, y: 76 }]
      .forEach(j => spiderG.fillCircle(j.x, j.y, 3));
    // Fangs
    spiderG.fillStyle(0x660000);
    spiderG.fillTriangle(70, 40, 78, 34, 76, 44);
    spiderG.fillTriangle(70, 60, 78, 56, 76, 66);
    // Eyes (8, menacing)
    spiderG.fillStyle(0xFF0000);
    spiderG.fillCircle(64, 44, 4);
    spiderG.fillCircle(64, 56, 4);
    spiderG.fillStyle(0xFF3333);
    spiderG.fillCircle(68, 41, 3);
    spiderG.fillCircle(68, 59, 3);
    spiderG.fillStyle(0xCC0000);
    spiderG.fillCircle(60, 42, 2.5);
    spiderG.fillCircle(60, 58, 2.5);
    spiderG.fillCircle(66, 48, 2);
    spiderG.fillCircle(66, 52, 2);
    // Eye shine
    spiderG.fillStyle(0xFFFFFF, 0.3);
    spiderG.fillCircle(63, 43, 1.5);
    spiderG.fillCircle(63, 55, 1.5);
    spiderG.generateTexture('bug_spider', 96, 96);
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
