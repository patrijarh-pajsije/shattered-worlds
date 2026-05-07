// ─────────────────────────────────────────────────────────────────────────────
//  GameScene.js — Core gameplay scene
//  See CLAUDE.md for project rules and conventions.
// ─────────────────────────────────────────────────────────────────────────────

import * as Phaser from 'phaser'
import { Audio }    from '../game/audio.js'   // Procedural audio system
import { getWorld }  from '../game/worlds.js'  // World definitions and palettes
import { TUNING } from '../game/tuning.js'
import { applyBrickTypeData, BRICK_TYPE_IDS, getBrickTypeDefinition, rollGridBrickVariant } from '../game/brickTypes.js'
import { rollStandardBrickPickup } from '../game/pickups.js'
import { loadLevelById } from '../game/levelStore.js'

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
const CARTOGRAPHER_PREVIEW_MS  = TUNING.timers.cartographerPreviewMs
const OVERCHARGE_SPEED_MULT    = TUNING.multipliers.overchargeSpeed
const OVERCHARGE_PAD_MULT      = TUNING.multipliers.overchargePad
const PARTICLE_GRAVITY         = TUNING.effects.particleGravity
const PARTICLE_DRAG            = TUNING.effects.particleDrag
const PARTICLE_FADE            = TUNING.effects.particleFade
const TRAIL_FADE               = TUNING.effects.trailFade
const BRICK_FLASH_FRAMES       = TUNING.bricks.flashFrames // Frames a brick flashes after being hit
const BRICK_GAP_CHANCE         = TUNING.bricks.gapChance // Probability a brick slot is left empty
const SCREEN_SHAKE_BOSS        = { duration: TUNING.effects.shakeBossDuration, intensity: TUNING.effects.shakeBossIntensity }
const SCREEN_SHAKE_SPLINTER    = { duration: TUNING.effects.shakeSplinterDuration,  intensity: TUNING.effects.shakeSplinterIntensity }

