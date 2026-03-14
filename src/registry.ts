/**
 * Type Registry — Name-based type lookup and compatibility checking.
 *
 * This module operates on type NAMES (strings from effector.toml),
 * complementing isStructuralSubtype() which operates on object shapes.
 *
 * Usage:
 *   import { isKnownType, isNameCompatible, getTypeRole } from 'effector-types/registry';
 *
 *   isKnownType('CodeDiff')                    // true
 *   isKnownType('FooBar')                      // false
 *   getTypeRole('CodeDiff')                    // 'input'
 *   getTypeRole('JSON')                        // 'both'
 *   isNameCompatible('SecurityReport', 'ReviewReport')  // true (subtype)
 *   isNameCompatible('Markdown', 'Markdown')            // true (exact)
 *   isNameCompatible('JSON', 'CodeDiff')                // false
 */

import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

// ─── Type Catalog Loading ────────────────────────────────────

interface TypeDef {
  category: string;
  fields: { required: string[]; optional?: string[] };
  aliases?: string[];
  subtypeOf?: string[];
  frequency?: number;
  description: string;
}

interface TypeCatalog {
  version: string;
  types: {
    input: Record<string, TypeDef>;
    output: Record<string, TypeDef>;
    context: Record<string, TypeDef>;
  };
  subtypeRelations: Array<{
    subtype: string;
    supertype: string;
    reason: string;
  }>;
}

let _catalog: TypeCatalog | null = null;

function loadCatalog(): TypeCatalog {
  if (_catalog) return _catalog;

  const __dirname = dirname(fileURLToPath(import.meta.url));
  const typesJsonPath = join(__dirname, '..', 'types.json');
  _catalog = JSON.parse(readFileSync(typesJsonPath, 'utf-8')) as TypeCatalog;
  return _catalog;
}

// ─── Public API ──────────────────────────────────────────────

/**
 * Set of all known type names across input, output, and context roles.
 */
export function getKnownTypes(): Set<string> {
  const catalog = loadCatalog();
  const types = new Set<string>();

  for (const role of ['input', 'output', 'context'] as const) {
    for (const [name, def] of Object.entries(catalog.types[role])) {
      types.add(name);
      if (def.aliases) {
        for (const alias of def.aliases) types.add(alias);
      }
    }
  }

  return types;
}

/**
 * Check if a type name is in the effector-types standard library.
 */
export function isKnownType(name: string): boolean {
  return getKnownTypes().has(name);
}

/**
 * Get the role(s) a type can play.
 * Returns 'both' if the type appears in multiple roles (e.g., JSON is both input and output).
 */
export function getTypeRole(name: string): 'input' | 'output' | 'context' | 'both' | 'unknown' {
  const catalog = loadCatalog();
  const roles: string[] = [];

  for (const role of ['input', 'output', 'context'] as const) {
    if (name in catalog.types[role]) {
      roles.push(role);
    }
    // Check aliases
    for (const def of Object.values(catalog.types[role])) {
      if (def.aliases?.includes(name)) {
        roles.push(role);
        break;
      }
    }
  }

  if (roles.length === 0) return 'unknown';
  if (roles.length === 1) return roles[0] as 'input' | 'output' | 'context';
  return 'both';
}

/**
 * Get the field definitions for a type.
 */
export function getTypeFields(name: string): { required: string[]; optional: string[] } | null {
  const catalog = loadCatalog();

  for (const role of ['input', 'output', 'context'] as const) {
    const typeDef = catalog.types[role][name];
    if (typeDef) {
      return {
        required: typeDef.fields.required,
        optional: typeDef.fields.optional || [],
      };
    }
    // Check aliases
    for (const def of Object.values(catalog.types[role])) {
      if (def.aliases?.includes(name)) {
        return {
          required: def.fields.required,
          optional: def.fields.optional || [],
        };
      }
    }
  }

  return null;
}

/**
 * Get all types that are declared subtypes of the given type.
 */
export function getSubtypes(name: string): string[] {
  const catalog = loadCatalog();
  return catalog.subtypeRelations
    .filter(r => r.supertype === name)
    .map(r => r.subtype);
}

/**
 * Get all supertypes that the given type can be used in place of.
 */
export function getSupertypes(name: string): string[] {
  const catalog = loadCatalog();
  return catalog.subtypeRelations
    .filter(r => r.subtype === name)
    .map(r => r.supertype);
}

/**
 * Check if an output type name is compatible with an input type name.
 *
 * Compatibility rules (in order):
 * 1. Exact match: "CodeDiff" === "CodeDiff" → true
 * 2. Alias match: "PlainText" output matches "String" input → true
 * 3. Subtype relation: "SecurityReport" output matches "ReviewReport" input → true
 * 4. Wildcard: "*Report" matches "ReviewReport" → true
 * 5. Otherwise → false
 */
export function isNameCompatible(outputType: string, inputType: string): boolean {
  // 1. Exact match
  if (outputType === inputType) return true;

  const catalog = loadCatalog();

  // 2. Alias match — resolve both sides to canonical names
  const outputCanonical = resolveAlias(outputType, catalog);
  const inputCanonical = resolveAlias(inputType, catalog);
  if (outputCanonical === inputCanonical) return true;

  // 3. Subtype relation — output is a subtype of input
  const supertypes = getSupertypes(outputCanonical);
  if (supertypes.includes(inputCanonical)) return true;

  // 4. Wildcard matching
  if (inputType.includes('*')) {
    const pattern = inputType.replace('*', '');
    if (outputType.includes(pattern)) return true;
  }

  return false;
}

/**
 * Resolve a type alias to its canonical name.
 * e.g., "PlainText" → "String", "MarkdownReport" → "Markdown"
 */
function resolveAlias(name: string, catalog: TypeCatalog): string {
  for (const role of ['input', 'output', 'context'] as const) {
    // Check if it's already a canonical name
    if (name in catalog.types[role]) return name;

    // Check aliases
    for (const [canonical, def] of Object.entries(catalog.types[role])) {
      if (def.aliases?.includes(name)) return canonical;
    }
  }

  return name; // Return as-is if not found
}
