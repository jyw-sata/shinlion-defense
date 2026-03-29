import Phaser from 'phaser';

// Bug definitions
const BUG_TYPES = {
  ant:      { texture: 'bug_ant',      hp: 1, speed: 60,  reward: 10, scale: 2.5, name: '개미' },
  beetle:   { texture: 'bug_beetle',   hp: 2, speed: 45,  reward: 20, scale: 2.5, name: '딱정벌레' },
  mosquito: { texture: 'bug_mosquito', hp: 1, speed: 90,  reward: 15, scale: 2.5, name: '모기' },
  bee:      { texture: 'bug_bee',      hp: 2, speed: 80,  reward: 25, scale: 2.5, name: '벌' },
  spider:   { texture: 'bug_spider',   hp: 10, speed: 30, reward: 100, scale: 3.5, name: '거미' },
};

// Wave configurations
function getWaveConfig(waveNum) {
  const isBoss = waveNum % 5 === 0;
  const bugCount = Math.min(5 + Math.floor(waveNum * 1.5), 30);
  const types = [];

  if (waveNum <= 5) {
    types.push('ant');
  } else if (waveNum <= 10) {
    types.push('ant', 'beetle');
  } else if (waveNum <= 15) {
    types.push('ant', 'beetle', 'mosquito');
  } else {
    types.push('ant', 'beetle', 'mosquito', 'bee');
  }

  return { types, bugCount, isBoss };
}

// Fortification definitions
const FORT_TYPES = {
  wall: { texture: 'fort_wall', cost: 50, hp: 5, name: 'Stone Wall', color: 0x888888 },
  fire: { texture: 'fort_fire', cost: 100, hp: 999, name: 'Fire Trap', color: 0xff4400, damage: 3, interval: 250 },
  ice:  { texture: 'fort_ice',  cost: 75, hp: 999, name: 'Ice Wall', color: 0x88ccff, slowFactor: 0.4, duration: 3000 },
};

export default class GameScene extends Phaser.Scene {
  constructor() {
    super('GameScene');
  }

  init(data) {
    this.charKey = data.character || 'polar';
  }

  create() {
    this.W = 720;
    this.H = 1280;

    // Game state
    this.playerHP = 10;
    this.maxHP = 10;
    this.score = 0;
    this.resources = 100; // start with some resources
    this.wave = 0;
    this.currentLane = 2; // 0-4, start middle
    this.throwCooldown = 0;
    this.throwCooldownMax = 300; // ms
    this.gameOver = false;
    this.waveActive = false;
    this.bugsRemaining = 0;
    this.totalBugsKilled = 0;
    this._waveCompleteScheduled = false; // Bug #2: prevent duplicate wave completion
    this._bossSpawnTimer = null; // Bug R5: track boss spawn timer

    // Lane positions (Y coordinates) - 5 lanes
    this.laneCount = 5;
    this.laneTopY = 100;
    this.laneHeight = 140;
    this.laneYPositions = [];
    for (let i = 0; i < this.laneCount; i++) {
      this.laneYPositions.push(this.laneTopY + i * this.laneHeight + this.laneHeight / 2);
    }

    // Character X position (right side, well within screen)
    this.playerX = this.W - 150;

    // Groups
    this.bugs = [];
    this.stones = [];
    this.fortifications = []; // { lane, type, sprite, hp, ... }

    // Draw background
    this.drawBackground();

    // Cherry blossom tree (지키는 대상) — right edge, drawn first (behind character)
    this.cherryTree = this.add.graphics();
    this.drawCherryTree(this.W - 65, this.laneTopY + this.laneCount * this.laneHeight / 2);

    // Character sprite — compact, facing left toward bugs
    this.player = this.add.sprite(this.playerX, this.laneYPositions[this.currentLane], `${this.charKey}_idle_0`);
    this.player.setScale(0.35);
    // Sprite already faces left by default — flipX=true was flipping to right
    // Remove flipX to keep facing left (toward bugs)
    this.player.play(`${this.charKey}_idle`);

    // UI
    this.createUI();

    // Controls
    this.setupControls();

    // Start first wave after delay
    this.time.delayedCall(1500, () => this.startNextWave());

    this.cameras.main.fadeIn(500, 0, 0, 0);

    // Bug #4/#5: Clean up on scene shutdown to prevent listener accumulation
    this.events.once('shutdown', () => this.shutdown());
  }

