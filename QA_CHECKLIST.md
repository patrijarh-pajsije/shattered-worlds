# Shattered Worlds - QA Checklist

Use this checklist after gameplay/system changes.

## 1) Boot + Navigation

- [ ] Game starts without console/runtime errors
- [ ] `BootScene -> StartScene -> RelicScene -> TransitionScene -> GameScene` works
- [ ] `DeathScene`, `WorldClearScene`, and `WorkshopScene` navigation works
- [ ] Start scene workshop reset works and persists

## 2) Core Room Loop

- [ ] Ball launches correctly
- [ ] Paddle control feels correct (tilt + drag fallback)
- [ ] Brick collision and bounce are stable (no tunneling)
- [ ] Room clear transitions trigger exactly once

## 3) Pickups + Currency

- [ ] Shard drops spawn at expected rate
- [ ] Bomb drops spawn at expected rate and remove 1 life on collect
- [ ] Boss grants exactly configured diamond reward
- [ ] Shard-brick burst spawns configured shard count
- [ ] Burst shards obey edge behavior and collection rules

## 4) Upgrades + Relics

- [ ] Draft appears after room clear
- [ ] Picked upgrades apply immediately
- [ ] Curse behavior matches descriptions
- [ ] Relic effects are active and visible in HUD/behavior
- [ ] No obvious conflicts between major archetypes

## 5) World Mechanics

- [ ] World-specific mechanics activate in the correct world
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

