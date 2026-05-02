# Shattered Worlds - Game Design Document

## 1) Game Overview

### Title
Shattered Worlds

### Genre
Roguelite Brick-Breaker

### Platform
Mobile (iOS & Android)

### Controls
Tilt (gyroscope), portrait orientation

### Run Length
15–20 minutes (successful run)

### Death Penalty
Harsh: lose almost all run upgrades; keep meta-currency only

### Monetization
Free trial, buy full game

### Visual Style
Hand-drawn ink + watercolor. Each world has its own palette.

### Audio Style
Lo-fi acoustic: pencil taps, paper tears, soft percussion

### Target Audience
Casual-to-mid-core mobile players, roguelite fans, ages 16-35

### High-Level Pitch
Shattered Worlds is a deep roguelite brick-breaker where every run forms a unique build. Players tilt their phone to control play across five worlds, each with a distinct mechanic twist. Between rooms, they draft upgrade cards with strong synergy potential. Death is run-permanent but progression remains meaningful through meta-currency used for unlocks and light permanent options.

---

## 2) Core Game Loop

### 2.1 Run Structure

- Worlds per run: 5 (`The Void -> The Forge -> The Garden -> The Abyss -> The Storm`)
- Rooms per world: 3 standard + 1 boss (4 total)
- Total rooms per full run: 20
- Between rooms: choose 1 of 3 upgrade cards (weighted by build archetype)
- On world clear: choose 1 of 2 relics; full HP restore
- On death: run ends; earn meta-currency based on progress; return to hub

### 2.2 Room Flow

1. Enter room (world-specific layout appears)
2. Play (tilt controls; ball auto-launches after 2 seconds)
3. Clear all bricks -> room complete -> upgrade draft
4. Fail state: ball lost 3 times -> lose a life; lose all lives -> run ends
5. Boss rooms use scripted layouts that can rearrange mid-fight

### 2.3 Lives System

- Start each run with 3 lives
- Lives persist across the entire run (no per-room reset)
- Life restoration and life-preservation effects are high value

---

## 3) The Five Worlds

World order is fixed to support planning and build strategy.

### World 1 - The Void
- Palette: black ink on white parchment
- Atmosphere: blank canvas, silent, infinite
- Twist: none (baseline world)
- Boss: **The Blank** (massive brick that splits when hit)
- Purpose: onboarding / tutorial-feel world

### World 2 - The Forge
- Palette: sepia, rust, ember orange
- Atmosphere: furnace of hardened things
- Twist: directional armor on bricks; only exposed side takes damage
- Boss: **The Anvil** (rotating shield wall)
- Purpose: introduces positional aiming and timing

### World 3 - The Garden
- Palette: watercolor greens, soft yellows, earthy browns
- Atmosphere: living, overgrowing pressure
- Twist: bricks regrow after 20s at half HP
- Boss: **The Root** (spawns new bricks from edges)
- Purpose: urgency and chain/explosive payoff

### World 4 - The Abyss
- Palette: deep blue, midnight black, pale white ink
- Atmosphere: no floor, only depth
- Twist: ball lost from any side; default paddle smaller
- Boss: **The Depth** (brick grid drifts downward)
- Purpose: highest tension, survival-heavy world

### World 5 - The Storm
- Palette: storm gray, electric indigo, white lightning marks
- Atmosphere: unstable and hostile air
- Twist: random wind gusts push ball sideways (telegraphed 1s before)
- Boss: **The Eye** (repositions every 5s; immune while moving)
- Purpose: final mastery test

---

## 4) Upgrade Card System

### 4.1 Overview

- Draft cadence: after each cleared room
- Offer: 3 cards, choose 1
- Tiers: Common (gray), Rare (blue), Legendary (gold)
- Draft weighting: 70% archetype-aligned, 20% neutral, 10% wildcard
- Legendary frequency: max 1 per run, only after room 8+
- Curse cards: occasional high-risk/high-reward option; skippable
- Reroll: once per run (unlockable via meta progression)

### 4.2 Build Archetypes

- Chain Breaker
- Explosionist
- Summoner
- Laser Monk
- Iron Ball

Builds are emergent, not hard-locked.

### 4.3 Upgrade Cards (Current Placeholder Set)

#### Chain Breaker
- Momentum [Common, Chain]: consecutive hits grant stacking speed
- Hot Streak [Common, Chain]: after streak threshold, temporary double damage
- Ricochet King [Rare, Chain]: slight magnetic aim toward unbroken bricks
- The Unbroken [Legendary, Chain]: long streak spawns permanent extra ball

#### Explosionist
- Splinter [Common, Explosion]: destroyed bricks emit damaging fragments
- Blast Radius [Common, Explosion]: larger explosion radius
- Domino [Rare, Explosion]: explosion kills cause further explosions
- Inferno [Legendary, Explosion]: every brick death explodes (room-limited)

