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
