import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { inspectPdf } from '../scripts/cv/career.mjs';

test('the shipped resume has a valid page budget and selectable candidate text', async () => {
  const cv = readFileSync(new URL('../assets/cv.md', import.meta.url), 'utf8');
  const name = cv.match(/^# (.+)$/m)[1];
  const result = await inspectPdf(fileURLToPath(new URL('../public/static/resume.pdf', import.meta.url)), name);
  assert.ok(result.pageCount >= 1 && result.pageCount <= 2);
  assert.ok(result.characters.every(count => count >= 80));
});
