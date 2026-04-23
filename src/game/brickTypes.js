// Brick type helpers for standard grid rooms.
// GameScene still owns layout, palette, and world-specific fields (e.g. Forge exposedSide).

import { TUNING } from './tuning.js'

/** Known type ids for saves/debug; extend as new variants are added. */
export const BRICK_TYPE_IDS = {
  NORMAL: 'normal',
  SHARD:  'shard',
}

/**
 * Roll HP / variant for one cell in a normal brick grid.
 * @param {number} row — 0-based row index (top = 0)
 * @param {{ random?: () => number }} [opts]
 * @returns {{ typeId: string, shardBrick: boolean, hp: number, maxHp: number }}
 */
export function rollGridBrickVariant(row, opts = {}) {
  const rng = opts.random ?? Math.random
  const shardBrick = rng() < TUNING.bricks.shardBrickChance
  const hp = shardBrick ? 1 : (row < 2 ? 1 : 2)
  return {
    typeId: shardBrick ? BRICK_TYPE_IDS.SHARD : BRICK_TYPE_IDS.NORMAL,
    shardBrick,
    hp,
    maxHp: hp,
  }
}
