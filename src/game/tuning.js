// Central tuning values for rapid balancing and debug iteration.
// Keep gameplay numbers here so design changes do not require deep code edits.

export const TUNING = {
  layout: {
    ballRadius: 0.022,
    paddleWidth: 0.26,
    paddleHeight: 0.022,
    paddleY: 0.62,
    touchZoneY: 0.72,
    paddleAngleMax: 0.82,
    cols: 7,
    brickHeight: 0.048,
    boardPaddingX: 16,
  },

  multipliers: {
    paddleWide: 1.4,
    paddleGhost: 1.4,
    paddlePendulum: 1.35,
    ballLeadCore: 1.35,
    ballCannon: 1.4,
    ballCannonShrink: 0.92,
    ballCannonMin: 0.5,
    ballSingularity: 0.30,
    pendulumFast: 2.1,
    overchargeSpeed: 2.0,
    overchargePad: 0.65,
  },

  timers: {
    singularityMs: 10000,
    pendulumFastMs: 3000,
    pendulumSlowMs: 4500,
    laserIntervalMs: 3000,
    laserRapidIntervalMs: 1200,
    twinMs: 4500,
    hotStreakMs: 3000,
    inkPoolMs: 8000,
    clockworkStartMs: 60000,
    clockworkPerBrickMs: 2000,
    judgementChargeMs: 2000,
    /** Cartographer relic: dotted path hint duration at room start (before first launch). */
    cartographerPreviewMs: 3000,
    /** Wall-bounce simulation steps (cap). */
    cartographerSimMaxSteps: 14000,
    /** Append a preview point every N sim steps. */
    cartographerSampleEvery: 10,
  },

  combat: {
    /** Boss rooms: extra “duel” pool Fireball orb can strip; at 0 the Forge Anvil’s ring shield stops blocking. */
    bossDuelLives: 3,
    /** Non-Forge bosses: one-time HP chunk to all boss bricks when duel lives hit 0 (Fireball finisher). */
    bossDuelFinisherDamage: 5,
    /** Forge Anvil: chip damage to each boss brick when the ring shield shatters. */
    bossDuelForgeShatterDamage: 1,
    laserSpeed: 0.022,
    hotStreakHits: 5,
    momentumMaxStacks: 8,
    momentumPerStack: 0.06,
    familiarOrbit: 2.8,
    familiarSpeed: 0.035,
    ricochetStrength: 0.022,
    ricochetRange: 0.55,
    gravityWellStrength: 0.018,
    gravityWellRange: 0.6,
    magnetRange: 0.25,
    magnetXStrength: 0.4,
    magnetYStrength: 0.15,
    splinterRadius: 2,
    dominoChainLimit: 12,
    inkPoolSlow: 0.55,
  },

  effects: {
    particleGravity: 0.07,
    particleDrag: 0.98,
    particleFade: 0.022,
    trailFade: 0.05,
    shakeBossDuration: 180,
    shakeBossIntensity: 0.008,
    shakeSplinterDuration: 80,
    shakeSplinterIntensity: 0.003,
  },

  forgeBoss: {
    shieldSpeed: 0.012,
    shieldArcLength: Math.PI * 0.6,
  },

  bricks: {
    gapChance: 0.07,
    flashFrames: 7,
    shardBrickChance: 0.08,
  },

  /** Per-world twists wired in GameScene (thin vertical slices). */
  worldMechanics: {
    gardenRegrowMs: 20000,
    abyssPaddleMult: 0.78,
    /** Pixels past bounds before Abyss counts a main-ball loss (open top/sides/bottom). */
    abyssLossMarginPx: 10,
    stormGustTelegraphMs: 1000,
    stormGustDurationMs: 1800,
    stormGustIntervalMinMs: 4500,
    stormGustIntervalMaxMs: 9200,
    /** Extra vx per frame during gust = sign × W × this */
    stormGustAccel: 0.00052,
  },

  speed: {
    ballBase: 0.007,
    ballPerRoom: 0.18,
    ballMax: 0.020,
    rampIntervalMs: 5000,
    rampMult: 1.10,
  },

  drops: {
    shardChance: 0.30,
    bombChance: 0.10,
    orbChance: 0.08,           // Chance non-boss brick spawns a skill orb pickup
    bossDiamondReward: 1,
    shardFallSpeed: 0.002,
    orbFallSpeed: 0.0017,
    collectRadius: 0.06,
    shardBurstCount: 10,
    // Shard-brick piñata: brief scatter, then all fall like normal drops
    shardBurstPhaseMs: 400,   // how long the outward scatter lasts before switching to gravity
    // Initial speed = W × this (per frame) — low “pop”, then common fall below
    shardBurstMinSpeed: 0.0021,
    shardBurstMaxSpeed: 0.0044,
    shardFallDriftX: 0.00035, // optional horizontal slow drift while falling (× W per frame, random ±)
    shardBurstDrag: 0.978,    // damp scatter so it eases out before the fall phase
    shardBurstBounceDamp: 0.6,
  },

  orb: {
    armTiltThreshold: 0.35,    // Hold-to-arm threshold from device motion x-axis
    fireballMs: 4500,          // Fireball orb duration after trigger
  },

  // Dev-only controls. Leave enabled=false for normal play.
  debug: {
    enabled: false,
    invulnerable: false,        // God mode: life does not decrease
    speedMultiplier: 1,         // Global speed scaler for quick tests
    forceWorldId: null,         // e.g. 'void', 'forge', 'garden', 'abyss', 'storm'
    forceRoomNum: null,         // 1..4
    shardDropMultiplier: 1,     // Multiply shard drop chance in debug mode
    bombDropMultiplier: 1,      // Multiply bomb drop chance in debug mode
    useCustomLevel: false,      // Load level from levelStore slot in buildBricks()
    customLevelId: 'slot1',     // levelStore slot id
  },
}

