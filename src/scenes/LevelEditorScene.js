import * as Phaser from 'phaser'
import { BRICK_TYPE_CATALOG, BRICK_TYPE_IDS, getBrickTypeDefinition } from '../game/brickTypes.js'
import { createEmptyLevel, loadLevelById, normalizePlaytestWorldId, saveLevelById } from '../game/levelStore.js'

const DEFAULT_SLOT = 'slot1'
const PLAYTEST_WORLDS = ['void', 'forge', 'garden', 'abyss', 'storm']

export class LevelEditorScene extends Phaser.Scene {
  constructor() {
    super({ key: 'LevelEditorScene' })
  }

  create() {
    this.W = this.scale.width
    this.H = this.scale.height

    this.levelId = DEFAULT_SLOT
    this.level = loadLevelById(this.levelId) || createEmptyLevel({ id: this.levelId, rows: 6 })
    this.playtestWorldId = normalizePlaytestWorldId(this.level.worldId)
    this.typeIndex = 0
    this.brushHp = getBrickTypeDefinition(BRICK_TYPE_CATALOG[this.typeIndex].id).defaultHp

    this.cellW = Math.floor((this.W - 24) / this.level.cols)
    this.cellH = Math.round(this.H * 0.055)
    this.gridX = 12
    this.gridY = Math.round(this.H * 0.13)

    this.add.rectangle(0, 0, this.W, this.H, 0xf5f0e4).setOrigin(0, 0)
    this.g = this.add.graphics()
    this.uiText = this.add.text(10, 8, '', {
      fontFamily: 'Consolas, monospace',
      fontSize: '13px',
      color: '#2a1f0e',
      lineSpacing: 3,
    })

    this.msgText = this.add.text(this.W / 2, this.H - 16, '', {
      fontFamily: 'Georgia, serif',
      fontSize: '14px',
      color: '#6a5a4a',
      fontStyle: 'italic',
    }).setOrigin(0.5, 1)

    this.makeButton(this.W * 0.14, this.H * 0.94, 'save', () => this.saveLevel())
    this.makeButton(this.W * 0.34, this.H * 0.94, 'load', () => this.loadLevel())
    this.makeButton(this.W * 0.56, this.H * 0.94, 'clear', () => this.clearLevel())
    this.makeButton(this.W * 0.62, this.H * 0.94, 'world', () => this.cyclePlaytestWorld(1))
    this.makeButton(this.W * 0.78, this.H * 0.94, 'play', () => this.playTest())
    this.makeButton(this.W * 0.92, this.H * 0.94, 'back', () => this.scene.start('StartScene'))

    this.input.mouse?.disableContextMenu()
    this.input.on('pointerdown', p => this.paintFromPointer(p))
    this.input.on('pointermove', p => {
      if (p.isDown) this.paintFromPointer(p)
    })

    const kb = this.input.keyboard
    kb?.on('keydown-Q', () => this.cycleType(-1))
    kb?.on('keydown-E', () => this.cycleType(1))
    kb?.on('keydown-Z', () => this.setBrushHp(this.brushHp - 1))
    kb?.on('keydown-X', () => this.setBrushHp(this.brushHp + 1))
    kb?.on('keydown-S', () => this.saveLevel())
    kb?.on('keydown-L', () => this.loadLevel())
    kb?.on('keydown-C', () => this.clearLevel())
    kb?.on('keydown-P', () => this.playTest())
    kb?.on('keydown-W', () => this.cyclePlaytestWorld(1))
    kb?.on('keydown-ONE', () => this.switchSlot('slot1'))
    kb?.on('keydown-TWO', () => this.switchSlot('slot2'))
    kb?.on('keydown-THREE', () => this.switchSlot('slot3'))

    this.redraw()
  }

  makeButton(x, y, label, onClick) {
    const t = this.add.text(x, y, label, {
      fontFamily: 'Georgia, serif',
      fontSize: '15px',
      color: '#f5f0e4',
      backgroundColor: '#2a1f0e',
      padding: { x: 10, y: 6 },
    }).setOrigin(0.5).setInteractive({ useHandCursor: true })
    t.on('pointerover', () => t.setStyle({ backgroundColor: '#4a3020' }))
    t.on('pointerout', () => t.setStyle({ backgroundColor: '#2a1f0e' }))
    t.on('pointerdown', onClick)
  }

  switchSlot(nextId) {
    this.levelId = nextId
    this.level = loadLevelById(this.levelId) || createEmptyLevel({ id: this.levelId, rows: this.level.rows, cols: this.level.cols })
    this.playtestWorldId = normalizePlaytestWorldId(this.level.worldId)
    this.flash(`slot: ${this.levelId}`)
    this.redraw()
  }

  cyclePlaytestWorld(delta) {
    const i = PLAYTEST_WORLDS.indexOf(this.playtestWorldId)
    const next = PLAYTEST_WORLDS[(i + delta + PLAYTEST_WORLDS.length) % PLAYTEST_WORLDS.length]
    this.playtestWorldId = next
    this.level.worldId = next
    this.flash(`play as: ${next}`)
    this.redraw()
  }

