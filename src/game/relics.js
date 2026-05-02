// ─────────────────────────────────────────────────────────────────────────────
//  relics.js — Single source of truth for all relic definitions
//
//  PURPOSE:
//  Relics are the starting identity the player chooses before each run.
//  Unlike upgrades (which are gained room by room), a relic is chosen ONCE
//  and affects the entire run. They fundamentally change how the game plays.
//
//  RELIC OBJECT SHAPE:
//    id       — unique string key, stored in registry as selectedRelic.id
//    name     — display name
//    icon     — single Unicode character shown on the selection card
//    desc     — full description shown on the selection card
//    hint     — short strategic tip shown in the game HUD during play
//    unlocked — true = available from the start of a new game
//               false = must be unlocked via Workshop purchase
//
//  HOW RELICS ARE IMPLEMENTED:
//  Relic effects live in GameScene.js. The pattern is:
//    if (this.relic?.id === 'cannon') { ... do cannon thing ... }
//  The ?. (optional chaining) safely handles the case where no relic is selected.
// ─────────────────────────────────────────────────────────────────────────────
export const RELICS = [

  // ── UNLOCKED FROM THE START ───────────────────────────────────────────────

  {
    id:       'cannon',
    name:     'The Cannon',
    icon:     '●',  // Filled circle — the ball is oversized
    // Ball starts at BALL_CANNON_MULT (1.4×) size.
    // On each brick hit: bl.r *= BALL_CANNON_SHRINK (0.92) — 8% smaller each hit.
    // On paddle contact: bl.r = bl.baseR — full size restored.
    // Minimum size is BALL_CANNON_MIN (0.5×) so it never disappears.
    desc:     'Ball starts oversized. Shrinks 10% with each brick hit. Resets to full size on paddle contact.',
    hint:     'Hit the paddle to reset — manage your size.',
    unlocked: true
  },

  {
    id:       'ghost',
    name:     'The Ghost',
    icon:     '○',  // Empty circle — the paddle is invisible
    // padWidth() multiplies by PADDLE_GHOST_MULT (1.4) — 40% wider.
    // Paddle is drawn with near-zero opacity (fillAlpha 0.04) so it's invisible.
    // ghostPassUsed flag tracks the one free floor pass per room.
    // When ball.y > H and !ghostPassUsed: ball bounces off the floor and flag is set.
    desc:     'Paddle is 40% wider but invisible. Ball passes through the bottom once per room for free.',
    hint:     'You get one free floor pass per room. Use it wisely.',
    unlocked: true
  },

  {
    id:       'pendulum',
    name:     'The Pendulum',
    icon:     '◆',  // Diamond — oscillation
    // pendulumTimer accumulates delta time each frame.
    // pendulumFast toggles between true/false when timer exceeds the phase duration.
    // baseSpeed() multiplies by PENDULUM_FAST_MULT (2.1) during fast phase, 1.0 during slow.
    // padWidth() multiplies by PADDLE_PENDULUM_MULT (1.35) — wider paddle as compensation.
    desc:     'Ball alternates between normal and dangerously fast every few seconds. Paddle is 35% wider to compensate.',
    hint:     'Time your shots during the normal phase.',
    unlocked: true
  },

  {
    id:       'magnet',
    name:     'The Magnet',
    icon:     '▲',  // Triangle pointing up — attraction
    // Each frame, if the ball is within MAGNET_RANGE * H of the paddle center
    // AND moving downward (vy > 0), a small force is applied toward the paddle.
    // X pull: MAGNET_X_STRENGTH (0.4) — pulls ball left/right toward paddle center.
    // Y pull: MAGNET_Y_STRENGTH (0.15) — gently slows the ball's descent.
    desc:     'Paddle gently pulls the ball when it gets close. Forgiving but subtle.',
    hint:     'Pairs well with Ghost Ball — less need for precision.',
    unlocked: true
  },

  {
    id:       'inkdrop',
    name:     'The Ink Drop',
    icon:     '◇',  // Empty diamond — a drop spreading out
    // When a brick dies, an ink pool is pushed into the inkPools array:
    //   { x, y, r: BW * 0.7, life: INKPOOL_DURATION }
    // Each frame, any ball inside a pool (distance < pool.r) has its
    // target speed multiplied by INKPOOL_SLOW (0.55) — 45% slower.
    // Pools fade visually as life decreases and are removed when life ≤ 0.
    desc:     'Every destroyed brick leaves an ink puddle that slows any ball passing through it.',
    hint:     'Puddles persist — plan your angles around them.',
    unlocked: true
  },

  {
    id:       'clockwork',
    name:     'The Clockwork',
    icon:     '◎',  // Target/clock face
    // clockTimer starts at CLOCKWORK_START (60000ms = 60 seconds).
    // Each frame subtracts delta time: clockTimer -= dt
    // Each destroyed brick adds CLOCKWORK_PER_BRICK (2000ms = 2 seconds).
    // When clockTimer ≤ 0: player loses a life and ball resets.
    // A thin bar at the very bottom of the screen shows remaining time.
    // Bar turns red when below 30% time remaining.
    desc:     '60-second timer per room. Destroying bricks adds 2 seconds. Run out of time and lose a life.',
    hint:     'Never stop moving. Slow builds are punished.',
    unlocked: true
  },

  // ── LOCKED — UNLOCKABLE VIA WORKSHOP ──────────────────────────────────────
  // These relics are not available at the start of the game.
  // Players spend shards in the Workshop to add them to the selection pool.

  {
    id:       'mirror',
    name:     'The Mirror',
    icon:     '⊕',  // Circle with cross — symmetry/reflection
    // GameScene: mirrorTwinBall on launch (vx negated, same vy). Physics/bricks/paddle for both;
    // ghost / glass cannon / shield orb / loseLife consider main + twin.
    desc:     'Two balls launch simultaneously, mirrored on the horizontal axis. Lose a life if either falls.',
    hint:     'Control both with one paddle — spatial awareness is everything.',
    unlocked: false
  },

  {
    id:       'cartographer',
    name:     'The Cartographer',
    icon:     '✦',  // Star — guiding light
    // GameScene: dotted wall-bounce path from paddle toward brick centroid; ~3s fade while pre-launch; clears on launch.
    desc:     'At the start of each room, reveals the optimal ball trajectory for 3 seconds, then fades.',
    hint:     'Memorize the first shot — it sets up the whole room.',
    unlocked: false
  },
]

