import * as Phaser from 'phaser'

// ─────────────────────────────────────────────────────────────────────────────
//  WorkshopScene.js — Permanent meta-progression screen
//
//  The Workshop is where players spend shards earned from runs to unlock
//  permanent upgrades. Unlike run upgrades, Workshop purchases persist
//  across ALL runs and are saved to localStorage.
//
//  DESIGN PHILOSOPHY:
//  The Workshop sells OPTIONS, not power. You can complete the game on the
//  first run in theory — the Workshop just adds variety and light convenience.
//  No purchase should feel mandatory.
//
//  SAVE FORMAT:
//  Workshop data is saved to localStorage under SAVE_KEY as a JSON object:
//    { extraLife: 1, widerPaddle: 2, reroll: 1, ... }
//  Values are the purchased level (0 = not purchased).
//
//  FLOW: DeathScene or WorldClearScene → WorkshopScene → StartScene
//
//  DATA RECEIVED:
//    data.returnTo — which scene to go back to ('StartScene')
// ─────────────────────────────────────────────────────────────────────────────

// ── Workshop upgrade definitions ──
// Each entry defines a purchasable upgrade.
//   id       — key used in the save data object
//   name     — display name
//   desc     — what the upgrade does
//   cost     — shard cost per purchase
//   maxLevel — how many times this can be purchased (1 = one-time, 2 = two levels)
//   category — groups upgrades visually on screen
const WORKSHOP_UPGRADES = [
  {
    id:       'extraLife',
    name:     'Iron Will',
    desc:     'Start every run with 4 lives instead of 3.',
    cost:     80,
    maxLevel: 1,
    category: 'stat'
  },
  {
    id:       'widerPaddle',
    name:     'Wider Grip',
    desc:     'Default paddle is 15% wider at the start of every run.',
    cost:     60,
    maxLevel: 2,
    category: 'stat'
  },
  {
    id:       'reroll',
    name:     'Second Thoughts',
    desc:     'Unlock the ability to reroll your upgrade draft once per run.',
    cost:     100,
    maxLevel: 1,
    category: 'mechanic'
  },
  {
    id:       'relicMirror',
    name:     'Unlock: The Mirror',
    desc:     'Adds The Mirror relic to the pool — two mirrored balls, one paddle.',
    cost:     120,
    maxLevel: 1,
    category: 'relic'
  },
  {
    id:       'relicCartographer',
    name:     'Unlock: The Cartographer',
    desc:     'Adds The Cartographer relic — reveals optimal shot trajectory at room start.',
    cost:     150,
    maxLevel: 1,
    category: 'relic'
  },
  {
    id:       'shardBonus',
    name:     'Keen Eye',
    desc:     'Earn 20% more shards at the end of each run.',
    cost:     70,
    maxLevel: 2,
    category: 'economy'
  },

  // ── DIAMOND-ONLY UPGRADES ──
  // These require the premium diamond currency dropped by bosses.
  // More powerful than shard upgrades.
  {
    id:         'extraLives',
    name:       'Resilience',
    desc:       'Start every run with 5 lives instead of 3.',
    cost:       3,
    maxLevel:   1,
    category:   'premium',
    diamond:    true   // Costs diamonds, not shards
  },
  {
    id:         'diamondReroll',
    name:       'Foresight',
    desc:       'Reroll your upgrade draft up to 3 times per run (instead of once).',
    cost:       2,
    maxLevel:   1,
    category:   'premium',
    diamond:    true
  },
  {
    id:         'startingUpgrade',
    name:       'Head Start',
    desc:       'Begin each run with one random Common upgrade already owned.',
    cost:       4,
    maxLevel:   1,
    category:   'premium',
    diamond:    true
  },
  {
    id:         'bossShield',
    name:       'Last Stand',
    desc:       'Once per run, survive a killing blow with 1 life remaining.',
    cost:       5,
    maxLevel:   1,
    category:   'premium',
    diamond:    true
  },
]

// Display labels for each category section header
const CATEGORY_LABELS = {
  stat:     'Permanent stats',
  mechanic: 'Run mechanics',
  relic:    'New relics',
  economy:  'Shard economy',
  premium:  '◆ Diamond upgrades'  // Premium tier — requires diamond currency from boss drops
}

// localStorage key where Workshop data is saved
const SAVE_KEY = 'shattered_worlds_workshop'

// ── Save/load helpers ──
// Wrapped in try/catch because localStorage can fail in private browsing mode

