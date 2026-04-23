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

1. World mechanics: Garden / Abyss / Storm as thin vertical slices (see GDD + `src/game/worlds.js` mechanics).
2. Phase 1 wrap: extend brick/pickup registries as new content ships; boss framework polish.
3. Remove remaining gameplay TODO placeholders in `upgrades.js` / `relics.js` where not yet implemented.
4. In-game dev tuning: current **F1–F5, `-/+, [/], ;/’`** panel in `GameScene` (document in QA/AGENTS); optional UI polish.

## Recent work log (maintenance)

| Date       | Area |
| ---------- | ---- |
| 2026-04-23 | Life loss: two-tap ready + launch; pre-launch `drawFrame` + `syncBallToPaddle` |
| 2026-04-23 | World clear: single CTA; `DeathScene` still offers workshop + retry |
| 2026-04-23 | Forge: block damage for armored side + boss shield; HUD hints; `forgeArmorPing` |
| 2026-04-23 | Shard brick: two-phase burst (scatter then unified fall) + tuning keys in `TUNING.drops` |
| 2026-04-23 | Favicon; `brickTypes` / `pickups` modules |

---

## Tracking Format (Use Per Feature)

For each feature card in your tracker:

- Scope
- Files touched
- Constants added/changed
- QA scenarios
- Risks
- Done criteria