// ─────────────────────────────────────────────────────────────────────────────
//  getUnlockedRelics — Returns only the relics the player can currently choose
//
//  PARAMETERS:
//    workshopData — object from localStorage with Workshop purchase records
//                   e.g. { relicMirror: 1, relicCartographer: 1 }
//
//  RETURNS: array of relic objects that are either built-in unlocked OR
//           have been purchased in the Workshop
// ─────────────────────────────────────────────────────────────────────────────
export function getUnlockedRelics(workshopData = {}) {
  return RELICS.filter(r =>
    r.unlocked ||                    // Built-in unlocked relics
    workshopData[`relic${r.id.charAt(0).toUpperCase() + r.id.slice(1)}`] // Workshop-purchased
  )
}

// ─────────────────────────────────────────────────────────────────────────────
//  getRelicChoices — Returns N random relics for the selection screen
//
//  PARAMETERS:
//    n            — how many relics to show (default 3)
//    workshopData — Workshop purchase data (passed to getUnlockedRelics)
//
//  RETURNS: array of N relic objects, shuffled randomly
//
//  The spread operator [...pool] creates a copy before sorting so we don't
//  mutate the original RELICS array order.
// ─────────────────────────────────────────────────────────────────────────────
export function getRelicChoices(n = 3, workshopData = {}) {
  const pool = getUnlockedRelics(workshopData)
  return [...pool].sort(() => Math.random() - 0.5).slice(0, n)
}