function loadWorkshop() {
  try {
    // JSON.parse converts the stored string back to an object.
    // We sanitize values so corrupted saves do not break upgrade math.
    const raw = JSON.parse(localStorage.getItem(SAVE_KEY)) || {}
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return {}
    const clean = {}
    for (const [k, v] of Object.entries(raw)) {
      if (Number.isFinite(v) && v >= 0) clean[k] = Math.floor(v)
    }
    return clean
  } catch {
    return {}  // Return empty object if load fails (private browsing, etc.)
  }
}

function saveWorkshop(data) {
  try {
    // JSON.stringify converts the object to a string for storage
    localStorage.setItem(SAVE_KEY, JSON.stringify(data))
  } catch {
    // Silently fail — data won't persist but the game continues
  }
}

export class WorkshopScene extends Phaser.Scene {
  constructor() {
    super({ key: 'WorkshopScene' })
  }

  init(data) {
    // Which scene to return to when "back" is pressed
    this.returnTo = data.returnTo || 'StartScene'
  }

  create() {
    const W = this.scale.width
    const H = this.scale.height
    this.W  = W
    this.H  = H

    // Load persistent Workshop data from localStorage
    this.workshopData = loadWorkshop()

    // Also store in registry so other scenes (RelicScene, GameScene) can read it
    // without needing to call loadWorkshop() themselves
    this.registry.set('workshopData', this.workshopData)

    // Current shard total from the registry
    this.shards = this.registry.get('totalShards') || 0

    // ── Background ──
    this.add.rectangle(0, 0, W, H, 0xf5f0e4).setOrigin(0, 0)
    this.drawPaperTexture()

    // ── Header ──
    this.add.text(W / 2, H * 0.05, 'THE WORKSHOP', {
      fontFamily:    'Georgia, serif',
      fontSize:      Math.round(W * 0.03) + 'px',
      color:         '#8a7a6a',
      letterSpacing: 3
    }).setOrigin(0.5)

    this.add.text(W / 2, H * 0.11, 'Permanent upgrades', {
      fontFamily: 'Georgia, serif',
      fontSize:   Math.round(W * 0.065) + 'px',
      color:      '#2a1f0e'
    }).setOrigin(0.5)

    // Diamond counter — shown next to shards
    const diamonds = this.registry.get('totalDiamonds') || 0
    this.diamondsText = this.add.text(W * 0.72, H * 0.18, `◆ ${diamonds}`, {
      fontFamily: 'Georgia, serif',
      fontSize:   Math.round(W * 0.036) + 'px',
      color:      '#1840a0',   // Blue — matches diamond color in gameplay
      fontStyle:  'italic'
    }).setOrigin(0.5)

    // Shard counter — updates after each purchase
    this.shardsText = this.add.text(W * 0.30, H * 0.18, `${this.shards} shards`, {
      fontFamily: 'Georgia, serif',
      fontSize:   Math.round(W * 0.038) + 'px',
      color:      '#8a7a6a',
      fontStyle:  'italic'
    }).setOrigin(0.5)

    // Cards group — used to clear and redraw after purchases
    this.cardGroup = this.add.group()
    this.drawCards()

    // ── Navigation buttons ──
    // "New run" starts a fresh run immediately — the primary action after spending shards
    const newRunBtn = this.add.text(W / 2 - W * 0.22, H * 0.93, 'new run', {
      fontFamily:      'Georgia, serif',
      fontSize:        Math.round(W * 0.042) + 'px',
      color:           '#f5f0e4',
      backgroundColor: '#2a1f0e',
      padding:         { x: 20, y: 10 }
    }).setOrigin(0.5).setInteractive({ useHandCursor: true })

    // "Back" returns to wherever called the Workshop (StartScene title screen)
    const backBtn = this.add.text(W / 2 + W * 0.22, H * 0.93, 'back', {
      fontFamily:      'Georgia, serif',
      fontSize:        Math.round(W * 0.042) + 'px',
      color:           '#2a1f0e',
      backgroundColor: '#e8e0d0',
      padding:         { x: 20, y: 10 }
    }).setOrigin(0.5).setInteractive({ useHandCursor: true })

    newRunBtn.on('pointerdown', () => {
      this.cameras.main.fadeOut(200, 245, 240, 228)
      this.cameras.main.once('camerafadeoutcomplete', () => {
        this.scene.start('StartScene')  // StartScene resets run state then shows title
      })
    })
    newRunBtn.on('pointerover',  () => newRunBtn.setStyle({ backgroundColor: '#4a3020' }))
    newRunBtn.on('pointerout',   () => newRunBtn.setStyle({ backgroundColor: '#2a1f0e' }))

    backBtn.on('pointerdown', () => {
      this.cameras.main.fadeOut(200, 245, 240, 228)
      this.cameras.main.once('camerafadeoutcomplete', () => {
        this.scene.start(this.returnTo)  // Go back to wherever called us
      })
    })

    this.cameras.main.fadeIn(250, 245, 240, 228)
  }