  // Bug #5: Scene cleanup method
  shutdown() {
    // Remove all keyboard listeners
    if (this.input && this.input.keyboard) {
      this.input.keyboard.removeAllListeners();
    }

    // Stop all tweens
    if (this.tweens) {
      this.tweens.killAll();
    }

    // Stop all timers
    if (this.time) {
      this.time.removeAllEvents();
    }

    // Clean up references
    this.bugs = [];
    this.stones = [];
    this.fortifications = [];
    this.player = null;
  }

  drawCherryTree(x, y) {
    const g = this.cherryTree;
    const treeH = this.laneCount * this.laneHeight;
    const topY = y - treeH * 0.45;
    const botY = y + treeH * 0.45;

    // 큰 메인 줄기 (곡선 느낌 — 여러 직사각형으로)
    g.fillStyle(0x5C3317, 1);
    g.fillRect(x - 10, topY, 20, treeH * 0.9);
    // 줄기 그림자
    g.fillStyle(0x3E1F0D, 0.5);
    g.fillRect(x - 10, topY, 8, treeH * 0.9);

    // 가지들 (왼쪽으로 뻗음 — 게임 영역 쪽)
    const branches = [
      { y: topY + treeH * 0.1, w: 70, h: 8, angle: -15 },
      { y: topY + treeH * 0.25, w: 55, h: 7, angle: 5 },
      { y: topY + treeH * 0.4, w: 65, h: 8, angle: -10 },
      { y: topY + treeH * 0.55, w: 50, h: 7, angle: 8 },
      { y: topY + treeH * 0.7, w: 60, h: 8, angle: -5 },
      { y: topY + treeH * 0.85, w: 45, h: 7, angle: 10 },
    ];
    for (const b of branches) {
      g.fillStyle(0x6B3410, 1);
      g.fillRect(x - b.w, b.y, b.w + 15, b.h);
      // 오른쪽으로도 짧은 가지
      g.fillRect(x + 5, b.y + 3, 25, b.h - 2);
    }

    // 벚꽃 구름 — 가지마다 꽃 클러스터
    const blossomColors = [0xFF69B4, 0xFF1493, 0xFFB6C1, 0xFF85A2, 0xFFC0CB, 0xFF91A4, 0xFFDAE9];
    for (const b of branches) {
      // 가지 위에 꽃 클러스터 (큰 원)
      for (let i = 0; i < 8; i++) {
        const bx = x - b.w * 0.3 + (Math.random() - 0.3) * b.w * 0.8;
        const by = b.y + (Math.random() - 0.5) * 30;
        const color = blossomColors[Math.floor(Math.random() * blossomColors.length)];
        g.fillStyle(color, 0.85);
        g.fillCircle(bx, by, 12 + Math.random() * 10);
      }
      // 작은 꽃잎
      for (let i = 0; i < 5; i++) {
        const bx = x - b.w * 0.5 + Math.random() * b.w;
        const by = b.y + (Math.random() - 0.5) * 40;
        g.fillStyle(0xFFB6C1, 0.6);
        g.fillCircle(bx, by, 5 + Math.random() * 6);
      }
    }

    // 줄기 주변 추가 벚꽃 (오른쪽 가지)
    for (let i = 0; i < 15; i++) {
      const bx = x + 10 + Math.random() * 30;
      const by = topY + Math.random() * treeH * 0.9;
      const color = blossomColors[Math.floor(Math.random() * blossomColors.length)];
      g.fillStyle(color, 0.7);
      g.fillCircle(bx, by, 8 + Math.random() * 8);
    }

    // 떨어지는 꽃잎 (바닥 근처)
    for (let i = 0; i < 20; i++) {
      g.fillStyle(0xFFC0CB, 0.35);
      const px = x - 80 + Math.random() * 100;
      const py = botY - 20 + Math.random() * 40;
      g.fillCircle(px, py, 2 + Math.random() * 3);
    }
  }

