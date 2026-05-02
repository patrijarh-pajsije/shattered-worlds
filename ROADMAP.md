# Shattered Worlds - Implementation Roadmap

This roadmap turns the GDD into execution steps.
Priority is system foundations first, then content/fun tuning.

## Working Principle

- Build reusable systems before deep content polish.
- Keep values in constants/config so balancing is fast later.
- Every milestone ends with a playable checkpoint.

---

## Phase 0 - Foundation Hardening (largely complete; spot-check with QA list)

**Status 2026-04-23:** Tuning is centralized in `src/game/tuning.js` with a `TUNING.debug` block. Transition guards, `_sceneStarted` reset in `GameScene` (fix empty screen after death following a room clear), and favicon assets in `public/` are in place.

### Goals

- Stabilize core gameplay loop and scene flow.
- Ensure debugging/tuning is easy.

### Remaining / ongoing

- Occasional regression pass on `npm run build` and full run flows.
- Save/load and workshop: verify when those areas change.

### Definition of Done

- No critical loop bugs across a full run attempt.
- Build passes consistently.
- Constants are easy to find and tune.

---

## Phase 1 - Core Systems Complete (in progress)

**Status 2026-04-23:** Extracted `brickTypes.js` (grid variant / shard flag) and `pickups.js` (standard brick drop roll). The Forge: armor and boss shield are enforced in `GameScene` (were previously visual-only); `Audio.forgeArmorPing()`; clearer brick/shield art + in-run hint text. World clear: `WorldClearScene` is **continue to next world only** (workshop is death/run-end only, not on world clear).

### Goals

- Finalize generic systems needed by all worlds/content.

### Systems

- Brick types framework (normal, armored, shard, future extensible types).
- Pickup framework (shard, bomb, diamond, future pickups).
- Upgrade execution framework (timers, modifiers, event hooks).
- Relic execution framework.
- Boss behavior framework (state machine + telegraphing + phase hooks).

### Definition of Done

- New brick/pickup/upgrade/relic can be added with minimal code changes.
- No one-off logic required for each new content item.

---

## Phase 2 - World Mechanics Pass

### Goals

- Implement all 5 world mechanics as functional (not polished) versions.

### Tasks

- World 1: baseline verified.
- World 2: directional armor + boss shield timing.
- World 3: regrowth loop + anti-stall pressure.
- World 4: no-floor rule + drift pressure.
- World 5: wind telegraph + gust system + moving boss behavior.

### Definition of Done

- Each world has its core mechanic + boss loop functional.
- Mechanical identity is clearly different per world.

---

## Phase 3 - Upgrade + Relic Building Blocks

### Goals

- Implement all placeholder upgrades/relics with correct hooks and interactions.

### Tasks

- Ensure each archetype has full card pipeline (common/rare/legendary/curse logic).
- Enforce legendary frequency + gating rules.
- Implement draft weighting and reroll reliably.
- Ensure relic effects are deterministic and visible.

### Definition of Done

- All cards/relics technically work.
- No placeholder "TODO not implemented" content remains.

---

## Phase 4 - Content Tuning and Fun Iteration

### Goals

- Move from "works" to "fun."

### Tasks

- Balance pass on:
  - drop rates
  - speed scaling
  - room pacing
  - life economy
  - curse risk/reward
- Add encounter variety (room patterns, world-specific layouts).
- Tighten synergy highlights and clarity in UI text.

### Definition of Done

- Runs feel fair but intense.
- Multiple viable build paths.
- Clear spikes and release in pacing.

---

## Phase 5 - Meta Loop + Progression

### Goals

- Make long-term progression meaningful but not mandatory.

### Tasks

- Workshop categories fully wired.
- Unlock progression pacing tuned.
- Optional challenge/daily scaffolding.
- Cosmetics plumbing ready.

### Definition of Done

- Meta progression supports replayability without hard power creep.

---

## Phase 6 - Presentation Polish

### Goals

- Ship-level feel for visuals/audio/feedback.

### Tasks

- VFX pass (brick impacts, pickups, boss telegraphs).
- Audio pass (event coverage, mix consistency, signature cues).
- UI readability pass (small screens, high-motion moments).
- Performance pass (60fps target on mid devices).

### Definition of Done

