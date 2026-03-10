import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

// Test the structural subtyping logic directly (pure JS, no TS compile needed)
function isStructuralSubtype(a, b) {
  for (const key of Object.keys(b)) {
    if (!(key in a)) return false;
    if (typeof a[key] !== typeof b[key]) return false;
    if (typeof b[key] === 'object' && b[key] !== null && a[key] !== null) {
      if (!isStructuralSubtype(a[key], b[key])) return false;
    }
  }
  return true;
}

function canCompose(a, b) {
  const errors = [];
  if (!a.interface?.output || !b.interface?.input) {
    errors.push('Both capabilities must declare input/output types');
    return { valid: false, errors };
  }
  if (!isStructuralSubtype(a.interface.output, b.interface.input)) {
    errors.push(`Output type of "${a.name}" is not compatible with input type of "${b.name}"`);
  }
  return { valid: errors.length === 0, errors };
}

describe('isStructuralSubtype', () => {
  it('returns true for identical types', () => {
    const type = { code: 'string', language: 'string' };
    assert.equal(isStructuralSubtype(type, type), true);
  });

  it('returns true when A has more fields than B (supertype)', () => {
    const a = { code: 'string', language: 'string', path: 'string' };
    const b = { code: 'string', language: 'string' };
    assert.equal(isStructuralSubtype(a, b), true);
  });

  it('returns false when A is missing fields from B', () => {
    const a = { code: 'string' };
    const b = { code: 'string', language: 'string' };
    assert.equal(isStructuralSubtype(a, b), false);
  });

  it('returns false for type mismatches', () => {
    const a = { code: 'string', count: 'string' };
    const b = { code: 'string', count: 42 };
    assert.equal(isStructuralSubtype(a, b), false);
  });

  it('handles nested objects', () => {
    const a = { report: { findings: [], severity: 'high', extra: true } };
    const b = { report: { findings: [], severity: 'high' } };
    assert.equal(isStructuralSubtype(a, b), true);
  });

  it('SecurityReport is subtype of ReviewReport shape', () => {
    const securityReport = {
      vulnerabilities: [],
      riskLevel: 'high',
      summary: 'text',
      findings: [],
      severity: 'high',
    };
    const reviewReportShape = {
      findings: [],
      severity: 'high',
      summary: 'text',
    };
    assert.equal(isStructuralSubtype(securityReport, reviewReportShape), true);
  });
});

describe('canCompose', () => {
  it('allows composition when output matches input', () => {
    const codeReview = {
      name: 'code-review',
      interface: {
        input: { files: [], baseBranch: 'main' },
        output: { findings: [], severity: 'high', summary: 'ok' },
      },
    };
    const mergeDecision = {
      name: 'merge-decision',
      interface: {
        input: { findings: [], severity: 'high', summary: 'ok' },
        output: { decision: 'approve' },
      },
    };
    const result = canCompose(codeReview, mergeDecision);
    assert.equal(result.valid, true);
    assert.equal(result.errors.length, 0);
  });

  it('rejects composition when output does not match input', () => {
    const codeReview = {
      name: 'code-review',
      interface: {
        input: { files: [] },
        output: { findings: [], severity: 'high' },
      },
    };
    const imageProcessor = {
      name: 'image-processor',
      interface: {
        input: { images: [], mimeType: 'image/png' },
        output: { processed: true },
      },
    };
    const result = canCompose(codeReview, imageProcessor);
    assert.equal(result.valid, false);
    assert.ok(result.errors[0].includes('not compatible'));
  });

  it('rejects when interface is missing', () => {
    const a = { name: 'a', interface: { input: {}, output: null } };
    const b = { name: 'b', interface: { input: {}, output: {} } };
    const result = canCompose(a, b);
    assert.equal(result.valid, false);
  });
});