  drawBackground() {
    const bg = this.add.graphics();
    // Bug #10: Replace fillGradientStyle with solid fill (Canvas compatibility)
    bg.fillStyle(0x2d5a2d, 1);
    bg.fillRect(0, 0, this.W, this.H);
    // Add a second rect on top for gradient effect
    bg.fillStyle(0x1a3a1a, 0.5);
    bg.fillRect(0, 0, this.W, this.H / 2);

    // Lane backgrounds
    for (let i = 0; i < this.laneCount; i++) {
      const y = this.laneTopY + i * this.laneHeight;
      const color = i % 2 === 0 ? 0x3a6b3a : 0x2d5a2d;
      bg.fillStyle(color, 0.6);
      bg.fillRect(0, y, this.W, this.laneHeight);

      // Lane border
      bg.lineStyle(1, 0x4a8a4a, 0.3);
      bg.lineBetween(0, y, this.W, y);

      // Path/road texture
      bg.fillStyle(0x4a7a4a, 0.3);
      bg.fillRect(0, y + this.laneHeight / 2 - 20, this.W, 40);
    }
    // Bottom lane border
    bg.lineStyle(1, 0x4a8a4a, 0.3);
    bg.lineBetween(0, this.laneTopY + this.laneCount * this.laneHeight, this.W, this.laneTopY + this.laneCount * this.laneHeight);

    // Right side defense zone (cherry tree area — soft pink tint)
    bg.fillStyle(0xFFE4E1, 0.15);
    bg.fillRect(this.W - 120, this.laneTopY, 120, this.laneCount * this.laneHeight);
    bg.lineStyle(2, 0xFF69B4, 0.3);
    bg.lineBetween(this.W - 120, this.laneTopY, this.W - 120, this.laneTopY + this.laneCount * this.laneHeight);
  }

  createUI() {
    // Top bar background
    const topBar = this.add.graphics();
    topBar.fillStyle(0x111111, 0.85);
    topBar.fillRoundedRect(10, 10, this.W - 20, 60, 10);

    // Wave
    this.waveText = this.add.text(30, 25, 'Wave: 1', {
      fontSize: '22px', fontFamily: 'Arial', color: '#ffffff', fontStyle: 'bold',
    });

    // Score
    this.scoreText = this.add.text(200, 25, 'Score: 0', {
      fontSize: '22px', fontFamily: 'Arial', color: '#FFD700', fontStyle: 'bold',
    });

    // Resources
    this.resourceText = this.add.text(380, 25, '$ 100', {
      fontSize: '22px', fontFamily: 'Arial', color: '#4ade80', fontStyle: 'bold',
    });

    // HP
    this.hpText = this.add.text(530, 25, 'HP: 10/10', {
      fontSize: '22px', fontFamily: 'Arial', color: '#ff6666', fontStyle: 'bold',
    });

    // HP Bar
    this.hpBarBg = this.add.graphics();
    this.hpBarBg.fillStyle(0x333333, 1);
    this.hpBarBg.fillRoundedRect(10, 76, this.W - 20, 16, 4);

    this.hpBar = this.add.graphics();
    this.updateHPBar();

    // Status text (wave announcements)
    this.statusText = this.add.text(this.W / 2, 130, '', {
      fontSize: '30px', fontFamily: 'Arial', color: '#FFD700',
      fontStyle: 'bold', stroke: '#000', strokeThickness: 4,
    }).setOrigin(0.5).setAlpha(0);

    // Bottom bar - build buttons
    this.createBuildButtons();

    // Mobile controls
    this.createMobileControls();
  }

  createBuildButtons() {
    const btnY = this.H - 180;
    const btnW = 200;
    const btnH = 60;
    const gap = 15;
    const startX = (this.W - (3 * btnW + 2 * gap)) / 2;

    const buttons = [
      { key: 'wall', label: 'Stone Wall', sublabel: '$50', color: 0x666666, hotkey: '1' },
      { key: 'fire', label: 'Fire Trap', sublabel: '$100', color: 0xff4400, hotkey: '2' },
      { key: 'ice', label: 'Ice Wall', sublabel: '$75', color: 0x66aadd, hotkey: '3' },
    ];

    // Build panel bg
    const panelBg = this.add.graphics();
    panelBg.fillStyle(0x111111, 0.85);
    panelBg.fillRoundedRect(10, btnY - 30, this.W - 20, 100, 10);

    this.add.text(this.W / 2, btnY - 15, '-- 건설 (1/2/3) --', {
      fontSize: '16px', fontFamily: 'Arial', color: '#aaaaaa',
    }).setOrigin(0.5);

    buttons.forEach((btn, i) => {
      const x = startX + i * (btnW + gap);
      const g = this.add.graphics();
      g.fillStyle(btn.color, 0.8);
      g.fillRoundedRect(x, btnY + 5, btnW, btnH, 10);
      g.lineStyle(2, 0xffffff, 0.3);
      g.strokeRoundedRect(x, btnY + 5, btnW, btnH, 10);

      this.add.text(x + btnW / 2, btnY + 22, `[${btn.hotkey}] ${btn.label}`, {
        fontSize: '14px', fontFamily: 'Arial', color: '#ffffff', fontStyle: 'bold',
      }).setOrigin(0.5);

      this.add.text(x + btnW / 2, btnY + 42, btn.sublabel, {
        fontSize: '16px', fontFamily: 'Arial', color: '#FFD700',
      }).setOrigin(0.5);

      const zone = this.add.zone(x + btnW / 2, btnY + 35, btnW, btnH).setInteractive();
      zone.on('pointerdown', () => this.buildFortification(btn.key));
    });
  }