// ── Currency drop constants ──
const BOSS_DIAMOND_REWARD      = TUNING.drops.bossDiamondReward // Diamonds awarded after killing a boss
const SHARD_FALL_SPEED         = TUNING.drops.shardFallSpeed // Shard fall speed × screen height per frame
const ORB_DROP_CHANCE          = TUNING.drops.orbChance
const ORB_FALL_SPEED           = TUNING.drops.orbFallSpeed
const CURRENCY_COLLECT_RADIUS  = TUNING.drops.collectRadius // Auto-collect radius × screen width
const SHARD_BURST_COUNT        = TUNING.drops.shardBurstCount
const SHARD_BURST_PHASE_MS     = TUNING.drops.shardBurstPhaseMs
const SHARD_BURST_MIN_SPD      = TUNING.drops.shardBurstMinSpeed
const SHARD_BURST_MAX_SPD      = TUNING.drops.shardBurstMaxSpeed
const SHARD_FALL_DRIFT_X       = TUNING.drops.shardFallDriftX
const SHARD_BURST_DRAG         = TUNING.drops.shardBurstDrag
const SHARD_BURST_BOUNCE_DAMP  = TUNING.drops.shardBurstBounceDamp
const ORB_FIREBALL_MS          = TUNING.orb.fireballMs
const GARDEN_BOSS_EDGE_SPAWN_MS = TUNING.worldMechanics.gardenBossEdgeSpawnMs
const GARDEN_BOSS_EDGE_SPAWN_HP = TUNING.worldMechanics.gardenBossEdgeSpawnHp
const GARDEN_BOSS_CORE_HP = TUNING.worldMechanics.gardenBossCoreHp
const ABYSS_BOSS_BRICK_HP = TUNING.worldMechanics.abyssBossBrickHp
const ABYSS_BOSS_DRIFT_PX_PER_MS = TUNING.worldMechanics.abyssBossDriftPxPerMs
const ABYSS_BOSS_PENALTY_COOLDOWN_MS = TUNING.worldMechanics.abyssBossPenaltyCooldownMs
const STORM_BOSS_HP = TUNING.worldMechanics.stormBossHp
const STORM_BOSS_MOVE_INTERVAL_MS = TUNING.worldMechanics.stormBossMoveIntervalMs
const STORM_BOSS_MOVE_DURATION_MS = TUNING.worldMechanics.stormBossMoveDurationMs
const DESKTOP_WORLD_SCALE = 0.55
const DESKTOP_TEXT_SCALE = 0.38

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
    const W = this.scale.gameSize?.width || this.scale.width
    const H = this.scale.gameSize?.height || this.scale.height
    this.W = W
    this.H = H

    // ── Derived pixel values from fraction-based constants ──
    this.COLS   = TUNING.layout.cols                               // Number of brick columns
    this.BW     = Math.floor((W - TUNING.layout.boardPaddingX) / this.COLS) // Brick width in pixels
    this.BH     = Math.round(H * TUNING.layout.brickHeight * DESKTOP_WORLD_SCALE)            // Brick height in pixels
    this.BALL_R = Math.round(W * BALL_RADIUS * DESKTOP_WORLD_SCALE)      // Ball radius in pixels
    this.PAD_H  = Math.round(H * PADDLE_HEIGHT * DESKTOP_WORLD_SCALE)    // Paddle height in pixels
    this.PAD_W  = Math.round(W * PADDLE_WIDTH * DESKTOP_WORLD_SCALE)     // Paddle base width in pixels

    // Load world definition for palette and mechanic access
    this.world = getWorld(this.worldId)  // Full world object from worlds.js

    // ── Forge boss: The Anvil ──
    this.anvilShieldAngle  = 0       // Current rotation angle of the shield wall (radians)
    this.anvilShieldSpeed  = TUNING.forgeBoss.shieldSpeed   // Radians per frame the shield rotates
    this.anvilShieldLength = 0       // Shield arc length in radians (set when boss is built)

    // ── Guard flag — prevents win condition firing twice ──
    // CRITICAL: must be reset to false in create(), not just in resetBall()
    this.roomComplete = false
    this.transitioning = false   // True while fading/navigating to the next scene
    // goToScene() sets this after a room clear; must reset each room or DeathScene never runs
    this._sceneStarted = false

    // ── Game state ──
    this.launched         = false    // Has the ball been launched this room?
    // 0=normal, 1=first click/space readies after loseLife, 2=second click/space launches
    this.postDeathLaunchStep = 0
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
    /** Mirror relic: second ball with vx opposite to main; either floor = life loss. */
    this.mirrorTwinBall   = null     // { x, y, vx, vy, r, baseR } or null
    /** Cartographer relic: preview path until timer runs out or ball launches. */
    this.cartographerPreviewPoints = []
    this.cartographerPreviewTimer  = 0
    this.cartographerAngleJitter   = 0  // fixed per room so preview does not shimmer each frame

    // Garden: bricks scheduled to respawn at half HP after a delay.
    this.gardenRegrowQueue = []
    // Storm: gust state machine (countdown → telegraph → blow).
    this._stormWindPhase   = 'idle'
    this._stormWindTimer   = 0
    this._stormWindSign    = 1
    this.stormWindActive   = false
    // World 3-5 boss state (first pass)
    this.gardenBossSpawnTimer = 0
    this.abyssBossPenaltyCooldown = 0
    this.stormBossMoveTimer = STORM_BOSS_MOVE_INTERVAL_MS
    this.stormBossMoving = false
    this.stormBossMoveT = 0
    this.stormBossFrom = null
    this.stormBossTo = null
    // Debug telemetry for boss pacing checks (TTK estimate).
    this.bossDebugStartMs = 0
    this.bossDebugStartHp = 0
    this.bossDebugSamples = [] // [{ tMs, hp }] for rolling DPS/TTK
    this._worldMechanicsBaseline = JSON.parse(JSON.stringify(TUNING.worldMechanics))
    this._activeWorldMechanicProfile = 'A'
    this._worldMechanicTweaksHistory = []
    this._worldMechanicTweaksRedo = []
    this.unbrokenHits     = 0        // Consecutive hits for The Unbroken legendary
    this.scoreMultiplier  = this.registry.get('scoreMultiplier') || 1  // From curse cards
    this.speedRampTimer   = 0        // ms elapsed toward next global speed increase
    this.speedRampMult    = 1        // Global speed multiplier that grows over time
    this.orbFireballTimer = 0        // ms remaining on Fireball orb effect
    this.chargeToken      = null     // { typeId: 'fireball'|'shield'|'bomb' }
    this.orbArmed         = false    // True while orb arm mode is toggled on
    this.orbShieldCharges = 0        // Shield orb: prevents next life loss

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
    this.shardPickups   = []  // { x, y, vy, collected }; burst shards add vx, burst, burstTimer
    this.diamondPickups = []  // Falling diamond drops { x, y, vy, collected }
    this.orbPickups     = []  // Falling orb drops { x, y, vy, typeId, collected } (includes bomb-type orbs)
    this.bombWarnTimer  = 0   // ms countdown while a bomb-type orb is falling (danger cue)

    // Boss “duel” lives — stripped by triggered Fireball orb; Forge shield disables when this hits 0.
    this.bossDuelLives          = this.isBoss ? TUNING.combat.bossDuelLives : 0
    this.forgeBossShieldDisabled = false

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
    this.gCartographer = this.add.graphics()  // Cartographer relic: faint trajectory hint
    this.gStormFx    = this.add.graphics()  // Storm world: wind telegraph lines
    this.gLasers    = this.add.graphics()  // Laser beams
    this.gBall      = this.add.graphics()  // Balls and familiar
    this.gPad       = this.add.graphics()  // Paddle
    this.gParticles = this.add.graphics()  // Particles (topmost)
    this.gHUD       = this.add.graphics()  // HUD bars

    // ── HUD text objects ──
    this.scoreText = this.add.text(W * 0.08, 10, '0', {
      fontFamily: 'Georgia, serif', fontSize: Math.round(W * 0.045 * DESKTOP_TEXT_SCALE) + 'px', color: '#2a1f0e'
    }).setOrigin(0, 0)

    this.livesText = this.add.text(W / 2, 10, 'III', {
      fontFamily: 'Georgia, serif', fontSize: Math.round(W * 0.04 * DESKTOP_TEXT_SCALE) + 'px', color: '#2a1f0e'
    }).setOrigin(0.5, 0)

    this.roomText = this.add.text(W - W * 0.08, 10,
      this.isBoss ? 'BOSS' : `${this.roomNum}/3`, {
      fontFamily: 'Georgia, serif', fontSize: Math.round(W * 0.035 * DESKTOP_TEXT_SCALE) + 'px', color: '#8a7a6a'
    }).setOrigin(1, 0)

    this.relicText = this.add.text(W / 2, 48, this.relic ? this.relic.name : '', {
      fontFamily: 'Georgia, serif', fontSize: Math.round(W * 0.028 * DESKTOP_TEXT_SCALE) + 'px',
      color: '#8a7a6a', fontStyle: 'italic'
    }).setOrigin(0.5, 0)

    this.comboText = this.add.text(W * 0.08, 48, '', {
      fontFamily: 'Georgia, serif', fontSize: Math.round(W * 0.032 * DESKTOP_TEXT_SCALE) + 'px', color: '#8a7a6a'
    }).setOrigin(0, 0)

    this.msgText = this.add.text(W / 2, H * 0.68, 'click or press Space to launch', {
      fontFamily: 'Georgia, serif', fontSize: Math.round(W * 0.036 * DESKTOP_TEXT_SCALE) + 'px',
      color: '#6a5a4a', fontStyle: 'italic'
    }).setOrigin(0.5)

    this.upgradesText = this.add.text(W / 2, H * 0.72, '', {
      fontFamily: 'Georgia, serif', fontSize: Math.round(W * 0.026 * DESKTOP_TEXT_SCALE) + 'px', color: '#a89a8a'
    }).setOrigin(0.5)

    this.statusText = this.add.text(W / 2, H * 0.76, '', {
      fontFamily: 'Georgia, serif', fontSize: Math.round(W * 0.028 * DESKTOP_TEXT_SCALE) + 'px',
      color: '#7a3010', fontStyle: 'italic'
    }).setOrigin(0.5)

    // The Forge: one-line read of facing / boss shield (point 3 clarity)
    this.forgeHintText = this.add.text(W / 2, 64, '', {
      fontFamily:  'Georgia, serif',
      fontSize:    Math.round(W * 0.02 * DESKTOP_TEXT_SCALE) + 'px',
      color:       '#7a4a1a',
      fontStyle:   'italic',
      align:       'center',
      wordWrap:    { width: W * 0.92 }
    }).setOrigin(0.5, 0)
    if (this.worldId === 'forge' && this.isBoss) {
      this.forgeHintText.setColor('#7a4a1a')
      this.forgeHintText.setText('Amber wall blocks the ball—only the gap in the ring can hurt the boss')
      this.forgeHintText.setVisible(true)
    } else if (this.worldId === 'forge' && !this.isBoss) {
      this.forgeHintText.setColor('#7a4a1a')
      this.forgeHintText.setText('Bright notch = only weak side  ·  steel sides deflect the ball')
      this.forgeHintText.setVisible(true)
    } else if (this.worldId === 'abyss' && !this.isBoss) {
      this.forgeHintText.setColor('#203a68')
      this.forgeHintText.setText('Open edges — the ball can leave through any side')
      this.forgeHintText.setVisible(true)
    } else if (this.worldId === 'garden' && this.isBoss) {
      this.forgeHintText.setColor('#2a5a1e')
      this.forgeHintText.setText('The Root spreads — edge sprouts keep appearing while the boss lives')
      this.forgeHintText.setVisible(true)
    } else if (this.worldId === 'abyss' && this.isBoss) {
      this.forgeHintText.setColor('#203a68')
      this.forgeHintText.setText('The Depth pushes down — keep the drift from reaching your paddle')
      this.forgeHintText.setVisible(true)
    } else if (this.worldId === 'storm' && this.isBoss) {
      this.forgeHintText.setColor('#404098')
      this.forgeHintText.setText('The Eye repositions often — ghosted form means invulnerable')
      this.forgeHintText.setVisible(true)
    } else {
      this.forgeHintText.setVisible(false)
    }

    this.debugText = this.add.text(W - 8, H - 8, '', {
      fontFamily: 'Consolas, monospace',
      fontSize:   Math.round(W * 0.022 * DESKTOP_TEXT_SCALE) + 'px',
      color:      '#8a5a48'
    }).setOrigin(1, 1).setAlpha(0.75)
    this.debugPanelText = this.add.text(8, 74, '', {
      fontFamily: 'Consolas, monospace',
      fontSize:   Math.round(W * 0.022 * DESKTOP_TEXT_SCALE) + 'px',
      color:      '#5a4030',
      backgroundColor: '#f3ebdd',
      padding:    { x: 6, y: 4 }
    }).setOrigin(0, 0).setAlpha(0.88).setVisible(false)
    this.debugPanelVisible = false

    // ── Input ──
    this.tiltHeld     = false   // PC orb-arm toggle state (Q)
    this.moveLeftHeld = false
    this.moveRightHeld = false
    this.setupInput()
    this.setupDebugControls()

    // ── Build room ──
    if (this.isBoss) this.buildBoss()
    else this.buildBricks()

    this.resetBall()
    if (this.relic?.id === 'cartographer') {
      this.cartographerAngleJitter = (Math.random() - 0.5) * 0.07
      this.cartographerPreviewTimer = CARTOGRAPHER_PREVIEW_MS
      this.rebuildCartographerPreview()
    } else {
      this.cartographerPreviewPoints = []
      this.cartographerPreviewTimer = 0
    }
    this.updateHUD()
    this.updateBrickHPTexts()
    this.drawFrame()  // Render initial room state before first launch
    this.cameras.main.fadeIn(200, 245, 240, 228)
  }

  // ── Input ──────────────────────────────────────────────────────────────────

  setupInput() {
    const launchOrReady = () => {
      if (this.gameOver) return
      // After loseLife: 1st input readies ball, 2nd input launches. Normal start: one input launches.
      if (this.postDeathLaunchStep === 1) {
        this.postDeathLaunchStep = 2
        this.msgText.setText('click or press Space to launch').setVisible(true)
        this.syncBallToPaddle()
        this.drawFrame()
        return
      }
      if (!this.launched) {
        if (this.postDeathLaunchStep === 2) this.postDeathLaunchStep = 0
        this.launchBall()
      }
    }

    this.input.on('pointerdown', (p) => {
      Audio.init()          // Safe to call multiple times — only initialises once
      if (p.leftButtonDown()) launchOrReady()
    })
    this.input.on('pointermove', (p) => {
      const pw = this.padWidth()
      this.pad.x = Phaser.Math.Clamp(p.x - pw * 0.5, 0, this.W - pw)
    })

    const kb = this.input.keyboard
    if (!kb) return
    kb.on('keydown-SPACE', () => launchOrReady())
    kb.on('keydown-Q', () => {
      this.tiltHeld = !this.tiltHeld
      this.statusText.setText(this.tiltHeld ? 'Orb arm mode: ON (Q toggles)' : 'Orb arm mode: OFF (Q toggles)')
      this.time.delayedCall(1000, () => {
        if (!this.gameOver && !this.roomComplete) this.statusText.setText('')
      })
    })
    kb.on('keydown-A', () => { this.moveLeftHeld = true })
    kb.on('keyup-A', () => { this.moveLeftHeld = false })
    kb.on('keydown-D', () => { this.moveRightHeld = true })
    kb.on('keyup-D', () => { this.moveRightHeld = false })
    kb.on('keydown-LEFT', () => { this.moveLeftHeld = true })
    kb.on('keyup-LEFT', () => { this.moveLeftHeld = false })
    kb.on('keydown-RIGHT', () => { this.moveRightHeld = true })
    kb.on('keyup-RIGHT', () => { this.moveRightHeld = false })
  }

  setupDebugControls() {
    const kb = this.input.keyboard
    if (!kb) return

    const worldCycle = [null, 'void', 'forge', 'garden', 'abyss', 'storm']
    const roomCycle  = [null, 1, 2, 3, 4]
    const step = (value, delta, min = 0, max = 10) => {
      const next = Math.max(min, Math.min(max, (value || 0) + delta))
      return Math.round(next * 100) / 100
    }

    kb.on('keydown-F1', () => {
      this.debugPanelVisible = !this.debugPanelVisible
      this.refreshDebugPanel()
    })
    kb.on('keydown-F2', () => { TUNING.debug.enabled = !TUNING.debug.enabled; this.refreshDebugPanel() })
    kb.on('keydown-F3', () => { TUNING.debug.invulnerable = !TUNING.debug.invulnerable; this.refreshDebugPanel() })
    kb.on('keydown-F4', () => {
      const i = worldCycle.indexOf(TUNING.debug.forceWorldId ?? null)
      TUNING.debug.forceWorldId = worldCycle[(i + 1) % worldCycle.length]
      this.refreshDebugPanel()
    })
    kb.on('keydown-F5', () => {
      const i = roomCycle.indexOf(TUNING.debug.forceRoomNum ?? null)
      TUNING.debug.forceRoomNum = roomCycle[(i + 1) % roomCycle.length]
      this.refreshDebugPanel()
    })
    kb.on('keydown-F6', () => { TUNING.debug.useCustomLevel = !TUNING.debug.useCustomLevel; this.refreshDebugPanel() })
    kb.on('keydown-F7', (ev) => this.applyBossTuningSuggestion(0, !!ev?.shiftKey))
    kb.on('keydown-F8', (ev) => this.applyBossTuningSuggestion(1, !!ev?.shiftKey))
    kb.on('keydown-F9', () => this.resetWorldMechanicTweaks())
    kb.on('keydown-F10', (ev) => this.exportWorldMechanicTweaks(!!ev?.shiftKey))
    kb.on('keydown-F11', () => this.toggleWorldMechanicProfile())
    kb.on('keydown-F12', () => this.retestBossWithCurrentTuning())
    kb.on('keydown-Z', (ev) => {
      if (ev?.ctrlKey) this.undoLastWorldMechanicTweak()
    })
    kb.on('keydown-Y', (ev) => {
      if (ev?.ctrlKey) this.redoLastWorldMechanicTweak()
    })
    kb.on('keydown-NINE', (ev) => this.saveWorldMechanicTweaksProfile(ev?.shiftKey ? 'B' : 'A'))
    kb.on('keydown-ZERO', (ev) => this.loadWorldMechanicTweaksProfile(ev?.shiftKey ? 'B' : 'A'))
    kb.on('keydown-BACKSLASH', () => {
      const slots = ['slot1', 'slot2', 'slot3']
      const i = slots.indexOf(TUNING.debug.customLevelId || 'slot1')
      TUNING.debug.customLevelId = slots[(i + 1) % slots.length]
      this.refreshDebugPanel()
    })

    kb.on('keydown-EQUALS', () => { TUNING.debug.speedMultiplier = step(TUNING.debug.speedMultiplier, 0.1, 0.1, 5); this.refreshDebugPanel() })
    kb.on('keydown-MINUS',  () => { TUNING.debug.speedMultiplier = step(TUNING.debug.speedMultiplier, -0.1, 0.1, 5); this.refreshDebugPanel() })
    kb.on('keydown-OPEN_BRACKET',  () => { TUNING.debug.shardDropMultiplier = step(TUNING.debug.shardDropMultiplier, -0.25, 0, 5); this.refreshDebugPanel() })
    kb.on('keydown-CLOSE_BRACKET', () => { TUNING.debug.shardDropMultiplier = step(TUNING.debug.shardDropMultiplier, 0.25, 0, 5); this.refreshDebugPanel() })
    kb.on('keydown-SEMICOLON',     () => { TUNING.debug.bombDropMultiplier  = step(TUNING.debug.bombDropMultiplier, -0.25, 0, 5); this.refreshDebugPanel() })
    kb.on('keydown-QUOTE',         () => { TUNING.debug.bombDropMultiplier  = step(TUNING.debug.bombDropMultiplier, 0.25, 0, 5); this.refreshDebugPanel() })
  }

  refreshDebugPanel() {
    if (!this.debugPanelText) return
    this.debugPanelText.setVisible(this.debugPanelVisible)
    if (!this.debugPanelVisible) return
    const rows = [
      'DEV PANEL (desktop)',
      'F1 panel | F2 debug | F3 invuln | F4 world | F5 room | F6 custom-level | F7/F8 tune #1/#2 (Shift=auto retest) | F9 reset | F10 export diff (Shift=full) | F11 swap A/B | F12 retest boss | Ctrl+Z undo | Ctrl+Y redo | 9/0 save/load A | Shift+9/0 save/load B',
      `-/+ speed: ${TUNING.debug.speedMultiplier}x`,
      `[/] shard mult: ${TUNING.debug.shardDropMultiplier}`,
      `;/\' bomb mult: ${TUNING.debug.bombDropMultiplier}`,
      `\\ slot: ${TUNING.debug.customLevelId || 'slot1'} custom=${TUNING.debug.useCustomLevel}`,
      `enabled=${TUNING.debug.enabled} world=${TUNING.debug.forceWorldId || 'auto'} room=${TUNING.debug.forceRoomNum || 'auto'} profile=${this._activeWorldMechanicProfile}`,
      `history undo=${this._worldMechanicTweaksHistory.length} redo=${this._worldMechanicTweaksRedo.length}`
    ]
    const changed = this.getWorldMechanicOverrideSummary()
    if (changed) rows.push(`wm tweaks: ${changed}`)
    if (TUNING.debug.enabled && this.isBoss) {
      rows.push(...this.getBossDebugLines())
    }
    this.debugPanelText.setText(rows.join('\n'))
  }


  getBossDebugLines() {
    const aliveBoss = this.bricks.filter(b => b.alive && b.boss)
    const bossHp = aliveBoss.reduce((sum, b) => sum + Math.max(0, b.hp || 0), 0)
    const lines = [
      `boss:${this.worldId} bricks=${aliveBoss.length} hp=${bossHp}`
    ]
    const telemetry = this.getBossPaceTelemetry(bossHp)
    if (telemetry) {
      const tag =
        telemetry.pace === 'slow' ? '[SLOW]' :
        telemetry.pace === 'fast' ? '[FAST]' :
        telemetry.pace === 'on-target' ? '[OK]' : '[WAIT]'
      lines.push(`pace ${tag} dps=${telemetry.dps.toFixed(2)} (${telemetry.rolling ? `roll${telemetry.windowSec}s` : 'total'}) estTTK=${telemetry.ttkSec === Infinity ? '--' : telemetry.ttkSec.toFixed(1)}s target=${telemetry.targetSec}s`)
      const suggestion = this.getBossTuningSuggestion(telemetry)
      if (suggestion?.text) lines.push(`tune ${suggestion.text}`)
    }
    if (this.worldId === 'garden') {
      const ms = Math.max(0, GARDEN_BOSS_EDGE_SPAWN_MS - (this.gardenBossSpawnTimer || 0))
      lines.push(`root spawn in ${(ms / 1000).toFixed(1)}s @hp=${GARDEN_BOSS_EDGE_SPAWN_HP}`)
    } else if (this.worldId === 'abyss') {
      const lowY = aliveBoss.reduce((m, b) => Math.max(m, b.y + b.h), 0)
      const dangerY = this.H * TUNING.worldMechanics.abyssBossDangerY
      const dist = Math.max(0, Math.round(dangerY - lowY))
      lines.push(`depth dist=${dist}px cooldown=${Math.max(0, this.abyssBossPenaltyCooldown || 0).toFixed(0)}ms`)
    } else if (this.worldId === 'storm') {
      lines.push(`eye moving=${this.stormBossMoving ? 'yes' : 'no'} moveT=${(this.stormBossMoveT || 0).toFixed(0)}ms`)
      lines.push(`next move in ${Math.max(0, this.stormBossMoveTimer || 0).toFixed(0)}ms`)
    } else if (this.worldId === 'forge') {
      lines.push(`shield off=${this.forgeBossShieldDisabled ? 'yes' : 'no'} duel=${this.bossDuelLives}`)
    }
    return lines
  }

  getBossPaceTelemetry(currentBossHp = null) {
    if (this.bossDebugStartHp <= 0 || !this.isBoss) return null
    const hp = currentBossHp ?? this.bricks
      .filter(b => b.alive && b.boss)
      .reduce((sum, b) => sum + Math.max(0, b.hp || 0), 0)
    const elapsedMs = Math.max(1, this.time.now - this.bossDebugStartMs)
    const dealtTotal = Math.max(0, this.bossDebugStartHp - hp)
    const dpsTotal = dealtTotal / (elapsedMs / 1000)
    const targetByWorld = TUNING.worldMechanics.bossTargetTtkSecByWorld || {}
    const targetSec = Number(targetByWorld[this.worldId]) || 45
    const windowMs = Math.max(1000, (Number(TUNING.worldMechanics.bossTelemetryWindowSec) || 10) * 1000)
    this.bossDebugSamples.push({ tMs: this.time.now, hp })
    const cutoff = this.time.now - windowMs
    while (this.bossDebugSamples.length > 0 && this.bossDebugSamples[0].tMs < cutoff) {
      this.bossDebugSamples.shift()
    }
    const first = this.bossDebugSamples[0] || { tMs: this.time.now, hp }
    const deltaMs = Math.max(1, this.time.now - first.tMs)
    const dealtWindow = Math.max(0, first.hp - hp)
    const dpsWindow = dealtWindow / (deltaMs / 1000)
    const useWindow = this.bossDebugSamples.length >= 2 && dpsWindow > 0.01
    const dps = useWindow ? dpsWindow : dpsTotal
    const ttkSec = dps > 0.01 ? (hp / dps) : Infinity
    const pace =
      ttkSec === Infinity ? 'no damage yet' :
      (ttkSec > targetSec * 1.2 ? 'slow' : (ttkSec < targetSec * 0.8 ? 'fast' : 'on-target'))
    return { dps, ttkSec, targetSec, pace, windowSec: Math.round(windowMs / 1000), rolling: useWindow }
  }

  getBossTuningSuggestion(telemetry) {
    if (!telemetry || telemetry.ttkSec === Infinity || telemetry.targetSec <= 0) return null
    const ratio = telemetry.ttkSec / telemetry.targetSec
    const fmtVal = (v) => Number(v).toFixed(3).replace(/\.?0+$/, '')
    const wm = TUNING.worldMechanics
    const suggest = (key, scale) => {
      const cur = Number(wm[key])
      if (!Number.isFinite(cur) || cur <= 0) return { key, cur: null, next: null }
      const next = Math.max(0.001, cur * scale)
      return { key, cur, next }
    }
    const asText = (s) => `${s.key}: ${fmtVal(s.cur)} -> ${fmtVal(s.next)}`
    if (ratio > 1.08) {
      const pct = Math.min(35, Math.round((ratio - 1) * 100))
      if (this.worldId === 'garden') {
        const hpScale = 1 - Math.max(0.01, Math.round(pct * 0.6) / 100)
        const spScale = 1 - Math.max(0.01, Math.round(pct * 0.7) / 100)
        const options = [suggest('gardenBossCoreHp', hpScale), suggest('gardenBossEdgeSpawnMs', spScale)].filter(s => s.cur != null)
        const text = options.length > 1 ? `too slow -> ${asText(options[0])} or ${asText(options[1])}` : `too slow -> ${asText(options[0])}`
        return { text, options }
      }
      if (this.worldId === 'abyss') {
        const hpScale = 1 - Math.max(0.01, Math.round(pct * 0.7) / 100)
        const driftScale = 1 + Math.max(0.01, Math.round(pct * 0.8) / 100)
        const options = [suggest('abyssBossBrickHp', hpScale), suggest('abyssBossDriftPxPerMs', driftScale)].filter(s => s.cur != null)
        const text = options.length > 1 ? `too slow -> ${asText(options[0])} or ${asText(options[1])}` : `too slow -> ${asText(options[0])}`
        return { text, options }
      }
      if (this.worldId === 'storm') {
        const hpScale = 1 - Math.max(0.01, Math.round(pct * 0.7) / 100)
        const moveScale = 1 + Math.max(0.01, Math.round(pct * 0.6) / 100)
        const options = [suggest('stormBossHp', hpScale), suggest('stormBossMoveIntervalMs', moveScale)].filter(s => s.cur != null)
        const text = options.length > 1 ? `too slow -> ${asText(options[0])} or ${asText(options[1])}` : `too slow -> ${asText(options[0])}`
        return { text, options }
      }
      return { text: `too slow -> reduce boss HP by ~${pct}%`, options: [] }
    }
    if (ratio < 0.92) {
      const pct = Math.min(35, Math.round((1 - ratio) * 100))
      if (this.worldId === 'garden') {
        const hpScale = 1 + Math.max(0.01, Math.round(pct * 0.6) / 100)
        const spScale = 1 + Math.max(0.01, Math.round(pct * 0.7) / 100)
        const options = [suggest('gardenBossCoreHp', hpScale), suggest('gardenBossEdgeSpawnMs', spScale)].filter(s => s.cur != null)
        const text = options.length > 1 ? `too fast -> ${asText(options[0])} or ${asText(options[1])}` : `too fast -> ${asText(options[0])}`
        return { text, options }
      }
      if (this.worldId === 'abyss') {
        const hpScale = 1 + Math.max(0.01, Math.round(pct * 0.7) / 100)
        const driftScale = 1 - Math.max(0.01, Math.round(pct * 0.8) / 100)
        const options = [suggest('abyssBossBrickHp', hpScale), suggest('abyssBossDriftPxPerMs', driftScale)].filter(s => s.cur != null)
        const text = options.length > 1 ? `too fast -> ${asText(options[0])} or ${asText(options[1])}` : `too fast -> ${asText(options[0])}`
        return { text, options }
      }
      if (this.worldId === 'storm') {
        const hpScale = 1 + Math.max(0.01, Math.round(pct * 0.7) / 100)
        const moveScale = 1 - Math.max(0.01, Math.round(pct * 0.6) / 100)
        const options = [suggest('stormBossHp', hpScale), suggest('stormBossMoveIntervalMs', moveScale)].filter(s => s.cur != null)
        const text = options.length > 1 ? `too fast -> ${asText(options[0])} or ${asText(options[1])}` : `too fast -> ${asText(options[0])}`
        return { text, options }
      }
      return { text: `too fast -> increase boss HP by ~${pct}%`, options: [] }
    }
    return null
  }

  applyBossTuningSuggestion(optionIndex = 0, autoRetest = false) {
    if (!TUNING.debug.enabled || !this.isBoss) return
    const telemetry = this.getBossPaceTelemetry()
    const suggestion = this.getBossTuningSuggestion(telemetry)
    const option = suggestion?.options?.[optionIndex]
    if (!option) {
      this.statusText.setText('No tune suggestion to apply')
      this.time.delayedCall(900, () => this.statusText.setText(''))
      return
    }
    const prev = Number(TUNING.worldMechanics[option.key])
    TUNING.worldMechanics[option.key] = Math.round(option.next * 1000) / 1000
    this._worldMechanicTweaksHistory.push({ key: option.key, prev, next: TUNING.worldMechanics[option.key] })
    this._worldMechanicTweaksRedo = []
    this.statusText.setText(`Applied ${option.key}=${TUNING.worldMechanics[option.key]}`)
    this.time.delayedCall(1000, () => this.statusText.setText(''))
    this.refreshDebugPanel()
    if (autoRetest) this.retestBossWithCurrentTuning()
  }

  getWorldMechanicOverrideSummary() {
    const base = this._worldMechanicsBaseline
    const cur = TUNING.worldMechanics
    if (!base || !cur) return ''
    const changed = []
    for (const [k, v] of Object.entries(base)) {
      if (k === 'bossTargetTtkSecByWorld') continue
      if (typeof v !== 'number' || typeof cur[k] !== 'number') continue
      if (Math.abs(cur[k] - v) > 0.0001) changed.push(`${k}=${cur[k]}`)
    }
    return changed.join(', ')
  }

  resetWorldMechanicTweaks() {
    if (!TUNING.debug.enabled) return
    const base = this._worldMechanicsBaseline
    if (!base) return
    for (const [k, v] of Object.entries(base)) {
      if (k === 'bossTargetTtkSecByWorld') continue
      if (typeof v === 'number' && typeof TUNING.worldMechanics[k] === 'number') {
        TUNING.worldMechanics[k] = v
      }
    }
    this.statusText.setText('World mechanic tweaks reset (F9)')
    this.time.delayedCall(1000, () => this.statusText.setText(''))
    this._worldMechanicTweaksHistory = []
    this._worldMechanicTweaksRedo = []
    this.refreshDebugPanel()
  }

  getWorldMechanicOverridesObject() {
    const base = this._worldMechanicsBaseline
    const cur = TUNING.worldMechanics
    const out = {}
    if (!base || !cur) return out
    for (const [k, v] of Object.entries(base)) {
      if (k === 'bossTargetTtkSecByWorld') continue
      if (typeof v !== 'number' || typeof cur[k] !== 'number') continue
      if (Math.abs(cur[k] - v) > 0.0001) out[k] = cur[k]
    }
    return out
  }

  async exportWorldMechanicTweaks(includeFull = false) {
    if (!TUNING.debug.enabled) return
    const overrides = this.getWorldMechanicOverridesObject()
    const payloadObj = includeFull
      ? { worldMechanics: { ...TUNING.worldMechanics } }
      : { worldMechanics: overrides }
    const keys = Object.keys(payloadObj.worldMechanics || {})
    if (keys.length === 0) {
      this.statusText.setText('No world mechanic tweaks to export')
      this.time.delayedCall(1000, () => this.statusText.setText(''))
      return
    }
    const payload = JSON.stringify(payloadObj, null, 2)
    let copied = false
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(payload)
        copied = true
      }
    } catch {
      copied = false
    }
    if (copied) {
      this.statusText.setText(`Copied ${includeFull ? 'full' : 'diff'} tweaks JSON (${keys.length} keys)`)
    } else {
      this.statusText.setText(`${includeFull ? 'Full' : 'Diff'} tweaks JSON ready (${keys.length} keys) — copy from console`)
      console.log('[worldMechanics overrides]\n' + payload)
    }
    this.time.delayedCall(1400, () => this.statusText.setText(''))
  }

  getWorldMechanicProfileStorageKey(slot = 'A') {
    return slot === 'B'
      ? 'shattered_worlds_world_mechanic_tweaks_B'
      : 'shattered_worlds_world_mechanic_tweaks_A'
  }

  saveWorldMechanicTweaksProfile(slot = 'A') {
    if (!TUNING.debug.enabled) return
    const overrides = this.getWorldMechanicOverridesObject()
    const keys = Object.keys(overrides)
    if (keys.length === 0) {
      this.statusText.setText(`No tweaks to save (slot ${slot})`)
      this.time.delayedCall(900, () => this.statusText.setText(''))
      return
    }
    try {
      localStorage.setItem(this.getWorldMechanicProfileStorageKey(slot), JSON.stringify(overrides))
      this.statusText.setText(`Saved tweaks profile ${slot} (${keys.length} keys)`)
    } catch {
      this.statusText.setText('Failed to save tweaks profile')
    }
    this.time.delayedCall(1200, () => this.statusText.setText(''))
  }

  loadWorldMechanicTweaksProfile(slot = 'A') {
    if (!TUNING.debug.enabled) return
    try {
      const raw = localStorage.getItem(this.getWorldMechanicProfileStorageKey(slot))
      if (!raw) {
        this.statusText.setText(`No saved tweaks profile ${slot}`)
        this.time.delayedCall(1000, () => this.statusText.setText(''))
        return
      }
      const parsed = JSON.parse(raw)
      if (!parsed || typeof parsed !== 'object') throw new Error('invalid')
      let applied = 0
      for (const [k, v] of Object.entries(parsed)) {
        if (typeof v !== 'number') continue
        if (typeof TUNING.worldMechanics[k] !== 'number') continue
        TUNING.worldMechanics[k] = Math.round(v * 1000) / 1000
        applied++
      }
      if (applied > 0) this._activeWorldMechanicProfile = slot
      if (applied > 0) this._worldMechanicTweaksHistory = []
      if (applied > 0) this._worldMechanicTweaksRedo = []
      this.statusText.setText(applied > 0 ? `Loaded tweaks profile ${slot} (${applied} keys)` : `Saved profile ${slot} had no valid keys`)
      this.time.delayedCall(1200, () => this.statusText.setText(''))
      this.refreshDebugPanel()
    } catch {
      this.statusText.setText('Failed to load tweaks profile')
      this.time.delayedCall(1200, () => this.statusText.setText(''))
    }
  }

  toggleWorldMechanicProfile() {
    if (!TUNING.debug.enabled) return
    const next = this._activeWorldMechanicProfile === 'A' ? 'B' : 'A'
    this.loadWorldMechanicTweaksProfile(next)
  }

  undoLastWorldMechanicTweak() {
    if (!TUNING.debug.enabled) return
    const last = this._worldMechanicTweaksHistory.pop()
    if (!last) {
      this.statusText.setText('No tweak to undo')
      this.time.delayedCall(900, () => this.statusText.setText(''))
      return
    }
    if (typeof TUNING.worldMechanics[last.key] === 'number') {
      TUNING.worldMechanics[last.key] = Math.round(last.prev * 1000) / 1000
    }
    this._worldMechanicTweaksRedo.push(last)
    this.statusText.setText(`Undo ${last.key}=${TUNING.worldMechanics[last.key]}`)
    this.time.delayedCall(1100, () => this.statusText.setText(''))
    this.refreshDebugPanel()
  }

  redoLastWorldMechanicTweak() {
    if (!TUNING.debug.enabled) return
    const last = this._worldMechanicTweaksRedo.pop()
    if (!last) {
      this.statusText.setText('No tweak to redo')
      this.time.delayedCall(900, () => this.statusText.setText(''))
      return
    }
    if (typeof TUNING.worldMechanics[last.key] === 'number') {
      TUNING.worldMechanics[last.key] = Math.round(last.next * 1000) / 1000
    }
    this._worldMechanicTweaksHistory.push(last)
    this.statusText.setText(`Redo ${last.key}=${TUNING.worldMechanics[last.key]}`)
    this.time.delayedCall(1100, () => this.statusText.setText(''))
    this.refreshDebugPanel()
  }

  retestBossWithCurrentTuning() {
    if (!TUNING.debug.enabled || !this.isBoss || this.gameOver) return
    this.roomComplete = false
    this.transitioning = false
    this.combo = 1
    this.registry.set('combo', 1)
    this.clearBrickHPTexts()
    this.shardPickups = []
    this.diamondPickups = []
    this.orbPickups = []
    this.particles = []
    this.inkTrail = []
    this.inkPools = []
    this.lasers = []
    this.extraBalls = []
    this.swarmBalls = []
    this.gardenRegrowQueue = []
    this.bossDuelLives = TUNING.combat.bossDuelLives
    this.forgeBossShieldDisabled = false
    this.buildBoss()
    this.resetBall()
    this.updateHUD()
    this.updateBrickHPTexts()
    this.drawFrame()
    this.statusText.setText('Boss retest ready (click or Space)')
    this.time.delayedCall(1200, () => this.statusText.setText(''))
  }

  resetBossDebugTelemetry() {
    if (!this.isBoss) {
      this.bossDebugStartMs = 0
      this.bossDebugStartHp = 0
      this.bossDebugSamples = []
      return
    }
    this.bossDebugStartMs = this.time.now
    this.bossDebugStartHp = this.bricks
      .filter(b => b.alive && b.boss)
      .reduce((sum, b) => sum + Math.max(0, b.hp || 0), 0)
    this.bossDebugSamples = [{ tMs: this.time.now, hp: this.bossDebugStartHp }]
  }

  applyKeyboardPaddleMovement(delta) {
    if (!this.moveLeftHeld && !this.moveRightHeld) return
    const dir = (this.moveRightHeld ? 1 : 0) - (this.moveLeftHeld ? 1 : 0)
    if (!dir) return
    const pw = this.padWidth()
    const dragMult = this.upgrades.overcharge ? OVERCHARGE_PAD_MULT : 1
    const speedPxPerMs = this.W * 0.0012 * dragMult
    this.pad.x = Phaser.Math.Clamp(this.pad.x + dir * speedPxPerMs * delta, 0, this.W - pw)
  }

  applyMousePaddleMovement() {
    const p = this.input?.activePointer
    if (!p) return false
    if (p.x < 0 || p.x > this.W || p.y < 0 || p.y > this.H) return false
    const pw = this.padWidth()
    this.pad.x = Phaser.Math.Clamp(p.x - pw * 0.5, 0, this.W - pw)
    return true
  }

  // ── Paddle ─────────────────────────────────────────────────────────────────

  // Returns current paddle width in pixels including all multipliers
  padWidth() {
    let w = this.PAD_W
    if (this.upgrades.wide)              w *= PADDLE_WIDE_MULT
    if (this.relic?.id === 'ghost')      w *= PADDLE_GHOST_MULT
    if (this.relic?.id === 'pendulum')   w *= PADDLE_PENDULUM_MULT
    if (this.worldId === 'abyss' && !this.isBoss) w *= TUNING.worldMechanics.abyssPaddleMult
    return w
  }

  /** Abyss (non-boss): no hard walls — ball is lost if it leaves the playfield past this margin. */
  ballEscapesAbyss(bl) {
    if (this.worldId !== 'abyss' || this.isBoss || !bl) return false
    const m = TUNING.worldMechanics.abyssLossMarginPx
    return (
      bl.x + bl.r < -m ||
      bl.x - bl.r > this.W + m ||
      bl.y + bl.r < -m ||
      bl.y - bl.r > this.H + m
    )
  }

  /**
   * Cartographer: wall-bounce-only path from the ball on the paddle toward brick-field centroid.
   * Bricks are ignored so the line stays cheap and readable; jitter is fixed per room.
   */
  rebuildCartographerPreview() {
    if (this.relic?.id !== 'cartographer' || !this.ball) return
    const r = this.ball.r
    const pw = this.padWidth()
    let tx = this.W / 2
    let ty = this.H * 0.22
    const alive = this.bricks.filter(b => b.alive)
    if (alive.length > 0) {
      tx = alive.reduce((s, b) => s + b.x + b.w / 2, 0) / alive.length
      ty = alive.reduce((s, b) => s + b.y + b.h / 2, 0) / alive.length
    }
    const sx = this.pad.x + pw / 2
    const sy = this.pad.y - r - 2
    let angle = Math.atan2(ty - sy, tx - sx) + this.cartographerAngleJitter
    const upMin = -Math.PI / 2 - PADDLE_ANGLE_MAX
    const upMax = -Math.PI / 2 + PADDLE_ANGLE_MAX
    angle = Phaser.Math.Clamp(angle, upMin, upMax)

    const speed = this.baseSpeed()
    let vx = Math.cos(angle) * speed
    let vy = Math.sin(angle) * speed
    let x = sx
    let y = sy
    const pts = [{ x, y }]
    const stride = TUNING.timers.cartographerSampleEvery
    const maxSteps = TUNING.timers.cartographerSimMaxSteps
    const abyss = this.worldId === 'abyss' && !this.isBoss
    const mA = TUNING.worldMechanics.abyssLossMarginPx
    for (let step = 0; step < maxSteps; step++) {
      x += vx
      y += vy
      if (abyss) {
        if (x + r < -mA || x - r > this.W + mA || y + r < -mA || y - r > this.H + mA) break
      } else {
        if (x - r < 0) {
          x = r
          vx = Math.abs(vx)
        } else if (x + r > this.W) {
          x = this.W - r
          vx = -Math.abs(vx)
        }
        if (y - r < 0) {
          y = r
          vy = Math.abs(vy)
        }
      }
      if (step % stride === 0) pts.push({ x, y })
      if (!abyss && y - r > this.H + 48) break
    }
    this.cartographerPreviewPoints = pts
  }

  // ── Garden world: destroyed bricks respawn after a delay at half their original max HP ──
  queueGardenRegrow(b) {
    if (this.roomComplete || this.transitioning) return
    this.gardenRegrowQueue.push({
      deadline:  this.time.now + TUNING.worldMechanics.gardenRegrowMs,
      x:         b.x,
      y:         b.y,
      w:         b.w,
      h:         b.h,
      color:     b.color,
      typeId:    b.typeId || BRICK_TYPE_IDS.NORMAL,
      maxHpOrig: Math.max(1, b.maxHp || 1)
    })
  }

  cellBlockedForGardenRegrow(q) {
    for (const o of this.bricks) {
      if (!o.alive) continue
      if (o.x + o.w > q.x && o.x < q.x + q.w && o.y + o.h > q.y && o.y < q.y + q.h) return true
    }
    return false
  }

  spawnGardenRegrowBrick(q) {
    const hp = Math.max(1, Math.floor(q.maxHpOrig / 2))
    const brick = {
      x: q.x,
      y: q.y,
      w: q.w,
      h: q.h,
      hp,
      maxHp: hp,
      color: q.color,
      alive: true,
      seed: Math.random() * 100,
      flashTimer: BRICK_FLASH_FRAMES,
      boss: false,
      splitCount: 0
    }
    applyBrickTypeData(brick, q.typeId, this.worldId, { random: Math.random })
    this.bricks.push(brick)
    if (brick.hp > 1) this.createBrickHPText(brick)
    Audio.brickHit()
  }

  processGardenRegrowQueue() {
    if (this.worldId !== 'garden' || this.gardenRegrowQueue.length === 0) return
    if (this.isBoss || this.roomComplete || this.transitioning) {
      this.gardenRegrowQueue.length = 0
      return
    }
    const now = this.time.now
    for (let i = this.gardenRegrowQueue.length - 1; i >= 0; i--) {
      const q = this.gardenRegrowQueue[i]
      if (now < q.deadline) continue
      if (this.cellBlockedForGardenRegrow(q)) {
        this.gardenRegrowQueue.splice(i, 1)
        continue
      }
      this.spawnGardenRegrowBrick(q)
      this.gardenRegrowQueue.splice(i, 1)
    }
  }

  /** Storm world: idle → countdown → telegraph → horizontal gust on all balls. */
  updateStormWind(dt) {
    const M = TUNING.worldMechanics
    this.stormWindActive = false
    if (this._stormWindPhase === 'idle') {
      this._stormWindPhase = 'countdown'
      this._stormWindTimer = M.stormGustIntervalMinMs + Math.random() * (M.stormGustIntervalMaxMs - M.stormGustIntervalMinMs)
      return
    }
    this._stormWindTimer -= dt
    if (this._stormWindPhase === 'countdown') {
      if (this._stormWindTimer <= 0) {
        this._stormWindPhase = 'warn'
        this._stormWindTimer = M.stormGustTelegraphMs
        this._stormWindSign = Math.random() < 0.5 ? 1 : -1
      }
    } else if (this._stormWindPhase === 'warn') {
      if (this._stormWindTimer <= 0) {
        this._stormWindPhase = 'blow'
        this._stormWindTimer = M.stormGustDurationMs
      }
    } else if (this._stormWindPhase === 'blow') {
      if (this._stormWindTimer > 0) this.stormWindActive = true
      else {
        this._stormWindPhase = 'countdown'
        this._stormWindTimer = M.stormGustIntervalMinMs + Math.random() * (M.stormGustIntervalMaxMs - M.stormGustIntervalMinMs)
      }
    }
  }

  // Garden boss: while alive, periodically spawn edge sprouts into the room.
  updateGardenBoss(dt) {
    const aliveBoss = this.bricks.some(b => b.alive && b.boss)
    if (!aliveBoss || this.transitioning || this.roomComplete) return
    this.gardenBossSpawnTimer += dt
    if (this.gardenBossSpawnTimer < GARDEN_BOSS_EDGE_SPAWN_MS) return
    this.gardenBossSpawnTimer = 0

    const edgeCol = Math.random() < 0.5 ? 0 : this.COLS - 1
    const row = Math.floor(Math.random() * 4)
    const x = 8 + edgeCol * this.BW + (Math.random() - 0.5) * 1.5
    const y = Math.round(this.H * 0.1) + row * (this.BH + 5) + (Math.random() - 0.5) * 1
    const w = this.BW - 4
    const h = this.BH
    for (const b of this.bricks) {
      if (!b.alive) continue
      if (b.x + b.w > x && b.x < x + w && b.y + b.h > y && b.y < y + h) return
    }

    const palette = this.world?.palette?.brickColors || [0x2a1f0e]
    const sprout = {
      x, y, w, h,
      hp: GARDEN_BOSS_EDGE_SPAWN_HP,
      maxHp: GARDEN_BOSS_EDGE_SPAWN_HP,
      color: palette[Math.floor(Math.random() * palette.length)],
      alive: true,
      seed: Math.random() * 100,
      flashTimer: BRICK_FLASH_FRAMES,
      boss: false,
      splitCount: 0,
    }
    applyBrickTypeData(sprout, BRICK_TYPE_IDS.NORMAL, this.worldId, { random: Math.random })
    this.bricks.push(sprout)
    this.createBrickHPText(sprout)
    this.statusText.setText('The Root spreads…')
    this.time.delayedCall(700, () => this.statusText.setText(''))
  }

  // Abyss boss: alive boss bricks drift downward; touching the danger line costs a life and lifts them.
  updateAbyssBoss(dt) {
    if (this.abyssBossPenaltyCooldown > 0) this.abyssBossPenaltyCooldown -= dt
    const aliveBoss = this.bricks.filter(b => b.alive && b.boss)
    if (aliveBoss.length === 0 || this.transitioning || this.roomComplete) return
    const dy = ABYSS_BOSS_DRIFT_PX_PER_MS * dt
    for (const b of aliveBoss) b.y += dy
    const dangerY = this.H * TUNING.worldMechanics.abyssBossDangerY
    const touched = aliveBoss.some(b => b.y + b.h >= dangerY)
    if (touched && this.abyssBossPenaltyCooldown <= 0) {
      this.abyssBossPenaltyCooldown = ABYSS_BOSS_PENALTY_COOLDOWN_MS
      for (const b of aliveBoss) {
        b.y = Math.max(this.H * 0.08, b.y - this.H * TUNING.worldMechanics.abyssBossResetLift)
      }
      this.statusText.setText('The Depth pushed through! -1 life')
      this.time.delayedCall(900, () => this.statusText.setText(''))
      this.loseLife()
    }
  }

  startStormBossMove() {
    const aliveBoss = this.bricks.filter(b => b.alive && b.boss)
    if (aliveBoss.length === 0) return
    const b = aliveBoss[0]
    const margin = 10
    const minX = margin
    const maxX = this.W - margin - b.w
    const minY = Math.round(this.H * 0.07)
    const maxY = Math.round(this.H * 0.28)
    this.stormBossFrom = { x: b.x, y: b.y }
    this.stormBossTo = {
      x: Phaser.Math.Clamp(Math.round(minX + Math.random() * (maxX - minX)), minX, maxX),
      y: Phaser.Math.Clamp(Math.round(minY + Math.random() * (maxY - minY)), minY, maxY),
    }
    this.stormBossMoving = true
    this.stormBossMoveT = 0
  }

  updateStormBoss(dt) {
    const aliveBoss = this.bricks.filter(b => b.alive && b.boss)
    if (aliveBoss.length === 0 || this.transitioning || this.roomComplete) return
    const b = aliveBoss[0]
    if (!this.stormBossMoving) {
      this.stormBossMoveTimer -= dt
      if (this.stormBossMoveTimer <= 0) {
        this.startStormBossMove()
        this.stormBossMoveTimer = STORM_BOSS_MOVE_INTERVAL_MS
      }
      return
    }
    this.stormBossMoveT += dt
    const t = Phaser.Math.Clamp(this.stormBossMoveT / STORM_BOSS_MOVE_DURATION_MS, 0, 1)
    const e = t * t * (3 - 2 * t) // smoothstep easing
    b.x = this.stormBossFrom.x + (this.stormBossTo.x - this.stormBossFrom.x) * e
    b.y = this.stormBossFrom.y + (this.stormBossTo.y - this.stormBossFrom.y) * e
    if (t >= 1) {
      this.stormBossMoving = false
      this.stormBossMoveT = 0
    }
  }

  // Keeps the main ball on the paddle (call while waiting to launch, or after moving the paddle)
  syncBallToPaddle() {
    if (!this.ball) return
    const pw = this.padWidth()
    this.ball.x = this.pad.x + pw / 2
    this.ball.y = this.pad.y - this.ball.r - 2
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
    this.mirrorTwinBall   = null
    this.swarmBalls       = []
    this.splitTimer       = 0
    this.lasers           = []
    this.launched         = false
    this.momentumStacks   = 0
    this.unbrokenHits     = 0
    this.judgementCharge  = 0
    this.singularityTimer = 0
    this.orbArmed         = false
    this.chargeToken      = null
    this.orbShieldCharges = 0
    this.orbFireballTimer = 0

    this.syncBallToPaddle()
    this.msgText.setText('click or press Space to launch').setVisible(true)
  }

  // Fires ball at a random upward angle
  launchBall() {
    const angle = -Math.PI / 2 + (Math.random() - 0.5) * 0.45  // ±26° from straight up
    const speed = this.baseSpeed()
    this.ball.vx = Math.cos(angle) * speed
    this.ball.vy = Math.sin(angle) * speed
    this.launched = true
    this.msgText.setVisible(false)
    // Mirror relic: same vertical launch, mirrored horizontal velocity (two balls from one paddle).
    if (this.relic?.id === 'mirror') {
      this.mirrorTwinBall = {
        x:     this.ball.x,
        y:     this.ball.y,
        vx:    -this.ball.vx,
        vy:    this.ball.vy,
        r:     this.ball.r,
        baseR: this.ball.baseR
      }
    } else {
      this.mirrorTwinBall = null
    }
    this.cartographerPreviewTimer = 0
    this.cartographerPreviewPoints = []
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

    if (this.buildBricksFromLevelData(this.resolveCustomLevelData())) {
      return
    }

    // Use world-specific brick colors if available, otherwise fall back to Void palette
    const palette = this.world?.palette?.brickColors ||
      [0x2a1f0e, 0x4a3020, 0x5a4030, 0x3a2818, 0x6a4828]

    const startY = Math.round(this.H * 0.1)
    const rows   = this.roomNum < 3 ? 4 : 5  // Room 3 gets an extra row

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < this.COLS; c++) {
        if (Math.random() < BRICK_GAP_CHANCE) continue  // Random gaps for hand-drawn feel

        const variant = rollGridBrickVariant(r)
        const { hp, maxHp, typeId } = variant

        const brick = {
          x:          8 + c * this.BW + (Math.random() - 0.5) * 1.5,
          y:          startY + r * (this.BH + 5) + (Math.random() - 0.5) * 1,
          w:          this.BW - 4,
          h:          this.BH,
          hp, maxHp,
          color:      palette[Math.floor(Math.random() * palette.length)],
          alive:      true,
          seed:       Math.random() * 100,  // Unique wobble seed for this brick
          flashTimer: 0,
          boss:       false,
        }
        applyBrickTypeData(brick, typeId, this.worldId, { random: Math.random })

        this.bricks.push(brick)
        // HP numbers no longer shown — color conveys health (3HP=black, 2HP=gray, 1HP=light)
      }
    }
  }

  resolveCustomLevelData() {
    // Editor play-test has highest priority so the player can jump straight into the authored layout.
    if (this.registry.get('editorPlayEnabled')) {
      return this.registry.get('editorPlayLevel') || null
    }
    if (TUNING.debug.enabled && TUNING.debug.useCustomLevel) {
      return loadLevelById(TUNING.debug.customLevelId || 'slot1')
    }
    return null
  }

  buildBricksFromLevelData(level) {
    if (!level || !Array.isArray(level.cells)) return false

    const palette = this.world?.palette?.brickColors ||
      [0x2a1f0e, 0x4a3020, 0x5a4030, 0x3a2818, 0x6a4828]

    const cols = Math.max(1, Number(level.cols) || this.COLS)
    const rows = Math.max(1, Number(level.rows) || level.cells.length || 1)
    const startY = Math.round(this.H * 0.1)

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const cell = level.cells?.[r]?.[c]
        if (!cell) continue

        const type = getBrickTypeDefinition(cell.typeId)
        const hp = Math.max(1, Number(cell.hp) || type.defaultHp || 1)
        const brick = {
          x:          8 + c * this.BW + (Math.random() - 0.5) * 1.5,
          y:          startY + r * (this.BH + 5) + (Math.random() - 0.5) * 1,
          w:          this.BW - 4,
          h:          this.BH,
          hp,
          maxHp:      hp,
          color:      palette[Math.floor(Math.random() * palette.length)],
          alive:      true,
          seed:       Math.random() * 100,
          flashTimer: 0,
          boss:       false,
        }
        applyBrickTypeData(brick, type.id, this.worldId, {
          random: Math.random,
          exposedSide: cell.exposedSide || null,
        })
        this.bricks.push(brick)
      }
    }
    return this.bricks.length > 0
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

    } else if (this.worldId === 'garden') {
      // The Root: compact core that keeps spawning edge sprouts.
      const core = {
        x: this.W * 0.22,
        y: this.H * 0.1,
        w: this.W * 0.56,
        h: this.H * 0.12,
        hp: GARDEN_BOSS_CORE_HP,
        maxHp: GARDEN_BOSS_CORE_HP,
        color: this.world.palette.ink,
        alive: true,
        seed: 0,
        flashTimer: 0,
        boss: true,
        splitCount: 3,
        exposedSide: null
      }
      this.bricks.push(core)
      this.createBrickHPText(core)
      this.gardenBossSpawnTimer = 0

    } else if (this.worldId === 'abyss') {
      // The Depth: drifting slab wall that pressures the paddle line.
      const bossY = Math.round(this.H * 0.08)
      const hp = ABYSS_BOSS_BRICK_HP
      for (let c = 1; c < this.COLS - 1; c++) {
        const brick = {
          x: 8 + c * this.BW,
          y: bossY,
          w: this.BW - 4,
          h: this.BH,
          hp,
          maxHp: hp,
          color: this.world.palette.brickColors[Math.floor(Math.random() * this.world.palette.brickColors.length)],
          alive: true,
          seed: Math.random() * 100,
          flashTimer: 0,
          boss: true,
          splitCount: 3,
          exposedSide: null
        }
        this.bricks.push(brick)
        this.createBrickHPText(brick)
      }
      this.abyssBossPenaltyCooldown = 0

    } else if (this.worldId === 'storm') {
      // The Eye: repositions and cannot be damaged while moving.
      const boss = {
        x: this.W * 0.34,
        y: this.H * 0.11,
        w: this.W * 0.32,
        h: this.H * 0.12,
        hp: STORM_BOSS_HP,
        maxHp: STORM_BOSS_HP,
        color: this.world.palette.ink,
        alive: true,
        seed: 0,
        flashTimer: 0,
        boss: true,
        splitCount: 3,
        exposedSide: null
      }
      this.bricks.push(boss)
      this.createBrickHPText(boss)
      this.stormBossMoveTimer = STORM_BOSS_MOVE_INTERVAL_MS
      this.stormBossMoving = false

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
    this.resetBossDebugTelemetry()
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
    const orbFireball = this.orbFireballTimer > 0
    const dmg      = (this.upgrades.wrecking && !fromFamiliar) || orbFireball ? b.hp : (this.hotStreakTimer > 0 ? 2 : 1)
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

    if (this.worldId === 'garden' && !this.isBoss && !b.boss) {
      this.queueGardenRegrow(b)
    }

    // Shard bricks are special loot piñatas — on death they explode into shard drops.
    if (b.shardBrick) {
      Audio.shardBrickExplode()
      this.spawnShardBurst(b.x + b.w / 2, b.y + b.h / 2)
    }

    // ── Currency drops ──
    if (!b.boss) {
      const dropKind = rollStandardBrickPickup()
      if (dropKind === 'shard') {
        this.shardPickups.push({
          x: b.x + b.w / 2 + (Math.random() - 0.5) * this.BW * 0.5,  // Slight random spread
          y: b.y + b.h / 2,
          vy: this.H * SHARD_FALL_SPEED * (0.8 + Math.random() * 0.4),  // Slight speed variation
          collected: false
        })
      } else if (dropKind === 'bomb') {
        // Negative skill orb — same physics as other orbs; danger pings while it falls.
        this.orbPickups.push({
          x: b.x + b.w / 2 + (Math.random() - 0.5) * this.BW * 0.4,
          y: b.y + b.h / 2,
          vy: this.H * ORB_FALL_SPEED * (0.85 + Math.random() * 0.35),
          typeId: 'bomb',
          collected: false
        })
        this.flashBombWarning()
      } else if (Math.random() < ORB_DROP_CHANCE) {
        const orbTypes = ['fireball', 'shield', 'bomb']
        const typeId = orbTypes[Math.floor(Math.random() * orbTypes.length)]
        this.orbPickups.push({
          x: b.x + b.w / 2 + (Math.random() - 0.5) * this.BW * 0.45,
          y: b.y + b.h / 2,
          vy: this.H * ORB_FALL_SPEED * (0.9 + Math.random() * 0.25),
          typeId,
          collected: false
        })
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
      // Unpredictable directions, still roughly omni; speeds stay in a narrow band (no “super” shards)
      const angle  = Math.random() * Math.PI * 2
      const mag    = this.W * (SHARD_BURST_MIN_SPD + Math.random() * (SHARD_BURST_MAX_SPD - SHARD_BURST_MIN_SPD))
      const phase  = SHARD_BURST_PHASE_MS * (0.75 + Math.random() * 0.35)
      this.shardPickups.push({
        x: x + (Math.random() - 0.5) * 5,
        y: y + (Math.random() - 0.5) * 4,
        vx: Math.cos(angle) * mag,
        vy: Math.sin(angle) * mag,
        burst:      true,
        burstTimer: phase,
        collected:  false
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
    if (this.gameOver || this.roomComplete || this.transitioning) return  // Guard flags

    this.wobbleTime = time * 0.001  // Convert ms to seconds for wobble animation
    const mouseControlled = this.applyMousePaddleMovement()
    if (!mouseControlled) this.applyKeyboardPaddleMovement(delta)

    // Before launch, game logic was skipped entirely, so the frame was never drawn — the ball disappeared.
    // We still only run full physics after launch, but the paddle and ball are redrawn every frame.
    if (!this.launched) {
      if (this.relic?.id === 'cartographer' && this.cartographerPreviewTimer > 0) {
        this.cartographerPreviewTimer = Math.max(0, this.cartographerPreviewTimer - delta)
        this.rebuildCartographerPreview()
      }
      this.syncBallToPaddle()
      this.drawFrame()
      return
    }

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
    if (this.orbFireballTimer > 0) this.orbFireballTimer -= dt
    this.orbArmed = !!this.chargeToken && this.tiltHeld
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

    if (this.worldId === 'garden') this.processGardenRegrowQueue()
    if (this.isBoss && this.worldId === 'garden') this.updateGardenBoss(dt)
    if (this.isBoss && this.worldId === 'abyss') this.updateAbyssBoss(dt)
    if (this.isBoss && this.worldId === 'storm') this.updateStormBoss(dt)

    if (this.worldId === 'storm' && !this.isBoss && this.launched && !this.roomComplete && !this.gameOver) {
      this.updateStormWind(dt)
    } else if (this.worldId !== 'storm' || !this.launched) {
      this.stormWindActive = false
    }

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

    // Gyro no longer moves paddle; drag-only movement remains.

    // ── Move lasers ──
    this.lasers = this.lasers.filter(laser => {
      laser.y += laser.vy
      if (laser.y < 0) return false  // Remove if exited screen top
      for (const b of this.bricks) {
        if (!b.alive) continue
        if (laser.x > b.x && laser.x < b.x + b.w && laser.y > b.y && laser.y < b.y + b.h) {
          const laserBl = { vx: 0, vy: -1, x: laser.x, y: laser.y, r: 1 }  // Upward travel through Forge
          if (this.isHitBlockedByBossOrForge(b, laserBl)) {
            this.blockHitFeedback(b)
            return !!this.upgrades.piercing  // Piercing: beam continues; else it breaks on steel
          }
          this.hitBrick(b, true)
          if (!this.upgrades.piercing) return false
        }
      }
      return true
    })

    this.inkPools = this.inkPools.filter(p => { p.life -= dt; return p.life > 0 })  // Decay puddles

    // Bomb danger cue while at least one bomb is on-screen.
    if (this.orbPickups.some(o => !o.collected && o.typeId === 'bomb')) {
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

      if (s.burst) {
        s.burstTimer -= dt
        if (s.burstTimer <= 0) {
          s.burst = false
          s.vx    = (Math.random() * 2 - 1) * this.W * SHARD_FALL_DRIFT_X
          s.vy    = this.H * SHARD_FALL_SPEED * (0.88 + Math.random() * 0.2)
          s.x    += s.vx
          s.y    += s.vy
        } else {
          s.x += s.vx
          s.y += s.vy
          s.vx *= SHARD_BURST_DRAG
          s.vy *= SHARD_BURST_DRAG
          const rr = 6
          if (s.x < rr) { s.x = rr; s.vx = Math.abs(s.vx) * SHARD_BURST_BOUNCE_DAMP }
          else if (s.x > this.W - rr) { s.x = this.W - rr; s.vx = -Math.abs(s.vx) * SHARD_BURST_BOUNCE_DAMP }
          if (s.y < rr) { s.y = rr; s.vy = Math.abs(s.vy) * SHARD_BURST_BOUNCE_DAMP }
        }
      } else {
        s.x += s.vx || 0
        s.y += s.vy
        if (s.vx) s.vx *= 0.996
        s.x = Phaser.Math.Clamp(s.x, 2, this.W - 2)
      }
      // Collect if within paddle area (slightly generous hitbox for readability)
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

    for (const o of this.orbPickups) {
      if (o.collected) continue
      o.y += o.vy
      if (o.y + 8 > padTop - 10 && o.y < padBottom + 10 &&
          o.x > padLeft - collectR && o.x < padRight + collectR) {
        o.collected = true
        // Max one token: latest orb overwrites previous token for MVP clarity.
        this.chargeToken = { typeId: o.typeId }
        this.statusText.setText(`Orb collected: ${o.typeId}`)
        this.time.delayedCall(900, () => this.statusText.setText(''))
      }
    }

    // Remove collected or off-screen pickups
    this.shardPickups   = this.shardPickups.filter(s   => !s.collected && s.y < this.H + 20)
    this.diamondPickups = this.diamondPickups.filter(d => !d.collected && d.y < this.H + 20)
    this.orbPickups     = this.orbPickups.filter(o     => !o.collected && o.y < this.H + 20)

    // ── Ball physics ──
    const allBalls = [this.ball, ...this.extraBalls, ...this.swarmBalls]
    if (this.mirrorTwinBall) allBalls.push(this.mirrorTwinBall)
    for (const bl of allBalls) {
      this.updateSingleBall(bl, this.swarmBalls.includes(bl))
    }

    // ── Ghost relic: one free floor pass per room (first player ball to cross the bottom) ──
    if (this.relic?.id === 'ghost' && !this.ghostPassUsed) {
      const ghostCandidates = [this.ball, this.mirrorTwinBall].filter(Boolean)
      for (const bl of ghostCandidates) {
        if (bl.y + bl.r > this.H) {
          this.ghostPassUsed = true
          bl.vy = -Math.abs(bl.vy)
          bl.y  = this.H - bl.r - 2
          this.spawnInk(bl.x, this.H, 12)
          break
        }
      }
    }

    // ── Glass Cannon: instant death if any player ball is lost ──
    if (this.upgrades.glasscannon) {
      if (this.worldId === 'abyss') {
        if (this.ballEscapesAbyss(this.ball)) { this.endRun(); return }
        if (this.mirrorTwinBall && this.ballEscapesAbyss(this.mirrorTwinBall)) { this.endRun(); return }
      } else {
        if (this.ball.y - this.ball.r > this.H) { this.endRun(); return }
        if (this.mirrorTwinBall && this.mirrorTwinBall.y - this.mirrorTwinBall.r > this.H) { this.endRun(); return }
      }
    }

    // ── Cleanup fallen / escaped balls (extras never cost a life) ──
    if (this.worldId === 'abyss') {
      this.swarmBalls = this.swarmBalls.filter(bl => !this.ballEscapesAbyss(bl))
      this.extraBalls = this.extraBalls.filter(bl => !this.ballEscapesAbyss(bl) && (bl.y - bl.r < this.H || bl.permanent))
    } else {
      this.swarmBalls = this.swarmBalls.filter(bl => bl.y - bl.r < this.H)
      this.extraBalls = this.extraBalls.filter(bl => bl.y - bl.r < this.H || bl.permanent)
    }

    // ── Player ball(s) lost: bottom fall (normal) or any edge (Abyss) ──
    const fell = []
    if (this.worldId === 'abyss') {
      if (this.ballEscapesAbyss(this.ball)) fell.push(this.ball)
      if (this.mirrorTwinBall && this.ballEscapesAbyss(this.mirrorTwinBall)) fell.push(this.mirrorTwinBall)
    } else {
      if (this.ball.y - this.ball.r > this.H) fell.push(this.ball)
      if (this.mirrorTwinBall && this.mirrorTwinBall.y - this.mirrorTwinBall.r > this.H) fell.push(this.mirrorTwinBall)
    }
    if (fell.length > 0) {
      if (this.orbShieldCharges > 0) {
        this.orbShieldCharges--
        const pw = this.padWidth()
        for (const bl of fell) {
          bl.x = this.pad.x + pw / 2
          bl.y = this.pad.y - bl.r - 2
          bl.vy = -Math.abs(bl.vy || this.baseSpeed())
          if (this.worldId === 'abyss') bl.vx *= 0.35
          this.spawnInk(bl.x, bl.y + bl.r, 8)
        }
        this.statusText.setText('Shield orb saved you')
        this.time.delayedCall(900, () => this.statusText.setText(''))
        return
      }
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
      this.transitioning = true
      this.cameras.main.fadeOut(250, 245, 240, 228)
      this.cameras.main.once('camerafadeoutcomplete', () => {
        if (this.isBoss) {
          this.registry.set('totalDiamonds', (this.registry.get('totalDiamonds') || 0) + BOSS_DIAMOND_REWARD)
          this.registry.set('diamondsCollected', (this.registry.get('diamondsCollected') || 0) + BOSS_DIAMOND_REWARD)
          this.goToScene('WorldClearScene')
        } else {
          // Pass worldId forward so DraftScene can route correctly
          this.goToScene('DraftScene', { nextRoomNum: this.roomNum + 1, worldId: this.worldId })
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

    // Storm world: sideways push during gust (after steering, before integration)
    if (this.worldId === 'storm' && this.stormWindActive) {
      bl.vx += this._stormWindSign * this.W * TUNING.worldMechanics.stormGustAccel
    }

    bl.x += bl.vx; bl.y += bl.vy  // Move ball

    if (!isSwarm) this.inkTrail.push({ x: bl.x, y: bl.y, vx: bl.vx, vy: bl.vy, life: 0.55, size: bl.r * 0.38 })

    // Wall bounces — Abyss non-boss has no side/top/bottom barrier.
    if (this.worldId !== 'abyss' || this.isBoss) {
      if (bl.x - bl.r < 0)      { bl.x = bl.r;          bl.vx =  Math.abs(bl.vx) }
      if (bl.x + bl.r > this.W) { bl.x = this.W - bl.r;  bl.vx = -Math.abs(bl.vx) }
      if (bl.y - bl.r < 0)      { bl.y = bl.r;           bl.vy =  Math.abs(bl.vy) }
    }

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
        this.tryTriggerOrbOnPaddleBounce()
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
          if (this.isHitBlockedByBossOrForge(b, bl)) {
            this.blockHitFeedback(b)
          } else {
            this.combo++
            if (this.upgrades.momentum) this.momentumStacks = Math.min(MOMENTUM_MAX_STACKS, this.momentumStacks + 1)
            this.hitBrick(b)
            if (this.relic?.id === 'cannon') bl.r = Math.max(this.BALL_R * BALL_CANNON_MIN, bl.r * BALL_CANNON_SHRINK)
          }
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

        if (this.isHitBlockedByBossOrForge(firstHit.brick, bl)) {
          this.blockHitFeedback(firstHit.brick)
        } else {
          this.combo++
          if (this.upgrades.momentum) this.momentumStacks = Math.min(MOMENTUM_MAX_STACKS, this.momentumStacks + 1)
          this.hitBrick(firstHit.brick)
          if (this.relic?.id === 'cannon') bl.r = Math.max(this.BALL_R * BALL_CANNON_MIN, bl.r * BALL_CANNON_SHRINK)
        }
      }
    }
  }

  /**
   * When the boss duel pool empties, Fireball applies flat damage to all boss bricks
   * (Forge: small chip as the ring shatters; other worlds: larger stagger chunk).
   * Does not run splinter/inferno chains — keeps the finisher readable.
   */
  dealBossFinisherDamageToAllBossBricks(amount) {
    if (!this.isBoss || !amount || amount <= 0) return
    const victims = this.bricks.filter(b => b.alive && b.boss)
    for (const b of victims) {
      b.hp -= amount
      b.flashTimer = BRICK_FLASH_FRAMES
      this.spawnInk(b.x + b.w / 2, b.y + b.h / 2, 3)
      if (b.hp > 0) {
        Audio.brickHit()
        continue
      }
      this.resolveBossBrickFinisherElimination(b)
    }
    this.updateBrickHPTexts()
  }

  resolveBossBrickFinisherElimination(b) {
    if (!b.boss) return
    if (b.splitCount < 3) {
      b.alive = false
      this.splitBoss(b)
      this.spawnParticles(b.x + b.w / 2, b.y + b.h / 2, b.color, 14)
      return
    }
    b.alive = false
    Audio.brickDestroy()
    this.registry.set('bricksShattered', (this.registry.get('bricksShattered') || 0) + 1)
    const points = Math.round(10 * this.roomNum * Math.max(1, Math.floor(this.combo / 2)) * this.scoreMultiplier)
    this.registry.set('score', (this.registry.get('score') || 0) + points)
    this.spawnParticles(b.x + b.w / 2, b.y + b.h / 2, b.color, 10)
    if (this.relic?.id === 'clockwork') this.clockTimer += CLOCKWORK_PER_BRICK
  }

  tryTriggerOrbOnPaddleBounce() {
    if (!this.chargeToken || !this.orbArmed) return
    const typeId = this.chargeToken.typeId
    this.chargeToken = null
    this.orbArmed = false

    if (typeId === 'fireball') {
      this.orbFireballTimer = ORB_FIREBALL_MS
      let msg = 'Fireball armed!'
      // Boss duel: each triggered Fireball strips one boss “life”; Forge shield falls on the last.
      if (this.isBoss && this.bossDuelLives > 0) {
        this.bossDuelLives--
        this.cameras.main.shake(70, 0.0045)
        Audio.bossSplit()
        if (this.worldId === 'forge' && this.bossDuelLives <= 0) {
          this.forgeBossShieldDisabled = true
          this.forgeHintText.setText('Shield shattered — the ring no longer blocks you')
          msg = 'Fireball! Shield shattered!'
          this.dealBossFinisherDamageToAllBossBricks(TUNING.combat.bossDuelForgeShatterDamage)
        } else if (this.bossDuelLives <= 0) {
          msg = 'Fireball! Boss reeling!'
          this.dealBossFinisherDamageToAllBossBricks(TUNING.combat.bossDuelFinisherDamage)
        } else {
          msg = `Fireball! Boss life ${this.bossDuelLives} left`
        }
      }
      this.statusText.setText(msg)
    } else if (typeId === 'shield') {
      this.orbShieldCharges = 1
      this.statusText.setText('Shield ready')
    } else if (typeId === 'bomb') {
      this.statusText.setText('Bomb orb backfired! -1 life')
      this.loseLife()
    }
    this.time.delayedCall(900, () => this.statusText.setText(''))
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

  // The Forge: true = do not apply damage (steel face or Anvil shield arc)
  isForgeHitBlocked(b, bl) {
    if (this.worldId !== 'forge' || !b?.alive || !bl) return false
    if (b.boss) return this.isShieldBlocked(bl, b)
    if (b.exposedSide) return this.isArmoredHit(bl, b)
    return false
  }

  isStormBossMovingBlocked(b) {
    return !!(this.worldId === 'storm' && this.isBoss && b?.boss && this.stormBossMoving)
  }

  isHitBlockedByBossOrForge(b, bl) {
    if (this.isStormBossMovingBlocked(b)) return true
    return this.isForgeHitBlocked(b, bl)
  }

  forgeBlockFeedback(b) {
    b.flashTimer = Math.max(b.flashTimer, BRICK_FLASH_FRAMES)
    Audio.forgeArmorPing()
    this.cameras.main.shake(45, 0.0022)
  }

  blockHitFeedback(b) {
    if (this.isStormBossMovingBlocked(b)) {
      b.flashTimer = Math.max(b.flashTimer, BRICK_FLASH_FRAMES)
      this.cameras.main.shake(35, 0.0018)
      return
    }
    this.forgeBlockFeedback(b)
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
    if (!b.boss) return false
    if (this.forgeBossShieldDisabled) return false  // Fireball orb duel: last boss life strips the ring

    // One shield arc around the whole cluster (same center as the drawn arc in drawFrame)
    const aliveBoss = this.bricks.filter(x => x.alive && x.boss)
    if (aliveBoss.length === 0) return false
    const bossCX = aliveBoss.reduce((s, x) => s + x.x + x.w / 2, 0) / aliveBoss.length
    const bossCY = aliveBoss.reduce((s, x) => s + x.y + x.h / 2, 0) / aliveBoss.length
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
    if (this.transitioning || this.roomComplete || this.gameOver) return
    if (TUNING.debug.enabled && TUNING.debug.invulnerable) return
    const lives = (this.registry.get('lives') || 1) - 1
    this.registry.set('lives', lives)
    this.combo = 1; this.registry.set('combo', 1)
    this.momentumStacks = 0; this.unbrokenHits = 0
    this.updateHUD()
    if (lives <= 0) { this.endRun(); return }
    this.resetBall()
    this.postDeathLaunchStep = 1
    this.msgText.setText('click/Space to ready the ball')
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
    if (this.worldId === 'storm' && this.launched && this._stormWindPhase === 'warn') status.push('wind incoming…')
    if (this.worldId === 'storm' && this.stormWindActive) status.push('gust!')
    if (this.worldId === 'garden' && this.isBoss) {
      const until = Math.max(0, Math.ceil((GARDEN_BOSS_EDGE_SPAWN_MS - this.gardenBossSpawnTimer) / 1000))
      status.push(`root spread in ${until}s`)
    }
    if (this.worldId === 'abyss' && this.isBoss) {
      const danger = Math.round((this.H * TUNING.worldMechanics.abyssBossDangerY) - (this.H * TUNING.layout.paddleY))
      status.push(`depth line ${danger}px above paddle`)
    }
    if (this.worldId === 'storm' && this.isBoss && this.stormBossMoving) status.push('eye shifting')
    if (this.relic?.id === 'pendulum' && this.launched && this.pendulumFast) status.push('FAST — brace!')
    if (this.upgrades.unbroken && this.unbrokenHits > 0) status.push(`unbroken: ${this.unbrokenHits}/20`)
    if (this.chargeToken) status.push(`orb: ${this.chargeToken.typeId} ${this.orbArmed ? '[ARMED]' : '[UNARMED]'}`)
    if (this.isBoss && this.bossDuelLives > 0) status.push(`boss life ${this.bossDuelLives}`)
    if (this.orbShieldCharges > 0) status.push('shield ready')
    if (this.orbFireballTimer > 0) status.push(`fireball ${Math.ceil(this.orbFireballTimer / 1000)}s`)
    this.statusText.setText(status.filter(Boolean).join('  '))
    // Debug-only boss pacing emphasis: quick color read while testing.
    this.statusText.setColor('#7a3010')
    if (TUNING.debug.enabled && this.isBoss) {
      const telemetry = this.getBossPaceTelemetry()
      if (telemetry?.pace === 'slow') this.statusText.setColor('#8a4d00')
      else if (telemetry?.pace === 'fast') this.statusText.setColor('#8a2018')
      else if (telemetry?.pace === 'on-target') this.statusText.setColor('#2f6a2c')
    }
    if (TUNING.debug.enabled) {
      const dbg = []
      dbg.push('DEBUG')
      if (TUNING.debug.invulnerable) dbg.push('INVULN')
      if (TUNING.debug.speedMultiplier !== 1) dbg.push(`SPD ${TUNING.debug.speedMultiplier}x`)
      if (TUNING.debug.forceWorldId) dbg.push(`W:${TUNING.debug.forceWorldId}`)
      if (TUNING.debug.forceRoomNum) dbg.push(`R:${TUNING.debug.forceRoomNum}`)
      if (this.isBoss) {
        const telemetry = this.getBossPaceTelemetry()
        if (telemetry) {
          const tag =
            telemetry.pace === 'slow' ? 'SLOW' :
            telemetry.pace === 'fast' ? 'FAST' :
            telemetry.pace === 'on-target' ? 'OK' : 'WAIT'
          dbg.push(`PACE:${tag}`)
        }
      }
      this.debugText?.setText(dbg.join(' · '))
    } else {
      this.debugText?.setText('')
    }
    this.refreshDebugPanel()
  }

  // ── End Run ────────────────────────────────────────────────────────────────

  endRun() {
    if (this.gameOver || this.transitioning) return
    this.gameOver = true
    this.transitioning = true
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
    this.cameras.main.once('camerafadeoutcomplete', () => this.goToScene('DeathScene'))
  }

  goToScene(key, data) {
    // Single transition helper to avoid accidental duplicate scene starts.
    if (this._sceneStarted) return
    this._sceneStarted = true
    if (typeof data === 'undefined') this.scene.start(key)
    else this.scene.start(key, data)
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
      // Three sides: thick dark "steel" rim. One side: bright wedge = the only breakable face.
      if (b.exposedSide && !flash) {
        const ex = b.x, ey = b.y, ew = b.w, eh = b.h
        const cx = ex + ew / 2, cy = ey + eh / 2
        const steel = 0x4a2a0a
        const pulse = 0.65 + 0.35 * Math.sin(t * 5 + b.seed)

        this.gBricks.lineStyle(3, steel, 0.9)
        if (b.exposedSide !== 'top')    this.gBricks.lineBetween(ex,      ey,      ex + ew, ey)
        if (b.exposedSide !== 'bottom') this.gBricks.lineBetween(ex,      ey + eh, ex + ew, ey + eh)
        if (b.exposedSide !== 'left')   this.gBricks.lineBetween(ex,      ey,      ex,      ey + eh)
        if (b.exposedSide !== 'right')  this.gBricks.lineBetween(ex + ew, ey,      ex + ew, ey + eh)

        this.gBricks.fillStyle(0xffb030, 0.78 * pulse)
        if (b.exposedSide === 'top') {
          this.gBricks.fillTriangle(cx - 7, ey + 2, cx + 7, ey + 2, cx, ey - 8)
        } else if (b.exposedSide === 'bottom') {
          this.gBricks.fillTriangle(cx - 7, ey + eh - 2, cx + 7, ey + eh - 2, cx, ey + eh + 8)
        } else if (b.exposedSide === 'left') {
          this.gBricks.fillTriangle(ex + 2, cy - 7, ex + 2, cy + 7, ex - 8, cy)
        } else {
          this.gBricks.fillTriangle(ex + ew - 2, cy - 7, ex + ew - 2, cy + 7, ex + ew + 8, cy)
        }
        this.gBricks.lineStyle(1.2, 0xfff5e0, 0.85 * pulse)
        if (b.exposedSide === 'top') {
          this.gBricks.lineBetween(cx - 7, ey + 2, cx, ey - 8)
          this.gBricks.lineBetween(cx, ey - 8, cx + 7, ey + 2)
        } else if (b.exposedSide === 'bottom') {
          this.gBricks.lineBetween(cx - 7, ey + eh - 2, cx, ey + eh + 8)
          this.gBricks.lineBetween(cx, ey + eh + 8, cx + 7, ey + eh - 2)
        } else if (b.exposedSide === 'left') {
          this.gBricks.lineBetween(ex + 2, cy - 7, ex - 8, cy)
          this.gBricks.lineBetween(ex - 8, cy, ex + 2, cy + 7)
        } else {
          this.gBricks.lineBetween(ex + ew - 2, cy - 7, ex + ew + 8, cy)
          this.gBricks.lineBetween(ex + ew + 8, cy, ex + ew - 2, cy + 7)
        }
      }
    }

    // ── FORGE BOSS SHIELD (The Anvil) ──
    // Draw the rotating shield arc around the boss brick cluster
    if (this.isBoss && this.worldId === 'forge' && !this.forgeBossShieldDisabled && this.bricks.some(b => b.alive && b.boss)) {
      // Find the center of the boss brick group
      const bossBricks = this.bricks.filter(b => b.alive && b.boss)
      if (bossBricks.length > 0) {
        const avgX    = bossBricks.reduce((sum, b) => sum + b.x + b.w / 2, 0) / bossBricks.length
        const avgY    = bossBricks.reduce((sum, b) => sum + b.y + b.h / 2, 0) / bossBricks.length
        const radius  = Math.round(this.W * 0.20)  // Shield orbits 20% of screen width from center

        // Thick glowing arc = "wall" — the gap between cap dots is the safe angle to attack
        this.gBricks.lineStyle(10, 0x2a0c00, 0.22)
        this.gBricks.beginPath()
        this.gBricks.arc(avgX, avgY, radius, this.anvilShieldAngle, this.anvilShieldAngle + this.anvilShieldLength, false)
        this.gBricks.strokePath()
        this.gBricks.lineStyle(5, 0xe8a020, 0.92)
        this.gBricks.beginPath()
        this.gBricks.arc(avgX, avgY, radius, this.anvilShieldAngle, this.anvilShieldAngle + this.anvilShieldLength, false)
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

    // Cartographer relic: faint dotted path toward brick centroid (wall bounces only; fades with timer).
    this.gCartographer.clear()
    if (this.relic?.id === 'cartographer' && !this.launched && this.cartographerPreviewTimer > 0) {
      const pts = this.cartographerPreviewPoints
      if (pts.length > 1) {
        const fade = this.cartographerPreviewTimer / CARTOGRAPHER_PREVIEW_MS
        const baseAlpha = (0.14 + 0.36 * fade) * fade
        for (let i = 1; i < pts.length; i++) {
          if (i % 2 === 0) continue
          this.gCartographer.lineStyle(1.15, 0x5a4838, baseAlpha * 0.88)
          this.gCartographer.lineBetween(pts[i - 1].x, pts[i - 1].y, pts[i].x, pts[i].y)
        }
      }
    }

    // Storm world: telegraph gust direction with drifting strokes
    this.gStormFx.clear()
    if (this.worldId === 'storm' && this.launched && this._stormWindPhase === 'warn') {
      const M = TUNING.worldMechanics
      const prog = 1 - Math.max(0, this._stormWindTimer) / M.stormGustTelegraphMs
      const alpha = 0.07 + 0.16 * prog
      const sign = this._stormWindSign
      const anim = this.wobbleTime * 140 * sign
      this.gStormFx.lineStyle(1.4, 0x5858a0, alpha)
      for (let i = 0; i < 18; i++) {
        const y = 14 + (i / 18) * this.H * 0.58
        const slip = (anim + i * 17) % (this.W * 0.45)
        const x0 = sign > 0 ? slip - 24 : this.W - slip + 24
        this.gStormFx.lineBetween(x0, y, x0 + 32 * sign, y + 6)
      }
    }
    if (this.worldId === 'abyss' && this.isBoss) {
      const y = this.H * TUNING.worldMechanics.abyssBossDangerY
      this.gStormFx.lineStyle(3, 0x1f4ca8, 0.24)
      this.gStormFx.lineBetween(0, y, this.W, y)
      this.gStormFx.lineStyle(1.1, 0x8fb9ff, 0.58)
      this.gStormFx.lineBetween(0, y - 2, this.W, y - 2)
    }
    if (this.worldId === 'storm' && this.isBoss && this.stormBossMoving) {
      const boss = this.bricks.find(b => b.alive && b.boss)
      if (boss) {
        const cx = boss.x + boss.w / 2
        const cy = boss.y + boss.h / 2
        const pulse = 0.55 + 0.45 * Math.sin(this.wobbleTime * 14)
        const rr = Math.max(boss.w, boss.h) * (0.65 + 0.15 * pulse)
        this.gStormFx.lineStyle(2.4, 0xa9b5ff, 0.35 + 0.25 * pulse)
        this.gStormFx.strokeCircle(cx, cy, rr)
        this.gStormFx.lineStyle(1.3, 0xe3e8ff, 0.35)
        this.gStormFx.strokeCircle(cx, cy, rr + 7)
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

    // All balls — Mirror: two balls on paddle before launch; after launch twin is drawn separately (slightly different ink).
    if (this.relic?.id === 'mirror' && !this.launched && this.ball) {
      const sep = Math.max(6, Math.round(this.ball.r * 0.85))
      for (const dx of [-sep, sep]) {
        this.drawWCircle(this.gBall, this.ball.x + dx, this.ball.y, this.ball.r, 0x2a1f0e, 1.5, t, 0xf5f0e4, 1)
      }
    } else {
      for (const bl of [this.ball, ...this.extraBalls]) {
        this.drawWCircle(this.gBall, bl.x, bl.y, bl.r, 0x2a1f0e, 1.5, t, 0xf5f0e4, 1)
      }
    }
    if (this.mirrorTwinBall) {
      this.drawWCircle(this.gBall, this.mirrorTwinBall.x, this.mirrorTwinBall.y, this.mirrorTwinBall.r, 0x3a3028, 1.35, t, 0xe8e0d4, 0.96)
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

    // ── Pickups ──
    // Shards/diamonds/skill orbs (bomb type uses the loud “hazard” read)
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

    for (const o of this.orbPickups) {
      if (o.collected) continue
      if (o.typeId === 'bomb') {
        const pulse = 0.5 + 0.5 * Math.sin(t * 10 + o.y * 0.04)
        const br = 10 + pulse * 3
        this.gParticles.lineStyle(2 + pulse * 1.5, 0xff6a5c, 0.35 + pulse * 0.45)
        this.gParticles.strokeCircle(o.x, o.y, br + 4 + pulse * 2)
        this.gParticles.fillStyle(0x9c2018, 0.96)
        this.gParticles.fillCircle(o.x, o.y, br)
        this.gParticles.lineStyle(2, 0xf19a90, 0.95)
        this.gParticles.strokeCircle(o.x, o.y, br)
        this.gParticles.lineStyle(2, 0x2a1f0e, 0.9)
        this.gParticles.lineBetween(o.x + 4, o.y - br + 1, o.x + 9, o.y - br - 4)
        this.gParticles.fillStyle(0xf0c060, 0.95)
        this.gParticles.fillCircle(o.x + 10, o.y - br - 5, 2 + pulse * 0.8)
        this.gParticles.fillStyle(0xf8f2ea, 0.95)
        this.gParticles.fillCircle(o.x, o.y - 1, 5)
        this.gParticles.fillStyle(0x2a1f0e, 0.95)
        this.gParticles.fillCircle(o.x - 2, o.y - 2, 1.2)
        this.gParticles.fillCircle(o.x + 2, o.y - 2, 1.2)
        this.gParticles.lineStyle(1.2, 0x2a1f0e, 0.9)
        this.gParticles.lineBetween(o.x - 2.5, o.y + 3, o.x + 2.5, o.y + 3)
        continue
      }
      const pulse = 0.6 + 0.4 * Math.sin(t * 7 + o.x * 0.03)
      let fill = 0x4a6a90
      let line = 0xc4d8ff
      if (o.typeId === 'fireball') { fill = 0xb84410; line = 0xffc090 }
      else if (o.typeId === 'shield') { fill = 0x2c6c58; line = 0xb8f0dd }

      this.gParticles.fillStyle(fill, 0.92)
      this.gParticles.fillCircle(o.x, o.y, 8 + pulse * 1.5)
      this.gParticles.lineStyle(1.8, line, 0.95)
      this.gParticles.strokeCircle(o.x, o.y, 8 + pulse * 1.5)
      this.gParticles.fillStyle(0xf6f1e8, 0.9)
      this.gParticles.fillCircle(o.x - 2, o.y - 2, 1.7)
    }

    // HUD bars + compact orb row (charge type, arm state, timers)
    this.gHUD.clear()
    const orbRowY = 30
    const orbSlotGap = 44
    const orbSpecs = [
      { id: 'fireball', fill: 0xb84410, ring: 0xffc090 },
      { id: 'shield', fill: 0x2c6c58, ring: 0xb8f0dd },
      { id: 'bomb', fill: 0x9c2018, ring: 0xf19a90 }
    ]
    let ox = this.W / 2 - orbSlotGap
    for (const spec of orbSpecs) {
      const held  = this.chargeToken?.typeId === spec.id
      const armed = held && this.orbArmed
      const r     = 8
      if (armed) {
        this.gHUD.lineStyle(3, 0xc9a020, 0.82 + 0.18 * Math.sin(t * 14))
        this.gHUD.strokeCircle(ox, orbRowY, r + 5)
      } else if (held) {
        this.gHUD.lineStyle(2, 0x5a4030, 0.72)
        this.gHUD.strokeCircle(ox, orbRowY, r + 3)
      }
      this.gHUD.fillStyle(spec.fill, 0.88)
      this.gHUD.fillCircle(ox, orbRowY, r)
      this.gHUD.lineStyle(1.5, spec.ring, 0.9)
      this.gHUD.strokeCircle(ox, orbRowY, r)
      ox += orbSlotGap
    }
    if (this.orbFireballTimer > 0) {
      const barW = 72
      const frac = Math.max(0, this.orbFireballTimer / ORB_FIREBALL_MS)
      this.gHUD.fillStyle(0x2a1f0e, 0.12)
      this.gHUD.fillRect(this.W / 2 - barW / 2, orbRowY + 14, barW, 4)
      this.gHUD.fillStyle(0xb84410, 0.68)
      this.gHUD.fillRect(this.W / 2 - barW / 2, orbRowY + 14, barW * frac, 4)
    }
    if (this.orbShieldCharges > 0) {
      this.gHUD.fillStyle(0x2c6c58, 0.88)
      this.gHUD.fillCircle(this.W / 2, orbRowY - 13, 3.5)
      this.gHUD.lineStyle(1, 0xb8f0dd, 0.85)
      this.gHUD.strokeCircle(this.W / 2, orbRowY - 13, 3.5)
    }
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