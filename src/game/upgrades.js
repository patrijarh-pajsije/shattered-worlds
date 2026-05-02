// ─────────────────────────────────────────────────────────────────────────────
//  upgrades.js — Single source of truth for all upgrade cards
//
//  PURPOSE:
//  Every upgrade card in the game is defined here as a data object.
//  The GameScene reads these definitions to know what each upgrade does.
//  The DraftScene reads them to display cards and detect synergies.
//
//  WHY ONE FILE?
//  If upgrade data lived inside GameScene, you'd have to search through 1000
//  lines of physics code to change a description. Keeping data separate from
//  logic is a core programming principle called "separation of concerns."
//
//  UPGRADE OBJECT SHAPE:
//    id          — unique string key, stored in the registry as { id: true }
//    name        — display name on the card
//    tier        — 'Common' | 'Rare' | 'Legendary' | 'Curse'
//    archetype   — which build style this belongs to (used for draft weighting)
//    desc        — description shown on the card
//    synergies   — array of ids this card pairs well with
//    synergyNote — short text shown when a synergy is active (in blue on card)
//    curse       — true only for Curse tier cards
//
//  ARCHETYPES:
//    'chain'     — Chain Breaker: rewards long unbroken hit streaks
//    'explosion' — Explosionist: bricks damage each other on death
//    'summon'    — Summoner: extra balls and companions
//    'laser'     — Laser Monk: the paddle becomes a weapon
//    'iron'      — Iron Ball: slow, massive, unstoppable ball
//    'utility'   — Neutral: fits any build
//    'curse'     — Curse cards: negative + powerful bonus
// ─────────────────────────────────────────────────────────────────────────────
export const UPGRADES = [

  // ── CHAIN BREAKER ────────────────────────────────────────────────────────
  // This archetype rewards the player for keeping long, unbroken hit streaks.
  // The ball speeds up, damage increases, and eventually a new ball spawns.

  {
    id:          'momentum',
    name:        'Momentum',
    tier:        'Common',
    archetype:   'chain',
    // Each consecutive brick hit adds 6% to ball speed, stacking up to 8 times.
    // Missing the ball resets all stacks. A momentum bar appears at the bottom of screen.
    desc:        'Each consecutive brick hit adds +6% ball speed, up to 8 stacks. Resets on miss.',
    synergies:   ['hotstreak', 'ricochet'],
    synergyNote: 'More hits = more speed = longer streaks.'
  },
  {
    id:          'hotstreak',
    name:        'Hot Streak',
    tier:        'Rare',
    archetype:   'chain',
    // After 5 consecutive hits (combo counter ≥ 5), ball damage doubles for 3 seconds.
    // The status bar shows "hot streak!" while active.
    desc:        '5 consecutive hits activates double damage for 3 seconds.',
    synergies:   ['momentum', 'ricochet', 'twin'],
    synergyNote: 'More balls = easier to maintain streaks.'
  },
  {
    id:          'ricochet',
    name:        'Ricochet King',
    tier:        'Rare',
    archetype:   'chain',
    // Each frame, a small force is added to the ball's velocity pointing toward
    // the nearest brick. This gently curves the ball toward targets.
    // Strength is controlled by RICOCHET_STRENGTH constant in GameScene.
    desc:        'Ball subtly steers toward the nearest brick cluster, maintaining chains.',
    synergies:   ['momentum', 'hotstreak'],
    synergyNote: 'Auto-aim keeps your streak alive longer.'
  },
  {
    id:          'unbroken',
    name:        'The Unbroken',
    tier:        'Legendary',
    archetype:   'chain',
    // Tracks a hit counter (unbrokenHits in GameScene). When it reaches 20,
    // a permanent extra ball spawns that persists for the rest of the run.
    // Missing the ball resets the counter to 0.
    desc:        'Hit 20 bricks without missing — spawn a permanent extra ball for this run.',
    synergies:   ['ricochet', 'magnet'],
    synergyNote: 'Ricochet makes the 20-hit target achievable.'
  },

  // ── EXPLOSIONIST ─────────────────────────────────────────────────────────
  // This archetype makes brick deaths cascade — one broken brick damages
  // its neighbors, which may break and damage their neighbors, etc.

  {
    id:          'splinter',
    name:        'Splinter',
    tier:        'Common',
    archetype:   'explosion',
    // When a brick dies, all bricks within SPLINTER_RADIUS brick-widths take 1 damage.
    // Blast Radius upgrade increases this range by 50%.
    desc:        'Destroyed bricks explode, dealing 1 damage to all bricks within 2 brick-widths.',
    synergies:   ['blastradius', 'domino'],
    synergyNote: 'Wider blasts = more chain reactions.'
  },
  {
    id:          'blastradius',
    name:        'Blast Radius',
    tier:        'Common',
    archetype:   'explosion',
    // This card has NO effect on its own — it's a pure amplifier for Splinter.
    // With both active, the explosion radius becomes SPLINTER_RADIUS * 1.5 brick-widths.
    desc:        'Splinter explosion radius increases by 50%.',
    synergies:   ['splinter', 'domino'],
    synergyNote: 'No effect without Splinter.'
  },
  {
    id:          'domino',
    name:        'Domino',
    tier:        'Rare',
    archetype:   'explosion',
    // When a Splinter explosion kills a brick, that dead brick ALSO triggers a Splinter
    // explosion. This can chain up to DOMINO_CHAIN_LIMIT (12) times before stopping
    // to prevent infinite loops.
    desc:        'If a Splinter explosion destroys a brick, that brick also explodes.',
    synergies:   ['splinter', 'blastradius'],
    synergyNote: 'Potential to clear entire rows in one hit.'
  },
  {
    id:          'inferno',
    name:        'Inferno',
    tier:        'Legendary',
    archetype:   'explosion',
    // Every brick that dies this room triggers a small explosion around it,
    // damaging bricks within 2.5 brick-widths. Unlike Splinter, this applies
    // to ALL brick deaths (not just ball hits), but only lasts for one room.
    desc:        'Every brick destroyed this room triggers a full explosion. This room only.',
    synergies:   ['splinter', 'domino'],
    synergyNote: 'Clears dense rooms in seconds.'
  },

  // ── SUMMONER ─────────────────────────────────────────────────────────────
  // This archetype creates extra balls and companion effects that deal
  // passive damage, removing the need to precisely aim every shot.

  {
    id:          'familiar',
    name:        'Familiar',
    tier:        'Common',
    archetype:   'summon',
    // When the ball destroys a brick, the nearest alive brick automatically
    // takes 1 damage. The familiar is visualised as a small orbiting circle
    // around the ball, connected by a faint dashed line.
    desc:        'On every brick break, the nearest adjacent brick also takes a hit.',
    synergies:   ['twin', 'swarm'],
    synergyNote: 'More balls breaking = more familiar hits.'
  },
  {
    id:          'twin',
    name:        'Twin Shot',
    tier:        'Common',
    archetype:   'summon',
    // On each paddle bounce, a mirror ball spawns traveling the opposite horizontal
    // direction. It lasts TWIN_DURATION ms then disappears. The split timer resets
    // on each bounce, so fast rallies keep two balls in play continuously.
    desc:        'Ball splits into 2 on each paddle hit, lasting 4 seconds before recombining.',
    synergies:   ['familiar', 'hotstreak'],
    synergyNote: 'Two balls = twice the streak opportunities.'
  },
  {
    id:          'ghostball',
    name:        'Ghost Ball',
    tier:        'Rare',
    archetype:   'summon',
    // Normally the ball bounces off the first brick it hits. With Ghost Ball,
    // the ball passes THROUGH all bricks, hitting every one it overlaps in a frame.
    // This can destroy entire columns in a single pass.
    desc:        'Ball passes through all bricks it touches, hitting every one in its path.',
    synergies:   ['familiar', 'splinter'],
    synergyNote: 'Every brick hit triggers Familiar chain hits.'
  },
  {
    id:          'swarm',
    name:        'The Swarm',
    tier:        'Legendary',
    archetype:   'summon',
    // Spawns 3 mini-balls at launch. Unlike Twin Shot balls, swarm balls are PERMANENT
    // for the run — they don't disappear after a timer. They also ignore the paddle
    // (can fall through the bottom without penalty). They bounce off walls and bricks.
    desc:        'Spawn 3 permanent mini-balls for the rest of the run. They ignore the paddle.',
    synergies:   ['familiar', 'ghostball'],
    synergyNote: '3 extra balls each triggering Familiar = chaos.'
  },

  // ── LASER MONK ───────────────────────────────────────────────────────────
  // This archetype turns the paddle into an active weapon. The ball becomes
  // secondary — lasers deal consistent damage regardless of angle control.

  {
    id:          'laser',
    name:        'Laser Pulse',
    tier:        'Common',
    archetype:   'laser',
    // Every LASER_INTERVAL ms (3 seconds), a laser projectile fires from the
    // center of the paddle and travels upward. It destroys the first brick it hits
    // (or passes through all of them with Piercing Shot).
    desc:        'Paddle automatically fires a laser beam upward every 3 seconds.',
    synergies:   ['rapidfire', 'piercing'],
    synergyNote: 'Entry point — needs Rapid Fire to shine.'
  },
  {
    id:          'rapidfire',
    name:        'Rapid Fire',
    tier:        'Common',
    archetype:   'laser',
    // Changes the laser interval from LASER_INTERVAL (3000ms) to
    // LASER_INTERVAL_RAPID (1200ms). Has no effect without Laser Pulse.
    desc:        'Laser fire rate increases by 60%. Lasers fire every ~1.2 seconds.',
    synergies:   ['laser', 'piercing'],
    synergyNote: 'No effect without Laser Pulse.'
  },
  {
    id:          'piercing',
    name:        'Piercing Shot',
    tier:        'Rare',
    archetype:   'laser',
    // Normally a laser removes itself from the active list when it hits a brick.
    // Piercing Shot makes lasers continue past brick hits using the 'continue'
    // keyword instead of 'return false' in the laser filter loop.
    desc:        'Lasers pass through bricks instead of stopping at the first one hit.',
    synergies:   ['laser', 'rapidfire'],
    synergyNote: 'Transforms lasers from single-target to column clear.'
  },
  {
    id:          'judgement',
    name:        'Judgement Beam',
    tier:        'Legendary',
    archetype:   'laser',
    // Tracks how long the paddle has been still (judgementCharge counter).
    // When it reaches JUDGEMENT_CHARGE_TIME (2000ms), all bricks in the column
    // directly above the paddle center are instantly destroyed.
    // A faint vertical line on screen shows the charge building up.
    desc:        'Hold the paddle still for 2 seconds to charge a beam that destroys a full column instantly.',
    synergies:   ['laser', 'rapidfire'],
    synergyNote: 'Laser Pulse keeps pressure while you charge.'
  },

  // ── IRON BALL ────────────────────────────────────────────────────────────
  // This archetype makes the ball slow but unstoppable — huge, one-shot kill,
  // and magnetically pulled toward brick clusters.

  {
    id:          'leadcore',
    name:        'Lead Core',
    tier:        'Common',
    archetype:   'iron',
    // Multiplies ball radius by BALL_LEAD_CORE_MULT (1.35) — a 35% size increase.
    // Larger ball = wider collision area = easier to hit bricks.
    desc:        'Ball grows 35% bigger. Slightly slower but harder to miss.',
    synergies:   ['wrecking', 'gravitywell'],
    synergyNote: 'Bigger ball = wider collision = easier combos.'
  },
  {
    id:          'wrecking',
    name:        'Wrecking Ball',
    tier:        'Common',
    archetype:   'iron',
    // In hitBrick(), damage is normally 1 (or 2 with hot streak).
    // With Wrecking Ball active, damage is set to b.hp — the brick's current HP —
    // so every hit is always a one-shot kill regardless of HP value.
    desc:        'Ball destroys bricks in one hit regardless of their HP.',
    synergies:   ['leadcore', 'gravitywell'],
    synergyNote: 'Combine with Lead Core for near-unstoppable momentum.'
  },
  {
    id:          'gravitywell',
    name:        'Gravity Well',
    tier:        'Rare',
    archetype:   'iron',
    // Each frame, calculates the centroid (average position) of all alive bricks.
    // Applies a small force toward that centroid, bending the ball's trajectory.
    // Strength is GRAVITY_WELL_STRENGTH — subtle enough to feel like guidance,
    // not teleportation.
    desc:        'Ball is pulled toward the densest cluster of bricks on screen.',
    synergies:   ['leadcore', 'wrecking'],
    synergyNote: 'Auto-aims into crowds. Reduces need for precision.'
  },
  {
    id:          'singularity',
    name:        'Singularity',
    tier:        'Legendary',
    archetype:   'iron',
    // When the paddle is hit, singularityTimer is set to SINGULARITY_DURATION (10s).
    // While the timer is active, ball radius becomes BALL_SINGULARITY_MULT * screen width
    // (about 30% of the screen). The ball becomes so large it hits almost everything.
    // A countdown bar at the bottom shows remaining time.
    desc:        'Ball becomes massive (30% screen width) for 10 seconds. Bounces freely — uncontrollable.',
    synergies:   ['leadcore', 'wrecking'],
    synergyNote: 'Loss of control in exchange for guaranteed destruction.'
  },

  // ── UTILITY ──────────────────────────────────────────────────────────────
  // Neutral upgrades that benefit any build.

  {
    id:          'wide',
    name:        'Wide Pad',
    tier:        'Common',
    archetype:   'utility',
    // Multiplies paddle width by PADDLE_WIDE_MULT (1.4) in the padWidth() function.
    // Simple, reliable, and pairs well with anything.
    desc:        'Paddle is 40% wider. Reliable and safe.',
    synergies:   ['judgement', 'unbroken'],
    synergyNote: 'Easier to hold still for Judgement Beam charge.'
  },

  // ── CURSES ───────────────────────────────────────────────────────────────
  // Curse cards appear randomly in the draft. They can be skipped for free,
  // or accepted in exchange for a +50% score multiplier for the rest of the run.
  // Their negative effects are real and permanent once accepted.

  {
    id:          'glasscannon',
    name:        'Glass Cannon',
    tier:        'Curse',
    archetype:   'curse',
    curse:       true,
    // In update(), if glasscannon is active and ball.y > H, endRun() is called
    // IMMEDIATELY instead of just losing a life. No second chances.
    // Damage in hitBrick() is also multiplied by 3.
    desc:        'Ball deals triple damage — but if it falls past the paddle, the run ends instantly.',
    synergies:   ['wide', 'ricochet'],
    synergyNote: 'Wide Pad is your only safety net.'
  },
  {
    id:          'blindfold',
    name:        'Blindfold',
    tier:        'Curse',
    archetype:   'curse',
    curse:       true,
    // Implemented in GameScene: paddle near-invisible; updateBrickHPTexts hides HP labels.
    desc:        'Paddle is invisible. Brick HP counters are hidden. Reward: +60% score multiplier.',
    synergies:   ['ricochet', 'magnet'],
    synergyNote: 'Magnet gives you sound-only spatial feedback.'
  },
  {
    id:          'overcharge',
    name:        'Overcharge',
    tier:        'Curse',
    archetype:   'curse',
    curse:       true,
    // Implemented in GameScene: baseSpeed() × overchargeSpeed; pointermove drag × overchargePad.
    desc:        'Ball permanently 2× faster. Paddle moves 35% slower. High risk, high reward.',
    synergies:   ['ghostball', 'swarm'],
    synergyNote: 'Summoner builds care less about paddle speed.'
  },
]

