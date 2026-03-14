import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const catalog = JSON.parse(readFileSync(join(__dirname, '..', 'types.json'), 'utf-8'));

// ─── Helpers (pure JS reimplementation of registry.ts logic) ─────

function getKnownTypes() {
  const types = new Set();
  for (const role of ['input', 'output', 'context']) {
    for (const [name, def] of Object.entries(catalog.types[role])) {
      types.add(name);
      if (def.aliases) {
        for (const alias of def.aliases) types.add(alias);
      }
    }
  }
  return types;
}

function isKnownType(name) {
  return getKnownTypes().has(name);
}

function getTypeRole(name) {
  const roles = [];
  for (const role of ['input', 'output', 'context']) {
    if (name in catalog.types[role]) {
      roles.push(role);
      continue;
    }
    for (const def of Object.values(catalog.types[role])) {
      if (def.aliases?.includes(name)) {
        roles.push(role);
        break;
      }
    }
  }
  if (roles.length === 0) return 'unknown';
  if (roles.length === 1) return roles[0];
  return 'both';
}

function getTypeFields(name) {
  for (const role of ['input', 'output', 'context']) {
    const typeDef = catalog.types[role][name];
    if (typeDef) {
      return { required: typeDef.fields.required, optional: typeDef.fields.optional || [] };
    }
    for (const def of Object.values(catalog.types[role])) {
      if (def.aliases?.includes(name)) {
        return { required: def.fields.required, optional: def.fields.optional || [] };
      }
    }
  }
  return null;
}

function getSubtypes(name) {
  return catalog.subtypeRelations
    .filter(r => r.supertype === name)
    .map(r => r.subtype);
}

function getSupertypes(name) {
  return catalog.subtypeRelations
    .filter(r => r.subtype === name)
    .map(r => r.supertype);
}

function resolveAlias(name) {
  for (const role of ['input', 'output', 'context']) {
    if (name in catalog.types[role]) return name;
    for (const [canonical, def] of Object.entries(catalog.types[role])) {
      if (def.aliases?.includes(name)) return canonical;
    }
  }
  return name;
}

function isNameCompatible(outputType, inputType) {
  if (outputType === inputType) return true;
  const outputCanonical = resolveAlias(outputType);
  const inputCanonical = resolveAlias(inputType);
  if (outputCanonical === inputCanonical) return true;
  const supertypes = getSupertypes(outputCanonical);
  if (supertypes.includes(inputCanonical)) return true;
  if (inputType.includes('*')) {
    const pattern = inputType.replace('*', '');
    if (outputType.includes(pattern)) return true;
  }
  return false;
}

// ─── Tests ───────────────────────────────────────────────────────

describe('types.json catalog integrity', () => {
  it('has expected version', () => {
    assert.equal(catalog.version, '0.2.0');
  });

  it('has input, output, and context categories', () => {
    assert.ok(catalog.types.input);
    assert.ok(catalog.types.output);
    assert.ok(catalog.types.context);
  });

  it('has at least 10 input types', () => {
    assert.ok(Object.keys(catalog.types.input).length >= 10);
  });

  it('has at least 10 output types', () => {
    assert.ok(Object.keys(catalog.types.output).length >= 10);
  });

  it('has at least 10 context types', () => {
    assert.ok(Object.keys(catalog.types.context).length >= 10);
  });

  it('has subtype relations', () => {
    assert.ok(Array.isArray(catalog.subtypeRelations));
    assert.ok(catalog.subtypeRelations.length >= 2);
  });

  it('every type has required fields: category, fields, description', () => {
    for (const role of ['input', 'output', 'context']) {
      for (const [name, def] of Object.entries(catalog.types[role])) {
        assert.ok(def.category, `${name} missing category`);
        assert.ok(def.fields, `${name} missing fields`);
        assert.ok(Array.isArray(def.fields.required), `${name} missing fields.required`);
        assert.ok(def.description, `${name} missing description`);
      }
    }
  });
});

describe('isKnownType', () => {
  it('returns true for standard input types', () => {
    assert.equal(isKnownType('CodeDiff'), true);
    assert.equal(isKnownType('String'), true);
    assert.equal(isKnownType('URL'), true);
    assert.equal(isKnownType('RepositoryRef'), true);
  });

  it('returns true for standard output types', () => {
    assert.equal(isKnownType('Markdown'), true);
    assert.equal(isKnownType('ReviewReport'), true);
    assert.equal(isKnownType('SecurityReport'), true);
    assert.equal(isKnownType('Notification'), true);
  });

  it('returns true for standard context types', () => {
    assert.equal(isKnownType('GitHubCredentials'), true);
    assert.equal(isKnownType('Docker'), true);
    assert.equal(isKnownType('Kubernetes'), true);
  });

  it('returns true for aliases', () => {
    assert.equal(isKnownType('PlainText'), true);  // alias for String
  });

  it('returns false for unknown types', () => {
    assert.equal(isKnownType('FooBarBaz'), false);
    assert.equal(isKnownType('NonExistentType'), false);
    assert.equal(isKnownType(''), false);
  });
});

