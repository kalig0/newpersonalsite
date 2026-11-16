import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { validateContent } from '../scripts/cv/career.mjs';

const cvText = '# Candidate\n\n## Experience\n\n### Acme — Remote\n**Engineer**\nJan 2025 - Present\n\n- Built a source-backed tool.\n';

function fixture(t, overrides = {}) {
  const portfolioRoot = mkdtempSync(join(tmpdir(), 'portfolio-cv-career-'));
  const careerOpsRoot = join(portfolioRoot, 'career-ops');
  mkdirSync(join(careerOpsRoot, 'lib'), { recursive: true });
  mkdirSync(join(portfolioRoot, 'scripts/cv'), { recursive: true });
  t.after(() => rmSync(portfolioRoot, { recursive: true, force: true }));
  writeFileSync(join(portfolioRoot, 'scripts/cv/fact-rules.json'), '{}');
  writeFileSync(join(careerOpsRoot, 'cv-title-check.mjs'), `
    export function parseCvExperience(text) {
      return [...text.matchAll(/^### (.+?) — .+\\n\\*\\*(.+?)\\*\\*\\n([^\\n]+)/gm)]
        .map(([,company,title,dates])=>({company,title,dates}));
    }
    export function parseTailoredExperience(payload) {
      if (!Array.isArray(payload.experience)) throw new Error('Missing experience');
      return payload.experience.map(({company,role,dates})=>({company,title:role,dates}));
    }
    export function checkTitles(source, target) {
      const matched=[],mismatches=[],unmatchedTailored=[];
      for (const item of target) {
        const original=source.find(s=>s.company===item.company && s.dates===item.dates);
        if(!original) unmatchedTailored.push(item);
        else if(original.title!==item.title) mismatches.push(item);
        else matched.push(item);
      }
      return {matched,mismatches,ambiguous:[],unmatchedTailored,
        unmatchedCv:source.filter(s=>!target.some(t=>t.company===s.company && t.dates===s.dates))};
    }
  `);
  writeFileSync(join(careerOpsRoot, 'verify-cv-structure.mjs'), `
    export const verifyStructure=()=>(${JSON.stringify(overrides.structure || { verdict: 'pass', orderViolations: [], descriptorViolations: [] })});
  `);
  writeFileSync(join(careerOpsRoot, 'verify-cv-facts.mjs'), `
    export const verifyFacts=()=>(${JSON.stringify(overrides.facts || { verdict: 'pass' })});
  `);
  writeFileSync(join(careerOpsRoot, 'lib/cv-payload-schema.mjs'), `
    export const validatePayload=()=>(${JSON.stringify(overrides.schema || { errors: [], warnings: [] })});
  `);
  const cvPath = join(portfolioRoot, 'source-cv.md');
  writeFileSync(cvPath, cvText);
  const bundle = {
    portfolio: {
      profile: { name: 'Candidate', resume: '/static/resume.pdf' },
      experience: [{ company: 'Acme', role: 'Engineer', date: 'Jan 2025 - Present' }],
      caseStudies: [], education: [], skills: [],
    },
    resume: {
      lang: 'en', page_format: 'letter', candidate: { name: 'Candidate' },
      experience: [{ company: 'Acme', role: 'Engineer', dates: 'Jan 2025 - Present' }],
    },
  };
  return { config: { portfolioRoot, careerOpsRoot }, bundle, cvText, cvPath };
}

test('adapter requires covered title/date matches in both website and resume', async t => {
  const data = fixture(t);
  const result = await validateContent(data.config, data);
  assert.equal(result.resume.titles.matched.length, 1);
  assert.equal(result.website.titles.matched.length, 1);
  assert.equal(result.website.facts.verdict, 'pass');
});

test('adapter rejects a title mismatch even when the validator returns a completed result', async t => {
  const data = fixture(t);
  data.bundle.portfolio.experience[0].role = 'Senior Engineer';
  await assert.rejects(validateContent(data.config, data), /website employer\/title\/date coverage failed/);
});

test('adapter rejects an omitted job instead of accepting partial coverage', async t => {
  const data = fixture(t);
  data.bundle.resume.experience = [];
  await assert.rejects(validateContent(data.config, data), /resume employer\/title\/date coverage failed/);
});

test('adapter rejects incomplete source parsing and zero-job false passes', async t => {
  const data = fixture(t);
  data.cvText += '\n### Broken company heading\nNo bold job title\n';
  await assert.rejects(validateContent(data.config, data), /unsupported or incompletely parsed/);
  data.cvText = '# Candidate\n## Experience\nNo parseable jobs.';
  await assert.rejects(validateContent(data.config, data), /unsupported or incompletely parsed/);
});

test('adapter blocks warning-only structure and fact findings', async t => {
  const order = fixture(t, { structure: { verdict: 'warn', orderViolations: ['reordered'], descriptorViolations: [] } });
  await assert.rejects(validateContent(order.config, order), /chronological structure failed/);
  const facts = fixture(t, { facts: { verdict: 'warn', warnings: ['unverified'] } });
  await assert.rejects(validateContent(facts.config, facts), /Website factual validation failed/);
});

test('adapter rejects schema warnings that could silently omit resume content', async t => {
  const data = fixture(t, { schema: { errors: [], warnings: ['educations is unknown'] } });
  await assert.rejects(validateContent(data.config, data), /Resume payload validation failed/);
});

test('adapter preserves the public URL, identity, and page format', async t => {
  const url = fixture(t);
  url.bundle.portfolio.profile.resume = 'https://unrelated.example/resume.pdf';
  await assert.rejects(validateContent(url.config, url), /public resume URL/);
  const name = fixture(t);
  name.bundle.resume.candidate.name = 'Other Candidate';
  await assert.rejects(validateContent(name.config, name), /name must match/);
  const format = fixture(t);
  format.bundle.resume.page_format = 'a4';
  await assert.rejects(validateContent(format.config, format), /English and US Letter/);
});

test('adapter rejects duplicate or unsafe case-study IDs', async t => {
  const duplicate = fixture(t);
  duplicate.bundle.portfolio.caseStudies = [{ id: 'project' }, { id: 'project' }];
  await assert.rejects(validateContent(duplicate.config, duplicate), /IDs must be unique/);
  const unsafe = fixture(t);
  unsafe.bundle.portfolio.caseStudies = [{ id: 'project\" onclick=bad' }];
  await assert.rejects(validateContent(unsafe.config, unsafe), /IDs must be unique/);
});

test('adapter accepts all documented steps supported by the generic diagram UI', async t => {
  const data = fixture(t);
  data.bundle.portfolio.caseStudies = [{ id: 'new-project', system: ['Input', 'Validate', 'Process', 'Store'] }];
  await validateContent(data.config, data);
});
