import { readFile } from 'node:fs/promises';
import test from 'node:test';
import assert from 'node:assert/strict';
import ts from 'typescript';

async function loadModule(path, replacements = {}) {
  let source = await readFile(new URL(path, import.meta.url), 'utf8');
  for (const [from, to] of Object.entries(replacements)) source = source.replaceAll(from, to);
  const code = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } }).outputText;
  return `data:text/javascript;base64,${Buffer.from(code).toString('base64')}`;
}
const { normalizeLaneFilters, normalizeLanePage, lanePageItems } = await import(await loadModule('../src/lib/lane-filters.ts'));
const audienceUrl = await loadModule('../src/lib/audience.ts');
const { getCatalogPage } = await import(await loadModule('../src/lib/api.ts', { '"@/lib/audience"': JSON.stringify(audienceUrl) }));
const state = await import(await loadModule('../src/lib/catalog-state.ts'));

test('failed lane requests remain reloadable without losing the last known style choices', () => {
  const filters = { style: 'washed' };
  state.rememberStyles('tees', [{ id: 'washed', label: 'Washed & vintage' }]);
  state.markCatalogFailure('tees', 'ALL', filters, true);
  assert.equal(state.hasCatalogFailure('tees', 'ALL', filters), true);
  assert.equal(state.hasCatalogFailure('tees', 'MEN', filters), false);
  assert.equal(state.hasCatalogFailure('tees', 'ALL', { ...filters, page: 2 }), false);
  state.rememberStyles('tees', []);
  assert.deepEqual(state.cachedStyles('tees'), [{ id: 'washed', label: 'Washed & vintage' }]);
  state.markCatalogFailure('tees', 'ALL', filters, false);
  assert.equal(state.hasCatalogFailure('tees', 'ALL', filters), false);
});

test('page URLs reject invalid values and keep pagination compact for large lanes', () => {
  for (const value of [undefined, null, [], {}, 0, -1, '0', '2.5', 2.5, Infinity, '1e2', 100001, '100001']) assert.equal(normalizeLanePage(value), 1);
  for (const value of [2, '2', 100000, '100000']) assert.equal(normalizeLanePage(value), Number(value));
  assert.deepEqual(lanePageItems(2, 4), [1, 2, 3, 4]);
  assert.deepEqual(lanePageItems(50, 100), [1, 'gap', 49, 50, 51, 'gap', 100]);
  assert.deepEqual(lanePageItems(1, 1), [1]);
  assert.deepEqual(lanePageItems(1, 0), []);
});

test('catalog retries a temporary failure but not an invalid style', async () => {
  const previousFetch = globalThis.fetch;
  let calls = 0;
  globalThis.fetch = async () => ++calls === 1 ? new Response('', { status: 503 }) : new Response(JSON.stringify({ content: [], styles: [] }));
  try {
    await getCatalogPage('tees', 12, 0, 'ALL', { style: 'washed' });
    assert.equal(calls, 2);
    calls = 0;
    globalThis.fetch = async () => { calls++; return new Response('', { status: 400 }); };
    await assert.rejects(() => getCatalogPage('tees', 12, 0, 'ALL', { style: 'bad' }), (error) => error.status === 400);
    assert.equal(calls, 1);
  } finally { globalThis.fetch = previousFetch; }
});

test('retired price and raw style URLs cannot invisibly filter the lane', () => {
  assert.deepEqual(normalizeLaneFilters({ price: 'under-1000', subcategory: "Women's Baggy-Fit Jeans" }), {});
  assert.deepEqual(normalizeLaneFilters({ style: ['baggy'] }), {});
  assert.deepEqual(normalizeLaneFilters({ style: 'anything.*' }), {});
  assert.deepEqual(normalizeLaneFilters({ style: ' baggy ' }), { style: 'baggy' });
});

test('grouped style and fit stay on subsequent pages without a price filter', async () => {
  const previousFetch = globalThis.fetch;
  globalThis.fetch = async (url) => {
    const params = new URL(url, 'http://localhost').searchParams;
    for (const [key, value] of Object.entries({ category: 'jeans', page: '2', size: '12', audience: 'WOMEN', style: 'baggy', includeFilters: 'true' })) assert.equal(params.get(key), value);
    for (const key of ['subcategory', 'minPrice', 'maxPrice']) assert.equal(params.has(key), false);
    return new Response(JSON.stringify({ content: [{ id: 'unisex', category: 'JEANS', signalProducts: { underdog: { audience: 'UNKNOWN' } } }], totalElements: 25, hasMore: false, styles: [{ id: 'baggy', label: 'Baggy & wide-leg' }, null] }));
  };
  try {
    const page = await getCatalogPage('jeans', 12, 2, 'WOMEN', { style: 'baggy' });
    assert.equal(page.trends.length, 1);
    assert.equal(page.total, 25);
    assert.equal(page.hasMore, false);
    assert.deepEqual(page.styles, [{ id: 'baggy', label: 'Baggy & wide-leg' }]);
  } finally { globalThis.fetch = previousFetch; }
});
