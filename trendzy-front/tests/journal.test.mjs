import { readFile } from 'node:fs/promises';
import test from 'node:test';
import assert from 'node:assert/strict';
import ts from 'typescript';

const source = await readFile(new URL('../src/content/journal.ts', import.meta.url), 'utf8');
const { outputText } = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } });
const { journalArticles, findJournalArticle, readingMinutes, journalDate } = await import(`data:text/javascript;base64,${Buffer.from(outputText).toString('base64')}`);

test('published stories have permanent unique URLs and navigable section anchors', () => {
  assert.equal(new Set(journalArticles.map(a => a.slug)).size, journalArticles.length);
  for (const article of journalArticles) {
    assert.match(article.slug, /^[a-z0-9]+(?:-[a-z0-9]+)*$/);
    assert.ok(article.title && article.excerpt && article.author && article.introduction);
    assert.equal(new Set(article.sections.map(s => s.id)).size, article.sections.length);
    assert.ok(article.sections.every(s => /^[a-z0-9-]+$/.test(s.id) && s.paragraphs.length));
    assert.ok(readingMinutes(article) >= 1);
    assert.equal(findJournalArticle(article.slug), article);
  }
});

test('unknown URLs are not silently replaced with a different article', () => {
  assert.equal(findJournalArticle('does-not-exist'), undefined);
  assert.equal(findJournalArticle('__proto__'), undefined);
  assert.equal(findJournalArticle('../why-we-built-trendxee'), undefined);
});

test('publication date is stable in India regardless of execution timezone', () => {
  assert.equal(journalDate('2026-10-27'), '27 Oct 2026');
});
