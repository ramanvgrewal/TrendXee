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
    mainstream: { image: 'https://images.example/lookalike.jpg' },
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
    const ids = [board.lead, ...board.dailyFive, ...board.story, board.underdog].filter(Boolean).map(item => item.id);
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