  setBrushHp(hp) {
    this.brushHp = Phaser.Math.Clamp(hp, 1, 9)
    this.redraw()
  }

  cycleType(delta) {
    this.typeIndex = (this.typeIndex + delta + BRICK_TYPE_CATALOG.length) % BRICK_TYPE_CATALOG.length
    const def = getBrickTypeDefinition(BRICK_TYPE_CATALOG[this.typeIndex].id)
    this.brushHp = def.defaultHp
    this.redraw()
  }

  paintFromPointer(p) {
    const c = Math.floor((p.x - this.gridX) / this.cellW)
    const r = Math.floor((p.y - this.gridY) / this.cellH)
    if (r < 0 || c < 0 || r >= this.level.rows || c >= this.level.cols) return

    if (p.rightButtonDown()) {
      this.level.cells[r][c] = null
    } else {
      const typeId = BRICK_TYPE_CATALOG[this.typeIndex].id
      const cell = { typeId, hp: this.brushHp }
      if (typeId === BRICK_TYPE_IDS.ARMORED) cell.exposedSide = 'top'
      this.level.cells[r][c] = cell
    }
    this.redraw()
  }

  saveLevel() {
    this.level.worldId = this.playtestWorldId
    const ok = saveLevelById(this.levelId, this.level)
    this.flash(ok ? `saved ${this.levelId}` : 'save failed')
  }

  loadLevel() {
    this.level = loadLevelById(this.levelId) || createEmptyLevel({ id: this.levelId, rows: this.level.rows, cols: this.level.cols })
    this.playtestWorldId = normalizePlaytestWorldId(this.level.worldId)
    this.flash(`loaded ${this.levelId}`)
    this.redraw()
  }

  clearLevel() {
    this.level = createEmptyLevel({
      id: this.levelId,
      rows: this.level.rows,
      cols: this.level.cols,
      worldId: this.playtestWorldId,
    })
    this.flash('cleared')
    this.redraw()
  }

  playTest() {
    this.registry.set('editorPlayEnabled', true)
    this.registry.set('editorPlayLevel', this.level)
    this.registry.set('score', 0)
    this.registry.set('lives', 3)
    this.registry.set('combo', 1)
    this.registry.set('roomsCleared', 0)
    this.registry.set('bricksShattered', 0)
    this.registry.set('selectedRelic', null)
    this.registry.set('activeUpgrades', {})
    this.registry.set('scoreMultiplier', 1)
    this.scene.start('GameScene', { roomNum: 1, worldId: this.playtestWorldId, isBoss: false })
  }

  flash(msg) {
    this.msgText.setText(msg)
    this.time.delayedCall(1000, () => this.msgText.setText(''))
  }

  redraw() {
    const brush = BRICK_TYPE_CATALOG[this.typeIndex]
    this.uiText.setText([
      `LEVEL EDITOR  slot=${this.levelId}`,
      `play world=${this.playtestWorldId}  (button "world" or W — saved with level)`,
      `brush=${brush.id}  hp=${this.brushHp}`,
      'paint: left-click/drag  erase: right-click/drag',
      'Q/E type  Z/X hp  1/2/3 slot  W world  S save  L load  C clear  P play',
    ].join('\n'))

    this.g.clear()
    this.g.lineStyle(1, 0x2a1f0e, 0.18)

    for (let r = 0; r < this.level.rows; r++) {
      for (let c = 0; c < this.level.cols; c++) {
        const x = this.gridX + c * this.cellW
        const y = this.gridY + r * this.cellH
        const cell = this.level.cells[r][c]

        this.g.fillStyle(0xf8f3e9, 1)
        this.g.fillRect(x, y, this.cellW - 2, this.cellH - 2)
        this.g.strokeRect(x, y, this.cellW - 2, this.cellH - 2)

        if (!cell) continue
        const type = getBrickTypeDefinition(cell.typeId)
        const color = this.colorForType(type.id)
        this.g.fillStyle(color, 0.72)
        this.g.fillRect(x + 2, y + 2, this.cellW - 6, this.cellH - 6)
        this.g.lineStyle(1.2, 0x2a1f0e, 0.8)
        this.g.strokeRect(x + 2, y + 2, this.cellW - 6, this.cellH - 6)

        if (type.id === BRICK_TYPE_IDS.SHARD) {
          const cx = x + this.cellW / 2
          const cy = y + this.cellH / 2
          this.g.fillStyle(0xe8c468, 1)
          this.g.fillTriangle(cx, cy - 5, cx + 4, cy, cx, cy + 5)
          this.g.fillTriangle(cx, cy - 5, cx - 4, cy, cx, cy + 5)
        }
      }
    }
  }

  colorForType(typeId) {
    if (typeId === BRICK_TYPE_IDS.SHARD) return 0x9a6a18
    if (typeId === BRICK_TYPE_IDS.ARMORED) return 0x5a3818
    return 0x3a2818
  }
}
