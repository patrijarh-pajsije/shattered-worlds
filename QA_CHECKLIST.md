# Shattered Worlds - QA Checklist

Use this checklist after gameplay/system changes.

**Recent focus (2026-05-07):** desktop scale/layout calibration across all scenes; fullscreen-fit with desktop UI ratios; immediate mouse-follow paddle; gameplay board/pace retune (`paddleY`, `cols`, `brickHeight`, ball speed curve).

## 1) Boot + Navigation

- [ ] Game starts without console/runtime errors
- [ ] `BootScene -> StartScene -> RelicScene -> TransitionScene -> GameScene` works
- [ ] `DeathScene` and `WorkshopScene` navigation works; `WorldClearScene` only “continue to next world” (no workshop from world clear)
- [ ] Start scene workshop reset works and persists

## 2) Core Room Loop

- [ ] Ball launches correctly; after losing a life, first input readies, second launches (normal room: one input to launch)
- [ ] Paddle control feels immediate (active mouse pointer follow feels lag-free; keyboard fallback via `A/D` and arrows)
- [ ] Brick collision and bounce are stable (no tunneling)
- [ ] Room clear transitions trigger exactly once

## 3) Pickups + Currency

- [ ] Shard drops spawn at expected rate
- [ ] Bomb **skill orb** drops: danger cue while falling; collect stores charge; **armed paddle hit** costs 1 life (not paddle collect)
- [ ] Boss grants exactly configured diamond reward
- [ ] Shard-brick burst spawns configured shard count
- [ ] Burst shards: short scatter then normal fall; tuning in `TUNING.drops`; no stuck/off-screen from burst phase
- [ ] Orb pickups spawn, fall, and collect reliably (fireball/shield/bomb visuals are distinguishable)
- [ ] Charge token behavior: max 1 token, latest pickup overwrites prior token
- [ ] Arm behavior: `Q` toggles orb arm mode reliably (ON/OFF feedback visible)
- [ ] Trigger behavior: armed + next paddle hit consumes token and applies correct orb effect

## 4) Upgrades + Relics

- [ ] Draft appears after room clear
- [ ] Picked upgrades apply immediately
- [ ] Curse behavior matches descriptions
- [ ] Relic effects are active and visible in HUD/behavior
- [ ] No obvious conflicts between major archetypes

## 5) World Mechanics

- [ ] World-specific mechanics activate in the correct world
- [ ] The Forge: wrong-face hits and boss-shield sector block damage; metallic ping; weak side readable
- [ ] Garden: destroyed non-boss bricks queue regrow at half HP after `gardenRegrowMs`
- [ ] Abyss: smaller paddle; ball can be lost past **any** edge; hint text; shield recenters on paddle
- [ ] Storm: telegraph lines + HUD; gust applies sideways acceleration to balls
- [ ] Boss mechanics function and transition correctly
- [ ] World progression order is correct

## 5b) Level editor

- [ ] **world** / **W** cycles playtest world; **save** persists `worldId`; **play** starts `GameScene` with that world
- [ ] Custom layout loads in `GameScene` when `editorPlayEnabled` + registry level set

## 6) Meta Progression

- [ ] Workshop purchases persist across sessions
- [ ] Shards/diamonds save correctly
- [ ] Reset flow clears intended data only

## 7) Performance + Stability

- [ ] Full run attempt has no crash or soft-lock
- [ ] No severe FPS drops in particle-heavy moments
- [ ] Build completes: `npm run build`
- [ ] Desktop presentation fills the window as expected (fullscreen-style canvas)

## 8) Tuning Debug Checks

- [ ] `TUNING.debug.enabled` toggles debug behavior safely
- [ ] Invulnerable mode works only when debug enabled
- [ ] Forced world/room works for rapid testing
- [ ] Speed and drop multipliers apply correctly

