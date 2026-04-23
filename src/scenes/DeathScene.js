import * as Phaser from 'phaser'

// ─────────────────────────────────────────────────────────────────────────────
//  DeathScene.js — Run over screen
//
//  Shown when the player runs out of lives.
//  Displays run statistics with a random poetic line, shards earned,
//  and two options: try again (back to start) or visit the Workshop.
//
//  The staggered fade-in animations make the stats feel like they're
//  being revealed one by one — gives the player time to reflect on the run.
//
//  FLOW: GameScene (lives = 0) → DeathScene → StartScene or WorkshopScene
// ─────────────────────────────────────────────────────────────────────────────

// One poem per death — randomly selected each time
// These should feel slightly melancholy but not punishing
const DEATH_POEMS = [
  'You fell into the silence.\nThe silence did not notice.',
  'The bricks remember every crack.\nYou are not one of them.',
  'Even ink fades.\nBut it always leaves a mark.',
  'The void is patient.\nIt has been here before you.',
  'Something shattered.\nIt was not the bricks.',
]

export class DeathScene extends Phaser.Scene {
  constructor() {
    super({ key: 'DeathScene' })
  }

  create() {
    const W = this.scale.width
    const H = this.scale.height

    // ── Read run data from registry ──
    const score           = this.registry.get('score')           || 0
    const roomsCleared    = this.registry.get('roomsCleared')    || 0
    const bricksShattered = this.registry.get('bricksShattered') || 0
    const relic           = this.registry.get('selectedRelic')
    const shardsEarned    = this.registry.get('shardsEarned')    || 0
    const totalShards     = this.registry.get('totalShards')     || 0

    // ── Background ──
    this.add.rectangle(0, 0, W, H, 0xf5f0e4).setOrigin(0, 0)
    this.drawPaperTexture()

    // ── Items array — used for staggered fade-in ──
    // Each item starts invisible (setAlpha(0)) and fades in with a delay
    const items = []

    // ── Title ──
    items.push(this.add.text(W / 2, H * 0.09, 'The Void Wins.', {
      fontFamily: 'Georgia, serif',
      fontSize:   Math.round(W * 0.085) + 'px',
      color:      '#2a1f0e'
    }).setOrigin(0.5).setAlpha(0))

    // ── Random poem ──
    const poem = DEATH_POEMS[Math.floor(Math.random() * DEATH_POEMS.length)]
    items.push(this.add.text(W / 2, H * 0.21, poem, {
      fontFamily:  'Georgia, serif',
      fontSize:    Math.round(W * 0.036) + 'px',
      color:       '#8a7a6a',
      fontStyle:   'italic',
      align:       'center',
      lineSpacing: 6
    }).setOrigin(0.5).setAlpha(0))

    // ── Stats card ──
    const cardX = W * 0.07, cardY = H * 0.32
    const cardW = W * 0.86, cardH = H * 0.3

    const cardBg = this.add.graphics().setAlpha(0)
    cardBg.fillStyle(0xfaf6ee, 1)
    cardBg.fillRoundedRect(cardX, cardY, cardW, cardH, 10)
    cardBg.lineStyle(1, 0xc4a882, 1)
    cardBg.strokeRoundedRect(cardX, cardY, cardW, cardH, 10)
    items.push(cardBg)

    // ── Stat rows ──
    const stats = [
      { label: 'score',            value: score.toLocaleString() },
      { label: 'rooms cleared',    value: `${roomsCleared} / 4` },
      { label: 'bricks shattered', value: bricksShattered.toLocaleString() },
      { label: 'relic used',       value: relic ? relic.name : '—' },
    ]

    stats.forEach((s, i) => {
      // Vertical position: evenly spaced within the card
      const y = cardY + cardH * 0.15 + i * (cardH * 0.22)

      // Label (left aligned, muted color)
      items.push(this.add.text(cardX + W * 0.06, y, s.label, {
        fontFamily: 'Georgia, serif',
        fontSize:   Math.round(W * 0.036) + 'px',
        color:      '#8a7a6a'
      }).setOrigin(0, 0.5).setAlpha(0))

      // Value (right aligned, dark ink)
      items.push(this.add.text(cardX + cardW - W * 0.06, y, s.value, {
        fontFamily: 'Georgia, serif',
        fontSize:   Math.round(W * 0.038) + 'px',
        color:      '#2a1f0e'
      }).setOrigin(1, 0.5).setAlpha(0))

      // Thin divider line between rows (not after the last row)
      if (i < stats.length - 1) {
        const div = this.add.graphics().setAlpha(0)
        div.lineStyle(1, 0xe8e0d0, 1)
        div.lineBetween(
          cardX + W * 0.04, y + cardH * 0.11,
          cardX + cardW - W * 0.04, y + cardH * 0.11
        )
        items.push(div)
      }
    })

    // ── Shards earned ──
    // A subtle highlighted row below the stats card
    const sx = W * 0.07, sy = H * 0.64, sw = W * 0.86, sh = H * 0.075
    const shardsBox = this.add.graphics().setAlpha(0)
    shardsBox.fillStyle(0x2a1f0e, 0.06)
    shardsBox.fillRoundedRect(sx, sy, sw, sh, 8)
    shardsBox.lineStyle(1, 0xc4a882, 0.5)
    shardsBox.strokeRoundedRect(sx, sy, sw, sh, 8)
    items.push(shardsBox)

    items.push(this.add.text(W / 2, sy + sh / 2,
      `+${shardsEarned} shards earned  ·  ${totalShards} total`, {
      fontFamily: 'Georgia, serif',
      fontSize:   Math.round(W * 0.032) + 'px',
      color:      '#6a5a4a',
      fontStyle:  'italic'
    }).setOrigin(0.5).setAlpha(0))

    // ── Buttons ──
    // Two options side by side: try again (primary) and workshop (secondary)
    const btnY = H * 0.78

    const retryBtn = this.add.text(W / 2 - W * 0.22, btnY, 'try again', {
      fontFamily:      'Georgia, serif',
      fontSize:        Math.round(W * 0.042) + 'px',
      color:           '#f5f0e4',
      backgroundColor: '#2a1f0e',
      padding:         { x: 18, y: 10 }
    }).setOrigin(0.5).setAlpha(0).setInteractive({ useHandCursor: true })

    const workshopBtn = this.add.text(W / 2 + W * 0.22, btnY, 'workshop', {
      fontFamily:      'Georgia, serif',
      fontSize:        Math.round(W * 0.042) + 'px',
      color:           '#2a1f0e',
      backgroundColor: '#e8e0d0',
      padding:         { x: 18, y: 10 }
    }).setOrigin(0.5).setAlpha(0).setInteractive({ useHandCursor: true })

    retryBtn.on('pointerdown', () => {
      this.cameras.main.fadeOut(250, 245, 240, 228)
      this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start('StartScene'))
    })
    retryBtn.on('pointerover',  () => retryBtn.setStyle({ backgroundColor: '#4a3020' }))
    retryBtn.on('pointerout',   () => retryBtn.setStyle({ backgroundColor: '#2a1f0e' }))

