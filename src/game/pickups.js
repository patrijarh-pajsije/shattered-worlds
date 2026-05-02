// Pickup rolls after a brick is destroyed (mutually exclusive shard | bomb | none).
// Bomb outcomes spawn a falling **bomb skill orb** (collect → charge → arm → paddle trigger), not instant death.
// Spawning position/velocity stays in GameScene where layout constants live.

import { TUNING } from './tuning.js'

/**
 * @returns {'shard' | 'bomb' | null}
 */
export function rollStandardBrickPickup() {
  const dbg = TUNING.debug
  const shardChance = dbg.enabled
    ? Math.min(1, TUNING.drops.shardChance * Math.max(0, dbg.shardDropMultiplier || 1))
    : TUNING.drops.shardChance
  const bombChance = dbg.enabled
    ? Math.min(1, TUNING.drops.bombChance * Math.max(0, dbg.bombDropMultiplier || 1))
    : TUNING.drops.bombChance

  const dropRoll = Math.random()
  if (dropRoll < shardChance) return 'shard'
  if (dropRoll < shardChance + bombChance) return 'bomb'
  return null
}
