# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Hiring managers and recruiters evaluating Daniel Yu for engineering roles. They need to understand his expertise, assess his contributions, review his résumé, and decide whether to invite him to an interview.

## Product Purpose

Daniel Yu's personal engineering portfolio presents selected work, experience, education, and technical strengths. A successful visit leads to an interview conversation.

## Positioning

Software engineering focused on production conversational AI, full-stack development, and cloud infrastructure. The existing work connects real-time voice agents, AI workflow authoring and execution, and applied machine learning to concrete engineering contributions. Preserve this positioning and the existing factual content, as confirmed by Daniel.

## Operating Context

Visitors browse a single-page portfolio, inspect case-study disclosures, review professional experience and background, open the résumé PDF, and use email or professional-profile links to follow up. The site identifies Daniel as currently at eGain; employment details remain maintained content rather than permanent assumptions.

## Capabilities and Constraints

- Static React and TypeScript site built with Vite; no contact backend.
- Native anchor navigation connects Work, Experience, About, and Contact.
- `assets/cv.md` is the publicly tracked master source for facts. Codex prepares derived website copy in `src/content/portfolio.json` and a general Software Engineering / AI resume payload from it. Preserve factual accuracy across both outputs.
- Portable Node 26/npm commands configure career-ops, synchronize content, optionally publish, and watch local CV saves. Career-ops receives a managed, gitignored CV snapshot; CV edits target the Portfolio master.
- Career-ops' current template and renderer generate the English, US Letter résumé with a strict two-page limit at `public/static/resume.pdf`. Validate source coverage, titles, dates, facts, ATS structure, and selectable text before replacing outputs. After résumé edits, visually inspect both pages as documented in README.md.
- Generation and publication operate on a consistent CV hash. Stale or failed runs preserve successful outputs. Publication commits only enumerated CV artifacts on `main` and uses the existing push-to-deploy setup.
- Selected-work content can add supported new projects within the existing design. Sparse entries omit unsupported engineering detail and diagrams.
- Contact is through email, LinkedIn, and GitHub; the résumé is available at `/static/resume.pdf`.
- Existing keyboard-accessible disclosures, skip navigation, and reduced-motion support are implementation commitments to preserve.
- A one-time LinkedIn Featured link points to the stable portfolio résumé URL; uploaded LinkedIn documents remain separate copies.

## Brand Commitments

Preserve Daniel Yu's identity, production AI/full-stack positioning, and existing factual content. The published website identity is `danielyu.app`. Future work must not introduce unsupported accomplishments or change factual copy without confirmation.

## Evidence on Hand

- `assets/cv.md`: canonical work, education, projects, and skills supplied by Daniel.
- `src/content/portfolio.json`: derived profile, case studies, professional experience, education, and skills. Existing case-study subjects are real-time voice agents, AI workflow authoring and execution, and ASSISTments educational feedback.
- `public/static/resume.pdf`: downloadable résumé, generated from the master CV through career-ops.
- `public/images/avatar.jpg`: existing portrait.
- `public/images/`: existing identity, preview, and technology assets; asset presence alone does not require displaying them.
- Numerical results in the content are existing supplied claims; init did not independently validate them. Preserve their meaning and scope rather than inventing or expanding results, testimonials, or proof.

## Product Principles

- Help hiring managers and recruiters assess engineering fit and reach an interview decision.
- Explain concrete contributions and engineering challenges using the supplied work.
- Keep the portfolio and résumé factually consistent through their shared content source.
- Keep work, résumé, and contact information easy to reach across device sizes and input methods.
- Preserve factual truth; leave unsupported claims and unconfirmed product requirements out of future work.