- Cohesive audiovisual identity.
- Stable performance and clear readability in chaotic gameplay.

---

## Phase 7 - Pre-Release Checklist

### Tasks

- Device QA matrix (iOS/Android + tilt behavior).
- Save migration safety test.
- Crash/error logging strategy.
- Trial/full game purchase flow validation.
- Store assets and submission package.

### Definition of Done

- Release candidate stable and store-ready.

---

## Immediate Next Sprint (Recommended)

1. **Boss pass** for non–Void/Forge worlds (Garden / Abyss / Storm boss behaviors per `worlds.js`); re-tune world mechanic numbers in `TUNING.worldMechanics`.
2. Phase 1 wrap: extend brick/pickup registries as new content ships; polish boss framework.
3. Relics: optional polish for Mirror + Cartographer edge cases (multi-ball + preview vs upgrades).
4. In-game dev tuning: **F1–F5, `-/+, [/], ;/’`** panel in `GameScene` (see QA/AGENTS); optional UI polish.

## Recent work log (maintenance)

| Date       | Area |
| ---------- | ---- |
| 2026-04-23 | Life loss: two-tap ready + launch; pre-launch `drawFrame` + `syncBallToPaddle` |
| 2026-04-23 | World clear: single CTA; `DeathScene` still offers workshop + retry |
| 2026-04-23 | Forge: block damage for armored side + boss shield; HUD hints; `forgeArmorPing` |
| 2026-04-23 | Shard brick: two-phase burst (scatter then unified fall) + tuning keys in `TUNING.drops` |
| 2026-04-23 | Favicon; `brickTypes` / `pickups` modules |
| 2026-04-28 | Level editor scene (`LevelEditorScene`) + level storage/schema (`levelStore`) + custom level loading in `GameScene` |
| 2026-04-28 | Orb/charge MVP slice: orb pickup spawn, 1 token max, hold-to-arm (gyro), trigger on paddle bounce, fireball/shield/bomb effects |
| 2026-04-28 | Desktop arm fallback for testing: hold left mouse to arm orb |
| 2026-05-02 | Orb phase 2: bomb drops → bomb skill orbs; orb HUD row; boss duel lives + Forge shield break + non-Forge finisher / Forge chip |
| 2026-05-02 | Relics: The Mirror (dual ball); The Cartographer (pre-launch trajectory preview + `gCartographer`) |
| 2026-05-02 | Worlds 3–5 slices: Garden regrow queue; Storm gust FSM + `gStormFx`; Abyss narrow paddle + open edges (`ballEscapesAbyss`) |
| 2026-05-02 | Level editor: `worldId` on saved levels + **W** / **world** button to pick playtest world before **play** (`levelStore.normalizePlaytestWorldId`) |

---

## Tracking Format (Use Per Feature)

For each feature card in your tracker:

- Scope
- Files touched
- Constants added/changed
- QA scenarios
- Risks
- Done criteria


## Immediate Next Goal (2026-04-24)

Design/content pipeline first, then balance:

1. **Level creation tool + brick palette**
   - Build an internal level editor flow (author room layouts/patterns quickly).
   - Add explicit brick type definitions usable by the tool and runtime.
2. **Relics, upgrades, and core mechanics pass**
   - Finish implementation hooks and remove gameplay TODO placeholders.
3. **World mechanics revisit**
   - Re-tune each world mechanic after systems/content are in place.
4. **Boss pass**
   - Rework/extend bosses after world mechanics are stabilized.

### Suggested start (recommended)

Start with **step 1: level creation tool + brick data model**, because every later step depends on being able to author and iterate rooms quickly.

First implementation slice:
- Define a serializable room schema (`layout`, `brickType`, `hp`, world tags).
- Add a simple editor mode (place/remove/cycle brick types).
- Add load/save for test layouts and a runtime loader in `GameScene`.
- Keep this as a dev tool first; polish UI later.

### Direction locks (2026-04-28)

- Keep current input baseline: tap-to-launch + drag paddle.
- Gyro is reserved for orb arm-state only (hold-to-arm, no cooldown in MVP).
- Keep existing economy pickups (shard/diamond/bomb) and add orb activation loop on top.
- MVP upgrades exclude Curse and Legendary tiers.
- Boss rooms do not stack world mechanics for MVP.
