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

    // --- Ant (detailed, 48x48) ---
    const antG = this.add.graphics();
    // Body segments (head, thorax, abdomen)
    antG.fillStyle(0x8B2500); // dark red-brown
    antG.fillCircle(36, 24, 8); // head
    antG.fillEllipse(24, 24, 14, 12); // thorax
    antG.fillEllipse(10, 24, 16, 14); // abdomen
    // Mandibles
    antG.lineStyle(2, 0x5C1800);
    antG.lineBetween(42, 20, 47, 16);
    antG.lineBetween(42, 28, 47, 32);
    // Antennae
    antG.lineStyle(1.5, 0x6B2000);
    antG.lineBetween(40, 18, 44, 8);
    antG.lineBetween(44, 8, 48, 6);
    antG.lineBetween(40, 18, 42, 10);
    antG.lineBetween(42, 10, 46, 10);
    // Legs (6 legs, jointed)
    antG.lineStyle(2, 0x6B2000);
    antG.lineBetween(28, 18, 30, 8); antG.lineBetween(30, 8, 34, 4);
    antG.lineBetween(24, 18, 24, 10); antG.lineBetween(24, 10, 28, 6);
    antG.lineBetween(20, 18, 18, 10); antG.lineBetween(18, 10, 20, 4);
    antG.lineBetween(28, 30, 30, 40); antG.lineBetween(30, 40, 34, 44);
    antG.lineBetween(24, 30, 24, 38); antG.lineBetween(24, 38, 28, 42);
    antG.lineBetween(20, 30, 18, 38); antG.lineBetween(18, 38, 20, 44);
    // Eyes
    antG.fillStyle(0xFFFFFF);
    antG.fillCircle(39, 21, 3);
    antG.fillStyle(0x000000);
    antG.fillCircle(40, 21, 1.5);
    // Shine on abdomen
    antG.fillStyle(0xA04020, 0.5);
    antG.fillEllipse(8, 22, 6, 5);
    antG.generateTexture('bug_ant', 48, 48);
    antG.destroy();

    // --- Beetle (detailed, 48x48) ---
    const beetleG = this.add.graphics();
    // Shell (elytra)
    beetleG.fillStyle(0x2E8B57); // sea green shell
    beetleG.fillEllipse(22, 24, 38, 32);
    // Shell shine
    beetleG.fillStyle(0x3CB371, 0.6);
    beetleG.fillEllipse(18, 18, 16, 12);
    // Shell line (center)
    beetleG.lineStyle(2, 0x1B6B3A);
    beetleG.lineBetween(22, 8, 22, 40);
    // Shell spots
    beetleG.fillStyle(0x1B5B30);
    beetleG.fillCircle(14, 20, 3);
    beetleG.fillCircle(30, 20, 3);
    beetleG.fillCircle(14, 30, 2.5);
    beetleG.fillCircle(30, 30, 2.5);
    // Head
    beetleG.fillStyle(0x205030);
    beetleG.fillCircle(40, 24, 7);
    // Mandibles
    beetleG.lineStyle(2, 0x153020);
    beetleG.lineBetween(45, 20, 48, 17);
    beetleG.lineBetween(45, 28, 48, 31);
    // Legs
    beetleG.lineStyle(2, 0x1A4A2A);
    beetleG.lineBetween(30, 12, 36, 4);
    beetleG.lineBetween(22, 10, 24, 2);
    beetleG.lineBetween(14, 12, 10, 4);
    beetleG.lineBetween(30, 36, 36, 44);
    beetleG.lineBetween(22, 38, 24, 46);
    beetleG.lineBetween(14, 36, 10, 44);
    // Eyes
    beetleG.fillStyle(0xFFFFFF);
    beetleG.fillCircle(43, 22, 2.5);
    beetleG.fillStyle(0x000000);
    beetleG.fillCircle(44, 22, 1.2);
    beetleG.generateTexture('bug_beetle', 48, 48);
    beetleG.destroy();

    // --- Mosquito (detailed, 48x40) ---
    const mosqG = this.add.graphics();
    // Body (thin, elongated)
    mosqG.fillStyle(0x555555);
    mosqG.fillEllipse(20, 22, 18, 10);
    // Abdomen (engorged, reddish)
    mosqG.fillStyle(0x884444);
    mosqG.fillEllipse(10, 22, 14, 12);
    // Head
    mosqG.fillStyle(0x444444);
    mosqG.fillCircle(32, 22, 5);
    // Proboscis (long needle)
    mosqG.lineStyle(1.5, 0x333333);
    mosqG.lineBetween(37, 22, 48, 22);
    // Wings (transparent, large)
    mosqG.fillStyle(0xCCDDEE, 0.4);
    mosqG.fillEllipse(18, 8, 22, 12);
    mosqG.fillEllipse(18, 36, 22, 12);
    // Wing veins
    mosqG.lineStyle(0.5, 0x8899AA, 0.3);
    mosqG.lineBetween(10, 8, 28, 6);
    mosqG.lineBetween(10, 36, 28, 38);
    // Legs (6, thin, dangling)
    mosqG.lineStyle(1, 0x444444);
    mosqG.lineBetween(24, 27, 28, 38);
    mosqG.lineBetween(20, 27, 20, 40);
    mosqG.lineBetween(16, 27, 12, 38);
    // Eyes (compound, red)
    mosqG.fillStyle(0xCC3333);
    mosqG.fillCircle(34, 20, 2.5);
    mosqG.fillCircle(34, 24, 2.5);
    mosqG.generateTexture('bug_mosquito', 48, 44);
    mosqG.destroy();

    // --- Bee (detailed, 48x40) ---
    const beeG = this.add.graphics();
    // Abdomen (fuzzy yellow-black stripes)
    beeG.fillStyle(0xFFCC00);
    beeG.fillEllipse(16, 22, 26, 22);
    // Stripes
    beeG.fillStyle(0x1A1A00);
    beeG.fillRect(6, 16, 20, 4);
    beeG.fillRect(6, 24, 20, 4);
    beeG.fillRect(6, 32, 16, 3);
    // Fuzz effect
    beeG.fillStyle(0xFFDD44, 0.4);
    beeG.fillEllipse(16, 20, 20, 14);
    // Thorax
    beeG.fillStyle(0xDDAA00);
    beeG.fillCircle(30, 22, 8);
    // Head
    beeG.fillStyle(0xCC9900);
    beeG.fillCircle(38, 22, 6);
    // Wings (iridescent)
    beeG.fillStyle(0xFFFFFF, 0.5);
    beeG.fillEllipse(28, 6, 20, 12);
    beeG.fillEllipse(28, 38, 20, 12);
    // Wing detail
    beeG.lineStyle(0.5, 0xCCBB88, 0.3);
    beeG.lineBetween(20, 6, 36, 4);
    beeG.lineBetween(20, 38, 36, 40);
    // Stinger
    beeG.fillStyle(0x1A1A00);
    beeG.fillTriangle(3, 22, 0, 19, 0, 25);
    // Eyes (compound)
    beeG.fillStyle(0x000000);
    beeG.fillCircle(41, 20, 2.5);
    beeG.fillCircle(41, 24, 2.5);
    // Antennae
    beeG.lineStyle(1, 0x886600);
    beeG.lineBetween(42, 17, 46, 10);
    beeG.lineBetween(42, 17, 48, 12);
    beeG.generateTexture('bug_bee', 48, 44);
    beeG.destroy();

    // --- Spider (boss, detailed, 80x80) ---
    const spiderG = this.add.graphics();
    // Abdomen (large, round)
    spiderG.fillStyle(0x1A1A1A);
    spiderG.fillCircle(30, 44, 26);
    // Abdomen pattern (hourglass)
    spiderG.fillStyle(0xCC0000);
    spiderG.fillTriangle(30, 28, 22, 44, 38, 44);
    spiderG.fillTriangle(30, 60, 22, 44, 38, 44);
    // Abdomen shine
    spiderG.fillStyle(0x2A2A2A, 0.5);
    spiderG.fillEllipse(24, 38, 14, 10);
    // Cephalothorax
    spiderG.fillStyle(0x222222);
    spiderG.fillEllipse(50, 40, 22, 18);
    // Legs (8 legs, jointed, spread wide)
    spiderG.lineStyle(3, 0x111111);
    // Left legs
    spiderG.lineBetween(42, 34, 32, 16); spiderG.lineBetween(32, 16, 20, 4);
    spiderG.lineBetween(40, 38, 28, 22); spiderG.lineBetween(28, 22, 14, 10);
    spiderG.lineBetween(40, 46, 28, 56); spiderG.lineBetween(28, 56, 14, 68);
    spiderG.lineBetween(42, 50, 32, 62); spiderG.lineBetween(32, 62, 20, 76);
    // Right legs
    spiderG.lineBetween(58, 34, 68, 16); spiderG.lineBetween(68, 16, 80, 4);
    spiderG.lineBetween(60, 38, 72, 22); spiderG.lineBetween(72, 22, 80, 10);
    spiderG.lineBetween(60, 46, 72, 56); spiderG.lineBetween(72, 56, 80, 68);
    spiderG.lineBetween(58, 50, 68, 62); spiderG.lineBetween(68, 62, 80, 76);
    // Fangs (chelicerae)
    spiderG.fillStyle(0x440000);
    spiderG.fillTriangle(56, 32, 62, 28, 60, 36);
    spiderG.fillTriangle(56, 48, 62, 44, 60, 52);
    // Eyes (8 eyes in 2 rows)
    spiderG.fillStyle(0xFF0000);
    spiderG.fillCircle(52, 36, 3);
    spiderG.fillCircle(52, 44, 3);
    spiderG.fillStyle(0xFF3333);
    spiderG.fillCircle(56, 33, 2);
    spiderG.fillCircle(56, 47, 2);
    spiderG.fillStyle(0xCC0000);
    spiderG.fillCircle(48, 34, 2);
    spiderG.fillCircle(48, 46, 2);
    spiderG.fillCircle(54, 38, 1.5);
    spiderG.fillCircle(54, 42, 1.5);
    // Pedipalps
    spiderG.lineStyle(2, 0x1A1A1A);
    spiderG.lineBetween(58, 36, 64, 32);
    spiderG.lineBetween(58, 44, 64, 48);
    spiderG.generateTexture('bug_spider', 80, 80);
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
