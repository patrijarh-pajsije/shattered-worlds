# Shattered Worlds - QA Checklist

Use this checklist after gameplay/system changes.

**Recent focus (2026-04-28):** level editor + custom level loading; orb/charge MVP slice (hold-to-arm, paddle trigger); desktop arm fallback (hold left mouse); previous life-loss/world-clear/Forge/shard updates still active.

## 1) Boot + Navigation

- [ ] Game starts without console/runtime errors
- [ ] `BootScene -> StartScene -> RelicScene -> TransitionScene -> GameScene` works
- [ ] `DeathScene` and `WorkshopScene` navigation works; `WorldClearScene` only “continue to next world” (no workshop from world clear)
- [ ] Start scene workshop reset works and persists

## 2) Core Room Loop

- [ ] Ball launches correctly; after losing a life, first tap readies, second tap launches (normal room: one tap to launch)
- [ ] Paddle control feels correct (tilt + drag fallback)
- [ ] Brick collision and bounce are stable (no tunneling)
- [ ] Room clear transitions trigger exactly once

## 3) Pickups + Currency

- [ ] Shard drops spawn at expected rate
- [ ] Bomb drops spawn at expected rate and remove 1 life on collect
- [ ] Boss grants exactly configured diamond reward
- [ ] Shard-brick burst spawns configured shard count
- [ ] Burst shards: short scatter then normal fall; tuning in `TUNING.drops`; no stuck/off-screen from burst phase
- [ ] Orb pickups spawn, fall, and collect reliably (fireball/shield/bomb visuals are distinguishable)
- [ ] Charge token behavior: max 1 token, latest pickup overwrites prior token
- [ ] Arm behavior: gyro hold arms on device; left-mouse hold arms on desktop test builds
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
- [ ] Boss mechanics function and transition correctly
- [ ] World progression order is correct

## 6) Meta Progression

- [ ] Workshop purchases persist across sessions
- [ ] Shards/diamonds save correctly
- [ ] Reset flow clears intended data only

## 7) Performance + Stability

- [ ] Full run attempt has no crash or soft-lock
- [ ] No severe FPS drops in particle-heavy moments
- [ ] Build completes: `npm run build`

## 8) Tuning Debug Checks

- [ ] `TUNING.debug.enabled` toggles debug behavior safely
- [ ] Invulnerable mode works only when debug enabled
- [ ] Forced world/room works for rapid testing
- [ ] Speed and drop multipliers apply correctly

