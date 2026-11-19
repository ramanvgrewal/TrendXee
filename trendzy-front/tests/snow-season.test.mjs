import { readFile } from 'node:fs/promises';
import test from 'node:test';
import assert from 'node:assert/strict';
import ts from 'typescript';
const source = await readFile(new URL('../src/lib/snow-season.ts', import.meta.url), 'utf8');
const code = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } }).outputText;
const { isSnowSeason } = await import(`data:text/javascript;base64,${Buffer.from(code).toString('base64')}`);

test('snow falls from 15 November through February, India time', () => {
  assert.equal(isSnowSeason(new Date('2026-11-14T12:00:00+05:30')), false);
  assert.equal(isSnowSeason(new Date('2026-11-15T00:00:00+05:30')), true);
  assert.equal(isSnowSeason(new Date('2026-12-25T12:00:00+05:30')), true);
  assert.equal(isSnowSeason(new Date('2027-01-31T12:00:00+05:30')), true);
  assert.equal(isSnowSeason(new Date('2028-02-29T23:59:00+05:30')), true);
  assert.equal(isSnowSeason(new Date('2027-03-01T00:00:00+05:30')), false);
  assert.equal(isSnowSeason(new Date('2027-07-10T12:00:00+05:30')), false);
});

test('season edges follow the India date, not UTC', () => {
  // 14 Nov 19:00 UTC is already 15 Nov 00:30 in India.
  assert.equal(isSnowSeason(new Date('2026-11-14T19:00:00Z')), true);
  // 28 Feb 19:00 UTC is already 1 Mar 00:30 in India.
  assert.equal(isSnowSeason(new Date('2027-02-28T19:00:00Z')), false);
});
