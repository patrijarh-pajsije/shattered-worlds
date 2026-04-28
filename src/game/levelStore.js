import { BRICK_TYPE_IDS } from './brickTypes.js'
import { TUNING } from './tuning.js'

const STORAGE_KEY = 'shattered_worlds_levels_v1'

export function createEmptyLevel(opts = {}) {
  const cols = opts.cols || TUNING.layout.cols || 7
  const rows = opts.rows || 6
  const cells = Array.from({ length: rows }, () =>
    Array.from({ length: cols }, () => null)
  )
  return {
    id: opts.id || 'slot1',
    name: opts.name || 'Custom Level',
    version: 1,
    cols,
    rows,
    cells, // null or { typeId, hp, exposedSide? }
  }
}

function safeReadAll() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw)
    return (parsed && typeof parsed === 'object') ? parsed : {}
  } catch {
    return {}
  }
}

function safeWriteAll(all) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(all))
    return true
  } catch {
    return false
  }
}

export function listLevelIds() {
  return Object.keys(safeReadAll()).sort()
}

export function loadLevelById(id) {
  const all = safeReadAll()
  const level = all[id]
  return level ? normalizeLevel(level, id) : null
}

export function saveLevelById(id, level) {
  const all = safeReadAll()
  all[id] = normalizeLevel({ ...level, id }, id)
  return safeWriteAll(all)
}

export function deleteLevelById(id) {
  const all = safeReadAll()
  delete all[id]
  return safeWriteAll(all)
}

export function normalizeLevel(level, fallbackId = 'slot1') {
  const cols = Math.max(1, Number(level?.cols) || TUNING.layout.cols || 7)
  const rows = Math.max(1, Number(level?.rows) || 6)
  const out = createEmptyLevel({
    id: level?.id || fallbackId,
    name: level?.name || 'Custom Level',
    cols,
    rows,
  })

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const cell = level?.cells?.[r]?.[c]
      if (!cell) continue
      const typeId = typeof cell.typeId === 'string' ? cell.typeId : BRICK_TYPE_IDS.NORMAL
      const hp = Math.max(1, Number(cell.hp) || 1)
      const exposedSide = ['top', 'bottom', 'left', 'right'].includes(cell.exposedSide) ? cell.exposedSide : null
      out.cells[r][c] = { typeId, hp, exposedSide }
    }
  }

  return out
}
