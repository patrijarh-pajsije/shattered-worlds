// ─────────────────────────────────────────────────────────────────────────────
//  GameScene.js — Core gameplay scene
//  See CLAUDE.md for project rules and conventions.
// ─────────────────────────────────────────────────────────────────────────────

import * as Phaser from 'phaser'
import { Audio }    from '../game/audio.js'   // Procedural audio system
import { getWorld }  from '../game/worlds.js'  // World definitions and palettes
import { TUNING } from '../game/tuning.js'

// ── Constants ─────────────────────────────────────────────────────────────────
const BALL_SPEED_BASE          = TUNING.speed.ballBase   // Base speed × screen width per frame
const BALL_SPEED_PER_ROOM      = TUNING.speed.ballPerRoom // Extra speed added per room number
const BALL_SPEED_MAX           = TUNING.speed.ballMax    // Absolute speed ceiling × screen width
const BALL_RADIUS              = TUNING.layout.ballRadius
const PADDLE_WIDTH             = TUNING.layout.paddleWidth
const PADDLE_HEIGHT            = TUNING.layout.paddleHeight
const PADDLE_Y                 = TUNING.layout.paddleY
const PADDLE_ANGLE_MAX         = TUNING.layout.paddleAngleMax
const PADDLE_WIDE_MULT         = TUNING.multipliers.paddleWide
const PADDLE_GHOST_MULT        = TUNING.multipliers.paddleGhost
const PADDLE_PENDULUM_MULT     = TUNING.multipliers.paddlePendulum
const BALL_LEAD_CORE_MULT      = TUNING.multipliers.ballLeadCore
const BALL_CANNON_MULT         = TUNING.multipliers.ballCannon
const BALL_CANNON_SHRINK       = TUNING.multipliers.ballCannonShrink
const BALL_CANNON_MIN          = TUNING.multipliers.ballCannonMin
const BALL_SINGULARITY_MULT    = TUNING.multipliers.ballSingularity
const SINGULARITY_DURATION     = TUNING.timers.singularityMs
const PENDULUM_FAST_MULT       = TUNING.multipliers.pendulumFast
const PENDULUM_FAST_DUR        = TUNING.timers.pendulumFastMs
const PENDULUM_SLOW_DUR        = TUNING.timers.pendulumSlowMs
const LASER_INTERVAL           = TUNING.timers.laserIntervalMs
const LASER_INTERVAL_RAPID     = TUNING.timers.laserRapidIntervalMs
const LASER_SPEED              = TUNING.combat.laserSpeed
const TWIN_DURATION            = TUNING.timers.twinMs
const HOTSTREAK_DURATION       = TUNING.timers.hotStreakMs
const HOTSTREAK_HITS           = TUNING.combat.hotStreakHits
const MOMENTUM_MAX_STACKS      = TUNING.combat.momentumMaxStacks
const MOMENTUM_SPEED_PER_STACK = TUNING.combat.momentumPerStack
const FAMILIAR_ORBIT           = TUNING.combat.familiarOrbit
const FAMILIAR_SPEED           = TUNING.combat.familiarSpeed
const RICOCHET_STRENGTH        = TUNING.combat.ricochetStrength
const RICOCHET_RANGE           = TUNING.combat.ricochetRange
const GRAVITY_WELL_STRENGTH    = TUNING.combat.gravityWellStrength
const GRAVITY_WELL_RANGE       = TUNING.combat.gravityWellRange
const MAGNET_RANGE             = TUNING.combat.magnetRange
const MAGNET_X_STRENGTH        = TUNING.combat.magnetXStrength
const MAGNET_Y_STRENGTH        = TUNING.combat.magnetYStrength
const SPLINTER_RADIUS          = TUNING.combat.splinterRadius
const DOMINO_CHAIN_LIMIT       = TUNING.combat.dominoChainLimit
const INKPOOL_DURATION         = TUNING.timers.inkPoolMs
const INKPOOL_SLOW             = TUNING.combat.inkPoolSlow
const CLOCKWORK_START          = TUNING.timers.clockworkStartMs
const CLOCKWORK_PER_BRICK      = TUNING.timers.clockworkPerBrickMs
const JUDGEMENT_CHARGE_TIME    = TUNING.timers.judgementChargeMs
const OVERCHARGE_SPEED_MULT    = TUNING.multipliers.overchargeSpeed
const OVERCHARGE_PAD_MULT      = TUNING.multipliers.overchargePad
const PARTICLE_GRAVITY         = TUNING.effects.particleGravity
const PARTICLE_DRAG            = TUNING.effects.particleDrag
const PARTICLE_FADE            = TUNING.effects.particleFade
const TRAIL_FADE               = TUNING.effects.trailFade
const BRICK_FLASH_FRAMES       = TUNING.bricks.flashFrames // Frames a brick flashes after being hit
const BRICK_GAP_CHANCE         = TUNING.bricks.gapChance // Probability a brick slot is left empty
const SHARD_BRICK_CHANCE       = TUNING.bricks.shardBrickChance // Chance a generated shard brick
const SCREEN_SHAKE_BOSS        = { duration: TUNING.effects.shakeBossDuration, intensity: TUNING.effects.shakeBossIntensity }
const SCREEN_SHAKE_SPLINTER    = { duration: TUNING.effects.shakeSplinterDuration,  intensity: TUNING.effects.shakeSplinterIntensity }

// ── Currency drop constants ──
const SHARD_DROP_CHANCE        = TUNING.drops.shardChance   // Probability a destroyed brick drops a shard
const BOMB_DROP_CHANCE         = TUNING.drops.bombChance    // Probability a destroyed brick drops a bomb
const BOSS_DIAMOND_REWARD      = TUNING.drops.bossDiamondReward // Diamonds awarded after killing a boss
const SHARD_FALL_SPEED         = TUNING.drops.shardFallSpeed // Shard fall speed × screen height per frame
const BOMB_FALL_SPEED          = TUNING.drops.bombFallSpeed // Bomb fall speed × screen height per frame
const CURRENCY_COLLECT_RADIUS  = TUNING.drops.collectRadius // Auto-collect radius × screen width
const SHARD_BURST_COUNT        = TUNING.drops.shardBurstCount // Number of shards spawned by a shard brick
const SHARD_BURST_SPREAD_X     = TUNING.drops.shardBurstSpreadX // Horizontal shatter speed × screen width
const SHARD_BURST_SPREAD_Y     = TUNING.drops.shardBurstSpreadY // Vertical shatter speed × screen height
const SHARD_BURST_DRAG         = TUNING.drops.shardBurstDrag // Horizontal drag on burst shards
const SHARD_BURST_BOUNCE_DAMP  = TUNING.drops.shardBurstBounceDamp // Energy kept after bounce

// ── Global speed ramp constants ──
const SPEED_RAMP_INTERVAL      = TUNING.speed.rampIntervalMs // Every N milliseconds...
const SPEED_RAMP_MULT          = TUNING.speed.rampMult   // ...ball speed increases by this factor

