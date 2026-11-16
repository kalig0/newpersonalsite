import { readFileSync, writeFileSync, mkdirSync, copyFileSync, existsSync } from 'node:fs';
import { join, basename } from 'node:path';
import { pathToFileURL } from 'node:url';
import { randomUUID } from 'node:crypto';
import { spawnSync } from 'node:child_process';

const careerModule = (config, name) => import(pathToFileURL(join(config.careerOpsRoot, name)).href);
function execute(config, args, env) {
  const result = spawnSync(process.execPath, args, { cwd: config.careerOpsRoot, env, encoding: 'utf8', timeout: 180000, maxBuffer: 8 * 1024 * 1024 });
  if (result.error || result.status !== 0) throw new Error(`career-ops ${basename(args[0])} failed: ${result.error?.message || result.stderr || result.stdout}`);
  return result.stdout;
}

export async function validateContent(config, { bundle, cvText, cvPath }) {
  const titles = await careerModule(config, 'cv-title-check.mjs');
  const structure = await careerModule(config, 'verify-cv-structure.mjs');
  const facts = await careerModule(config, 'verify-cv-facts.mjs');
  const schema = await careerModule(config, 'lib/cv-payload-schema.mjs');
  const sourceJobs = titles.parseCvExperience(cvText);
  const experienceSection = cvText.split(/^## (?:Work )?Experience\s*$/m)[1]?.split(/^## /m)[0] || '';
  const expectedJobs = (experienceSection.match(/^### /gm) || []).length;
  if (!expectedJobs || sourceJobs.length !== expectedJobs) throw new Error('Master CV experience headings are unsupported or incompletely parsed. Use company heading, bold job title, then plain dates.');
  const payloadCheck = schema.validatePayload(bundle.resume, 'html');
  if (payloadCheck.errors.length || payloadCheck.warnings.length) throw new Error(`Resume payload validation failed: ${[...payloadCheck.errors, ...payloadCheck.warnings].join('; ')}`);
  const findings = {};
  for (const [name, payload] of [['resume', bundle.resume], ['website', { experience: bundle.portfolio.experience.map(job => ({ ...job, dates: job.date })) }]]) {
    const result = titles.checkTitles(sourceJobs, titles.parseTailoredExperience(payload));
    if (['mismatches', 'ambiguous', 'unmatchedTailored', 'unmatchedCv'].some(key => result[key].length) || result.matched.length !== sourceJobs.length) {
      throw new Error(`${name} employer/title/date coverage failed: ${JSON.stringify(result)}`);
    }
    const order = structure.verifyStructure(payload, cvText);
    if (order.verdict !== 'pass') throw new Error(`${name} chronological structure failed: ${JSON.stringify(order)}`);
    findings[name] = { titles: result, structure: order };
  }
  if (bundle.resume.lang !== 'en' || bundle.resume.page_format !== 'letter') throw new Error('Public resume must use English and US Letter.');
  if (bundle.portfolio.profile.resume !== '/static/resume.pdf') throw new Error('The public resume URL must remain /static/resume.pdf.');
  const sourceName = cvText.match(/^#\s+(.+)$/m)?.[1]?.trim();
  if (bundle.resume.candidate.name !== sourceName || bundle.portfolio.profile.name !== sourceName) throw new Error('Candidate name must match the master CV.');
  const ids = bundle.portfolio.caseStudies.map(study => study.id);
  if (new Set(ids).size !== ids.length || ids.some(id => !/^[a-z][a-z0-9-]*$/.test(id))) throw new Error('Case-study IDs must be unique, stable lowercase slugs.');
  const stringify = value => typeof value === 'string' ? value : Array.isArray(value) ? value.map(stringify).join('\n') : value && typeof value === 'object' ? Object.values(value).map(stringify).join('\n') : '';
  const siteFacts = { profile: bundle.portfolio.profile, caseStudies: bundle.portfolio.caseStudies.map(({ number: _number, ...study }) => study), experience: bundle.portfolio.experience, education: bundle.portfolio.education, skills: bundle.portfolio.skills };
  const factConfig = join(config.portfolioRoot, 'scripts/cv/fact-rules.json');
  const result = facts.verifyFacts(stringify(siteFacts), { sourcePaths: [cvPath], configPath: factConfig });
  if (result.verdict !== 'pass') throw new Error(`Website factual validation failed: ${JSON.stringify(result)}`);
  findings.website.facts = result;
  return findings;
}

export async function inspectPdf(pdfPath, expectedName) {
  const { getDocument } = await import('pdfjs-dist/legacy/build/pdf.mjs');
  const task = getDocument({ data: new Uint8Array(readFileSync(pdfPath)), isEvalSupported: false, useSystemFonts: true });
  const document = await task.promise;
  try {
    if (document.numPages < 1 || document.numPages > 2) throw new Error(`Resume must have one or two pages; got ${document.numPages}.`);
    const pages = [];
    for (let number = 1; number <= document.numPages; number++) {
      const page = await document.getPage(number);
      const text = (await page.getTextContent()).items.map(item => item.str || '').join(' ');
      if (text.replace(/\s/g, '').length < 80) throw new Error(`Resume page ${number} has no meaningful selectable text.`);
      pages.push(text);
    }
    if (!pages.join(' ').replace(/\s/g, '').includes(expectedName.replace(/\s/g, ''))) throw new Error('Candidate name is missing from extracted PDF text.');
    return { pageCount: document.numPages, characters: pages.map(page => page.length) };
  } finally { await task.destroy(); }
}

export async function renderAndValidate(config, { bundle, cvText, runDir }) {
  mkdirSync(runDir, { recursive: true });
  const cvPath = join(runDir, 'source-cv.md');
  writeFileSync(cvPath, cvText);
  const validation = await validateContent(config, { bundle, cvText, cvPath });
  // A per-run data workspace prevents a concurrent CV edit or private job data
  // from changing what career-ops validates while rendering this version.
  const careerRun = join(config.careerDataRoot || config.careerOpsRoot, 'output', 'portfolio-general', randomUUID());
  mkdirSync(join(careerRun, 'config'), { recursive: true });
  writeFileSync(join(careerRun, 'cv.md'), cvText);
  writeFileSync(join(careerRun, 'config/profile.yml'), 'page_format: letter\ncv:\n  template: standard\n');
  const factRules = readFileSync(join(config.portfolioRoot, 'scripts/cv/fact-rules.json'));
  writeFileSync(join(careerRun, 'config/cv-facts.json'), factRules);
  const payloadPath = join(careerRun, 'resume.json');
  const htmlPath = join(careerRun, 'resume.html');
  const pdfPath = join(careerRun, 'resume.pdf');
  writeFileSync(payloadPath, JSON.stringify(bundle.resume, null, 2) + '\n');
  const templates = await careerModule(config, 'cv-templates.mjs');
  const template = templates.resolveTemplate('cv', undefined, { profilePath: join(config.careerDataRoot || config.careerOpsRoot, 'config/profile.yml') });
  const env = { ...process.env, CAREER_OPS_ROOT: careerRun, CAREER_OPS_DATA_DIR: careerRun, CAREER_OPS_PROFILE: join(careerRun, 'config/profile.yml'), CAREER_OPS_TRACKER: join(careerRun, 'applications.md') };
  execute(config, [join(config.careerOpsRoot, 'build-cv-html.mjs'), payloadPath, htmlPath, template], env);
  const html = readFileSync(htmlPath, 'utf8');
  const facts = await careerModule(config, 'verify-cv-facts.mjs');
  const factResult = facts.verifyFacts(html, { sourcePaths: [cvPath], configPath: join(config.portfolioRoot, 'scripts/cv/fact-rules.json') });
  if (factResult.verdict !== 'pass') throw new Error(`Resume factual validation failed: ${JSON.stringify(factResult)}`);
  const ats = await careerModule(config, 'verify-ats.mjs');
  const atsResult = ats.auditAts(html);
  if (!ats.isPass(atsResult, 70)) throw new Error(`Resume ATS validation failed: ${JSON.stringify(atsResult)}`);
  execute(config, [join(config.careerOpsRoot, 'generate-pdf.mjs'), htmlPath, pdfPath, '--format=letter', '--max-pages=2', '--strict-pages'], env);
  if (!existsSync(pdfPath)) throw new Error('career-ops did not create the resume PDF.');
  const pdfResult = await inspectPdf(pdfPath, bundle.resume.candidate.name);
  const stagedPdf = join(runDir, 'resume.pdf');
  const portfolioPath = join(runDir, 'portfolio.json');
  copyFileSync(pdfPath, stagedPdf);
  copyFileSync(htmlPath, join(runDir, 'resume.html'));
  writeFileSync(portfolioPath, JSON.stringify(bundle.portfolio, null, 2) + '\n');
  Object.assign(validation, { resumeFacts: factResult, ats: atsResult, pdf: pdfResult, careerRun, template });
  writeFileSync(join(runDir, 'validation.json'), JSON.stringify(validation, null, 2) + '\n');
  return { pdfPath: stagedPdf, portfolioPath, validation };
}
