# Changelog

All notable changes to this project will be documented in this file.
Format: [Keep a Changelog](https://keepachangelog.com/en/1.0.0/) · [Semantic Versioning](https://semver.org/)

---

## [1.0.0] — 2026-03-19

Promoted to stable. Package renamed to `@effectorhq/types`. No breaking API changes from v0.2.0.

### Changed
- Package name: `effector-types` → `@effectorhq/types`
- `files` field now includes `LICENSE` and `README.md`

---

## v0.2.0 — 2026-03-14

### Added
- `types.json` — Machine-readable catalog of **36 standard Effector types** (15 input, 14 output, 11 context; with roles, fields, aliases, subtype relations, ClawHub frequency data)
- `src/registry.ts` — Type registry API: `isKnownType()`, `getTypeRole()`, `getTypeFields()`, `getSubtypes()`, `getSupertypes()`, `isNameCompatible()`
- Name-based type compatibility: exact match, alias resolution, subtype relations, wildcard matching
- Subtype relations: `SecurityReport <: ReviewReport`, `SlackMessage <: Notification`, `DiscordMessage <: Notification`
- 31 tests covering catalog integrity, type lookup, role detection, field access, subtype relations, and name compatibility

### Changed
- Bumped version 0.1.0 → 0.2.0 to align with spec
- `types.json` included in npm package

---

## v0.1.0 — 2026-03-12

### Added
- Initial TypeScript type definitions for all Effector capability types
- `isStructuralSubtype()` — shape-based structural subtyping
- `canCompose()` — composability checking for capability chaining
- 9 tests covering structural subtyping and composition
