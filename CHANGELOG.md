# Changelog

## 0.2.0 (2026-03-14)

### Added
- `types.json` — Machine-readable catalog of all standard Effector types (35+ types across input/output/context roles, with fields, aliases, subtype relations, and ClawHub frequency data)
- `src/registry.ts` — Type registry API: `isKnownType()`, `getTypeRole()`, `getTypeFields()`, `getSubtypes()`, `getSupertypes()`, `isNameCompatible()`
- Name-based type compatibility checking (exact match, alias resolution, subtype relations, wildcard matching)
- `tests/registry.test.js` — 31 tests covering catalog integrity, type lookup, role detection, field access, subtype relations, and name compatibility
- Subtype relations: `SecurityReport <: ReviewReport`, `SlackMessage <: Notification`, `DiscordMessage <: Notification`

### Changed
- Bumped version 0.1.0 → 0.2.0 to align with spec
- `types.json` included in npm package (`files` field)
- Fixed test glob pattern in `package.json`

## 0.1.0 (2026-03-12)

### Added
- Initial TypeScript type definitions for all Effector capability types
- `isStructuralSubtype()` — Shape-based structural subtyping
- `canCompose()` — Composability checking for capability chaining
- 9 tests covering structural subtyping and composition
