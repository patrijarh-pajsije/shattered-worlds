// ─────────────────────────────────────────────────────────────────────────────
//  TransitionScene.js — Atmospheric screen shown before each room
//  Now world-aware: reads worldId from registry to show correct text/colors.
//  See CLAUDE.md for project rules and conventions.
// ─────────────────────────────────────────────────────────────────────────────

import * as Phaser from 'phaser'
import { getWorld } from '../game/worlds.js'

export class TransitionScene extends Phaser.Scene {
  constructor() {
    super({ key: 'TransitionScene' })
  }

  // Receives roomNum and worldId from the calling scene
  init(data) {
    this.roomNum = data.roomNum  || 1       // Which room (1-4)
    this.worldId = data.worldId  || 'void'  // Which world we're in
    this.isBoss  = this.roomNum === 4       // Room 4 = boss room
    this.world   = getWorld(this.worldId)   // Full world definition from worlds.js
  }

  create() {
    const W = this.scale.width
    const H = this.scale.height

    // Write both roomNum and worldId to registry — GameScene needs both
    this.registry.set('roomNum', this.roomNum)
    this.registry.set('worldId', this.worldId)

    // Dark background tinted by world palette (The Forge is warmer than The Void)
    this.add.rectangle(0, 0, W, H, this.world.palette.ink).setOrigin(0, 0)

    // Subtle paper texture on dark background
    const g = this.add.graphics()
    g.lineStyle(1, 0xffffff, 0.02)
    for (let y = 0; y < H; y += 5) g.lineBetween(0, y, W, y)

    // World name label (e.g. "THE FORGE")
    this.add.text(W / 2, H * 0.26, this.world.name.toUpperCase(), {
      fontFamily:    'Georgia, serif',
      fontSize:      Math.round(W * 0.028) + 'px',
      color:         '#8a7a6a',
      letterSpacing: 4
    }).setOrigin(0.5)

    // Room title: "Room X of 3" or "Boss Room"
    const title = this.isBoss ? 'Boss Room' : `Room ${this.roomNum} of 3`
    this.add.text(W / 2, H * 0.37, title, {
      fontFamily: 'Georgia, serif',
      fontSize:   Math.round(W * 0.1) + 'px',
      color:      '#f5f0e4'
    }).setOrigin(0.5)

    // On room 1 of a world with a mechanic, show the mechanic description as introduction
    const showMechanic = this.world.mechanic && this.roomNum === 1 && this.world.mechanicDesc
    if (showMechanic) {
      this.add.text(W / 2, H * 0.50, this.world.mechanicDesc, {
        fontFamily:  'Georgia, serif',
        fontSize:    Math.round(W * 0.032) + 'px',
        color:       '#c4a060',  // Amber — signals important gameplay info
        fontStyle:   'italic',
        align:       'center',
        wordWrap:    { width: W * 0.75 }
      }).setOrigin(0.5)
    }

    // Atmospheric flavour text — pushed down if mechanic description is also showing
    const atmoY = showMechanic ? H * 0.63 : H * 0.54
    const atmo  = this.world.atmos[this.roomNum - 1] || ''
    this.add.text(W / 2, atmoY, atmo, {
      fontFamily:  'Georgia, serif',
      fontSize:    Math.round(W * 0.036) + 'px',
      color:       '#a89a8a',
      fontStyle:   'italic',
      align:       'center',
      lineSpacing: 8,
      wordWrap:    { width: W * 0.75 }
    }).setOrigin(0.5)

    // Tap hint — fades in after 500ms so player reads first
    const hint = this.add.text(W / 2, H * 0.78, 'tap to enter', {
      fontFamily: 'Georgia, serif',
      fontSize:   Math.round(W * 0.032) + 'px',
      color:      '#6a5a4a'
    }).setOrigin(0.5).setAlpha(0)
    this.tweens.add({ targets: hint, alpha: 1, duration: 600, delay: 500, ease: 'Power2' })

    // Decorative divider line
    const div = this.add.graphics()
    div.lineStyle(1, 0x6a5a4a, 0.5)
    div.lineBetween(W * 0.35, H * 0.46, W * 0.65, H * 0.46)

    // Tap to proceed — input.once fires only on first tap
    this.input.once('pointerdown', () => {
      this.cameras.main.fadeOut(200, 42, 31, 14)
      this.cameras.main.once('camerafadeoutcomplete', () => {
        if (this.isBoss) {
          // Boss room: show dramatic intro screen first
          this.scene.start('BossIntroScene', { worldId: this.worldId })
        } else {
          // Normal room: go straight to gameplay
          this.scene.start('GameScene', {
            roomNum: this.roomNum,
            worldId: this.worldId,
            isBoss:  false
          })
        }
      })
    })

    this.cameras.main.fadeIn(300, 42, 31, 14)
  }
}