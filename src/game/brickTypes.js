// Brick type helpers for standard rooms + authored layouts.
// Keep this module data-driven: adding a new brick type should usually mean
// adding one entry to BRICK_TYPE_CATALOG and handling behavior in GameScene.

import { TUNING } from './tuning.js'

/** Known type ids for saves/debug; extend as new variants are added. */
export const BRICK_TYPE_IDS = {
  NORMAL:  'normal',
  SHARD:   'shard',
  ARMORED: 'armored',
}

/**
 * Catalog used by the level editor and runtime loader.
 * defaultHp: baseline HP for authored levels
 */
export const BRICK_TYPE_CATALOG = [
  { id: BRICK_TYPE_IDS.NORMAL,  label: 'Normal',  defaultHp: 1, shardBrick: false, armored: false },
  { id: BRICK_TYPE_IDS.SHARD,   label: 'Shard',   defaultHp: 1, shardBrick: true,  armored: false },
  { id: BRICK_TYPE_IDS.ARMORED, label: 'Armored', defaultHp: 2, shardBrick: false, armored: true  },
]

/** Quick lookup map by type id */
const BRICK_TYPE_MAP = Object.fromEntries(BRICK_TYPE_CATALOG.map(t => [t.id, t]))

export function getBrickTypeDefinition(typeId) {
  return BRICK_TYPE_MAP[typeId] || BRICK_TYPE_MAP[BRICK_TYPE_IDS.NORMAL]
}

/**
 * Apply type metadata to a brick-like object and return it.
 * @param {object} brick
 * @param {string} typeId
 * @param {'void'|'forge'|'garden'|'abyss'|'storm'} worldId
 * @param {{ random?: () => number, exposedSide?: string|null }} [opts]
 */
export function applyBrickTypeData(brick, typeId, worldId, opts = {}) {
  const rng = opts.random ?? Math.random
  const type = getBrickTypeDefinition(typeId)
  const sides = ['top', 'bottom', 'left', 'right']
  const exposedSide = opts.exposedSide ?? null

  brick.typeId = type.id
  brick.shardBrick = !!type.shardBrick

  if (type.armored) {
    brick.exposedSide = exposedSide || sides[Math.floor(rng() * sides.length)]
  } else if (worldId === 'forge') {
    // Forge room default: normal bricks are armored unless explicitly non-armored.
    brick.exposedSide = exposedSide || sides[Math.floor(rng() * sides.length)]
  } else {
    brick.exposedSide = null
  }

  return brick
}

/**
 * Roll HP / variant for one cell in a normal generated brick grid.
 * @param {number} row — 0-based row index (top = 0)
 * @param {{ random?: () => number }} [opts]
 * @returns {{ typeId: string, shardBrick: boolean, hp: number, maxHp: number }}
 */
export function rollGridBrickVariant(row, opts = {}) {
  const rng = opts.random ?? Math.random
  const shardBrick = rng() < TUNING.bricks.shardBrickChance
  const hp = shardBrick ? 1 : (row < 2 ? 1 : 2)
  const typeId = shardBrick ? BRICK_TYPE_IDS.SHARD : BRICK_TYPE_IDS.NORMAL
  return { typeId, shardBrick, hp, maxHp: hp }
}