  // ─────────────────────────────────────────────────────────────────────────
  //  DRAW CARDS
  //  Renders all Workshop upgrade cards, grouped by category.
  //  Called on create() and after each purchase (to refresh states).
  //  Uses this.cardGroup to track all created objects so they can be
  //  cleared and redrawn when a purchase is made.
  // ─────────────────────────────────────────────────────────────────────────
  drawCards() {
    // Destroy all previously created card objects
    this.cardGroup.clear(true, true)  // true = destroy children, true = remove from scene

    const W = this.W, H = this.H
    const cardX  = W * 0.05
    const cardW  = W * 0.9
    const cardH  = H * 0.11
    const startY = H * 0.24
    const gap    = H * 0.015  // Vertical gap between cards

    // Get unique categories in their defined order
    const categories = [...new Set(WORKSHOP_UPGRADES.map(u => u.category))]

    let currentY = startY

    for (const cat of categories) {
      const items = WORKSHOP_UPGRADES.filter(u => u.category === cat)

      // ── Category label ──
      const catLabel = this.add.text(cardX, currentY, CATEGORY_LABELS[cat] || cat, {
        fontFamily: 'Georgia, serif',
        fontSize:   Math.round(W * 0.028) + 'px',
        color:      '#8a7a6a',
        fontStyle:  'italic'
      }).setOrigin(0, 0)
      this.cardGroup.add(catLabel)
      currentY += H * 0.04  // Space after category label

      for (const upgrade of items) {
        const level     = this.workshopData[upgrade.id] || 0
        const maxed     = level >= upgrade.maxLevel
        // Diamond upgrades check diamond balance; shard upgrades check shard balance
        const canAfford = upgrade.diamond
          ? (this.registry.get('totalDiamonds') || 0) >= upgrade.cost
          : this.shards >= upgrade.cost

        // ── Card background ──
        const bg = this.add.graphics()
        this.drawCard(bg, cardX, currentY, cardW, cardH, maxed, canAfford)
        this.cardGroup.add(bg)

        // ── Upgrade name ──
        const nameText = this.add.text(
          cardX + W * 0.04,
          currentY + cardH * 0.28,
          upgrade.name, {
          fontFamily: 'Georgia, serif',
          fontSize:   Math.round(W * 0.04) + 'px',
          color:      maxed ? '#8a7a6a' : '#2a1f0e'  // Muted when maxed
        }).setOrigin(0, 0.5)
        this.cardGroup.add(nameText)

        // ── Description ──
        const descText = this.add.text(
          cardX + W * 0.04,
          currentY + cardH * 0.68,
          upgrade.desc, {
          fontFamily: 'Georgia, serif',
          fontSize:   Math.round(W * 0.028) + 'px',
          color:      '#6a5a4a',
          wordWrap:   { width: cardW * 0.65 }
        }).setOrigin(0, 0.5)
        this.cardGroup.add(descText)

        // ── Level indicator (for multi-level upgrades) ──
        if (upgrade.maxLevel > 1) {
          const levelText = this.add.text(
            cardX + cardW - W * 0.04,
            currentY + cardH * 0.28,
            `${level}/${upgrade.maxLevel}`, {
            fontFamily: 'Georgia, serif',
            fontSize:   Math.round(W * 0.032) + 'px',
            color:      '#8a7a6a'
          }).setOrigin(1, 0.5)
          this.cardGroup.add(levelText)
        }

        // ── Cost / maxed indicator ──
        // Shows shard cost (grey if can't afford) or a green "maxed" badge
        const costLabel = maxed ? 'maxed' : upgrade.diamond ? `◆ ${upgrade.cost}` : `${upgrade.cost} shards`
        const costColor = maxed ? '#27500A' : (canAfford ? '#2a1f0e' : '#c0a080')
        const costBg    = maxed ? '#EAF3DE' : undefined  // Green background for maxed badge

        const costText = this.add.text(
          cardX + cardW - W * 0.04,
          currentY + cardH * 0.68,
          costLabel, {
          fontFamily:      'Georgia, serif',
          fontSize:        Math.round(W * 0.032) + 'px',
          color:           costColor,
          backgroundColor: costBg,
          padding:         maxed ? { x: 6, y: 2 } : undefined
        }).setOrigin(1, 0.5)
        this.cardGroup.add(costText)

        // ── Hit zone (only on unpurchased items) ──
        if (!maxed) {
          const zone = this.add.zone(cardX, currentY, cardW, cardH)
            .setOrigin(0, 0)
            .setInteractive()
          this.cardGroup.add(zone)

          // Closure captures the current `upgrade` and `currentY` values
          const capturedY    = currentY
          const capturedUpg  = upgrade

          zone.on('pointerdown', () => {
            if (!canAfford) {
              // Show which currency is insufficient
              if (capturedUpg.diamond) this.flashNotEnoughDiamonds()
              else this.flashNotEnoughShards()
              return
            }
            this.purchaseUpgrade(capturedUpg)
          })

          zone.on('pointerover', () => {
            if (canAfford) {
              bg.clear()
              this.drawCard(bg, cardX, capturedY, cardW, cardH, false, true, true)  // hover=true
            }
          })
          zone.on('pointerout', () => {
            bg.clear()
            this.drawCard(bg, cardX, capturedY, cardW, cardH, false, canAfford)
          })
        }

        currentY += cardH + gap
      }

      currentY += H * 0.02  // Extra space between categories
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  //  DRAW CARD
  //  Renders a single card background with appropriate visual state.
  //
  //  PARAMETERS:
  //    maxed    — green background/border when fully purchased
  //    canAfford — grey border when player can't afford it
  //    hover    — slightly darker background when hovering
  // ─────────────────────────────────────────────────────────────────────────
  drawCard(g, x, y, w, h, maxed, canAfford, hover = false) {
    // Fill color: green tint when maxed, hover tint when hovering, default cream
    const fillColor = maxed  ? 0xeaf3de
                    : hover  ? 0xf0ead8
                    :          0xfaf6ee

    // Border color: green when maxed, tan when affordable, grey when can't afford
    const borderColor = maxed      ? 0x3b6d11
                      : canAfford  ? (hover ? 0x8a6a3a : 0xc4a882)
                      :              0xd8d0c0  // Desaturated when unaffordable

    g.fillStyle(fillColor, 1)
    g.fillRoundedRect(x, y, w, h, 8)
    g.lineStyle(maxed ? 1.5 : 1, borderColor, 1)
    g.strokeRoundedRect(x, y, w, h, 8)
  }

  // ─────────────────────────────────────────────────────────────────────────
  //  PURCHASE UPGRADE
  //  Applies a purchase: deducts shards, increments level, saves, redraws.
  // ─────────────────────────────────────────────────────────────────────────
  purchaseUpgrade(upgrade) {
    const currentLevel = this.workshopData[upgrade.id] || 0
    this.workshopData[upgrade.id] = currentLevel + 1  // Increment level

    if (upgrade.diamond) {
      // Deduct diamonds for premium upgrades
      const diamonds = (this.registry.get('totalDiamonds') || 0) - upgrade.cost
      this.registry.set('totalDiamonds', Math.max(0, diamonds))
      if (this.diamondsText) this.diamondsText.setText(`◆ ${Math.max(0, diamonds)}`)
    } else {
      this.shards -= upgrade.cost  // Deduct shards for standard upgrades
    }

    // Persist to localStorage immediately after purchase
    saveWorkshop(this.workshopData)

    // Update registry so other scenes see the new Workshop state
    this.registry.set('workshopData', this.workshopData)
    this.registry.set('totalShards',  this.shards)

    // Brief white flash to confirm the purchase
    const flash = this.add.rectangle(this.W / 2, this.H / 2, this.W, this.H, 0xf5f0e4, 0)
    this.tweens.add({
      targets:    flash,
      alpha:      0.4,
      duration:   80,
      yoyo:       true,  // yoyo: plays forward then backward (flash and fade)
      onComplete: () => {
        flash.destroy()
        // Update shard counter text
        this.shardsText.setText(`${this.shards} shards`)
        // Redraw all cards to reflect new purchase state
        this.drawCards()
      }
    })
  }

  // Flashes the shard counter red to indicate insufficient funds
  flashNotEnoughShards() {
    this.shardsText.setColor('#a02010')  // Red — not enough shards
    this.time.delayedCall(600, () => this.shardsText.setColor('#8a7a6a'))
  }

  flashNotEnoughDiamonds() {
    if (this.diamondsText) {
      this.diamondsText.setColor('#a02010')  // Red — not enough diamonds
      this.time.delayedCall(600, () => this.diamondsText.setColor('#1840a0'))
    }
  }

  drawPaperTexture() {
    const g = this.add.graphics()
    g.lineStyle(1, 0xa08060, 0.04)
    for (let y = 0; y < this.scale.height; y += 4) {
      g.lineBetween(0, y, this.scale.width, y)
    }
  }
}