import { readFile } from 'node:fs/promises';
import assert from 'node:assert/strict';
import test from 'node:test';
import ts from 'typescript';

const source = await readFile(new URL('../src/lib/api.ts', import.meta.url), 'utf8');
const { outputText } = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
});
const { normalizeTrend, normalizeProduct } = await import(`data:text/javascript;base64,${Buffer.from(outputText).toString('base64')}`);

test('uncalculated Instagram hype cannot display a legacy score', () => {
  assert.equal(normalizeTrend({trendScore: 80}).trendScore, 0);
  assert.equal(normalizeTrend({trendScore: 85, brandHypeSignals: {followers: 100000}}).trendScore, 85);
});

test('selected product title takes precedence over a stale trend headline', () => {
  assert.equal(normalizeTrend({name: 'Bitter Black', signalProducts: {underdog: {title: 'Toofani Blue'}}}).name, 'Toofani Blue');
});

test('Shopify originals and storefront thumbnails appear only once without merging distinct photos', () => {
  const cover = 'https://cdn.shopify.com/s/files/1/0750/2685/8234/files/front.jpg?v=12';
  const back = 'https://brand.in/cdn/shop/files/back.jpg?v=12';
  const product = normalizeProduct({ imageUrl: cover, imageUrls: [
    cover, back, 'https://brand.in/cdn/shop/files/front.jpg?v=12&width=620',
    'https://brand.in/cdn/shop/files/front_150x.jpg?v=12&width=150',
    'https://brand.in/cdn/shop/files/back.jpg?width=150&v=12',
  ] });
  assert.deepEqual(product.imageUrls, [cover, back]);
  assert.equal(normalizeProduct({imageUrls: ['https://other/image?id=1', 'https://other/image?id=2']}).imageUrls.length, 2);
});

test('legacy single-image products still work', () => {
  const product = normalizeProduct({ imageUrl: 'https://store/front.jpg' });
  assert.deepEqual(product.imageUrls, ['https://store/front.jpg']);
});

test('gallery-only products acquire a cover and discard invalid entries', () => {
  const product = normalizeProduct({ imageUrls: [null, '//store/front.jpg', '//store/front.jpg', 'https://store/back.jpg', 'javascript:bad'] });
  assert.equal(product.imageUrl, 'https://store/front.jpg');
  assert.deepEqual(product.imageUrls, ['https://store/front.jpg', 'https://store/back.jpg']);
});

test('API category whitespace cannot hide a brand from a lane', () => {
  const trend = normalizeTrend({ id: 'veirdo', category: ' TEES ', signalProducts: { underdog: { imageUrls: ['https://store/front.jpg'] } } });
  assert.equal(trend.aestheticId, 'tees');
  assert.equal(trend.products.underdog.imageUrl, 'https://store/front.jpg');
});
