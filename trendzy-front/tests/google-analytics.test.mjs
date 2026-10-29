import { readFile } from 'node:fs/promises';
import { runInNewContext } from 'node:vm';
import assert from 'node:assert/strict';
import test from 'node:test';
import ts from 'typescript';

const source = await readFile(new URL('../src/lib/google-analytics.ts', import.meta.url), 'utf8');
const code = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext } }).outputText;
const { GOOGLE_ANALYTICS_ID, googleAnalyticsBootstrap } = await import(`data:text/javascript;base64,${Buffer.from(code).toString('base64')}`);
function boot(hostname, preference) {
  const scope = { location: { hostname }, localStorage: { getItem: () => preference } };
  scope.window = scope;
  runInNewContext(googleAnalyticsBootstrap, scope);
  return scope;
}

test('the root tag configures the supplied GA4 property once', () => {
  const page = boot('www.trendxee.com', null);
  assert.equal(GOOGLE_ANALYTICS_ID, 'G-6RWGTJR8LM');
  assert.equal(page[`ga-disable-${GOOGLE_ANALYTICS_ID}`], false);
  const commands = page.dataLayer.map(args => Array.from(args));
  assert.equal(commands.length, 2);
  assert.equal(commands[0][0], 'js');
  assert.equal(commands[1][0], 'config');
  assert.equal(commands[1][1], GOOGLE_ANALYTICS_ID);
  assert.equal(commands[1][2].allow_google_signals, false);
  assert.equal(commands[1][2].allow_ad_personalization_signals, false);
});

test('development traffic and the existing analytics opt-out stay disabled', () => {
  for (const host of ['localhost', '127.0.0.1', 'preview.example.com']) {
    assert.equal(boot(host, null)[`ga-disable-${GOOGLE_ANALYTICS_ID}`], true);
  }
  assert.equal(boot('trendxee.com', 'off')[`ga-disable-${GOOGLE_ANALYTICS_ID}`], true);
  assert.equal(boot('trendxee.com', null)[`ga-disable-${GOOGLE_ANALYTICS_ID}`], false);
});
