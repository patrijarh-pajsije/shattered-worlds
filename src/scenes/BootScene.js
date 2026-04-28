import * as Phaser from 'phaser'

// ─────────────────────────────────────────────────────────────────────────────
//  BootScene.js — The very first scene that runs when the game starts
//
//  PURPOSE:
//  This scene never shows anything on screen. Its only job is to initialise
//  the global "registry" — a shared key-value store that ALL scenes can read
//  and write to. Think of the registry as the game's shared memory.
//
//  WHY A REGISTRY?
//  Phaser scenes are isolated — they can't directly access each other's
//  variables. The registry solves this: GameScene writes the score, DeathScene
//  reads it, WorkshopScene reads the shard total, etc. Without the registry,
//  we'd have to pass all this data manually between scenes every time.
//
//  After setting everything up, BootScene immediately jumps to StartScene.
// ─────────────────────────────────────────────────────────────────────────────

export class BootScene extends Phaser.Scene {
  constructor() {
    // 'BootScene' is this scene's unique key — used by other scenes to
    // reference it, e.g. this.scene.start('BootScene')
    super({ key: 'BootScene' })
  }

  preload() {
    // preload() runs before create() and is where you load images, audio, etc.
    // We currently draw everything with code (procedural graphics), so this is empty.
    // When we add hand-drawn art assets later, they'll be loaded here.
  }

  create() {
    // this.registry is Phaser's global data store — shared across all scenes.
    // We set the initial value of every piece of run state here so that
    // each scene always finds a valid value even on the very first run.

    this.registry.set('score', 0)               // Current run score
    this.registry.set('lives', 3)               // Lives remaining this run
    this.registry.set('combo', 1)               // Current combo multiplier
    this.registry.set('roomNum', 0)             // Which room we're on (1-4)
    this.registry.set('roomsCleared', 0)        // How many rooms completed this run
    this.registry.set('bricksShattered', 0)     // Total bricks broken this run
    this.registry.set('selectedRelic', null)    // The relic the player chose (object or null)
    this.registry.set('activeUpgrades', {})     // Map of upgrade id → true for owned upgrades
    this.registry.set('scoreMultiplier',   1)     // Score multiplier from curse cards
    this.registry.set('shardsCollected',  0)     // Shards picked up from brick drops this run
    this.registry.set('diamondsCollected',0)     // Diamonds picked up from boss drops this run
    this.registry.set('editorPlayEnabled', false) // True only when launching from LevelEditorScene
    this.registry.set('editorPlayLevel', null)    // Current authored layout payload
    this.registry.set('totalDiamonds',    this.registry.get('totalDiamonds') || 0)  // Persists between runs
    this.registry.set('shardsEarned', 0)        // Shards earned in the last run (shown on death screen)
    // NOTE: 'totalShards' is NOT reset here — it persists across runs.
    // If it's not set yet, other scenes default it to 0 with || 0.

    // Jump straight to the title screen. BootScene's work is done.
    this.scene.start('StartScene')
  }
}