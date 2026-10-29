import { readFile } from 'node:fs/promises';
import assert from 'node:assert/strict';
import test from 'node:test';
import ts from 'typescript';

const audienceSource = await readFile(new URL('../src/lib/audience.ts', import.meta.url), 'utf8');
const audienceCode = ts.transpileModule(audienceSource, {
  compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
}).outputText;
const audienceModuleUrl = `data:text/javascript;base64,${Buffer.from(audienceCode).toString('base64')}`;
const { normalizeAudienceFilter, normalizeProductAudience, matchesAudience, audienceLabel } = await import(audienceModuleUrl);
const source = (await readFile(new URL('../src/lib/api.ts', import.meta.url), 'utf8')).replace('"@/lib/audience"', JSON.stringify(audienceModuleUrl));
const { outputText } = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
});
const { normalizeTrend, normalizeProduct, getTrends } = await import(`data:text/javascript;base64,${Buffer.from(outputText).toString('base64')}`);

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

test('Wix listing thumbnails yield to the clearer copy of the same photo', () => {
  const asset = 'https://static.wixstatic.com/media/front~mv2.jpg';
  const thumb = asset + '/v1/fill/w_275,h_275,al_c,q_80/front.jpg';
  const clear = asset + '/v1/fit/w_500,h_500,q_90/file.jpg';
  const back = 'https://static.wixstatic.com/media/back~mv2.jpg/v1/fit/w_500,h_500,q_90/file.jpg';
  const product = normalizeProduct({ imageUrl: thumb, imageUrls: [thumb, clear, back] });
  assert.equal(product.imageUrl, clear);
  assert.deepEqual(product.imageUrls, [clear, back]);
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

test('unknown and missing product audiences default to unisex and appear in both fits', () => {
  for (const audience of ['MEN', 'WOMEN', 'UNISEX', 'UNKNOWN', '', 'not-a-fit', null, undefined]) {
    assert.equal(matchesAudience(audience, 'ALL'), true);
    assert.equal(matchesAudience(audience, 'MEN'), audience !== 'WOMEN');
    assert.equal(matchesAudience(audience, 'WOMEN'), audience !== 'MEN');
    if (audience !== 'MEN' && audience !== 'WOMEN') assert.equal(audienceLabel(audience), 'Unisex');
  }
  assert.equal(normalizeAudienceFilter('women'), 'WOMEN');
  assert.equal(normalizeAudienceFilter('UNISEX'), 'ALL');
  assert.equal(normalizeAudienceFilter('not-a-fit'), 'ALL');
  assert.equal(normalizeProductAudience(' women '), 'WOMEN');
  assert.equal(normalizeProductAudience(''), 'UNISEX');
  assert.equal(normalizeProduct({ title: 'Oversized tee' }).audience, 'UNISEX');
});

test('audience travels with pagination and an older API cannot mix filtered products', async () => {
  const originalFetch = globalThis.fetch;
  const requests = [];
  globalThis.fetch = async (url) => {
    requests.push(new URL(url));
    return { ok: true, json: async () => ['MEN', 'WOMEN', 'UNISEX', undefined].map((audience, index) => ({ id: `${index}`, signalProducts: { underdog: { title: `Fit ${index}`, audience } } })) };
  };
  try {
    const filtered = await getTrends('jeans', 12, undefined, 2, 'WOMEN');
    assert.deepEqual(filtered.map((trend) => trend.products.underdog.audience), ['WOMEN', 'UNISEX', 'UNISEX']);
    assert.equal(requests[0].searchParams.get('audience'), 'WOMEN');
    assert.equal(requests[0].searchParams.get('page'), '2');
    assert.equal((await getTrends('jeans')).length, 4);
    assert.equal(requests[1].searchParams.has('audience'), false);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

 test('a thumbnail preceding its Shopify original cannot become the cover', () => {
  const small = 'https://brand.in/cdn/shop/files/front_150x.jpg?v=12&width=150';
  const clear = 'https://cdn.shopify.com/s/files/1/0750/2685/8234/files/front.jpg?v=12&width=1600';
  const back = 'https://brand.in/cdn/shop/files/back.jpg?v=12';
  const result = normalizeProduct({imageUrl:small,imageUrls:[small,back,clear]});
  assert.equal(result.imageUrl, clear);
  assert.deepEqual(result.imageUrls, [clear,back]);
});
