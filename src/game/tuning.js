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
  },

  combat: {
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

  speed: {
    ballBase: 0.007,
    ballPerRoom: 0.18,
    ballMax: 0.020,
    rampIntervalMs: 3000,
    rampMult: 1.10,
  },

  drops: {
    shardChance: 0.30,
    bombChance: 0.10,
    bossDiamondReward: 1,
    shardFallSpeed: 0.002,
    bombFallSpeed: 0.002,
    collectRadius: 0.06,
    shardBurstCount: 10,
    shardBurstSpreadX: 0.0075,
    shardBurstSpreadY: 0.0035,
    shardBurstDrag: 0.992,
    shardBurstBounceDamp: 0.72,
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
  },
}

