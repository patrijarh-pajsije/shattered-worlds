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


### 2026-04-24 - Next development priority order (design-focused)

- **Decision:** Prioritize work in this sequence: (1) level creation tool + brick types/palette, (2) relics/upgrades/mechanics implementation pass, (3) world mechanics revisit, (4) boss pass.
- **Why:** Fast content authoring is the bottleneck; without a level tool, balancing mechanics/relics/bosses is slower and less reliable.
- **Impact:** Near-term roadmap and implementation planning should start from editor/schema foundations before deeper tuning.

### 2026-04-28 - MVP direction lock (input, orbs, bosses)

- **Decision:** Keep tap-to-launch flow; paddle control remains drag-only; gyroscope is used only as hold-to-arm for orb skills.
- **Why:** Preserves current feel while adding the new skill layer without control overload.
- **Impact:** Do not reintroduce gyro paddle movement; arm state is hold-based with no cooldown for MVP.

- **Decision:** Keep all economy/object types: shards and diamonds are currency; bombs are negative orb pickups; orbs are collectible activations that can be positive or negative and may be used later.
- **Why:** Retains existing progression economy while introducing tactical orb gameplay.
- **Impact:** Orb system is additive, not a replacement for current pickups.

- **Decision:** Orb physics should follow current pickup behavior style (like bombs/shards), without brick/ball physical interaction.
- **Why:** Consistency and low implementation risk for MVP.
- **Impact:** Orbs drift/fall and are collected by paddle contact only.

- **Decision:** Boss room overlap rules: world mechanics do not overlap boss mechanics for MVP.
- **Why:** Keeps encounters readable and implementation scope contained.
- **Impact:** Boss arena behavior is isolated per boss mechanic.

- **Decision:** Boss loss model for MVP: boss can lose "lives" similarly to the player via ball miss conditions, and activated orb skills may directly remove boss lives.
- **Why:** Creates duel symmetry and enables meaningful orb usage in boss fights.
- **Impact:** Boss phase implementation should support life counters and orb-driven boss damage.

- **Decision:** Upgrade scope: no Curse or Legendary cards in MVP.
- **Why:** Reduce combinatorial complexity during core loop stabilization.
- **Impact:** Implement only easiest/common tiers now; expand later.

### 2026-05-02 - Custom level schema carries playtest `worldId`

- **Decision:** Serialized levels in `levelStore` include optional `worldId` (whitelist: void/forge/garden/abyss/storm). The in-game editor cycles this with **W** / **world** and passes it into `GameScene` on playtest so authored layouts run under the correct world rules.
- **Why:** Authors must verify Garden regrow, Abyss edges, Storm gusts, and Forge armor without playing a full campaign.
- **Impact:** `normalizeLevel` / `createEmptyLevel` set `worldId`; older saves default to `void`.

### 2026-05-02 - Abyss playfield is open on all sides

- **Decision:** In Abyss, wall bounces are disabled; if the main ball or Mirror twin crosses `abyssLossMarginPx` past any screen edge, apply the same life/shield/glass rules as the floor.
- **Why:** Matches world fantasy (“open edges”) and differentiates Abyss from a normal room beyond a narrower paddle.
- **Impact:** `ballEscapesAbyss`; extra/swarm balls are culled when escaped; Cartographer preview stops at open-boundary exit.
