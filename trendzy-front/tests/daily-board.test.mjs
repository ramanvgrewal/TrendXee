import { readFile } from 'node:fs/promises';
import test from 'node:test';
import assert from 'node:assert/strict';
import ts from 'typescript';
const source = await readFile(new URL('../src/lib/daily-board.ts', import.meta.url), 'utf8');
const code = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } }).outputText;
const { buildDailyBoard, indiaDateKey, untilNextIndiaDay } = await import(`data:text/javascript;base64,${Buffer.from(code).toString('base64')}`);

function catalog() {
  return Object.fromEntries(['tees', 'jeans', 'shoes'].map(category => [category, Array.from({ length: 15 }, (_, n) => ({
    id: `${category}-${String(n).padStart(2, '0')}`, category, title: `${category} ${n}`,
    image: `https://images.example/${category}-${n}.jpg`, shopUrl: `https://brand.example/products/${category}-${n}`,
  }))]));
}

test('India midnight determines both the day and next refresh time independently of host timezone', () => {
  assert.equal(indiaDateKey(new Date('2026-10-26T18:29:59.000Z')), '2026-10-26');
  assert.equal(untilNextIndiaDay(new Date('2026-10-26T18:29:59.000Z')), 1000);
  assert.equal(indiaDateKey(new Date('2026-10-26T18:30:00.000Z')), '2026-10-27');
  assert.equal(untilNextIndiaDay(new Date('2026-10-26T18:30:00.000Z')), 86400000);
});

test('the hero changes on consecutive days while the board stays stable within each day', () => {
  const map = catalog(); const before = JSON.stringify(map); let previous;
  for (let day = 1; day <= 30; day++) {
    const key = `2026-10-${String(day).padStart(2, '0')}`;
    const board = buildDailyBoard(map, key);
    assert.deepEqual(board, buildDailyBoard(map, key));
    assert.deepEqual(board, buildDailyBoard(Object.fromEntries(Object.entries(map).reverse()), key));
    assert.notEqual(board.lead.id, previous); previous = board.lead.id;
    const ids = [board.lead, ...board.dailyFive, ...board.story].filter(Boolean).map(item => item.id);
    assert.equal(new Set(ids).size, ids.length);
    assert.equal(board.dailyFive.length, 5);
  }
  assert.equal(JSON.stringify(map), before);
});

test('the daily board can feature products beyond the old first-five cut-off', () => {
  const map = catalog();
  const leads = Array.from({ length: 30 }, (_, n) => buildDailyBoard(map, `2026-10-${String(n + 1).padStart(2, '0')}`).lead);
  assert.ok(leads.some(item => Number(item.id.slice(-2)) >= 5));
});

test('empty and small catalogs stay valid and duplicate product aliases never repeat', () => {
  assert.equal(buildDailyBoard({}, '2026-10-26').lead, undefined);
  assert.deepEqual(buildDailyBoard({}, '2026-10-26').dailyFive, []);
  const item = catalog().tees[0];
  const alias = { ...item, id: 'alias', shopUrl: item.shopUrl.replace('/products/', '/collections/tees/products/') + '?variant=123' };
  const board = buildDailyBoard({ tees: [item, alias] }, '2026-10-26');
  assert.ok(board.lead); assert.equal(board.dailyFive.length, 0);
});

test('rising today takes the best unfeatured drop from every lane, best first, without repeats', () => {
  const map = catalog();
  for (const [lane, items] of Object.entries(map)) items.forEach((item, n) => { item.score = 50 + n + lane.length; });
  const board = buildDailyBoard(map, '2026-10-26');
  const featured = new Set([board.lead, ...board.dailyFive].map(item => item.id));
  assert.equal(board.rising.length, 8);
  assert.ok(board.rising.every(item => !featured.has(item.id)));
  assert.equal(new Set(board.rising.map(item => item.id)).size, 8);
  assert.deepEqual(board.rising.map(item => item.score), board.rising.map(item => item.score).sort((a, b) => b - a));
  for (const lane of Object.keys(map)) {
    const best = map[lane].filter(item => !featured.has(item.id)).sort((a, b) => b.score - a.score)[0];
    assert.ok(board.rising.some(item => item.id === best.id));
  }
  assert.ok(board.story.every(item => !board.rising.some(pick => pick.id === item.id)));
  assert.deepEqual(buildDailyBoard({}, '2026-10-26').rising, []);
});

test('rising today prefers a label that is not on the row yet', () => {
  const item = (lane, n, brand, score) => ({ id: `${lane}-${n}`, category: lane, brand, score, title: `${lane} ${n}`,
    image: `https://images.example/${lane}-${n}.jpg`, shopUrl: `https://${lane}.example/products/${n}` });
  const map = Object.fromEntries(['a', 'b', 'c', 'd'].map(lane => [lane, [item(lane, 0, 'Big Label', 99), item(lane, 1, `${lane} studio`, 90), item(lane, 2, 'Big Label', 80)]]));
  const { rising } = buildDailyBoard(map, '2026-10-26');
  const first = rising.filter(pick => pick.score >= 90);
  assert.equal(first.filter(pick => pick.brand === 'Big Label').length <= 1, true);
  assert.equal(new Set(rising.map(pick => pick.id)).size, rising.length);
});