describe('getTypeRole', () => {
  it('identifies input-only types', () => {
    assert.equal(getTypeRole('CodeDiff'), 'input');
    assert.equal(getTypeRole('FilePath'), 'input');
    assert.equal(getTypeRole('RepositoryRef'), 'input');
  });

  it('identifies output-only types', () => {
    assert.equal(getTypeRole('ReviewReport'), 'output');
    assert.equal(getTypeRole('Notification'), 'output');
  });

  it('identifies context-only types', () => {
    assert.equal(getTypeRole('GitHubCredentials'), 'context');
    assert.equal(getTypeRole('Docker'), 'context');
    assert.equal(getTypeRole('Kubernetes'), 'context');
  });

  it('identifies types that span multiple roles as "both"', () => {
    // JSON and String appear in both input and output
    assert.equal(getTypeRole('JSON'), 'both');
    assert.equal(getTypeRole('String'), 'both');
  });

  it('returns "unknown" for non-existent types', () => {
    assert.equal(getTypeRole('FooBarBaz'), 'unknown');
  });
});

describe('getTypeFields', () => {
  it('returns fields for known types', () => {
    const fields = getTypeFields('CodeDiff');
    assert.ok(fields);
    assert.ok(fields.required.includes('files'));
  });

  it('returns fields for context types', () => {
    const fields = getTypeFields('GitHubCredentials');
    assert.ok(fields);
    assert.ok(fields.required.includes('tokenEnvVar'));
  });

  it('returns null for unknown types', () => {
    assert.equal(getTypeFields('FooBarBaz'), null);
  });

  it('resolves aliases to canonical type fields', () => {
    const fields = getTypeFields('PlainText');
    assert.ok(fields);
    assert.ok(fields.required.includes('text')); // Same as String
  });
});

describe('getSubtypes / getSupertypes', () => {
  it('SecurityReport is a subtype of ReviewReport', () => {
    const subtypes = getSubtypes('ReviewReport');
    assert.ok(subtypes.includes('SecurityReport'));
  });

  it('SlackMessage is a subtype of Notification', () => {
    const subtypes = getSubtypes('Notification');
    assert.ok(subtypes.includes('SlackMessage'));
  });

  it('SecurityReport has ReviewReport as supertype', () => {
    const supertypes = getSupertypes('SecurityReport');
    assert.ok(supertypes.includes('ReviewReport'));
  });

  it('returns empty for types with no subtypes', () => {
    const subtypes = getSubtypes('CodeDiff');
    assert.equal(subtypes.length, 0);
  });
});

describe('isNameCompatible', () => {
  it('exact match is compatible', () => {
    assert.equal(isNameCompatible('Markdown', 'Markdown'), true);
    assert.equal(isNameCompatible('CodeDiff', 'CodeDiff'), true);
    assert.equal(isNameCompatible('JSON', 'JSON'), true);
  });

  it('subtype output is compatible with supertype input', () => {
    assert.equal(isNameCompatible('SecurityReport', 'ReviewReport'), true);
    assert.equal(isNameCompatible('SlackMessage', 'Notification'), true);
  });

  it('supertype output is NOT compatible with subtype input', () => {
    assert.equal(isNameCompatible('ReviewReport', 'SecurityReport'), false);
    assert.equal(isNameCompatible('Notification', 'SlackMessage'), false);
  });

  it('unrelated types are not compatible', () => {
    assert.equal(isNameCompatible('JSON', 'CodeDiff'), false);
    assert.equal(isNameCompatible('Markdown', 'Docker'), false);
    assert.equal(isNameCompatible('String', 'GitHubCredentials'), false);
  });

  it('alias compatibility works', () => {
    // PlainText is alias for String
    assert.equal(isNameCompatible('PlainText', 'String'), true);
    assert.equal(isNameCompatible('String', 'PlainText'), true);
  });

  it('wildcard matching works', () => {
    assert.equal(isNameCompatible('ReviewReport', '*Report'), true);
    assert.equal(isNameCompatible('SecurityReport', '*Report'), true);
    assert.equal(isNameCompatible('Markdown', '*Report'), false);
  });
});
