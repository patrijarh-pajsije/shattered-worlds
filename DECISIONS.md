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

---

## Template for New Entries

### YYYY-MM-DD - Title

- **Decision:** ...
- **Why:** ...
- **Alternatives considered:** ...
- **Impact:** ...
- **Owner:** ...

