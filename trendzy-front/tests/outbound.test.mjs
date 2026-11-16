import { readFile } from 'node:fs/promises';
import test from 'node:test';
import assert from 'node:assert/strict';
import ts from 'typescript';
const source = await readFile(new URL('../src/lib/outbound.ts', import.meta.url), 'utf8');
const code = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } }).outputText;
const { retailerHref } = await import(`data:text/javascript;base64,${Buffer.from(code).toString('base64')}`);

test('retailer links carry TrendXee referral tags and keep existing product query values', () => {
  const href = new URL(retailerHref('https://brand.example/products/tee?variant=42'));
  assert.equal(href.pathname, '/products/tee');
  assert.equal(href.searchParams.get('variant'), '42');
  assert.equal(href.searchParams.get('utm_source'), 'trendxee');
  assert.equal(href.searchParams.get('utm_medium'), 'referral');
});

test('existing campaign tags and non-web or invalid links are left alone', () => {
  assert.equal(retailerHref('https://brand.example/p?utm_source=insta'), 'https://brand.example/p?utm_source=insta');
  assert.equal(retailerHref('mailto:hello@brand.example'), 'mailto:hello@brand.example');
  assert.equal(retailerHref('not a url'), 'not a url');
  assert.equal(retailerHref(''), '#');
});