    workshopBtn.on('pointerdown', () => {
      this.cameras.main.fadeOut(250, 245, 240, 228)
      this.cameras.main.once('camerafadeoutcomplete', () => {
        this.scene.start('WorkshopScene', { returnTo: 'StartScene' })
      })
    })

    items.push(retryBtn, workshopBtn)

    // ── Footnote ──
    items.push(this.add.text(W / 2, H * 0.91, 'the void remembers nothing', {
      fontFamily: 'Georgia, serif',
      fontSize:   Math.round(W * 0.03) + 'px',
      color:      '#8a7a6a',
      fontStyle:  'italic'
    }).setOrigin(0.5).setAlpha(0))

    // ── Staggered fade-in ──
    // Each item fades in 80ms after the previous one
    // This creates a cascade effect where stats reveal one by one
    items.forEach((item, i) => {
      this.tweens.add({
        targets:  item,
        alpha:    1,
        duration: 300,
        delay:    150 + i * 80
      })
    })

    this.cameras.main.fadeIn(300, 245, 240, 228)
  }

  drawPaperTexture() {
    const g = this.add.graphics()
    g.lineStyle(1, 0xa08060, 0.04)
    for (let y = 0; y < this.scale.height; y += 4) {
      g.lineBetween(0, y, this.scale.width, y)
    }
  }
}