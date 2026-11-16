# Portfolio CV workflow

For CV updates, edit `assets/cv.md`; it is the publicly tracked source for Daniel's
facts. Keep experience headings compatible with career-ops: company/location
heading, bold job title, then dates. Preserve supplied claims and exact titles.

After a CV edit, run `npm run cv:sync -- --publish` to refresh and publish website
copy and the public resume, or let an already-running `npm run cv:watch` handle
the save. This workflow is authorized to publish validated CV updates. Use
`npm run cv:sync` when the user explicitly requests local-only generation.

Use `npm run cv:setup -- --career-ops-root <path>` on a new computer, then
`npm run cv:setup -- --verify` to validate real generation before publication.
Read README.md
for setup failures, snapshot conflicts, publishing requirements, and visual QA.
Machine-specific configuration and logs stay gitignored.

Treat website data and the career-ops CV snapshot as derived output. Reconcile
unexpected snapshot edits into the master before syncing. Generate user-facing
facts from the master CV; existing portfolio prose provides structure and style.

Keep the existing design, accessibility, stable resume URL, and job-search data
boundaries. After changing the pipeline, run `npm run test:cv` and the frontend
checks listed in package.json.
