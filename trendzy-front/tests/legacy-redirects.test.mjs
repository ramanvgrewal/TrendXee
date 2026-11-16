import { readFile } from 'node:fs/promises';
import test from 'node:test';
import assert from 'node:assert/strict';
import ts from 'typescript';

const encode = source => `data:text/javascript;base64,${Buffer.from(ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
}).outputText).toString('base64')}`;
const seoUrl = encode(await readFile(new URL('../src/lib/seo.ts', import.meta.url), 'utf8'));
const redirectSource = await readFile(new URL('../src/lib/redirects.ts', import.meta.url), 'utf8');
const { permanentRedirect } = await import(encode(redirectSource.replace('"./seo"', JSON.stringify(seoUrl))));

test('old Search Console category URLs resolve to their renamed lanes without losing links or attribution', () => {
  assert.equal(
    permanentRedirect('https://trendxee.com/aesthetic/upper/?page=2&utm_source=launch&trend=old-drop'),
    'https://www.trendxee.com/aesthetic/tees?page=2&utm_source=launch&trend=old-drop',
  );
  assert.equal(
    permanentRedirect('https://www.trendxee.com/aesthetic/upper', 'HEAD'),
    'https://www.trendxee.com/aesthetic/tees',
  );
  assert.equal(
    permanentRedirect('https://trendxee.com/aesthetic/accessories'),
    'https://www.trendxee.com/aesthetic/caps',
  );
  assert.equal(permanentRedirect('https://www.trendxee.com/aesthetic/tees'), undefined);
});

test('invalid category templates and unrelated hosts do not get redirected into indexed catalog pages', () => {
  assert.equal(permanentRedirect('https://www.trendxee.com/aesthetic/$id'), undefined);
  assert.equal(permanentRedirect('https://www.trendxee.com/aesthetic/not-a-lane'), undefined);
  assert.equal(permanentRedirect('https://auth.trendxee.com/'), undefined);
  assert.equal(permanentRedirect('https://www.trendxee.com/aesthetic/upper', 'POST'), undefined);
});

test('retired subcategory links 301 to their merged, renamed or moved subcategory', () => {
  const cases = [
    ['/aesthetic/bottoms?collection=Parachute+Pants', '/aesthetic/bottoms?collection=Cargo+%26+Parachute+Pants'],
    ['/aesthetic/bottoms?collection=Cargo+Pants', '/aesthetic/bottoms?collection=Cargo+%26+Parachute+Pants'],
    ['/aesthetic/bottoms?collection=Joggers', '/aesthetic/bottoms?collection=Joggers+%26+Sweatpants'],
    ['/aesthetic/bottoms?collection=Sweatpants', '/aesthetic/bottoms?collection=Joggers+%26+Sweatpants'],
    ['/aesthetic/bottoms?collection=Shorts', '/aesthetic/bottoms?collection=Shorts+%26+Jorts'],
    ['/aesthetic/sportswear?collection=Sports+Shorts', '/aesthetic/bottoms?collection=Shorts+%26+Jorts'],
    ['/aesthetic/sportswear?collection=Athleisure', '/aesthetic/sportswear'],
    ['/aesthetic/caps?collection=Beanies+%26+Headwear', '/aesthetic/caps?collection=Caps+%26+Headwear'],
    ['/aesthetic/caps?collection=Caps+%26+Snapbacks', '/aesthetic/caps?collection=Caps+%26+Headwear'],
    ['/aesthetic/shirts?collection=Flannel+%26+Check+Shirts', '/aesthetic/shirts?collection=Overshirts+%26+Flannels'],
    ['/aesthetic/shirts?collection=Overshirts', '/aesthetic/shirts?collection=Overshirts+%26+Flannels'],
    ['/aesthetic/jeans?collection=Straight-Fit+Jeans', '/aesthetic/jeans?collection=Relaxed+%26+Straight+Fit'],
    ['/aesthetic/outerwear?collection=Hoodies+%26+Winter+Jackets', '/aesthetic/outerwear?collection=Hoodies+%26+Sweatshirts'],
    // Old style ids, alias lanes and stray page numbers are handled too.
    ['/aesthetic/bottoms?style=parachute-pants', '/aesthetic/bottoms?collection=Cargo+%26+Parachute+Pants'],
    ['/aesthetic/accessories?collection=Beanies+%26+Headwear', '/aesthetic/caps?collection=Caps+%26+Headwear'],
  ];
  for (const [from, to] of cases) {
    assert.equal(permanentRedirect(`https://www.trendxee.com${from}`), `https://www.trendxee.com${to}`, from);
  }
  assert.equal(
    permanentRedirect('https://www.trendxee.com/aesthetic/bottoms?collection=parachute+pants&page=3&audience=MEN&utm_source=ig'),
    'https://www.trendxee.com/aesthetic/bottoms?collection=Cargo+%26+Parachute+Pants&audience=MEN&utm_source=ig',
  );
});

test('current subcategories and unknown collections are not redirected', () => {
  for (const path of ['/aesthetic/bottoms?collection=Cargo+%26+Parachute+Pants', '/aesthetic/sneakers?collection=Low-tops',
    '/aesthetic/bottoms?collection=Something+Else', '/aesthetic/tees?collection=Shorts']) {
    assert.equal(permanentRedirect(`https://www.trendxee.com${path}`), undefined, path);
  }
});
