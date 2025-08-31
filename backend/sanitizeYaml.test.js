const test = require('node:test');
const assert = require('node:assert/strict');
const sanitizeYaml = require('./sanitizeYaml');

test('normaliza espacios y tabs', () => {
  const raw = 'foo:bar  \r\nbaz:qux\t';
  assert.strictEqual(sanitizeYaml(raw), 'foo: bar\nbaz: qux');
});

test('normaliza listas', () => {
  const raw = '-   uno\n-  dos\n';
  assert.strictEqual(sanitizeYaml(raw), '- uno\n- dos\n');
});

test('reindenta hijos de lista', () => {
  const raw = '- item\n key:val\n';
  assert.strictEqual(sanitizeYaml(raw), '- item\n  key: val\n');
});