export class GameScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameScene' })
  }

  // Receives roomNum, isBoss, and worldId from the calling scene
  init(data) {
    const debug = TUNING.debug
    const forcedRoom = debug.enabled ? debug.forceRoomNum : null
    const forcedWorld = debug.enabled ? debug.forceWorldId : null
    this.roomNum = forcedRoom || data.roomNum || 1       // Which room (1-3 = normal, 4 = boss)
    this.isBoss  = this.roomNum === 4 ? true : (data.isBoss || false)   // Room 4 is always boss
    this.worldId = forcedWorld || data.worldId || 'void'  // Which world (affects mechanics + palette)
  }

  create() {
    const W = this.scale.width
    const H = this.scale.height
    this.W = W
    this.H = H

    // ── Derived pixel values from fraction-based constants ──
    this.COLS   = TUNING.layout.cols                               // Number of brick columns
    this.BW     = Math.floor((W - TUNING.layout.boardPaddingX) / this.COLS) // Brick width in pixels
    this.BH     = Math.round(H * TUNING.layout.brickHeight)            // Brick height in pixels
    this.BALL_R = Math.round(W * BALL_RADIUS)      // Ball radius in pixels
    this.PAD_H  = Math.round(H * PADDLE_HEIGHT)    // Paddle height in pixels
    this.PAD_W  = Math.round(W * PADDLE_WIDTH)     // Paddle base width in pixels
    this.TOUCH_Y = H * TUNING.layout.touchZoneY                        // Y where the drag zone starts

    // Load world definition for palette and mechanic access
    this.world = getWorld(this.worldId)  // Full world object from worlds.js

    // ── Forge boss: The Anvil ──
    this.anvilShieldAngle  = 0       // Current rotation angle of the shield wall (radians)
    this.anvilShieldSpeed  = TUNING.forgeBoss.shieldSpeed   // Radians per frame the shield rotates
    this.anvilShieldLength = 0       // Shield arc length in radians (set when boss is built)

    // ── Guard flag — prevents win condition firing twice ──
    // CRITICAL: must be reset to false in create(), not just in resetBall()
    this.roomComplete = false

    // ── Game state ──
    this.launched         = false    // Has the ball been launched this room?
    this.gameOver         = false    // Has the run ended?
    this.hotStreakTimer   = 0        // ms remaining on Hot Streak (0 = inactive)
    this.laserTimer       = 0        // ms since last laser shot
    this.splitTimer       = 0        // ms before Twin Shot balls disappear
    this.familiarAngle    = 0        // Current orbit angle of the Familiar (radians)
    this.pendulumTimer    = 0        // ms into current Pendulum phase
    this.pendulumFast     = false    // Is Pendulum currently in fast phase?
    this.ghostPassUsed    = false    // Has Ghost relic's floor pass been used this room?
    this.clockTimer       = CLOCKWORK_START  // Clockwork relic countdown in ms
    this.wobbleTime       = 0        // Time in seconds, used for wobble animation
    this.combo            = this.registry.get('combo') || 1  // Consecutive hit counter
    this.momentumStacks   = 0        // Current Momentum upgrade stacks (0-8)
    this.singularityTimer = 0        // ms remaining on Singularity legendary
    this.judgementCharge  = 0        // ms paddle has been held still (Judgement Beam)
    this.lastPadX         = 0        // Paddle X last frame (detects movement)
    this.unbrokenHits     = 0        // Consecutive hits for The Unbroken legendary
    this.scoreMultiplier  = this.registry.get('scoreMultiplier') || 1  // From curse cards
    this.speedRampTimer   = 0        // ms elapsed toward next global speed increase
    this.speedRampMult    = 1        // Global speed multiplier that grows over time

    // ── Object arrays ──
    this.bricks       = []  // All bricks (alive and dead) in this room
    this.particles    = []  // Active ink splatter and break particles
    this.inkTrail     = []  // Trail points left behind moving balls
    this.extraBalls   = []  // Additional balls (Twin Shot, Unbroken)
    this.swarmBalls   = []  // Permanent Swarm legendary balls
    this.lasers       = []  // Active laser projectiles
    this.inkPools     = []  // Ink puddles from Ink Drop relic
    this.brickHPTexts = []  // Phaser Text objects on multi-HP bricks

    // ── Currency pickups ──
    // Shards and diamonds fall from destroyed bricks and are collected by the paddle.
    // They are stored as objects and drawn each frame.
    this.shardPickups   = []  // Falling shard drops { x, y, vy, collected }
    this.diamondPickups = []  // Falling diamond drops { x, y, vy, collected }
    this.bombPickups    = []  // Falling bomb drops { x, y, vy, collected }
    this.bombWarnTimer  = 0   // ms countdown to next bomb warning ping

    // ── Read run config from registry ──
    this.relic    = this.registry.get('selectedRelic')        // Chosen relic object
    this.upgrades = this.registry.get('activeUpgrades') || {} // Owned upgrades map

    // ── Background ──
    this.add.rectangle(0, 0, W, H, 0xf5f0e4).setOrigin(0, 0)
    this.drawPaperTexture()

    // ── Graphics layers — drawn in order (first = bottom, last = top) ──
    this.gInkPools  = this.add.graphics()  // Ink puddles
    this.gTrail     = this.add.graphics()  // Ball ink trail
    this.gBricks    = this.add.graphics()  // Bricks
    this.gLasers    = this.add.graphics()  // Laser beams
    this.gBall      = this.add.graphics()  // Balls and familiar
    this.gPad       = this.add.graphics()  // Paddle
    this.gParticles = this.add.graphics()  // Particles (topmost)
    this.gHUD       = this.add.graphics()  // HUD bars

    // ── HUD text objects ──
    this.scoreText = this.add.text(W * 0.08, 10, '0', {
      fontFamily: 'Georgia, serif', fontSize: Math.round(W * 0.045) + 'px', color: '#2a1f0e'
    }).setOrigin(0, 0)

    this.livesText = this.add.text(W / 2, 10, 'III', {
      fontFamily: 'Georgia, serif', fontSize: Math.round(W * 0.04) + 'px', color: '#2a1f0e'
    }).setOrigin(0.5, 0)

    this.roomText = this.add.text(W - W * 0.08, 10,
      this.isBoss ? 'BOSS' : `${this.roomNum}/3`, {
      fontFamily: 'Georgia, serif', fontSize: Math.round(W * 0.035) + 'px', color: '#8a7a6a'
    }).setOrigin(1, 0)

    this.relicText = this.add.text(W / 2, 48, this.relic ? this.relic.name : '', {
      fontFamily: 'Georgia, serif', fontSize: Math.round(W * 0.028) + 'px',
      color: '#8a7a6a', fontStyle: 'italic'
    }).setOrigin(0.5, 0)

    this.comboText = this.add.text(W * 0.08, 48, '', {
      fontFamily: 'Georgia, serif', fontSize: Math.round(W * 0.032) + 'px', color: '#8a7a6a'
    }).setOrigin(0, 0)

    this.msgText = this.add.text(W / 2, H * 0.68, 'tap to launch', {
      fontFamily: 'Georgia, serif', fontSize: Math.round(W * 0.036) + 'px',
      color: '#6a5a4a', fontStyle: 'italic'
    }).setOrigin(0.5)

    this.upgradesText = this.add.text(W / 2, H * 0.72, '', {
      fontFamily: 'Georgia, serif', fontSize: Math.round(W * 0.026) + 'px', color: '#a89a8a'
    }).setOrigin(0.5)

    this.statusText = this.add.text(W / 2, H * 0.76, '', {
      fontFamily: 'Georgia, serif', fontSize: Math.round(W * 0.028) + 'px',
      color: '#7a3010', fontStyle: 'italic'
    }).setOrigin(0.5)

    // ── Drag zone hint ──
    this.add.graphics()
      .lineStyle(0.5, 0x2a1f0e, 0.1)
      .strokeRoundedRect(8, this.TOUCH_Y, W - 16, H - this.TOUCH_Y - 8, 8)
    this.add.text(W / 2, this.TOUCH_Y + (H - this.TOUCH_Y) * 0.5, 'drag here', {
      fontFamily: 'Georgia, serif', fontSize: Math.round(W * 0.028) + 'px', color: '#2a1f0e'
    }).setOrigin(0.5).setAlpha(0.18)

    // ── Input ──
    this.touchStartX  = 0      // X position where touch/click began
    this.padStartX    = 0      // Paddle X when touch began
    this.isDragging   = false   // Is player currently dragging?
    this.tiltActive   = false   // Is gyroscope tilt controlling the paddle?
    this.tiltX        = 0       // Current tilt value from DeviceMotion (positive = right)
    this.setupInput()
    this.setupTilt()   // Set up gyroscope if available

    // ── Build room ──
    if (this.isBoss) this.buildBoss()
    else this.buildBricks()

    this.resetBall()
    this.updateHUD()
    this.updateBrickHPTexts()
    this.drawFrame()  // Render initial room state before first launch
    this.cameras.main.fadeIn(200, 245, 240, 228)
  }

  // ── Input ──────────────────────────────────────────────────────────────────

  setupInput() {
    this.input.on('pointerdown', (p) => {
      Audio.init()          // Safe to call multiple times — only initialises once
      this.touchStartX = p.x
      this.padStartX   = this.pad.x
      this.isDragging  = true
      if (!this.launched && !this.gameOver) this.launchBall()
    })
    this.input.on('pointermove', (p) => {
      if (!this.isDragging) return
      const pw = this.padWidth()
      const dragMult = this.upgrades.overcharge ? OVERCHARGE_PAD_MULT : 1
      this.pad.x = Phaser.Math.Clamp(this.padStartX + (p.x - this.touchStartX) * dragMult, 0, this.W - pw)
    })
    this.input.on('pointerup', () => { this.isDragging = false })
  }

  // ── Tilt Controls ─────────────────────────────────────────────────────────

  // Sets up DeviceMotion listener for gyroscope tilt controls.
  // On iOS, requires permission — triggered by user tap.
  // On Android, fires automatically but requires HTTPS (use npm run dev -- --host).
  setupTilt() {
    if (typeof DeviceMotionEvent === 'undefined') return  // Not supported on this device

    const onMotion = (e) => {
      // accelerationIncludingGravity.x = left/right tilt in m/s²
      // Positive = tilted right, negative = tilted left
      const a = e.accelerationIncludingGravity || e.acceleration
      if (!a) return
      const x = a.x || 0
      if (Math.abs(x) > 0.15) {
        // Only activate tilt if meaningful movement detected
        this.tiltActive = true
        this.tiltX      = x  // Store for use in update()
      }
    }

    // iOS requires explicit permission request — must be triggered by user gesture
    if (typeof DeviceMotionEvent.requestPermission === 'function') {
      // iOS: permission request fires on first tap (already in setupInput pointerdown)
      this.input.once('pointerdown', () => {
        DeviceMotionEvent.requestPermission()
          .then(result => {
            if (result === 'granted') {
              window.addEventListener('devicemotion', onMotion)
            }
          })
          .catch(() => {})  // Permission denied — fall back to touch drag silently
      })
    } else {
      // Android / desktop: add listener directly (no permission needed)
      window.addEventListener('devicemotion', onMotion)
    }
  }

  // ── Paddle ─────────────────────────────────────────────────────────────────

  // Returns current paddle width in pixels including all multipliers
  padWidth() {
    let w = this.PAD_W
    if (this.upgrades.wide)              w *= PADDLE_WIDE_MULT
    if (this.relic?.id === 'ghost')      w *= PADDLE_GHOST_MULT
    if (this.relic?.id === 'pendulum')   w *= PADDLE_PENDULUM_MULT
    return w
  }

  // Places ball on top of paddle at screen center, resets per-room state
  resetBall() {
    const pw = this.padWidth()
    const r  = this.BALL_R *
      (this.upgrades.leadcore      ? BALL_LEAD_CORE_MULT : 1) *
      (this.relic?.id === 'cannon' ? BALL_CANNON_MULT    : 1)

    this.pad  = { x: this.W / 2 - pw / 2, y: this.H * PADDLE_Y }
    this.ball = { x: this.W / 2, y: this.pad.y - r - 2, vx: 0, vy: 0, r, baseR: r }

    this.extraBalls       = []
    this.swarmBalls       = []
    this.splitTimer       = 0
    this.lasers           = []
    this.launched         = false
    this.momentumStacks   = 0
    this.unbrokenHits     = 0
    this.judgementCharge  = 0
    this.singularityTimer = 0

    this.msgText.setText('tap to launch').setVisible(true)
  }

  // Fires ball at a random upward angle
  launchBall() {
    const angle = -Math.PI / 2 + (Math.random() - 0.5) * 0.45  // ±26° from straight up
    const speed = this.baseSpeed()
    this.ball.vx = Math.cos(angle) * speed
    this.ball.vy = Math.sin(angle) * speed
    this.launched = true
    this.msgText.setVisible(false)
    if (this.upgrades.swarm) this.spawnSwarmBalls()  // Spawn swarm balls on launch
  }

  // Calculates current ball target speed in pixels per frame
  baseSpeed() {
    let speed = this.W * BALL_SPEED_BASE + this.roomNum * BALL_SPEED_PER_ROOM
    if (this.upgrades.momentum && this.momentumStacks > 0) {
      speed *= 1 + this.momentumStacks * MOMENTUM_SPEED_PER_STACK
    }
    if (this.relic?.id === 'pendulum') speed *= this.pendulumFast ? PENDULUM_FAST_MULT : 1.0
    speed = Math.min(speed, this.W * BALL_SPEED_MAX)
    speed *= this.speedRampMult
    if (TUNING.debug.enabled) speed *= Math.max(0.1, TUNING.debug.speedMultiplier || 1)
    if (this.upgrades.overcharge) speed *= OVERCHARGE_SPEED_MULT
    return speed
  }

  // ── Bricks ─────────────────────────────────────────────────────────────────

  buildBricks() {
    this.clearBrickHPTexts()
    this.bricks = []

    // Use world-specific brick colors if available, otherwise fall back to Void palette
    const palette = this.world?.palette?.brickColors ||
      [0x2a1f0e, 0x4a3020, 0x5a4030, 0x3a2818, 0x6a4828]

    const startY = Math.round(this.H * 0.1)
    const rows   = this.roomNum < 3 ? 4 : 5  // Room 3 gets an extra row

    // Possible exposed sides for Forge armored bricks
    const SIDES = ['top', 'bottom', 'left', 'right']

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < this.COLS; c++) {
        if (Math.random() < BRICK_GAP_CHANCE) continue  // Random gaps for hand-drawn feel

        const isShardBrick = Math.random() < SHARD_BRICK_CHANCE
        const hp = isShardBrick ? 1 : (r < 2 ? 1 : 2)  // Shard bricks are always fragile

        const brick = {
          x:          8 + c * this.BW + (Math.random() - 0.5) * 1.5,
          y:          startY + r * (this.BH + 5) + (Math.random() - 0.5) * 1,
          w:          this.BW - 4,
          h:          this.BH,
          hp, maxHp:  hp,
          color:      palette[Math.floor(Math.random() * palette.length)],
          alive:      true,
          seed:       Math.random() * 100,  // Unique wobble seed for this brick
          flashTimer: 0,
          boss:       false,
          shardBrick: isShardBrick,
          // Forge mechanic: each brick has one exposed side — only that side takes damage
          // null = no armor (Void and other worlds)
          exposedSide: this.worldId === 'forge'
            ? SIDES[Math.floor(Math.random() * SIDES.length)]
            : null
        }

        this.bricks.push(brick)
        // HP numbers no longer shown — color conveys health (3HP=black, 2HP=gray, 1HP=light)
      }
    }
  }

  buildBoss() {
    this.clearBrickHPTexts()
    this.bricks = []

    if (this.worldId === 'forge') {
      // ── The Anvil: The Forge boss ──
      // A row of smaller armored bricks instead of one large brick.
      // The rotating shield is handled separately in updateForgeAnvil() and drawForgeAnvil().
      const palette   = this.world.palette.brickColors
      const bossY     = Math.round(this.H * 0.08)
      const bossHp    = 4  // Each brick has 4 HP — the shield keeps the ball away
      const brickW    = this.BW - 4

      // 5 bricks spanning the center of the screen
      const startC = 1  // Leave one column gap on each side
      for (let c = startC; c < this.COLS - startC; c++) {
        const brick = {
          x:          8 + c * this.BW,
          y:          bossY,
          w:          brickW,
          h:          this.BH,
          hp:         bossHp,
          maxHp:      bossHp,
          color:      palette[Math.floor(Math.random() * palette.length)],
          alive:      true,
          seed:       Math.random() * 100,
          flashTimer: 0,
          boss:       true,
          splitCount: 0,
          exposedSide: null  // Anvil bricks are not directionally armored — shield protects them
        }
        this.bricks.push(brick)
        this.createBrickHPText(brick)
      }

      // Initialize shield rotation
      this.anvilShieldAngle  = 0
      this.anvilShieldLength = TUNING.forgeBoss.shieldArcLength  // Shield covers 60% of the arc around the boss

    } else {
      // ── The Blank: The Void boss (default) ──
      // One massive brick that splits into smaller bricks on death
      const boss = {
        x:          this.W * 0.1,
        y:          this.H * 0.1,
        w:          this.W * 0.8,
        h:          this.H * 0.16,
        hp:         12,
        maxHp:      12,
        color:      this.world.palette.ink,
        alive:      true,
        seed:       0,
        flashTimer: 0,
        boss:       true,
        splitCount: 0,
        exposedSide: null
      }
      this.bricks.push(boss)
      this.createBrickHPText(boss)
    }
  }

  // Splits a boss brick into two smaller side-by-side children
  splitBoss(b) {
    const hw     = b.w / 2 - 4  // Half width with gap between children
    const colors = [0x2a1f0e, 0x3a2010, 0x4a3020, 0x1a0e08]
    const hp     = Math.max(1, Math.ceil(b.hp * 0.6))  // Children have 60% of parent HP

    const left  = { x: b.x,          y: b.y, w: hw, h: b.h, hp, maxHp: hp, color: colors[Math.floor(Math.random() * 4)], alive: true, seed: Math.random() * 100, flashTimer: 0, boss: true, splitCount: b.splitCount + 1 }
    const right = { x: b.x + hw + 8, y: b.y, w: hw, h: b.h, hp, maxHp: hp, color: colors[Math.floor(Math.random() * 4)], alive: true, seed: Math.random() * 100, flashTimer: 0, boss: true, splitCount: b.splitCount + 1 }

    this.bricks.push(left, right)
    this.createBrickHPText(left)
    this.createBrickHPText(right)
    Audio.bossSplit()  // Deep rumble on boss split
    this.cameras.main.shake(SCREEN_SHAKE_BOSS.duration, SCREEN_SHAKE_BOSS.intensity)
  }

  // Creates a Phaser Text object overlaid on a brick showing its HP number
  createBrickHPText(brick) {
    const t = this.add.text(brick.x + brick.w / 2, brick.y + brick.h / 2, String(brick.hp), {
      fontFamily: 'Georgia, serif',
      fontSize:   Math.round(this.BH * 0.52) + 'px',
      color:      '#f5f0e4'
    }).setOrigin(0.5).setAlpha(0.75)
    t._brick = brick  // Store brick reference for update/cleanup
    this.brickHPTexts.push(t)
  }

  // Destroys all HP text objects — called before rebuilding bricks
  clearBrickHPTexts() {
    this.brickHPTexts.forEach(t => t.destroy())
    this.brickHPTexts = []
  }

  // Syncs HP text content and position with their bricks, removes dead-brick texts
  updateBrickHPTexts() {
    const hideHp = !!this.upgrades.blindfold
    for (let i = this.brickHPTexts.length - 1; i >= 0; i--) {
      const t = this.brickHPTexts[i]
      if (!t._brick.alive) { t.destroy(); this.brickHPTexts.splice(i, 1); continue }
      t.setText(String(t._brick.hp))
      t.setPosition(t._brick.x + t._brick.w / 2, t._brick.y + t._brick.h / 2)
      t.setVisible(!hideHp)
    }
  }

  // Spawns 3 small permanent balls for The Swarm legendary
  spawnSwarmBalls() {
    const r = Math.round(this.BALL_R * 0.55)  // Swarm balls are 55% of ball size
    for (let i = 0; i < 3; i++) {
      const angle = -Math.PI / 2 + (Math.random() - 0.5) * 1.2
      const speed = this.baseSpeed() * (0.8 + Math.random() * 0.4)
      this.swarmBalls.push({
        x: this.W / 2 + (Math.random() - 0.5) * 40,
        y: this.pad.y - r - 10,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        r
      })
    }
  }

  // ── Hit Brick ──────────────────────────────────────────────────────────────

  hitBrick(b, fromLaser = false, fromFamiliar = false, dominoDepth = 0) {
    // Calculate damage: Wrecking Ball = instant kill, Hot Streak = double, normal = 1
    const dmg      = (this.upgrades.wrecking && !fromFamiliar) ? b.hp : (this.hotStreakTimer > 0 ? 2 : 1)
    const finalDmg = this.upgrades.glasscannon ? dmg * 3 : dmg  // Glass Cannon triples damage

    b.hp -= finalDmg
    b.flashTimer = BRICK_FLASH_FRAMES
    this.spawnInk(b.x + b.w / 2, b.y + b.h / 2, 4)

    if (b.hp > 0) { Audio.brickHit(); return }  // Brick damaged but alive

    // ── Brick death ──
    if (b.boss && b.splitCount < 3) {
      // Boss bricks split instead of dying (up to 3 generations)
      b.alive = false
      this.splitBoss(b)
      this.spawnParticles(b.x + b.w / 2, b.y + b.h / 2, b.color, 14)
      return
    }

    b.alive = false
    Audio.brickDestroy()  // Play destruction sound
    this.registry.set('bricksShattered', (this.registry.get('bricksShattered') || 0) + 1)
    const points = Math.round(10 * this.roomNum * Math.max(1, Math.floor(this.combo / 2)) * this.scoreMultiplier)
    this.registry.set('score', (this.registry.get('score') || 0) + points)
    this.spawnParticles(b.x + b.w / 2, b.y + b.h / 2, b.color, 10)

    // Shard bricks are special loot piñatas — on death they explode into shard drops.
    if (b.shardBrick) {
      Audio.shardBrickExplode()
      this.spawnShardBurst(b.x + b.w / 2, b.y + b.h / 2)
    }

    // ── Currency drops ──
    if (!b.boss) {
      // Single roll so drop rates stay intuitive: shard ~30%, bomb ~10%, otherwise none.
      const shardChance = TUNING.debug.enabled
        ? Math.min(1, SHARD_DROP_CHANCE * Math.max(0, TUNING.debug.shardDropMultiplier || 1))
        : SHARD_DROP_CHANCE
      const bombChance = TUNING.debug.enabled
        ? Math.min(1, BOMB_DROP_CHANCE * Math.max(0, TUNING.debug.bombDropMultiplier || 1))
        : BOMB_DROP_CHANCE

      const dropRoll = Math.random()
      if (dropRoll < shardChance) {
        this.shardPickups.push({
          x: b.x + b.w / 2 + (Math.random() - 0.5) * this.BW * 0.5,  // Slight random spread
          y: b.y + b.h / 2,
          vy: this.H * SHARD_FALL_SPEED * (0.8 + Math.random() * 0.4),  // Slight speed variation
          collected: false
        })
      } else if (dropRoll < shardChance + bombChance) {
        this.bombPickups.push({
          x: b.x + b.w / 2 + (Math.random() - 0.5) * this.BW * 0.4,
          y: b.y + b.h / 2,
          vy: this.H * BOMB_FALL_SPEED * (0.85 + Math.random() * 0.35),
          collected: false
        })
        this.flashBombWarning()
      }
    }

    // ── Relic effects on brick death ──
    if (this.relic?.id === 'inkdrop')   this.inkPools.push({ x: b.x + b.w / 2, y: b.y + b.h / 2, r: this.BW * 0.7, life: INKPOOL_DURATION })
    if (this.relic?.id === 'clockwork') this.clockTimer += CLOCKWORK_PER_BRICK

    // ── Upgrade chain effects ──
    if (this.upgrades.splinter) {
      const radius = this.BW * SPLINTER_RADIUS * (this.upgrades.blastradius ? 1.5 : 1)
      this.cameras.main.shake(SCREEN_SHAKE_SPLINTER.duration, SCREEN_SHAKE_SPLINTER.intensity)
      for (const nb of this.bricks) {
        if (!nb.alive || nb === b) continue
        if (Math.hypot(nb.x + nb.w / 2 - (b.x + b.w / 2), nb.y + nb.h / 2 - (b.y + b.h / 2)) < radius) {
          nb.hp--; nb.flashTimer = BRICK_FLASH_FRAMES - 1
          if (nb.hp <= 0) {
            nb.alive = false
            this.registry.set('bricksShattered', (this.registry.get('bricksShattered') || 0) + 1)
            this.spawnParticles(nb.x + nb.w / 2, nb.y + nb.h / 2, nb.color, 5)
            if (this.upgrades.domino && dominoDepth < DOMINO_CHAIN_LIMIT) {
              this.hitBrick(nb, false, false, dominoDepth + 1)  // Recursive explosion chain
            }
          }
        }
      }
    }

    if (this.upgrades.familiar && !fromFamiliar) {
      // Hit the nearest alive brick that isn't the one that just died
      let closest = null, closestDist = 9999
      for (const nb of this.bricks) {
        if (!nb.alive || nb === b) continue
        const d = Math.hypot(nb.x + nb.w / 2 - (b.x + b.w / 2), nb.y + nb.h / 2 - (b.y + b.h / 2))
        if (d < closestDist) { closestDist = d; closest = nb }
      }
      if (closest && closestDist < this.BW * 3) {
        closest.hp--; closest.flashTimer = BRICK_FLASH_FRAMES + 1
        this.spawnInk(closest.x + closest.w / 2, closest.y + closest.h / 2, 3)
        if (closest.hp <= 0) {
          closest.alive = false
          this.registry.set('bricksShattered', (this.registry.get('bricksShattered') || 0) + 1)
          this.spawnParticles(closest.x + closest.w / 2, closest.y + closest.h / 2, closest.color, 6)
        }
      }
    }

    if (this.upgrades.inferno && !fromFamiliar) {
      // Every brick death triggers a small explosion around it
      for (const nb of this.bricks) {
        if (!nb.alive || nb === b) continue
        if (Math.hypot(nb.x + nb.w / 2 - (b.x + b.w / 2), nb.y + nb.h / 2 - (b.y + b.h / 2)) < this.BW * 2.5) {
          nb.hp--; nb.flashTimer = BRICK_FLASH_FRAMES
          if (nb.hp <= 0) { nb.alive = false; this.spawnParticles(nb.x + nb.w / 2, nb.y + nb.h / 2, nb.color, 4) }
        }
      }
    }

    if (this.upgrades.hotstreak && this.combo >= HOTSTREAK_HITS && this.hotStreakTimer <= 0) {
      this.hotStreakTimer = HOTSTREAK_DURATION  // Activate Hot Streak double damage
      Audio.hotStreakActivate()  // Alert tone on activation
    }

    if (this.upgrades.unbroken) {
      this.unbrokenHits++
      if (this.unbrokenHits >= 20 && this.extraBalls.length === 0) this.spawnUnbrokenBall()
    }
  }

  // Spawns the permanent extra ball earned by reaching 20 hits with The Unbroken
  spawnUnbrokenBall() {
    const angle = -Math.PI / 2 + (Math.random() - 0.5) * 0.6
    const speed = this.baseSpeed()
    this.extraBalls.push({ x: this.W / 2, y: this.pad.y - this.ball.r - 2, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed, r: this.ball.r, baseR: this.ball.baseR, permanent: true })
    this.statusText.setText('The Unbroken — extra ball earned!')
    this.time.delayedCall(2000, () => this.statusText.setText(''))
  }

  spawnShardBurst(x, y) {
    for (let i = 0; i < SHARD_BURST_COUNT; i++) {
      const angle = (Math.PI * 2 * i) / SHARD_BURST_COUNT + (Math.random() - 0.5) * 0.2
      const spreadX = Math.cos(angle) * this.W * SHARD_BURST_SPREAD_X
      const spreadY = Math.sin(angle) * this.H * SHARD_BURST_SPREAD_Y
      const fallVy  = this.H * SHARD_FALL_SPEED * (0.8 + Math.random() * 0.4)
      this.shardPickups.push({
        x,
        y,
        // Circular burst spread with regular shard fall speed layered on top.
        vx: spreadX,
        vy: spreadY + fallVy,
        burst: true,
        collected: false
      })
    }
  }

  // ── Particles ──────────────────────────────────────────────────────────────

  spawnParticles(x, y, colorHex, n = 8) {
    for (let i = 0; i < n; i++) {
      const angle = Math.random() * Math.PI * 2
      const speed = 0.8 + Math.random() * 3.5
      this.particles.push({ x, y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed - 1, life: 1, color: colorHex, size: 0.8 + Math.random() * 2.5 })
    }
  }

  spawnInk(x, y, n = 4) {
    for (let i = 0; i < n; i++) {
      const angle = Math.random() * Math.PI * 2
      const speed = 0.4 + Math.random() * 2
      this.particles.push({ x, y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed - 0.5, life: 0.8, color: 0x2a1f0e, size: 0.4 + Math.random() * 1.2 })
    }
  }

  // ── Update loop ────────────────────────────────────────────────────────────

  update(time, delta) {
    if (!this.launched || this.gameOver || this.roomComplete) return  // Guard flags

    this.wobbleTime = time * 0.001  // Convert ms to seconds for wobble animation
    const dt = delta

    // ── Timers ──
    if (this.relic?.id === 'pendulum') {
      this.pendulumTimer += dt
      if (this.pendulumTimer > (this.pendulumFast ? PENDULUM_FAST_DUR : PENDULUM_SLOW_DUR)) {
        this.pendulumTimer = 0; this.pendulumFast = !this.pendulumFast
      }
    }
    if (this.hotStreakTimer > 0)   this.hotStreakTimer -= dt
    if (this.singularityTimer > 0) this.singularityTimer -= dt
    this.speedRampTimer += dt
    while (this.speedRampTimer >= SPEED_RAMP_INTERVAL) {
      this.speedRampTimer -= SPEED_RAMP_INTERVAL
      this.speedRampMult *= SPEED_RAMP_MULT
    }
    if (this.splitTimer > 0) {
      this.splitTimer -= dt
      if (this.splitTimer <= 0) this.extraBalls = this.extraBalls.filter(b => b.permanent)
    }
    if (this.relic?.id === 'clockwork') {
      this.clockTimer -= dt
      if (this.clockTimer <= 0) { this.loseLife(); return }
    }

    // ── Forge boss shield rotation ──
    if (this.isBoss && this.worldId === 'forge') this.updateForgeAnvil(dt)

    // ── Laser ──
    if (this.upgrades.laser) {
      this.laserTimer += dt
      const interval = this.upgrades.rapidfire ? LASER_INTERVAL_RAPID : LASER_INTERVAL
      if (this.laserTimer > interval) {
        this.laserTimer = 0
        this.lasers.push({ x: this.pad.x + this.padWidth() / 2, y: this.pad.y, vy: -this.H * LASER_SPEED })
        Audio.laserFire()  // Brief electronic zap
      }
    }

    // ── Judgement Beam charge ──
    if (this.upgrades.judgement) {
      const moved = Math.abs(this.pad.x - this.lastPadX) > 2  // Moved more than 2px?
      this.judgementCharge = moved ? 0 : this.judgementCharge + dt  // Reset or accumulate
      if (this.judgementCharge >= JUDGEMENT_CHARGE_TIME) { this.fireJudgementBeam(); this.judgementCharge = 0 }
      this.lastPadX = this.pad.x
    }

    if (this.upgrades.familiar) this.familiarAngle += FAMILIAR_SPEED  // Advance familiar orbit

    // ── Tilt paddle movement ──
    // Only when tilt is active AND player is not also dragging
    if (this.tiltActive && !this.isDragging) {
      const pw         = this.padWidth()
      // tiltX > 0 = phone tilted right = paddle moves right
      // Sensitivity: 2.0 pixels per unit of tilt per frame — adjust if too sensitive
      const tiltSpeed  = 2.0 * (this.upgrades.overcharge ? OVERCHARGE_PAD_MULT : 1)
      this.pad.x       = Phaser.Math.Clamp(
        this.pad.x + this.tiltX * tiltSpeed,
        0,
        this.W - pw
      )
    }

    // ── Move lasers ──
    this.lasers = this.lasers.filter(laser => {
      laser.y += laser.vy
      if (laser.y < 0) return false  // Remove if exited screen top
      for (const b of this.bricks) {
        if (!b.alive) continue
        if (laser.x > b.x && laser.x < b.x + b.w && laser.y > b.y && laser.y < b.y + b.h) {
          this.hitBrick(b, true)
          if (!this.upgrades.piercing) return false  // Piercing Shot lets laser continue
        }
      }
      return true
    })

    this.inkPools = this.inkPools.filter(p => { p.life -= dt; return p.life > 0 })  // Decay puddles

    // Bomb danger cue while at least one bomb is on-screen.
    if (this.bombPickups.some(b => !b.collected)) {
      this.bombWarnTimer -= dt
      if (this.bombWarnTimer <= 0) {
        Audio.bombWarning()
        this.bombWarnTimer = 850
      }
    } else {
      this.bombWarnTimer = 0
    }

    // ── Move currency pickups downward and check paddle collection ──
    const pw          = this.padWidth()
    const padLeft     = this.pad.x                  // Paddle left edge
    const padRight    = this.pad.x + pw              // Paddle right edge
    const padTop      = this.pad.y                   // Paddle top edge
    const padBottom   = this.pad.y + this.PAD_H      // Paddle bottom edge
    const collectR    = Math.round(this.W * CURRENCY_COLLECT_RADIUS)  // Collect distance in px

    for (const s of this.shardPickups) {
      if (s.collected) continue
      if (s.vx) {
        s.x += s.vx
        s.vx *= SHARD_BURST_DRAG

        // Burst shards bounce inside screen bounds instead of leaving the viewport.
        const rr = 6
        if (s.x < rr) {
          s.x = rr
          s.vx = Math.abs(s.vx) * SHARD_BURST_BOUNCE_DAMP
        } else if (s.x > this.W - rr) {
          s.x = this.W - rr
          s.vx = -Math.abs(s.vx) * SHARD_BURST_BOUNCE_DAMP
        }
      }
      s.y += s.vy  // Fall downward
      if (s.vx) {
        const rr = 6
        if (s.y < rr) {
          s.y = rr
          s.vy = Math.abs(s.vy) * SHARD_BURST_BOUNCE_DAMP
        }
      }
      // Collect if within paddle area (slightly generous hitbox for mobile)
      if (s.y + 6 > padTop - 10 && s.y < padBottom + 10 &&
          s.x > padLeft - collectR && s.x < padRight + collectR) {
        s.collected = true
        // Add shard to total — displayed on death/world clear screens
        const current = this.registry.get('totalShards') || 0
        this.registry.set('totalShards', current + 1)
        this.registry.set('shardsCollected', (this.registry.get('shardsCollected') || 0) + 1)
        Audio.init()
        // Brief high-pitched tick for shard collection
        if (typeof Audio !== 'undefined') Audio.brickHit && Audio.brickHit()
      }
    }

    for (const d of this.diamondPickups) {
      if (d.collected) continue
      d.y += d.vy
      if (d.y + 6 > padTop - 10 && d.y < padBottom + 10 &&
          d.x > padLeft - collectR && d.x < padRight + collectR) {
        d.collected = true
        const current = this.registry.get('totalDiamonds') || 0
        this.registry.set('totalDiamonds', current + 1)
        this.registry.set('diamondsCollected', (this.registry.get('diamondsCollected') || 0) + 1)
      }
    }

    for (const b of this.bombPickups) {
      if (b.collected) continue
      b.y += b.vy
      if (b.y + 8 > padTop - 10 && b.y < padBottom + 10 &&
          b.x > padLeft - collectR && b.x < padRight + collectR) {
        b.collected = true
        this.loseLife()
        this.statusText.setText('Bomb hit! -1 life')
        this.time.delayedCall(900, () => this.statusText.setText(''))
        return
      }
    }

    // Remove collected or off-screen pickups
    this.shardPickups   = this.shardPickups.filter(s   => !s.collected && s.y < this.H + 20)
    this.diamondPickups = this.diamondPickups.filter(d => !d.collected && d.y < this.H + 20)
    this.bombPickups    = this.bombPickups.filter(b    => !b.collected && b.y < this.H + 20)

    // ── Ball physics ──
    const allBalls = [this.ball, ...this.extraBalls, ...this.swarmBalls]
    for (const bl of allBalls) {
      this.updateSingleBall(bl, this.swarmBalls.includes(bl))
    }

    // ── Ghost relic: one free floor pass ──
    if (this.relic?.id === 'ghost' && !this.ghostPassUsed && this.ball.y + this.ball.r > this.H) {
      this.ghostPassUsed = true
      this.ball.vy = -Math.abs(this.ball.vy)
      this.ball.y  = this.H - this.ball.r - 2
      this.spawnInk(this.ball.x, this.H, 12)
    }

    // ── Glass Cannon: instant death if ball falls ──
    if (this.upgrades.glasscannon && this.ball.y - this.ball.r > this.H) {
      this.endRun(); return
    }

    // ── Cleanup fallen balls ──
    this.swarmBalls = this.swarmBalls.filter(bl => bl.y - bl.r < this.H)
    this.extraBalls = this.extraBalls.filter(bl => bl.y - bl.r < this.H || bl.permanent)

    // ── Main ball fell ──
    if (this.ball.y - this.ball.r > this.H) {
      this.unbrokenHits = 0
      if (this.upgrades.momentum) this.momentumStacks = 0
      this.loseLife(); return
    }

    // ── Particles and trail decay ──
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i]
      p.x += p.vx; p.y += p.vy; p.vy += PARTICLE_GRAVITY; p.vx *= PARTICLE_DRAG; p.life -= PARTICLE_FADE
      if (p.life <= 0) this.particles.splice(i, 1)
    }
    for (let i = this.inkTrail.length - 1; i >= 0; i--) {
      this.inkTrail[i].life -= TRAIL_FADE
      if (this.inkTrail[i].life <= 0) this.inkTrail.splice(i, 1)
    }
    for (const b of this.bricks) if (b.flashTimer > 0) b.flashTimer--

    // ── Win condition: all bricks dead ──
    if (this.bricks.filter(b => b.alive).length === 0) {
      this.roomComplete = true  // Set guard flag FIRST to prevent double-trigger
      Audio.roomClear()  // Ascending celebratory chime
      this.registry.set('roomsCleared', (this.registry.get('roomsCleared') || 0) + 1)
      this.cameras.main.fadeOut(250, 245, 240, 228)
      this.cameras.main.once('camerafadeoutcomplete', () => {
        if (this.isBoss) {
          this.registry.set('totalDiamonds', (this.registry.get('totalDiamonds') || 0) + BOSS_DIAMOND_REWARD)
          this.registry.set('diamondsCollected', (this.registry.get('diamondsCollected') || 0) + BOSS_DIAMOND_REWARD)
          this.scene.start('WorldClearScene')
        } else {
          // Pass worldId forward so DraftScene can route correctly
          this.scene.start('DraftScene', { nextRoomNum: this.roomNum + 1, worldId: this.worldId })
        }
      })
      return
    }

    this.registry.set('combo', this.combo)
    this.updateHUD()
    this.updateBrickHPTexts()
    this.drawFrame()
  }

  // Handles physics for a single ball object
  updateSingleBall(bl, isSwarm) {
    const prevX = bl.x
    const prevY = bl.y

    // ── Singularity: override ball size while active ──
    if (this.upgrades.singularity && this.singularityTimer > 0 && bl === this.ball) {
      bl.r = Math.round(this.W * BALL_SINGULARITY_MULT)
    } else if (bl === this.ball && this.singularityTimer <= 0) {
      bl.r = bl.baseR  // Restore normal size when Singularity expires
    }

    let targetSpeed = this.baseSpeed()
    if (isSwarm) targetSpeed *= 0.9  // Swarm balls slightly slower

    // Ink pool slows ball
    for (const pool of this.inkPools) {
      if (Math.hypot(bl.x - pool.x, bl.y - pool.y) < pool.r) { targetSpeed *= INKPOOL_SLOW; break }
    }

    // Magnet relic: pull toward paddle when ball is descending and nearby
    if (this.relic?.id === 'magnet' && !isSwarm) {
      const padCX  = this.pad.x + this.padWidth() / 2
      const distPad = Math.hypot(bl.x - padCX, bl.y - this.pad.y)
      if (distPad < this.H * MAGNET_RANGE && bl.vy > 0) {
        bl.vx += (padCX - bl.x) / distPad * MAGNET_X_STRENGTH
        bl.vy += (this.pad.y - bl.y) / distPad * MAGNET_Y_STRENGTH
      }
    }

    // Normalize velocity to target speed
    const currentSpeed = Math.hypot(bl.vx, bl.vy) || targetSpeed
    bl.vx = bl.vx / currentSpeed * targetSpeed
    bl.vy = bl.vy / currentSpeed * targetSpeed

    // Ricochet: steer toward nearest brick
    if (this.upgrades.ricochet) {
      let nearest = null, nearestDist = 9999
      for (const b of this.bricks) {
        if (!b.alive) continue
        const d = Math.hypot(b.x + b.w / 2 - bl.x, b.y + b.h / 2 - bl.y)
        if (d < nearestDist) { nearestDist = d; nearest = b }
      }
      if (nearest && nearestDist < this.W * RICOCHET_RANGE) {
        bl.vx += (nearest.x + nearest.w / 2 - bl.x) / nearestDist * RICOCHET_STRENGTH
        bl.vy += (nearest.y + nearest.h / 2 - bl.y) / nearestDist * RICOCHET_STRENGTH
      }
    }

    // Gravity Well: steer toward centroid of all alive bricks
    if (this.upgrades.gravitywell) {
      let cx = 0, cy = 0, count = 0
      for (const b of this.bricks) {
        if (!b.alive) continue
        cx += b.x + b.w / 2; cy += b.y + b.h / 2; count++
      }
      if (count > 0) {
        cx /= count; cy /= count
        const d = Math.hypot(bl.x - cx, bl.y - cy)
        if (d < this.W * GRAVITY_WELL_RANGE && d > 10) {
          bl.vx += (cx - bl.x) / d * GRAVITY_WELL_STRENGTH
          bl.vy += (cy - bl.y) / d * GRAVITY_WELL_STRENGTH
        }
      }
    }

    bl.x += bl.vx; bl.y += bl.vy  // Move ball

    if (!isSwarm) this.inkTrail.push({ x: bl.x, y: bl.y, vx: bl.vx, vy: bl.vy, life: 0.55, size: bl.r * 0.38 })

    // Wall bounces
    if (bl.x - bl.r < 0)      { bl.x = bl.r;          bl.vx =  Math.abs(bl.vx) }
    if (bl.x + bl.r > this.W) { bl.x = this.W - bl.r;  bl.vx = -Math.abs(bl.vx) }
    if (bl.y - bl.r < 0)      { bl.y = bl.r;           bl.vy =  Math.abs(bl.vy) }

    // Paddle collision (swarm balls ignore paddle)
    if (!isSwarm) {
      const pw = this.padWidth()
      if (bl.y + bl.r > this.pad.y && bl.y + bl.r < this.pad.y + this.PAD_H + 16 &&
          bl.x > this.pad.x - bl.r && bl.x < this.pad.x + pw + bl.r) {
        const relHit      = (bl.x - (this.pad.x + pw / 2)) / (pw / 2)  // -1 to +1 hit position
        const bounceAngle = -Math.PI / 2 + relHit * PADDLE_ANGLE_MAX
        const speed       = Math.hypot(bl.vx, bl.vy) || targetSpeed
        bl.vx = Math.cos(bounceAngle) * speed
        bl.vy = Math.sin(bounceAngle) * speed
        if (bl.vy > -2) bl.vy = -2  // Always ensure upward velocity
        bl.y = this.pad.y - bl.r
        Audio.paddleBounce()  // Play paddle hit sound
        if (this.relic?.id === 'cannon') bl.r = bl.baseR  // Reset Cannon relic size
        if (this.upgrades.twin && this.splitTimer <= 0) {
          this.splitTimer = TWIN_DURATION
          this.extraBalls.push({ x: bl.x, y: bl.y, vx: -bl.vx * 0.85, vy: bl.vy * 0.95, r: bl.r, baseR: bl.baseR })
        }
        if (this.upgrades.singularity && this.singularityTimer <= 0) {
          this.singularityTimer = SINGULARITY_DURATION  // Activate Singularity on paddle hit
        }
      }
    }

    // Brick collision
    if (this.upgrades.ghostball) {
      // Ghost Ball: pass through all bricks, hitting every one.
      // Use swept checks so fast movement still registers hits.
      for (const b of this.bricks) {
        if (!b.alive) continue
        const overlapsNow =
          bl.x + bl.r > b.x && bl.x - bl.r < b.x + b.w &&
          bl.y + bl.r > b.y && bl.y - bl.r < b.y + b.h
        const sweptHit = this.sweptCircleBrickHit(prevX, prevY, bl.x, bl.y, bl.r, b)
        if (overlapsNow || sweptHit) {
          this.combo++
          if (this.upgrades.momentum) this.momentumStacks = Math.min(MOMENTUM_MAX_STACKS, this.momentumStacks + 1)
          this.hitBrick(b)
          if (this.relic?.id === 'cannon') bl.r = Math.max(this.BALL_R * BALL_CANNON_MIN, bl.r * BALL_CANNON_SHRINK)
        }
      }
    } else {
      // Normal ball: use earliest swept collision so high-speed balls don't tunnel.
      let firstHit = null
      let firstHitT = 2

      for (const b of this.bricks) {
        if (!b.alive) continue
        const hit = this.sweptCircleBrickHit(prevX, prevY, bl.x, bl.y, bl.r, b)
        if (hit && hit.t < firstHitT) {
          firstHit = { brick: b, ...hit }
          firstHitT = hit.t
        }
      }

      if (firstHit) {
        // Rewind to exact collision moment.
        bl.x = prevX + (bl.x - prevX) * firstHit.t
        bl.y = prevY + (bl.y - prevY) * firstHit.t

        // Reflect based on impact normal and nudge out to avoid re-penetration.
        if (firstHit.nx !== 0) bl.vx *= -1
        if (firstHit.ny !== 0) bl.vy *= -1
        bl.x += firstHit.nx * 1.5
        bl.y += firstHit.ny * 1.5

        this.combo++
        if (this.upgrades.momentum) this.momentumStacks = Math.min(MOMENTUM_MAX_STACKS, this.momentumStacks + 1)
        this.hitBrick(firstHit.brick)
        if (this.relic?.id === 'cannon') bl.r = Math.max(this.BALL_R * BALL_CANNON_MIN, bl.r * BALL_CANNON_SHRINK)
      }
    }
  }

  // Swept point-vs-expanded-rect test (circle vs AABB along a segment).
  // Returns earliest hit with normal and time, or null if no hit in this frame.
  sweptCircleBrickHit(x0, y0, x1, y1, r, b) {
    const minX = b.x - r
    const maxX = b.x + b.w + r
    const minY = b.y - r
    const maxY = b.y + b.h + r
    const dx = x1 - x0
    const dy = y1 - y0

    if (dx === 0 && dy === 0) return null

    let txEntry = -Infinity, txExit = Infinity
    if (dx === 0) {
      if (x0 < minX || x0 > maxX) return null
    } else {
      const tx1 = (minX - x0) / dx
      const tx2 = (maxX - x0) / dx
      txEntry = Math.min(tx1, tx2)
      txExit  = Math.max(tx1, tx2)
    }

    let tyEntry = -Infinity, tyExit = Infinity
    if (dy === 0) {
      if (y0 < minY || y0 > maxY) return null
    } else {
      const ty1 = (minY - y0) / dy
      const ty2 = (maxY - y0) / dy
      tyEntry = Math.min(ty1, ty2)
      tyExit  = Math.max(ty1, ty2)
    }

    const entry = Math.max(txEntry, tyEntry)
    const exit  = Math.min(txExit, tyExit)
    if (entry > exit || exit < 0 || entry > 1) return null

    let nx = 0, ny = 0
    if (txEntry > tyEntry) nx = dx > 0 ? -1 : 1
    else if (tyEntry > txEntry) ny = dy > 0 ? -1 : 1
    else {
      nx = dx > 0 ? -1 : 1
      ny = dy > 0 ? -1 : 1
    }

    return { t: Math.max(0, entry), nx, ny }
  }

  // ─────────────────────────────────────────────────────────────────────────
  //  IS ARMORED HIT — The Forge mechanic
  //  Returns true if this hit came from an armored side (should be blocked).
  //  Returns false if the brick has no armor or if hit from the exposed side.
  //
  //  HOW IT WORKS:
  //  We determine which side of the brick the ball hit by comparing the
  //  ball's velocity direction to the brick's exposed side.
  //  If the ball is moving downward (vy > 0) and hits a brick's TOP,
  //  that's a hit from above. If the brick's exposedSide is 'top', damage goes through.
  //  If exposedSide is anything else, the hit is blocked.
  //
  //  PARAMETERS:
  //    bl — the ball object (needs vx, vy to determine approach direction)
  //    b  — the brick object (needs exposedSide property)
  // ─────────────────────────────────────────────────────────────────────────
  isArmoredHit(bl, b) {
    // If brick has no armor (Void world), never block
    if (!b.exposedSide) return false

    // Determine which side the ball approached from using velocity direction
    // Ball moving down (vy > 0) + hitting brick = hit from TOP
    // Ball moving up   (vy < 0) + hitting brick = hit from BOTTOM
    // Ball moving right(vx > 0) + hitting brick = hit from LEFT side
    // Ball moving left (vx < 0) + hitting brick = hit from RIGHT side
    const hitFromAbove = bl.vy > 0   // Ball falling down — hitting brick top
    const hitFromBelow = bl.vy < 0   // Ball rising up — hitting brick bottom
    const hitFromLeft  = bl.vx > 0   // Ball moving right — hitting brick left side
    const hitFromRight = bl.vx < 0   // Ball moving left — hitting brick right side

    // Map velocity direction to which side of the brick was hit
    let hitSide = null
    const ox = Math.min(bl.x + bl.r - b.x, b.x + b.w - (bl.x - bl.r))  // Horizontal overlap
    const oy = Math.min(bl.y + bl.r - b.y, b.y + b.h - (bl.y - bl.r))  // Vertical overlap

    if (ox < oy) {
      // Horizontal collision (hit left or right side of brick)
      hitSide = hitFromLeft ? 'left' : 'right'
    } else {
      // Vertical collision (hit top or bottom of brick)
      hitSide = hitFromAbove ? 'top' : 'bottom'
    }

    // If the hit side matches the exposed side — damage goes through (not armored)
    // If it doesn't match — this is an armored hit (block the damage)
    return hitSide !== b.exposedSide
  }

  // Fires Judgement Beam: destroys all bricks in the column above paddle center
  fireJudgementBeam() {
    const bx = this.pad.x + this.padWidth() / 2  // Beam column X
    let destroyed = 0
    for (const b of this.bricks) {
      if (!b.alive) continue
      if (bx > b.x && bx < b.x + b.w) {
        b.alive = false; destroyed++
        this.spawnParticles(b.x + b.w / 2, b.y + b.h / 2, b.color, 8)
        this.registry.set('bricksShattered', (this.registry.get('bricksShattered') || 0) + 1)
      }
    }
    if (destroyed > 0) {
      Audio.judgementBeam()  // Powerful boom on beam fire
    this.cameras.main.shake(200, 0.006)
      const flash = this.add.graphics()  // Bright column flash effect
      flash.fillStyle(0xfff0d2, 0.7)
      flash.fillRect(bx - 8, 0, 16, this.H)
      this.tweens.add({ targets: flash, alpha: 0, duration: 300, onComplete: () => flash.destroy() })
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  //  UPDATE FORGE ANVIL
  //  Rotates the shield wall around the boss bricks.
  //  Called every frame from update() when worldId === 'forge' and isBoss is true.
  //  The shield acts as a visual indicator — if the ball approaches from the
  //  shield side it deflects; approaching from the gap deals damage.
  // ─────────────────────────────────────────────────────────────────────────
  updateForgeAnvil(dt) {
    // Rotate shield clockwise continuously
    this.anvilShieldAngle += this.anvilShieldSpeed
    if (this.anvilShieldAngle > Math.PI * 2) {
      this.anvilShieldAngle -= Math.PI * 2  // Wrap around at full rotation
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  //  IS SHIELD BLOCKED
  //  Returns true if the ball is approaching the boss from the shielded arc.
  //  The shield is a rotating arc. The gap in the arc is the vulnerable angle.
  //  Used to block ball damage when it hits from the shielded angle.
  //
  //  PARAMETERS:
  //    bl — ball object (x, y position)
  //    b  — boss brick object (x, y, w, h)
  // ─────────────────────────────────────────────────────────────────────────
  isShieldBlocked(bl, b) {
    if (!this.isBoss || this.worldId !== 'forge') return false  // Only in Forge boss room

    // Calculate the angle from the boss center to the ball
    const bossCX = b.x + b.w / 2  // Boss center X
    const bossCY = b.y + b.h / 2  // Boss center Y
    const angle  = Math.atan2(bl.y - bossCY, bl.x - bossCX)  // Angle in radians

    // Normalize angle to 0-2π range
    const normalizedAngle = ((angle % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2)

    // Check if the ball's approach angle falls within the shield arc
    // Shield goes from anvilShieldAngle to anvilShieldAngle + shieldLength
    const shieldStart = this.anvilShieldAngle
    const shieldEnd   = this.anvilShieldAngle + this.anvilShieldLength

    // Handle arc wrap-around (when shield crosses the 0/2π boundary)
    if (shieldEnd > Math.PI * 2) {
      // Shield wraps around — check two ranges
      return normalizedAngle >= shieldStart || normalizedAngle <= (shieldEnd - Math.PI * 2)
    }

    return normalizedAngle >= shieldStart && normalizedAngle <= shieldEnd
  }

  // Decrements lives, resets ball or ends run
  loseLife() {
    if (TUNING.debug.enabled && TUNING.debug.invulnerable) return
    const lives = (this.registry.get('lives') || 1) - 1
    this.registry.set('lives', lives)
    this.combo = 1; this.registry.set('combo', 1)
    this.momentumStacks = 0; this.unbrokenHits = 0
    this.updateHUD()
    if (lives <= 0) { this.endRun(); return }
    this.resetBall()
  }

  // ── HUD ────────────────────────────────────────────────────────────────────

  updateHUD() {
    const lives = this.registry.get('lives') || 0
    const score = this.registry.get('score') || 0
    this.scoreText.setText(score.toLocaleString())
    this.livesText.setText('I'.repeat(Math.max(0, lives)))
    this.comboText.setText(this.combo > 2 ? `x${this.combo}` : '')

    const labels = {
      momentum: 'Momentum', hotstreak: 'Hot Streak', ricochet: 'Ricochet', unbroken: 'Unbroken',
      splinter: 'Splinter', blastradius: 'Blast+', domino: 'Domino', inferno: 'Inferno',
      familiar: 'Familiar', twin: 'Twin', ghostball: 'Ghost', swarm: 'Swarm',
      laser: 'Laser', rapidfire: 'Rapid', piercing: 'Pierce', judgement: 'Judgement',
      leadcore: 'Lead Core', wrecking: 'Wrecker', gravitywell: 'Gravity', singularity: 'Singularity',
      wide: 'Wide Pad', glasscannon: 'Glass Cannon', blindfold: 'Blindfold', overcharge: 'Overcharge'
    }
    this.upgradesText.setText(Object.keys(this.upgrades).map(k => labels[k] || k).join(' · '))

    const status = []
    if (this.hotStreakTimer > 0)   status.push('hot streak!')
    if (this.singularityTimer > 0) status.push('SINGULARITY')
    if (this.upgrades.momentum && this.momentumStacks > 0) status.push(`momentum ${this.momentumStacks}/${MOMENTUM_MAX_STACKS}`)
    if (this.upgrades.judgement && this.launched) {
      const pct = this.judgementCharge / JUDGEMENT_CHARGE_TIME
      if (pct > 0.2) status.push(`charging ${Math.round(pct * 100)}%`)
    }
    if (this.relic?.id === 'pendulum' && this.launched && this.pendulumFast) status.push('FAST — brace!')
    if (this.upgrades.unbroken && this.unbrokenHits > 0) status.push(`unbroken: ${this.unbrokenHits}/20`)
    this.statusText.setText(status.filter(Boolean).join('  '))
  }

  // ── End Run ────────────────────────────────────────────────────────────────

  endRun() {
    this.gameOver = true
    Audio.death()  // Descending melancholy tones
    const roomsCleared    = this.registry.get('roomsCleared')    || 0
    const bricksShattered = this.registry.get('bricksShattered') || 0
    const workshopData    = this.registry.get('workshopData')    || {}
    const baseShards      = roomsCleared * 12 + Math.floor(bricksShattered / 3)
    const bonusMult       = 1 + (workshopData.shardBonus || 0) * 0.2  // Keen Eye bonus
    const shardsEarned    = Math.round(Math.min(baseShards * bonusMult, 100))  // Cap at 100
    const totalShards     = (this.registry.get('totalShards') || 0) + shardsEarned
    this.registry.set('totalShards',  totalShards)
    this.registry.set('shardsEarned', shardsEarned)
    this.cameras.main.fadeOut(300, 245, 240, 228)
    this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start('DeathScene'))
  }

  // ── Drawing ────────────────────────────────────────────────────────────────

  // Displaces a point using sine/cosine waves — creates hand-drawn wobble
  wobble(x, y, t, amplitude = 1) {
    return [x + Math.sin(y * 0.14 + t) * amplitude, y + Math.cos(x * 0.11 + t) * amplitude]
  }

  // Draws a wobbled (hand-drawn) rectangle
  drawWRect(g, x, y, w, h, colorHex, lineWidth, t, fillHex, fillAlpha, flash) {
    const steps = 10, amp = flash ? 2.5 : 0.9, pts = []
    for (let i = 0; i <= steps; i++) pts.push(this.wobble(x + w * i / steps, y,     t, amp))
    for (let i = 0; i <= steps; i++) pts.push(this.wobble(x + w, y + h * i / steps, t, amp))
    for (let i = steps; i >= 0; i--) pts.push(this.wobble(x + w * i / steps, y + h, t, amp))
    for (let i = steps; i >= 0; i--) pts.push(this.wobble(x, y + h * i / steps,     t, amp))
    if (fillAlpha > 0) {
      g.fillStyle(fillHex, fillAlpha); g.beginPath(); g.moveTo(pts[0][0], pts[0][1])
      pts.slice(1).forEach(p => g.lineTo(p[0], p[1])); g.closePath(); g.fillPath()
    }
    g.lineStyle(flash ? lineWidth + 1 : lineWidth, flash ? 0x8a4020 : colorHex, 1)
    g.beginPath(); g.moveTo(pts[0][0], pts[0][1])
    pts.slice(1).forEach(p => g.lineTo(p[0], p[1])); g.closePath(); g.strokePath()
  }

  // Draws a wobbled (hand-drawn) circle
  drawWCircle(g, x, y, r, colorHex, lineWidth, t, fillHex, fillAlpha) {
    const pts = []
    for (let i = 0; i <= 24; i++) {
      const a = Math.PI * 2 * i / 24
      pts.push([x + Math.cos(a) * (r + Math.sin(a * 3 + t) * 0.9), y + Math.sin(a) * (r + Math.cos(a * 2 + t) * 0.9)])
    }
    if (fillAlpha > 0) {
      g.fillStyle(fillHex, fillAlpha); g.beginPath(); g.moveTo(pts[0][0], pts[0][1])
      pts.slice(1).forEach(p => g.lineTo(p[0], p[1])); g.closePath(); g.fillPath()
    }
    g.lineStyle(lineWidth, colorHex, 1); g.beginPath(); g.moveTo(pts[0][0], pts[0][1])
    pts.slice(1).forEach(p => g.lineTo(p[0], p[1])); g.closePath(); g.strokePath()
  }

  // Draws faint horizontal lines to simulate paper texture
  drawPaperTexture() {
    const g = this.add.graphics()
    g.lineStyle(1, 0xa08060, 0.04)
    for (let y = 0; y < this.H; y += 3) g.lineBetween(0, y, this.W, y)
  }

  // Redraws all visual layers every frame
  drawFrame() {
    const t = this.wobbleTime

    // Ink puddles (Ink Drop relic)
    this.gInkPools.clear()
    for (const pool of this.inkPools) {
      this.gInkPools.fillStyle(0x2a1f0e, (pool.life / INKPOOL_DURATION) * 0.15)
      this.gInkPools.fillEllipse(pool.x, pool.y, pool.r * 2, pool.r * 0.8)
    }

    // Ball ink trail — directional smear in direction of travel
    this.gTrail.clear()
    for (const p of this.inkTrail) {
      const speed = Math.hypot(p.vx, p.vy) || 1
      const nx = p.vx / speed, ny = p.vy / speed  // Normalized direction vector
      this.gTrail.lineStyle(p.size * (1.5 + p.life), 0x2a1f0e, p.life * 0.2)
      this.gTrail.lineBetween(p.x - nx * p.size * 2.5, p.y - ny * p.size * 2.5, p.x + nx * p.size * 1.5, p.y + ny * p.size * 1.5)
    }

    // Bricks — discrete HP-based fill colors:
    //   3 HP  → nearly black  (0x1a1208, alpha 0.95)
    //   2 HP  → dark grey     (0x2a1f0e, alpha 0.65)
    //   1 HP  → light grey    (0x2a1f0e, alpha 0.25)
    //   flash → warm yellow   (0xfff0d2)
    // HP numbers are NOT drawn — color alone communicates health.
    this.gBricks.clear()
    for (const b of this.bricks) {
      if (!b.alive) continue
      const flash = b.flashTimer > 0

      // Choose fill color and opacity based on exact HP value (not a fraction)
      let brickFill, brickAlpha, lineW
      if (flash) {
        brickFill  = 0xfff0d2  // Warm yellow flash on hit
        brickAlpha = 0.85
        lineW      = b.boss ? 3 : 2
      } else if (b.hp >= 3) {
        brickFill  = 0x1a1208  // Near-black for max HP
        brickAlpha = 0.95
        lineW      = b.boss ? 2.5 : 1.5
      } else if (b.hp === 2) {
        brickFill  = 0x2a1f0e  // Dark ink for medium HP
        brickAlpha = 0.60
        lineW      = b.boss ? 2 : 1.2
      } else {
        brickFill  = 0x2a1f0e  // Same ink color but very light for 1 HP
        brickAlpha = 0.22
        lineW      = b.boss ? 2 : 0.8
      }

      this.drawWRect(this.gBricks, b.x, b.y, b.w, b.h, b.color, lineW, t + b.seed, brickFill, brickAlpha, flash)

      if (b.shardBrick && !flash) {
        // Crystal marker so shard bricks read as special loot.
        const cx = b.x + b.w * 0.5
        const cy = b.y + b.h * 0.5
        const sr = Math.min(b.w, b.h) * 0.28
        this.gBricks.fillStyle(0xf1cd73, 0.9)
        this.gBricks.beginPath()
        this.gBricks.moveTo(cx,      cy - sr)
        this.gBricks.lineTo(cx + sr, cy)
        this.gBricks.lineTo(cx,      cy + sr)
        this.gBricks.lineTo(cx - sr, cy)
        this.gBricks.closePath()
        this.gBricks.fillPath()
        this.gBricks.lineStyle(1.2, 0x8a6030, 0.8)
        this.gBricks.strokePath()
      }

      // ── FORGE ARMOR INDICATOR ──
      // Draw exposed side as a gap in the border, armored sides as golden lines
      if (b.exposedSide && !flash) {
        const ex = b.x, ey = b.y, ew = b.w, eh = b.h
        const GAP = 6  // Gap width in pixels — shows exposed side

        // Draw golden lines on the 3 armored sides
        this.gBricks.lineStyle(2, 0x8a6030, 0.7)  // Amber/rust color for The Forge

        if (b.exposedSide !== 'top') {
          // Top side is armored — draw golden line
          this.gBricks.lineBetween(ex, ey, ex + ew, ey)
        }
        if (b.exposedSide !== 'bottom') {
          this.gBricks.lineBetween(ex, ey + eh, ex + ew, ey + eh)
        }
        if (b.exposedSide !== 'left') {
          this.gBricks.lineBetween(ex, ey, ex, ey + eh)
        }
        if (b.exposedSide !== 'right') {
          this.gBricks.lineBetween(ex + ew, ey, ex + ew, ey + eh)
        }

        // Draw a small arrow/gap on the exposed side to highlight it
        const cx = ex + ew / 2  // Brick center X
        const cy = ey + eh / 2  // Brick center Y
        this.gBricks.fillStyle(0xf0c060, 0.6)  // Bright gold for the exposed indicator

        if (b.exposedSide === 'top') {
          // Small triangle pointing up on the top edge
          this.gBricks.fillTriangle(cx - 4, ey + 2, cx + 4, ey + 2, cx, ey - 4)
        } else if (b.exposedSide === 'bottom') {
          this.gBricks.fillTriangle(cx - 4, ey + eh - 2, cx + 4, ey + eh - 2, cx, ey + eh + 4)
        } else if (b.exposedSide === 'left') {
          this.gBricks.fillTriangle(ex + 2, cy - 4, ex + 2, cy + 4, ex - 4, cy)
        } else if (b.exposedSide === 'right') {
          this.gBricks.fillTriangle(ex + ew - 2, cy - 4, ex + ew - 2, cy + 4, ex + ew + 4, cy)
        }
      }
    }

    // ── FORGE BOSS SHIELD (The Anvil) ──
    // Draw the rotating shield arc around the boss brick cluster
    if (this.isBoss && this.worldId === 'forge' && this.bricks.some(b => b.alive && b.boss)) {
      // Find the center of the boss brick group
      const bossBricks = this.bricks.filter(b => b.alive && b.boss)
      if (bossBricks.length > 0) {
        const avgX    = bossBricks.reduce((sum, b) => sum + b.x + b.w / 2, 0) / bossBricks.length
        const avgY    = bossBricks.reduce((sum, b) => sum + b.y + b.h / 2, 0) / bossBricks.length
        const radius  = Math.round(this.W * 0.20)  // Shield orbits 20% of screen width from center

        // Draw shield arc — amber/rust color for The Forge
        this.gBricks.lineStyle(4, 0x8a6030, 0.75)
        this.gBricks.beginPath()
        this.gBricks.arc(
          avgX, avgY,               // Center of arc
          radius,                    // Radius
          this.anvilShieldAngle,     // Start angle
          this.anvilShieldAngle + this.anvilShieldLength,  // End angle
          false                      // Clockwise
        )
        this.gBricks.strokePath()

        // Draw shield end caps as small dots to make the gap visible
        const capAlpha = 0.9
        this.gBricks.fillStyle(0xf0a030, capAlpha)
        // Start cap
        const sx = avgX + Math.cos(this.anvilShieldAngle) * radius
        const sy = avgY + Math.sin(this.anvilShieldAngle) * radius
        this.gBricks.fillCircle(sx, sy, 4)
        // End cap
        const ex = avgX + Math.cos(this.anvilShieldAngle + this.anvilShieldLength) * radius
        const ey = avgY + Math.sin(this.anvilShieldAngle + this.anvilShieldLength) * radius
        this.gBricks.fillCircle(ex, ey, 4)
      }
    }

    // Lasers — manual dashed segments (Phaser has no setLineDash)
    this.gLasers.clear()
    for (const laser of this.lasers) {
      let cy = laser.y, drawing = true
      while (cy > laser.y - 28) {
        const segEnd = Math.max(laser.y - 28, cy - (drawing ? 4 : 3))
        if (drawing) { this.gLasers.lineStyle(1.5, 0x3c2810, 0.7); this.gLasers.lineBetween(laser.x, cy, laser.x, segEnd) }
        cy = segEnd; drawing = !drawing
      }
      this.gLasers.fillStyle(0xb47828, 0.5); this.gLasers.fillCircle(laser.x, laser.y, 3)
    }

    // Familiar orbit
    this.gBall.clear()
    if (this.upgrades.familiar) {
      const fx = this.ball.x + Math.cos(this.familiarAngle) * this.ball.r * FAMILIAR_ORBIT
      const fy = this.ball.y + Math.sin(this.familiarAngle) * this.ball.r * FAMILIAR_ORBIT
      this.drawWCircle(this.gBall, fx, fy, Math.round(this.BALL_R * 0.5), 0x6a5a4a, 1.2, t, 0xc8b496, 0.55)
      this.gBall.lineStyle(0.8, 0x2a1f0e, 0.1)
      this.gBall.lineBetween(this.ball.x, this.ball.y, fx, fy)
    }

    // Judgement Beam charge indicator — faint vertical line growing more visible as charge builds
    if (this.upgrades.judgement && this.judgementCharge > 0) {
      const pct = this.judgementCharge / JUDGEMENT_CHARGE_TIME
      const bx  = this.pad.x + this.padWidth() / 2
      this.gBall.lineStyle(2, 0x2a1f0e, pct * 0.6)
      this.gBall.lineBetween(bx, this.pad.y, bx, 0)
    }

    // All balls
    for (const bl of [this.ball, ...this.extraBalls]) {
      this.drawWCircle(this.gBall, bl.x, bl.y, bl.r, 0x2a1f0e, 1.5, t, 0xf5f0e4, 1)
    }
    for (const bl of this.swarmBalls) {
      this.drawWCircle(this.gBall, bl.x, bl.y, bl.r, 0x6a5a4a, 1, t, 0xf5f0e4, 0.7)  // Slightly different style
    }

    // Paddle
    this.gPad.clear()
    const pw = this.padWidth()
    const isGhost = this.relic?.id === 'ghost'      // Ghost relic: nearly invisible paddle
    const isBlind = !!this.upgrades.blindfold       // Blindfold curse: paddle effectively invisible
    const padAlpha = isBlind ? 0.02 : (isGhost ? 0.04 : 0.1)
    this.drawWRect(this.gPad, this.pad.x, this.pad.y, pw, this.PAD_H, 0x2a1f0e, 2, t, 0x2a1f0e, padAlpha, false)
    if (!isGhost && !isBlind) {
      this.gPad.lineStyle(0.8, 0x2a1f0e, 0.25)
      this.gPad.lineBetween(this.pad.x + 10, this.pad.y + this.PAD_H * 0.55, this.pad.x + pw - 10, this.pad.y + this.PAD_H * 0.55)
    }

    // Particles
    this.gParticles.clear()
    for (const p of this.particles) {
      this.gParticles.fillStyle(p.color, p.life); this.gParticles.fillCircle(p.x, p.y, p.size)
    }

    // ── Currency pickups ──
    // Shards: faceted crystal. Diamonds: rotated square. Bombs: red warning orb.
    for (const s of this.shardPickups) {
      if (s.collected) continue
      const ss = 8
      this.gParticles.fillStyle(0xe8c468, 0.95)
      this.gParticles.beginPath()
      this.gParticles.moveTo(s.x,      s.y - ss)
      this.gParticles.lineTo(s.x + ss, s.y - 2)
      this.gParticles.lineTo(s.x + 5,  s.y + ss)
      this.gParticles.lineTo(s.x - 5,  s.y + ss)
      this.gParticles.lineTo(s.x - ss, s.y - 2)
      this.gParticles.closePath()
      this.gParticles.fillPath()
      this.gParticles.lineStyle(1.5, 0x8a6030, 0.9)
      this.gParticles.strokePath()
      this.gParticles.fillStyle(0xffe7ad, 0.8)
      this.gParticles.fillCircle(s.x - 2, s.y - 3, 2)
    }

    for (const d of this.diamondPickups) {
      if (d.collected) continue
      // Diamond drawn as a rotated square (4 lines forming a diamond shape)
      const ds = 6  // Half-size of diamond in pixels
      this.gParticles.fillStyle(0x1840a0, 0.9)          // Deep blue — premium currency
      this.gParticles.beginPath()
      this.gParticles.moveTo(d.x,      d.y - ds)        // Top point
      this.gParticles.lineTo(d.x + ds, d.y)             // Right point
      this.gParticles.lineTo(d.x,      d.y + ds)        // Bottom point
      this.gParticles.lineTo(d.x - ds, d.y)             // Left point
      this.gParticles.closePath()
      this.gParticles.fillPath()
      this.gParticles.lineStyle(1.5, 0x85b7eb, 0.8)     // Light blue outline
      this.gParticles.strokePath()
    }

    for (const b of this.bombPickups) {
      if (b.collected) continue
      const pulse = 0.5 + 0.5 * Math.sin(t * 10 + b.y * 0.04)
      const br = 10 + pulse * 3

      // Outer warning ring pulses to make bombs readable at a glance.
      this.gParticles.lineStyle(2 + pulse * 1.5, 0xff6a5c, 0.35 + pulse * 0.45)
      this.gParticles.strokeCircle(b.x, b.y, br + 4 + pulse * 2)

      // Main body: large red warning token
      this.gParticles.fillStyle(0x9c2018, 0.96)
      this.gParticles.fillCircle(b.x, b.y, br)
      this.gParticles.lineStyle(2, 0xf19a90, 0.95)
      this.gParticles.strokeCircle(b.x, b.y, br)

      // Fuse nub
      this.gParticles.lineStyle(2, 0x2a1f0e, 0.9)
      this.gParticles.lineBetween(b.x + 4, b.y - br + 1, b.x + 9, b.y - br - 4)
      this.gParticles.fillStyle(0xf0c060, 0.95)
      this.gParticles.fillCircle(b.x + 10, b.y - br - 5, 2 + pulse * 0.8)

      // Skull-like hazard mark in white for immediate "bad" readability
      this.gParticles.fillStyle(0xf8f2ea, 0.95)
      this.gParticles.fillCircle(b.x, b.y - 1, 5)
      this.gParticles.fillStyle(0x2a1f0e, 0.95)
      this.gParticles.fillCircle(b.x - 2, b.y - 2, 1.2)
      this.gParticles.fillCircle(b.x + 2, b.y - 2, 1.2)
      this.gParticles.lineStyle(1.2, 0x2a1f0e, 0.9)
      this.gParticles.lineBetween(b.x - 2.5, b.y + 3, b.x + 2.5, b.y + 3)
    }

    // HUD bars
    this.gHUD.clear()
    if (this.relic?.id === 'clockwork' && this.launched) {
      const pct = Math.max(0, this.clockTimer / CLOCKWORK_START)
      this.gHUD.fillStyle(0x2a1f0e, 0.08); this.gHUD.fillRect(0, this.H - 4, this.W, 4)
      this.gHUD.fillStyle(pct > 0.3 ? 0x2a1f0e : 0xa02818, 0.5); this.gHUD.fillRect(0, this.H - 4, this.W * pct, 4)
    }
    if (this.upgrades.momentum && this.momentumStacks > 0) {
      const pct = this.momentumStacks / MOMENTUM_MAX_STACKS
      this.gHUD.fillStyle(0x2a1f0e, 0.06); this.gHUD.fillRect(8, this.H - 10, this.W * 0.3, 3)
      this.gHUD.fillStyle(0x4a3020, 0.5); this.gHUD.fillRect(8, this.H - 10, this.W * 0.3 * pct, 3)
    }
    if (this.singularityTimer > 0) {
      const pct = this.singularityTimer / SINGULARITY_DURATION
      this.gHUD.fillStyle(0x8a4020, 0.4); this.gHUD.fillRect(0, this.H - 8, this.W * pct, 8)
    }
  }

  flashBombWarning() {
    const band = this.add.rectangle(this.W / 2, 0, this.W, 14, 0xa02010, 0).setOrigin(0.5, 0)
    this.tweens.add({
      targets:  band,
      alpha:    0.42,
      duration: 90,
      yoyo:     true,
      onComplete: () => band.destroy()
    })
    Audio.bombWarning()
    this.bombWarnTimer = 850
  }
}