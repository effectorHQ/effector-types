# effector-types

[![npm version](https://img.shields.io/badge/npm-%40effectorhq%2Ftypes-E03E3E.svg)](https://www.npmjs.com/package/@effectorhq/types)
[![CI](https://github.com/effectorHQ/effector-types/actions/workflows/test.yml/badge.svg)](https://github.com/effectorHQ/effector-types/actions/workflows/test.yml)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Status: Alpha](https://img.shields.io/badge/status-alpha-orange.svg)](#)

**Standard capability types for AI agent tools — the `lib.d.ts` for Effectors.**

---

## What This Is

Every AI agent tool has an implicit interface: it takes *something*, produces *something*, and needs *something* from the environment. But today, these interfaces are invisible. You chain two MCP tools and discover at runtime that they're incompatible. You compose three SKILL.md files and find out the output of skill A doesn't match the input of skill B — after burning tokens, time, and API calls.

`@effectorhq/types` makes these interfaces explicit.

It provides a standard library of **capability types** — reusable type definitions for the inputs, outputs, and contexts that AI agent tools commonly work with. Think of it as the foundation that enables type-checked composition of agent capabilities.

```typescript
import { CodeDiff, ReviewReport, Repository } from '@effectorhq/types';

// Now your skill has a typed interface:
// input: CodeDiff → output: ReviewReport, context: Repository
```

## Why Types for Agent Capabilities

TypeScript proved that adding types to an untyped ecosystem transforms it. Before TypeScript, JavaScript developers composed modules by convention and prayer. After TypeScript, composition became verifiable — editors caught errors, APIs became self-documenting, and large-scale projects became manageable.

AI agent capabilities are in the pre-TypeScript era right now:

| What we have today | What types enable |
|-------------------|------------------|
| Chain two skills, pray they work | **Type-check composition before execution** |
| Search skills by keyword on ClawHub | **Discover capabilities by interface type** |
| Read the README to understand what a tool does | **Machine-readable interface contracts** |
| Manually test every combination | **Automated compatibility verification** |
| "It works on my runtime" | **Cross-runtime interface portability** |

The research backs this up. The DALIA framework ([arXiv:2601.17435](https://arxiv.org/abs/2601.17435)) identified the need for a "formal semantic model of capabilities." The Tool-to-Agent Retrieval paper ([arXiv:2511.01854](https://arxiv.org/abs/2511.01854)) showed that semantic tool discovery outperforms keyword search. Google's BATS ([arXiv:2511.17006](https://arxiv.org/abs/2511.17006)) proved agents need cost-awareness at the capability level. `effector-types` provides the concrete type definitions these systems need.

## Type Categories

### Data Types

Types describing what flows between capabilities:

```typescript
// Code
CodeDiff          // { files: FileDiff[], baseBranch: string, headBranch: string }
CodeSnippet       // { code: string, language: string, path?: string }
PatchSet          // { patches: Patch[], description: string }

// Documents
TextDocument      // { content: string, format: 'plain' | 'markdown' | 'html' }
StructuredData    // { data: Record<string, unknown>, schema?: JSONSchema }
DataTable         // { headers: string[], rows: unknown[][], types?: ColumnType[] }

// Media
ImageSet          // { images: Image[], metadata?: ImageMetadata[] }
AudioSegment      // { audio: Buffer, format: string, duration: number }

// Analysis
ReviewReport      // { findings: Finding[], severity: Severity, summary: string }
SecurityReport    // { vulnerabilities: Vulnerability[], risk: RiskLevel }
Summary           // { text: string, keyPoints: string[], confidence: number }
```

### Context Types

Types describing what environment a capability requires:

```typescript
Repository        // { url: string, branch: string, provider: 'github' | 'gitlab' | ... }
CodingStandards   // { rules: Rule[], linter?: string, style?: string }
UserPreferences   // { language: string, timezone: string, verbosity: Level }
APICredentials    // { service: string, auth: AuthMethod }
ConversationHistory // { messages: Message[], tokenCount: number }
```

### Resource Types

Types describing what a capability consumes:

```typescript
LLMInference      // { model?: string, maxTokens?: number, temperature?: number }
APICall           // { service: string, rateLimit?: RateLimit }
FileSystem        // { paths: string[], access: 'read' | 'write' | 'readwrite' }
NetworkAccess     // { domains: string[], protocols: string[] }
```

### Composition Types

Types that enable algebraic composition:

```typescript
// A capability that takes A and returns B
Capability<Input, Output, Context?>

// Sequential composition: if A→B and B→C, then A→C
Sequential<A, B>

// Parallel composition: run both, merge results
Parallel<A, B>  // → [OutputOf<A>, OutputOf<B>]

// Conditional: branch on output type
Conditional<Test, Then, Else>

// Fallback: try A, if fail try type-compatible B
Fallback<Primary, Backup>
```

## Structural Subtyping

Types use **structural subtyping** (like TypeScript, not like Java). Two types are compatible if their shapes match — no explicit inheritance required.

```typescript
// ReviewReport is: { findings, severity, summary }
// SecurityReport is: { vulnerabilities, risk, summary, findings, severity, ... }

// SecurityReport is a structural subtype of ReviewReport
// → Any Effector expecting ReviewReport will accept SecurityReport
```

This means the ecosystem is **open to extension without coordination.** You define a new type that structurally matches an existing one, and it automatically composes with everything that existing type composes with.

## Install

```bash
npm install @effectorhq/types
```

```typescript
import { TypeRegistry } from '@effectorhq/types';
```

See the published package on npm: **https://www.npmjs.com/package/@effectorhq/types**

## Usage

### types.json — Machine-Readable Type Catalog

`types.json` is the canonical, machine-readable catalog of all standard Effector types. Any tool (JS, Python, Go, Rust) can consume it — no TypeScript compilation required.

```bash
# Validate type names from effector.toml manifests
node effector-spec/scripts/validate-manifest.js skill/effector.toml --types types.json
```

The catalog includes 35+ types across input/output/context roles, with fields, aliases, subtype relations, and usage frequency data.

### Registry API

```typescript
import { isKnownType, getTypeRole, isNameCompatible } from '@effectorhq/types/registry';

isKnownType('CodeDiff')                           // true
getTypeRole('JSON')                                // 'both' (input + output)
isNameCompatible('SecurityReport', 'ReviewReport') // true (subtype)
isNameCompatible('PlainText', 'String')            // true (alias)
```

### Annotate an effector.toml

```toml
[effector]
name = "github-pr-review"
version = "1.2.0"
type = "skill"

[effector.interface]
input = "CodeDiff"
output = "ReviewReport"
context = ["GitHubCredentials", "Repository"]
```

### Type-check composition

```typescript
import { typeCheck } from '@effectorhq/types/checker';

const pipeline = ['code-change', 'code-review', 'merge-decision'];
const result = typeCheck(pipeline);

if (!result.valid) {
  console.error(result.errors);
  // "code-review outputs ReviewReport, but merge-decision expects MergeRequest"
}
```

### Search by type

```typescript
import { discover } from '@effectorhq/types/discovery';

// Find all capabilities that take CodeDiff and produce any Report
const matches = discover({ input: 'CodeDiff', output: '*Report' });
```

## Community Types

The standard library covers common patterns. Domain-specific types live in community packages:

```bash
npm install @effector-types/finance    # InvoiceData, TransactionSet, FinancialReport
npm install @effector-types/medical    # PatientRecord, DiagnosisReport, TreatmentPlan
npm install @effector-types/devops     # DeploymentConfig, InfraState, IncidentReport
```

Anyone can publish a type package. The [contribution guide](./CONTRIBUTING.md) explains the conventions.

## Relationship to Existing Standards

| Standard | What it types | What effector-types adds |
|----------|--------------|------------------------|
| JSON Schema | Parameter shapes | **Semantic capability types** (not just data shapes) |
| MCP Tool Schema | Tool parameters | **Composition semantics** (chains-after, parallel-with) |
| OpenAPI | HTTP endpoint contracts | **AI-specific types** (context, cost, nondeterminism) |
| WIT (WASM) | Code module interfaces | **Agent capability interfaces** (not just function signatures) |
| OASF | Agent metadata fields | **Structural subtyping** with composition algebra |

## Roadmap

- [x] **v0.1** — Core data types, context types, structural subtyping
- [x] **v0.2** — types.json catalog, registry API, name-based compatibility, wired into effector-compose + effector-graph
- [ ] **v0.3** — Discovery protocol integration, substitutability queries
- [ ] **v0.4** — AI-powered type inference for untyped SKILL.md and MCP tools
- [ ] **v1.0** — Stable type system, community registry for domain types

## Contributing

We need domain experts. The standard library should reflect real-world agent usage patterns, not academic ideals.

- **Add a type**: Open a PR with the type definition and at least 3 real-world examples of capabilities that use it
- **Report a gap**: If you're building an Effector and no existing type fits, open an issue
- **Improve inference**: Help us build the AI-powered type inference engine

## License

[MIT](./LICENSE)

---

<sub>Part of the <a href="https://github.com/effectorHQ">effectorHQ</a> studio. We build hands for AI that moves first.</sub>
