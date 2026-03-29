import Phaser from 'phaser';

export default class GameOverScene extends Phaser.Scene {
  constructor() {
    super('GameOverScene');
  }

  init(data) {
    this.charKey = data.character || 'polar';
    this.finalScore = data.score || 0;
    this.finalWave = data.wave || 0;
    this.bugsKilled = data.bugsKilled || 0;
  }

  create() {
    const W = 720, H = 1280;

    // Best records
    const prevBestScore = parseInt(localStorage.getItem('shinlion_defense_best_score') || '0');
    const prevBestWave = parseInt(localStorage.getItem('shinlion_defense_best_wave') || '0');
    const isNewScoreRecord = this.finalScore > prevBestScore;
    const isNewWaveRecord = this.finalWave > prevBestWave;
    if (isNewScoreRecord) localStorage.setItem('shinlion_defense_best_score', this.finalScore.toString());
    if (isNewWaveRecord) localStorage.setItem('shinlion_defense_best_wave', this.finalWave.toString());
    const bestScore = Math.max(prevBestScore, this.finalScore);
    const bestWave = Math.max(prevBestWave, this.finalWave);

    // Background (Bug #10: solid fill for Canvas compatibility)
    const bg = this.add.graphics();
    bg.fillStyle(0x2a1010, 1);
    bg.fillRect(0, 0, W, H);
    bg.fillStyle(0x1a0a0a, 0.5);
    bg.fillRect(0, 0, W, H / 2);

    // Title
    this.add.text(W / 2, 180, 'GAME OVER', {
      fontSize: '64px', fontFamily: 'Arial', color: '#ff4444',
      fontStyle: 'bold', stroke: '#000', strokeThickness: 6,
    }).setOrigin(0.5);

    // Dead character
    const sprite = this.add.sprite(W / 2, 420, `${this.charKey}_dead_0`);
    sprite.setScale(2.0);
    sprite.play(`${this.charKey}_dead`);

    // Stats panel
    const panel = this.add.graphics();
    panel.fillStyle(0x222222, 0.85);
    panel.fillRoundedRect(W / 2 - 220, 580, 440, 280, 16);

    this.add.text(W / 2, 610, `Wave: ${this.finalWave}`, {
      fontSize: '32px', fontFamily: 'Arial', color: '#ffffff', fontStyle: 'bold',
    }).setOrigin(0.5);

    this.add.text(W / 2, 660, `Score: ${this.finalScore}`, {
      fontSize: '28px', fontFamily: 'Arial', color: '#FFD700',
    }).setOrigin(0.5);

    this.add.text(W / 2, 710, `Bugs Killed: ${this.bugsKilled}`, {
      fontSize: '24px', fontFamily: 'Arial', color: '#ff8c00',
    }).setOrigin(0.5);

    // Encouraging messages
    const msgs = [
      "다음엔 더 멀리 버틸 수 있어!",
      "벌레들이 너무 많았어...\n다시 도전해보자!",
      "방어물을 잘 활용하면\n더 오래 갈 수 있어!",
      "포기하지 마!\n더 강해질 수 있어!",
    ];
    this.add.text(W / 2, 780, msgs[Phaser.Math.Between(0, msgs.length - 1)], {
      fontSize: '22px', fontFamily: 'Arial', color: '#ffaaaa',
      fontStyle: 'bold', align: 'center',
      stroke: '#000', strokeThickness: 3,
    }).setOrigin(0.5);

    // Best record
    const recordPanel = this.add.graphics();
    recordPanel.fillStyle(0x332200, 0.6);
    recordPanel.fillRoundedRect(W / 2 - 180, 870, 360, 55, 10);
    this.add.text(W / 2, 897, `Best: ${bestScore}pts | Wave ${bestWave}`, {
      fontSize: '20px', fontFamily: 'Arial', color: '#FFD700', fontStyle: 'bold',
    }).setOrigin(0.5);

    let nextBtnY = 940;
    if (isNewScoreRecord || isNewWaveRecord) {
      this.add.text(W / 2, 940, 'NEW RECORD!', {
        fontSize: '26px', fontFamily: 'Arial', color: '#ff6b6b', fontStyle: 'bold',
      }).setOrigin(0.5);
      nextBtnY = 990;
    }

    // Retry button
    const btnG = this.add.graphics();
    btnG.fillStyle(0x4ade80, 1);
    btnG.fillRoundedRect(W / 2 - 120, nextBtnY, 240, 60, 14);
    this.add.text(W / 2, nextBtnY + 30, '다시 도전', {
      fontSize: '28px', fontFamily: 'Arial', color: '#000', fontStyle: 'bold',
    }).setOrigin(0.5);
    this.add.zone(W / 2, nextBtnY + 30, 240, 60).setInteractive().on('pointerdown', () => {
      this.scene.start('GameScene', { character: this.charKey });
    });

    // Character select button
    const btn2Y = nextBtnY + 80;
    const btn2G = this.add.graphics();
    btn2G.fillStyle(0x6b88ff, 1);
    btn2G.fillRoundedRect(W / 2 - 120, btn2Y, 240, 60, 14);
    this.add.text(W / 2, btn2Y + 30, '캐릭터 선택', {
      fontSize: '28px', fontFamily: 'Arial', color: '#fff', fontStyle: 'bold',
    }).setOrigin(0.5);
    this.add.zone(W / 2, btn2Y + 30, 240, 60).setInteractive().on('pointerdown', () => {
      this.scene.start('MenuScene');
    });

    this.cameras.main.fadeIn(500, 0, 0, 0);
  }
}
