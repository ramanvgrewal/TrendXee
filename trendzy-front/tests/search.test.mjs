import { readFile } from 'node:fs/promises';
import test from 'node:test';
import assert from 'node:assert/strict';
import ts from 'typescript';

const source = (await readFile(new URL('../src/lib/search.ts', import.meta.url), 'utf8')).replace(/^import .*@\/lib\/api.*$/m,
  'const apiUrl = p => "https://api.test" + p; class CatalogRequestError extends Error { constructor(status) { super(); this.status = status; } } const normalizeTrendList = d => d.content;');
const js = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } }).outputText;
const { normalizeSearchQuery, isSearchable, styleTarget, searchQuery } = await import(`data:text/javascript;base64,${Buffer.from(js).toString('base64')}`);

test('queries are trimmed, bounded and survive numeric URL parsing', () => {
  assert.equal(normalizeSearchQuery('  baggy   jeans '), 'baggy jeans');
  assert.equal(normalizeSearchQuery(710), '710');
  assert.equal(normalizeSearchQuery({}), '');
  assert.equal(normalizeSearchQuery('a'.repeat(200)).length, 80);
  assert.equal(isSearchable('a'), false);
  assert.equal(searchQuery('a', 'ALL').enabled, false);
});
test('a style opens its collection and a lane-wide match opens the lane', () => {
  assert.deepEqual(styleTarget({ category: 'JEANS', label: 'Baggy Jeans', count: 1 }), { id: 'jeans', collection: 'Baggy Jeans' });
  assert.deepEqual(styleTarget({ category: 'SNEAKERS', label: null, count: 1 }), { id: 'sneakers', collection: undefined });
});
test('requests use zero-based pages and client errors are not retried', async t => {
  let url;
  t.mock.method(globalThis, 'fetch', async u => { url = new URL(u); return { ok: true, json: async () => ({ content: [], totalElements: 3 }) }; });
  const options = searchQuery('t-shirt & tee', 'MEN', 2);
  const result = await options.queryFn({ signal: new AbortController().signal });
  assert.equal(url.searchParams.get('q'), 't-shirt & tee');
  assert.equal(url.searchParams.get('page'), '1');
  assert.deepEqual(result, { brands: [], styles: [], trends: [], total: 3 });
  t.mock.method(globalThis, 'fetch', async () => ({ ok: false, status: 429 }));
  const error = await options.queryFn({ signal: new AbortController().signal }).catch(e => e);
  assert.equal(options.retry(0, error), false);
  assert.equal(options.retry(0, new Error('network')), true);
  assert.equal(options.retry(1, new Error('network')), false);
});
