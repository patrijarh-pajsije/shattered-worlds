// ─────────────────────────────────────────────────────────────────────────────
//  worlds.js — Centralized definitions for all 5 worlds
//
//  Each world has:
//    id          — unique string key stored in registry as 'worldId'
//    name        — display name
//    subtitle    — shown on transition screen (e.g. "WORLD 2")
//    palette     — color theme { bg, ink, accent, brickColors[] }
//    atmos[]     — atmospheric text for each of the 4 rooms
//    bossName    — boss entity name shown on BossIntroScene
//    bossQuote   — lore quote shown on BossIntroScene
//    bossMechanic— one-line description of the boss mechanic
//    mechanic    — the world's unique gameplay twist (string id)
//    mechanicDesc— short description shown on transition screen
//
//  MECHANIC IDS (handled in GameScene):
//    null        — no mechanic (The Void, World 1)
//    'armor'     — directional armor (The Forge, World 2)
//    'regrow'    — destroyed bricks respawn at half HP after delay (Garden — TUNING.worldMechanics.gardenRegrowMs)
//    'abyss'     — smaller paddle + open playfield (ball lost past any edge — abyssLossMarginPx)
//    'wind'      — telegraphed sideways gusts (Storm — worldMechanics stormGust*)
// ─────────────────────────────────────────────────────────────────────────────

export const WORLDS = [
  {
    id:       'void',
    name:     'The Void',
    subtitle: 'WORLD 1',
    palette: {
      bg:          0xf5f0e4,  // Parchment white
      ink:         0x2a1f0e,  // Dark ink
      accent:      0x8a7a6a,  // Muted brown
      brickColors: [0x2a1f0e, 0x4a3020, 0x5a4030, 0x3a2818, 0x6a4828],
    },
    atmos: [
      'A blank space. Ink and silence.\nNothing has been broken here yet.',
      'The shapes grow denser now.\nThe void does not want to open.',
      'Something shifts in the dark.\nYou can feel it watching.',
      'You sense a presence older than form.\nThe Blank awaits beyond this room.',
    ],
    bossName:     'The Blank',
    bossQuote:    '"It was the first thing ever made.\nIt has never been broken.\nUntil now."',
    bossMechanic: 'Splits into smaller pieces each time it is hit.',
    mechanic:     null,
    mechanicDesc: null,
  },

  {
    id:       'forge',
    name:     'The Forge',
    subtitle: 'WORLD 2',
    palette: {
      bg:          0xf2ebe0,  // Warmer parchment — slightly sepia
      ink:         0x2a1a0a,  // Warmer dark ink
      accent:      0x8a6030,  // Rust/amber accent
      brickColors: [0x3a2010, 0x5a3818, 0x6a4020, 0x4a2808, 0x7a4828],
    },
    atmos: [
      'A furnace of hardened things.\nEverything here was built to last.',
      'The shapes are armored now.\nOnly their weak points yield.',
      'The heat is rising.\nHit them where they are soft.',
      'Something ancient and immovable waits.\nBut even anvils have a weak side.',
    ],
    bossName:     'The Anvil',
    bossQuote:    '"Everything breaks eventually.\nEven the thing that breaks everything else."',
    bossMechanic: 'A rotating shield wall blocks one side at all times. Time your shots.',
    mechanic:     'armor',
    mechanicDesc: 'Each brick has one soft face (bright notch). The other three sides are steel and deflect the ball—aim for the gap.',
  },

  // Worlds 3–5: mechanics wired in GameScene (regrow / smaller paddle / wind gusts).
  {
    id:       'garden',
    name:     'The Garden',
    subtitle: 'WORLD 3',
    palette: {
      bg:          0xeef5e8,
      ink:         0x1a2a0a,
      accent:      0x3a6020,
      brickColors: [0x1a3a08, 0x2a5010, 0x3a6018, 0x4a7020, 0x204808],
    },
    atmos: [
      'Things grow here whether you want them to or not.',
      'Do not linger.\nThe bricks remember how to rebuild.',
      'The longer you wait, the more there are.',
      'Something takes root at the center.\nIt will not stop growing.',
    ],
    bossName:     'The Root',
    bossQuote:    '"It does not fight.\nIt simply never stops growing."',
    bossMechanic: 'Continuously spawns new bricks from the edges of the screen.',
    mechanic:     'regrow',
    mechanicDesc: 'Bricks respawn at half HP after 20 seconds. Never stop moving.',
  },

  {
    id:       'abyss',
    name:     'The Abyss',
    subtitle: 'WORLD 4',
    palette: {
      bg:          0xe8eef5,
      ink:         0x0a1828,
      accent:      0x1840a0,
      brickColors: [0x0a1828, 0x102040, 0x183060, 0x082038, 0x204878],
    },
    atmos: [
      'There is no floor here.\nOnly depth.',
      'Be careful what you let fall.\nIt does not come back.',
      'The ball is not the only thing falling.',
      'Something rises from the depth.\nDo not let it reach you.',
    ],
    bossName:     'The Depth',
    bossQuote:    '"The further you fall,\nthe further you have to climb."',
    bossMechanic: 'The entire brick grid drifts slowly downward toward your paddle.',
    mechanic:     'abyss',
    mechanicDesc: 'Open edges — the ball can leave through any side. Paddle is smaller.',
  },

  {
    id:       'storm',
    name:     'The Storm',
    subtitle: 'WORLD 5',
    palette: {
      bg:          0xeeeef5,
      ink:         0x1a1a2a,
      accent:      0x6060c0,
      brickColors: [0x1a1a2a, 0x282840, 0x383858, 0x202038, 0x303068],
    },
    atmos: [
      'Even the air fights you here.\nNothing travels straight.',
      'A gust is coming.\nWatch for the ink streaks.',
      'The wind does not care about your plans.',
      'The eye of the storm is the calmest place.\nAnd the most dangerous.',
    ],
    bossName:     'The Eye',
    bossQuote:    '"Stillness is a lie it tells you\nright before it moves."',
    bossMechanic: 'Repositions every 5 seconds. Immune to the ball while moving.',
    mechanic:     'wind',
    mechanicDesc: 'Wind gusts push the ball sideways. Shown 1 second before they hit.',
  },
]

// ─────────────────────────────────────────────────────────────────────────────
//  Helper: get world definition by id
//  Returns the WORLDS entry matching the given id, or World 1 as fallback
// ─────────────────────────────────────────────────────────────────────────────
export function getWorld(id) {
  return WORLDS.find(w => w.id === id) || WORLDS[0]
}

// ─────────────────────────────────────────────────────────────────────────────
//  Helper: get world by index (0-based)
//  Used when advancing from one world to the next
// ─────────────────────────────────────────────────────────────────────────────
export function getWorldByIndex(index) {
  return WORLDS[Math.min(index, WORLDS.length - 1)]
}