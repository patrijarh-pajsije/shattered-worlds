import * as Phaser from 'phaser'

const WORKSHOP_SAVE_KEY = 'shattered_worlds_workshop'

// ─────────────────────────────────────────────────────────────────────────────
//  StartScene.js — The title screen
//
//  This is the first screen the player sees after BootScene.
//  It also serves as the "return to start" destination after a run ends.
//
//  IMPORTANT: StartScene resets ALL run state in the registry.
//  This is the authoritative reset point — every new run begins from here.
//
//  The animated ink border around the title uses the same wobble technique
//  as GameScene — sine/cosine displacement updated every frame in update().
// ─────────────────────────────────────────────────────────────────────────────

export class StartScene extends Phaser.Scene {
  constructor() {
    super({ key: 'StartScene' })
    this.wobbleTime = 0  // Accumulates time for the animated border effect
  }

  create() {
    const W = this.scale.width
    const H = this.scale.height

    // ── Reset ALL run state ──
    // This must reset EVERYTHING that GameScene or DraftScene might write,
    // so that each new run starts from a clean slate.
    this.registry.set('score',           0)
    this.registry.set('lives',           3)
    this.registry.set('combo',           1)
    this.registry.set('roomNum',         0)
    this.registry.set('roomsCleared',    0)
    this.registry.set('bricksShattered', 0)
    this.registry.set('selectedRelic',   null)
    this.registry.set('activeUpgrades',  {})
    this.registry.set('scoreMultiplier',   1)   // Multiplier from curse cards — reset each run
    this.registry.set('shardsEarned',     0)   // End-of-run shard formula result
    this.registry.set('shardsCollected',  0)   // Shards collected from brick drops
    this.registry.set('diamondsCollected',0)   // Diamonds from boss drops this run

    // ── Background ──
    this.bg = this.add.rectangle(0, 0, W, H, 0xf5f0e4).setOrigin(0, 0)

    // Paper texture: faint horizontal lines across the full screen
    this.paperLines = this.add.graphics()
    this.drawPaperTexture()

    // Animated ink border graphics object (redrawn every frame in update())
    this.inkBorder = this.add.graphics()

    // Horizontal divider line between subtitle and quote
    this.divider = this.add.graphics()

    // ── Title text ──
    // Large hand-drawn style title at 30% down the screen
    this.titleText = this.add.text(W / 2, H * 0.3, 'Shattered\nWorlds', {
      fontFamily: 'Georgia, serif',
      fontSize:   Math.round(W * 0.11) + 'px',
      color:      '#2a1f0e',
      align:      'center',
      lineSpacing: 8
    }).setOrigin(0.5)  // Centered anchor point

    // ── Subtitle ──
    this.add.text(W / 2, H * 0.52, 'a roguelite brick-breaker', {
      fontFamily: 'Georgia, serif',
      fontSize:   Math.round(W * 0.038) + 'px',
      color:      '#8a7a6a',
      fontStyle:  'italic'
    }).setOrigin(0.5)

    // ── Atmospheric quote ──
    this.add.text(W / 2, H * 0.62, '"Everything that exists\nwas once unbroken."', {
      fontFamily: 'Georgia, serif',
      fontSize:   Math.round(W * 0.036) + 'px',
      color:      '#6a5a4a',
      fontStyle:  'italic',
      align:      'center',
      lineSpacing: 6
    }).setOrigin(0.5)

    // ── Begin button ──
    // Tapping this starts the relic selection screen
    this.beginBtn = this.add.text(W / 2, H * 0.76, 'begin your run', {
      fontFamily:      'Georgia, serif',
      fontSize:        Math.round(W * 0.048) + 'px',
      color:           '#f5f0e4',       // Light text on dark background
      backgroundColor: '#2a1f0e',       // Dark ink button
      padding:         { x: 28, y: 12 }
    }).setOrigin(0.5).setInteractive({ useHandCursor: true })

    // Navigate to relic selection on click/tap
    this.beginBtn.on('pointerdown', () => this.scene.start('RelicScene'))
    // Hover effects: slightly lighter background
    this.beginBtn.on('pointerover',  () => this.beginBtn.setStyle({ backgroundColor: '#4a3020' }))
    this.beginBtn.on('pointerout',   () => this.beginBtn.setStyle({ backgroundColor: '#2a1f0e' }))

    // ── World label ──
    this.add.text(W / 2, H * 0.88, 'The Void awaits', {
      fontFamily: 'Georgia, serif',
      fontSize:   Math.round(W * 0.032) + 'px',
      color:      '#8a7a6a',
      fontStyle:  'italic'
    }).setOrigin(0.5)

    const resetBtn = this.add.text(W / 2, H * 0.94, 'reset workshop progress', {
      fontFamily:      'Georgia, serif',
      fontSize:        Math.round(W * 0.026) + 'px',
      color:           '#7a2018',
      backgroundColor: '#f3ddd7',
      padding:         { x: 10, y: 5 }
    }).setOrigin(0.5).setInteractive({ useHandCursor: true })

    resetBtn.on('pointerdown', () => this.showResetConfirm())
    resetBtn.on('pointerover',  () => resetBtn.setStyle({ backgroundColor: '#ecd0c8' }))
    resetBtn.on('pointerout',   () => resetBtn.setStyle({ backgroundColor: '#f3ddd7' }))

    // Draw the decorative divider line between subtitle and quote
    this.drawDivider(W / 2, H * 0.57, W * 0.25)

    this.wobbleTime = 0
  }

