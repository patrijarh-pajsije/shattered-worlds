// ─────────────────────────────────────────────────────────────────────────────
//  main.js — Entry point for the entire game
//
//  This file does two things:
//    1. Imports every scene class (one per screen in the game)
//    2. Creates the Phaser.Game instance with the configuration
//
//  Phaser is a JavaScript game framework that handles the game loop,
//  rendering, input, cameras, and scene management for us.
//  Think of it as the engine — we just write the rules on top.
// ─────────────────────────────────────────────────────────────────────────────

import * as Phaser from 'phaser';

// Each scene is a separate "screen" in the game.
// They live in src/scenes/ and src/game/ folders.
import { BootScene }       from './scenes/BootScene.js'       // First scene — sets up global state
import { StartScene }      from './scenes/StartScene.js'      // Title screen
import { RelicScene }      from './scenes/RelicScene.js'      // Pick your starting relic
import { TransitionScene } from './scenes/TransitionScene.js' // "Room X of 3" atmospheric screen
import { GameScene }       from './scenes/GameScene.js'       // The actual gameplay
import { DraftScene }      from './scenes/DraftScene.js'      // Pick an upgrade between rooms
import { BossIntroScene }  from './scenes/BossIntroScene.js'  // Dramatic boss reveal screen
import { DeathScene }      from './scenes/DeathScene.js'      // Run over — stats + poetry
import { WorldClearScene } from './scenes/WorldClearScene.js' // Beat the world — celebration screen
import { WorkshopScene }   from './scenes/WorkshopScene.js'   // Spend shards on permanent upgrades
import { LevelEditorScene } from './scenes/LevelEditorScene.js' // Dev level authoring tool

// The Phaser configuration object.
// Every setting here controls how the game engine behaves.
const config = {
  // type: Phaser.AUTO means "use WebGL if available, fall back to Canvas"
  // WebGL is faster and supports more effects. Canvas works on older devices.
  type: Phaser.AUTO,

  // Game dimensions. We cap width at 420px (phone width) but allow full height.
  // Math.min(420, window.innerWidth) means: use 420px or the screen width, whichever is smaller.
  width:  Math.min(420, window.innerWidth),
  height: window.innerHeight,

  // The default background color (parchment beige). Shown before any scene renders.
  backgroundColor: '#f5f0e4',

  // Which HTML element to attach the game canvas to. 'game' is the <div id="game"> in index.html.
  parent: 'game',

  // The list of all scenes. ORDER MATTERS — the first scene in the array is loaded first.
  // Phaser loads BootScene first automatically because it's at index 0.
  scene: [
    BootScene,       // Runs first — initialises all global state, then jumps to StartScene
    StartScene,
    RelicScene,
    TransitionScene,
    GameScene,
    DraftScene,
    BossIntroScene,
    DeathScene,
    WorldClearScene,
    WorkshopScene,
    LevelEditorScene,
  ],

  // Scale settings — how the game adapts to different screen sizes.
  scale: {
    // FIT mode scales the game canvas to fill the parent element while keeping aspect ratio.
    mode: Phaser.Scale.FIT,
    // CENTER_BOTH centers the canvas horizontally and vertically in the parent.
    autoCenter: Phaser.Scale.CENTER_BOTH,
  }
}

// Create the Phaser game. This one line starts everything — the engine boots,
// loads the first scene (BootScene), and begins the game loop.
new Phaser.Game(config)