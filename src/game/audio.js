// ─────────────────────────────────────────────────────────────────────────────
//  audio.js — Procedural audio system using Web Audio API
//
//  No audio files required. All sounds are generated mathematically.
//  This matches the hand-drawn aesthetic — imperfect, organic, ink-like.
//
//  USAGE in any scene:
//    import { Audio } from '../game/audio.js'
//    Audio.init()              // Call once (e.g. on first user tap)
//    Audio.brickHit()          // Ball hits brick but doesn't destroy it
//    Audio.brickDestroy()      // Brick is destroyed
//    Audio.paddleBounce()      // Ball hits paddle
//    Audio.roomClear()         // All bricks destroyed
//    Audio.bossSplit()         // Boss brick splits
//    Audio.death()             // Player dies
//    Audio.upgradeSelect()     // Player picks an upgrade card
//    Audio.laserFire()         // Laser fires
//
//  HOW IT WORKS:
//  The Web Audio API lets us create oscillators (tone generators) and shape
//  their amplitude over time using "gain envelopes" — attack, sustain, decay.
//  Short sharp sounds = brick hits. Longer tones = room clear, death.
//
//  IMPORTANT: Audio context must be created after a user gesture.
//  Call Audio.init() inside a pointerdown/touchstart handler.
// ─────────────────────────────────────────────────────────────────────────────

// The AudioContext is the root of the Web Audio API graph.
// All sounds are routed through it to the speakers.
let ctx = null

// Master gain node — controls overall volume.
// All sounds connect to this before going to speakers.
let masterGain = null

// Whether audio has been successfully initialised
let ready = false

// ─────────────────────────────────────────────────────────────────────────────
//  INIT — must be called after a user gesture (tap/click)
//  Browsers block audio until the user has interacted with the page.
// ─────────────────────────────────────────────────────────────────────────────
function init() {
  if (ready) return  // Already initialised — don't create a second context

  try {
    // AudioContext is the Web Audio engine
    ctx = new (window.AudioContext || window.webkitAudioContext)()

    // Master gain: 0.0 = silent, 1.0 = full volume
    masterGain = ctx.createGain()
    masterGain.gain.value = 0.4  // 40% volume — not too loud for mobile
    masterGain.connect(ctx.destination)  // Route to speakers

    ready = true
  } catch (e) {
    // Audio not supported — game continues silently
    console.warn('Audio not available:', e)
  }
}

// ─────────────────────────────────────────────────────────────────────────────
//  CORE HELPERS
// ─────────────────────────────────────────────────────────────────────────────

// Creates a short tone burst — the building block for most sounds
// PARAMETERS:
//   freq      — frequency in Hz (higher = higher pitch)
//   duration  — how long the sound lasts in seconds
//   type      — oscillator waveform: 'sine', 'square', 'sawtooth', 'triangle'
//   volume    — peak amplitude (0-1)
//   decay     — how quickly amplitude falls after peak (higher = faster fade)
function tone(freq, duration, type = 'sine', volume = 0.3, decay = 8) {
  if (!ready) return

  // Oscillator: generates the raw tone at the given frequency
  const osc = ctx.createOscillator()
  osc.type      = type
  osc.frequency.value = freq

  // Gain envelope: controls volume over time
  const gain = ctx.createGain()
  const now  = ctx.currentTime

  // Attack: ramp up to peak volume almost instantly
  gain.gain.setValueAtTime(0, now)
  gain.gain.linearRampToValueAtTime(volume, now + 0.005)

  // Decay: exponential fade out (sounds more natural than linear)
  gain.gain.exponentialRampToValueAtTime(0.001, now + duration)

  // Connect: oscillator → gain → master gain → speakers
  osc.connect(gain)
  gain.connect(masterGain)

  // Play and auto-stop
  osc.start(now)
  osc.stop(now + duration)
}

// Creates noise — randomized signal, useful for percussive sounds
// PARAMETERS:
//   duration — length in seconds
//   volume   — peak amplitude
//   filter   — Hz cutoff for low-pass filter (lower = more muffled)
function noise(duration, volume = 0.2, filter = 2000) {
  if (!ready) return

  // Create a buffer of random samples (white noise)
  const bufferSize = Math.ceil(ctx.sampleRate * duration)
  const buffer     = ctx.createBuffer(1, bufferSize, ctx.sampleRate)
  const data       = buffer.getChannelData(0)
  for (let i = 0; i < bufferSize; i++) {
    data[i] = (Math.random() * 2 - 1)  // Random values between -1 and 1
  }

  // Buffer source plays the noise buffer
  const source = ctx.createBufferSource()
  source.buffer = buffer

  // Low-pass filter removes harsh high frequencies, making it sound more like ink/paper
  const lpf = ctx.createBiquadFilter()
  lpf.type            = 'lowpass'
  lpf.frequency.value = filter

  // Gain envelope: short attack, quick decay
  const gain = ctx.createGain()
  const now  = ctx.currentTime
  gain.gain.setValueAtTime(volume, now)
  gain.gain.exponentialRampToValueAtTime(0.001, now + duration)

  // Connect: source → filter → gain → master
  source.connect(lpf)
  lpf.connect(gain)
  gain.connect(masterGain)

  source.start(now)
  source.stop(now + duration)
}