  createMobileControls() {
    const ctrlY = this.H - 80;

    // Bug #13: Use pointerdown/pointerup for mobile-friendly visual feedback

    // Up button
    const upG = this.add.graphics();
    this._drawMobileBtn(upG, 30, ctrlY - 30, 80, 55, 0x4a8a4a, 0.8);
    this.add.text(70, ctrlY, '▲', { fontSize: '30px', color: '#fff' }).setOrigin(0.5);
    const upZone = this.add.zone(70, ctrlY, 80, 55).setInteractive();
    upZone.on('pointerdown', () => {
      this._drawMobileBtn(upG, 30, ctrlY - 30, 80, 55, 0x6aaa6a, 1);
      this.moveLane(-1);
    });
    upZone.on('pointerup', () => {
      this._drawMobileBtn(upG, 30, ctrlY - 30, 80, 55, 0x4a8a4a, 0.8);
    });

    // Down button
    const downG = this.add.graphics();
    this._drawMobileBtn(downG, 130, ctrlY - 30, 80, 55, 0x4a8a4a, 0.8);
    this.add.text(170, ctrlY, '▼', { fontSize: '30px', color: '#fff' }).setOrigin(0.5);
    const downZone = this.add.zone(170, ctrlY, 80, 55).setInteractive();
    downZone.on('pointerdown', () => {
      this._drawMobileBtn(downG, 130, ctrlY - 30, 80, 55, 0x6aaa6a, 1);
      this.moveLane(1);
    });
    downZone.on('pointerup', () => {
      this._drawMobileBtn(downG, 130, ctrlY - 30, 80, 55, 0x4a8a4a, 0.8);
    });

    // Throw button
    const throwG = this.add.graphics();
    this._drawMobileBtn(throwG, this.W - 180, ctrlY - 30, 150, 55, 0xdd6600, 0.9);
    this.add.text(this.W - 105, ctrlY, 'THROW', {
      fontSize: '24px', fontFamily: 'Arial', color: '#fff', fontStyle: 'bold',
    }).setOrigin(0.5);
    const throwZone = this.add.zone(this.W - 105, ctrlY, 150, 55).setInteractive();
    throwZone.on('pointerdown', () => {
      this._drawMobileBtn(throwG, this.W - 180, ctrlY - 30, 150, 55, 0xff8822, 1);
      this.throwStone();
    });
    throwZone.on('pointerup', () => {
      this._drawMobileBtn(throwG, this.W - 180, ctrlY - 30, 150, 55, 0xdd6600, 0.9);
    });
  }

  // Helper for mobile button drawing
  _drawMobileBtn(g, x, y, w, h, color, alpha) {
    g.clear();
    g.fillStyle(color, alpha);
    g.fillRoundedRect(x, y, w, h, 10);
  }

