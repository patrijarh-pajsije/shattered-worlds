# Shattered Worlds - Architecture & Design Decisions

Track important decisions so future changes stay intentional.

---

## Decision Log

### 2026-04-22 - Keep systems-first development

- **Decision:** Implement robust building blocks before deep content polish.
- **Why:** Faster iteration later; avoids redesigning brittle one-off logic.
- **Impact:** Prioritize frameworks (bricks, pickups, upgrades, bosses) over final balance.

### 2026-04-22 - Centralize tuning values

- **Decision:** Use `src/game/tuning.js` as the canonical gameplay tuning source.
- **Why:** Faster balancing and clearer ownership of numeric values.
- **Impact:** Gameplay constants should gradually migrate there.

### 2026-04-22 - Add safe debug controls

- **Decision:** Add dev-only debug toggles in tuning config.
- **Why:** Accelerate testing without polluting production behavior.
- **Impact:** Debug flags are ignored unless `TUNING.debug.enabled = true`.

### 2026-04-23 - Workshop entry only after run ends

- **Decision:** `WorldClearScene` offers a single “continue to next world” (or new run). Workshop remains available from `DeathScene` and start flow, not from world clear.
- **Why:** Preserves forward momentum after a world win; spend meta-currency on death / menu as appropriate.
- **Impact:** `WorldClearScene` no second button to `WorkshopScene`.

### 2026-04-23 - Enforce The Forge armor in gameplay

- **Decision:** `isArmoredHit` and `isShieldBlocked` must gate `hitBrick` (ball, ghost ball, laser) so steel faces and the Anvil ring actually block damage; add `Audio.forgeArmorPing()` and readable HUD/art for weak side vs steel.
- **Why:** Visual-only armor read as a bug; clarity and fairness require feedback + rules.
- **Impact:** `GameScene` block checks; laser respects armor (piercing can keep beam on block—see code).

### 2026-04-23 - Shard-brick burst is two phases

- **Decision:** Shards use a short “scatter” phase (random direction, bounded speed, timed), then a normal fall phase matching standard shard drops, tuned via `TUNING.drops` (`shardBurstPhaseMs`, `shardBurstMin/MaxSpeed`, etc.).
- **Why:** One predictable, collectible shower instead of erratic long-run behavior.
- **Impact:** `spawnShardBurst` + collection loop; old asymmetric spreadX/Y removed.

### 2026-04-23 - End of session: docs + git

- **Decision:** When the user says the session is over, the agent updates relevant `*.md` and pushes a git commit to the project remote (see `AGENTS.md` “End of session”).
- **Why:** Reproducible handoff; repo and docs stay aligned.
- **Impact:** Process, not a code path.

---

## Template for New Entries

### YYYY-MM-DD - Title

- **Decision:** ...
- **Why:** ...
- **Alternatives considered:** ...
- **Impact:** ...
- **Owner:** ...