// ─────────────────────────────────────────────────────────────────────────────
//  SOUND EVENTS
//  Each function creates a specific sound through combinations of tones and noise.
// ─────────────────────────────────────────────────────────────────────────────

// Ball hits a brick but doesn't destroy it
// Short percussive tap with slight pitch randomization for variety
function brickHit() {
  const pitch = 300 + Math.random() * 200  // Random pitch between 300-500 Hz
  tone(pitch, 0.08, 'triangle', 0.25, 12)
  noise(0.04, 0.15, 1500)
}

// Brick is destroyed — more satisfying than a simple hit
// Two-part sound: initial crack + short resonance
function brickDestroy() {
  const pitch = 200 + Math.random() * 150  // Lower than hit sound
  tone(pitch,        0.12, 'square',   0.3,  10)
  tone(pitch * 1.5,  0.08, 'triangle', 0.15, 15)
  noise(0.08, 0.25, 800)
}

// Ball bounces off paddle — soft thud
// Low frequency, short, muffled
function paddleBounce() {
  tone(120, 0.06, 'sine',    0.2, 15)
  noise(0.03, 0.12, 400)
}

// All bricks destroyed — ascending celebratory chime
// Three tones rising in pitch, staggered in time
function roomClear() {
  tone(440, 0.3, 'sine', 0.3, 4)
  setTimeout(() => tone(550, 0.3, 'sine', 0.25, 4), 120)
  setTimeout(() => tone(660, 0.5, 'sine', 0.2, 3),  240)
}

// Boss brick splits — deep, heavy rumble
// Low frequency + noise burst to simulate impact
function bossSplit() {
  tone(80,  0.4, 'sawtooth', 0.4, 5)
  tone(120, 0.3, 'square',   0.2, 6)
  noise(0.2, 0.4, 600)
}

// Player loses all lives — slow descending tones
// Melancholy, matches the "The Void Wins" aesthetic
function death() {
  tone(330, 0.4, 'sine', 0.3, 3)
  setTimeout(() => tone(275, 0.5, 'sine', 0.25, 3), 200)
  setTimeout(() => tone(220, 0.8, 'sine', 0.2,  2), 450)
}

// Player selects an upgrade card — clean confirmatory chime
function upgradeSelect() {
  tone(520, 0.15, 'sine',     0.25, 8)
  tone(780, 0.2,  'triangle', 0.15, 6)
}

// Laser fires from paddle — brief electronic zap
// High frequency sawtooth gives it an electrical feel
function laserFire() {
  tone(800, 0.06, 'sawtooth', 0.15, 20)
  tone(600, 0.04, 'square',   0.1,  25)
}

// Judgement Beam fires — powerful, deep boom
function judgementBeam() {
  tone(60,  0.5,  'sawtooth', 0.5,  3)
  tone(120, 0.3,  'square',   0.3,  4)
  noise(0.3, 0.5, 500)
}

// Hot Streak activates — brief ascending alert
function hotStreakActivate() {
  tone(440, 0.08, 'square',   0.2, 10)
  tone(660, 0.12, 'triangle', 0.15, 8)
}

// Relic selected — warm tone, slightly longer
function relicSelect() {
  tone(360, 0.2, 'sine', 0.3, 5)
  tone(540, 0.3, 'sine', 0.2, 4)
}

// Bomb warning — short, urgent double beep
function bombWarning() {
  tone(920, 0.05, 'square', 0.16, 18)
  setTimeout(() => tone(760, 0.06, 'square', 0.14, 16), 55)
}

// Shard brick explosion — bright crystal crack + shimmer tail
function shardBrickExplode() {
  tone(980, 0.05, 'triangle', 0.2, 16)
  tone(1320, 0.08, 'sine', 0.14, 12)
  setTimeout(() => tone(720, 0.09, 'triangle', 0.12, 10), 35)
  noise(0.06, 0.12, 2200)
}

// ─────────────────────────────────────────────────────────────────────────────
//  EXPORTED API
//  Import this object in any scene and call Audio.init() once on first tap.
// ─────────────────────────────────────────────────────────────────────────────
export const Audio = {
  init,
  brickHit,
  brickDestroy,
  paddleBounce,
  roomClear,
  bossSplit,
  death,
  upgradeSelect,
  laserFire,
  judgementBeam,
  hotStreakActivate,
  relicSelect,
  bombWarning,
  shardBrickExplode,
}