// ─────────────────────────────────────────────────────────────────────────────
//  DRAFT POOL CONFIGURATION
// ─────────────────────────────────────────────────────────────────────────────

// Probability (0-1) that one of the three draft slots will be a Curse card.
// 0.18 means roughly 1 in 5 drafts will include a curse.
export const CURSE_CHANCE = 0.18

// Minimum room number before Legendary cards can appear in the draft.
// Prevents the player from getting a Legendary on room 1 before they have
// any other cards to synergise with.
export const LEGENDARY_MIN_ROOM = 2

// ─────────────────────────────────────────────────────────────────────────────
//  getDraftPool — Generates the 3 upgrade cards shown between rooms
//
//  HOW IT WORKS:
//  1. Look at which upgrades the player already owns
//  2. Detect which archetype they're building toward (most-owned archetype wins)
//  3. Fill the draft mostly with cards from that archetype (70%)
//  4. Add wildcards from other archetypes (20%) and occasionally a curse (10%)
//  5. Shuffle and return exactly 3 cards
//
//  PARAMETERS:
//    ownedUpgrades  — object like { splinter: true, domino: true }
//    roomNum        — current room number (1-4), used to gate Legendaries
//    selectedRelicId — the relic id, reserved for future relic-synergy logic
//
//  RETURNS: array of 3 upgrade objects from UPGRADES
// ─────────────────────────────────────────────────────────────────────────────
export function getDraftPool(ownedUpgrades = {}, roomNum = 1, selectedRelicId = null) {
  // Get the list of upgrade IDs the player already owns
  const owned = Object.keys(ownedUpgrades)

  // Filter UPGRADES to only those not yet owned
  const available = UPGRADES.filter(u => !ownedUpgrades[u.id])

  // Count how many owned upgrades belong to each archetype
  // e.g. { chain: 2, explosion: 1 } means player has 2 chain cards
  const archetypeCounts = {}
  owned.forEach(id => {
    const u = UPGRADES.find(u => u.id === id)         // Find the upgrade definition
    if (u) archetypeCounts[u.archetype] = (archetypeCounts[u.archetype] || 0) + 1
  })

  // Sort archetypes by count descending, take the top one
  // The ?.[0] is optional chaining — safe if the array is empty (no owned upgrades yet)
  const dominantArchetype = Object.entries(archetypeCounts)
    .sort((a, b) => b[1] - a[1])[0]?.[0] || null

  // Remove Legendaries (too early) and Curses (handled separately) from the main pool
  const filtered = available.filter(u => {
    if (u.tier === 'Legendary' && roomNum < LEGENDARY_MIN_ROOM) return false
    if (u.tier === 'Curse') return false
    return true
  })

  // Separate the curse cards for potential inclusion
  const curses = available.filter(u => u.tier === 'Curse')

  // Roll to decide if a curse slot will replace one of the 3 card slots
  const includeCurse = Math.random() < CURSE_CHANCE && curses.length > 0

  // Split remaining cards into archetype-aligned and wildcard pools
  // aligned = cards that match the player's dominant archetype (or are utility)
  const aligned  = dominantArchetype
    ? filtered.filter(u => u.archetype === dominantArchetype || u.archetype === 'utility')
    : filtered  // If no dominant archetype yet, all cards are equal

  // wildcard = cards from OTHER archetypes (adds variety, prevents tunnel vision)
  const wildcard = filtered.filter(u =>
    u.archetype !== dominantArchetype &&
    u.archetype !== 'utility' &&
    u.archetype !== 'curse'
  )

  const picks = []

  // Shuffle both pools randomly using the sort trick
  // (Math.random() - 0.5 returns a positive or negative number randomly)
  const alignedShuffled  = [...aligned].sort(() => Math.random() - 0.5)
  const wildcardShuffled = [...wildcard].sort(() => Math.random() - 0.5)

  // If we're including a curse, we only need 2 non-curse cards; otherwise 3
  const slotsNeeded = includeCurse ? 2 : 3
  let filled = 0

  // Fill from archetype-aligned pool first
  for (const card of alignedShuffled) {
    if (filled >= slotsNeeded) break
    if (!picks.find(p => p.id === card.id)) { picks.push(card); filled++ }
  }

  // If aligned pool ran dry, fill remaining slots from wildcard pool
  for (const card of wildcardShuffled) {
    if (filled >= slotsNeeded) break
    if (!picks.find(p => p.id === card.id)) { picks.push(card); filled++ }
  }

  // Add a curse card if we rolled for one
  if (includeCurse && curses.length > 0) {
    const curse = curses[Math.floor(Math.random() * curses.length)]
    picks.push(curse)
  }

  // Final shuffle so the curse isn't predictably always in the same position
  return picks.sort(() => Math.random() - 0.5).slice(0, 3)
}

// ─────────────────────────────────────────────────────────────────────────────
//  getSynergyNote — Returns a synergy hint if the player owns a related upgrade
//
//  PARAMETERS:
//    upgrade       — the upgrade card being displayed
//    ownedUpgrades — map of currently owned upgrade ids
//
//  RETURNS: the synergyNote string if a synergy is active, or null
//
//  EXAMPLE:
//    getSynergyNote(splinterCard, { domino: true }) → "Wider blasts = more chain reactions."
//    getSynergyNote(splinterCard, { laser: true })  → null (no synergy match)
// ─────────────────────────────────────────────────────────────────────────────
export function getSynergyNote(upgrade, ownedUpgrades = {}) {
  if (!upgrade.synergies) return null

  // Find the first synergy id that the player already owns
  const activeMatch = upgrade.synergies.find(id => ownedUpgrades[id])

  // If no synergy is active, return null (no hint shown)
  if (!activeMatch) return null

  // Return the pre-written synergy note
  return upgrade.synergyNote || null
}