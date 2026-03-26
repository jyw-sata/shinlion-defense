import Phaser from 'phaser';

export default class MenuScene extends Phaser.Scene {
  constructor() {
    super('MenuScene');
  }

  create() {
    const W = 720, H = 1280;

    // Background gradient
    const bg = this.add.graphics();
    bg.fillGradientStyle(0x1a2e1a, 0x1a2e1a, 0x2d5a2d, 0x2d5a2d, 1);
    bg.fillRect(0, 0, W, H);

    // Title
    this.add.text(W / 2, 120, '신라이언 디펜스', {
      fontSize: '52px', fontFamily: 'Arial', color: '#FFD700',
      fontStyle: 'bold', stroke: '#000', strokeThickness: 6,
    }).setOrigin(0.5);

    this.add.text(W / 2, 190, 'ShinLion Defense', {
      fontSize: '24px', fontFamily: 'Arial', color: '#aaddaa',
    }).setOrigin(0.5);

    this.add.text(W / 2, 250, '캐릭터를 선택하세요', {
      fontSize: '28px', fontFamily: 'Arial', color: '#ffffff',
    }).setOrigin(0.5);

    // Character cards
    this.createCharCard(W / 2 - 150, 460, 'polar', '북극곰');
    this.createCharCard(W / 2 + 150, 460, 'teddy', '테디베어');

    // Game description panel
    const infoPanel = this.add.graphics();
    infoPanel.fillStyle(0x1a2e1a, 0.85);
    infoPanel.fillRoundedRect(40, 720, W - 80, 480, 16);
    infoPanel.lineStyle(2, 0x4ade80, 0.4);
    infoPanel.strokeRoundedRect(40, 720, W - 80, 480, 16);

    this.add.text(W / 2, 750, '게임 설명', {
      fontSize: '26px', fontFamily: 'Arial', color: '#FFD700',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    const rules = [
      '  왼쪽에서 벌레가 몰려옵니다!',
      '  위/아래로 레인을 이동하세요',
      '  Space/탭으로 돌을 던져 벌레를 처치!',
      '  자원으로 방어물을 설치하세요',
      '  Stone Wall: 벌레를 5회 막음 (50)',
      '  Fire Trap: 지나가는 벌레에 데미지 (100)',
      '  Ice Wall: 벌레를 느리게 만듦 (75)',
      '  5웨이브마다 거미 보스 등장!',
      '  벌레가 오른쪽에 도달하면 HP -1',
      '  HP가 0이 되면 게임 오버!',
    ];

    rules.forEach((text, i) => {
      this.add.text(80, 790 + i * 32, text, {
        fontSize: '17px', fontFamily: 'Arial', color: '#dddddd',
      });
    });

    // Controls info
    this.add.text(W / 2, 1120, 'PC: 방향키 + Space + 1/2/3 건설', {
      fontSize: '16px', fontFamily: 'Arial', color: '#aaaaaa',
    }).setOrigin(0.5);
    this.add.text(W / 2, 1150, '모바일: 버튼 조작', {
      fontSize: '16px', fontFamily: 'Arial', color: '#aaaaaa',
    }).setOrigin(0.5);
  }

  createCharCard(x, y, charKey, label) {
    const card = this.add.graphics();
    card.fillStyle(0x2a3a2a, 0.9);
    card.fillRoundedRect(x - 120, y - 140, 240, 340, 20);
    card.lineStyle(3, 0xFFD700, 0.6);
    card.strokeRoundedRect(x - 120, y - 140, 240, 340, 20);

    // Character sprite
    const sprite = this.add.sprite(x, y - 10, `${charKey}_idle_0`);
    sprite.setScale(1.2);
    sprite.play(`${charKey}_idle`);

    // Label
    this.add.text(x, y + 100, label, {
      fontSize: '30px', fontFamily: 'Arial', color: '#ffffff',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    // Select button
    const btnG = this.add.graphics();
    btnG.fillStyle(0x4ade80, 1);
    btnG.fillRoundedRect(x - 80, y + 135, 160, 45, 12);

    this.add.text(x, y + 157, '선택', {
      fontSize: '24px', fontFamily: 'Arial', color: '#000000',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    const hitZone = this.add.zone(x, y + 157, 160, 45).setInteractive();
    hitZone.on('pointerover', () => {
      btnG.clear(); btnG.fillStyle(0x6bff9e, 1);
      btnG.fillRoundedRect(x - 80, y + 135, 160, 45, 12);
    });
    hitZone.on('pointerout', () => {
      btnG.clear(); btnG.fillStyle(0x4ade80, 1);
      btnG.fillRoundedRect(x - 80, y + 135, 160, 45, 12);
    });
    hitZone.on('pointerdown', () => {
      this.cameras.main.fadeOut(300, 0, 0, 0);
      this.time.delayedCall(300, () => {
        this.scene.start('GameScene', { character: charKey });
      });
    });

    // Card zone clickable
    const cardZone = this.add.zone(x, y + 20, 240, 340).setInteractive();
    cardZone.on('pointerdown', () => {
      this.cameras.main.fadeOut(300, 0, 0, 0);
      this.time.delayedCall(300, () => {
        this.scene.start('GameScene', { character: charKey });
      });
    });
  }
}