  setupControls() {
    // Bug #4: Remove existing keyboard listeners before adding new ones
    this.input.keyboard.removeAllListeners();

    this.cursors = this.input.keyboard.createCursorKeys();
    this.spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    this.key1 = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ONE);
    this.key2 = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.TWO);
    this.key3 = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.THREE);

    this.input.keyboard.on('keydown-UP', () => this.moveLane(-1));
    this.input.keyboard.on('keydown-DOWN', () => this.moveLane(1));
    this.input.keyboard.on('keydown-SPACE', () => this.throwStone());
    this.input.keyboard.on('keydown-ONE', () => this.buildFortification('wall'));
    this.input.keyboard.on('keydown-TWO', () => this.buildFortification('fire'));
    this.input.keyboard.on('keydown-THREE', () => this.buildFortification('ice'));

    // Mobile swipe controls — swipe up/down on game area to move lanes
    this._swipeStartY = null;
    this.input.on('pointerdown', (pointer) => {
      // Only track swipe in the game area (not UI buttons at bottom)
      if (pointer.y < this.laneTopY + this.laneCount * this.laneHeight + 20) {
        this._swipeStartY = pointer.y;
      }
    });
    this.input.on('pointerup', (pointer) => {
      if (this._swipeStartY !== null) {
        const dy = pointer.y - this._swipeStartY;
        const threshold = 30; // minimum swipe distance
        if (dy < -threshold) {
          this.moveLane(-1); // swipe up
        } else if (dy > threshold) {
          this.moveLane(1); // swipe down
        } else if (Math.abs(dy) < 10) {
          // Tap (not swipe) — throw stone
          this.throwStone();
        }
        this._swipeStartY = null;
      }
    });
  }

  moveLane(dir) {
    if (this.gameOver) return;
    const newLane = Phaser.Math.Clamp(this.currentLane + dir, 0, this.laneCount - 1);
    if (newLane !== this.currentLane) {
      this.currentLane = newLane;
      this.tweens.add({
        targets: this.player,
        y: this.laneYPositions[this.currentLane],
        duration: 120,
        ease: 'Power2',
      });
    }
  }

  throwStone() {
    if (this.gameOver) return;
    if (this.throwCooldown > 0) return;

    this.throwCooldown = this.throwCooldownMax;

    // Bug #7: Stone damage scales with waves — base 1, +1 every 5 waves
    const stoneDamage = 1 + Math.floor(this.wave / 5);

    const stone = this.add.image(this.playerX - 40, this.laneYPositions[this.currentLane], 'stone');
    stone.setScale(1.2);
    stone.lane = this.currentLane;
    stone.speed = 600; // px per second
    stone.damage = stoneDamage;
    this.stones.push(stone);

    // Flash player for throw effect
    this.player.setTint(0xffaa00);
    this.time.delayedCall(100, () => {
      if (this.player) this.player.clearTint();
    });
  }

  buildFortification(type) {
    if (this.gameOver) return;
    const fort = FORT_TYPES[type];
    if (this.resources < fort.cost) {
      this.showStatus('자원이 부족합니다!', 0xff4444);
      return;
    }

    // Check max 2 per lane
    const laneForts = this.fortifications.filter(f => f.lane === this.currentLane && !f.destroyed);
    if (laneForts.length >= 2) {
      this.showStatus('이 레인에 더 설치할 수 없습니다!', 0xff4444);
      return;
    }

    this.resources -= fort.cost;
    this.updateResourceText();

    // Place fortification at a reasonable X position
    const xPositions = [350, 250]; // two possible positions per lane
    const xPos = xPositions[laneForts.length] || 300;

    const sprite = this.add.image(xPos, this.laneYPositions[this.currentLane], fort.texture);
    sprite.setScale(1.2);

    const fortObj = {
      lane: this.currentLane,
      type: type,
      sprite: sprite,
      hp: fort.hp,
      maxHp: fort.hp,
      destroyed: false,
      x: xPos,
      lastFireTime: 0,
    };

    // HP bar for walls
    if (type === 'wall') {
      fortObj.hpBar = this.add.graphics();
      this.updateFortHPBar(fortObj);
    }

    this.fortifications.push(fortObj);
    this.showStatus(`${fort.name} 설치!`, 0x4ade80);
  }

  updateFortHPBar(fort) {
    if (!fort.hpBar || fort.destroyed) return;
    fort.hpBar.clear();
    const barW = 36;
    const barH = 4;
    const x = fort.sprite.x - barW / 2;
    const y = fort.sprite.y - 30;
    fort.hpBar.fillStyle(0x333333);
    fort.hpBar.fillRect(x, y, barW, barH);
    fort.hpBar.fillStyle(0x44ff44);
    fort.hpBar.fillRect(x, y, barW * (fort.hp / fort.maxHp), barH);
  }

  startNextWave() {
    if (this.gameOver) return;
    this.wave++;
    this.waveActive = true;
    this._waveCompleteScheduled = false; // Bug #2: reset flag for new wave
    const config = getWaveConfig(this.wave);

    this.waveText.setText(`Wave: ${this.wave}`);
    this.showStatus(`Wave ${this.wave}${config.isBoss ? ' - BOSS!' : ''}`, config.isBoss ? 0xff4444 : 0xFFD700);

    this.bugsRemaining = config.bugCount + (config.isBoss ? 1 : 0);

    // Spawn bugs over time
    let spawnIndex = 0;
    const spawnInterval = Math.max(400, 1500 - this.wave * 40);

    const spawnTimer = this.time.addEvent({
      delay: spawnInterval,
      callback: () => {
        if (this.gameOver) { spawnTimer.destroy(); return; }
        if (spawnIndex < config.bugCount) {
          const type = Phaser.Utils.Array.GetRandom(config.types);
          const lane = Phaser.Math.Between(0, this.laneCount - 1);
          this.spawnBug(type, lane);
          spawnIndex++;
        }
      },
      repeat: config.bugCount - 1,
    });

    // Spawn boss — track timer so we can cancel if wave completes early
    if (config.isBoss) {
      this._bossSpawnTimer = this.time.delayedCall(config.bugCount * spawnInterval + 1000, () => {
        this._bossSpawnTimer = null;
        if (!this.gameOver && this.waveActive) {
          this.showStatus('BOSS: 거미!', 0xff0000);
          const bossLane = Phaser.Math.Between(1, 3);
          this.spawnBug('spider', bossLane);
        }
      });
    }
  }

  spawnBug(type, lane) {
    const def = BUG_TYPES[type];
    // Speed increases slightly each wave
    const speedMult = 1 + (this.wave - 1) * 0.03;
    const bug = this.add.image(-20, this.laneYPositions[lane], def.texture);
    bug.setScale(def.scale);
    bug.lane = lane;
    bug.bugType = type;

    // Bug #8: Boss HP scales with waves — HP = 10 + (wave * 2)
    if (type === 'spider') {
      bug.hp = 10 + (this.wave * 2);
      bug.maxHp = bug.hp;
    } else {
      bug.hp = def.hp;
      bug.maxHp = def.hp;
    }

    bug.speed = def.speed * speedMult;
    bug.baseSpeed = bug.speed;
    bug.reward = def.reward;
    bug.slowed = false;
    bug.slowTimer = 0;
    bug.alive = true;
    bug.lastDrawnHP = -1; // Bug #12: Track last drawn HP

    // HP bar for bugs with more than 1 HP
    if (bug.maxHp > 1) {
      bug.hpBar = this.add.graphics();
    }

    this.bugs.push(bug);
  }

  showStatus(text, color = 0xFFD700) {
    this.statusText.setText(text);
    this.statusText.setColor(`#${color.toString(16).padStart(6, '0')}`);
    this.statusText.setAlpha(1);
    this.tweens.add({
      targets: this.statusText,
      alpha: 0,
      duration: 2000,
      delay: 500,
      ease: 'Power2',
    });
  }

  updateHPBar() {
    this.hpBar.clear();
    const barW = this.W - 24;
    this.hpBar.fillStyle(0xff4444, 1);
    this.hpBar.fillRoundedRect(12, 78, barW * (this.playerHP / this.maxHP), 12, 3);
    this.hpText.setText(`HP: ${this.playerHP}/${this.maxHP}`);
  }

  updateResourceText() {
    this.resourceText.setText(`$ ${this.resources}`);
  }

  updateBugHPBar(bug) {
    if (!bug.hpBar) return;
    if (!bug.alive) return;

    // Bug #12: Only redraw HP bar when HP actually changes
    if (bug.lastDrawnHP === bug.hp) {
      // Only update position if needed
      if (bug.hpBar._lastX !== bug.x || bug.hpBar._lastY !== bug.y) {
        bug.hpBar.clear();
        const barW = 30;
        const barH = 4;
        const x = bug.x - barW / 2;
        const y = bug.y - 22;
        bug.hpBar.fillStyle(0x333333);
        bug.hpBar.fillRect(x, y, barW, barH);
        bug.hpBar.fillStyle(bug.hp > bug.maxHp * 0.5 ? 0x44ff44 : 0xff4444);
        bug.hpBar.fillRect(x, y, barW * (bug.hp / bug.maxHp), barH);
        bug.hpBar._lastX = bug.x;
        bug.hpBar._lastY = bug.y;
      }
      return;
    }

    bug.lastDrawnHP = bug.hp;
    bug.hpBar.clear();
    const barW = 30;
    const barH = 4;
    const x = bug.x - barW / 2;
    const y = bug.y - 22;
    bug.hpBar.fillStyle(0x333333);
    bug.hpBar.fillRect(x, y, barW, barH);
    bug.hpBar.fillStyle(bug.hp > bug.maxHp * 0.5 ? 0x44ff44 : 0xff4444);
    bug.hpBar.fillRect(x, y, barW * (bug.hp / bug.maxHp), barH);
    bug.hpBar._lastX = bug.x;
    bug.hpBar._lastY = bug.y;
  }

  damageBug(bug, damage) {
    if (!bug.alive) return;
    bug.hp -= damage;
    if (bug.hp <= 0) {
      this.killBug(bug);
    } else {
      // Flash red
      bug.setTint(0xff0000);
      this.time.delayedCall(100, () => {
        if (bug.alive) bug.clearTint();
      });
      this.updateBugHPBar(bug);
    }
  }

  killBug(bug) {
    if (!bug.alive) return; // Guard against double-kill
    bug.alive = false;
    this.score += bug.reward;
    this.resources += bug.reward;
    this.totalBugsKilled++;

    // Bug #3: Guard against bugsRemaining going negative
    if (this.bugsRemaining > 0) this.bugsRemaining--;

    this.scoreText.setText(`Score: ${this.score}`);
    this.updateResourceText();

    // Death effect
    this.tweens.add({
      targets: bug,
      alpha: 0,
      scaleX: 0.1,
      scaleY: 0.1,
      duration: 200,
      onComplete: () => {
        if (bug.hpBar) bug.hpBar.destroy();
        bug.destroy();
      },
    });

    // Score popup
    const popText = this.add.text(bug.x, bug.y - 20, `+${bug.reward}`, {
      fontSize: '18px', fontFamily: 'Arial', color: '#4ade80', fontStyle: 'bold',
    }).setOrigin(0.5);
    this.tweens.add({
      targets: popText,
      y: bug.y - 60,
      alpha: 0,
      duration: 600,
      onComplete: () => popText.destroy(),
    });

    // Bug #2: Use shared wave completion check
    this.checkWaveComplete();
  }

  bugReachedEnd(bug) {
    if (!bug.alive) return;
    bug.alive = false;

    // Bug #3: Guard against bugsRemaining going negative
    if (this.bugsRemaining > 0) this.bugsRemaining--;

    this.playerHP--;
    this.updateHPBar();

    // Flash screen red
    this.cameras.main.flash(200, 255, 0, 0);

    // Remove bug visuals (Bug #1: do NOT splice array here, let dead-bug cleanup handle it)
    if (bug.hpBar) bug.hpBar.destroy();
    bug.destroy();

    if (this.playerHP <= 0) {
      this.doGameOver();
    }

    // Bug #2: Use shared wave completion check
    this.checkWaveComplete();
  }

  // Bug #2: Extract wave completion to single method with flag to prevent double-firing
  // Bug R5: Cancel pending boss spawn if wave completes early
  checkWaveComplete() {
    if (this.bugsRemaining <= 0 && this.waveActive && !this._waveCompleteScheduled) {
      // Cancel pending boss spawn timer if it hasn't fired yet
      if (this._bossSpawnTimer) {
        this._bossSpawnTimer.destroy();
        this._bossSpawnTimer = null;
      }
      this._waveCompleteScheduled = true;
      this.waveActive = false;
      this.time.delayedCall(2000, () => {
        if (!this.gameOver) {
          this.showStatus('Wave Clear!', 0x4ade80);
          const bonus = 20 + this.wave * 5;
          this.resources += bonus;
          this.updateResourceText();
          this.time.delayedCall(2000, () => this.startNextWave());
        }
      });
    }
  }

  doGameOver() {
    if (this.gameOver) return;
    this.gameOver = true;

    this.player.play(`${this.charKey}_hurt`);
    this.cameras.main.shake(500, 0.02);

    this.time.delayedCall(1500, () => {
      this.scene.start('GameOverScene', {
        character: this.charKey,
        score: this.score,
        wave: this.wave,
        bugsKilled: this.totalBugsKilled,
      });
    });
  }

  update(time, delta) {
    if (this.gameOver) return;

    // Throw cooldown
    if (this.throwCooldown > 0) {
      this.throwCooldown -= delta;
    }

    // Update stones
    for (let i = this.stones.length - 1; i >= 0; i--) {
      const stone = this.stones[i];
      // Bug #11: skip destroyed stones
      if (!stone || !stone.active) {
        this.stones.splice(i, 1);
        continue;
      }
      stone.x -= stone.speed * (delta / 1000);

      // Check collision with bugs in same lane
      let hit = false;
      for (const bug of this.bugs) {
        // Bug #11: Early exit — skip dead bugs
        if (!bug.alive) continue;
        if (bug.lane !== stone.lane) continue;
        const dist = Phaser.Math.Distance.Between(stone.x, stone.y, bug.x, bug.y);
        if (dist < 30) {
          this.damageBug(bug, stone.damage); // Bug #7: Use stone's scaled damage
          hit = true;
          break;
        }
      }

      if (hit || stone.x < -20) {
        stone.destroy();
        this.stones.splice(i, 1);
      }
    }

    // Update bugs
    for (let i = this.bugs.length - 1; i >= 0; i--) {
      const bug = this.bugs[i];
      if (!bug.alive) {
        // Bug #1: Dead-bug cleanup is the single place we splice
        this.bugs.splice(i, 1);
        continue;
      }

      // Slow timer
      if (bug.slowed) {
        bug.slowTimer -= delta;
        if (bug.slowTimer <= 0) {
          bug.slowed = false;
          bug.speed = bug.baseSpeed;
          bug.clearTint();
        }
      }

      // Move bug right
      bug.x += bug.speed * (delta / 1000);

      // Update HP bar position
      this.updateBugHPBar(bug);

      // Check collision with fortifications
      for (const fort of this.fortifications) {
        // Bug #11: Early exit — skip destroyed forts
        if (fort.destroyed) continue;
        if (fort.lane !== bug.lane) continue;
        const dist = Math.abs(bug.x - fort.x);
        if (dist < 25) {
          if (fort.type === 'wall') {
            // Wall blocks bug - push back slightly
            bug.x = fort.x - 26;
            // Wall takes damage over time
            if (!fort._lastHitTime || time - fort._lastHitTime > 500) {
              fort._lastHitTime = time;
              fort.hp--;
              this.updateFortHPBar(fort);
              if (fort.hp <= 0) {
                this.destroyFort(fort);
              }
            }
          } else if (fort.type === 'fire') {
            // Bug #6: Fire trap deals 3 damage every 250ms instead of 1 damage every 1000ms
            if (!fort.lastFireTime || time - fort.lastFireTime > FORT_TYPES.fire.interval) {
              fort.lastFireTime = time;
              this.damageBug(bug, FORT_TYPES.fire.damage);
              // Fire visual
              fort.sprite.setTint(0xffff00);
              this.time.delayedCall(100, () => {
                if (!fort.destroyed) fort.sprite.clearTint();
              });
            }
          } else if (fort.type === 'ice') {
            // Bug #9: Remove the !bug.slowed check — reapply slow each time
            bug.slowed = true;
            bug.slowTimer = FORT_TYPES.ice.duration;
            bug.speed = bug.baseSpeed * FORT_TYPES.ice.slowFactor;
            bug.setTint(0x88ccff);
          }
        }
      }

      // Bug reached right side
      if (bug.x >= this.W - 40) {
        // Bug #1: Do NOT splice here — bugReachedEnd sets alive=false,
        // and the dead-bug cleanup at the top of this loop will splice next frame
        this.bugReachedEnd(bug);
      }
    }

    // Clean up destroyed fortifications list periodically (every 60 frames instead of every frame)
    this._fortCleanupCounter = (this._fortCleanupCounter || 0) + 1;
    if (this._fortCleanupCounter >= 60) {
      this._fortCleanupCounter = 0;
      this.fortifications = this.fortifications.filter(f => !f.destroyed);
    }
  }

  destroyFort(fort) {
    fort.destroyed = true;
    if (fort.hpBar) fort.hpBar.destroy();
    this.tweens.add({
      targets: fort.sprite,
      alpha: 0,
      duration: 300,
      onComplete: () => fort.sprite.destroy(),
    });
  }
}
