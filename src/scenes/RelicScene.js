import * as Phaser from 'phaser'
import { Audio } from '../game/audio.js'

// ─────────────────────────────────────────────────────────────────────────────
//  RelicScene.js — Starting relic selection
//
//  The player chooses 1 of 3 relics before entering the first room.
//  Relics define the player's identity for the entire run — they affect
//  ball size, paddle behavior, physics, and more.
//
//  3 random relics are shown from the unlocked pool (relics.js).
//  Workshop purchases can add new relics to this pool.
//
//  FLOW: StartScene → RelicScene → TransitionScene (room 1)
// ─────────────────────────────────────────────────────────────────────────────

import { getRelicChoices } from '../game/relics.js'

export class RelicScene extends Phaser.Scene {
  constructor() {
    super({ key: 'RelicScene' })
  }

  create() {
    const W = this.scale.width
    const H = this.scale.height

    // ── Background ──
    this.add.rectangle(0, 0, W, H, 0xf5f0e4).setOrigin(0, 0)
    this.drawPaperTexture()

    // ── Header ──
    this.add.text(W / 2, H * 0.06, 'WORLD 1 — THE VOID', {
      fontFamily:    'Georgia, serif',
      fontSize:      Math.round(W * 0.03) + 'px',
      color:         '#8a7a6a',
      letterSpacing: 3
    }).setOrigin(0.5)

    this.add.text(W / 2, H * 0.13, 'choose your relic', {
      fontFamily: 'Georgia, serif',
      fontSize:   Math.round(W * 0.065) + 'px',
      color:      '#2a1f0e'
    }).setOrigin(0.5)

    this.add.text(W / 2, H * 0.19, 'your starting identity for this run', {
      fontFamily: 'Georgia, serif',
      fontSize:   Math.round(W * 0.034) + 'px',
      color:      '#8a7a6a',
      fontStyle:  'italic'
    }).setOrigin(0.5)

    // ── Relic cards ──
    // Read Workshop data to determine which extra relics have been unlocked
    const workshopData = this.registry.get('workshopData') || {}
    // Get 3 random relics from the unlocked pool
    const relics = getRelicChoices(3, workshopData)
    relics.forEach((relic, i) => this.createCard(relic, W, H, i))

    this.cameras.main.fadeIn(250, 245, 240, 228)
  }

  // ─────────────────────────────────────────────────────────────────────────
  //  CREATE CARD
  //  Builds one relic selection card.
  //
  //  Each card has:
  //    - Background (hover-responsive)
  //    - Large icon character (left side)
  //    - Relic name
  //    - Description
  //    - Strategic hint (✦ prefix, muted color)
  //    - Invisible hit zone for tap detection
  // ─────────────────────────────────────────────────────────────────────────
  createCard(relic, W, H, index) {
    const cardX = W * 0.05
    const cardW = W * 0.9
    const cardH = H * 0.18
    // Stack cards vertically with small gaps
    const cardY = H * 0.27 + index * (cardH + H * 0.025)

    // Card background
    const bg = this.add.graphics()
    this.drawCard(bg, cardX, cardY, cardW, cardH, false)

    // ── Icon ──
    // Large Unicode symbol on the left side of the card
    this.add.text(cardX + W * 0.07, cardY + cardH / 2, relic.icon, {
      fontFamily: 'Georgia, serif',
      fontSize:   Math.round(W * 0.07) + 'px',
      color:      '#2a1f0e'
    }).setOrigin(0.5)  // Centered on its position

    // ── Name ──
    // Positioned in the upper portion of the text area (right of divider)
    this.add.text(cardX + W * 0.15, cardY + cardH * 0.28, relic.name, {
      fontFamily: 'Georgia, serif',
      fontSize:   Math.round(W * 0.042) + 'px',
      color:      '#2a1f0e'
    }).setOrigin(0, 0.5)

    // ── Description ──
    // wordWrap ensures long descriptions wrap within the card bounds
    this.add.text(cardX + W * 0.15, cardY + cardH * 0.62, relic.desc, {
      fontFamily: 'Georgia, serif',
      fontSize:   Math.round(W * 0.03) + 'px',
      color:      '#6a5a4a',
      wordWrap:   { width: cardW * 0.78 }
    }).setOrigin(0, 0.5)

    // ── Hint ──
    // Only shown if the relic has a hint defined
    // Gives strategic advice at a glance — muted so it doesn't compete with the description
    if (relic.hint) {
      this.add.text(cardX + W * 0.15, cardY + cardH * 0.88, '✦ ' + relic.hint, {
        fontFamily: 'Georgia, serif',
        fontSize:   Math.round(W * 0.026) + 'px',
        color:      '#8a7a6a',
        fontStyle:  'italic',
        wordWrap:   { width: cardW * 0.78 }
      }).setOrigin(0, 0.5)
    }

    // ── Hit zone ──
    const zone = this.add.zone(cardX, cardY, cardW, cardH).setOrigin(0, 0).setInteractive()

    zone.on('pointerdown', () => {
      // Store the chosen relic in the registry — GameScene reads this
      Audio.init()           // Ensure audio context is ready
      Audio.relicSelect()    // Warm confirmatory tone
      this.registry.set('selectedRelic', relic)

      this.cameras.main.fadeOut(200, 245, 240, 228)
      this.cameras.main.once('camerafadeoutcomplete', () => {
        // Go to the transition screen for room 1
        // Start with World 1 (The Void) — worldId passed to all subsequent scenes
        this.scene.start('TransitionScene', { roomNum: 1, worldId: 'void' })
      })
    })

    zone.on('pointerover', () => { bg.clear(); this.drawCard(bg, cardX, cardY, cardW, cardH, true) })
    zone.on('pointerout',  () => { bg.clear(); this.drawCard(bg, cardX, cardY, cardW, cardH, false) })
  }

  // Draws the card background and border (hover-responsive)
  drawCard(g, x, y, w, h, hover) {
    g.fillStyle(hover ? 0xf0ead8 : 0xfaf6ee, 1)
    g.fillRoundedRect(x, y, w, h, 10)
    g.lineStyle(hover ? 2 : 1.5, hover ? 0x8a6a3a : 0xc4a882, 1)
    g.strokeRoundedRect(x, y, w, h, 10)
  }

  drawPaperTexture() {
    const g = this.add.graphics()
    g.lineStyle(1, 0xa08060, 0.04)
    for (let y = 0; y < this.scale.height; y += 4) {
      g.lineBetween(0, y, this.scale.width, y)
    }
  }
}