import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import test from 'node:test';
import { compileFunction } from 'node:vm';
import ts from 'typescript';

const require = createRequire(import.meta.url);
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');

function render(componentName, content) {
  const source = readFileSync(new URL(`../src/components/${componentName}.tsx`, import.meta.url), 'utf8');
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: { jsx: ts.JsxEmit.ReactJSX, module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  });
  const module = { exports: {} };
  const load = name => name === '../content/portfolio' ? content : name === './Arrow' ? { default: () => null } : require(name);
  compileFunction(outputText, ['require', 'module', 'exports'])(load, module, module.exports);
  return renderToStaticMarkup(React.createElement(module.exports.default));
}

function project(index, overrides = {}) {
  return {
    id: `project-${index}`, number: String(index), category: 'Engineering',
    title: `Supported project ${index}`, summary: `Source-backed summary ${index}`,
    ...overrides,
  };
}

test('selected work renders sparse projects beyond the original three', () => {
  const caseStudies = Array.from({ length: 5 }, (_, index) => project(index + 1));
  const html = render('SelectedWork', { caseStudies });
  assert.equal((html.match(/<article /g) || []).length, 5);
  assert.equal((html.match(/<h1 /g) || []).length, 1);
  assert.match(html, /Supported project 5/);
  assert.match(html, /Source-backed summary 5/);
  assert.doesNotMatch(html, /System overview|Inside the engineering|phone call|undefined/);
});

test('a generic diagram renders every supplied step and handles null detail fields', () => {
  const html = render('SelectedWork', { caseStudies: [project(1, {
    system: ['Input', 'Validate', 'Process', 'Store'],
    technologies: null, details: null, contribution: null, challenge: null,
  })] });
  assert.match(html, /system-path-generic/);
  assert.equal((html.match(/class="system-step"/g) || []).length, 4);
  assert.match(html, /<strong>Store<\/strong>/);
  assert.doesNotMatch(html, /undefined|Telephony|Inside the engineering|More selected work/);
});

test('single contribution remains visible without a fabricated challenge', () => {
  const html = render('SelectedWork', { caseStudies: [project(1, {
    contribution: 'Built the supplied feature.', challenge: null, system: [], details: [],
  })] });
  assert.match(html, /contribution-single/);
  assert.match(html, /Built the supplied feature\./);
  assert.doesNotMatch(html, /System overview|Inside the engineering/);
});

test('hero labels come from project data with a title fallback', () => {
  const profile = {
    role: 'Engineer', current: 'Current work', headline: 'Build', headlineAccent: 'Useful tools',
    intro: 'Source-backed introduction', resume: '/static/resume.pdf', focus: 'Engineering',
  };
  const html = render('Hero', {
    portfolio: { profile },
    caseStudies: [project(1, { shortLabel: 'Short label' }), ...Array.from({ length: 10 }, (_, i) => project(i + 2))],
  });
  assert.match(html, /Short label/);
  assert.match(html, /Supported project 11/);
  assert.match(html, /<span>11<\/span>/);
  assert.doesNotMatch(html, /undefined|011|Voice agents/);
});
