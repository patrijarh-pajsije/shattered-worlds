import * as Phaser from 'phaser'
import { WORLDS } from '../game/worlds.js'

// ─────────────────────────────────────────────────────────────────────────────
//  WorldClearScene.js — World complete celebration screen
//
//  Shown when the player defeats the boss and clears World 1 (The Void).
//  Displays the final run stats, shards earned, and routes to either
//  the next world (not yet built) or back to the start via Workshop.
//
//  Uses the same staggered fade-in pattern as DeathScene — items reveal
//  one by one for a sense of achievement.
//
//  FLOW: GameScene (boss clear) → WorldClearScene → StartScene or WorkshopScene
// ─────────────────────────────────────────────────────────────────────────────

export class WorldClearScene extends Phaser.Scene {
  constructor() {
    super({ key: 'WorldClearScene' })
  }

  create() {
    const W = this.scale.width
    const H = this.scale.height

    // ── Read run stats from registry ──
    const score           = this.registry.get('score')           || 0
    const bricksShattered = this.registry.get('bricksShattered') || 0
    const roomsCleared    = this.registry.get('roomsCleared')    || 0

    // ── Calculate shards ──
    // World Clear computes shards here (GameScene's endRun() handles death shards)
    const workshopData = this.registry.get('workshopData') || {}
    const baseShards   = roomsCleared * 12 + Math.floor(bricksShattered / 3)
    // Keen Eye Workshop upgrade adds 20% per level
    const bonusMult    = 1 + (workshopData.shardBonus || 0) * 0.2
    // Soft cap at 100 shards per run
    const shardsEarned = Math.round(Math.min(baseShards * bonusMult, 100))
    const totalShards  = (this.registry.get('totalShards') || 0) + shardsEarned

    // Save to registry so DeathScene doesn't double-count these shards
    this.registry.set('totalShards',  totalShards)
    this.registry.set('shardsEarned', shardsEarned)

    // ── Background ──
    this.add.rectangle(0, 0, W, H, 0xf5f0e4).setOrigin(0, 0)
    this.drawPaperTexture()

    // ── Items array for staggered fade-in ──
    const items = []

    // ── World complete label ──
    items.push(this.add.text(W / 2, H * 0.08, 'WORLD COMPLETE', {
      fontFamily:    'Georgia, serif',
      fontSize:      Math.round(W * 0.028) + 'px',
      color:         '#8a7a6a',
      letterSpacing: 3
    }).setOrigin(0.5).setAlpha(0))

    // ── Title ──
    items.push(this.add.text(W / 2, H * 0.2, 'The Void\nis Shattered.', {
      fontFamily:  'Georgia, serif',
      fontSize:    Math.round(W * 0.085) + 'px',
      color:       '#2a1f0e',
      align:       'center',
      lineSpacing: 6
    }).setOrigin(0.5).setAlpha(0))

    // ── Atmospheric quote ──
    items.push(this.add.text(W / 2, H * 0.4,
      '"You have broken the unbreakable.\nBut darkness has many layers."', {
      fontFamily:  'Georgia, serif',
      fontSize:    Math.round(W * 0.036) + 'px',
      color:       '#6a5a4a',
      fontStyle:   'italic',
      align:       'center',
      lineSpacing: 6
    }).setOrigin(0.5).setAlpha(0))

    // ── Stats card ──
    const cardX = W * 0.07, cardY = H * 0.5
    const cardW = W * 0.86, cardH = H * 0.2

    const cardBg = this.add.graphics().setAlpha(0)
    cardBg.fillStyle(0xfaf6ee, 1)
    cardBg.fillRoundedRect(cardX, cardY, cardW, cardH, 10)
    cardBg.lineStyle(1, 0xc4a882, 1)
    cardBg.strokeRoundedRect(cardX, cardY, cardW, cardH, 10)
    items.push(cardBg)

    // Two stat rows inside the card
    const s1y = cardY + cardH * 0.3
    const s2y = cardY + cardH * 0.7

    ;[
      { y: s1y, label: 'score',            value: score.toLocaleString() },
      { y: s2y, label: 'bricks shattered', value: bricksShattered.toLocaleString() },
    ].forEach(s => {
      items.push(this.add.text(cardX + W * 0.06, s.y, s.label, {
        fontFamily: 'Georgia, serif',
        fontSize:   Math.round(W * 0.036) + 'px',
        color:      '#8a7a6a'
      }).setOrigin(0, 0.5).setAlpha(0))

      items.push(this.add.text(cardX + cardW - W * 0.06, s.y, s.value, {
        fontFamily: 'Georgia, serif',
        fontSize:   Math.round(W * 0.038) + 'px',
        color:      '#2a1f0e'
      }).setOrigin(1, 0.5).setAlpha(0))
    })

    // ── Shards earned ──
    items.push(this.add.text(W / 2, H * 0.73,
      `+${shardsEarned} shards earned  ·  ${totalShards} total`, {
      fontFamily: 'Georgia, serif',
      fontSize:   Math.round(W * 0.032) + 'px',
      color:      '#6a5a4a',
      fontStyle:  'italic'
    }).setOrigin(0.5).setAlpha(0))

    // ── Next world teaser ──
    // Reminds the player there's more coming (World 2 — The Forge)
    // Determine next world (or "all clear" if on last world)
    const currentWorldId = this.registry.get('worldId') || 'void'
    const currentIdx     = WORLDS.findIndex(w => w.id === currentWorldId)
    const nextWorld      = WORLDS[currentIdx + 1]  // undefined if on last world
    const teaserText     = nextWorld
      ? `Next: ${nextWorld.subtitle} — ${nextWorld.name}`
      : 'All worlds shattered. You are the void.'

    items.push(this.add.text(W / 2, H * 0.8, teaserText, {
      fontFamily: 'Georgia, serif',
      fontSize:   Math.round(W * 0.031) + 'px',
      color:      '#8a7a6a',
      fontStyle:  'italic'
    }).setOrigin(0.5).setAlpha(0))

    // ── Buttons ──
    // Button label changes based on whether there's a next world
    const currentWorldId2 = this.registry.get('worldId') || 'void'
    const currentIdx2     = WORLDS.findIndex(w => w.id === currentWorldId2)
    const nextWorld2      = WORLDS[currentIdx2 + 1]
    const continueLabel   = nextWorld2 ? `enter ${nextWorld2.name}` : 'new run'

    const retBtn = this.add.text(W / 2 - W * 0.22, H * 0.89, continueLabel, {
      fontFamily:      'Georgia, serif',
      fontSize:        Math.round(W * 0.04) + 'px',
      color:           '#f5f0e4',
      backgroundColor: '#2a1f0e',
      padding:         { x: 16, y: 10 }
    }).setOrigin(0.5).setAlpha(0).setInteractive({ useHandCursor: true })

    const wsBtn = this.add.text(W / 2 + W * 0.22, H * 0.89, 'workshop', {
      fontFamily:      'Georgia, serif',
      fontSize:        Math.round(W * 0.04) + 'px',
      color:           '#2a1f0e',
      backgroundColor: '#e8e0d0',
      padding:         { x: 16, y: 10 }
    }).setOrigin(0.5).setAlpha(0).setInteractive({ useHandCursor: true })

    retBtn.on('pointerdown', () => {
      this.cameras.main.fadeOut(250, 245, 240, 228)
      this.cameras.main.once('camerafadeoutcomplete', () => {
        const currentWorldId = this.registry.get('worldId') || 'void'
        const currentIdx     = WORLDS.findIndex(w => w.id === currentWorldId)
        const nextWorld      = WORLDS[currentIdx + 1]

        if (nextWorld) {
          // Advance to next world — keep current upgrades and lives
          this.registry.set('worldId', nextWorld.id)
          this.scene.start('TransitionScene', { roomNum: 1, worldId: nextWorld.id })
        } else {
          // All worlds cleared — return to start for a new run
          this.scene.start('StartScene')
        }
      })
    })
    retBtn.on('pointerover',  () => retBtn.setStyle({ backgroundColor: '#4a3020' }))
    retBtn.on('pointerout',   () => retBtn.setStyle({ backgroundColor: '#2a1f0e' }))

    wsBtn.on('pointerdown', () => {
      this.cameras.main.fadeOut(250, 245, 240, 228)
      this.cameras.main.once('camerafadeoutcomplete', () => {
        this.scene.start('WorkshopScene', { returnTo: 'StartScene' })
      })
    })

    items.push(retBtn, wsBtn)

    // ── Staggered fade-in ──
    items.forEach((item, i) => {
      this.tweens.add({
        targets:  item,
        alpha:    1,
        duration: 350,
        delay:    200 + i * 100  // 100ms between each item
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