#### Summoner
- Familiar [Common, Summon]: orbiting mini-ball
- Twin Shot [Common, Summon]: temporary split balls on paddle hit
- Ghost Ball [Rare, Summon]: passes through bricks, dealing damage
- The Swarm [Legendary, Summon]: permanent mini-ball swarm

#### Laser Monk
- Laser Pulse [Common, Laser]: auto-fire laser on interval
- Rapid Fire [Common, Laser]: increased fire rate
- Piercing Shot [Rare, Laser]: lasers pass through bricks
- Judgement Beam [Legendary, Laser]: charge and fire column-clearing beam

#### Iron Ball
- Lead Core [Common, Iron]: larger, slower ball
- Wrecking Ball [Common, Iron]: one-hit brick destruction
- Gravity Well [Rare, Iron]: mild auto-pull toward dense brick clusters
- Singularity [Legendary, Iron]: massive uncontrollable ball for short duration

#### Curses
- Glass Cannon [Rare, Curse]: triple damage, run ends if ball falls
- Blindfold [Rare, Curse]: hidden paddle/HP, score multiplier bonus
- Overcharge [Rare, Curse]: much faster ball, slower paddle control

---

## 5) Starting Relics

Each run starts with a choice of 1 of 3 offered relics. Relics shape early identity and draft weighting.

- The Cannon
- The Ghost
- The Pendulum
- The Mirror
- The Magnet
- The Ink Drop
- The Clockwork
- The Cartographer

---

## 6) Meta-Progression

### 6.1 The Workshop

- Hub between runs
- Currency: Shards (earned from progress in runs)
- Design rule: sells options, not mandatory raw power
- Shard cap per run: soft cap at 100
- Workshop purchases: permanent account unlocks

### 6.2 Workshop Categories

- New Relics
- World Variants
- Light Stat Upgrades (strictly limited)
- Card Reroll
- Cosmetics
- Challenge Runs

---

## 7) Technical Direction

- Engine: Phaser.js (HTML5 Canvas), wrapped for mobile via Capacitor
- Controls: DeviceMotion gyroscope with sensitivity settings; touch-drag fallback
- Rendering: hand-drawn assets (SVG + Canvas), subtle procedural wobble
- Art pipeline: ink-on-paper -> scan -> vectorize -> SVG sprite sheets
- Audio: Howler.js target (layered lo-fi samples)
- Physics: custom AABB (no external physics engine)
- Save: local storage + cloud save targets (Game Center / Google Play Games)
- Target performance: 60 FPS on mid-range devices

---

## 8) Development Milestones

### Phase 1 - Core Prototype
Physics, tilt controls, basic brick grid, 1 upgrade card, art style proof

### Phase 2 - World 1 Complete
The Void with room flow, boss, and draft loop

### Phase 3 - Upgrade System
All archetypes + 20+ cards + relic system

### Phase 4 - All 5 Worlds
World mechanics + all bosses + world-specific layouts

### Phase 5 - Meta Loop
Workshop + shard economy tuning + relic unlock path + cosmetic scaffolding

### Phase 6 - Polish & Launch
Audio, particles, hand-drawn animation polish, store submission

---

## 9) Current Development Note (Important)

The current upgrades, bosses, and mechanics are **placeholders**.

Immediate focus:

1. Implement robust building blocks and systems
2. Ensure all pipelines (rooms, cards, relics, worlds, saves, UX feedback) are stable
3. Then iterate hard on fun: design, levels, upgrades, bosses, world identity, visuals, and sound

This document should be treated as a living foundation, not final balance/design.

---

## 10) Implementation status pointer

For what is **implemented in code** vs next on the schedule, see `ROADMAP.md` and `DECISIONS.md` (kept in sync as features land). Tuning and player-facing numbers in active development live in `src/game/tuning.js`.

**2026-05-02:** Garden / Storm / Abyss have first-pass mechanics in `GameScene`; level editor saves a **playtest `worldId`** so layouts can be tried under each world without a full run. Next major gap: distinct bosses for worlds 3–5 (see `ROADMAP` Immediate Next Sprint).

---

## 11) MVP Direction Lock (2026-04-28)

- Input: keep tap-to-launch and drag paddle; gyro is used for hold-to-arm only.
- Economy/object model: shards + diamonds remain currency, bombs remain negative pickups, and orbs are a separate collectible activation layer (positive/negative).
- Orb behavior: use current pickup-style movement/collection approach for MVP consistency.
- Boss overlap: world mechanics are disabled in boss rooms for MVP readability.
- Boss duel model: boss can lose lives similarly to player miss conditions; activated orbs may remove boss lives.
- Upgrade scope: no Curse or Legendary cards in MVP.

