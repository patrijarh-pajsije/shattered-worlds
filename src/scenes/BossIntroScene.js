// ─────────────────────────────────────────────────────────────────────────────
//  BossIntroScene.js — Dramatic boss reveal screen
//  Now world-aware: shows the correct boss name and lore for the current world.
//  See CLAUDE.md for project rules and conventions.
// ─────────────────────────────────────────────────────────────────────────────

import * as Phaser from 'phaser'
import { getWorld } from '../game/worlds.js'

export class BossIntroScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BossIntroScene' })
  }

  // Receives worldId from TransitionScene
  init(data) {
    this.worldId = data.worldId || 'void'  // Which world's boss to show
    this.world   = getWorld(this.worldId)  // Full world definition
  }

  create() {
    const W = this.scale.width
    const H = this.scale.height

    // Very dark near-black background — tinted slightly by world color
    // Pure near-black creates maximum drama before gameplay begins
    this.add.rectangle(0, 0, W, H, 0x1a1208).setOrigin(0, 0)

    // All elements start invisible — staggered fade-in creates reveal sequence
    const label = this.add.text(W / 2, H * 0.22, 'BOSS ROOM', {
      fontFamily:    'Georgia, serif',
      fontSize:      Math.round(W * 0.028) + 'px',
      color:         '#8a7a6a',
      letterSpacing: 4
    }).setOrigin(0.5).setAlpha(0)

    // World label — tells player which world this boss belongs to
    const worldLabel = this.add.text(W / 2, H * 0.30, this.world.subtitle, {
      fontFamily:    'Georgia, serif',
      fontSize:      Math.round(W * 0.024) + 'px',
      color:         '#6a5a4a',
      letterSpacing: 3
    }).setOrigin(0.5).setAlpha(0)

    // Boss name — large and prominent
    const name = this.add.text(W / 2, H * 0.40, this.world.bossName, {
      fontFamily: 'Georgia, serif',
      fontSize:   Math.round(W * 0.12) + 'px',
      color:      '#f5f0e4'
    }).setOrigin(0.5).setAlpha(0)

    // Boss lore quote — italic, atmospheric
    const quote = this.add.text(W / 2, H * 0.57, this.world.bossQuote, {
      fontFamily:  'Georgia, serif',
      fontSize:    Math.round(W * 0.036) + 'px',
      color:       '#a89a8a',
      fontStyle:   'italic',
      align:       'center',
      lineSpacing: 8
    }).setOrigin(0.5).setAlpha(0)

    // Boss mechanic hint — amber color signals gameplay-critical info
    const mechHint = this.add.text(W / 2, H * 0.69, this.world.bossMechanic, {
      fontFamily:  'Georgia, serif',
      fontSize:    Math.round(W * 0.030) + 'px',
      color:       '#c4a060',
      fontStyle:   'italic',
      align:       'center',
      wordWrap:    { width: W * 0.78 }
    }).setOrigin(0.5).setAlpha(0)

    // Face it button — only appears last so player reads the lore first
    const btn = this.add.text(W / 2, H * 0.80, 'face it', {
      fontFamily:      'Georgia, serif',
      fontSize:        Math.round(W * 0.048) + 'px',
      color:           '#f5f0e4',
      backgroundColor: '#2a1f0e',
      padding:         { x: 28, y: 12 }
    }).setOrigin(0.5).setAlpha(0).setInteractive({ useHandCursor: true })

    btn.on('pointerdown', () => {
      this.cameras.main.fadeOut(200, 26, 18, 8)
      this.cameras.main.once('camerafadeoutcomplete', () => {
        // Start boss room — pass worldId so GameScene knows which boss to build
        this.scene.start('GameScene', {
          roomNum: 4,
          worldId: this.worldId,
          isBoss:  true
        })
      })
    })

    // Staggered fade-ins — each element 120-400ms after the previous
    this.tweens.add({ targets: label,     alpha: 1, duration: 400, delay: 200 })
    this.tweens.add({ targets: worldLabel,alpha: 1, duration: 400, delay: 400 })
    this.tweens.add({ targets: name,      alpha: 1, duration: 600, delay: 700 })
    this.tweens.add({ targets: quote,     alpha: 1, duration: 600, delay: 1100 })
    this.tweens.add({ targets: mechHint,  alpha: 1, duration: 400, delay: 1600 })
    this.tweens.add({ targets: btn,       alpha: 1, duration: 400, delay: 2000 })

    this.cameras.main.fadeIn(300, 26, 18, 8)
  }
}