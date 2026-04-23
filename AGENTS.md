# Shattered Worlds - Agent Context

This file is the persistent context and rulebook for AI coding agents working in this project.

## Project Snapshot

- **Game**: `Shattered Worlds` (roguelite brick-breaker)
- **Engine**: Phaser 4
- **Bundler**: Vite
- **Primary code area**: `src/scenes/` and `src/game/`

## Collaboration Rules

- Prioritize clean, readable, maintainable code.
- Follow best coding practices: small functions, clear naming, minimal duplication, defensive checks where useful.
- Keep behavior deterministic and explicit when possible.
- Do not silently change game balance unless requested.

## Commenting Preference

The project owner prefers heavily documented code for learning.

- Default to educational comments on non-trivial logic.
- For requested features, explain key constants, conditionals, and math clearly.
- Avoid noisy comments on obvious one-liners unless explicitly requested.
- If asked to "comment every line", do so for the touched section.

## Gameplay Change Safety

When changing gameplay systems (physics, drops, economy, progression):

- Add/update named constants instead of magic numbers.
- Keep chance values and tuning values grouped near related constants.
- Preserve existing scene flow unless a flow change is requested.
- Rebuild after changes: `npm run build`.

## UI/UX Preferences (Current)

- Dangerous pickups (bombs) must be visually obvious and readable in chaotic scenes.
- Currency pickup visuals should be distinct from debris/ink.
- New mechanics should provide feedback (visual + audio) where reasonable.

## File Conventions

- Scene logic: `src/scenes/*.js`
- Shared data/systems: `src/game/*.js`
- Keep persistent workshop storage key stable unless migration is intentional.

## Testing / Verification

After edits:

1. Run `npm run build`.
2. Check lint diagnostics for changed files.
3. Briefly summarize changed behavior in plain language.

## GDD Integration

When a GDD is provided, treat it as the source of truth for design intent and priorities.

Recommended place for the GDD:

- `docs/GDD.md` (or `docs/gdd.md`)

If multiple GDD versions exist, add:

- `docs/GDD-changelog.md` with date + summary.

## Open Questions Template

If requirements are ambiguous, ask with this format:

- **Goal:** what you want changed
- **Exact behavior:** expected in-game outcome
- **Constraints:** what must not change

