const sanitizeYaml = require('./sanitizeYaml');

test('normaliza espacios y tabs', () => {
  const raw = 'foo:bar  \r\nbaz:qux\t';
  expect(sanitizeYaml(raw)).toBe('foo: bar\nbaz: qux');
});

test('normaliza listas', () => {
  const raw = '-   uno\n-  dos\n';
  expect(sanitizeYaml(raw)).toBe('- uno\n- dos\n');
});

test('reindenta hijos de lista', () => {
  const raw = '- item\n key:val\n';
  expect(sanitizeYaml(raw)).toBe('- item\n  key: val\n');
});