  // Draws faint horizontal lines to simulate paper texture
  drawPaperTexture() {
    const W = this.scale.width
    const H = this.scale.height
    this.paperLines.clear()
    this.paperLines.lineStyle(1, 0xa08060, 0.04)  // Very faint warm brown
    for (let y = 0; y < H; y += 4) {
      this.paperLines.lineBetween(0, y, W, y)
    }
  }

  showResetConfirm() {
    const W = this.scale.width
    const H = this.scale.height

    const overlay = this.add.rectangle(0, 0, W, H, 0x000000, 0.45).setOrigin(0, 0)

    const box = this.add.graphics()
    box.fillStyle(0xfaf6ee, 1)
    box.fillRoundedRect(W * 0.1, H * 0.3, W * 0.8, H * 0.34, 10)
    box.lineStyle(2, 0xc08070, 1)
    box.strokeRoundedRect(W * 0.1, H * 0.3, W * 0.8, H * 0.34, 10)

    const title = this.add.text(W / 2, H * 0.37, 'Reset workshop progress?', {
      fontFamily: 'Georgia, serif',
      fontSize:   Math.round(W * 0.046) + 'px',
      color:      '#7a2018',
      align:      'center'
    }).setOrigin(0.5)

    const body = this.add.text(W / 2, H * 0.46,
      'This clears all permanent upgrades,\nshards, and diamonds.\nThis cannot be undone.', {
      fontFamily:  'Georgia, serif',
      fontSize:    Math.round(W * 0.032) + 'px',
      color:       '#6a5a4a',
      align:       'center',
      lineSpacing: 6
    }).setOrigin(0.5)

    const cancelBtn = this.add.text(W / 2 - W * 0.18, H * 0.57, 'cancel', {
      fontFamily:      'Georgia, serif',
      fontSize:        Math.round(W * 0.036) + 'px',
      color:           '#2a1f0e',
      backgroundColor: '#e8e0d0',
      padding:         { x: 14, y: 8 }
    }).setOrigin(0.5).setInteractive({ useHandCursor: true })

    const confirmBtn = this.add.text(W / 2 + W * 0.18, H * 0.57, 'reset', {
      fontFamily:      'Georgia, serif',
      fontSize:        Math.round(W * 0.036) + 'px',
      color:           '#f5f0e4',
      backgroundColor: '#7a2018',
      padding:         { x: 14, y: 8 }
    }).setOrigin(0.5).setInteractive({ useHandCursor: true })

    const close = () => {
      overlay.destroy()
      box.destroy()
      title.destroy()
      body.destroy()
      cancelBtn.destroy()
      confirmBtn.destroy()
    }

    cancelBtn.on('pointerdown', close)
    confirmBtn.on('pointerdown', () => {
      this.resetWorkshopProgress()
      close()
    })
  }

  resetWorkshopProgress() {
    try {
      localStorage.setItem(WORKSHOP_SAVE_KEY, JSON.stringify({}))
    } catch {
      // Ignore storage failures silently
    }

    this.registry.set('workshopData', {})
    this.registry.set('totalShards', 0)
    this.registry.set('totalDiamonds', 0)
  }

  // Draws a single horizontal divider line centered at (cx, cy)
  // halfW controls how wide it is
  drawDivider(cx, cy, halfW) {
    this.divider.clear()
    this.divider.lineStyle(1, 0xc4a882, 0.8)
    this.divider.lineBetween(cx - halfW, cy, cx + halfW, cy)
  }

  // Draws the animated ink border that wobbles around the title
  // t = current time in seconds — drives the sine/cosine animation
  drawInkBorder(t) {
    const W      = this.scale.width
    const H      = this.scale.height
    const titleY = H * 0.3

    // Border box: slightly larger than the title text area
    const bx = W * 0.08
    const by = titleY - H * 0.14
    const bw = W * 0.84
    const bh = H * 0.27

    this.inkBorder.clear()
    this.inkBorder.lineStyle(1.5, 0x2a1f0e, 0.15)  // Faint ink outline

    const steps = 12  // Points per side

    // Draw each side of the border with wobble displacement
    // The wobble formula: point + sin/cos(position * frequency + time) * amplitude
    this.inkBorder.beginPath()

    // Top side (left to right)
    for (let i = 0; i <= steps; i++) {
      const x = bx + bw * i / steps + Math.sin(by * 0.15 + t + i) * 1.2
      const y = by + Math.cos(bx * 0.12 + t) * 1.2
      i === 0 ? this.inkBorder.moveTo(x, y) : this.inkBorder.lineTo(x, y)
    }
    // Right side (top to bottom)
    for (let i = 0; i <= steps; i++) {
      const x = bx + bw + Math.sin((by + bh) * 0.15 + t) * 1.2
      const y = by + bh * i / steps + Math.cos((bx + bw) * 0.12 + t + i) * 1.2
      this.inkBorder.lineTo(x, y)
    }
    // Bottom side (right to left)
    for (let i = steps; i >= 0; i--) {
      const x = bx + bw * i / steps + Math.sin((by + bh) * 0.15 + t + i) * 1.2
      const y = by + bh + Math.cos(bx * 0.12 + t) * 1.2
      this.inkBorder.lineTo(x, y)
    }
    // Left side (bottom to top)
    for (let i = steps; i >= 0; i--) {
      const x = bx + Math.sin(by * 0.15 + t) * 1.2
      const y = by + bh * i / steps + Math.cos(bx * 0.12 + t + i) * 1.2
      this.inkBorder.lineTo(x, y)
    }

    this.inkBorder.closePath()
    this.inkBorder.strokePath()
  }

  // update() runs every frame — used here only to animate the ink border
  update(time) {
    this.wobbleTime = time * 0.001  // Convert ms to seconds
    this.drawInkBorder(this.wobbleTime)
  }
}